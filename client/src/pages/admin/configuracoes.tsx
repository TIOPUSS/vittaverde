import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  MessageSquare, Key, Phone, Webhook, CheckCircle, AlertCircle, 
  Copy, Zap, Code, Database, ShoppingCart, 
  Users, FileText, Activity, Package, Video, Link as LinkIcon, Mail, Plus, Trash2, Shield
} from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

const whatsappConfigSchema = z.object({
  businessAccountId: z.string().optional(),
  phoneNumberId: z.string().optional(),
  phoneNumber: z.string().optional(),
  accessToken: z.string().optional(),
  verifyToken: z.string().optional(),
  appId: z.string().optional(),
  appSecret: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(false),
  notes: z.string().optional(),
});

const telemedicineConfigSchema = z.object({
  integrationType: z.enum(['redirect', 'api']).default('redirect'),
  redirectUrl: z.string().optional(),
  redirectLinks: z.array(z.object({
    name: z.string(),
    url: z.string()
  })).optional(),
  apiEndpoint: z.string().optional(),
  apiKey: z.string().optional(),
  apiConfig: z.record(z.any()).optional(),
  isActive: z.boolean().default(false),
  notes: z.string().optional(),
});

type WhatsappConfigForm = z.infer<typeof whatsappConfigSchema>;
type TelemedicineConfigForm = z.infer<typeof telemedicineConfigSchema>;

// Partner Consultations Manager Component
function PartnerConsultationsManager() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['/api/admin/partner-consultations'],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/partner-consultations/${id}/approve`, 'POST');
      if (!response.ok) throw new Error('Failed to approve');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partner-consultations'] });
      toast({ title: "Aprovado!", description: "Consulta aprovada. Produtos liberados para o paciente." });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/partner-consultations/${id}/reject`, 'POST');
      if (!response.ok) throw new Error('Failed to reject');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partner-consultations'] });
      toast({ title: "Rejeitado", description: "Consulta rejeitada.", variant: "destructive" });
    },
  });

  const consultationsList = (consultations as any)?.consultations || [];
  const filteredConsultations = statusFilter === 'all'
    ? consultationsList
    : consultationsList.filter((c: any) => c.status === statusFilter);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    };
    return (
      <Badge className={`${styles[status as keyof typeof styles]} border font-medium`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Carregando consultas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80">
      <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-t-xl">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultas Recebidas via Webhook
          </span>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {filteredConsultations.length} consultas
          </Badge>
        </CardTitle>
        <CardDescription className="text-white/90">
          Consultas enviadas pelos parceiros via webhook
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'bg-violet-600' : ''}
            >
              {status === 'all' ? 'Todas' : status === 'pending' ? 'Pendentes' : status === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
            </Button>
          ))}
        </div>

        {filteredConsultations.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma consulta encontrada
            </h3>
            <p className="text-gray-600 text-sm">
              {statusFilter === 'all' 
                ? 'Nenhuma consulta recebida ainda' 
                : `Nenhuma consulta ${statusFilter === 'pending' ? 'pendente' : statusFilter === 'approved' ? 'aprovada' : 'rejeitada'}`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation: any) => (
              <div
                key={consultation.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{consultation.patientName}</h4>
                    <p className="text-sm text-gray-600">CPF: {consultation.patientCpf}</p>
                  </div>
                  {getStatusBadge(consultation.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Parceiro:</p>
                    <p className="font-medium text-gray-900">{consultation.partnerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Médico:</p>
                    <p className="font-medium text-gray-900">{consultation.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Data Consulta:</p>
                    <p className="font-medium text-gray-900">
                      {new Date(consultation.consultationDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Recebido em:</p>
                    <p className="font-medium text-gray-900">
                      {new Date(consultation.receivedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {consultation.diagnosis && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Diagnóstico:</p>
                    <p className="text-sm text-gray-900">{consultation.diagnosis}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t">
                  {consultation.prescriptionUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(consultation.prescriptionUrl, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Receita
                    </Button>
                  )}

                  {consultation.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => approveMutation.mutate(consultation.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(consultation.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState(false);
  const [activeTab, setActiveTab] = useState("whatsapp");

  const { data: whatsappConfig } = useQuery({ queryKey: ['/api/admin/whatsapp-config'] });
  const { data: telemedicineConfig } = useQuery({ queryKey: ['/api/admin/telemedicine-config'] });

  const whatsappForm = useForm<WhatsappConfigForm>({
    resolver: zodResolver(whatsappConfigSchema),
    values: whatsappConfig || {
      businessAccountId: '', phoneNumberId: '', phoneNumber: '', accessToken: '',
      verifyToken: '', appId: '', appSecret: '', webhookUrl: '', isActive: false, notes: ''
    },
  });

  const telemedicineForm = useForm<TelemedicineConfigForm>({
    resolver: zodResolver(telemedicineConfigSchema),
    values: telemedicineConfig || {
      integrationType: 'redirect', redirectUrl: '', redirectLinks: [], apiEndpoint: '',
      apiKey: '', apiConfig: {}, isActive: false, notes: ''
    },
  });

  const [links, setLinks] = useState<Array<{name: string; url: string}>>([]);

  // Sincronizar links quando telemedicineConfig carrega
  useEffect(() => {
    if (telemedicineConfig?.redirectLinks) {
      setLinks(telemedicineConfig.redirectLinks);
    }
  }, [telemedicineConfig]);

  const addLink = () => {
    const newLinks = [...links, { name: '', url: '' }];
    setLinks(newLinks);
    telemedicineForm.setValue('redirectLinks', newLinks);
  };

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
    telemedicineForm.setValue('redirectLinks', newLinks);
  };

  const updateLink = (index: number, field: 'name' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
    telemedicineForm.setValue('redirectLinks', newLinks);
  };

  const updateWhatsappMutation = useMutation({
    mutationFn: async (data: WhatsappConfigForm) => {
      const response = await apiRequest('/api/admin/whatsapp-config', 'POST', data);
      if (!response.ok) throw new Error('Failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whatsapp-config'] });
      toast({ title: "Salvo!", description: "Configurações do WhatsApp atualizadas." });
    },
  });

  const updateTelemedicineMutation = useMutation({
    mutationFn: async (data: TelemedicineConfigForm) => {
      const response = await apiRequest('/api/admin/telemedicine-config', 'POST', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/telemedicine-config'] });
      toast({ title: "Salvo!", description: "Configurações de Telemedicina atualizadas." });
    },
    onError: (error: Error) => {
      console.error('Error saving telemedicine config:', error);
      toast({ 
        title: "Erro ao salvar", 
        description: error.message || "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado` });
  };

  const baseUrl = window.location.origin;
  const integrationType = telemedicineForm.watch('integrationType');

  const n8nEndpoints = [
    { method: "GET", path: "/api/n8n/clients", description: "Listar clientes", icon: Users, color: "text-blue-600" },
    { method: "GET", path: "/api/n8n/client/:id", description: "Cliente por ID", icon: Users, color: "text-blue-600" },
    { method: "GET", path: "/api/n8n/client-by-phone/:phone", description: "Cliente por telefone", icon: Phone, color: "text-green-600" },
    { method: "GET", path: "/api/n8n/leads", description: "Listar leads", icon: FileText, color: "text-indigo-600" },
    { method: "POST", path: "/api/n8n/create-lead", description: "Criar lead", icon: FileText, color: "text-indigo-600" },
    { method: "PATCH", path: "/api/n8n/update-lead/:id", description: "Atualizar lead", icon: FileText, color: "text-indigo-600" },
    { method: "GET", path: "/api/n8n/orders", description: "Listar pedidos", icon: ShoppingCart, color: "text-purple-600" },
    { method: "GET", path: "/api/n8n/order/:id", description: "Pedido por ID", icon: ShoppingCart, color: "text-purple-600" },
    { method: "GET", path: "/api/n8n/products", description: "Listar produtos", icon: Package, color: "text-orange-600" },
    { method: "GET", path: "/api/n8n/prescriptions/:clientId", description: "Prescrições", icon: Activity, color: "text-teal-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 pt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Configurações
              </h1>
              <p className="text-gray-600 text-lg">WhatsApp, Email, SMS, Telemedicina, N8N, Parceiros SSO</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-3 overflow-x-auto">
            <TabsList className="grid w-full grid-cols-7 gap-3 bg-transparent p-0 min-h-[80px]">
              <TabsTrigger 
                value="whatsapp" 
                className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:text-gray-600"
              >
                <MessageSquare className="h-7 w-7 flex-shrink-0" />
                <span className="text-xs font-bold leading-tight text-center">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:text-gray-600"
              >
                <Mail className="h-7 w-7 flex-shrink-0" />
                <span className="text-xs font-bold leading-tight text-center">Email</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sms" 
                className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:text-gray-600"
              >
                <Phone className="h-7 w-7 flex-shrink-0" />
                <span className="text-xs font-bold leading-tight text-center">SMS</span>
              </TabsTrigger>
              <TabsTrigger 
                value="telemedicina" 
                className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:text-gray-600"
              >
                <Video className="h-7 w-7 flex-shrink-0" />
                <span className="text-xs font-bold leading-tight text-center">Telemedicina</span>
              </TabsTrigger>
              <TabsTrigger 
                value="parceiros" 
                className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:text-gray-600"
              >
                <Shield className="h-7 w-7 flex-shrink-0" />
                <span className="text-xs font-bold leading-tight text-center">Parceiros SSO</span>
              </TabsTrigger>
              <TabsTrigger 
                value="consultas" 
                className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:text-gray-600"
              >
                <FileText className="h-7 w-7 flex-shrink-0" />
                <span className="text-xs font-bold leading-tight text-center">Consultas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="api-docs" 
                className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:hover:bg-gray-50 data-[state=inactive]:text-gray-600"
              >
                <Code className="h-7 w-7 flex-shrink-0" />
                <span className="text-xs font-bold leading-tight text-center">API</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="whatsapp" className="space-y-6">
            <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <MessageSquare className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-900">
                <strong>WhatsApp Business API</strong> - Configure credenciais ou N8N
              </AlertDescription>
            </Alert>

            <form onSubmit={whatsappForm.handleSubmit((data) => updateWhatsappMutation.mutate(data))}>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-xl bg-white/80">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-xl">
                    <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Credenciais Meta</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div><Label>App ID</Label><Input {...whatsappForm.register('appId')} className="mt-1" /></div>
                    <div><Label>App Secret</Label><Input type={showSecrets ? "text" : "password"} {...whatsappForm.register('appSecret')} className="mt-1" /></div>
                    <div><Label>Verify Token</Label><Input type={showSecrets ? "text" : "password"} {...whatsappForm.register('verifyToken')} className="mt-1" /></div>
                    <div className="flex items-center gap-2"><Switch checked={showSecrets} onCheckedChange={setShowSecrets} /><Label>Mostrar</Label></div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-white/80">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl">
                    <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" />WhatsApp Business</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div><Label>Business Account ID</Label><Input {...whatsappForm.register('businessAccountId')} className="mt-1" /></div>
                    <div><Label>Phone Number ID</Label><Input {...whatsappForm.register('phoneNumberId')} className="mt-1" /></div>
                    <div><Label>Número</Label><Input {...whatsappForm.register('phoneNumber')} className="mt-1" /></div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6 border-0 shadow-xl bg-white/80">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" />N8N Webhook</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div><Label>Webhook URL</Label><Input {...whatsappForm.register('webhookUrl')} placeholder="https://n8n.cloud/webhook/..." className="mt-1" /></div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <Switch checked={whatsappForm.watch('isActive')} onCheckedChange={(v) => whatsappForm.setValue('isActive', v)} />
                    <Label>Ativar</Label>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CheckCircle className="h-4 w-4 mr-2" />Salvar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Alert className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <Mail className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-sm text-emerald-900">
                <strong>Configuração de Email</strong> - Microsoft 365 ou SMTP para envio de emails transacionais
              </AlertDescription>
            </Alert>

            <Card className="border-0 shadow-xl bg-white/80">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configuração Completa de Email
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  Configure Microsoft 365 ou servidor SMTP customizado
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-6">
                  A configuração de email requer múltiplos campos e opções. Acesse a página dedicada para configurar completamente.
                </p>
                
                <a href="/admin/email-config" className="inline-block">
                  <Button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700">
                    <Mail className="h-4 w-4 mr-2" />
                    Configurar Email Completo
                  </Button>
                </a>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📧 O que você pode configurar:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Microsoft 365 (Azure AD) - Recomendado</li>
                    <li>✓ SMTP Customizado (Gmail, SendGrid, etc)</li>
                    <li>✓ Email remetente e nome de exibição</li>
                    <li>✓ Teste de envio de email</li>
                    <li>✓ Ativar/desativar envio automático</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms" className="space-y-6">
            <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
              <Phone className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-900">
                <strong>Configuração de SMS</strong> - Twilio para envio de mensagens SMS de verificação
              </AlertDescription>
            </Alert>

            <Card className="border-0 shadow-xl bg-white/80">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Configuração Completa de SMS
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Configure Twilio para enviar códigos de verificação por SMS
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-6">
                  A configuração de SMS permite enviar códigos de verificação por mensagem de texto. Acesse a página dedicada para configurar completamente.
                </p>
                
                <a href="/admin/sms-config" className="inline-block">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700">
                    <Phone className="h-4 w-4 mr-2" />
                    Configurar SMS Completo
                  </Button>
                </a>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📱 O que você pode configurar:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Twilio Account SID</li>
                    <li>✓ Twilio Auth Token</li>
                    <li>✓ Número de telefone remetente</li>
                    <li>✓ Teste de envio de SMS</li>
                    <li>✓ Ativar/desativar SMS (exclusivo com Email)</li>
                  </ul>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-900">
                    <strong>⚠️ Importante:</strong> Apenas <strong>Email OU SMS</strong> pode estar ativo por vez. Ao ativar SMS, o Email será desativado automaticamente e vice-versa.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telemedicina" className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Telemedicina</h2>
                    <p className="text-blue-100">Configure múltiplos links de agendamento</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={telemedicineForm.handleSubmit(
              (data) => {
                console.log('✅ SUBMIT VÁLIDO - Dados enviados:', data);
                toast({ title: "Enviando...", description: "Salvando configurações..." });
                updateTelemedicineMutation.mutate(data);
              },
              (errors) => {
                console.error('❌ ERRO DE VALIDAÇÃO:', errors);
                toast({ 
                  title: "Erro de validação", 
                  description: "Verifique os campos do formulário",
                  variant: "destructive" 
                });
              }
            )} className="space-y-6">
              <Card className="border-0 shadow-2xl bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white pb-8">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <LinkIcon className="h-6 w-6" />
                    Links de Agendamento
                  </CardTitle>
                  <CardDescription className="text-blue-50 text-base">
                    Adicione múltiplos links que aparecerão na página Bem-Estar
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                  {integrationType === 'redirect' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <LinkIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Total de Links</p>
                            <p className="text-sm text-gray-600">{links.length} {links.length === 1 ? 'link configurado' : 'links configurados'}</p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          size="lg"
                          onClick={addLink}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
                          data-testid="button-add-link"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Adicionar Link
                        </Button>
                      </div>
                      
                      {links.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="inline-flex p-6 bg-blue-100 rounded-full mb-4">
                            <LinkIcon className="h-12 w-12 text-blue-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum link configurado</h3>
                          <p className="text-gray-600 mb-6">Clique em "Adicionar Link" para criar seu primeiro link de agendamento</p>
                        </div>
                      ) : (
                        <div className="grid gap-6">
                          {links.map((link, index) => (
                            <div 
                              key={index} 
                              className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full -mr-16 -mt-16"></div>
                              
                              <div className="relative p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                                      <span className="text-xl font-bold text-white">{index + 1}</span>
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900 text-lg">Link {index + 1}</p>
                                      <p className="text-sm text-gray-500">Configure nome e URL</p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    size="lg"
                                    variant="ghost"
                                    onClick={() => removeLink(index)}
                                    className="h-12 w-12 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                                    data-testid={`button-remove-link-${index}`}
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                      Nome do Link
                                    </Label>
                                    <Input
                                      value={link.name}
                                      onChange={(e) => updateLink(index, 'name', e.target.value)}
                                      placeholder="Ex: Consulta Geral"
                                      className="h-12 text-base border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                                      data-testid={`input-link-name-${index}`}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                      <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full"></span>
                                      URL Completa
                                    </Label>
                                    <Input
                                      value={link.url}
                                      onChange={(e) => updateLink(index, 'url', e.target.value)}
                                      placeholder="https://agendamento.exemplo.com"
                                      className="h-12 text-base border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                                      data-testid={`input-link-url-${index}`}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-900">
                          <strong>Importante:</strong> Os links aparecerão como botões na página de Bem-Estar com os nomes que você configurar aqui.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <div className="mt-6 space-y-3">
                    <Label className="text-base font-semibold text-gray-700">Notas Administrativas (Opcional)</Label>
                    <Textarea 
                      {...telemedicineForm.register('notes')} 
                      rows={4} 
                      placeholder="Informações internas sobre a configuração..."
                      className="border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base"
                    />
                  </div>

                  <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                    <div className="flex items-center gap-4">
                      <Switch 
                        checked={telemedicineForm.watch('isActive')} 
                        onCheckedChange={(v) => telemedicineForm.setValue('isActive', v)}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <div className="flex-1">
                        <Label className="text-lg font-bold text-green-900 cursor-pointer">Ativar Telemedicina</Label>
                        <p className="text-sm text-green-700 mt-1">
                          {telemedicineForm.watch('isActive') 
                            ? '✅ Botões visíveis na página Bem-Estar' 
                            : '⚠️ Desativado - mostrará "Em Breve"'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={updateTelemedicineMutation.isPending}
                  className="group relative flex-1 h-16 text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 text-white shadow-2xl rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 overflow-hidden"
                  onClick={(e) => {
                    console.log('🖱️ BOTÃO CLICADO!');
                    const button = e.currentTarget;
                    button.classList.add('animate-pulse');
                    setTimeout(() => button.classList.remove('animate-pulse'), 1000);
                  }}
                  data-testid="button-save-telemedicine"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="relative z-10 flex items-center justify-center">
                    {updateTelemedicineMutation.isPending ? (
                      <>
                        <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full mr-3"></div>
                        <span className="animate-pulse">Salvando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-7 w-7 mr-3 group-hover:animate-bounce" />
                        Salvar Configurações
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="parceiros" className="space-y-6">
            <Alert className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
              <Shield className="h-4 w-4 text-teal-600" />
              <AlertDescription className="text-sm text-teal-900">
                <strong>Parceiros SSO</strong> - Configure médicos parceiros para login automático
              </AlertDescription>
            </Alert>

            <Card className="border-0 shadow-xl bg-white/80">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Single Sign-On (SSO) com Parceiros
                </CardTitle>
                <CardDescription className="text-white/90">
                  Sistema de login automático para médicos parceiros usando JWT
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                    <h3 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Como Funciona
                    </h3>
                    <ul className="space-y-2 text-sm text-teal-800">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">1.</span>
                        <span>Admin configura médico parceiro com URL e chave secreta</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">2.</span>
                        <span>Paciente vê card do parceiro no dashboard</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">3.</span>
                        <span>Ao clicar, sistema gera JWT com dados do paciente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">4.</span>
                        <span>Redireciona para plataforma do parceiro com login automático</span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Dados Enviados no JWT</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>✓ Nome completo</li>
                        <li>✓ CPF</li>
                        <li>✓ Email</li>
                        <li>✓ Data de nascimento</li>
                        <li>✓ Telefone</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Recursos de Segurança</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>✓ JWT assinado com secret</li>
                        <li>✓ Token expira (5-120 min)</li>
                        <li>✓ Logs de auditoria</li>
                        <li>✓ Webhooks opcionais</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Link href="/admin/partner-integrations">
                    <Button 
                      size="lg"
                      className="w-full h-16 text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-xl rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
                    >
                      <Shield className="h-6 w-6 mr-3" />
                      Gerenciar Parceiros SSO
                    </Button>
                  </Link>
                  <p className="text-center text-sm text-gray-500 mt-3">
                    Configure médicos parceiros, URLs, chaves secretas e muito mais
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultas" className="space-y-6">
            <Alert className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
              <FileText className="h-4 w-4 text-violet-600" />
              <AlertDescription className="text-sm text-violet-900">
                <strong>Consultas Recebidas</strong> - Visualize e aprove consultas enviadas via webhook pelos parceiros
              </AlertDescription>
            </Alert>

            <PartnerConsultationsManager />
          </TabsContent>

          <TabsContent value="api-docs" className="space-y-6">
            <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <Code className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-900">
                <strong>Documentação da API</strong> - Webhooks de Parceiros e Integração N8N
              </AlertDescription>
            </Alert>

            {/* WEBHOOK PARCEIROS */}
            <Card className="border-0 shadow-xl bg-white/80">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook de Parceiros (Consultas Médicas)
                </CardTitle>
                <CardDescription className="text-white/90">
                  Envie dados de consultas e receitas para VittaVerde
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Endpoint */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Endpoint
                  </h3>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-700">POST</span>
                    <code className="flex-1 text-sm font-mono text-gray-700">{baseUrl}/api/partner/webhook/{'{partnerId}'}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(`${baseUrl}/api/partner/webhook/{partnerId}`, 'Webhook URL')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Substitua <code className="bg-gray-100 px-1 rounded">{'{partnerId}'}</code> pelo ID do parceiro configurado na aba "Parceiros SSO"
                  </p>
                </div>

                {/* Payload JSON */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">📋 Formato do Payload (JSON)</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-green-400 font-mono">{`{
  "clientCpf": "12345678900",
  "consultationDate": "2025-11-10T15:30:00Z",
  "doctorName": "Dr. João Silva",
  "doctorCrm": "12345/SP",
  "specialization": "Neurologia",
  "diagnosis": "Ansiedade crônica",
  "observations": "Paciente relata insônia",
  
  // OPÇÃO 1: URL da receita
  "prescriptionUrl": "https://parceiro.com/receitas/123.pdf",
  
  // OPÇÃO 2: Arquivo em Base64
  "prescriptionBase64": "JVBERi0xLjQKJeL...",
  "prescriptionFileName": "receita-joao.pdf"
}`}</pre>
                  </div>
                </div>

                {/* Segurança HMAC */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">🔐 Segurança (HMAC SHA-256)</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                    <p className="text-sm text-yellow-900">
                      <strong>Header obrigatório:</strong> <code className="bg-yellow-100 px-1 rounded">X-Webhook-Signature</code>
                    </p>
                  </div>
                  
                  {/* Exemplo Python */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">Exemplo em Python:</h4>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-green-400 font-mono">{`import hmac
import hashlib
import json

# Seu shared secret (configurado no admin)
SHARED_SECRET = "seu_segredo_compartilhado"

# Dados da consulta
payload = {
    "clientCpf": "12345678900",
    "consultationDate": "2025-11-10T15:30:00Z",
    "doctorName": "Dr. João Silva",
    # ... resto dos dados
}

# Gerar assinatura
payload_json = json.dumps(payload)
signature = hmac.new(
    SHARED_SECRET.encode(),
    payload_json.encode(),
    hashlib.sha256
).hexdigest()

# Enviar no header
headers = {
    "Content-Type": "application/json",
    "X-Webhook-Signature": signature
}`}</pre>
                    </div>

                    {/* Exemplo JavaScript */}
                    <h4 className="text-sm font-semibold text-gray-700 mt-4">Exemplo em JavaScript/Node.js:</h4>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-green-400 font-mono">{`const crypto = require('crypto');

const SHARED_SECRET = "seu_segredo_compartilhado";

const payload = {
    clientCpf: "12345678900",
    consultationDate: "2025-11-10T15:30:00Z",
    doctorName: "Dr. João Silva",
    // ... resto dos dados
};

// Gerar assinatura
const payloadJson = JSON.stringify(payload);
const signature = crypto
    .createHmac('sha256', SHARED_SECRET)
    .update(payloadJson)
    .digest('hex');

// Enviar requisição
fetch('https://vittaverde.com/api/partner/webhook/{partnerId}', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
    },
    body: payloadJson
});`}</pre>
                    </div>
                  </div>
                </div>

                {/* Como enviar arquivos */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">📄 Como Enviar Receitas (PDF)</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Opção 1: URL Direta</h4>
                      <pre className="text-xs bg-blue-900 text-blue-100 p-2 rounded font-mono overflow-x-auto">{`{
  "prescriptionUrl": "https://..."
}`}</pre>
                      <p className="text-xs text-blue-800 mt-2">Sistema salva a URL direto</p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Opção 2: Base64 (Recomendado)</h4>
                      <pre className="text-xs bg-green-900 text-green-100 p-2 rounded font-mono overflow-x-auto">{`{
  "prescriptionBase64": "JVB...",
  "prescriptionFileName": "receita.pdf"
}`}</pre>
                      <p className="text-xs text-green-800 mt-2">Upload automático pro storage</p>
                    </div>
                  </div>
                </div>

                {/* Resposta esperada */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">✅ Resposta Esperada</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-900 mb-2">Sucesso (200):</p>
                    <pre className="text-xs bg-green-900 text-green-100 p-2 rounded font-mono overflow-x-auto">{`{
  "success": true,
  "message": "Consultation received successfully",
  "consultationId": 42,
  "clientId": "abc-123",
  "prescriptionReceived": true
}`}</pre>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                    <p className="text-sm font-semibold text-red-900 mb-2">Erro (400/401/404):</p>
                    <pre className="text-xs bg-red-900 text-red-100 p-2 rounded font-mono overflow-x-auto">{`{
  "success": false,
  "message": "Invalid webhook signature"
}`}</pre>
                  </div>
                </div>

                {/* Testando */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-900 mb-2">🧪 Testando o Webhook</h3>
                  <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
                    <li>Configure um parceiro na aba "Parceiros SSO"</li>
                    <li>Copie o Partner ID e o Shared Secret</li>
                    <li>Use o exemplo de código acima</li>
                    <li>Envie o webhook com um CPF de paciente existente</li>
                    <li>Veja a consulta aparecer na aba "Consultas"</li>
                    <li>Aprove para liberar produtos ao paciente</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* API N8N */}
            <Card className="border-0 shadow-xl bg-white/80">
              <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API N8N (Workflows)
                </CardTitle>
                <CardDescription className="text-white/90">
                  Endpoints para workflows N8N consumirem dados da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {n8nEndpoints.map((ep, i) => {
                    const Icon = ep.icon;
                    return (
                      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                        <div className={`p-2 rounded-lg bg-white shadow-sm ${ep.color}`}><Icon className="h-5 w-5" /></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${ep.method === 'GET' ? 'bg-green-100 text-green-700' : ep.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{ep.method}</span>
                            <code className="text-sm font-mono text-gray-700">{ep.path}</code>
                          </div>
                          <p className="text-sm text-gray-600">{ep.description}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(`${baseUrl}${ep.path}`, ep.description)}><Copy className="h-4 w-4" /></Button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>🔐 Autenticação:</strong> Header <code className="bg-yellow-100 px-1 rounded">X-API-Key: sua_chave</code>
                  </p>
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
