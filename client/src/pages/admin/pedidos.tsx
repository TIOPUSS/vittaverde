import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Package, Search, TrendingUp, Clock, CheckCircle, 
  DollarSign, Eye, Edit, Truck, Download, Filter, X, Calendar
} from "lucide-react";

interface Order {
  id: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
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

export default function AdminPedidos() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingData, setTrackingData] = useState({
    trackingNumber: "",
    anvisaTrackingCode: "",
    importTrackingCode: "",
  });

  // Fetch all orders for admin
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  // Calculate dashboard stats
  const stats = {
    totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'paid').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    avgOrderValue: orders.length > 0 
      ? orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0) / orders.length 
      : 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "shipped": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "anvisa_approved": return "bg-green-100 text-green-800 border-green-200";
      case "importing": return "bg-teal-100 text-teal-800 border-teal-200";
      case "paid": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
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

  // Update tracking codes mutation
  const updateTrackingMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const response = await apiRequest(`/api/admin/orders/${orderId}/tracking`, 'PATCH', data);
      if (!response.ok) throw new Error('Failed to update tracking');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setTrackingDialogOpen(false);
      setEditingOrder(null);
      toast({
        title: "Rastreio atualizado!",
        description: "Os códigos de rastreamento foram salvos com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar os códigos de rastreamento.",
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest(`/api/admin/orders/${orderId}/status`, 'PATCH', { status });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: "Status atualizado!",
        description: "O status do pedido foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível alterar o status do pedido.",
        variant: "destructive",
      });
    },
  });

  const openTrackingDialog = (order: Order) => {
    setEditingOrder(order);
    setTrackingData({
      trackingNumber: order.trackingNumber || "",
      anvisaTrackingCode: order.anvisaTrackingCode || "",
      importTrackingCode: order.importTrackingCode || "",
    });
    setTrackingDialogOpen(true);
  };

  const handleSaveTracking = () => {
    if (!editingOrder) return;
    updateTrackingMutation.mutate({
      orderId: editingOrder.id,
      data: trackingData,
    });
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Gerenciamento de Pedidos
          </h1>
          <p className="text-gray-600">
            Visualize, gerencie e acompanhe todos os pedidos da plataforma
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Receita Total</p>
                  <p className="text-3xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total de Pedidos</p>
                  <p className="text-3xl font-bold">{stats.totalOrders}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Package className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">Pedidos Pendentes</p>
                  <p className="text-3xl font-bold">{stats.pendingOrders}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Clock className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Ticket Médio</p>
                  <p className="text-3xl font-bold">R$ {stats.avgOrderValue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por pedido, paciente ou rastreio..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-orders"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="anvisa_approved">ANVISA Aprovada</SelectItem>
                  <SelectItem value="importing">Importando</SelectItem>
                  <SelectItem value="shipped">Em Transporte</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Order Info */}
                    <div className="lg:col-span-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div className="lg:col-span-3">
                      <p className="text-sm text-gray-600 mb-1">Paciente</p>
                      <p className="font-semibold text-gray-900">{order.patientName || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{order.patientEmail || 'N/A'}</p>
                    </div>

                    {/* Products */}
                    <div className="lg:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Produtos</p>
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-900">
                          {item.quantity}x {item.productName || `ID: ${item.productId}`}
                        </p>
                      ))}
                    </div>

                    {/* Status & Amount */}
                    <div className="lg:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <Badge className={`${getStatusColor(order.status)} border mb-2`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      <p className="text-2xl font-bold text-green-600">R$ {order.totalAmount}</p>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-2 flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            data-testid={`button-details-${order.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Pedido #{order.id.slice(-8).toUpperCase()}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Paciente</p>
                                <p className="font-semibold">{order.patientName}</p>
                                <p className="text-sm text-gray-600">{order.patientEmail}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <Badge className={getStatusColor(order.status)}>
                                  {getStatusLabel(order.status)}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Produtos</p>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                    <span>{item.productName}</span>
                                    <span className="font-semibold">Qtd: {item.quantity} - R$ {item.price}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {(order.trackingNumber || order.anvisaTrackingCode || order.importTrackingCode) && (
                              <div>
                                <p className="text-sm text-gray-600 mb-2">Rastreamento</p>
                                <div className="space-y-2">
                                  {order.trackingNumber && (
                                    <div className="p-3 bg-green-50 rounded-lg">
                                      <p className="text-sm text-gray-600">Transportadora</p>
                                      <p className="font-mono font-semibold">{order.trackingNumber}</p>
                                    </div>
                                  )}
                                  {order.anvisaTrackingCode && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                      <p className="text-sm text-gray-600">ANVISA</p>
                                      <p className="font-mono font-semibold">{order.anvisaTrackingCode}</p>
                                    </div>
                                  )}
                                  {order.importTrackingCode && (
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                      <p className="text-sm text-gray-600">Importação</p>
                                      <p className="font-mono font-semibold">{order.importTrackingCode}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openTrackingDialog(order)}
                        className="w-full"
                        data-testid={`button-edit-tracking-${order.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rastreio
                      </Button>
                    </div>
                  </div>

                  {/* Tracking Info (if exists) */}
                  {(order.trackingNumber || order.anvisaTrackingCode || order.importTrackingCode) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 flex-wrap">
                      {order.trackingNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-green-600" />
                          <span className="text-gray-600">Transportadora:</span>
                          <span className="font-mono font-semibold text-gray-900">{order.trackingNumber}</span>
                        </div>
                      )}
                      {order.anvisaTrackingCode && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-600">ANVISA:</span>
                          <span className="font-mono font-semibold text-gray-900">{order.anvisaTrackingCode}</span>
                        </div>
                      )}
                      {order.importTrackingCode && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-purple-600" />
                          <span className="text-gray-600">Importação:</span>
                          <span className="font-mono font-semibold text-gray-900">{order.importTrackingCode}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchTerm || statusFilter !== "all" ? "Nenhum pedido encontrado" : "Nenhum pedido ainda"}
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca"
                  : "Os pedidos aparecerão aqui quando os pacientes começarem a comprar"
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tracking Dialog */}
        <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Códigos de Rastreamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Código de Rastreamento (Transportadora)
                </label>
                <Input
                  placeholder="Ex: BR123456789ABC"
                  value={trackingData.trackingNumber}
                  onChange={(e) => setTrackingData({ ...trackingData, trackingNumber: e.target.value })}
                  data-testid="input-tracking-number"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Código ANVISA
                </label>
                <Input
                  placeholder="Ex: ANVISA-2024-12345"
                  value={trackingData.anvisaTrackingCode}
                  onChange={(e) => setTrackingData({ ...trackingData, anvisaTrackingCode: e.target.value })}
                  data-testid="input-anvisa-code"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Código de Importação
                </label>
                <Input
                  placeholder="Ex: IMP-2024-67890"
                  value={trackingData.importTrackingCode}
                  onChange={(e) => setTrackingData({ ...trackingData, importTrackingCode: e.target.value })}
                  data-testid="input-import-code"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setTrackingDialogOpen(false)}
                data-testid="button-cancel-tracking"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTracking}
                disabled={updateTrackingMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-save-tracking"
              >
                {updateTrackingMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
