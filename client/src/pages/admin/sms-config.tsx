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
import { Phone, Key, Send, CheckCircle, AlertCircle, Eye, EyeOff, Zap, Shield, Server } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const smsConfigSchema = z.object({
  provider: z.enum(['twilio', 'vonage', 'aws_sns', 'generic']).default('twilio'),
  // Twilio
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioPhoneNumber: z.string().optional(),
  // Vonage
  vonageApiKey: z.string().optional(),
  vonageApiSecret: z.string().optional(),
  vonageSenderName: z.string().optional(),
  // AWS SNS
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  awsRegion: z.string().optional(),
  awsSenderNumber: z.string().optional(),
  // Generic
  genericApiUrl: z.string().optional(),
  genericApiKey: z.string().optional(),
  genericSenderNumber: z.string().optional(),
  isActive: z.boolean().default(false),
  notes: z.string().optional(),
});

type SmsConfigForm = z.infer<typeof smsConfigSchema>;

export default function SmsConfigPage() {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/admin/config/sms'],
  });

  const { data: emailConfig } = useQuery({
    queryKey: ['/api/admin/config/email'],
  });

  const form = useForm<SmsConfigForm>({
    resolver: zodResolver(smsConfigSchema),
    defaultValues: {
      provider: 'twilio',
      twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: '',
      vonageApiKey: '', vonageApiSecret: '', vonageSenderName: '',
      awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: '', awsSenderNumber: '',
      genericApiUrl: '', genericApiKey: '', genericSenderNumber: '',
      isActive: false,
      notes: '',
    },
  });

  // Update form when config is loaded
  if (config && !isLoading) {
    form.reset(config);
  }

  const isActive = form.watch('isActive');
  const emailIsActive = (emailConfig && 'isActive' in emailConfig) ? emailConfig.isActive : false;

  const updateMutation = useMutation({
    mutationFn: async (data: SmsConfigForm) => {
      const response = await apiRequest('/api/admin/config/sms', 'PUT', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update config');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config/sms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/config/email'] });
      toast({
        title: "✅ Configuração salva!",
        description: "As configurações de SMS foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest('/api/admin/config/sms/test', 'POST', { testPhone: phone });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send test SMS');
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "✅ SMS enviado!",
        description: `SMS de teste enviado para ${testPhone}. Verifique suas mensagens.`,
      });
      setTestPhone('');
      setSendingTest(false);
    },
    onError: (error: any) => {
      const errorMsg = error.message || "Não foi possível enviar o SMS de teste.";
      
      toast({
        title: "❌ Erro ao enviar",
        description: errorMsg,
        variant: "destructive",
        duration: 8000,
      });
      setSendingTest(false);
    },
  });

  const onSubmit = (data: SmsConfigForm) => {
    if (data.isActive && emailIsActive) {
      toast({
        title: "⚠️ Atenção",
        description: "Ao ativar SMS, o Email será desativado automaticamente. Apenas um método pode estar ativo.",
        duration: 5000,
      });
    }
    updateMutation.mutate(data);
  };

  const handleTestSms = () => {
    if (!testPhone) {
      toast({
        title: "Telefone necessário",
        description: "Digite um telefone para enviar o teste.",
        variant: "destructive",
      });
      return;
    }
    setSendingTest(true);
    testSmsMutation.mutate(testPhone);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Modern Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform">
              <Phone className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                  Configuração de SMS
                </span>
              </h1>
              <p className="text-xl text-gray-600">
                Configure o envio de SMS de verificação usando Twilio
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {(config && 'isActive' in config) && (
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={`${isActive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-800 border-gray-300'} px-4 py-2 text-sm font-semibold`}>
                {isActive ? (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    SMS Ativo
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    SMS Inativo
                  </>
                )}
              </Badge>
              <Badge className="bg-orange-100 text-orange-800 border-orange-300 px-4 py-2 text-sm font-semibold">
                <Server className="h-4 w-4 mr-2" />
                Twilio
              </Badge>
              
              {/* Toggle to activate/deactivate */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border-2 border-gray-200 shadow-md">
                <Switch
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  data-testid="toggle-is-active"
                />
                <span className="text-sm font-semibold text-gray-700">
                  {form.watch('isActive') ? 'SMS Ativo' : 'SMS Desativado'}
                </span>
              </div>

              {/* Email Status Warning */}
              {emailIsActive && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 px-4 py-2 text-sm font-semibold">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Email está ativo
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Exclusivity Warning */}
        <Alert className="mb-8 border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-900">
            <strong className="text-base">⚠️ Importante - Exclusividade:</strong>
            <p className="mt-2">
              Apenas <strong>Email OU SMS</strong> pode estar ativo por vez. Quando você ativar SMS, o sistema de Email será automaticamente desativado e vice-versa. Isso garante que apenas um método de verificação esteja em uso.
            </p>
          </AlertDescription>
        </Alert>

        {/* Setup Instructions */}
        <Alert className="mb-8 border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-sm text-orange-900">
            <strong className="text-base">📋 Como configurar Twilio:</strong>
            <ol className="list-decimal ml-5 mt-3 space-y-2 text-sm">
              <li>Acesse <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-orange-700">Twilio Console</a></li>
              <li>Crie uma conta ou faça login</li>
              <li>No Dashboard, encontre o <strong>Account SID</strong></li>
              <li>Clique em "Show" para ver o <strong>Auth Token</strong></li>
              <li>Em <strong>Phone Numbers</strong> → <strong>Manage</strong> → <strong>Active numbers</strong>, copie seu número no formato: <code className="bg-orange-100 px-2 py-1 rounded">+5511987654321</code></li>
              <li>Configure os campos abaixo com suas credenciais Twilio</li>
            </ol>
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800">
                <strong>💰 Custo:</strong> Twilio cobra por SMS enviado (~R$ 0,30 por mensagem). Não existe serviço de SMS gratuito confiável. Você precisará adicionar créditos na sua conta Twilio.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Provider Selection Card */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-8">
              <CardTitle className="text-3xl font-bold">Escolha o Provedor SMS</CardTitle>
              <CardDescription className="text-purple-100 text-base">
                Selecione qual serviço você deseja usar para enviar SMS
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => form.setValue('provider', 'twilio')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    form.watch('provider') === 'twilio'
                      ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                  }`}
                  data-testid="button-provider-twilio"
                >
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${form.watch('provider') === 'twilio' ? 'text-orange-600' : 'text-gray-400'}`}>
                      Twilio
                    </div>
                    <p className="text-xs text-gray-600">Popular e confiável</p>
                    <p className="text-xs text-gray-500 mt-1">~R$ 0,30/SMS</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => form.setValue('provider', 'vonage')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    form.watch('provider') === 'vonage'
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  data-testid="button-provider-vonage"
                >
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${form.watch('provider') === 'vonage' ? 'text-blue-600' : 'text-gray-400'}`}>
                      Vonage
                    </div>
                    <p className="text-xs text-gray-600">Ex-Nexmo</p>
                    <p className="text-xs text-gray-500 mt-1">Global coverage</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => form.setValue('provider', 'aws_sns')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    form.watch('provider') === 'aws_sns'
                      ? 'border-yellow-500 bg-yellow-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-gray-50'
                  }`}
                  data-testid="button-provider-aws"
                >
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${form.watch('provider') === 'aws_sns' ? 'text-yellow-600' : 'text-gray-400'}`}>
                      AWS SNS
                    </div>
                    <p className="text-xs text-gray-600">Amazon Web Services</p>
                    <p className="text-xs text-gray-500 mt-1">Escalável</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => form.setValue('provider', 'generic')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    form.watch('provider') === 'generic'
                      ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                  data-testid="button-provider-generic"
                >
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${form.watch('provider') === 'generic' ? 'text-green-600' : 'text-gray-400'}`}>
                      Genérico
                    </div>
                    <p className="text-xs text-gray-600">API customizada</p>
                    <p className="text-xs text-gray-500 mt-1">Flexível</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Twilio Credentials Card */}
          {form.watch('provider') === 'twilio' && (
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">Credenciais Twilio</CardTitle>
                  <CardDescription className="text-orange-100 text-base">
                    Configure suas credenciais da API do Twilio
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="twilioAccountSid" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-600" />
                    Account SID
                  </Label>
                  <Input
                    id="twilioAccountSid"
                    {...form.register('twilioAccountSid')}
                    type={showSecrets ? "text" : "password"}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-twilio-account-sid"
                  />
                  <p className="text-xs text-gray-500">Encontrado no Twilio Console Dashboard</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twilioAuthToken" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Key className="h-4 w-4 text-orange-600" />
                    Auth Token
                  </Label>
                  <Input
                    id="twilioAuthToken"
                    {...form.register('twilioAuthToken')}
                    type={showSecrets ? "text" : "password"}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-twilio-auth-token"
                  />
                  <p className="text-xs text-gray-500">Token secreto do Twilio (clique em "Show")</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilioPhoneNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-orange-600" />
                  Número de Telefone Twilio
                </Label>
                <Input
                  id="twilioPhoneNumber"
                  {...form.register('twilioPhoneNumber')}
                  placeholder="+5511987654321"
                  className="mt-1 font-mono text-sm"
                  data-testid="input-twilio-phone-number"
                />
                <p className="text-xs text-gray-500">Número comprado no Twilio (formato internacional com +)</p>
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
          )}

          {/* Vonage Credentials Card */}
          {form.watch('provider') === 'vonage' && (
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">Credenciais Vonage</CardTitle>
                  <CardDescription className="text-blue-100 text-base">
                    Configure suas credenciais da API do Vonage (ex-Nexmo)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vonageApiKey" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    API Key
                  </Label>
                  <Input
                    id="vonageApiKey"
                    {...form.register('vonageApiKey')}
                    type={showSecrets ? "text" : "password"}
                    placeholder="abc12345"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-vonage-api-key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vonageApiSecret" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    API Secret
                  </Label>
                  <Input
                    id="vonageApiSecret"
                    {...form.register('vonageApiSecret')}
                    type={showSecrets ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-vonage-api-secret"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vonageSenderName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  Sender ID / Nome Remetente
                </Label>
                <Input
                  id="vonageSenderName"
                  {...form.register('vonageSenderName')}
                  placeholder="VittaVerde"
                  className="mt-1"
                  data-testid="input-vonage-sender-name"
                />
                <p className="text-xs text-gray-500">Nome que aparecerá como remetente do SMS</p>
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
          )}

          {/* AWS SNS Credentials Card */}
          {form.watch('provider') === 'aws_sns' && (
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">Credenciais AWS SNS</CardTitle>
                  <CardDescription className="text-yellow-100 text-base">
                    Configure suas credenciais AWS para usar o Simple Notification Service
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="awsAccessKeyId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Key className="h-4 w-4 text-yellow-600" />
                    Access Key ID
                  </Label>
                  <Input
                    id="awsAccessKeyId"
                    {...form.register('awsAccessKeyId')}
                    type={showSecrets ? "text" : "password"}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-aws-access-key-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="awsSecretAccessKey" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    Secret Access Key
                  </Label>
                  <Input
                    id="awsSecretAccessKey"
                    {...form.register('awsSecretAccessKey')}
                    type={showSecrets ? "text" : "password"}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-aws-secret-access-key"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="awsRegion" className="text-sm font-semibold text-gray-700">
                    Região AWS
                  </Label>
                  <Input
                    id="awsRegion"
                    {...form.register('awsRegion')}
                    placeholder="us-east-1"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-aws-region"
                  />
                  <p className="text-xs text-gray-500">Ex: us-east-1, sa-east-1</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="awsSenderNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-yellow-600" />
                    Número Remetente
                  </Label>
                  <Input
                    id="awsSenderNumber"
                    {...form.register('awsSenderNumber')}
                    placeholder="+5511987654321"
                    className="mt-1 font-mono text-sm"
                    data-testid="input-aws-sender-number"
                  />
                </div>
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
          )}

          {/* Generic API Credentials Card */}
          {form.watch('provider') === 'generic' && (
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">API Genérica</CardTitle>
                  <CardDescription className="text-green-100 text-base">
                    Configure qualquer provedor SMS via API REST
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="genericApiUrl" className="text-sm font-semibold text-gray-700">
                  URL da API (POST)
                </Label>
                <Input
                  id="genericApiUrl"
                  {...form.register('genericApiUrl')}
                  placeholder="https://api.seuprovedor.com/sms/send"
                  className="mt-1 font-mono text-sm"
                  data-testid="input-generic-api-url"
                />
                <p className="text-xs text-gray-500">Endpoint POST para envio de SMS</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genericApiKey" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-600" />
                  API Key / Token
                </Label>
                <Input
                  id="genericApiKey"
                  {...form.register('genericApiKey')}
                  type={showSecrets ? "text" : "password"}
                  placeholder="••••••••••••••••••••••••"
                  className="mt-1 font-mono text-sm"
                  data-testid="input-generic-api-key"
                />
                <p className="text-xs text-gray-500">Será enviado no header Authorization: Bearer {'{token}'}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genericSenderNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  Número/ID Remetente
                </Label>
                <Input
                  id="genericSenderNumber"
                  {...form.register('genericSenderNumber')}
                  placeholder="+5511987654321 ou VittaVerde"
                  className="mt-1"
                  data-testid="input-generic-sender-number"
                />
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
          )}

          {/* Test SMS Card */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Send className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">Testar Envio de SMS</CardTitle>
                  <CardDescription className="text-purple-100 text-base">
                    Envie um SMS de teste para verificar se tudo está funcionando
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testPhone" className="text-sm font-semibold text-gray-700">
                    Telefone de Teste
                  </Label>
                  <Input
                    id="testPhone"
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+5511999887766"
                    className="font-mono"
                    data-testid="input-test-phone"
                  />
                  <p className="text-xs text-gray-500">Digite o telefone no formato internacional (+55...)</p>
                </div>

                <Button
                  type="button"
                  onClick={handleTestSms}
                  disabled={sendingTest || !testPhone}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg transition-all transform hover:scale-105"
                  data-testid="button-test-sms"
                >
                  {sendingTest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar SMS de Teste
                    </>
                  )}
                </Button>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  O SMS de teste enviará um código de verificação de 6 dígitos. Certifique-se de salvar as configurações antes de testar.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6">
              <CardTitle className="text-2xl font-bold">Notas e Observações</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                  Notas (opcional)
                </Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  rows={4}
                  placeholder="Ex: Configurado em 20/10/2025 com número +5511987654321..."
                  className="resize-none"
                  data-testid="input-notes"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end sticky bottom-4 bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl border-2 border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              className="px-8"
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-8 bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg transition-all transform hover:scale-105"
              data-testid="button-save"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
