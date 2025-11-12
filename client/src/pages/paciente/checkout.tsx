import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, AlertCircle, ExternalLink, ArrowRight, Settings } from "lucide-react";

export default function CheckoutPage() {
  const [, params] = useRoute("/paciente/checkout/:productId");
  const [, setLocation] = useLocation();
  const productId = params?.productId;
  const [redirecting, setRedirecting] = useState(false);

  // Get checkout configuration
  const { data: checkoutConfig, isLoading: configLoading, isError: configError } = useQuery<{
    checkoutUrl: string;
    gatewayType: string;
  }>({
    queryKey: ["/api/public/checkout-config"],
    retry: false,
  });

  // Get product details
  const { data: productsData, isLoading: productsLoading } = useQuery<{
    products: any[];
  }>({
    queryKey: ["/api/patient/products"],
    retry: false,
  });

  const product = productsData?.products?.find((p) => p.id === productId);

  useEffect(() => {
    // Priority: Product's own checkout URL > Global checkout URL
    if (product && !redirecting) {
      const checkoutUrl = product.checkoutUrl || checkoutConfig?.checkoutUrl;
      
      if (checkoutUrl) {
        console.log('[CHECKOUT] Redirecting to:', checkoutUrl, 'Source:', product.checkoutUrl ? 'Product' : 'Global');
        setRedirecting(true);
        
        // Build checkout URL with product information
        // Append product ID to the checkout URL
        const finalUrl = checkoutUrl.includes('?') 
          ? `${checkoutUrl}&product_id=${productId}&product_name=${encodeURIComponent(product.name)}&price=${product.price}`
          : `${checkoutUrl}?product_id=${productId}&product_name=${encodeURIComponent(product.name)}&price=${product.price}`;
        
        // Redirect to external checkout
        setTimeout(() => {
          window.location.href = finalUrl;
        }, 1000); // Small delay to show loading state
      } else {
        console.log('[CHECKOUT] No checkout URL configured - product:', !!product.checkoutUrl, 'global:', !!checkoutConfig?.checkoutUrl);
      }
    }
  }, [checkoutConfig, product, productId, redirecting]);

  const isLoading = configLoading || productsLoading;
  
  // Determine if checkout is configured
  const hasCheckoutConfigured = !configError && !!checkoutConfig?.checkoutUrl;
  
  console.log('[CHECKOUT DEBUG] isLoading:', isLoading, 'hasCheckoutConfigured:', hasCheckoutConfigured, 'redirecting:', redirecting, 'product:', !!product);

  // 1. Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-xl text-gray-600">Carregando checkout...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 2. Show redirecting state when we have checkout and are redirecting
  if (redirecting && hasCheckoutConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="max-w-lg w-full mx-4">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Redirecionando para o checkout...
              </h2>
              <p className="text-gray-600 mb-6">
                Você será redirecionado automaticamente para completar sua compra.
              </p>
              {product && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Produto:</p>
                  <p className="font-bold text-green-700">{product.name}</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    R$ {product.price}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // 3. Checkout not configured - show informative page
  console.log('[CHECKOUT] Showing "not configured" page');
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
            <AlertCircle className="h-10 w-10 text-amber-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Checkout em Configuração
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            O sistema de checkout ainda não foi configurado pelo administrador.
          </p>
        </div>

        <Card className="overflow-hidden border-0 shadow-xl">
          <CardContent className="p-8">
            {product && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                  Produto Selecionado
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <p className="text-2xl font-bold text-gray-900 mb-2">{product.name}</p>
                  <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-600">R$ {product.price}</span>
                    <span className="text-sm text-gray-500">/ unidade</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Para Administradores
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Para habilitar o checkout, acesse a página de configurações e defina o link do checkout (Stripe, Mercado Pago, PagSeguro, etc.)
                </p>
                <Button 
                  onClick={() => setLocation('/admin/configuracoes')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-go-to-settings"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Ir para Configurações
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">O que acontece após configurar?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Ao clicar em "Comprar", você será redirecionado automaticamente para o checkout configurado</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Todas as informações do produto serão enviadas (nome, preço, ID)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>O pagamento será processado de forma segura pelo gateway escolhido</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center gap-4">
              <Button 
                onClick={() => setLocation('/produtos')}
                variant="outline"
                className="border-gray-300"
                data-testid="button-back-to-store"
              >
                Voltar para Loja
              </Button>
              <Button 
                onClick={() => setLocation('/paciente/pedidos')}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
                data-testid="button-my-orders"
              >
                Ver Meus Pedidos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
