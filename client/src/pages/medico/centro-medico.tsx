import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/hooks/useAuth";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip
} from "recharts";
import { 
  Activity, TrendingUp, Users, Heart,
  Calculator, FlaskConical, Database, ChartLine,
  Monitor, Zap, Stethoscope, ArrowUpRight, ArrowLeft, User
} from "lucide-react";

export default function CentroMedicoPage() {
  const { user } = useAuth();

  // Fetch real data from API
  const { data: stats = {}, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/medical-analytics/stats'],
  });

  const { data: patientsEvolution = [], isLoading: loadingEvolution } = useQuery({
    queryKey: ['/api/medical-analytics/patients-evolution'],
  });

  const { data: pathologiesData = [], isLoading: loadingPathologies } = useQuery({
    queryKey: ['/api/medical-analytics/pathologies'],
  });

  const { data: treatmentStatus = [], isLoading: loadingTreatment } = useQuery({
    queryKey: ['/api/medical-analytics/treatment-status'],
  });

  // Fetch patients list
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const tools = [
    {
      title: "Base de Conhecimento",
      description: "Pesquisa científica",
      icon: Database,
      gradient: "from-green-500 to-emerald-600",
      badge: "Data",
      available: true,
      action: "university",
      link: "/medico/universidade"
    },
    {
      title: "Calculadora de Dosagem",
      description: "CBD/THC personalizado",
      icon: Calculator,
      gradient: "from-emerald-500 to-green-600",
      badge: "Calc",
      available: false,
      comingSoon: true
    },
    {
      title: "Análise Laboratorial",
      description: "Resultados e exames",
      icon: FlaskConical,
      gradient: "from-teal-500 to-cyan-600",
      badge: "Labs",
      available: false,
      comingSoon: true
    },
    {
      title: "Predições IA",
      description: "Análise inteligente",
      icon: ChartLine,
      gradient: "from-cyan-500 to-teal-600",
      badge: "IA",
      available: false,
      comingSoon: true
    },
    {
      title: "Monitoramento IoT",
      description: "Tempo real",
      icon: Monitor,
      gradient: "from-emerald-500 to-green-600",
      badge: "IoT",
      available: false,
      comingSoon: true
    },
    {
      title: "Automação",
      description: "Workflows inteligentes",
      icon: Zap,
      gradient: "from-teal-500 to-cyan-600",
      badge: "Auto",
      available: false,
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50" style={{ scrollBehavior: 'auto' }}>
      <div style={{ height: 0, overflow: 'hidden' }} ref={(el) => el?.scrollIntoView()} />
      <Navbar />
      
      {/* Header Premium */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 shadow-2xl overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNk0wIDJjMy4zMSAwIDYgMi42OSA2IDZzLTIuNjkgNi02IDYtNi0yLjY5LTYtNiAyLjY5LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400 rounded-full filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 md:px-8 py-6 md:py-8 lg:py-10">
          <div className="flex flex-col gap-5 md:gap-6">
            <div className="flex items-center gap-4 md:gap-6">
              {/* Icon with gradient border and glow */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-200 to-teal-200 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/25 backdrop-blur-md p-3 md:p-4 lg:p-5 rounded-2xl md:rounded-3xl border border-white/40 shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                  <Stethoscope className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 text-white drop-shadow-lg" />
                </div>
              </div>
              
              {/* Title Section */}
              <div className="text-white flex-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 md:mb-3 drop-shadow-lg tracking-tight">
                  Centro Médico Avançado
                </h1>
                <p className="text-white/90 text-sm md:text-base lg:text-lg xl:text-xl font-medium">
                  Sistema completo de análise e gestão médica Cannabis
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
              <div className="bg-white/20 backdrop-blur-md text-white px-5 py-3 md:px-6 md:py-3.5 rounded-xl border border-white/40 shadow-lg flex items-center justify-center sm:justify-start gap-3">
                <div className="bg-white/30 p-2 rounded-lg">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <span className="text-sm md:text-base font-semibold">
                  Dr(a). {user?.fullName || 'Usuário'}
                </span>
              </div>
              <Link href={user?.role === 'admin' ? '/admin' : '/medico'} className="w-full sm:w-auto">
                <Button 
                  className="w-full sm:w-auto bg-white hover:bg-white/95 text-emerald-700 hover:text-emerald-800 font-semibold px-6 py-6 md:px-8 text-sm md:text-base rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                  data-testid="button-back-dashboard"
                >
                  <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 md:px-8 py-6 md:py-8 lg:py-10">
        
        {/* Stats Cards - Mobile Otimizado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
          <Card className="border-0 shadow-sm md:shadow-md hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-600"></div>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 rounded bg-gradient-to-r from-emerald-500 to-green-600">
                  <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                </div>
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-green-600 ml-auto" />
              </div>
              <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase mb-1 leading-tight">Pacientes</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {loadingStats ? '...' : ((stats as any)?.totalPatients || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm md:shadow-md hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-600"></div>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 rounded bg-gradient-to-r from-teal-500 to-cyan-600">
                  <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                </div>
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-teal-600 ml-auto" />
              </div>
              <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase mb-1 leading-tight">Prescrições</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {loadingStats ? '...' : ((stats as any)?.activePrescriptions || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm md:shadow-md hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 rounded bg-gradient-to-r from-green-500 to-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                </div>
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-green-600 ml-auto" />
              </div>
              <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase mb-1 leading-tight">Taxa Sucesso</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {loadingStats ? '...' : ((stats as any)?.successRate !== undefined ? `${(stats as any).successRate}%` : 'N/A')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm md:shadow-md hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-teal-600"></div>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 md:p-2 rounded bg-gradient-to-r from-cyan-500 to-teal-600">
                  <Heart className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                </div>
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-cyan-600 ml-auto" />
              </div>
              <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase mb-1 leading-tight">Satisfação</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                {loadingStats ? '...' : ((stats as any)?.satisfactionRate ? `${(stats as any).satisfactionRate}%` : 'N/A')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access - Patients Panel - Compacto Mobile */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 overflow-hidden mb-4 sm:mb-6 md:mb-10">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 text-white">
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl border border-white/30">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-0.5 sm:mb-1">Painel de Pacientes</h3>
                  <p className="text-emerald-100 text-xs sm:text-sm md:text-base">
                    {(patients as any)?.length || 0} paciente{(patients as any)?.length !== 1 ? 's' : ''} cadastrado{(patients as any)?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Link href="/medico/pacientes" className="w-full">
                <Button 
                  className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-semibold min-h-[44px] text-sm sm:text-base"
                  data-testid="button-view-patients"
                >
                  <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Ver Pacientes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section - Premium Design with Real Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 lg:gap-8 mb-6 md:mb-10">
          
          {/* Patients Evolution Chart */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-600"></div>
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-green-50 p-3 md:p-4 lg:pb-6">
              <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl lg:text-2xl">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600">
                  <ChartLine className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                Evolução de Pacientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 lg:p-8">
              {loadingEvolution ? (
                <div className="h-48 md:h-64 lg:h-80 flex items-center justify-center">
                  <div className="text-gray-400 text-sm md:text-base">Carregando dados...</div>
                </div>
              ) : !patientsEvolution || patientsEvolution.length === 0 ? (
                <div className="h-48 md:h-64 lg:h-80 flex flex-col items-center justify-center text-center p-4 md:p-8">
                  <ChartLine className="h-12 w-12 md:h-16 md:w-16 text-gray-300 mb-3 md:mb-4" />
                  <p className="text-gray-500 text-base md:text-lg font-semibold mb-1 md:mb-2">Sem dados suficientes</p>
                  <p className="text-gray-400 text-xs md:text-sm">
                    Cadastre mais pacientes para visualizar a evolução
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : window.innerWidth < 1024 ? 250 : 300}>
                  <AreaChart data={patientsEvolution}>
                    <defs>
                      <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" style={{ fontSize: window.innerWidth < 768 ? '10px' : '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: window.innerWidth < 768 ? '10px' : '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: window.innerWidth < 768 ? '11px' : '14px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: window.innerWidth < 768 ? '11px' : '14px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="pacientes" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorPacientes)"
                      name="Total de Pacientes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pathologies Distribution Chart */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-600"></div>
            <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-cyan-50 p-3 md:p-4 lg:pb-6">
              <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl lg:text-2xl">
                <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600">
                  <Activity className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                Distribuição de Patologias
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 lg:p-8">
              {loadingPathologies ? (
                <div className="h-48 md:h-64 lg:h-80 flex items-center justify-center">
                  <div className="text-gray-400 text-sm md:text-base">Carregando dados...</div>
                </div>
              ) : !pathologiesData || pathologiesData.length === 0 ? (
                <div className="h-48 md:h-64 lg:h-80 flex flex-col items-center justify-center text-center p-4 md:p-8">
                  <Activity className="h-12 w-12 md:h-16 md:w-16 text-gray-300 mb-3 md:mb-4" />
                  <p className="text-gray-500 text-base md:text-lg font-semibold mb-1 md:mb-2">Sem dados de patologias</p>
                  <p className="text-gray-400 text-xs md:text-sm">
                    Adicione tags aos leads/pacientes para visualizar a distribuição
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : window.innerWidth < 1024 ? 250 : 300}>
                  <PieChart>
                    <Pie
                      data={pathologiesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={window.innerWidth < 768 ? 60 : window.innerWidth < 1024 ? 80 : 100}
                      fill="#8884d8"
                      dataKey="value"
                      style={{ fontSize: window.innerWidth < 768 ? '10px' : '12px' }}
                    >
                      {pathologiesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: window.innerWidth < 768 ? '11px' : '14px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Treatment Status Chart */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden mb-6 md:mb-10">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50 p-3 md:p-4 lg:pb-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl lg:text-2xl">
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600">
                <Stethoscope className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              Jornada dos Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 lg:p-8">
            {loadingTreatment ? (
              <div className="h-48 md:h-64 lg:h-80 flex items-center justify-center">
                <div className="text-gray-400 text-sm md:text-base">Carregando dados...</div>
              </div>
            ) : !treatmentStatus || treatmentStatus.length === 0 ? (
              <div className="h-48 md:h-64 lg:h-80 flex flex-col items-center justify-center text-center p-4 md:p-8">
                <Stethoscope className="h-12 w-12 md:h-16 md:w-16 text-gray-300 mb-3 md:mb-4" />
                <p className="text-gray-500 text-base md:text-lg font-semibold mb-1 md:mb-2">Sem pacientes cadastrados</p>
                <p className="text-gray-400 text-xs md:text-sm">
                  Cadastre pacientes para visualizar a jornada
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 220 : window.innerWidth < 1024 ? 280 : 350}>
                <PieChart>
                  <Pie
                    data={treatmentStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={window.innerWidth < 768 ? 70 : window.innerWidth < 1024 ? 90 : 110}
                    fill="#8884d8"
                    dataKey="value"
                    style={{ fontSize: window.innerWidth < 768 ? '10px' : '12px' }}
                  >
                    {treatmentStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: window.innerWidth < 768 ? '11px' : '14px' }} />
                  <Legend wrapperStyle={{ fontSize: window.innerWidth < 768 ? '11px' : '14px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Medical Tools Grid */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-6">Ferramentas Profissionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {tools.map((tool, idx) => {
              const ToolCard = (
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-sm cursor-pointer group overflow-hidden">
                  <div className={`h-1.5 md:h-2 bg-gradient-to-r ${tool.gradient}`}></div>
                  <CardContent className="p-3 md:p-6 lg:p-8">
                    <div className="flex items-start justify-between mb-2 md:mb-6">
                      <div className={`p-2 md:p-4 lg:p-5 rounded-xl md:rounded-3xl bg-gradient-to-r ${tool.gradient} shadow-xl group-hover:scale-110 transition-transform`}>
                        <tool.icon className="h-5 w-5 md:h-9 md:w-9 lg:h-10 lg:w-10 text-white" />
                      </div>
                      <Badge className={`px-2 md:px-4 py-0.5 md:py-1 border-0 font-semibold text-[10px] md:text-sm ${tool.comingSoon ? 'bg-gray-100 text-gray-600' : 'bg-gradient-to-r from-emerald-100 to-green-100 text-green-700'}`}>
                        {tool.badge}
                      </Badge>
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-gray-800 mb-1 md:mb-2">{tool.title}</h3>
                    <p className="text-gray-600 text-xs md:text-base mb-3 md:mb-6 line-clamp-2">{tool.description}</p>
                    
                    {tool.comingSoon ? (
                      <Button disabled className="w-full bg-gray-300 text-gray-600 border-0 font-semibold py-2 md:py-6 text-xs md:text-base shadow-lg cursor-not-allowed opacity-60 min-h-[36px] md:min-h-[auto]">
                        EM BREVE
                      </Button>
                    ) : (
                      <Button className={`w-full bg-gradient-to-r ${tool.gradient} text-white border-0 hover:opacity-90 font-semibold py-2 md:py-6 text-xs md:text-base shadow-lg min-h-[36px] md:min-h-[auto]`}>
                        <span className="md:hidden">Acessar</span>
                        <span className="hidden md:inline">Acessar Ferramenta</span>
                        <ArrowUpRight className="h-3 w-3 md:h-5 md:w-5 ml-1 md:ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );

              return tool.link ? (
                <Link key={idx} href={tool.link}>
                  {ToolCard}
                </Link>
              ) : (
                <div key={idx}>
                  {ToolCard}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
