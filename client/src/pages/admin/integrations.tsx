import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  MessageSquare, Key, Phone, Webhook, CheckCircle, AlertCircle, 
  Copy, ExternalLink, Zap, Code, Database, ShoppingCart, 
  Users, FileText, Activity, Package
} from "lucide-react";
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

type WhatsappConfigForm = z.infer<typeof whatsappConfigSchema>;

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState(false);
  const [activeTab, setActiveTab] = useState("official");

  // Get current config
  const { data: config } = useQuery({
    queryKey: ['/api/admin/whatsapp-config'],
  });

  const form = useForm<WhatsappConfigForm>({
    resolver: zodResolver(whatsappConfigSchema),
    values: config || {
      businessAccountId: '',
      phoneNumberId: '',
      phoneNumber: '',
      accessToken: '',
      verifyToken: '',
      appId: '',
      appSecret: '',
      webhookUrl: '',
      isActive: false,
      notes: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: WhatsappConfigForm) => {
      const response = await apiRequest('/api/admin/whatsapp-config', 'POST', data);
      if (!response.ok) throw new Error('Failed to update config');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whatsapp-config'] });
      toast({
        title: "Configuração salva!",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WhatsappConfigForm) => {
    updateMutation.mutate(data);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  const baseUrl = window.location.origin;

  // API Endpoints for N8N
  const n8nEndpoints = [
    {
      method: "GET",
      path: "/api/n8n/clients",
      description: "Listar todos os clientes/pacientes",
      icon: Users,
      color: "text-blue-600"
    },
    {
      method: "GET",
      path: "/api/n8n/client/:id",
      description: "Buscar cliente por ID",
      icon: Users,
      color: "text-blue-600"
    },
    {
      method: "GET",
      path: "/api/n8n/client-by-phone/:phone",
      description: "Buscar cliente por telefone",
      icon: Phone,
      color: "text-green-600"
    },
    {
      method: "GET",
      path: "/api/n8n/orders",
      description: "Listar todos os pedidos",
      icon: ShoppingCart,
      color: "text-purple-600"
    },
    {
      method: "GET",
      path: "/api/n8n/order/:id",
      description: "Buscar pedido por ID",
      icon: ShoppingCart,
      color: "text-purple-600"
    },
    {
      method: "GET",
      path: "/api/n8n/products",
      description: "Listar produtos (filtro: ?category=)",
      icon: Package,
      color: "text-orange-600"
    },
    {
      method: "GET",
      path: "/api/n8n/leads",
      description: "Listar leads do CRM",
      icon: FileText,
      color: "text-indigo-600"
    },
    {
      method: "POST",
      path: "/api/n8n/create-lead",
      description: "Criar novo lead",
      icon: FileText,
      color: "text-indigo-600"
    },
    {
      method: "PATCH",
      path: "/api/n8n/update-lead/:id",
      description: "Atualizar status do lead",
      icon: FileText,
      color: "text-indigo-600"
    },
    {
      method: "GET",
      path: "/api/n8n/prescriptions/:clientId",
      description: "Buscar prescrições do cliente",
      icon: Activity,
      color: "text-teal-600"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Integrações & Automação
              </h1>
              <p className="text-gray-600 text-lg">
                Configure WhatsApp Business API, N8N e outros serviços
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg">
            <TabsTrigger 
              value="official" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-xl transition-all"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              API Oficial WhatsApp
            </TabsTrigger>
            <TabsTrigger 
              value="n8n"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-xl transition-all"
            >
              <Webhook className="h-4 w-4 mr-2" />
              Conexão N8N
            </TabsTrigger>
            <TabsTrigger 
              value="api-docs"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-xl transition-all"
            >
              <Code className="h-4 w-4 mr-2" />
              API N8N
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: API Oficial WhatsApp */}
          <TabsContent value="official" className="space-y-6">
            <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Método 1: API Oficial</strong> - Conecte diretamente à Meta WhatsApp Business API para envio/recebimento de mensagens
              </AlertDescription>
            </Alert>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meta App Card */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-xl">
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Credenciais Meta App
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Configurações do Facebook for Developers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="appId" className="text-sm font-semibold text-gray-700">App ID</Label>
                      <Input
                        id="appId"
                        {...form.register('appId')}
                        placeholder="123456789012345"
                        className="mt-1"
                        data-testid="input-app-id"
                      />
                    </div>

                    <div>
                      <Label htmlFor="appSecret" className="text-sm font-semibold text-gray-700">App Secret</Label>
                      <Input
                        id="appSecret"
                        type={showSecrets ? "text" : "password"}
                        {...form.register('appSecret')}
                        placeholder="••••••••••••••••"
                        className="mt-1"
                        data-testid="input-app-secret"
                      />
                    </div>

                    <div>
                      <Label htmlFor="verifyToken" className="text-sm font-semibold text-gray-700">Verify Token</Label>
                      <Input
                        id="verifyToken"
                        type={showSecrets ? "text" : "password"}
                        {...form.register('verifyToken')}
                        placeholder="seu_token_verificacao"
                        className="mt-1"
                        data-testid="input-verify-token"
                      />
                      <p className="text-xs text-gray-500 mt-1">Token customizado para verificação do webhook</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={showSecrets}
                        onCheckedChange={setShowSecrets}
                        data-testid="toggle-show-secrets"
                      />
                      <Label className="cursor-pointer text-sm">Mostrar credenciais</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* WhatsApp Business Card */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      WhatsApp Business
                    </CardTitle>
                    <CardDescription className="text-green-100">
                      Informações da conta Business
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="businessAccountId" className="text-sm font-semibold text-gray-700">Business Account ID</Label>
                      <Input
                        id="businessAccountId"
                        {...form.register('businessAccountId')}
                        placeholder="123456789012345"
                        className="mt-1"
                        data-testid="input-business-account-id"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumberId" className="text-sm font-semibold text-gray-700">Phone Number ID</Label>
                      <Input
                        id="phoneNumberId"
                        {...form.register('phoneNumberId')}
                        placeholder="123456789012345"
                        className="mt-1"
                        data-testid="input-phone-number-id"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">Número WhatsApp</Label>
                      <Input
                        id="phoneNumber"
                        {...form.register('phoneNumber')}
                        placeholder="+55 11 98765-4321"
                        className="mt-1"
                        data-testid="input-phone-number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="accessToken" className="text-sm font-semibold text-gray-700">Access Token (Permanente)</Label>
                      <Input
                        id="accessToken"
                        type={showSecrets ? "text" : "password"}
                        {...form.register('accessToken')}
                        placeholder="EAAxxxxxxxxxxxxxxxxx"
                        className="mt-1"
                        data-testid="input-access-token"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Webhook URLs */}
              <Card className="mt-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    URLs de Webhook (Meta)
                  </CardTitle>
                  <CardDescription className="text-purple-100">Configure estes endpoints no Meta Dashboard</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Webhook de Verificação</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={`${baseUrl}/api/n8n/whatsapp/verify`} 
                        readOnly 
                        className="font-mono text-sm bg-gray-50" 
                      />
                      <Button 
                        type="button"
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(`${baseUrl}/api/n8n/whatsapp/verify`, "URL de verificação")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Webhook de Mensagens</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={`${baseUrl}/api/n8n/whatsapp/incoming`} 
                        readOnly 
                        className="font-mono text-sm bg-gray-50" 
                      />
                      <Button 
                        type="button"
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(`${baseUrl}/api/n8n/whatsapp/incoming`, "URL de mensagens")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  data-testid="button-save-config"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Salvar Configuração
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open('https://developers.facebook.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Meta Dashboard
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Tab 2: Conexão N8N */}
          <TabsContent value="n8n" className="space-y-6">
            <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-900">
                <strong>Método 2: N8N</strong> - Use workflows N8N para processar mensagens com IA, automações e integrações avançadas
              </AlertDescription>
            </Alert>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Configuração N8N Workflow
                  </CardTitle>
                  <CardDescription className="text-indigo-100">
                    Configure a URL do seu workflow N8N para processar mensagens
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="webhookUrl" className="text-sm font-semibold text-gray-700">Webhook URL do N8N</Label>
                    <Input
                      id="webhookUrl"
                      {...form.register('webhookUrl')}
                      placeholder="https://seu-n8n.app.n8n.cloud/webhook/whatsapp"
                      className="mt-1"
                      data-testid="input-webhook-url"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL do webhook do seu workflow N8N que processará as mensagens
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Notas (opcional)</Label>
                    <Textarea
                      id="notes"
                      {...form.register('notes')}
                      placeholder="Anotações sobre a configuração..."
                      rows={3}
                      className="mt-1"
                      data-testid="textarea-notes"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <Switch
                      checked={form.watch('isActive')}
                      onCheckedChange={(checked) => form.setValue('isActive', checked)}
                      data-testid="toggle-is-active"
                    />
                    <div>
                      <Label className="cursor-pointer font-semibold text-green-900">Ativar Integração</Label>
                      <p className="text-xs text-green-700">Habilitar webhook e processamento de mensagens</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 mt-6">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Salvar Configuração N8N
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Tab 3: API Documentation */}
          <TabsContent value="api-docs" className="space-y-6">
            <Alert className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
              <Database className="h-4 w-4 text-cyan-600" />
              <AlertDescription className="text-sm text-cyan-900">
                <strong>API N8N VittaVerde</strong> - Endpoints para seu workflow N8N consumir dados da plataforma (requer API Key)
              </AlertDescription>
            </Alert>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Endpoints Disponíveis
                </CardTitle>
                <CardDescription className="text-cyan-100">
                  Use estes endpoints no seu workflow N8N com autenticação via API Key
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {n8nEndpoints.map((endpoint, index) => {
                    const Icon = endpoint.icon;
                    return (
                      <div 
                        key={index}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className={`p-2 rounded-lg bg-white shadow-sm ${endpoint.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                              endpoint.method === 'GET' ? 'bg-green-100 text-green-700' : 
                              endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' : 
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {endpoint.method}
                            </span>
                            <code className="text-sm font-mono text-gray-700">{endpoint.path}</code>
                          </div>
                          <p className="text-sm text-gray-600">{endpoint.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`, endpoint.description)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>🔐 Autenticação:</strong> Todos os endpoints N8N requerem header <code className="bg-yellow-100 px-1 rounded">X-API-Key: seu_n8n_api_key</code>
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
