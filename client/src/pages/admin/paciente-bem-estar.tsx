import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Heart, Activity, Pill, FileText, Package,
  CheckCircle, Clock, AlertCircle, TrendingUp, Calendar,
  User, Stethoscope, ShieldCheck, Truck, Download
} from 'lucide-react';

interface PatientWellness {
  patient: {
    id: string;
    name: string;
    healthCondition: string;
    anvisaStatus: string;
    anvisaNumber: string;
    trackingCode: string;
    createdAt: string;
  };
  currentStep: string;
  currentStepDetails: any;
  metrics: {
    totalOrders: number;
    completedOrders: number;
    pendingPrescriptions: number;
    anvisaApprovalRate: number;
  };
  prescriptions: any[];
  orders: any[];
  anvisaProcesses: any[];
}

export default function PacienteBemEstarPage() {
  const [match, params] = useRoute('/admin/paciente/:id/bem-estar');
  const [, setLocation] = useLocation();
  const patientId = params?.id;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: wellness, isLoading } = useQuery<PatientWellness>({
    queryKey: [`/api/patients/${patientId}/wellness`],
    enabled: !!patientId,
  });

  const processSteps = [
    { key: 'consultation', label: 'Consulta', icon: Stethoscope },
    { key: 'prescription', label: 'Receita', icon: FileText },
    { key: 'anvisa', label: 'ANVISA', icon: ShieldCheck },
    { key: 'order', label: 'Pedido', icon: Package },
    { key: 'shipping', label: 'Envio', icon: Truck },
    { key: 'delivered', label: 'Entregue', icon: CheckCircle }
  ];

  const getStepStatus = (stepKey: string) => {
    if (!wellness) return 'pending';
    const currentIndex = processSteps.findIndex(s => s.key === wellness.currentStep);
    const stepIndex = processSteps.findIndex(s => s.key === stepKey);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'approved': return 'bg-emerald-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!wellness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Paciente não encontrado</h1>
          <Button onClick={() => setLocation('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          onClick={() => setLocation('/admin')}
          variant="outline"
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Bem-estar do Paciente</h1>
              <p className="text-gray-600 mt-1">Acompanhamento completo de saúde e tratamento</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Pedidos Totais', value: wellness.metrics.totalOrders, icon: Package, color: 'from-blue-500 to-cyan-500' },
            { label: 'Entregas Concluídas', value: wellness.metrics.completedOrders, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
            { label: 'Receitas Ativas', value: wellness.metrics.pendingPrescriptions, icon: FileText, color: 'from-purple-500 to-pink-500' },
            { label: 'Taxa ANVISA', value: `${wellness.metrics.anvisaApprovalRate}%`, icon: TrendingUp, color: 'from-orange-500 to-red-500' }
          ].map((stat, idx) => (
            <Card key={idx} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.color} mb-4`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process Timeline */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Status do Processo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
              <div 
                className="absolute top-6 left-0 h-1 bg-emerald-500 -z-10 transition-all duration-500"
                style={{ 
                  width: `${(processSteps.findIndex(s => s.key === wellness.currentStep) / (processSteps.length - 1)) * 100}%` 
                }}
              ></div>
              
              {processSteps.map((step, idx) => {
                const status = getStepStatus(step.key);
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                    <div className={`
                      p-3 rounded-full border-4 
                      ${status === 'completed' ? 'bg-emerald-500 border-emerald-200' : 
                        status === 'current' ? 'bg-white border-emerald-500 animate-pulse' : 
                        'bg-white border-gray-200'}
                    `}>
                      <step.icon className={`h-5 w-5 ${
                        status === 'completed' ? 'text-white' : 
                        status === 'current' ? 'text-emerald-600' : 
                        'text-gray-400'
                      }`} />
                    </div>
                    <span className={`text-xs font-medium ${
                      status === 'current' ? 'text-emerald-600' : 'text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {wellness.currentStepDetails?.trackingNumber && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Código de Rastreamento:</strong> {wellness.currentStepDetails.trackingNumber}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Prescriptions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-600" />
                Receitas Médicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wellness.prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {wellness.prescriptions.slice(0, 3).map((prescription, idx) => (
                    <div key={idx} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={prescription.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                          {prescription.isActive ? 'Ativa' : 'Expirada'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(prescription.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Válida até: {new Date(prescription.validUntil).toLocaleDateString('pt-BR')}
                      </p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        <Download className="h-4 w-4 mr-1" />
                        Baixar Receita
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhuma receita encontrada</p>
              )}
            </CardContent>
          </Card>

          {/* Orders History */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Histórico de Compras
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wellness.orders.length > 0 ? (
                <div className="space-y-4">
                  {wellness.orders.slice(0, 3).map((order, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <span className="text-sm font-bold text-gray-900">
                          R$ {parseFloat(order.totalAmount).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Rastreio: {order.trackingNumber}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhuma compra encontrada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patient Info */}
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Informações do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Condição de Saúde</p>
                <p className="font-semibold text-gray-900">{wellness.patient.healthCondition || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status ANVISA</p>
                <Badge className={wellness.patient.anvisaStatus === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}>
                  {wellness.patient.anvisaStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Código de Rastreamento</p>
                <p className="font-mono text-sm text-gray-900">{wellness.patient.trackingCode || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
