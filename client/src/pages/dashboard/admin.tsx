import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, Users, Stethoscope, Heart, BarChart3, Settings, 
  UserCheck, FileText, Package, TrendingUp, LogOut, Database, 
  Hash, Warehouse, CreditCard, DollarSign, TrendingDown,
  Search, ChevronRight, ShoppingBag, BookOpen, Calendar,
  Megaphone, MessageSquare, Globe, Layers, Grid3x3, Sparkles, Leaf
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activePatients: number;
  registeredDoctors: number;
  activeLeads: number;
  totalProducts: number;
  totalContent: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch admin stats from database
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/dashboard-stats'],
    enabled: !!user && user.role === 'admin'
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (user.role !== "admin") {
        setLocation("/login");
      }
    }
  }, [user, isLoading, setLocation]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (isLoading || statsLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const categories = [
    { id: "all", label: "Todos", icon: Grid3x3 },
    { id: "users", label: "Usuários", icon: Users },
    { id: "content", label: "Conteúdo", icon: BookOpen },
    { id: "commerce", label: "Vendas", icon: ShoppingBag },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "config", label: "Configurações", icon: Settings },
  ];

  const modules = [
    {
      title: "Universidade Médica",
      description: "Gestão de cursos e educação médica",
      icon: Database,
      href: "/medico/universidade",
      category: "content",
      gradient: "from-teal-500 to-cyan-600",
      bgGlow: "from-teal-400/20 to-cyan-400/20",
    },
    {
      title: "Centro Médico",
      description: "Dashboard e analytics médicos",
      icon: Stethoscope,
      href: "/medico/centro-medico",
      category: "analytics",
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "from-emerald-400/20 to-teal-400/20",
    },
    {
      title: "Universidade Paciente",
      description: "Conteúdo educacional para pacientes",
      icon: Heart,
      href: "/paciente/universidade",
      category: "content",
      gradient: "from-green-500 to-emerald-600",
      bgGlow: "from-green-400/20 to-emerald-400/20",
    },
    {
      title: "Universidade Vendedor",
      description: "Treinamento para equipe comercial",
      icon: TrendingUp,
      href: "/comercial/universidade",
      category: "content",
      gradient: "from-lime-500 to-green-600",
      bgGlow: "from-lime-400/20 to-green-400/20",
    },
    {
      title: "Gestão de Conteúdo",
      description: "Gerenciar conteúdo educacional e notícias",
      icon: FileText,
      href: "/admin/gestao-conteudo",
      category: "content",
      gradient: "from-cyan-500 to-teal-600",
      bgGlow: "from-cyan-400/20 to-teal-400/20",
    },
    {
      title: "Gerenciar Usuários",
      description: "Visualizar, editar e gerenciar todos os usuários",
      icon: UserCheck,
      href: "/admin/usuarios",
      category: "users",
      gradient: "from-emerald-600 to-green-700",
      bgGlow: "from-emerald-400/20 to-green-400/20",
    },
    {
      title: "Produtos CBD",
      description: "Gerenciar catálogo de produtos",
      icon: Package,
      href: "/admin/produtos",
      category: "commerce",
      gradient: "from-green-600 to-lime-600",
      bgGlow: "from-green-400/20 to-lime-400/20",
    },
    {
      title: "Controle de Estoque",
      description: "Gerenciar estoque e movimentações",
      icon: Warehouse,
      href: "/admin/estoque",
      category: "commerce",
      gradient: "from-teal-600 to-emerald-700",
      bgGlow: "from-teal-400/20 to-emerald-400/20",
    },
    {
      title: "Configuração de Checkout",
      description: "Integração YAMPI - Pagamentos",
      icon: CreditCard,
      href: "/admin/yampi-config",
      category: "config",
      gradient: "from-cyan-600 to-blue-600",
      bgGlow: "from-cyan-400/20 to-blue-400/20",
    },
    {
      title: "Financeiro",
      description: "Análise financeira e indicadores",
      icon: DollarSign,
      href: "/admin/financeiro",
      category: "analytics",
      gradient: "from-emerald-600 to-teal-700",
      bgGlow: "from-emerald-400/20 to-teal-400/20",
    },
    {
      title: "Custos",
      description: "Gestão de custos e despesas",
      icon: TrendingDown,
      href: "/admin/custos",
      category: "analytics",
      gradient: "from-lime-600 to-emerald-700",
      bgGlow: "from-lime-400/20 to-emerald-400/20",
    },
    {
      title: "CRM Comercial",
      description: "Gestão de leads e pipeline de vendas",
      icon: Megaphone,
      href: "/comercial/crm",
      category: "commerce",
      gradient: "from-green-600 to-teal-700",
      bgGlow: "from-green-400/20 to-teal-400/20",
    },
  ];

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const adminStats = [
    {
      title: "Usuários",
      value: stats?.totalUsers.toLocaleString() || "0",
      icon: Users,
    },
    {
      title: "Pacientes",
      value: stats?.activePatients.toLocaleString() || "0",
      icon: Heart,
    },
    {
      title: "Médicos",
      value: stats?.registeredDoctors.toLocaleString() || "0",
      icon: Stethoscope,
    },
    {
      title: "Leads",
      value: stats?.activeLeads.toLocaleString() || "0",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* Header - VittaVerde Style */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
              <Leaf className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700">
            Controle total da plataforma VittaVerde
          </p>
        </div>

        {/* Stats Cards - VittaVerde Glassmorphism */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {adminStats.map((stat, idx) => (
            <Card key={idx} className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all border border-emerald-200/50">
              <CardContent className="p-3 sm:p-4 lg:p-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0 shadow-md">
                    <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{stat.title}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filters - VittaVerde Style */}
        <div className="mb-6 sm:mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl blur-lg opacity-20"></div>
            <div className="relative bg-white/90 backdrop-blur-xl border border-emerald-200 rounded-2xl p-1 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Search className="ml-3 sm:ml-4 h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                <Input
                  placeholder="Buscar módulo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 bg-transparent text-gray-900 placeholder:text-gray-500 text-sm sm:text-base h-10 sm:h-12 focus-visible:ring-0"
                />
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 sm:px-6 rounded-xl mr-1 flex-shrink-0">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Buscar</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Category Filters - Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all snap-start flex-shrink-0 text-xs sm:text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white/80 backdrop-blur-xl text-gray-700 border border-emerald-200/50 hover:bg-white'
                }`}
              >
                <cat.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Modules Grid - Premium VittaVerde Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {filteredModules.map((module, idx) => (
            <Link key={idx} href={module.href}>
              <Card className="group relative border border-gray-200/50 bg-white/95 backdrop-blur-2xl shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden h-full rounded-3xl">
                {/* Animated Gradient Mesh Background */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.bgGlow}`}></div>
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${module.gradient} opacity-20 blur-3xl`}></div>
                  <div className={`absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr ${module.gradient} opacity-15 blur-2xl`}></div>
                </div>
                
                <CardContent className="p-5 sm:p-6 lg:p-7 relative z-10 flex flex-col h-full">
                  {/* Icon Container */}
                  <div className="mb-4 sm:mb-5">
                    <div className={`relative inline-flex p-4 sm:p-5 rounded-3xl bg-gradient-to-br ${module.gradient} group-hover:scale-105 transition-all duration-500 shadow-lg group-hover:shadow-2xl`}>
                      {/* Icon Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`}></div>
                      <module.icon className="relative h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 mb-4">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl mb-2 group-hover:text-emerald-600 transition-colors duration-300 leading-tight">
                      {module.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                      {module.description}
                    </p>
                  </div>

                  {/* Action CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 group-hover:border-transparent transition-colors duration-300">
                    <span className={`text-sm font-semibold bg-gradient-to-r ${module.gradient} bg-clip-text text-transparent`}>
                      Acessar módulo
                    </span>
                    <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r ${module.gradient} shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:translate-x-1`}>
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>

                {/* Subtle Border Gradient */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`}></div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredModules.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-emerald-100/50 backdrop-blur-xl rounded-full mb-4 border border-emerald-200/50">
              <Search className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum módulo encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar sua busca ou filtros
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
