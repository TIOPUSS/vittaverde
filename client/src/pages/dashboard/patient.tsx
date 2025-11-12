import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/hooks/useAuth";
import { 
  Heart, Calendar, Package, FileText, Shield, Activity, 
  Clock, CheckCircle, User as UserIcon, LogOut, Phone, MessageCircle, Upload, AlertCircle
} from "lucide-react";
import type { User } from "@shared/schema";
import PartnerSSOWidget from "@/components/partner-sso-widget";

export default function PatientDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, hasRole } = useAuth();
  
  // Get patient progress data
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['/api/patient/progress'],
    queryFn: async () => {
      const response = await apiRequest('/api/patient/progress', 'GET');
      if (!response.ok) throw new Error('Failed to fetch progress');
      return response.json();
    },
    enabled: !!user
  });

  useEffect(() => {
    if (user && !hasRole('patient') && !hasRole('client')) {
      setLocation("/login");
    }
  }, [user, hasRole, setLocation]);

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  // Calculate progress based on patient stage
  const getProgressPercentage = (stage: string) => {
    const stages = {
      'novo': 10,
      'contato_inicial': 25,
      'aguardando_receita': 50,
      'receita_recebida': 75,
      'receita_validada': 90,
      'produtos_liberados': 100,
      'finalizado': 100
    };
    return stages[stage as keyof typeof stages] || 0;
  };

  const treatmentProgress = progressData ? getProgressPercentage(progressData.currentStage) : 0;

  const nextAppointments = [
    {
      date: "25 Ago 2025",
      time: "14:30",
      doctor: "Dr. Ana Silva",
      type: "Acompanhamento",
      status: "confirmada"
    },
    {
      date: "02 Set 2025",
      time: "10:00",
      doctor: "Dr. Carlos Santos",
      type: "Renovação de Prescrição",
      status: "pendente"
    }
  ];

  const recentOrders = [
    {
      id: "ORD-2025-001",
      product: "Óleo Cannabis Medicinal 10mg/ml",
      status: "entregue",
      date: "15 Ago 2025",
      amount: "R$ 180,00"
    },
    {
      id: "ORD-2025-002", 
      product: "Cápsulas Cannabis Medicinal 25mg",
      status: "em_transito",
      date: "18 Ago 2025",
      amount: "R$ 220,00"
    }
  ];

  const statusColors = {
    confirmada: "bg-green-100 text-green-800",
    pendente: "bg-yellow-100 text-yellow-800",
    entregue: "bg-green-100 text-green-800",
    em_transito: "bg-blue-100 text-blue-800"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            {/* User Info */}
            <div className="flex-1">
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4 shadow-md border border-green-100">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-green-600 animate-pulse" />
                <span className="text-green-600">Paciente Ativo</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 leading-tight">
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Minha Jornada
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600">
                Bem-vindo(a), <span className="font-bold text-green-600">{user.fullName || user.email}</span>
              </p>
            </div>
            
            {/* Actions - Mobile Optimized */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Paciente
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout} 
                className="text-xs sm:text-sm px-2 sm:px-4"
                data-testid="button-logout"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Treatment Progress - Mobile Optimized */}
        <Card className="mb-6 sm:mb-8 lg:mb-12 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center text-green-800 text-lg sm:text-xl lg:text-2xl">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg sm:rounded-xl mr-3 sm:mr-4">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
              <span className="text-base sm:text-lg lg:text-xl">Progresso da Jornada</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-medium text-green-800">
                  Status: {progressData?.currentStage || 'carregando...'}
                </span>
                <span className="text-lg sm:text-xl font-bold text-green-800">{treatmentProgress}%</span>
              </div>
              <Progress value={treatmentProgress} className="h-3 sm:h-4" />
            </div>
            
            {/* Status Cards - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {progressData?.flags?.hasTelemedAccount ? (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Telemedicina</p>
                <p className="text-xs text-gray-600">
                  {progressData?.flags?.hasTelemedAccount ? 'Configurada' : 'Pendente'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {progressData?.flags?.prescriptionValidated ? (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Receita Médica</p>
                <p className="text-xs text-gray-600">
                  {progressData?.flags?.prescriptionValidated ? 'Validada' : 'Aguardando'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-3 sm:p-4 text-center sm:col-span-1 col-span-1">
                <div className="flex items-center justify-center mb-2">
                  {progressData?.flags?.canViewPrices ? (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Acesso Produtos</p>
                <p className="text-xs text-gray-600">
                  {progressData?.flags?.canViewPrices ? 'Liberado' : 'Bloqueado'}
                </p>
              </div>
            </div>
            
            {/* Next Steps - Mobile Optimized */}
            {!progressData?.flags?.prescriptionValidated && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Próximo Passo</h4>
                    <p className="text-blue-800 text-xs sm:text-sm mb-3">
                      Envie sua receita médica para acessar nossos produtos com preços.
                    </p>
                    <Link href="/bem-estar">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-xs sm:text-sm">
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Enviar Receita
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions - Mobile Optimized */}
            <Card className="bg-white shadow-lg border border-green-100">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-gray-900 flex items-center">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg sm:rounded-xl mr-3 sm:mr-4">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
                  </div>
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Link href="/paciente/consulta">
                    <Button 
                      className="w-full justify-start bg-gradient-to-r from-green-100 to-emerald-100 border-green-200 text-green-800 hover:from-green-200 hover:to-emerald-200 shadow-md h-auto py-3 sm:py-4 text-sm sm:text-base" 
                      data-testid="button-nova-consulta"
                    >
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                      Nova Consulta
                    </Button>
                  </Link>
                  <Link href="/paciente/receita">
                    <Button className="w-full justify-start h-auto py-3 sm:py-4 text-sm sm:text-base" variant="outline" data-testid="button-receita">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Upload Receita
                    </Button>
                  </Link>
                  <Link href="/paciente/produtos">
                    <Button className="w-full justify-start h-auto py-3 sm:py-4 text-sm sm:text-base" variant="outline" data-testid="button-produtos">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Produtos
                    </Button>
                  </Link>
                  <Link href="/paciente/pedidos">
                    <Button className="w-full justify-start h-auto py-3 sm:py-4 text-sm sm:text-base" variant="outline" data-testid="button-pedidos">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Meus Pedidos
                    </Button>
                  </Link>
                  <Link href="/paciente/educacional">
                    <Button className="w-full justify-start h-auto py-3 sm:py-4 text-sm sm:text-base" variant="outline" data-testid="button-educacional">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Educacional
                    </Button>
                  </Link>
                  <Link href="/anvisa">
                    <Button className="w-full justify-start h-auto py-3 sm:py-4 text-sm sm:text-base" variant="outline" data-testid="button-anvisa">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Status ANVISA
                    </Button>
                  </Link>
                  <Link href="/rastreamento">
                    <Button className="w-full justify-start h-auto py-3 sm:py-4 text-sm sm:text-base sm:col-span-2" variant="outline" data-testid="button-rastreamento">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Rastreamento de Pedidos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders - Mobile Optimized */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {recentOrders.map((order, index) => (
                    <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-start sm:items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-gray-500 mt-0.5 sm:mt-0 flex-shrink-0" />
                            <span className="font-medium text-sm sm:text-base text-gray-900 flex-1">{order.product}</span>
                            <Badge className={`${statusColors[order.status as keyof typeof statusColors]} text-xs`}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 ml-6 sm:ml-0">
                            <span>#{order.id}</span>
                            <span>{order.date}</span>
                            <span className="font-semibold text-green-600">{order.amount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Mobile Optimized (moves to bottom on mobile) */}
          <div className="space-y-6">
            
            {/* Next Appointments - Mobile Optimized */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                  Próximas Consultas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {nextAppointments.map((appointment, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">{appointment.type}</span>
                        <Badge className={`${statusColors[appointment.status as keyof typeof statusColors]} text-xs`}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                          {appointment.date} às {appointment.time}
                        </div>
                        <div className="flex items-center">
                          <UserIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                          {appointment.doctor}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Partner SSO Widget */}
            <PartnerSSOWidget />

            {/* Support - Mobile Optimized */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg lg:text-xl">Suporte e Contato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  <Button variant="outline" className="w-full justify-start h-auto py-3 text-sm sm:text-base" data-testid="button-whatsapp">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                    WhatsApp Suporte
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-auto py-3 text-sm sm:text-base" data-testid="button-telefone">
                    <Phone className="h-4 w-4 mr-2 text-blue-600" />
                    Ligar para Suporte
                  </Button>
                  <div className="text-xs text-gray-500 text-center pt-2">
                    Segunda a Sexta: 8h às 18h
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ANVISA Status - Mobile Optimized */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600" />
                  Status ANVISA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Autorização</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aprovada
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    Número: ANV-2025-001234
                  </div>
                  <div className="text-xs text-gray-500">
                    Válida até: 20 Dez 2025
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
