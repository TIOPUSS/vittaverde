import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Trash2, Plus, Minus, ArrowRight, CreditCard, Package2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function CarrinhoPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { cart, removeFromCart, updateQuantity, total, itemCount } = useCart();

  // Block access for vendors
  useEffect(() => {
    if (user?.role === 'vendor') {
      toast({
        title: "❌ Acesso Negado",
        description: "Vendedores externos não podem fazer compras",
        variant: "destructive",
      });
      setLocation('/vendedor');
    }
  }, [user]);

  const checkoutMutation = useMutation({
    mutationFn: async (items: Array<{ productId: string; quantity: number }>) => {
      const response = await fetch("/api/yampi-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error("Erro ao criar checkout");
      return response.json();
    },
    onSuccess: (data: any) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao finalizar compra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "⚠️ Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar",
        variant: "destructive",
      });
      return;
    }

    const items = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    checkoutMutation.mutate(items);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl mb-32 lg:mb-0">
        {/* DESKTOP HEADER */}
        <div className="hidden lg:block mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 blur-3xl -z-10" />
          <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl border border-white/20 shadow-2xl p-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl">
                <ShoppingCart className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Carrinho de Compras
                  </h1>
                  <span className="bg-green-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                    {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <p className="text-gray-600 text-lg">
                  Finalize sua compra com segurança através da YAMPI
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE HEADER */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/loja')}
              className="p-2 hover:bg-gray-100 rounded-lg -ml-2"
              data-testid="button-back-to-shop"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Meu Carrinho</h1>
              <p className="text-xs text-gray-500">{itemCount} {itemCount === 1 ? 'produto' : 'produtos'}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* DESKTOP VERSION */}
          <div className="lg:col-span-2 hidden lg:block">
            <Card className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur border-b border-white/20">
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-green-600" />
                  Seus Produtos
                </CardTitle>
                <CardDescription>
                  Revise os produtos antes de finalizar a compra
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-300/20 to-gray-400/20 blur-3xl" />
                      <ShoppingCart className="h-24 w-24 mx-auto mb-6 text-gray-300 relative" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Carrinho vazio</h3>
                    <p className="text-gray-500 mb-6">Adicione produtos para começar suas compras</p>
                    <Button
                      onClick={() => setLocation('/loja')}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      data-testid="button-go-to-shop"
                    >
                      Ir para a Loja
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="group relative backdrop-blur-xl bg-white/50 border-2 border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-xl transition-all duration-300"
                        data-testid={`cart-item-${item.productId}`}
                      >
                        <div className="flex gap-4">
                          {item.imageUrl && (
                            <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h4>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                  {item.category}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.productId)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                data-testid={`button-remove-${item.productId}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 bg-white border-2 border-gray-300 rounded-xl px-3 py-2 shadow-sm">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                                  data-testid={`button-decrease-${item.productId}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold text-gray-900 min-w-[3rem] text-center text-lg">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                                  data-testid={`button-increase-${item.productId}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                                <p className="text-2xl font-bold text-green-600">
                                  R$ {(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* MOBILE VERSION - Ultra Clean */}
          <div className="lg:hidden w-full">
            {cart.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <ShoppingCart className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Carrinho vazio</h3>
                <p className="text-sm text-gray-500 mb-6 px-4">
                  Adicione produtos para começar
                </p>
                <Button
                  onClick={() => setLocation('/loja')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                  data-testid="button-go-to-shop-mobile"
                >
                  Explorar Produtos
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-3"
                    data-testid={`cart-item-${item.productId}`}
                  >
                    <div className="flex gap-3 mb-3">
                      {item.imageUrl && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-gray-900">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-gray-400">
                              ({item.quantity}x R$ {item.price.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 bg-gray-50 rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="h-8 w-8 p-0 hover:bg-gray-200"
                          data-testid={`button-decrease-${item.productId}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-gray-900 min-w-[2.5rem] text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="h-8 w-8 p-0 hover:bg-gray-200"
                          data-testid={`button-increase-${item.productId}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:bg-red-50 text-sm font-medium"
                        data-testid={`button-remove-${item.productId}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DESKTOP SIDEBAR */}
          <div className="space-y-6 lg:block hidden">
            <Card className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-2xl sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur border-b border-white/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frete</span>
                    <span className="text-sm text-green-600 font-medium">Calculado no checkout</span>
                  </div>
                  
                  <div className="border-t-2 border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-semibold text-gray-700">Total</span>
                      <span className="text-3xl font-bold text-green-600">
                        R$ {total.toFixed(2)}
                      </span>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={checkoutMutation.isPending || cart.length === 0}
                      className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                      data-testid="button-checkout"
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-5 w-5" />
                          Finalizar Compra
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500 mt-3">
                      🔒 Pagamento seguro processado pela YAMPI
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-50/80 to-cyan-50/80 border border-blue-200/50 shadow-xl">
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-3">
                    <div className="text-2xl">✅</div>
                    <div>
                      <p className="font-semibold mb-1">Pagamento seguro</p>
                      <p className="text-xs text-gray-600">Processamento via YAMPI com criptografia</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-2xl">💳</div>
                    <div>
                      <p className="font-semibold mb-1">Múltiplas formas de pagamento</p>
                      <p className="text-xs text-gray-600">Pix, Cartão de Crédito e Boleto</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-2xl">📦</div>
                    <div>
                      <p className="font-semibold mb-1">Frete calculado automaticamente</p>
                      <p className="text-xs text-gray-600">Via Envia.com no checkout</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM BAR - Fixed, Clean, Professional */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] safe-area-inset-bottom">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Total</p>
                <p className="text-2xl font-bold text-gray-900">R$ {total.toFixed(2)}</p>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
                className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-base font-bold shadow-lg rounded-xl"
                data-testid="button-checkout-mobile"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando
                  </>
                ) : (
                  <>
                    Finalizar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-500 pb-1">
              <ShieldCheck className="h-3 w-3 text-green-600" />
              <span>Compra 100% segura • Pix, Cartão, Boleto</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Hidden on mobile when cart has items */}
      <div className={cart.length > 0 ? "hidden lg:block" : ""}>
        <Footer />
      </div>
    </div>
  );
}
