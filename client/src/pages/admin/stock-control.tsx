import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, Plus, TrendingDown, TrendingUp, AlertTriangle, 
  History, BarChart3, Edit, Search, Filter, FileText, Warehouse,
  ArrowDownCircle, ArrowUpCircle, RefreshCw, ImageIcon
} from "lucide-react";

// Types for API responses
type Product = {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  minimumStock: number;
  costPrice: string;
  supplier?: string;
  isActive: boolean;
  imageUrl?: string;
  price?: string;
  volume?: string;
};

type StockMovement = {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  movementDate: string;
  createdAt: string;
  product?: Product;
};

type StockSummary = {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
};

// Stock movement form schema
const stockMovementSchema = z.object({
  productId: z.string().min(1, "Produto é obrigatório"),
  quantity: z.number().int().min(1, "Quantidade deve ser maior que zero"),
  type: z.enum(["in", "out", "adjustment"]),
  movementDate: z.string().min(1, "Data da movimentação é obrigatória"),
  reason: z.string().min(1, "Motivo é obrigatório"),
  reference: z.string().optional(),
  notes: z.string().optional()
});

// Stock adjustment schema
const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Produto é obrigatório"),
  newQuantity: z.number().int().min(0, "Quantidade deve ser zero ou maior"),
  reason: z.string().min(1, "Motivo é obrigatório"),
  notes: z.string().optional()
});

type StockMovementForm = z.infer<typeof stockMovementSchema>;
type StockAdjustmentForm = z.infer<typeof stockAdjustmentSchema>;

const movementTypeLabels = {
  in: "Entrada",
  out: "Saída", 
  adjustment: "Ajuste"
};

const movementTypeColors = {
  in: "bg-green-100 text-green-800",
  out: "bg-red-100 text-red-800",
  adjustment: "bg-blue-100 text-blue-800"
};

const categoryColors = {
  oil: "bg-amber-100 text-amber-800",
  gummies: "bg-purple-100 text-purple-800",
  cream: "bg-blue-100 text-blue-800",
  cosmetic: "bg-pink-100 text-pink-800",
  topical: "bg-teal-100 text-teal-800"
};

export default function AdminStockControlPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Forms
  const movementForm = useForm<StockMovementForm>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      type: "in",
      movementDate: new Date().toISOString().split('T')[0],
      reason: "",
      reference: "",
      notes: ""
    }
  });

  const adjustmentForm = useForm<StockAdjustmentForm>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: "",
      newQuantity: 0,
      reason: "",
      notes: ""
    }
  });

  // Queries
  const { data: stockSummary, isLoading: summaryLoading } = useQuery<StockSummary>({
    queryKey: ["/api/stock/summary"],
    retry: false
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: false
  });

  const { data: lowStockProducts = [], isLoading: lowStockLoading } = useQuery<Product[]>({
    queryKey: ["/api/stock/low-stock"],
    retry: false
  });

  const { data: stockMovements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock/movements"],
    retry: false
  });

  const { data: productStockHistory = [], isLoading: historyLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock/history", selectedProduct],
    enabled: !!selectedProduct && activeTab === "history",
    retry: false
  });

  // Mutations
  const updateStockMutation = useMutation({
    mutationFn: async (data: StockMovementForm) => {
      return await apiRequest("/api/stock/update", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Estoque atualizado!",
        description: "A movimentação foi registrada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowMovementDialog(false);
      movementForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.message || "Falha ao atualizar estoque.",
        variant: "destructive"
      });
    }
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (data: StockAdjustmentForm) => {
      return await apiRequest("/api/stock/adjust", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Estoque ajustado!",
        description: "O ajuste foi registrado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowAdjustmentDialog(false);
      adjustmentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.message || "Falha ao ajustar estoque.",
        variant: "destructive"
      });
    }
  });

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterType === "all" ||
      (filterType === "low" && product.stockQuantity <= product.minimumStock) ||
      (filterType === "out" && product.stockQuantity === 0);
    
    return matchesSearch && matchesFilter;
  });

  const handleMovementSubmit = (data: StockMovementForm) => {
    updateStockMutation.mutate(data);
  };

  const handleAdjustmentSubmit = (data: StockAdjustmentForm) => {
    adjustStockMutation.mutate(data);
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { label: "Esgotado", color: "bg-red-100 text-red-800" };
    } else if (product.stockQuantity <= product.minimumStock) {
      return { label: "Estoque Baixo", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { label: "Em Estoque", color: "bg-green-100 text-green-800" };
    }
  };

  const exportStockReport = () => {
    try {
      // Preparar dados para exportação
      const reportData = products.map(product => ({
        'Produto': product.name,
        'Categoria': product.category,
        'Quantidade': product.stockQuantity,
        'Estoque Mínimo': product.minimumStock,
        'Preço Unitário': `R$ ${parseFloat(product.price || '0').toFixed(2)}`,
        'Valor Total': `R$ ${(product.stockQuantity * parseFloat(product.price || '0')).toFixed(2)}`,
        'Fornecedor': product.supplier || '-',
        'Status': getStockStatus(product).label
      }));

      // Converter para CSV
      const headers = Object.keys(reportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...reportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          }).join(',')
        )
      ].join('\n');

      // Criar e baixar arquivo
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_estoque_${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Relatório exportado!",
        description: `Arquivo relatorio_estoque_${date}.csv baixado com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: "Erro ao exportar!",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-10 lg:py-12">
        {/* Modern Compact Header */}
        <div className="mb-6 md:mb-8 lg:mb-10">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-3 md:p-4 rounded-2xl md:rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl">
              <Warehouse className="h-8 w-8 md:h-10 md:w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Controle de Estoque
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Gerencie inventário e movimentações de produtos</p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Ultra Modern */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8 lg:mb-10">
          <Card className="border-0 shadow-lg md:shadow-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-blue-500/50 transition-all hover:-translate-y-1 duration-300 rounded-2xl md:rounded-3xl">
            <CardContent className="p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-blue-100">Total de Produtos</p>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold mt-1 md:mt-2">
                    {stockSummary?.totalProducts || products.length}
                  </p>
                </div>
                <div className="p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Package className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg md:shadow-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-amber-500/50 transition-all hover:-translate-y-1 duration-300 rounded-2xl md:rounded-3xl">
            <CardContent className="p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-amber-100">Estoque Baixo</p>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold mt-1 md:mt-2">
                    {stockSummary?.lowStockProducts || lowStockProducts.length}
                  </p>
                </div>
                <div className="p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm">
                  <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg md:shadow-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white hover:shadow-red-500/50 transition-all hover:-translate-y-1 duration-300 rounded-2xl md:rounded-3xl">
            <CardContent className="p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-red-100">Esgotados</p>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold mt-1 md:mt-2">
                    {stockSummary?.outOfStockProducts || products.filter(p => p.stockQuantity === 0).length}
                  </p>
                </div>
                <div className="p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm">
                  <TrendingDown className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg md:shadow-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:shadow-emerald-500/50 transition-all hover:-translate-y-1 duration-300 rounded-2xl md:rounded-3xl">
            <CardContent className="p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-emerald-100">Valor Total</p>
                  <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mt-1 md:mt-2">
                    {stockSummary?.totalStockValue 
                      ? `R$ ${Number(stockSummary.totalStockValue).toLocaleString('pt-BR')}` 
                      : "R$ 0"}
                  </p>
                </div>
                <div className="p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons - Modern */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
          <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl transition-all rounded-xl px-4 md:px-6 py-3 md:py-4 text-sm md:text-base min-h-[44px]" data-testid="button-new-movement">
                <Plus className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Registrar Movimentação</DialogTitle>
              </DialogHeader>
              <Form {...movementForm}>
                <form onSubmit={movementForm.handleSubmit(handleMovementSubmit)} className="space-y-3 md:space-y-4">
                  <FormField
                    control={movementForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product">
                              <SelectValue placeholder="Selecione o produto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map(product => {
                              const selectedProd = products.find(p => p.id === field.value);
                              return (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex items-center gap-2">
                                    {product.imageUrl && (
                                      <img src={product.imageUrl} alt={product.name} className="w-6 h-6 rounded object-cover" />
                                    )}
                                    <span>{product.name}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movementForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-movement-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in">
                              <div className="flex items-center gap-2">
                                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                                Entrada
                              </div>
                            </SelectItem>
                            <SelectItem value="out">
                              <div className="flex items-center gap-2">
                                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                                Saída
                              </div>
                            </SelectItem>
                            <SelectItem value="adjustment">
                              <div className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-blue-600" />
                                Ajuste
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movementForm.control}
                    name="movementDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Movimentação</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            data-testid="input-movement-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movementForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movementForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Compra, Venda, Correção" data-testid="input-reason" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movementForm.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referência (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: NF-12345" data-testid="input-reference" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movementForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (opcional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="textarea-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 min-h-[44px] text-sm md:text-base" disabled={updateStockMutation.isPending} data-testid="button-submit-movement">
                      {updateStockMutation.isPending ? "Salvando..." : "Registrar"}
                    </Button>
                    <Button type="button" variant="outline" className="min-h-[44px] text-sm md:text-base" onClick={() => setShowMovementDialog(false)} data-testid="button-cancel-movement">
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-2 border-orange-300 hover:bg-orange-50 hover:border-orange-400 rounded-xl px-4 md:px-6 py-3 md:py-4 text-sm md:text-base shadow-md min-h-[44px]" data-testid="button-quick-adjustment">
                <RefreshCw className="h-4 w-4 mr-2" />
                Ajuste Rápido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">Ajuste Rápido de Estoque</DialogTitle>
              </DialogHeader>
              <Form {...adjustmentForm}>
                <form onSubmit={adjustmentForm.handleSubmit(handleAdjustmentSubmit)} className="space-y-3 md:space-y-4">
                  <FormField
                    control={adjustmentForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-adjustment-product">
                              <SelectValue placeholder="Selecione o produto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex items-center gap-2">
                                  {product.imageUrl && (
                                    <img src={product.imageUrl} alt={product.name} className="w-6 h-6 rounded object-cover" />
                                  )}
                                  <span>{product.name} (Atual: {product.stockQuantity})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adjustmentForm.control}
                    name="newQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Quantidade</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-new-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adjustmentForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Inventário, Correção" data-testid="input-adjustment-reason" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adjustmentForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (opcional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="textarea-adjustment-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 min-h-[44px] text-sm md:text-base" disabled={adjustStockMutation.isPending} data-testid="button-submit-adjustment">
                      {adjustStockMutation.isPending ? "Ajustando..." : "Ajustar"}
                    </Button>
                    <Button type="button" variant="outline" className="min-h-[44px] text-sm md:text-base" onClick={() => setShowAdjustmentDialog(false)} data-testid="button-cancel-adjustment">
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={exportStockReport}
            className="border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 rounded-xl px-4 md:px-6 py-3 md:py-4 text-sm md:text-base shadow-md min-h-[44px]" 
            data-testid="button-export-report"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar Relatório</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
        </div>

        {/* Tabs - Ultra Modern with Mobile Scroll */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6 lg:space-y-8">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="bg-white shadow-xl rounded-2xl p-1.5 md:p-2 inline-flex w-full sm:w-auto min-w-full sm:min-w-0 snap-x snap-mandatory">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base transition-all snap-start min-h-[44px] flex-1 sm:flex-none" data-testid="tab-overview">
                <Package className="h-4 w-4 mr-1 md:mr-2" />
                <span className="whitespace-nowrap">Produtos</span>
              </TabsTrigger>
              <TabsTrigger value="movements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base transition-all snap-start min-h-[44px] flex-1 sm:flex-none" data-testid="tab-movements">
                <History className="h-4 w-4 mr-1 md:mr-2" />
                <span className="whitespace-nowrap">Movimentações</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base transition-all snap-start min-h-[44px] flex-1 sm:flex-none" data-testid="tab-alerts">
                <AlertTriangle className="h-4 w-4 mr-1 md:mr-2" />
                <span className="whitespace-nowrap">Alertas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab - MODERN GRID VIEW */}
          <TabsContent value="overview" className="space-y-3 md:space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/70 backdrop-blur-sm min-h-[44px] text-sm md:text-base"
                  data-testid="input-search-products"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48 bg-white/70 backdrop-blur-sm min-h-[44px] text-sm md:text-base" data-testid="select-filter-type">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="out">Esgotados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="border-none shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhum produto encontrado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <Card key={product.id} className="border-0 shadow-lg md:shadow-2xl bg-white hover:shadow-orange-500/20 transition-all duration-500 overflow-hidden group hover:-translate-y-2 rounded-2xl md:rounded-3xl" data-testid={`card-product-${product.id}`}>
                      {/* Product Image */}
                      <div className="relative h-48 md:h-56 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 text-orange-300" />
                          </div>
                        )}
                        {/* Status Badge Overlay */}
                        <div className="absolute top-2 md:top-4 right-2 md:right-4">
                          <Badge className={`${status.color} shadow-lg backdrop-blur-sm text-xs md:text-sm`}>
                            {status.label}
                          </Badge>
                        </div>
                        {/* Category Badge */}
                        <div className="absolute top-2 md:top-4 left-2 md:left-4">
                          <Badge className={`${categoryColors[product.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"} shadow-lg backdrop-blur-sm text-xs md:text-sm`}>
                            {product.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Info */}
                      <CardContent className="p-3 md:p-4">
                        <h3 className="font-bold text-base md:text-lg mb-2 text-gray-900 line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </h3>
                        
                        <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                          {/* Stock Info */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm text-gray-600">Estoque:</span>
                            <span className="text-xl md:text-2xl font-bold text-gray-900" data-testid={`text-stock-${product.id}`}>
                              {product.stockQuantity}
                            </span>
                          </div>
                          
                          {/* Min Stock */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm text-gray-600">Mínimo:</span>
                            <span className="text-xs md:text-sm font-medium text-gray-700">
                              {product.minimumStock}
                            </span>
                          </div>

                          {/* Price */}
                          {product.price && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs md:text-sm text-gray-600">Preço:</span>
                              <span className="text-base md:text-lg font-semibold text-emerald-600">
                                R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}

                          {/* Supplier */}
                          {product.supplier && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs md:text-sm text-gray-600">Fornecedor:</span>
                              <span className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-[120px] md:max-w-[150px]">
                                {product.supplier}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 min-h-[44px] text-xs md:text-sm"
                            onClick={() => {
                              movementForm.setValue("productId", product.id);
                              setShowMovementDialog(true);
                            }}
                            data-testid={`button-add-stock-${product.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Movimentar</span>
                            <span className="sm:hidden">Mover</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="min-h-[44px] text-xs md:text-sm px-2 md:px-3"
                            onClick={() => {
                              setSelectedProduct(product.id);
                              setActiveTab("movements");
                            }}
                            data-testid={`button-view-history-${product.id}`}
                          >
                            <History className="h-3 w-3 md:mr-1" />
                            <span className="hidden md:inline">Histórico</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Movements Tab - Mobile Cards + Desktop Table */}
          <TabsContent value="movements" className="space-y-3 md:space-y-4">
            <Card className="border-none shadow-lg md:shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <History className="h-5 w-5" />
                  Histórico de Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                {movementsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                ) : stockMovements.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm md:text-base text-gray-600">Nenhuma movimentação registrada</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: Stacked Cards */}
                    <div className="md:hidden space-y-3">
                      {stockMovements.map((movement) => (
                        <Card key={movement.id} className="border border-gray-200 shadow-md rounded-2xl overflow-hidden" data-testid={`card-movement-${movement.id}`}>
                          <CardContent className="p-4 space-y-3">
                            {/* Header with Date and Type */}
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                              <span className="text-xs text-gray-500">
                                {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                              <Badge className={movementTypeColors[movement.type]}>
                                {movementTypeLabels[movement.type]}
                              </Badge>
                            </div>

                            {/* Product Name */}
                            <div>
                              <span className="text-xs text-gray-500 block mb-1">Produto</span>
                              <span className="font-semibold text-gray-900">{movement.product?.name || 'N/A'}</span>
                            </div>

                            {/* Quantity Change */}
                            <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3">
                              <div>
                                <span className="text-xs text-gray-500 block mb-1">Anterior</span>
                                <span className="font-semibold text-sm">{movement.previousQuantity}</span>
                              </div>
                              <div className="text-center">
                                <span className="text-xs text-gray-500 block mb-1">Qtd</span>
                                <span className={`font-bold text-sm ${
                                  movement.type === 'in' ? 'text-green-600' : 
                                  movement.type === 'out' ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                  {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}
                                  {movement.quantity}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-gray-500 block mb-1">Novo</span>
                                <span className="font-semibold text-sm">{movement.newQuantity}</span>
                              </div>
                            </div>

                            {/* Reason */}
                            <div>
                              <span className="text-xs text-gray-500 block mb-1">Motivo</span>
                              <span className="text-sm text-gray-700">{movement.reason}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop: Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Anterior</TableHead>
                            <TableHead>Novo</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stockMovements.map((movement) => (
                            <TableRow key={movement.id} data-testid={`row-movement-${movement.id}`}>
                              <TableCell className="text-sm">
                                {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell className="font-medium">
                                {movement.product?.name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge className={movementTypeColors[movement.type]}>
                                  {movementTypeLabels[movement.type]}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}
                                {movement.quantity}
                              </TableCell>
                              <TableCell>{movement.previousQuantity}</TableCell>
                              <TableCell className="font-semibold">{movement.newQuantity}</TableCell>
                              <TableCell className="text-sm text-gray-600">{movement.reason}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-3 md:space-y-4">
            <Card className="border-none shadow-lg md:shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Alertas de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                {lowStockLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : lowStockProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm md:text-base text-gray-600">Nenhum alerta de estoque</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => {
                      const isOutOfStock = product.stockQuantity === 0;
                      return (
                        <div 
                          key={product.id} 
                          className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-l-4 ${
                            isOutOfStock ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
                          }`}
                          data-testid={`alert-product-${product.id}`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {product.imageUrl && (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm md:text-base text-gray-900 truncate">{product.name}</p>
                                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                  {isOutOfStock 
                                    ? 'Produto esgotado' 
                                    : `Estoque baixo: ${product.stockQuantity} unidades (mín: ${product.minimumStock})`
                                  }
                                </p>
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 min-h-[44px] text-xs md:text-sm w-full sm:w-auto whitespace-nowrap"
                              onClick={() => {
                                movementForm.setValue("productId", product.id);
                                movementForm.setValue("type", "in");
                                setShowMovementDialog(true);
                              }}
                              data-testid={`button-restock-${product.id}`}
                            >
                              Repor Estoque
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
