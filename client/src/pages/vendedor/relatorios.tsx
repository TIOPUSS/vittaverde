import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Download, FileSpreadsheet, Users, Calendar, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface VendorClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  totalPurchases: number;
  totalRevenue: number;
  totalCommission: number;
}

export default function VendorReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: clients = [], isLoading } = useQuery<VendorClient[]>({
    queryKey: ['/api/vendor/clients'],
    enabled: !!user
  });

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/vendor/clients/export', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes-afiliados-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Exportado com Sucesso!",
        description: "Seu relatório foi baixado",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível exportar o relatório",
      });
    }
  };

  const totalRevenue = clients.reduce((sum, client) => sum + client.totalRevenue, 0);
  const totalCommission = clients.reduce((sum, client) => sum + client.totalCommission, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                onClick={() => setLocation('/vendedor')}
                className="hover:bg-emerald-100"
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar
              </Button>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
              Relatório de Clientes
            </h1>
            <p className="text-gray-600 mt-1">Todos os clientes que vieram através do seu link</p>
          </div>

          <Button
            onClick={handleExportExcel}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg"
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Exportar Excel
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Total de Clientes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {isLoading ? "..." : clients.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Cadastrados via seu link</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 shadow-lg bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 flex items-center space-x-2">
                <Download className="h-4 w-4 text-orange-600" />
                <span>Receita Total</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">
                R$ {isLoading ? "..." : totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Gerada pelos seus clientes</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-300 shadow-xl bg-gradient-to-br from-emerald-100 to-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-emerald-700" />
                <span>Suas Comissões</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-700">
                R$ {isLoading ? "..." : totalCommission.toFixed(2)}
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">💰 Total a receber</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800">Lista de Clientes</CardTitle>
            <CardDescription>
              Todos os clientes que se cadastraram através do seu link de afiliado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-gray-600">Carregando clientes...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Nenhum cliente ainda</p>
                <p className="text-gray-400 text-sm mt-2">
                  Compartilhe seu link para começar a receber clientes
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cadastro
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Compras
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Receita
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Comissão
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {client.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {client.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {client.phone || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(client.registeredAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {client.totalPurchases}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-orange-600">
                          R$ {client.totalRevenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-700">
                          R$ {client.totalCommission.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
