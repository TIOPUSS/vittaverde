import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Package, Search, Truck, Clock, CheckCircle,
  Eye, FileText, Calendar, Phone, Leaf, ShoppingBag, Sparkles
} from "lucide-react";

interface Order {
  id: string;
  patientId: string;
  totalAmount: string;
  status: string;
  trackingNumber?: string;
  anvisaTrackingCode?: string;
  importTrackingCode?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: string;
    productName?: string;
  }>;
}

export default function PacientePedidos() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/patient", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/orders/patient/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "shipped": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "anvisa_approved": return "bg-green-100 text-green-800 border-green-200";
      case "importing": return "bg-teal-100 text-teal-800 border-teal-200";
      case "paid": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered": return "Entregue";
      case "shipped": return "Em Transporte";
      case "anvisa_approved": return "ANVISA Aprovada";
      case "importing": return "Importando";
      case "paid": return "Pago";
      case "pending": return "Pendente";
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case "pending": return 10;
      case "paid": return 25;
      case "anvisa_approved": return 50;
      case "importing": return 75;
      case "shipped": return 90;
      case "delivered": return 100;
      case "cancelled": return 0;
      default: return 0;
    }
  };

  const getTrackingSteps = (order: Order) => {
    const steps = [
      { name: "Pedido Confirmado", completed: ["paid", "anvisa_approved", "importing", "shipped", "delivered"].includes(order.status) },
      { name: "ANVISA Submetida", completed: ["anvisa_approved", "importing", "shipped", "delivered"].includes(order.status) },
      { name: "ANVISA Aprovada", completed: ["anvisa_approved", "importing", "shipped", "delivered"].includes(order.status) },
      { name: "Importação", completed: ["importing", "shipped", "delivered"].includes(order.status) },
      { name: "Em Transporte", completed: ["shipped", "delivered"].includes(order.status) },
      { name: "Entregue", completed: ["delivered"].includes(order.status) }
    ];
    return steps;
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => 
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-200/30 to-emerald-300/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/30 to-green-300/30 rounded-full blur-3xl"></div>
      
      <Navbar />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Modern Header - Mobile Optimized */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-5 sm:py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 border border-green-200/50 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700">Meus Pedidos CBD</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Meus Pedidos
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Acompanhe o status dos seus pedidos e o processo de intermediação
          </p>
        </div>

        {/* Modern Search - Mobile Optimized */}
        <div className="mb-8 sm:mb-12 max-w-2xl mx-auto">
          <Card className="bg-white shadow-xl border-green-100">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  placeholder="Buscar pedido..."
                  className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 lg:py-6 text-sm sm:text-base border-0 bg-green-50/50 focus:bg-white focus:ring-2 focus:ring-green-500 rounded-lg sm:rounded-xl transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-orders"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const trackingSteps = getTrackingSteps(order);
              const progressValue = getStatusProgress(order.status);
              
              return (
                <div key={order.id} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Card className="relative overflow-hidden border-0 bg-white/90 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/50 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg lg:text-xl mb-2">
                          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                          <span className="text-gray-800">Pedido #{order.id.slice(-8).toUpperCase()}</span>
                          <Badge className={`${getStatusColor(order.status)} border text-xs`}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">R$ {order.totalAmount}</p>
                        <div className="flex items-center">
                          <Progress value={progressValue} className="w-20 sm:w-24 mr-2 h-2" />
                          <span className="text-xs sm:text-sm text-gray-600">{progressValue}%</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 sm:p-6">
                    {/* Products */}
                    <div className="mb-4 sm:mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center text-sm sm:text-base lg:text-lg">
                        <Leaf className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                        Produtos
                      </h3>
                      <div className="space-y-2 sm:space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-100">
                            <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1">
                              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                                <Leaf className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.productName || `Produto ID: ${item.productId}`}</p>
                                <p className="text-xs sm:text-sm text-gray-600">Qtd: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right ml-auto sm:ml-0">
                              <span className="font-bold text-green-600 text-base sm:text-lg">R$ {item.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracking Progress - Mobile Optimized */}
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-100">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base lg:text-lg">
                          <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                          Status
                        </h3>
                        {order.trackingNumber && (
                          <Badge variant="outline" className="border-green-300 text-green-700 text-xs self-start sm:self-auto">
                            {order.trackingNumber}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                        {trackingSteps.map((step, index) => (
                          <div key={index} className="text-center">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-1 sm:mb-2 flex items-center justify-center transition-all ${
                              step.completed 
                                ? 'bg-green-500 text-white shadow-lg' 
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                              {step.completed ? (
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                              ) : (
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs font-medium text-gray-900 leading-tight">{step.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracking Codes */}
                    {(order.anvisaTrackingCode || order.importTrackingCode) && (
                      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-100">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm sm:text-base lg:text-lg">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                          Códigos
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                          {order.anvisaTrackingCode && (
                            <div className="flex items-center p-3 bg-white rounded-lg border border-green-200">
                              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-700">ANVISA</p>
                                <p className="text-xs sm:text-sm text-gray-900 font-mono truncate">{order.anvisaTrackingCode}</p>
                              </div>
                            </div>
                          )}
                          {order.importTrackingCode && (
                            <div className="flex items-center p-3 bg-white rounded-lg border border-green-200">
                              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                                <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Importação</p>
                                <p className="text-xs sm:text-sm text-gray-900 font-mono truncate">{order.importTrackingCode}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-green-100">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full sm:w-auto bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 h-auto py-2.5 text-sm" 
                            data-testid={`button-details-${order.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-white">
                          <DialogHeader>
                            <DialogTitle className="text-2xl text-green-700 flex items-center">
                              <Package className="h-6 w-6 mr-2" />
                              Detalhes do Pedido #{order.id.slice(-8).toUpperCase()}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Status:</span>
                                <p className="mt-1">
                                  <Badge className={getStatusColor(order.status)}>
                                    {getStatusLabel(order.status)}
                                  </Badge>
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Total:</span>
                                <p className="text-2xl font-bold text-green-600 mt-1">R$ {order.totalAmount}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Data do Pedido:</span>
                                <p className="mt-1 text-gray-900">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Última Atualização:</span>
                                <p className="mt-1 text-gray-900">{new Date(order.updatedAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium text-gray-600">Produtos:</span>
                              <div className="mt-2 space-y-2">
                                {order.items.map((item, index) => (
                                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                                    <span className="text-gray-900">{item.productName || `Produto ID: ${item.productId}`}</span>
                                    <span className="font-medium text-green-600">Qtd: {item.quantity} - R$ {item.price}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300 h-auto py-2.5 text-sm" 
                        data-testid={`button-track-${order.id}`}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Rastrear
                      </Button>
                      
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 h-auto py-2.5 text-sm" 
                          data-testid={`button-support-${order.id}`}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Suporte
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 rounded-3xl blur-3xl"></div>
              
              <Card className="relative bg-white/80 backdrop-blur-lg border-0 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full blur-3xl opacity-50 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-100 to-green-100 rounded-full blur-3xl opacity-50 -ml-32 -mb-32"></div>
                
                <CardContent className="relative text-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                  {/* Icon - Mobile Optimized */}
                  <div className="relative inline-block mb-6 sm:mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl sm:rounded-3xl blur-xl opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl transform transition-transform hover:scale-110 duration-300">
                      <Package className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                    </div>
                  </div>
                  
                  {/* Content - Mobile Optimized */}
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                    {searchTerm ? "Nenhum pedido encontrado" : "Você ainda não fez nenhum pedido"}
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed px-2">
                    {searchTerm 
                      ? "Tente ajustar os termos de busca ou verificar a ortografia."
                      : "Quando você tiver uma prescrição médica válida, poderá fazer seus primeiros pedidos de produtos CBD."
                    }
                  </p>
                  
                  {!searchTerm && (
                    <div className="space-y-4">
                      <Button 
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 sm:px-10 py-4 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
                        onClick={() => window.location.href = '/produtos'}
                      >
                        <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                        Explorar Produtos CBD
                      </Button>
                      <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto px-4">
                        Conheça nossa linha completa de produtos CBD e comece sua jornada de bem-estar
                      </p>
                      
                      {/* Features - Mobile Optimized */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                            <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Produtos Certificados</p>
                        </div>
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700">ANVISA Aprovado</p>
                        </div>
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                            <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Rastreamento Completo</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
