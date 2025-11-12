import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  Users, Heart, Clock, Package, FileText, 
  CheckCircle, ArrowRight, Calendar, ArrowLeft, User, Weight, Activity, Eye, Shield, Download, ExternalLink, Check, X
} from "lucide-react";

export default function PacientesPage() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  
  const { data: patients, isLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Approve prescription mutation
  const approvePrescriptionMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiRequest(`/api/admin/approve-prescription/${clientId}`, 'POST');
      if (!response.ok) throw new Error('Failed to approve prescription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Receita aprovada!",
        description: "A receita foi validada com sucesso.",
      });
      // Refresh the selected patient data
      if (selectedPatient) {
        const updated = patients?.find((p: any) => p.id === selectedPatient.id);
        if (updated) setSelectedPatient(updated);
      }
    },
    onError: () => {
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar a receita.",
        variant: "destructive",
      });
    },
  });

  // Approve ANVISA mutation
  const approveAnvisaMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiRequest(`/api/admin/approve-anvisa/${clientId}`, 'POST');
      if (!response.ok) throw new Error('Failed to approve ANVISA');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "ANVISA aprovada!",
        description: "A autorização ANVISA foi validada. Se ambos documentos estão aprovados, o paciente já pode comprar!",
      });
      // Refresh the selected patient data
      if (selectedPatient) {
        const updated = patients?.find((p: any) => p.id === selectedPatient.id);
        if (updated) setSelectedPatient(updated);
      }
    },
    onError: () => {
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar o documento ANVISA.",
        variant: "destructive",
      });
    },
  });

  // Reject prescription mutation
  const rejectPrescriptionMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiRequest(`/api/admin/reject-prescription/${clientId}`, 'POST', {
        reason: 'Documento não atende os requisitos necessários.'
      });
      if (!response.ok) throw new Error('Failed to reject prescription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Receita reprovada",
        description: "O paciente foi notificado por email sobre a reprovação.",
      });
      // Refresh the selected patient data
      if (selectedPatient) {
        const updated = patients?.find((p: any) => p.id === selectedPatient.id);
        if (updated) setSelectedPatient(updated);
      }
    },
    onError: () => {
      toast({
        title: "Erro ao reprovar",
        description: "Não foi possível reprovar a receita.",
        variant: "destructive",
      });
    },
  });

  // Reject ANVISA mutation
  const rejectAnvisaMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiRequest(`/api/admin/reject-anvisa/${clientId}`, 'POST', {
        reason: 'Documento não atende os requisitos necessários.'
      });
      if (!response.ok) throw new Error('Failed to reject ANVISA');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "ANVISA reprovada",
        description: "O paciente foi notificado por email sobre a reprovação.",
      });
      // Refresh the selected patient data
      if (selectedPatient) {
        const updated = patients?.find((p: any) => p.id === selectedPatient.id);
        if (updated) setSelectedPatient(updated);
      }
    },
    onError: () => {
      toast({
        title: "Erro ao reprovar",
        description: "Não foi possível reprovar o documento ANVISA.",
        variant: "destructive",
      });
    },
  });

  // Map CRM status to journey step
  const getJourneyStep = (status: string) => {
    const statusMap: { [key: string]: number } = {
      'novo': 1,
      'contato_inicial': 1,
      'qualificado': 2,
      'aguardando_receita': 2,
      'receita_recebida': 3,
      'receita_validada': 3,
      'produtos_liberados': 4,
      'compra_realizada': 4,
      'aguardando_entrega': 4,
      'entregue': 5,
      'finalizado': 5
    };
    return statusMap[status] || 1;
  };

  // Get status color based on current stage
  const getStatusColor = (stage: string) => {
    const colorMap: { [key: string]: string } = {
      'novo': 'bg-gray-100 text-gray-700',
      'contato_inicial': 'bg-blue-100 text-blue-700',
      'qualificado': 'bg-blue-100 text-blue-700',
      'aguardando_receita': 'bg-yellow-100 text-yellow-700',
      'receita_recebida': 'bg-purple-100 text-purple-700',
      'receita_validada': 'bg-purple-100 text-purple-700',
      'produtos_liberados': 'bg-green-100 text-green-700',
      'compra_realizada': 'bg-teal-100 text-teal-700',
      'aguardando_entrega': 'bg-teal-100 text-teal-700',
      'entregue': 'bg-emerald-100 text-emerald-700',
      'finalizado': 'bg-emerald-100 text-emerald-700',
    };
    return colorMap[stage] || 'bg-gray-100 text-gray-700';
  };

  // Format status label
  const getStatusLabel = (status: string) => {
    const labelMap: { [key: string]: string } = {
      'novo': 'Novo Cadastro',
      'contato_inicial': 'Contato Inicial',
      'qualificado': 'Qualificado',
      'aguardando_receita': 'Aguardando Receita',
      'receita_recebida': 'Receita Recebida',
      'receita_validada': 'Receita Validada',
      'produtos_liberados': 'Produtos Liberados',
      'compra_realizada': 'Compra Realizada',
      'aguardando_entrega': 'Aguardando Entrega',
      'entregue': 'Entregue',
      'finalizado': 'Finalizado',
    };
    return labelMap[status] || status;
  };

  const getTimeInfo = (lastActivityDate: string | Date) => {
    const activityDate = new Date(lastActivityDate);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return 'Hoje';
    if (daysSince === 1) return 'Ontem';
    if (daysSince < 30) return `${daysSince} dias atrás`;
    const months = Math.floor(daysSince / 30);
    return `${months} ${months === 1 ? 'mês' : 'meses'} atrás`;
  };

  // Download patient file for mobile
  const downloadPatientFile = (patient: any) => {
    const statusLabel = getStatusLabel(patient.currentStage);
    const timeInfo = getTimeInfo(patient.lastActivityDate);
    
    const content = `
FICHA DO PACIENTE - VITTAVERDE
================================

INFORMAÇÕES DE CONTATO
Nome: ${patient.user?.fullName || `Paciente #${patient.id}`}
Email: ${patient.user?.email || 'N/A'}
Telefone: ${patient.user?.phone || 'N/A'}
Última atividade: ${timeInfo}
Cadastrado em: ${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('pt-BR') : 'N/A'}

STATUS ATUAL
${statusLabel}

JORNADA DO PACIENTE
✓ Cadastro: Completo
${patient.flags?.prescriptionUrl ? '✓' : '○'} Consulta: ${patient.flags?.prescriptionUrl ? 'Completo' : 'Pendente'}
${patient.flags?.anvisaDocumentUrl ? '✓' : '○'} ANVISA: ${patient.flags?.anvisaDocumentUrl ? 'Completo' : 'Pendente'}
${patient.flags?.canPurchase ? '✓' : '○'} Compra: ${patient.flags?.canPurchase ? 'Liberado' : 'Bloqueado'}
${patient.currentStage === 'entregue' || patient.currentStage === 'finalizado' ? '✓' : '○'} Acompanhamento: ${patient.currentStage === 'entregue' || patient.currentStage === 'finalizado' ? 'Completo' : 'Em andamento'}

DOCUMENTOS
Receita: ${patient.flags?.prescriptionValidated ? 'Validada ✓' : patient.flags?.prescriptionUrl ? 'Aguardando validação' : 'Não enviada'}
ANVISA: ${patient.flags?.anvisaDocumentValidated ? 'Validada ✓' : patient.flags?.anvisaDocumentUrl ? 'Aguardando validação' : 'Não enviada'}

================================
Gerado em: ${new Date().toLocaleString('pt-BR')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ficha-${patient.user?.fullName?.replace(/\s+/g, '-').toLowerCase() || patient.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Ficha baixada!",
      description: "A ficha do paciente foi salva no seu dispositivo.",
    });
  };

  const steps = [
    { id: 1, name: 'Cadastro', icon: Users },
    { id: 2, name: 'Consulta', icon: FileText },
    { id: 3, name: 'ANVISA', icon: CheckCircle },
    { id: 4, name: 'Compra', icon: Package },
    { id: 5, name: 'Acompanhamento', icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-2xl">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Painel de Pacientes</h1>
              <p className="text-emerald-100 text-sm sm:text-base lg:text-lg">Acompanhe a jornada completa de cada paciente</p>
            </div>
            <Link href="/medico/centro-medico">
              <Button className="w-full sm:w-auto bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-4 sm:px-6 min-h-[44px] text-sm sm:text-base">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Voltar ao Centro Médico
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {isLoading ? (
          <div className="text-center py-12 sm:py-20">
            <div className="text-gray-400 text-base sm:text-lg">Carregando pacientes...</div>
          </div>
        ) : !patients || patients.length === 0 ? (
          <Card className="border-0 shadow-2xl rounded-2xl sm:rounded-3xl">
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Nenhum paciente encontrado</h3>
              <p className="text-sm sm:text-base text-gray-500">Os pacientes aparecerão aqui quando forem cadastrados</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {patients.map((patient: any) => {
                const timeInfo = getTimeInfo(patient.lastActivityDate);
                const statusColor = getStatusColor(patient.currentStage);
                const statusLabel = getStatusLabel(patient.currentStage);
                
                return (
                  <Card 
                    key={patient.id} 
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white overflow-hidden rounded-2xl sm:rounded-3xl"
                    data-testid={`card-patient-${patient.id}`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 sm:p-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate" data-testid={`text-patient-name-${patient.id}`}>
                              {patient.user?.fullName || `Paciente #${patient.id}`}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              {patient.user?.email || 'Sem email'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Badge className={`${statusColor} text-xs sm:text-sm px-2 sm:px-3 py-1 mb-3 sm:mb-4`}>
                        {statusLabel}
                      </Badge>

                      <Button 
                        onClick={() => isMobile ? downloadPatientFile(patient) : setSelectedPatient(patient)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] text-sm sm:text-base"
                        data-testid={`button-view-patient-${patient.id}`}
                      >
                        {isMobile ? <Download className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {isMobile ? 'Baixar Ficha' : 'Ver Ficha Completa'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Modal com Ficha Completa */}
            {selectedPatient && (
              <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl lg:text-2xl flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <span className="truncate">{selectedPatient.user?.fullName || `Paciente #${selectedPatient.id}`}</span>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
                    {/* Informações Básicas */}
                    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-blue-100 shadow-lg">
                      <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Informações de Contato</h4>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl">
                          <span className="text-xs sm:text-sm font-semibold text-gray-600 sm:min-w-[120px]">Email:</span>
                          <span className="text-xs sm:text-sm text-gray-900 break-all">{selectedPatient.user?.email}</span>
                        </div>
                        {selectedPatient.user?.phone && (
                          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl">
                            <span className="text-xs sm:text-sm font-semibold text-gray-600 sm:min-w-[120px]">Telefone:</span>
                            <span className="text-xs sm:text-sm text-gray-900">{selectedPatient.user.phone}</span>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl">
                          <span className="text-xs sm:text-sm font-semibold text-gray-600 sm:min-w-[120px]">Última atividade:</span>
                          <span className="text-xs sm:text-sm text-gray-900">{getTimeInfo(selectedPatient.lastActivityDate)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl">
                          <span className="text-xs sm:text-sm font-semibold text-gray-600 sm:min-w-[120px]">Cadastrado em:</span>
                          <span className="text-xs sm:text-sm text-gray-900">
                            {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Jornada do Paciente */}
                    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-emerald-100 shadow-lg">
                      <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Jornada do Paciente</h4>
                      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                        <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl min-w-max sm:min-w-0">
                          {steps.map((step, idx) => {
                          // Check if step is completed based on actual data
                          let isCompleted = false;
                          
                          if (step.id === 1) {
                            // Cadastro always completed if patient exists
                            isCompleted = true;
                          } else if (step.id === 2) {
                            // Consulta completed if has prescription
                            isCompleted = !!selectedPatient.flags?.prescriptionUrl;
                          } else if (step.id === 3) {
                            // ANVISA completed if has ANVISA document
                            isCompleted = !!selectedPatient.flags?.anvisaDocumentUrl;
                          } else if (step.id === 4) {
                            // Compra completed if can purchase
                            isCompleted = !!selectedPatient.flags?.canPurchase;
                          } else if (step.id === 5) {
                            // Acompanhamento if delivered
                            isCompleted = selectedPatient.currentStage === 'entregue' || selectedPatient.currentStage === 'finalizado';
                          }
                          
                          const isCurrent = step.id === getJourneyStep(selectedPatient.currentStage);
                          
                          return (
                            <div key={step.id} className="flex items-center">
                              <div className="flex flex-col items-center">
                                <div className={`
                                  p-2 sm:p-3 rounded-full transition-all shadow-md
                                  ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-200' : 'bg-gray-200'}
                                  ${isCurrent ? 'ring-2 sm:ring-4 ring-emerald-300 scale-105 sm:scale-110' : ''}
                                `}>
                                  <step.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                                <span className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center font-medium whitespace-nowrap ${isCompleted ? 'text-emerald-700' : 'text-gray-500'}`}>
                                  {step.name}
                                </span>
                              </div>
                              {idx < steps.length - 1 && (
                                <div className={`h-1 w-6 sm:w-8 mx-1 sm:mx-2 rounded-full ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gray-200'}`}></div>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    </div>

                    {/* Dados Pessoais */}
                    {selectedPatient.intakeInfo && (selectedPatient.intakeInfo.idade || selectedPatient.intakeInfo.peso) && (
                      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-amber-100 shadow-lg">
                        <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Dados Pessoais</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {selectedPatient.intakeInfo.idade && (
                            <div className="flex items-center gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl">
                              <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs text-amber-600 font-medium">Idade</p>
                                <p className="font-bold text-amber-900 text-base sm:text-lg">{selectedPatient.intakeInfo.idade} anos</p>
                              </div>
                            </div>
                          )}
                          {selectedPatient.intakeInfo.peso && (
                            <div className="flex items-center gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl">
                              <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                                <Weight className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs text-amber-600 font-medium">Peso</p>
                                <p className="font-bold text-amber-900 text-base sm:text-lg">{selectedPatient.intakeInfo.peso} kg</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Condições de Saúde */}
                    {selectedPatient.intakeInfo?.patologias && selectedPatient.intakeInfo.patologias.length > 0 && (
                      <div className="bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-red-100 shadow-lg">
                        <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Condições de Saúde</h4>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {selectedPatient.intakeInfo.patologias.map((patologia: string, idx: number) => (
                            <Badge key={idx} className="bg-white/80 backdrop-blur-sm text-red-800 border-2 border-red-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold">
                              <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              {patologia}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sintomas */}
                    {selectedPatient.intakeInfo?.sintomas && selectedPatient.intakeInfo.sintomas.length > 0 && (
                      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-indigo-100 shadow-lg">
                        <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Sintomas</h4>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {selectedPatient.intakeInfo.sintomas.map((sintoma: string, idx: number) => (
                            <Badge key={idx} className="bg-white/80 backdrop-blur-sm text-purple-800 border-2 border-purple-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold">
                              <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              {sintoma}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documentos */}
                    {(selectedPatient.flags?.prescriptionUrl || selectedPatient.flags?.anvisaDocumentUrl) && (
                      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-purple-100 shadow-lg">
                        <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Documentos</h4>
                        <div className="space-y-3 sm:space-y-4">
                          {selectedPatient.flags?.prescriptionUrl && (
                            <div className="bg-white/80 backdrop-blur-sm border-2 border-emerald-200 p-3 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-md transition-all">
                              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex-shrink-0">
                                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-emerald-900 text-sm sm:text-base lg:text-lg truncate">Receita Médica</p>
                                  <p className="text-xs sm:text-sm text-emerald-600">
                                    {selectedPatient.flags?.prescriptionValidated ? '✓ Validada' : '⏳ Em análise'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${selectedPatient.flags?.prescriptionValidated ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'} text-xs sm:text-sm`}>
                                  {selectedPatient.flags?.prescriptionValidated ? 'Aprovada' : 'Em análise'}
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => window.open(selectedPatient.flags.prescriptionUrl, '_blank')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
                                  data-testid="button-view-prescription"
                                >
                                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Ver
                                </Button>
                                {selectedPatient.flags?.prescriptionValidated ? (
                                  <Button
                                    size="sm"
                                    onClick={() => rejectPrescriptionMutation.mutate(selectedPatient.id)}
                                    disabled={rejectPrescriptionMutation.isPending}
                                    variant="outline"
                                    className="border-2 border-red-500 text-red-600 hover:bg-red-50 min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
                                    data-testid="button-reject-prescription"
                                  >
                                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    {rejectPrescriptionMutation.isPending ? 'Reprovando...' : 'Reprovar'}
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => approvePrescriptionMutation.mutate(selectedPatient.id)}
                                      disabled={approvePrescriptionMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
                                      data-testid="button-approve-prescription"
                                    >
                                      <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      {approvePrescriptionMutation.isPending ? 'Aprovando...' : 'Aprovar'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => rejectPrescriptionMutation.mutate(selectedPatient.id)}
                                      disabled={rejectPrescriptionMutation.isPending}
                                      variant="outline"
                                      className="border-2 border-red-500 text-red-600 hover:bg-red-50 min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
                                      data-testid="button-reject-prescription"
                                    >
                                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      {rejectPrescriptionMutation.isPending ? 'Reprovando...' : 'Reprovar'}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedPatient.flags?.anvisaDocumentUrl && (
                            <div className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 p-3 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-md transition-all">
                              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex-shrink-0">
                                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-blue-900 text-sm sm:text-base lg:text-lg truncate">Autorização ANVISA</p>
                                  <p className="text-xs sm:text-sm text-blue-600">
                                    {selectedPatient.flags?.anvisaDocumentValidated ? '✓ Validada' : '⏳ Em análise'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${selectedPatient.flags?.anvisaDocumentValidated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} text-xs sm:text-sm`}>
                                  {selectedPatient.flags?.anvisaDocumentValidated ? 'Aprovada' : 'Em análise'}
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => window.open(selectedPatient.flags.anvisaDocumentUrl, '_blank')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
                                  data-testid="button-view-anvisa"
                                >
                                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Ver
                                </Button>
                                {selectedPatient.flags?.anvisaDocumentValidated ? (
                                  <Button
                                    size="sm"
                                    onClick={() => rejectAnvisaMutation.mutate(selectedPatient.id)}
                                    disabled={rejectAnvisaMutation.isPending}
                                    variant="outline"
                                    className="border-2 border-red-500 text-red-600 hover:bg-red-50 min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
                                    data-testid="button-reject-anvisa"
                                  >
                                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    {rejectAnvisaMutation.isPending ? 'Reprovando...' : 'Reprovar'}
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => approveAnvisaMutation.mutate(selectedPatient.id)}
                                      disabled={approveAnvisaMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
                                      data-testid="button-approve-anvisa"
                                    >
                                      <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      {approveAnvisaMutation.isPending ? 'Aprovando...' : 'Aprovar'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => rejectAnvisaMutation.mutate(selectedPatient.id)}
                                      disabled={rejectAnvisaMutation.isPending}
                                      variant="outline"
                                      className="border-2 border-red-500 text-red-600 hover:bg-red-50 min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm"
                                      data-testid="button-reject-anvisa"
                                    >
                                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      {rejectAnvisaMutation.isPending ? 'Reprovando...' : 'Reprovar'}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
