import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart2,
  PieChart,
  Activity,
  Eye,
  Award,
  Zap
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from "recharts";

interface FinancialStats {
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyRevenue: Array<{ month: string; revenue: number; costs: number; profit: number }>;
  categoryRevenue: Array<{ category: string; revenue: number; percentage: number }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    amount: number;
    status: string;
  }>;
}

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

export default function FinanceiroPage() {
  const [period, setPeriod] = useState("30");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: stats, isLoading } = useQuery<FinancialStats>({
    queryKey: ['/api/admin/financial-stats', period],
  });

  const { data: transactionDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['/api/transactions', selectedTransactionId, 'details'],
    enabled: !!selectedTransactionId && showDetailsModal,
  });

  const handleViewDetails = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedTransactionId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 font-medium">Carregando dados financeiros...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const kpiCards = [
    {
      title: "Receita Total",
      value: formatCurrency(stats?.totalRevenue || 0),
      description: `${stats?.totalOrders || 0} vendas`,
      trend: (stats?.totalRevenue || 0) > 0 ? "up" : "neutral",
      icon: DollarSign,
      bgColor: "from-green-500 to-emerald-600"
    },
    {
      title: "Custos Totais",
      value: formatCurrency(stats?.totalCosts || 0),
      description: "Estoque + Despesas",
      trend: "neutral",
      icon: Wallet,
      bgColor: "from-orange-500 to-amber-600"
    },
    {
      title: "Lucro Líquido",
      value: formatCurrency(stats?.profit || 0),
      description: `Margem de ${stats?.profitMargin?.toFixed(1) || 0}%`,
      trend: (stats?.profit || 0) > 0 ? "up" : "down",
      icon: TrendingUp,
      bgColor: "from-blue-500 to-indigo-600"
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(stats?.averageOrderValue || 0),
      description: "Por pedido",
      trend: "up",
      icon: ShoppingCart,
      bgColor: "from-purple-500 to-violet-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2" data-testid="text-title">
              Dashboard Financeiro
            </h1>
            <p className="text-gray-600">Análise completa de receitas, custos e performance</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 w-full sm:w-auto">
            <Calendar className="h-5 w-5 text-green-600" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-40 border-0 focus:ring-0" data-testid="select-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {kpiCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card 
                key={index} 
                className="relative overflow-hidden border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid={`card-kpi-${index}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.bgColor} shadow-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {card.trend === "up" && (
                      <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="text-xs font-semibold">+12%</span>
                      </div>
                    )}
                    {card.trend === "down" && (
                      <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-full">
                        <ArrowDownRight className="h-4 w-4" />
                        <span className="text-xs font-semibold">-3%</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm font-semibold text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl inline-flex w-full sm:w-auto overflow-x-auto" data-testid="tabs-list">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-semibold" 
              data-testid="tab-overview"
            >
              <Activity className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="revenue" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-semibold" 
              data-testid="tab-revenue"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Receitas
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-semibold" 
              data-testid="tab-categories"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Categorias
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-semibold" 
              data-testid="tab-transactions"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Transações
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-semibold" 
              data-testid="tab-expenses"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Custos
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Main Chart */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Activity className="h-5 w-5 text-green-600" />
                  Análise Completa: Receita, Custos e Lucro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={stats?.monthlyRevenue || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `R$ ${value}`} width={70} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Receita" />
                    <Area type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCosts)" name="Custos" />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Lucro Líquido" dot={{ fill: '#3b82f6', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gauge Meter */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Award className="h-5 w-5 text-green-600" />
                    Margem de Lucro
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 200 200" className="transform -rotate-90">
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                      <circle 
                        cx="100" 
                        cy="100" 
                        r="80" 
                        fill="none" 
                        stroke={
                          (stats?.profitMargin || 0) >= 30 ? '#059669' : 
                          (stats?.profitMargin || 0) >= 15 ? '#f59e0b' : 
                          '#ef4444'
                        }
                        strokeWidth="20"
                        strokeDasharray={`${((stats?.profitMargin || 0) / 100) * 502.4} 502.4`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900">{stats?.profitMargin?.toFixed(1) || 0}%</span>
                      <span className="text-sm text-gray-600 font-medium mt-1">Margem</span>
                    </div>
                  </div>
                  <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-gray-600 font-medium">
                      Meta: 30% | Atual: {stats?.profitMargin?.toFixed(1) || 0}%
                    </p>
                    {(stats?.profitMargin || 0) >= 30 ? (
                      <Badge className="bg-green-600 text-white">✓ Meta Atingida!</Badge>
                    ) : (
                      <Badge className="bg-orange-500 text-white">
                        {(30 - (stats?.profitMargin || 0)).toFixed(1)}% para a meta
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Categories */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <BarChart2 className="h-5 w-5 text-green-600" />
                    Top Categorias por Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(stats?.categoryRevenue || []).slice(0, 5).map((cat, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">{cat.category}</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${cat.percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{cat.percentage.toFixed(1)}% do total</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Análise Detalhada de Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={stats?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} width={70} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} name="Receita" dot={{ fill: '#059669', r: 5 }} />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Lucro" dot={{ fill: '#3b82f6', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Receita por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stats?.categoryRevenue || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" fontSize={12} />
                      <YAxis dataKey="category" type="category" width={80} stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="revenue" fill="#059669" radius={[0, 8, 8, 0]}>
                        {(stats?.categoryRevenue || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Ranking de Categorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(stats?.categoryRevenue || []).map((cat, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{cat.category}</p>
                            <p className="text-xs text-gray-600">{cat.percentage.toFixed(1)}% do total</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(cat.revenue)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Últimas Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(stats?.recentTransactions || []).map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'sale' ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          {transaction.type === 'sale' ? (
                            <ShoppingCart className="h-5 w-5 text-green-600" />
                          ) : (
                            <Wallet className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status === 'completed' ? 'Completo' : 
                           transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                        <p className={`text-lg font-bold ${
                          transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'sale' ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <button
                          onClick={() => handleViewDetails(transaction.id)}
                          className="p-2 rounded-lg hover:bg-green-50 transition-colors"
                          data-testid={`button-view-${transaction.id}`}
                        >
                          <Eye className="h-5 w-5 text-green-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Wallet className="h-5 w-5 text-orange-600" />
                  Análise de Custos e Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stats?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `R$ ${value}`} width={70} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="costs" fill="#f59e0b" name="Custos Totais" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-6 p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Total de Custos no Período</p>
                      <p className="text-3xl font-bold text-orange-600 mt-1">
                        {formatCurrency(stats?.totalCosts || 0)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Inclui estoque de produtos e despesas operacionais
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transaction Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={handleCloseModal}>
          <DialogContent className="bg-white border border-gray-200 shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Detalhes da Transação
              </DialogTitle>
            </DialogHeader>
            {loadingDetails ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando detalhes...</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm font-semibold text-gray-600 mb-1">ID da Transação</p>
                  <p className="text-lg font-bold text-gray-900">{selectedTransactionId}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                    <Badge className="bg-green-600 text-white">Completo</Badge>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Tipo</p>
                    <p className="font-bold text-gray-900">Venda</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">R$ 1.250,00</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <Footer />
    </div>
  );
}
