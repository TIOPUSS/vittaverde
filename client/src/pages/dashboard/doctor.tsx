import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  Stethoscope, Users, FileText, 
  CheckCircle, TrendingUp, 
  Plus, GraduationCap, Building2, ArrowRight
} from "lucide-react";
import type { Patient } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function DoctorDashboard() {
  const { user: currentUser } = useAuth();

  const { data: patients = [], isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    retry: false,
  });

  // Fetch real medical stats from API
  const { data: medicalStats = {}, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/medical-analytics/stats'],
  });

  const patientsArray: Patient[] = patients || [];

  if (!currentUser) {
    return <div>Carregando...</div>;
  }

  const statsData = [
    {
      title: "Pacientes Ativos",
      value: loadingStats ? '...' : (medicalStats as any)?.totalPatients || 0,
      change: "+12%",
      period: "este mês",
      icon: Users,
      gradient: "from-emerald-500 to-green-600"
    },
    {
      title: "Prescrições Ativas",
      value: loadingStats ? '...' : (medicalStats as any)?.activePrescriptions || 0,
      change: "+8",
      period: "este mês",
      icon: FileText,
      gradient: "from-teal-500 to-cyan-600"
    },
    {
      title: "Taxa de Sucesso",
      value: loadingStats ? '...' : ((medicalStats as any)?.successRate ? `${(medicalStats as any).successRate}%` : 'N/A'),
      change: "+2%",
      period: "trimestre",
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Cursos Completados",
      value: loadingStats ? '...' : (medicalStats as any)?.coursesCompleted || 0,
      change: "+3",
      period: "este ano",
      icon: GraduationCap,
      gradient: "from-cyan-500 to-teal-600"
    },
  ];

  const navigationCards = [
    {
      title: "Universidade",
      description: "Cursos e educação continuada especializada",
      icon: GraduationCap,
      href: "/medico/universidade",
      gradient: "from-green-500 to-emerald-600",
      testId: "link-universidade",
      available: true
    },
    {
      title: "Centro Médico",
      description: "Protocolos e diretrizes clínicas atualizadas",
      icon: Building2,
      href: "/medico/centro-medico",
      gradient: "from-cyan-500 to-teal-600",
      testId: "link-centro",
      available: true
    },
    {
      title: "Prescrições",
      description: "Gerencie e crie novas prescrições de Cannabis Medicinal",
      icon: FileText,
      href: "#",
      gradient: "from-gray-400 to-gray-500",
      testId: "link-prescricoes",
      available: false
    },
    {
      title: "Pacientes",
      description: "Visualize e acompanhe seus pacientes ativos",
      icon: Users,
      href: "#",
      gradient: "from-gray-400 to-gray-500",
      testId: "link-pacientes",
      available: false
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                  Painel Médico
                </span>
              </h1>
              <p className="text-lg text-gray-600">
                Bem-vindo, Dr(a). {currentUser.fullName}
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 text-base border-0 w-fit">
              <Stethoscope className="h-5 w-5 mr-2" />
              Médico Credenciado
            </Badge>
          </div>
        </div>

        {/* Stats Grid - Mobile Otimizado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
          {statsData.map((stat, index) => (
            <Card key={index} className="border-0 shadow-md md:shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm overflow-hidden group">
              <div className={`h-1 bg-gradient-to-r ${stat.gradient}`}></div>
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col gap-2 md:gap-0">
                  <div className="flex items-center gap-2 md:justify-between md:items-start">
                    <div className={`p-1.5 md:p-3 rounded-lg md:rounded-2xl bg-gradient-to-r ${stat.gradient} shadow-md md:shadow-lg flex-shrink-0`}>
                      <stat.icon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                    </div>
                    <div className="flex-1 md:text-right">
                      <div className="text-[10px] md:text-xs font-medium text-gray-500 uppercase mb-0.5 md:mb-1 leading-tight">{stat.title}</div>
                      <div className="text-xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{stat.value}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-[10px] md:text-sm mt-1 md:mt-2">
                    <span className="text-green-600 font-semibold mr-1">{stat.change}</span>
                    <span className="text-gray-500">{stat.period}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Cards - Destaque Principal */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {navigationCards.map((card, index) => {
              if (card.available) {
                return (
                  <Link key={index} href={card.href}>
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-sm cursor-pointer h-full overflow-hidden group" data-testid={card.testId}>
                      <div className={`h-2 bg-gradient-to-r ${card.gradient}`}></div>
                      <CardContent className="p-8">
                        <div className="flex items-start gap-6">
                          <div className={`p-5 rounded-3xl bg-gradient-to-r ${card.gradient} shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                            <card.icon className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{card.title}</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">{card.description}</p>
                            <div className="flex items-center text-green-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                              <span>Acessar</span>
                              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              } else {
                return (
                  <Card key={index} className="border-0 shadow-lg bg-gray-100/80 backdrop-blur-sm h-full overflow-hidden opacity-60 cursor-not-allowed" data-testid={card.testId}>
                    <div className={`h-2 bg-gradient-to-r ${card.gradient}`}></div>
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <div className={`p-5 rounded-3xl bg-gradient-to-r ${card.gradient} shadow-lg opacity-60`}>
                          <card.icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-500 mb-2">{card.title}</h3>
                          <p className="text-gray-400 leading-relaxed mb-4">{card.description}</p>
                          <Badge className="bg-gray-300 text-gray-600 border-0 font-semibold px-4 py-2">
                            EM BREVE
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Novos Pacientes</h3>
                  <p className="text-emerald-100">Acompanhe solicitações recentes</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <Users className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-3">
                {patientsArray.length > 0 ? (
                  patientsArray
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 3)
                    .map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div>
                        <p className="font-semibold">{patient.user?.fullName || 'Sem nome'}</p>
                        <p className="text-sm text-emerald-100">{patient.user?.email || 'Sem email'}</p>
                      </div>
                      <Badge className="bg-white/20 text-white border-0">Novo</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-white/10 backdrop-blur-sm rounded-xl">
                    <p className="text-emerald-100">Nenhum paciente cadastrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Atividade Recente</h3>
                  <p className="text-gray-600">Últimas ações no sistema</p>
                </div>
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-4 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-800">Dashboard acessado</p>
                      <p className="text-sm text-gray-500">Agora mesmo</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-800">Sistema atualizado</p>
                      <p className="text-sm text-gray-500">Hoje</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Educational Banner */}
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white overflow-hidden">
          <CardContent className="p-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-bold">Continue Aprendendo</h3>
                </div>
                <p className="text-xl text-green-100 mb-2">
                  Explore novos cursos e mantenha-se atualizado sobre Cannabis Medicinal
                </p>
                <p className="text-green-200">
                  Acesse conteúdo exclusivo, webinars e certificações profissionais
                </p>
              </div>
              <Link href="/medico/universidade">
                <Button className="bg-white text-green-600 hover:bg-green-50 px-8 py-7 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all">
                  Ir para Universidade
                  <ArrowRight className="h-6 w-6 ml-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
