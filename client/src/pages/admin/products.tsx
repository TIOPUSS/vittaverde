import { useState, useEffect } from "react";
import { Link } from "wouter";
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
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { SimpleImageUploader } from "@/components/SimpleImageUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, Plus, Edit, Trash2, Search, Filter, 
  DollarSign, Shield, Eye, EyeOff, CheckCircle, AlertCircle, Upload
} from "lucide-react";

// Product form schema
const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  category: z.enum(["oil", "gummies", "cream", "cosmetic", "topical", "clothing"]),
  concentration: z.string().min(1, "Concentração é obrigatória"),
  volume: z.string().optional(),
  origin: z.string().default("International"),
  price: z.number().min(0.01, "Preço deve ser maior que zero"),
  imageUrl: z.string().optional(),
  indications: z.array(z.string()).optional(),
  contraindications: z.string().optional(),
  sideEffects: z.string().optional(),
  dosageInstructions: z.string().optional(),
  anvisaRequired: z.boolean().default(true),
  prescriptionRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
  
  // Checkout field - optional, if not set uses global checkout
  checkoutUrl: z.string().url("URL inválida").optional().or(z.literal('')),
  
  // Stock fields
  stockQuantity: z.number().min(0, "Quantidade em estoque não pode ser negativa").default(0),
  supplier: z.string().optional(),
  brand: z.string().optional(),
  thc: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

const categoryLabels = {
  oil: "Óleos",
  gummies: "Gomas",
  cream: "Cremes",
  cosmetic: "Cosméticos",
  topical: "Tópicos",
  clothing: "Vestuário"
};

const indicationOptions = [
  "Ansiedade e Depressão",
  "Autismo",
  "Psicoses",
  "Distúrbios do Sono",
  "Dores Crônicas",
  "Fibromialgia",
  "Doenças Intestinais",
  "Dores relacionadas ao Câncer",
  "Artrites e Artroses",
  "Doenças Associadas a Menstruação",
  "Mal de Parkinson",
  "Alzheimer",
  "Neuropatias Dermatites",
  "Esclerose Múltipla",
  "Doenças Inflamatórias"
];

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedIndications, setSelectedIndications] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Form for new/edit products
  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "oil",
      concentration: "",
      volume: "",
      origin: "International",
      price: 0,
      imageUrl: "",
      contraindications: "",
      sideEffects: "",
      dosageInstructions: "",
      anvisaRequired: true,
      prescriptionRequired: true,
      isActive: true,
      checkoutUrl: "",
      stockQuantity: 0,
      supplier: "",
      brand: "",
      thc: "",
    },
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductForm & { indications: string[] }) => {
      return await apiRequest("/api/products", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Produto criado!",
        description: "O produto foi adicionado ao catálogo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowNewProductDialog(false);
      form.reset();
      setSelectedIndications([]);
    },
    onError: () => {
      toast({
        title: "Erro ao criar produto",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductForm & { indications: string[] } }) => {
      return await apiRequest(`/api/products/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Produto atualizado!",
        description: "As informações do produto foram atualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      form.reset();
      setSelectedIndications([]);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/products/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Produto removido!",
        description: "O produto foi removido do catálogo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: () => {
      toast({
        title: "Erro ao remover",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductForm) => {
    const productData = { ...data, indications: selectedIndications };
    
    if (editingProduct) {
      console.log("📝 FRONTEND - Editando produto ID:", editingProduct.id);
      console.log("📝 FRONTEND - Dados do formulário:", data);
      console.log("📝 FRONTEND - Dados completos a enviar:", productData);
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      console.log("📝 FRONTEND - Criando novo produto");
      console.log("📝 FRONTEND - Dados:", productData);
      createProductMutation.mutate(productData);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setSelectedIndications(product.indications || []);
    form.reset({
      name: product.name,
      description: product.description || "",
      category: product.category,
      concentration: product.concentration,
      volume: product.volume || "",
      origin: product.origin || "International",
      price: parseFloat(product.price),
      imageUrl: product.imageUrl || "",
      contraindications: product.contraindications || "",
      sideEffects: product.sideEffects || "",
      dosageInstructions: product.dosageInstructions || "",
      anvisaRequired: product.anvisaRequired,
      prescriptionRequired: product.prescriptionRequired,
      isActive: product.isActive,
      stockQuantity: product.stockQuantity || 0,
      supplier: product.supplier || "",
      brand: product.brand || "",
      thc: product.thc || "",
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleIndicationToggle = (indication: string) => {
    setSelectedIndications(prev => 
      prev.includes(indication) 
        ? prev.filter(i => i !== indication)
        : [...prev, indication]
    );
  };

  // Use API data or show loading state
  const productsList = Array.isArray(products) ? products : [];

  // Filter products
  const filteredProducts = productsList.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && product.isActive) ||
                         (filterStatus === "inactive" && !product.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: productsList.length,
    active: productsList.filter((p: any) => p.isActive).length,
    categories: Object.keys(categoryLabels).length,
    avgPrice: productsList.length > 0 
      ? (productsList.reduce((sum: number, p: any) => sum + parseFloat(p.price), 0) / productsList.length).toFixed(2)
      : "0.00",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Elementos Decorativos */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-green-200/40 to-emerald-200/40 rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-gradient-to-r from-teal-200/30 to-green-200/30 rounded-full opacity-50 animate-bounce"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-r from-emerald-300/20 to-green-300/20 rounded-full animate-float"></div>
      
      <Navbar />
      
      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Gerenciar Produtos
              </span>
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              Administre o catálogo de produtos <strong className="text-green-600">CBD VittaVerde</strong>
            </p>
            <div className="flex items-center mt-4">
              <Link href="/admin">
                <Button 
                  variant="outline" 
                  className="border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 font-semibold mr-4"
                >
                  ← Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
          
          <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                data-testid="button-new-product"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-green-100 shadow-2xl">
              <DialogHeader className="pb-6 border-b-2 border-green-100">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </DialogTitle>
                <p className="text-gray-600 mt-2">Preencha as informações do produto <strong className="text-green-600">CBD</strong></p>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Nome do Produto</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Óleo CBD 10mg/ml" 
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                              {...field} 
                              data-testid="input-product-name" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Categoria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium">
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(categoryLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição detalhada do produto" 
                            className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400 min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="concentration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Concentração</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: 10mg/ml" 
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                              {...field} 
                              data-testid="input-concentration" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="volume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Volume</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: 30ml" 
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Preço (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="Ex: 180.00" 
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-price"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="checkoutUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">
                          🔗 Link de Checkout (Opcional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://checkout.yampi.com.br/seu-produto ou https://buy.stripe.com/..." 
                            className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-blue-50/30 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                            {...field} 
                            data-testid="input-checkout-url"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">
                          💡 <strong>Se não preencher, usa o checkout global.</strong> Cole aqui o link específico de checkout deste produto (Yampi, Stripe, etc.)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">Origem</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Canadá, Estados Unidos, Uruguay" 
                            className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Indications */}
                  <div>
                    <FormLabel className="text-base font-bold text-gray-700">Indicações</FormLabel>
                    <div className="grid md:grid-cols-2 gap-3 mt-3">
                      {indicationOptions.map((indication) => (
                        <div key={indication} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={indication}
                            checked={selectedIndications.includes(indication)}
                            onChange={() => handleIndicationToggle(indication)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={indication} className="text-sm">{indication}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="dosageInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">Instruções de Dosagem</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Como usar o produto" 
                            className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400 min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="contraindications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Contraindicações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Quando não usar" 
                              className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400 min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sideEffects"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Efeitos Colaterais</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Possíveis efeitos colaterais" 
                              className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400 min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">Imagem do Produto</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <SimpleImageUploader
                              currentImageUrl={field.value}
                              onImageUploaded={(imageUrl) => field.onChange(imageUrl)}
                              className="w-full"
                            />
                            {field.value && (
                              <Input 
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder="URL da imagem"
                                className="text-sm border-gray-200 focus:border-green-500"
                              />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Stock Control Section */}
                  <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 rounded-2xl border border-blue-200/50">
                    <h3 className="font-semibold text-slate-800 flex items-center text-base mb-4">
                      <Package className="h-4 w-4 text-blue-600 mr-2" />
                      Controle de Estoque
                    </h3>
                    
                    <div className="grid md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="stockQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-gray-700">QTD</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="0"
                                placeholder="0"
                                className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-white font-medium"
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-stock-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="thc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-gray-700">THC</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: 0,3%" 
                                className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-white font-medium"
                                {...field}
                                data-testid="input-thc"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="supplier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-gray-700">Fornecedor</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nome do fornecedor" 
                                className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-white font-medium"
                                {...field}
                                data-testid="input-supplier"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-gray-700">Marca</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Marca do produto" 
                                className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-white font-medium"
                                {...field}
                                data-testid="input-brand"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="anvisaRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>ANVISA Obrigatória</FormLabel>
                            <p className="text-sm text-gray-500">Requer autorização ANVISA</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="prescriptionRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Receita Obrigatória</FormLabel>
                            <p className="text-sm text-gray-500">Requer receita médica</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Produto Ativo</FormLabel>
                            <p className="text-sm text-gray-500">Visível no catálogo</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 font-semibold"
                      onClick={() => {
                        setShowNewProductDialog(false);
                        setEditingProduct(null);
                        form.reset();
                        setSelectedIndications([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                      disabled={createProductMutation.isPending || updateProductMutation.isPending}
                      data-testid="button-submit-product"
                    >
                      {editingProduct ? "Atualizar" : "Criar"} Produto
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Total de Produtos</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{stats.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl group-hover:rotate-12 transition-transform">
                  <Package className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Produtos Ativos</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{stats.active}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-hover:rotate-12 transition-transform">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Categorias</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{stats.categories}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl group-hover:rotate-12 transition-transform">
                  <Filter className="h-8 w-8 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Preço Médio</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">R$ {stats.avgPrice}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-lime-100 to-lime-200 rounded-xl group-hover:rotate-12 transition-transform">
                  <DollarSign className="h-8 w-8 text-lime-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-xl border border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-gray-900">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mr-4">
                <Search className="h-6 w-6 text-green-600" />
              </div>
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Pesquisar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-48 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando produtos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product: any) => (
              <Card key={product.id} className="relative bg-white/95 backdrop-blur-sm shadow-xl border border-green-100 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all"
                        onClick={() => {
                          handleEditProduct(product);
                          setShowNewProductDialog(true);
                        }}
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all"
                        onClick={() => handleDeleteProduct(product.id)}
                        data-testid={`button-delete-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Product Image */}
                  {product.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Categoria:</span> {categoryLabels[product.category as keyof typeof categoryLabels]}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Concentração:</span> {product.concentration}
                    </p>
                    {product.volume && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Volume:</span> {product.volume}
                      </p>
                    )}
                    {product.supplier && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Fornecedor:</span> {product.supplier}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-green-600">
                      R$ {parseFloat(product.price).toFixed(2)}
                    </p>
                    <div className="flex space-x-2">
                      {product.anvisaRequired && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          ANVISA
                        </Badge>
                      )}
                      {product.prescriptionRequired && (
                        <Badge variant="secondary" className="text-xs">
                          Receita
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {product.indications && product.indications.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Indicações:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.indications.slice(0, 2).map((indication: string) => (
                          <Badge key={indication} variant="outline" className="text-xs">
                            {indication}
                          </Badge>
                        ))}
                        {product.indications.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.indications.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
            <p className="text-gray-400">Ajuste os filtros ou crie um novo produto</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}