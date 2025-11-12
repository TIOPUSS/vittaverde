import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, Calendar, FileText, User, Clock, Filter,
  ArrowLeft, Search, Eye, Download, TrendingUp
} from "lucide-react";

interface HistoryEntry {
  id: string;
  type: "consultation" | "prescription" | "treatment";
  patient: {
    name: string;
    email: string;
  };
  date: string;
  status: string;
  details: string;
  notes?: string;
}

export default function HistoricoMedico() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("30-dias");

  // Fetch real data from API
  const { data: consultations = [], isLoading: consultationsLoading } = useQuery({
    queryKey: ["/api/consultations/history"],
    retry: false,
  });

  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["/api/prescriptions/history"],
    retry: false,
  });

  const { data: treatments = [], isLoading: treatmentsLoading } = useQuery({
    queryKey: ["/api/treatments/history"],
    retry: false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "active": return "bg-green-100 text-green-800";
      case "ongoing": return "bg-blue-100 text-blue-800";
      case "renewal_needed": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Concluída";
      case "active": return "Ativa";
      case "ongoing": return "Em andamento";
      case "renewal_needed": return "Renovação necessária";
      case "cancelled": return "Cancelada";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/medico">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Histórico Médico</h1>
              <p className="text-gray-600 mt-1">Consultas, prescrições e acompanhamento de tratamentos</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar no histórico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
                data-testid="input-search-history"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="flex space-x-2">
              {[
                { id: "7-dias", label: "7 dias" },
                { id: "30-dias", label: "30 dias" },
                { id: "90-dias", label: "90 dias" },
                { id: "1-ano", label: "1 ano" }
              ].map((period) => (
                <Button
                  key={period.id}
                  variant={selectedPeriod === period.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.id)}
                  data-testid={`period-${period.id}`}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">127</div>
              <div className="text-sm text-gray-600">Total Consultas</div>
              <div className="text-xs text-green-600 mt-1">+12% este mês</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">89</div>
              <div className="text-sm text-gray-600">Prescrições Emitidas</div>
              <div className="text-xs text-green-600 mt-1">+8% este mês</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">94%</div>
              <div className="text-sm text-gray-600">Taxa de Sucesso</div>
              <div className="text-xs text-green-600 mt-1">+2% este mês</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">42</div>
              <div className="text-sm text-gray-600">Tratamentos Ativos</div>
              <div className="text-xs text-gray-500 mt-1">estáveis</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="consultations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consultations" data-testid="tab-consultations">
              <Calendar className="h-4 w-4 mr-2" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="prescriptions" data-testid="tab-prescriptions">
              <FileText className="h-4 w-4 mr-2" />
              Prescrições
            </TabsTrigger>
            <TabsTrigger value="treatments" data-testid="tab-treatments">
              <Activity className="h-4 w-4 mr-2" />
              Tratamentos
            </TabsTrigger>
          </TabsList>

          {/* Consultations Tab */}
          <TabsContent value="consultations">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consultations.map((consultation: any) => (
                    <div key={consultation.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{consultation.patient.name}</h3>
                            <p className="text-sm text-gray-500">{consultation.patient.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(consultation.status)}>
                            {getStatusText(consultation.status)}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(consultation.date).toLocaleDateString('pt-BR')} às {new Date(consultation.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Tipo:</span>
                          <p>{consultation.type} ({consultation.duration})</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Diagnóstico:</span>
                          <p>{consultation.diagnosis}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Tratamento:</span>
                          <p>{consultation.treatment}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-3">
                        <Button size="sm" variant="outline" data-testid={`view-consultation-${consultation.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Prescrições</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescriptions.map((prescription: any) => (
                    <div key={prescription.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{prescription.patient.name}</h3>
                            <p className="text-sm text-gray-500">{prescription.product}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(prescription.status)}>
                            {getStatusText(prescription.status)}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(prescription.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Dosagem:</span>
                          <p>{prescription.dosage}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Duração:</span>
                          <p>{prescription.duration}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Indicação:</span>
                          <p>{prescription.indication}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-3">
                        <Button size="sm" variant="outline" data-testid={`view-prescription-${prescription.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Prescrição
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatments Tab */}
          <TabsContent value="treatments">
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento de Tratamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {treatments.map((treatment: any) => (
                    <div key={treatment.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Activity className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{treatment.patient.name}</h3>
                            <p className="text-sm text-gray-500">{treatment.product}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(treatment.status)}>
                            {getStatusText(treatment.status)}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            Desde {new Date(treatment.startDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Melhoras:</span>
                          <p className="text-green-600">{treatment.improvements}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Efeitos Colaterais:</span>
                          <p>{treatment.sideEffects}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Aderência:</span>
                          <p>{treatment.compliance}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-3">
                        <Button size="sm" variant="outline" data-testid={`view-treatment-${treatment.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Evolução
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}