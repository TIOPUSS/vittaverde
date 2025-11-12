import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Link } from "wouter";
import { Link2, Users, ShoppingCart, TrendingUp, Copy, ExternalLink, FileText, Lock, BarChart3, Calendar, Sparkles, Award } from "lucide-react";
import { useState } from "react";

interface VendorMetrics {
  clicks: number;
  registrations: number;
  purchases: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
  affiliateCode: string;
  affiliateLink: string;
  affiliateLinkClean: string;
  commissionRate: number;
  recentActivity: any[];
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<VendorMetrics>({
    queryKey: ['/api/affiliate/my-metrics'],
    enabled: !!user
  });

  const handleCopyLink = () => {
    if (metrics?.affiliateLink) {
      navigator.clipboard.writeText(metrics.affiliateLink);
      setCopied(true);
      toast({
        title: "Link Copiado!",
        description: "Seu link de afiliado foi copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const conversionRate = metrics?.conversionRate?.toFixed(1) || '0.0';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                Dashboard do Parceiro
              </h1>
              <p className="text-gray-600 text-sm md:text-base">Bem-vindo de volta, {user?.fullName?.split(' ')[0]}! 🎉</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clicks Card */}
              <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-600 flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>Cliques no Link</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {metricsLoading ? "..." : metrics?.clicks || 0}
                  </div>
                  <p className="text-xs text-gray-500">Total de visitantes únicos</p>
                </CardContent>
              </Card>

              {/* Conversions Card */}
              <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-600 flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>Cadastros</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {metricsLoading ? "..." : metrics?.registrations || 0}
                  </div>
                  <p className="text-xs text-gray-500">
                    Taxa de conversão: {conversionRate}%
                  </p>
                </CardContent>
              </Card>

              {/* Revenue Card */}
              <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-600 flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-orange-600" />
                      </div>
                      <span>Vendas</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-orange-600 mb-1">
                    R$ {metricsLoading ? "..." : (metrics?.totalRevenue || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">Receita total gerada</p>
                </CardContent>
              </Card>

              {/* Commission Card - Highlighted */}
              <Card className="border-2 border-emerald-300 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 bg-gradient-to-br from-emerald-100 to-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <span>Suas Comissões</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-emerald-700 mb-1">
                    R$ {metricsLoading ? "..." : (metrics?.totalCommission || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">
                    💰 Total a receber
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <span>Acesso Rápido</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CRM - Disabled */}
                <div className="relative group">
                  <Button 
                    disabled
                    className="w-full h-auto flex-col gap-3 p-6 bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                    data-testid="link-crm-disabled"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-sm">CRM</div>
                      <div className="text-xs mt-1 flex items-center justify-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Interno apenas</span>
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Reports */}
                <Link href="/vendedor/relatorios">
                  <Button 
                    className="w-full h-auto flex-col gap-3 p-6 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    data-testid="link-vendor-reports"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Relatórios</div>
                      <div className="text-xs mt-1 opacity-90">Ver detalhes</div>
                    </div>
                  </Button>
                </Link>

                {/* University */}
                <Link href="/vendedor/universidade">
                  <Button 
                    className="w-full h-auto flex-col gap-3 p-6 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    data-testid="link-university"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <ExternalLink className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Universidade</div>
                      <div className="text-xs mt-1 opacity-90">Aprender mais</div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Affiliate Link */}
          <div className="space-y-6">
            {/* Affiliate Link Card */}
            {metrics && (
              <Card className="border-2 border-emerald-300 shadow-xl bg-gradient-to-br from-emerald-50 to-white sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-emerald-900 flex items-center space-x-2">
                    <Link2 className="h-5 w-5 text-emerald-600" />
                    <span>Seu Link de Afiliado</span>
                  </CardTitle>
                  <CardDescription>
                    Compartilhe para ganhar comissões
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border-2 border-emerald-200 break-all text-sm font-mono text-emerald-700 shadow-sm">
                    {metrics.affiliateLink}
                  </div>

                  <Button 
                    onClick={handleCopyLink}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                    data-testid="button-copy-link"
                  >
                    {copied ? (
                      <>
                        <span className="mr-2">✓</span>
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5 mr-2" />
                        Copiar Link
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-200">
                    <div className="text-center p-3 bg-white rounded-lg border border-emerald-100">
                      <div className="text-xs text-gray-600 mb-1">Código</div>
                      <div className="font-bold text-emerald-700">{metrics.affiliateCode}</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-emerald-100">
                      <div className="text-xs text-gray-600 mb-1">Comissão</div>
                      <div className="font-bold text-emerald-700">{metrics.commissionRate.toFixed(0)}%</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-emerald-200 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      Dicas para compartilhar:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1.5 pl-1">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span>Compartilhe em suas redes sociais</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span>Envie para amigos via WhatsApp</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span>Use em assinatura de email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span>Inclua em materiais de marketing</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Insight */}
            <Card className="border-2 border-indigo-200 shadow-lg bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-indigo-900 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100">
                  <span className="text-xs text-gray-600">Taxa de Conversão</span>
                  <span className="font-bold text-indigo-700">{conversionRate}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100">
                  <span className="text-xs text-gray-600">Ticket Médio</span>
                  <span className="font-bold text-indigo-700">
                    R$ {metrics?.purchases ? ((metrics.totalRevenue || 0) / metrics.purchases).toFixed(2) : '0.00'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
