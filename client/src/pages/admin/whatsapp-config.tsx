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
import { MessageSquare, Key, Phone, Webhook, CheckCircle, AlertCircle, Copy, ExternalLink, Eye, EyeOff, Shield, Bot, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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

export default function WhatsappConfigPage() {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState(false);

  const { data: config, isLoading } = useQuery({
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
        title: "✅ Configuração salva!",
        description: "As configurações do WhatsApp foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WhatsappConfigForm) => {
    updateMutation.mutate(data);
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "📋 Copiado!",
      description: "URL copiada para a área de transferência",
    });
  };

  const webhookVerifyUrl = `${window.location.origin}/api/n8n/whatsapp/verify`;
  const webhookIncomingUrl = `${window.location.origin}/api/n8n/whatsapp/incoming`;
  const isActive = form.watch('isActive');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 pt-28 pb-16">
        {/* Modern Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight">
                  WhatsApp Business
                </h1>
                <p className="text-xl text-gray-600 mt-1">
                  Chatbot automatizado com N8N + Meta API
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            {isActive && (
              <Badge className="bg-green-100 text-green-800 border-2 border-green-500 px-6 py-3 text-base font-bold shadow-lg">
                <CheckCircle className="h-5 w-5 mr-2" />
                Integração Ativa
              </Badge>
            )}
          </div>
        </div>

        {/* Setup Instructions Alert */}
        <Alert className="mb-8 border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <AlertCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-sm text-green-900">
            <strong className="text-base">📋 Como configurar WhatsApp Business API:</strong>
            <ol className="list-decimal ml-5 mt-3 space-y-2 text-sm">
              <li>Acesse <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-green-700">Meta for Developers</a> e crie uma conta</li>
              <li>Crie um novo <strong>App</strong> e adicione o produto <strong>WhatsApp Business</strong></li>
              <li>No dashboard WhatsApp, copie o <strong>Phone Number ID</strong> e <strong>Business Account ID</strong></li>
              <li>Gere um <strong>Access Token Permanente</strong> (não use tokens temporários de 24h)</li>
              <li>Configure o <strong>Webhook</strong> do Meta apontando para a URL de verificação abaixo</li>
              <li>Crie um workflow no <strong>N8N</strong> com webhook trigger e configure a URL do N8N abaixo</li>
              <li>Ative a integração e teste enviando uma mensagem para o número WhatsApp</li>
            </ol>
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Webhook URLs Card - MODERNIZED */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Webhook className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">URLs de Webhook</CardTitle>
                  <CardDescription className="text-purple-100 text-base">
                    URLs necessárias para configurar Meta e N8N
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  Webhook de Verificação (Meta Dashboard)
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={webhookVerifyUrl} 
                    readOnly 
                    className="font-mono text-sm bg-gray-50 border-2" 
                    data-testid="input-webhook-verify-url"
                  />
                  <Button 
                    type="button"
                    size="sm" 
                    variant="outline"
                    onClick={() => copyWebhookUrl(webhookVerifyUrl)}
                    className="px-6 hover:bg-purple-50 hover:border-purple-300"
                    data-testid="button-copy-verify-url"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  📌 Cole esta URL no campo <strong>"Callback URL"</strong> nas configurações de Webhook do Meta Dashboard
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-600" />
                  Webhook de Mensagens Recebidas (Backend → N8N)
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={webhookIncomingUrl} 
                    readOnly 
                    className="font-mono text-sm bg-gray-50 border-2" 
                    data-testid="input-webhook-incoming-url"
                  />
                  <Button 
                    type="button"
                    size="sm" 
                    variant="outline"
                    onClick={() => copyWebhookUrl(webhookIncomingUrl)}
                    className="px-6 hover:bg-indigo-50 hover:border-indigo-300"
                    data-testid="button-copy-incoming-url"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  📌 Esta é a URL que o <strong>Meta irá chamar</strong> quando uma mensagem chegar. O backend VittaVerde encaminhará para o N8N automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Meta App Credentials - MODERNIZED */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">Credenciais Meta App</CardTitle>
                  <CardDescription className="text-blue-100 text-base">
                    App ID, Secret e Token de Verificação do Meta for Developers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="appId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    App ID
                  </Label>
                  <Input
                    id="appId"
                    {...form.register('appId')}
                    placeholder="123456789012345"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-app-id"
                  />
                  <p className="text-xs text-gray-500">Encontrado nas configurações do seu app Meta</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appSecret" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    App Secret
                  </Label>
                  <Input
                    id="appSecret"
                    type={showSecrets ? "text" : "password"}
                    {...form.register('appSecret')}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-app-secret"
                  />
                  <p className="text-xs text-gray-500">Segredo do app (mantenha em sigilo)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verifyToken" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Verify Token (Personalizado)
                </Label>
                <Input
                  id="verifyToken"
                  type={showSecrets ? "text" : "password"}
                  {...form.register('verifyToken')}
                  placeholder="meu_token_secreto_123"
                  className="mt-1 font-mono text-sm"
                  data-testid="input-verify-token"
                />
                <p className="text-xs text-gray-500">
                  Token que você cria e usa para verificar o webhook no Meta Dashboard
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Switch
                  checked={showSecrets}
                  onCheckedChange={setShowSecrets}
                  data-testid="toggle-show-secrets"
                />
                <div className="flex items-center gap-2">
                  {showSecrets ? <Eye className="h-4 w-4 text-gray-600" /> : <EyeOff className="h-4 w-4 text-gray-600" />}
                  <Label className="cursor-pointer text-sm font-semibold text-gray-700">
                    {showSecrets ? 'Ocultar credenciais' : 'Mostrar credenciais'}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Business Info - MODERNIZED */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">WhatsApp Business</CardTitle>
                  <CardDescription className="text-green-100 text-base">
                    Informações da conta WhatsApp Business e número de telefone
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessAccountId" className="text-sm font-semibold text-gray-700">
                    Business Account ID (Opcional)
                  </Label>
                  <Input
                    id="businessAccountId"
                    {...form.register('businessAccountId')}
                    placeholder="123456789012345"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-business-account-id"
                  />
                  <p className="text-xs text-gray-500">ID da conta WhatsApp Business no Meta (opcional para API oficial)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumberId" className="text-sm font-semibold text-gray-700">
                    Phone Number ID (Opcional)
                  </Label>
                  <Input
                    id="phoneNumberId"
                    {...form.register('phoneNumberId')}
                    placeholder="123456789012345"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-phone-number-id"
                  />
                  <p className="text-xs text-gray-500">ID do número de telefone no Meta (opcional para API oficial)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  Número do WhatsApp ⭐ (OBRIGATÓRIO)
                </Label>
                <Input
                  id="phoneNumber"
                  {...form.register('phoneNumber')}
                  placeholder="+5541987654321"
                  className="mt-1 font-mono text-lg font-bold border-green-500 focus:ring-green-500"
                  data-testid="input-phone-number"
                />
                <p className="text-sm text-green-700 font-semibold bg-green-50 p-3 rounded-md border border-green-200">
                  ✅ Este é o número que aparece no botão verde! Digite no formato: <strong>+5541987654321</strong> (código do país + DDD + número, SEM espaços)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-600" />
                  Access Token (Opcional - API oficial)
                </Label>
                <Input
                  id="accessToken"
                  type={showSecrets ? "text" : "password"}
                  {...form.register('accessToken')}
                  placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="mt-1 font-mono text-sm"
                  data-testid="input-access-token"
                />
                <p className="text-xs text-gray-500">
                  ⚠️ Use token <strong>permanente</strong>, não o temporário de 24h
                </p>
              </div>
            </CardContent>
          </Card>

          {/* N8N Configuration - IMPROVED & MODERNIZED */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">Configuração N8N (Chatbot)</CardTitle>
                  <CardDescription className="text-indigo-100 text-base">
                    Configure o workflow de automação do chatbot WhatsApp
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Alert className="border-2 border-indigo-200 bg-indigo-50">
                <Bot className="h-4 w-4 text-indigo-600" />
                <AlertDescription className="text-sm text-indigo-900">
                  <strong>🤖 Como funciona o fluxo:</strong>
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Cliente envia mensagem WhatsApp → <strong>Meta API</strong> recebe</li>
                    <li>Meta API chama webhook → <strong>Backend VittaVerde</strong> recebe</li>
                    <li>Backend encaminha para → <strong>N8N Workflow</strong></li>
                    <li>N8N processa (IA, regras, etc.) → Responde via <strong>Meta API</strong></li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-indigo-600" />
                  Webhook URL do N8N
                </Label>
                <Input
                  id="webhookUrl"
                  {...form.register('webhookUrl')}
                  placeholder="https://seu-n8n.com/webhook/whatsapp-bot"
                  className="mt-1 font-mono text-sm"
                  data-testid="input-webhook-url"
                />
                <p className="text-xs text-gray-500">
                  URL do webhook do seu workflow N8N que processará as mensagens recebidas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                  Notas sobre N8N / Workflow (opcional)
                </Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Ex: Workflow usa OpenAI GPT-4 para respostas automáticas..."
                  rows={3}
                  className="mt-1"
                  data-testid="textarea-notes"
                />
              </div>

              <div className="flex items-center gap-3 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
                <Switch
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  data-testid="toggle-is-active"
                />
                <div>
                  <Label className="cursor-pointer font-bold text-base text-gray-900">
                    {isActive ? '✅ Integração Ativa' : '⏸️ Integração Desativada'}
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    {isActive 
                      ? 'Webhook habilitado - mensagens sendo processadas pelo N8N' 
                      : 'Ative para começar a processar mensagens WhatsApp'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-bold shadow-xl"
              data-testid="button-save-config"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Salvando configuração...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-3" />
                  Salvar Configuração WhatsApp
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => window.open('https://developers.facebook.com', '_blank')}
              className="px-8 py-6 text-lg font-semibold border-2 hover:bg-blue-50"
              data-testid="button-meta-dashboard"
            >
              <ExternalLink className="h-5 w-5 mr-3" />
              Abrir Meta Dashboard
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
