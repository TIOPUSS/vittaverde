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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Mail, Key, Send, CheckCircle, AlertCircle, Eye, EyeOff, Zap, Shield, Server } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const emailConfigSchema = z.object({
  provider: z.enum(['microsoft365', 'smtp']).default('microsoft365'),
  microsoftTenantId: z.string().optional(),
  microsoftClientId: z.string().optional(),
  microsoftClientSecret: z.string().optional(),
  emailFrom: z.string().email('Email inválido'),
  emailFromName: z.string().default('VittaVerde'),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().default(false),
  isActive: z.boolean().default(false),
  notes: z.string().optional(),
});

type EmailConfigForm = z.infer<typeof emailConfigSchema>;

export default function EmailConfigPage() {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/admin/config/email'],
  });

  const form = useForm<EmailConfigForm>({
    resolver: zodResolver(emailConfigSchema),
    values: config || {
      provider: 'microsoft365',
      microsoftTenantId: '',
      microsoftClientId: '',
      microsoftClientSecret: '',
      emailFrom: '',
      emailFromName: 'VittaVerde',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: false,
      isActive: false,
      notes: '',
    },
  });

  const provider = form.watch('provider');
  const isActive = form.watch('isActive');

  const updateMutation = useMutation({
    mutationFn: async (data: EmailConfigForm) => {
      const response = await apiRequest('/api/admin/config/email', 'PUT', data);
      if (!response.ok) throw new Error('Failed to update config');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config/email'] });
      toast({
        title: "✅ Configuração salva!",
        description: "As configurações de email foram atualizadas com sucesso.",
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

  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('/api/admin/config/email/test', 'POST', { testEmail: email });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send test email');
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "✅ Email enviado!",
        description: `Email de teste enviado para ${testEmail}. Verifique sua caixa de entrada.`,
      });
      setTestEmail('');
      setSendingTest(false);
    },
    onError: (error: any) => {
      const errorMsg = error.message || "Não foi possível enviar o email de teste.";
      const isAccessDenied = errorMsg.includes('Access is denied') || errorMsg.includes('ErrorAccessDenied');
      
      toast({
        title: isAccessDenied ? "🔐 Erro de Permissão" : "❌ Erro ao enviar",
        description: isAccessDenied 
          ? "Credenciais do Azure incorretas ou Admin Consent não foi concedido. Verifique as instruções abaixo."
          : errorMsg,
        variant: "destructive",
        duration: 8000,
      });
      setSendingTest(false);
    },
  });

  const onSubmit = (data: EmailConfigForm) => {
    updateMutation.mutate(data);
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Email necessário",
        description: "Digite um email para enviar o teste.",
        variant: "destructive",
      });
      return;
    }
    setSendingTest(true);
    testEmailMutation.mutate(testEmail);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Modern Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Configuração de Email
                </span>
              </h1>
              <p className="text-xl text-gray-600">
                Configure o envio de emails transacionais usando Microsoft 365 ou SMTP
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {config && (
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={`${isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-800 border-gray-300'} px-4 py-2 text-sm font-semibold`}>
                {isActive ? (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Sistema Ativo
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Sistema Inativo
                  </>
                )}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 px-4 py-2 text-sm font-semibold">
                <Server className="h-4 w-4 mr-2" />
                {provider === 'microsoft365' ? 'Microsoft 365' : 'SMTP'}
              </Badge>
              
              {/* Toggle to activate/deactivate */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border-2 border-gray-200 shadow-md">
                <Switch
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  data-testid="toggle-is-active"
                />
                <span className="text-sm font-semibold text-gray-700">
                  {form.watch('isActive') ? 'Envio Ativo' : 'Envio Desativado'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <Alert className="mb-8 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900">
            <strong className="text-base">📋 Como configurar Microsoft 365:</strong>
            <ol className="list-decimal ml-5 mt-3 space-y-2 text-sm">
              <li>Acesse <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-700">Azure Portal</a></li>
              <li>Azure Active Directory → <strong>App registrations</strong> → <strong>New registration</strong></li>
              <li>Nome: <code className="bg-blue-100 px-2 py-1 rounded">"VittaVerde Email Service"</code></li>
              <li>API Permissions → Add → Microsoft Graph → <strong>Application permissions</strong> → Adicione:
                <ul className="list-disc ml-5 mt-1">
                  <li><code className="bg-blue-100 px-1 rounded">Mail.Send</code></li>
                  <li><code className="bg-blue-100 px-1 rounded">User.Read.All</code></li>
                </ul>
              </li>
              <li>Clique em <strong>"Grant admin consent for [sua empresa]"</strong> (botão com escudo azul)</li>
              <li>Certificates & secrets → New client secret → <strong>Copie o Value</strong> (só aparece uma vez!)</li>
              <li>Configure os campos abaixo com <strong>Tenant ID</strong>, <strong>Client ID</strong> e <strong>Client Secret</strong></li>
            </ol>
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Provider Selection Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-100">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Key className="h-6 w-6 text-white" />
                </div>
                Provedor de Email
              </CardTitle>
              <CardDescription className="text-base">Escolha entre Microsoft 365 (recomendado) ou SMTP customizado</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div>
                <Label htmlFor="provider" className="text-base font-semibold mb-3 block">Tipo de Provedor</Label>
                <Select
                  value={provider}
                  onValueChange={(value) => form.setValue('provider', value as 'microsoft365' | 'smtp')}
                >
                  <SelectTrigger className="h-12 text-base border-2" data-testid="select-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="microsoft365" className="text-base">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Microsoft 365 (Recomendado)
                      </div>
                    </SelectItem>
                    <SelectItem value="smtp" className="text-base">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-purple-600" />
                        SMTP Customizado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Microsoft 365 oferece maior segurança e confiabilidade
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="emailFrom" className="text-base font-semibold">Email Remetente *</Label>
                  <Input
                    id="emailFrom"
                    {...form.register('emailFrom')}
                    placeholder="contato@vittaverde.com"
                    className="h-12 text-base mt-2 border-2"
                    data-testid="input-email-from"
                  />
                  <p className="text-xs text-orange-700 mt-2 flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    Este email DEVE existir na sua conta {provider === 'microsoft365' ? 'Microsoft 365' : 'SMTP'}
                  </p>
                  {form.formState.errors.emailFrom && (
                    <p className="text-sm text-red-600 mt-1 font-semibold">{form.formState.errors.emailFrom.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emailFromName" className="text-base font-semibold">Nome do Remetente</Label>
                  <Input
                    id="emailFromName"
                    {...form.register('emailFromName')}
                    placeholder="VittaVerde"
                    className="h-12 text-base mt-2 border-2"
                    data-testid="input-email-from-name"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Nome que aparecerá para os destinatários dos emails
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Microsoft 365 Credentials */}
          {provider === 'microsoft365' && (
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-100">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  Credenciais Microsoft 365
                </CardTitle>
                <CardDescription className="text-base">
                  Configure as credenciais do Azure AD App Registration
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div>
                  <Label htmlFor="microsoftTenantId" className="text-base font-semibold">Tenant ID *</Label>
                  <Input
                    id="microsoftTenantId"
                    {...form.register('microsoftTenantId')}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="h-12 font-mono text-sm mt-2 border-2"
                    data-testid="input-tenant-id"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    📍 Encontre em: Azure AD → App registrations → seu app → <strong>Directory (tenant) ID</strong>
                  </p>
                </div>

                <div>
                  <Label htmlFor="microsoftClientId" className="text-base font-semibold">Client ID *</Label>
                  <Input
                    id="microsoftClientId"
                    {...form.register('microsoftClientId')}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="h-12 font-mono text-sm mt-2 border-2"
                    data-testid="input-client-id"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    📍 Encontre em: Azure AD → App registrations → seu app → <strong>Application (client) ID</strong>
                  </p>
                </div>

                <div>
                  <Label htmlFor="microsoftClientSecret" className="text-base font-semibold">Client Secret *</Label>
                  <div className="relative mt-2">
                    <Input
                      id="microsoftClientSecret"
                      type={showSecrets ? "text" : "password"}
                      {...form.register('microsoftClientSecret')}
                      placeholder="••••••••••••••••••••••••••••"
                      className="h-12 pr-12 font-mono text-sm border-2"
                      data-testid="input-client-secret"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                      data-testid="toggle-show-secrets"
                    >
                      {showSecrets ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    📍 Gere em: Azure AD → Certificates & secrets → New client secret → Copie o <strong className="text-red-700">Value</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SMTP Configuration */}
          {provider === 'smtp' && (
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-100">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Server className="h-6 w-6 text-white" />
                  </div>
                  Configuração SMTP
                </CardTitle>
                <CardDescription className="text-base">
                  Configure servidor SMTP customizado (Gmail, SendGrid, Mailgun, etc)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="smtpHost" className="text-base font-semibold">Servidor SMTP</Label>
                    <Input
                      id="smtpHost"
                      {...form.register('smtpHost')}
                      placeholder="smtp.gmail.com"
                      className="h-12 text-base mt-2 border-2"
                      data-testid="input-smtp-host"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort" className="text-base font-semibold">Porta</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      {...form.register('smtpPort', { valueAsNumber: true })}
                      placeholder="587"
                      className="h-12 text-base mt-2 border-2"
                      data-testid="input-smtp-port"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="smtpUser" className="text-base font-semibold">Usuário SMTP</Label>
                  <Input
                    id="smtpUser"
                    {...form.register('smtpUser')}
                    placeholder="seu-email@dominio.com"
                    className="h-12 text-base mt-2 border-2"
                    data-testid="input-smtp-user"
                  />
                </div>

                <div>
                  <Label htmlFor="smtpPassword" className="text-base font-semibold">Senha SMTP</Label>
                  <div className="relative mt-2">
                    <Input
                      id="smtpPassword"
                      type={showSecrets ? "text" : "password"}
                      {...form.register('smtpPassword')}
                      placeholder="••••••••••••"
                      className="h-12 pr-12 text-base border-2"
                      data-testid="input-smtp-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showSecrets ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-5 border-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Switch
                    checked={form.watch('smtpSecure')}
                    onCheckedChange={(checked) => form.setValue('smtpSecure', checked)}
                    data-testid="toggle-smtp-secure"
                  />
                  <div>
                    <Label className="cursor-pointer text-base font-semibold">Usar TLS/SSL</Label>
                    <p className="text-sm text-gray-600">Conexão segura e criptografada</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Email Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-300 shadow-xl hover:shadow-2xl transition-all">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Send className="h-6 w-6 text-white" />
                </div>
                Testar Configuração
              </CardTitle>
              <CardDescription className="text-base">
                Envie um email de teste para verificar se está tudo funcionando perfeitamente
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="flex gap-4">
                <Input
                  placeholder="seu-email@exemplo.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="h-14 text-base border-2 flex-1"
                  data-testid="input-test-email"
                />
                <Button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={sendingTest || !testEmail}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  data-testid="button-send-test"
                >
                  {sendingTest ? "Enviando..." : "Enviar Teste"}
                </Button>
              </div>
              <p className="text-sm text-orange-700 mt-4 flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" />
                Importante: Salve as configurações antes de testar!
              </p>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 h-16 px-12 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
              data-testid="button-save-config"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-3 h-6 w-6" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Current Status Summary */}
        {config && (
          <Card className="mt-8 bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
              <CardTitle className="text-xl">📊 Resumo da Configuração Atual</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Provedor</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(config as any)?.provider === 'microsoft365' ? 'Microsoft 365' : 'SMTP'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${(config as any)?.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-lg font-bold flex items-center gap-2">
                    {(config as any)?.isActive ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-700">Ativo</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-700">Inativo</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Email Remetente</p>
                  <p className="text-base font-bold text-gray-900 truncate">
                    {(config as any)?.emailFrom || 'Não configurado'}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600 mb-1">Nome Exibido</p>
                  <p className="text-base font-bold text-gray-900">
                    {(config as any)?.emailFromName || 'VittaVerde'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
