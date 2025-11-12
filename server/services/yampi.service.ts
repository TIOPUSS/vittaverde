import { eq } from "drizzle-orm";
import { db, products, yampiConfig, yampiTransactions } from "../storage";

/**
 * Integração YAMPI (API v2)
 * Base: https://api.dooki.com.br/v2/{alias}/
 * Auth: headers User-Token / User-Secret-Key
 */
export class YampiService {
  private baseUrl = "https://api.dooki.com.br/v2";

  /** =============== Helpers base =============== */

  /** Busca config ativa da Yampi */
  async getActiveConfig() {
    const config = await db.query.yampiConfig.findFirst({
      where: eq(yampiConfig.isActive, true),
    });

    if (!config) {
      throw new Error("YAMPI não configurada. Configure em /admin/yampi-config");
    }
    return config;
  }

  /** Monta headers de auth */
  private getHeaders(config: any) {
    return {
      "User-Token": config.userToken,
      "User-Secret-Key": config.secretKey,
      "Content-Type": "application/json",
    };
  }

  /** Mapeia fornecedor → brand_id cadastrado na YAMPI */
  private getBrandIdBySupplier(supplier: string | null): number {
    if (!supplier) return 44990840; // AUSTRAL default
    const s = (supplier || "").toLowerCase();
    if (s.includes("litoral hemp")) return 44990840; // AUSTRAL
    if (s.includes("levendis")) return 44990841; // EXTRACTOS DEL SUR
    return 44990840;
  }

  /** Busca lista de SKUs de um produto YAMPI e retorna o primeiro ID */
  private async getProductSkus(config: any, yampiProductId: string): Promise<string | null> {
    try {
      const r = await fetch(
        `${this.baseUrl}/${config.alias}/catalog/products/${yampiProductId}/skus`,
        { method: "GET", headers: this.getHeaders(config) }
      );
      if (!r.ok) return null;
      const data = await r.json();
      const id = data?.data?.[0]?.id;
      return id ? String(id) : null;
    } catch (e) {
      console.error("[YAMPI] Erro ao buscar SKUs:", e);
      return null;
    }
  }

  /** Busca purchase_url do primeiro SKU (ou do informado) */
  private async getProductPurchaseUrl(
    config: any,
    yampiProductId: string,
    _skuId?: string | null
  ): Promise<string | null> {
    try {
      const r = await fetch(
        `${this.baseUrl}/${config.alias}/catalog/products/${yampiProductId}/skus`,
        { method: "GET", headers: this.getHeaders(config) }
      );
      if (!r.ok) return null;
      const data = await r.json();
      const url = data?.data?.[0]?.purchase_url;
      return url || null;
    } catch (e) {
      console.error("[YAMPI] Erro ao buscar purchase_url:", e);
      return null;
    }
  }

  /** Teste simples de conexão */
  async testConnection(alias: string, userToken: string, secretKey: string) {
    try {
      const r = await fetch(`${this.baseUrl}/${alias}/catalog/products?limit=1`, {
        method: "GET",
        headers: {
          "User-Token": userToken,
          "User-Secret-Key": secretKey,
          "Content-Type": "application/json",
        },
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Erro na API YAMPI: ${r.status} - ${t}`);
      }
      return { success: true, message: "Conexão bem-sucedida." };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  /** =============== Sync de produtos =============== */

  /** Cria/atualiza um produto na Yampi e salva IDs locais */
  async syncProduct(productId: string) {
    const config = await this.getActiveConfig();

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    if (!product) throw new Error("Produto não encontrado");

    const brandId = this.getBrandIdBySupplier(product.supplier || null);
    const skuCode = product.sku || `VV-${productId.slice(0, 8)}`;

    const priceCost = product.costPrice
      ? parseFloat(String(product.costPrice))
      : parseFloat(String(product.price)) * 0.5;

    // imagem absoluta
    let imageUrl = product.imageUrl || "";
    if (imageUrl && imageUrl.startsWith("/")) {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "https://vittaverde.com";
      imageUrl = `${baseUrl}${imageUrl}`;
    }

    const skuPayload: any = {
      sku: skuCode,
      title: product.name,
      price_sale: parseFloat(String(product.price)),
      price_cost: priceCost,
      blocked_sale: false,
      quantity: product.stockQuantity || 0,
      weight: 200,
      height: 10,
      width: 10,
      length: 15,
      images: imageUrl ? [{ url: imageUrl, title: product.name }] : [],
    };
    if (product.yampiSkuId) skuPayload.id = parseInt(product.yampiSkuId);

    const yampiProductPayload = {
      name: product.name,
      description: product.description || `${product.name} - ${product.category || ""}`,
      simple: true,
      active: !!product.isActive,
      searchable: true,
      brand_id: brandId,
      skus: [skuPayload],
    };

    try {
      let response: Response;

      if (product.yampiProductId) {
        // UPDATE
        response = await fetch(
          `${this.baseUrl}/${config.alias}/catalog/products/${product.yampiProductId}`,
          { method: "PUT", headers: this.getHeaders(config), body: JSON.stringify(yampiProductPayload) }
        );
      } else {
        // CREATE
        response = await fetch(
          `${this.baseUrl}/${config.alias}/catalog/products`,
          { method: "POST", headers: this.getHeaders(config), body: JSON.stringify(yampiProductPayload) }
        );
      }

      if (!response.ok) {
        const txt = await response.text();

        // Foi apagado da Yampi (404) → limpa e recria
        if (response.status === 404 && product.yampiProductId) {
          await db.update(products)
            .set({ yampiProductId: null, yampiSkuId: null, yampiPurchaseUrl: null, yampiSyncedAt: null })
            .where(eq(products.id, productId));

          const retry = await fetch(
            `${this.baseUrl}/${config.alias}/catalog/products`,
            { method: "POST", headers: this.getHeaders(config), body: JSON.stringify(yampiProductPayload) }
          );
          if (!retry.ok) {
            const t = await retry.text();
            throw new Error(`Erro ao recriar produto (${retry.status}): ${t}`);
          }

          const retryData = await retry.json();
          const newId = String(retryData?.data?.id);

          // espera 1s e pega SKU + purchase_url
          await new Promise(r => setTimeout(r, 1000));
          const skuId = await this.getProductSkus(config, newId);
          const purl = await this.getProductPurchaseUrl(config, newId, skuId);

          await db.update(products)
            .set({
              yampiProductId: newId,
              yampiSkuId: skuId,
              yampiPurchaseUrl: purl,
              yampiSyncedAt: new Date(),
            })
            .where(eq(products.id, productId));

          return {
            success: true,
            yampiProductId: Number(newId),
            yampiSkuId: skuId ? Number(skuId) : undefined,
          };
        }

        // outro erro
        let msg = txt;
        try {
          const j = JSON.parse(txt);
          msg = j.message || j.error || txt;
        } catch {}
        throw new Error(`Erro ao sincronizar produto (${response.status}): ${msg}`);
      }

      // sucesso
      const data = await response.json();
      const yId = String(data?.data?.id);

      await new Promise(r => setTimeout(r, 1000)); // Yampi indexa SKU
      let skuId = await this.getProductSkus(config, yId);
      if (!skuId) skuId = String(data?.data?.skus?.[0]?.id || "");

      const purl = await this.getProductPurchaseUrl(config, yId, skuId);

      await db.update(products)
        .set({
          yampiProductId: yId,
          yampiSkuId: skuId || null,
          yampiPurchaseUrl: purl,
          yampiSyncedAt: new Date(),
        })
        .where(eq(products.id, productId));

      return {
        success: true,
        yampiProductId: Number(yId),
        yampiSkuId: skuId ? Number(skuId) : undefined,
      };
    } catch (e: any) {
      console.error(`[YAMPI] ❌ Erro ao sincronizar "${product.name}":`, e.message);
      throw e;
    }
  }

  /** Sincroniza todos os produtos ativos */
  async syncAllProducts() {
    const config = await this.getActiveConfig();
    const list = await db.query.products.findMany({ where: eq(products.isActive, true) });

    let ok = 0, fail = 0; const errors: string[] = [];
    for (const p of list) {
      try { await this.syncProduct(p.id); ok++; }
      catch (e: any) { fail++; errors.push(`${p.name}: ${e.message}`); }
    }
    await db.update(yampiConfig)
      .set({ lastSync: new Date() })
      .where(eq(yampiConfig.id, config.id));

    return { success: ok, failed: fail, errors };
  }

  /** =============== Checkout (com quantidade) =============== */

  /**
   * Insere/ajusta quantidade na purchase_url.
   * - Se já existe querystring e já tem "quantity" ou "qty", substitui
   * - Senão, acrescenta ?quantity=N (e também qty=N por compat)
   */
  private withQuantityOnPurchaseUrl(purchaseUrl: string, quantity: number): string {
    if (!purchaseUrl || (quantity ?? 1) <= 1) return purchaseUrl;

    try {
      const url = new URL(purchaseUrl);
      // prioriza "quantity"
      url.searchParams.set("quantity", String(quantity));
      // compat opcional
      url.searchParams.set("qty", String(quantity));
      return url.toString();
    } catch {
      // se for um link relativo ou algo inesperado, faz no bruto
      if (purchaseUrl.includes("?")) {
        // remove params antigos quantity/qty (simples)
        const base = purchaseUrl
          .replace(/([?&])(quantity|qty)=\d+/gi, "$1")
          .replace(/[?&]$/, "");
        return `${base}&quantity=${quantity}&qty=${quantity}`;
      }
      return `${purchaseUrl}?quantity=${quantity}&qty=${quantity}`;
    }
  }

  /**
   * Extrai o token Yampi de uma purchase_url
   * Ex: https://seguro.seudominio.com.br/r/AABBJJ -> AABBJJ
   */
  private extractYampiToken(purchaseUrl: string): string | null {
    if (!purchaseUrl) return null;
    
    // Tenta extrair token do formato /r/TOKEN ou /r/TOKEN?params
    const match = purchaseUrl.match(/\/r\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Cria checkout:
   * - 1 item: redireciona para o purchase_url já com a quantidade aplicada (formato: TOKEN:quantidade)
   * - >1 item: combina todos os produtos em um único link (formato: TOKEN1:qty1,TOKEN2:qty2,TOKEN3:qty3)
   */
  async createCheckout(
    items: Array<{ productId: string; quantity: number }>,
    _customerData?: any
  ) {
    await this.getActiveConfig(); // valida Yampi configurada

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Items são obrigatórios");
    }

    // Busca todos os produtos e extrai tokens
    const productTokens: Array<{ token: string; quantity: number; productName: string }> = [];
    let baseUrl = '';

    for (const it of items) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, it.productId),
      });
      if (!product) throw new Error(`Produto ${it.productId} não encontrado`);
      if (!product.yampiPurchaseUrl) {
        throw new Error(`Produto "${product.name}" não possui link de compra. Sincronize primeiro.`);
      }

      const token = this.extractYampiToken(product.yampiPurchaseUrl);
      if (!token) {
        throw new Error(`Não foi possível extrair token Yampi do produto "${product.name}"`);
      }

      // Extrai base URL do primeiro produto
      if (!baseUrl) {
        const urlMatch = product.yampiPurchaseUrl.match(/(https?:\/\/[^/]+\/r\/)/);
        if (urlMatch) {
          baseUrl = urlMatch[1];
        }
      }

      productTokens.push({
        token,
        quantity: it.quantity || 1,
        productName: product.name,
      });
    }

    if (!baseUrl) {
      throw new Error('Não foi possível determinar a URL base do checkout Yampi');
    }

    // Monta o link único com todos os tokens e quantidades
    // Formato: https://seguro.seudominio.com.br/r/TOKEN1:qty1,TOKEN2:qty2,TOKEN3:qty3
    const tokensWithQty = productTokens.map(p => `${p.token}:${p.quantity}`).join(',');
    const checkoutUrl = `${baseUrl}${tokensWithQty}`;

    return { 
      checkoutUrl, 
      isSingleProduct: items.length === 1,
      isMultipleProducts: items.length > 1,
      itemsCount: items.length,
      products: productTokens.map(p => ({ name: p.productName, quantity: p.quantity }))
    };
  }

  /** =============== Webhook =============== */

  async processWebhook(webhookData: any) {
    try {
      const tx = webhookData?.data;
      if (!tx?.id) return { success: true }; // ignora payload estranho

      const existing = await db.query.yampiTransactions.findFirst({
        where: eq(yampiTransactions.yampiTransactionId, String(tx.id)),
      });

      const mapped = {
        status: this.mapYampiStatus(tx.status),
        paymentData: tx.payment_data || {},
        webhookData,
        paidAt: tx.paid_at ? new Date(tx.paid_at) : null,
        updatedAt: new Date(),
      } as any;

      if (existing) {
        await db.update(yampiTransactions).set(mapped).where(eq(yampiTransactions.id, existing.id));
      } else {
        await db.insert(yampiTransactions).values({
          yampiTransactionId: String(tx.id),
          yampiOrderId: tx.order_id ? String(tx.order_id) : null,
          status: this.mapYampiStatus(tx.status),
          paymentMethod: tx.payment_method,
          amount: tx.amount ? String(tx.amount) : "0",
          items: tx.items || [],
          customerData: tx.customer || {},
          paymentData: tx.payment_data || {},
          webhookData,
          paidAt: tx.paid_at ? new Date(tx.paid_at) : null,
        });
      }
      return { success: true };
    } catch (e) {
      console.error("Erro ao processar webhook:", e);
      throw e;
    }
  }

  private mapYampiStatus(status: string) {
    const s = (status || "").toLowerCase();
    if (["paid", "approved", "confirmed"].includes(s)) return "paid";
    if (["pending", "waiting_payment"].includes(s)) return "pending";
    if (["canceled", "refused", "refunded"].includes(s)) return "canceled";
    return "unknown";
  }
}

export const yampiService = new YampiService();
