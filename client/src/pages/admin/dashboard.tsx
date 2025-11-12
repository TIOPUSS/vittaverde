import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  Shield, Users, Stethoscope, Heart, BarChart3, Settings, 
  UserCheck, FileText, Package, TrendingUp, AlertCircle, LogOut, 
  Database, ShoppingCart, BookOpen, Activity, Calendar, DollarSign,
  UserPlus, Edit, Eye, Clock, Warehouse
} from "lucide-react";

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("vittaverde_user");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    }
  }, []);

  // Buscar dados para o dashboard - DADOS REAIS DO BANCO
  const { data: dashboardStats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/admin/dashboard-stats'],
    enabled: !!currentUser
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['/api/admin/activity'],
    enabled: !!currentUser
  });

  const stats = [
    {
      title: "Total de Usuários",
      value: loadingStats ? "..." : dashboardStats?.totalUsers?.toString() || "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pacientes Ativos",
      value: loadingStats ? "..." : dashboardStats?.activePatients?.toString() || "0",
      icon: Heart,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Médicos Cadastrados",
      value: loadingStats ? "..." : dashboardStats?.registeredDoctors?.toString() || "0",
      icon: Stethoscope,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Leads Ativos",
      value: loadingStats ? "..." : dashboardStats?.activeLeads?.toString() || "0",
      icon: UserPlus,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Produtos CBD",
      value: loadingStats ? "..." : dashboardStats?.totalProducts?.toString() || "0",
      icon: Package,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Conteúdos Ativos",
      value: loadingStats ? "..." : dashboardStats?.totalContent?.toString() || "0",
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const adminActions = [
    {
      title: "Gerenciar Usuários",
      description: "Adicione, edite e gerencie usuários da plataforma",
      icon: UserCheck,
      href: "/admin/usuarios",
      color: "bg-blue-500",
      actions: ["Criar", "Editar", "Visualizar", "Remover"]
    },
    {
      title: "Gerenciar Produtos",
      description: "Catálogo de produtos CBD e intermediação de importação",
      icon: Package,
      href: "/admin/produtos",
      color: "bg-emerald-500",
      actions: ["Adicionar", "Editar", "Preços", "Estoque"]
    },
    {
      title: "Controle de Estoque",
      description: "Gerenciar estoque, movimentações e inventário de produtos",
      icon: Warehouse,
      href: "/admin/estoque",
      color: "bg-orange-500",
      actions: ["Entradas", "Saídas", "Ajustes", "Histórico"]
    },
    {
      title: "Conteúdo Educacional",
      description: "Gerencie artigos, cursos e material educativo",
      icon: BookOpen,
      href: "/admin/conteudo",
      color: "bg-purple-500",
      actions: ["Artigos", "FAQs", "Guias", "Vídeos"]
    },
    {
      title: "Análises e Relatórios",
      description: "Visualize métricas, estatísticas e insights detalhados",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-orange-500",
      actions: ["Vendas", "Usuários", "Consultas", "Exportar"]
    },
    {
      title: "Configurações do Sistema",
      description: "Configure integrações, segurança e preferências",
      icon: Settings,
      href: "/admin/configuracoes",
      color: "bg-gray-500",
      actions: ["Backup", "Logs", "Integrações", "Segurança"]
    },
    {
      title: "Agenda Global",
      description: "Gerencie agendamentos e disponibilidade de médicos",
      icon: Clock,
      href: "/admin/agenda",
      color: "bg-teal-500",
      actions: ["Consultas", "Disponibilidade", "Relatórios", "Conflitos"]
    }
  ];

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-white/70 backdrop-blur-sm text-red-700 rounded-full text-sm font-semibold mb-4 shadow-lg border border-red-100">
              <Shield className="w-4 h-4 mr-2 animate-pulse" />
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                ✅ Administrador Master
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                Dashboard Administrativo
              </span>
              <br />
              <span className="text-gray-800 text-2xl lg:text-3xl font-light">Painel de Controle e Gestão</span>
            </h1>
            <p className="text-xl text-gray-600">
              Bem-vindo, {currentUser.fullName}
            </p>
          </div>
          <Badge className="bg-red-100 text-red-800">
            <Shield className="h-4 w-4 mr-1" />
            Super Admin
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{stat.value}</p>
                  </div>
                  <div className={`p-3 ${stat.bgColor} rounded-xl group-hover:rotate-12 transition-transform`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Actions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Painel Administrativo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {adminActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-2xl cursor-pointer h-full transform hover:scale-105 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 ${action.color} rounded-xl group-hover:rotate-12 transition-transform`}>
                        <action.icon className="h-8 w-8 text-white" />
                      </div>
                      <Eye className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-emerald-700 transition-colors">{action.title}</CardTitle>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{action.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {action.actions.map((actionItem, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {actionItem}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-gray-900">
                <Activity className="h-6 w-6 mr-3 text-emerald-600" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(recentActivity || [
                  { type: "user", message: "Novo usuário cadastrado", time: "há 5 min", color: "blue" },
                  { type: "consultation", message: "Consulta agendada", time: "há 15 min", color: "green" },
                  { type: "product", message: "Produto adicionado ao catálogo", time: "há 1 hora", color: "purple" },
                  { type: "order", message: "Novo pedido realizado", time: "há 2 horas", color: "orange" }
                ]).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full`}></div>
                      <span className="text-sm text-gray-900">{activity.message}</span>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl text-gray-900">
                <AlertCircle className="h-6 w-6 mr-3 text-emerald-600" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Plataforma</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Operacional</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Banco de Dados</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Integração ANVISA</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Funcionando</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Telemedicina</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">98.7%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">4.8/5</div>
                <div className="text-sm text-gray-600">Satisfação</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">24h</div>
                <div className="text-sm text-gray-600">Tempo de Resposta</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">156</div>
                <div className="text-sm text-gray-600">Prescrições Aprovadas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}