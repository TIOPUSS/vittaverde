import { db } from "../db";
import { users, clients, orders, affiliateTracking } from "../../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export class AffiliateService {
  
  async generateAffiliateCode(fullName: string, userId: string, customCode?: string): Promise<string> {
    let code: string;
    
    if (!customCode) {
      const namePart = fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 6);
      
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      code = `${namePart}${randomPart}`;
    } else {
      code = customCode
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
    }
    
    const existing = await db.select().from(users).where(eq(users.affiliateCode, code)).limit(1);
    
    if (existing.length > 0) {
      if (customCode) {
        throw new Error(`Código personalizado "${customCode}" já está em uso. Escolha outro.`);
      }
      return this.generateAffiliateCode(fullName, userId);
    }
    
    return code;
  }

  async enableExternalVendor(userId: string, commissionRate?: number, customCode?: string): Promise<{ affiliateCode: string; affiliateLink: string }> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user || user.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    // Use correct domain based on environment with proper protocol
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://vittaverde.com' 
      : (process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
          : 'http://localhost:5000');

    if (user[0].affiliateCode) {
      console.log(`[VENDOR] Retornando código existente: ${user[0].affiliateCode}, Link: ${baseUrl}/${user[0].affiliateCode.toLowerCase()}`);
      return {
        affiliateCode: user[0].affiliateCode,
        affiliateLink: `${baseUrl}/${user[0].affiliateCode.toLowerCase()}`
      };
    }

    const affiliateCode = await this.generateAffiliateCode(user[0].fullName, userId, customCode);
    
    await db
      .update(users)
      .set({
        isExternalVendor: true,
        affiliateCode,
        commissionRate: commissionRate?.toString() || "0.10",
      })
      .where(eq(users.id, userId));
    
    console.log(`[VENDOR] Novo vendedor criado: ${affiliateCode}, Link: ${baseUrl}/${affiliateCode.toLowerCase()}`);
    
    return {
      affiliateCode,
      affiliateLink: `${baseUrl}/${affiliateCode.toLowerCase()}`
    };
  }

  async disableExternalVendor(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isExternalVendor: false,
      })
      .where(eq(users.id, userId));
  }

  async trackClick(affiliateCode: string, ipAddress?: string, userAgent?: string, referrer?: string): Promise<void> {
    const vendor = await db
      .select()
      .from(users)
      .where(and(
        eq(users.affiliateCode, affiliateCode),
        eq(users.isExternalVendor, true)
      ))
      .limit(1);

    if (!vendor || vendor.length === 0) {
      console.log(`Código de afiliado inválido: ${affiliateCode}`);
      return;
    }

    await db.insert(affiliateTracking).values({
      affiliateVendorId: vendor[0].id,
      eventType: "click",
      ipAddress,
      userAgent,
      referrer,
    });
  }

  async trackRegistration(affiliateCode: string, clientId: string): Promise<void> {
    const vendor = await db
      .select()
      .from(users)
      .where(and(
        eq(users.affiliateCode, affiliateCode),
        eq(users.isExternalVendor, true)
      ))
      .limit(1);

    if (!vendor || vendor.length === 0) {
      console.log(`Código de afiliado inválido para registro: ${affiliateCode}`);
      return;
    }

    await db.insert(affiliateTracking).values({
      affiliateVendorId: vendor[0].id,
      eventType: "registration",
      clientId,
    });

    await db
      .update(clients)
      .set({
        affiliateVendorId: vendor[0].id,
      })
      .where(eq(clients.id, clientId));
  }

  async trackPurchase(clientId: string, orderId: string, orderValue: number): Promise<void> {
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client || client.length === 0 || !client[0].affiliateVendorId) {
      return;
    }

    const vendor = await db
      .select()
      .from(users)
      .where(eq(users.id, client[0].affiliateVendorId))
      .limit(1);

    if (!vendor || vendor.length === 0) {
      return;
    }

    const commissionRate = parseFloat(vendor[0].commissionRate || "0.10");
    const commissionValue = orderValue * commissionRate;

    await db.insert(affiliateTracking).values({
      affiliateVendorId: vendor[0].id,
      eventType: "purchase",
      clientId,
      orderId,
      orderValue: orderValue.toString(),
      commissionValue: commissionValue.toString(),
    });

    await db
      .update(orders)
      .set({
        affiliateVendorId: vendor[0].id,
      })
      .where(eq(orders.id, orderId));
  }

  async getVendorMetrics(vendorId: string) {
    const clicks = await db
      .select({ count: sql<number>`count(*)` })
      .from(affiliateTracking)
      .where(and(
        eq(affiliateTracking.affiliateVendorId, vendorId),
        eq(affiliateTracking.eventType, "click")
      ));

    const registrations = await db
      .select({ count: sql<number>`count(*)` })
      .from(affiliateTracking)
      .where(and(
        eq(affiliateTracking.affiliateVendorId, vendorId),
        eq(affiliateTracking.eventType, "registration")
      ));

    const purchases = await db
      .select({ 
        count: sql<number>`count(*)`,
        totalRevenue: sql<number>`COALESCE(SUM(CAST(order_value AS DECIMAL)), 0)`,
        totalCommission: sql<number>`COALESCE(SUM(CAST(commission_value AS DECIMAL)), 0)`
      })
      .from(affiliateTracking)
      .where(and(
        eq(affiliateTracking.affiliateVendorId, vendorId),
        eq(affiliateTracking.eventType, "purchase")
      ));

    const recentActivity = await db
      .select()
      .from(affiliateTracking)
      .where(eq(affiliateTracking.affiliateVendorId, vendorId))
      .orderBy(desc(affiliateTracking.createdAt))
      .limit(10);

    return {
      clicks: Number(clicks[0]?.count || 0),
      registrations: Number(registrations[0]?.count || 0),
      purchases: Number(purchases[0]?.count || 0),
      totalRevenue: Number(purchases[0]?.totalRevenue || 0),
      totalCommission: Number(purchases[0]?.totalCommission || 0),
      conversionRate: Number(clicks[0]?.count || 0) > 0 
        ? (Number(registrations[0]?.count || 0) / Number(clicks[0]?.count || 0)) * 100 
        : 0,
      recentActivity,
    };
  }

  async getAllVendors() {
    const vendors = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        affiliateCode: users.affiliateCode,
        commissionRate: users.commissionRate,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isExternalVendor, true))
      .orderBy(desc(users.createdAt));

    const vendorsWithMetrics = await Promise.all(
      vendors.map(async (vendor) => {
        const metrics = await this.getVendorMetrics(vendor.id);
        
        // Use correct domain based on environment with proper protocol
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://vittaverde.com' 
          : (process.env.REPLIT_DEV_DOMAIN 
              ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
              : 'http://localhost:5000');
        
        return {
          ...vendor,
          affiliateLink: `${baseUrl}/${vendor.affiliateCode?.toLowerCase()}`,
          metrics,
        };
      })
    );

    return vendorsWithMetrics;
  }

  async getVendorByAffiliateCode(affiliateCode: string) {
    const vendor = await db
      .select()
      .from(users)
      .where(and(
        eq(users.affiliateCode, affiliateCode),
        eq(users.isExternalVendor, true)
      ))
      .limit(1);

    return vendor[0] || null;
  }
}

export const affiliateService = new AffiliateService();
