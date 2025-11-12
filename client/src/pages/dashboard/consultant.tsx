import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, DollarSign, TrendingUp, FileText, Award, 
  GraduationCap, Sparkles, Activity, Target, ArrowRight,
  CheckCircle, Clock, AlertCircle, Phone, Mail, Calendar, Monitor, Smartphone
} from "lucide-react";

export default function ConsultantDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar se é mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      setLocation("/login");
    } else if (!isLoading && user && user.role !== "consultant") {
      setLocation("/login");
    }
  }, [isLoading, isLoggedIn, user, setLocation]);

  // Buscar leads do vendedor
  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
    enabled: !!user,
  });

  // Buscar consultores para pegar dados de comissão
  const { data: consultants = [] } = useQuery<any[]>({
    queryKey: ["/api/consultants"],
    enabled: !!user,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando área comercial...</p>
        </div>
      </div>
    );
  }

  // Mostrar página especial para mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full">
                <Monitor className="h-16 w-16 text-emerald-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Área Comercial
            </h1>
            
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Smartphone className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-gray-700 font-medium mb-2">
                Acesso Mobile Não Disponível
              </p>
              <p className="text-gray-600 text-sm">
                A área comercial possui funcionalidades avançadas que requerem uma tela maior.
              </p>
            </div>

            <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 text-center mb-3">
                Para acessar o CRM Comercial:
              </h3>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm">
                  Use um computador ou tablet
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm">
                  Acesse pelo navegador desktop
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm">
                  Aproveite todas as funcionalidades do CRM
                </p>
              </div>
            </div>

            <Button 
              onClick={() => setLocation("/")} 
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              data-testid="button-voltar-home"
            >
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pegar dados do consultor
  const consultant = consultants.find((c: any) => c.userId === user.id);
  const commissionRate = consultant?.commissionRate || 0;

  // Filtrar leads do consultor (usa assignedConsultantId)
  const myLeads = leads.filter((lead: any) => lead.assignedConsultantId === consultant?.id);
  
  // Calcular estatísticas
  const totalLeads = myLeads.length;
  const newLeads = myLeads.filter((l: any) => l.status === 'novo').length;
  const activeLeads = myLeads.filter((l: any) => 
    ['contato_inicial', 'aguardando_receita', 'receita_recebida', 'receita_validada', 'produtos_liberados'].includes(l.status)
  ).length;
  const closedLeads = myLeads.filter((l: any) => l.status === 'finalizado').length;
  
  // Calcular valor total e comissões
  const totalValue = myLeads
    .filter((l: any) => l.status === 'finalizado' && l.estimatedValue)
    .reduce((sum: number, l: any) => sum + parseFloat(l.estimatedValue || '0'), 0);
  
  const totalCommission = totalValue * (commissionRate / 100);
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';

  const stats = [
    {
      title: "Meus Leads",
      value: totalLeads.toString(),
      change: `${newLeads} novos`,
      icon: Sparkles,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-50",
      borderColor: "border-emerald-200"
    },
    {
      title: "Em Andamento",
      value: activeLeads.toString(),
      change: `${closedLeads} finalizados`,
      icon: Activity,
      gradient: "from-teal-500 to-cyan-600",
      bgGradient: "from-teal-50 to-cyan-50",
      borderColor: "border-teal-200"
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate}%`,
      change: `${closedLeads} vendas`,
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50",
      borderColor: "border-green-200"
    },
    {
      title: "Minhas Comissões",
      value: `R$ ${totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `Taxa: ${commissionRate}%`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
      borderColor: "border-emerald-200"
    },
  ];

  const quickActions = [
    {
      title: "CRM - Receitas",
      description: "Gerencie seus leads e acompanhe o funil de vendas",
      icon: FileText,
      href: "/comercial/crm",
      gradient: "from-emerald-500 to-green-600",
      iconColor: "text-white"
    },
    {
      title: "Universidade",
      description: "Acesse conteúdos educacionais sobre cannabis medicinal",
      icon: GraduationCap,
      href: "/comercial/universidade",
      gradient: "from-teal-500 to-cyan-600",
      iconColor: "text-white"
    },
  ];

  // Últimos leads
  const recentLeads = myLeads
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      'novo': { label: 'Novo', color: 'bg-emerald-100 text-emerald-800', icon: Sparkles },
      'contato_inicial': { label: 'Contato Inicial', color: 'bg-blue-100 text-blue-800', icon: Phone },
      'aguardando_receita': { label: 'Aguardando Receita', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'receita_recebida': { label: 'Receita Recebida', color: 'bg-purple-100 text-purple-800', icon: FileText },
      'receita_validada': { label: 'Receita Validada', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
      'produtos_liberados': { label: 'Produtos Liberados', color: 'bg-teal-100 text-teal-800', icon: Award },
      'finalizado': { label: 'Finalizado', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };
    return statusMap[status] || statusMap['novo'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-emerald-200/40 to-green-200/40 rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-gradient-to-r from-teal-200/30 to-emerald-200/30 rounded-full opacity-50 animate-bounce"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-r from-green-300/20 to-teal-300/20 rounded-full animate-float"></div>
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                  Área Comercial
                </span>
              </h1>
              <p className="text-lg text-gray-600">
                Bem-vindo(a), <span className="font-semibold text-emerald-700">{user.fullName}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">Consultor(a) VittaVerde Cannabis Medicinal</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className={`bg-white/95 backdrop-blur-sm shadow-xl ${stat.borderColor} hover:shadow-2xl transition-all group cursor-pointer hover:scale-105`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2 uppercase">{stat.title}</p>
                    <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500 font-semibold mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl group-hover:rotate-12 transition-transform shadow-lg`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8 bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-emerald-100">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent flex items-center">
            <Target className="h-6 w-6 mr-2 text-emerald-600" />
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="bg-white/90 backdrop-blur-sm border-2 border-emerald-200 hover:shadow-xl transition-all duration-500 cursor-pointer h-full transform hover:scale-[1.02] hover:-translate-y-1 group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-transparent via-white/10 to-transparent opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-start space-x-4">
                      <div className={`p-4 bg-gradient-to-br ${action.gradient} rounded-2xl group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                        <action.icon className={`h-8 w-8 ${action.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-emerald-700 transition-colors duration-300 leading-tight">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-end">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Ranking de Vendedores */}
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-xl mb-8">
          <CardHeader className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent flex items-center">
              <Award className="h-6 w-6 mr-2 text-emerald-600" />
              Ranking de Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {consultants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum vendedor encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {consultants
                  .map((c: any) => {
                    // Calcular leads atribuídos
                    const consultantLeads = leads.filter((l: any) => l.assignedConsultantId === c.id);
                    const closedLeads = consultantLeads.filter((l: any) => l.status === 'finalizado');
                    const totalSales = closedLeads.reduce((sum: number, l: any) => 
                      sum + parseFloat(l.estimatedValue || '0'), 0
                    );
                    const commissions = totalSales * (parseFloat(c.commissionRate || '0') / 100);
                    
                    return {
                      ...c,
                      totalLeads: consultantLeads.length,
                      closedLeads: closedLeads.length,
                      totalSales,
                      commissions,
                      conversionRate: consultantLeads.length > 0 
                        ? ((closedLeads.length / consultantLeads.length) * 100).toFixed(1) 
                        : '0'
                    };
                  })
                  .sort((a: any, b: any) => b.totalSales - a.totalSales)
                  .slice(0, 5)
                  .map((c: any, index: number) => {
                    const medalColors = [
                      'from-yellow-400 to-yellow-600', // 1º ouro
                      'from-gray-300 to-gray-500',     // 2º prata
                      'from-orange-400 to-orange-600', // 3º bronze
                      'from-emerald-400 to-emerald-600',
                      'from-teal-400 to-teal-600'
                    ];
                    
                    return (
                      <div 
                        key={c.id} 
                        className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                          index === 0 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50' :
                          index === 1 ? 'border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50' :
                          index === 2 ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-red-50' :
                          'border-emerald-200 bg-gradient-to-r from-emerald-50/30 to-green-50/30'
                        } hover:shadow-lg transition-all`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`p-3 bg-gradient-to-br ${medalColors[index]} rounded-full shadow-md flex items-center justify-center min-w-[48px]`}>
                            <span className="text-white font-bold text-lg">{index + 1}º</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900 truncate">{c.fullName || 'Vendedor'}</h4>
                              {c.id === consultant?.id && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-gray-500" />
                                <span className="text-gray-600">{c.totalLeads} leads</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-gray-600">{c.closedLeads} vendas</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-blue-500" />
                                <span className="text-gray-600">{c.conversionRate}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-emerald-500" />
                                <span className="font-semibold text-emerald-700">
                                  R$ {c.commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-xl">
          <CardHeader className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent flex items-center">
              <FileText className="h-6 w-6 mr-2 text-emerald-600" />
              Últimos Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum lead encontrado</p>
                <Link href="/comercial/crm">
                  <Button className="mt-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
                    Ir para CRM
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead: any, index: number) => {
                  const statusInfo = getStatusBadge(lead.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-xl border border-emerald-200 hover:shadow-md transition-all">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-gray-900">{lead.patientName}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.patientEmail}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.patientPhone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href="/comercial/crm">
                        <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
