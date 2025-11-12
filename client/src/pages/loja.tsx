import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SimpleFileUpload } from "@/components/SimpleFileUpload";
import { useCart } from "@/hooks/useCart";
import { 
  Search, ShoppingCart, Shield, Package, Upload, 
  ChevronRight, Star, Sparkles, Award, FileText,
  Filter, X, Check, Leaf, Calculator, FlaskConical, Database, Clock
} from "lucide-react";

export default function Loja() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [anvisaDialogOpen, setAnvisaDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Check authentication (optional - page is public but features require login)
  const { data: meData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/me'],
  });

  const user = (meData as any)?.user; // Extract user from { user: {...} }

  // Use appropriate endpoint based on user role
  const isAdmin = user?.role === 'admin';
  const isPatient = user?.role === 'patient' || user?.role === 'client';
  const isVendor = user?.role === 'vendor';
  
  // Determine which endpoint to use
  const productsEndpoint = !user 
    ? "/api/public/products"  // Public access - no login required
    : isAdmin 
      ? "/api/products"       // Admin gets full access
      : isVendor
        ? "/api/public/products" // Vendor sees catalog (no purchase)
        : "/api/patient/products"; // Patient gets personalized data
  
  const { data: productsData, isLoading } = useQuery<{
    products: any[], 
    hasUploadedPrescription: boolean,
    hasAnvisaDocument: boolean,
    canPurchase: boolean
  }>({
    queryKey: [productsEndpoint],
    enabled: true, // Always enabled, even without login
    select: (data: any) => {
      // If admin, vendor, or public endpoint, wrap products in expected format
      if ((isAdmin || isVendor || !user) && Array.isArray(data)) {
        return {
          products: data,
          hasUploadedPrescription: isAdmin ? true : isVendor ? true : false,
          hasAnvisaDocument: isAdmin ? true : isVendor ? true : false,
          canPurchase: isAdmin ? true : false // Vendor cannot purchase
        };
      }
      return data;
    }
  });

  const { data: checkoutConfigData } = useQuery<{checkoutUrl: string, gatewayType: string}>({
    queryKey: ["/api/public/checkout-config"],
  });

  const products = productsData?.products || [];
  const hasUploadedPrescription = productsData?.hasUploadedPrescription || false;
  const hasAnvisaDocument = productsData?.hasAnvisaDocument || false;
  const canPurchase = productsData?.canPurchase || false;
  const checkoutUrl = checkoutConfigData?.checkoutUrl || '/paciente/pedidos';

  const uploadPrescriptionMutation = useMutation({
    mutationFn: async (prescriptionUrl: string) => {
      const response = await apiRequest('/api/patient/prescriptions/upload', 'POST', {
        prescriptionUrl,
        notes: 'Receita enviada via loja online'
      });
      if (!response.ok) throw new Error('Failed to upload prescription');
      return response.json();
    },
    onSuccess: () => {
      // Refresh both products and user data to get updated flags
      queryClient.invalidateQueries({ queryKey: ['/api/patient/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setUploadingFile(false);
      setUploadDialogOpen(false);
      toast({
        title: "Receita enviada!",
        description: "Sua receita foi enviada e está em análise. Os preços agora estão visíveis!",
      });
    },
    onError: () => {
      setUploadingFile(false);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a receita. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handlePrescriptionUpload = (fileUrl: string) => {
    setUploadingFile(true);
    uploadPrescriptionMutation.mutate(fileUrl);
  };

  const uploadAnvisaMutation = useMutation({
    mutationFn: async (anvisaDocumentUrl: string) => {
      const response = await apiRequest('/api/patient/anvisa/upload', 'POST', {
        anvisaDocumentUrl,
        notes: 'Documento ANVISA enviado via loja online'
      });
      if (!response.ok) throw new Error('Failed to upload ANVISA document');
      return response.json();
    },
    onSuccess: () => {
      // Refresh both products and user data to get updated flags
      queryClient.invalidateQueries({ queryKey: ['/api/patient/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setUploadingFile(false);
      setAnvisaDialogOpen(false);
      toast({
        title: "Documento enviado!",
        description: "Seu documento ANVISA foi enviado e está em análise. Aguarde a aprovação para comprar!",
      });
    },
    onError: () => {
      setUploadingFile(false);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o documento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleAnvisaUpload = (fileUrl: string) => {
    setUploadingFile(true);
    uploadAnvisaMutation.mutate(fileUrl);
  };

  // Filter products
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSupplier = selectedSupplier === "all" || product.supplier === selectedSupplier;
    return matchesSearch && matchesCategory && matchesSupplier;
  });

  const categories = [
    { id: "all", name: "Todos", icon: "🌿" },
    { id: "oil", name: "Óleos", icon: "💧" },
    { id: "gummies", name: "Gomas", icon: "🍬" },
    { id: "cream", name: "Cremes", icon: "💆" },
    { id: "cosmetic", name: "Cosméticos", icon: "✨" },
  ];

  const suppliers = [
    { id: "all", name: "Todos Fornecedores" },
    { id: "LITORAL HEMP", name: "LITORAL HEMP" },
    { id: "LEVENDIS S.A", name: "LEVENDIS S.A" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Mobile-First Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
            🌿 Cannabis Lifestyle
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base">
            Produtos certificados com intermediação legal
          </p>
          
          {/* Show login button if not authenticated, or upload button if logged in without prescription */}
          {!user ? (
            <Link href="/login">
              <Button 
                className="mt-4 w-full sm:w-auto bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-4 sm:px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2" 
                data-testid="button-login-to-shop"
              >
                <Shield className="h-4 w-4" />
                Faça Login para Comprar
              </Button>
            </Link>
          ) : !hasUploadedPrescription && (
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="mt-4 w-full sm:w-auto bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-4 sm:px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2" 
                  data-testid="button-upload-prescription-header"
                >
                  <Upload className="h-4 w-4" />
                  Enviar Receita
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Enviar Receita Médica
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Envie sua receita médica para visualizar preços e comprar produtos.
                  </p>
                  <SimpleFileUpload
                    onUploadComplete={handlePrescriptionUpload}
                    accept="image/*,.pdf"
                    maxSize={10}
                    label="Receita Médica"
                    uploadType="document"
                  />
                  {uploadPrescriptionMutation.isPending && (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* ANVISA Document Upload Dialog */}
          <Dialog open={anvisaDialogOpen} onOpenChange={setAnvisaDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-emerald-600" />
                    Enviar Autorização ANVISA
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Envie sua autorização ANVISA para poder comprar produtos com canabinoides.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-900 font-medium">
                      ℹ️ Após o envio, seus documentos serão analisados pela nossa equipe. Você será notificado quando a compra for liberada.
                    </p>
                  </div>
                  
                  {/* Botão para ir à página de autorização ANVISA */}
                  <Link href="/anvisa" className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold py-3"
                      data-testid="button-ir-anvisa"
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Como Solicitar Autorização ANVISA
                    </Button>
                  </Link>
                  
                  <SimpleFileUpload
                    onUploadComplete={handleAnvisaUpload}
                    accept="image/*,.pdf"
                    maxSize={10}
                    label="Autorização ANVISA"
                    uploadType="document"
                  />
                  {uploadAnvisaMutation.isPending && (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        
        {/* Mobile Search Bar - Compact */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 focus:border-emerald-400 rounded-xl sm:rounded-2xl shadow-sm focus:shadow-md transition-all bg-white"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Mobile Category Tabs - Horizontal Scroll */}
        <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 snap-start px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
                data-testid={`button-category-${cat.id}`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Filters - Compact */}
        <div className="flex gap-2 mb-4 sm:mb-6">
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-emerald-400 bg-white"
            data-testid="select-supplier"
          >
            {suppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>{sup.name}</option>
            ))}
          </select>
          {(selectedCategory !== "all" || selectedSupplier !== "all" || searchTerm) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSupplier("all");
                setSearchTerm("");
              }}
              className="rounded-xl px-3"
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Products Grid - Mobile Optimized (2 columns) */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-2xl mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredProducts.map((product: any) => (
              <Dialog key={product.id}>
                <DialogTrigger asChild>
                  <Card 
                    className="group cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl bg-white active:scale-95 h-full flex flex-col" 
                    data-testid={`card-product-${product.id}`}
                  >
                    {/* Product Image - Square Aspect Ratio */}
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 flex-shrink-0">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Leaf className="h-12 w-12 sm:h-16 sm:w-16 text-emerald-400" />
                        </div>
                      )}
                      
                      {/* Concentration Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white/95 backdrop-blur-sm text-emerald-700 border-0 shadow-md px-2 py-0.5 text-xs font-semibold">
                          {product.concentration}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-3 sm:p-4 flex flex-col">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">
                        {product.name}
                      </h3>
                      
                      {/* Supplier - Mobile */}
                      {product.supplier && (
                        <p className="text-xs text-gray-500 truncate mb-3">
                          {product.supplier}
                        </p>
                      )}

                      {/* Price Section - Compact */}
                      <div className="mb-3 flex items-center">
                        {hasUploadedPrescription ? (
                          <div className="text-lg sm:text-xl font-bold text-emerald-600">
                            R$ {parseFloat(product.price).toFixed(2)}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded-lg text-xs font-medium border border-amber-200">
                            <Shield className="h-3 w-3" />
                            Receita
                          </div>
                        )}
                      </div>

                      <Button 
                        size="sm"
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-2 rounded-xl text-xs sm:text-sm" 
                        data-testid={`button-view-${product.id}`}
                      >
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                </DialogTrigger>

                {/* Product Details Modal - Modern Minimal Design */}
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 sm:p-0 gap-0">
                  <div className="flex flex-col">
                    {/* Product Image */}
                    {product.imageUrl && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-b px-6 py-10 sm:py-14">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full max-w-[280px] h-[240px] object-contain mx-auto drop-shadow-sm"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 sm:p-8 space-y-6">
                      {/* Title */}
                      <div>
                        <DialogTitle className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1.5 tracking-tight">
                          {product.name}
                        </DialogTitle>
                        <p className="text-sm text-gray-500 font-medium">{product.category}</p>
                      </div>

                      {/* Price Section - ONLY if has prescription */}
                      {hasUploadedPrescription && (
                        <div className="flex items-baseline gap-3 py-2">
                          <div className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
                            R$ {parseFloat(product.price).toFixed(2)}
                          </div>
                          {product.stock !== undefined && product.stock > 0 && (
                            <span className="text-sm text-gray-500 font-medium">Em estoque</span>
                          )}
                        </div>
                      )}

                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Concentração</p>
                          <p className="text-sm font-semibold text-gray-900">{product.concentration}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Volume</p>
                          <p className="text-sm font-semibold text-gray-900">{product.volume}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Origem</p>
                          <p className="text-sm font-semibold text-gray-900">{product.origin}</p>
                        </div>
                        {product.thc && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">THC</p>
                            <p className="text-sm font-semibold text-gray-900">{product.thc}</p>
                          </div>
                        )}
                      </div>

                      {/* Requirements */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                          Autorização ANVISA
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="h-3 w-3 text-blue-600" />
                          </div>
                          Receita Médica
                        </div>
                      </div>

                      {/* CTA Section - COM TRAVAS CORRETAS */}
                      <div className="pt-6 border-t">
                        {!user ? (
                          /* TRAVA 1: Não logado - precisa fazer login */
                          <div className="space-y-4">
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-5 sm:p-6 text-center shadow-sm">
                              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                                <Shield className="h-7 w-7 text-amber-600" />
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-1">
                                Login Necessário
                              </h3>
                              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                                Faça login para acessar os produtos
                              </p>
                            </div>
                            <Link href="/login">
                              <Button 
                                size="lg"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 sm:h-14 font-semibold shadow-sm"
                                data-testid="button-login-to-view-price"
                              >
                                Fazer Login
                              </Button>
                            </Link>
                          </div>
                        ) : !hasUploadedPrescription ? (
                          /* TRAVA 2: Logado mas sem receita - precisa enviar receita */
                          <div className="space-y-4">
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/60 rounded-xl p-5 sm:p-6 text-center shadow-sm">
                              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                                <FileText className="h-7 w-7 text-blue-600" />
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-1">
                                Receita Necessária
                              </h3>
                              <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                                Envie sua receita médica para visualizar preços
                              </p>
                            </div>
                            <Button 
                              onClick={() => setUploadDialogOpen(true)}
                              size="lg"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 sm:h-14 font-semibold shadow-sm"
                              data-testid="button-upload-prescription-modal"
                            >
                              <Upload className="h-5 w-5 mr-2" />
                              Enviar Receita Médica
                            </Button>
                          </div>
                        ) : isVendor ? (
                          /* Vendedor Externo - apenas visualização */
                          <div className="bg-amber-50 border border-amber-200/80 text-amber-900 font-medium py-3.5 rounded-xl text-center text-sm shadow-sm">
                            Modo Visualização - Vendedor Externo
                          </div>
                        ) : !hasAnvisaDocument ? (
                          /* TRAVA 3: Tem receita mas não tem ANVISA - precisa enviar ANVISA */
                          <div className="space-y-4">
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/60 rounded-xl p-5 sm:p-6 text-center shadow-sm">
                              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
                                <Shield className="h-7 w-7 text-violet-600" />
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-violet-900 mb-1">
                                Autorização ANVISA Necessária
                              </h3>
                              <p className="text-xs sm:text-sm text-violet-800 leading-relaxed">
                                Envie sua autorização ANVISA para comprar
                              </p>
                            </div>
                            <Button 
                              onClick={() => setAnvisaDialogOpen(true)}
                              size="lg"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 sm:h-14 shadow-sm"
                              data-testid="button-upload-anvisa-modal"
                            >
                              <Upload className="h-5 w-5 mr-2" />
                              Enviar Autorização ANVISA
                            </Button>
                          </div>
                        ) : !canPurchase ? (
                          /* TRAVA 4: Tem receita e ANVISA mas não aprovado - aguardar */
                          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/60 rounded-xl p-5 sm:p-6 text-center shadow-sm">
                            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                              <Clock className="h-7 w-7 text-amber-600" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-1">
                              Aguardando Aprovação
                            </h3>
                            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                              Seus documentos estão em análise
                            </p>
                          </div>
                        ) : (
                          /* LIBERADO: Pode comprar */
                          <Button 
                            onClick={() => {
                              addToCart(product);
                              setLocation('/carrinho');
                            }}
                            size="lg"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 sm:h-14 text-base shadow-md hover:shadow-lg transition-shadow" 
                            data-testid={`button-buy-${product.id}`}
                          >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Adicionar ao Carrinho
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou buscar por outro termo
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
