import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, ShoppingCart, RefreshCw, Zap, Eye, EyeOff, Package2, TrendingUp } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

const yampiConfigSchema = z.object({
  alias: z.string().min(1, "Alias é obrigatório"),
  userToken: z.string().min(1, "User Token é obrigatório"),
  secretKey: z.string().min(1, "Secret Key é obrigatória"),
  isActive: z.boolean().default(false),
  autoSyncProducts: z.boolean().default(false),
});

type YampiConfigForm = z.infer<typeof yampiConfigSchema>;

export default function YampiConfigPage() {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState(false);

  // Buscar configuração existente
  const { data: config, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/yampi-config"],
  });

  const form = useForm<YampiConfigForm>({
    resolver: zodResolver(yampiConfigSchema),
    values: config || {
      alias: "",
      userToken: "",
      secretKey: "",
      isActive: false,
      autoSyncProducts: false,
    },
  });

  const isActive = form.watch("isActive");

  // Mutation para salvar configuração
  const saveMutation = useMutation({
    mutationFn: async (data: YampiConfigForm) => {
      const response = await fetch("/api/admin/yampi-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao salvar configuração");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/yampi-config"] });
      toast({
        title: "✅ Configuração salva!",
        description: "Credenciais YAMPI atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para testar conexão
  const testMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const response = await fetch("/api/admin/yampi-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          alias: values.alias,
          userToken: values.userToken,
          secretKey: values.secretKey,
        }),
      });
      if (!response.ok) throw new Error("Erro ao testar conexão");
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: "✅ Conexão bem-sucedida!",
          description: data.message,
        });
      } else {
        toast({
          title: "❌ Erro na conexão",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao testar conexão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para sincronizar produtos
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/yampi-sync-products", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erro ao sincronizar produtos");
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/yampi-config"] });
      toast({
        title: "✅ Sincronização concluída!",
        description: `${data.success} produtos sincronizados com sucesso. ${data.failed > 0 ? `${data.failed} falharam.` : ""}`,
      });

      if (data.errors && data.errors.length > 0) {
        console.error("Erros de sincronização:", data.errors);
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    if (!config || !config.isActive) {
      toast({
        title: "⚠️ YAMPI não ativada",
        description: "Ative a configuração e salve antes de sincronizar.",
        variant: "destructive",
      });
      return;
    }
    syncMutation.mutate();
  };

  const onSubmit = (data: YampiConfigForm) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header com glassmorphism */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-indigo-500/10 blur-3xl -z-10" />
          <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl border border-white/20 shadow-2xl p-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl">
                <ShoppingCart className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Configuração YAMPI
                  </h1>
                  {config?.isActive && (
                    <Badge className="bg-green-500 text-white">Ativo</Badge>
                  )}
                </div>
                <p className="text-gray-600 text-lg">
                  Integração completa com YAMPI - Checkout, Carrinho, Pagamento e Frete
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        {config && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Status Card */}
            <Card className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {config.isActive ? (
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      <XCircle className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Status</p>
                    <p className="text-xl font-bold text-gray-900">
                      {config.isActive ? "Ativa" : "Inativa"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Sync Card */}
            <Card className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <RefreshCw className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Última Sync</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {config.lastSync
                        ? new Date(config.lastSync).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Nunca"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auto Sync Card */}
            <Card className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Sync Auto</p>
                    <p className="text-xl font-bold text-gray-900">
                      {config.autoSyncProducts ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Formulário - 2 colunas */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur border-b border-white/20">
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-blue-600" />
                  Credenciais de API
                </CardTitle>
                <CardDescription>
                  Configure suas credenciais da YAMPI. Encontre-as no painel YAMPI em Configurações → API
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Alias */}
                    <FormField
                      control={form.control}
                      name="alias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            Alias da Loja
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="vittaverde"
                              className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl backdrop-blur bg-white/50 transition-all"
                              {...field}
                              data-testid="input-yampi-alias"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Seu identificador único na YAMPI (ex: vittaverde)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* User Token */}
                    <FormField
                      control={form.control}
                      name="userToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            User Token
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showSecrets ? "text" : "password"}
                                placeholder="••••••••••••••••"
                                className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl backdrop-blur bg-white/50 pr-12 font-mono transition-all"
                                {...field}
                                data-testid="input-yampi-token"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                              onClick={() => setShowSecrets(!showSecrets)}
                            >
                              {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Secret Key */}
                    <FormField
                      control={form.control}
                      name="secretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            Secret Key
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showSecrets ? "text" : "password"}
                                placeholder="••••••••••••••••"
                                className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl backdrop-blur bg-white/50 pr-12 font-mono transition-all"
                                {...field}
                                data-testid="input-yampi-secret"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                              onClick={() => setShowSecrets(!showSecrets)}
                            >
                              {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Switches */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 rounded-xl backdrop-blur bg-gradient-to-r from-green-50/50 to-emerald-50/50 border border-green-200/50">
                            <div>
                              <FormLabel className="text-sm font-semibold text-gray-900">
                                Ativar YAMPI
                              </FormLabel>
                              <FormDescription className="text-xs mt-1">
                                Habilita o checkout e pagamentos via YAMPI
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-yampi-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="autoSyncProducts"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 rounded-xl backdrop-blur bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border border-blue-200/50">
                            <div>
                              <FormLabel className="text-sm font-semibold text-gray-900">
                                Sincronização Automática
                              </FormLabel>
                              <FormDescription className="text-xs mt-1">
                                Sincroniza produtos automaticamente ao criar/editar
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-yampi-auto-sync"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => testMutation.mutate()}
                        disabled={testMutation.isPending}
                        className="flex-1 h-12 border-2 border-blue-300 hover:bg-blue-50 transition-all"
                        data-testid="button-test-connection"
                      >
                        {testMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testando...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Testar Conexão
                          </>
                        )}
                      </Button>

                      <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all"
                        data-testid="button-save-config"
                      >
                        {saveMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Salvar Configuração
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1 coluna */}
          <div className="space-y-6">
            {/* Sync Products Card */}
            <Card className="backdrop-blur-xl bg-white/70 border border-white/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur border-b border-white/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                  Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Sincronize seus produtos com a YAMPI para que apareçam no checkout
                </p>
                <Button
                  onClick={handleSync}
                  disabled={syncMutation.isPending || !isActive}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                  data-testid="button-sync-products"
                >
                  {syncMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sincronizar Produtos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="backdrop-blur-xl bg-gradient-to-br from-yellow-50/80 to-orange-50/80 border border-yellow-200/50 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="text-2xl">💡</div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-semibold">Como obter as credenciais:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
                      <li>Acesse o painel da YAMPI</li>
                      <li>Vá em Configurações → API</li>
                      <li>Copie o User Token e Secret Key</li>
                      <li>O Alias é seu identificador na URL</li>
                    </ol>
                    <p className="mt-4 pt-4 border-t border-yellow-300/30 text-xs">
                      <strong>Importante:</strong> Mantenha suas credenciais seguras.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
