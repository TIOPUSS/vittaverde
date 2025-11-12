import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import Navbar from '@/components/layout/navbar';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, Plus, Edit, Trash2, Power, Zap, AlertCircle, CheckCircle,
  Clock, Activity, Database, Webhook, Key, BookOpen, Newspaper, 
  Microscope, GraduationCap, Copy, Check, ExternalLink, ArrowLeft,
  Code, FileJson, Send, RefreshCw, Sparkles, Globe, Link2, Terminal
} from 'lucide-react';

const webhookConfigSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  webhookUrl: z.string().url("URL inválida"),
  contentType: z.enum(["educational", "news", "articles", "courses"]),
  frequency: z.enum(["realtime", "hourly", "daily", "weekly"]),
  filters: z.object({
    keywords: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    sources: z.array(z.string()).optional()
  }).optional(),
  isActive: z.boolean().default(true)
});

type WebhookConfigForm = z.infer<typeof webhookConfigSchema>;

interface N8nWebhook {
  id: string;
  name: string;
  webhookUrl: string;
  contentType: 'educational' | 'news' | 'articles' | 'courses';
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  filters?: {
    keywords?: string[];
    categories?: string[];
    sources?: string[];
  };
  isActive: boolean;
  lastTriggered?: string;
  successCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

const N8nConfigPage = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<N8nWebhook | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const baseUrl = window.location.origin;
  const webhookEndpoints = {
    educational: `${baseUrl}/api/n8n/webhook/educational-content`,
    news: `${baseUrl}/api/n8n/webhook/medical-news`,
    articles: `${baseUrl}/api/n8n/webhook/scientific-articles`,
    courses: `${baseUrl}/api/n8n/webhook/courses`
  };

  const { data: webhooks = [], isLoading } = useQuery<N8nWebhook[]>({
    queryKey: ['/api/n8n/webhooks'],
    retry: false,
  });

  const form = useForm<WebhookConfigForm>({
    resolver: zodResolver(webhookConfigSchema),
    defaultValues: {
      name: '',
      webhookUrl: '',
      contentType: 'educational',
      frequency: 'daily',
      isActive: true,
      filters: { keywords: [], categories: [], sources: [] }
    }
  });

  const createWebhook = useMutation({
    mutationFn: (data: WebhookConfigForm) => 
      fetch('/api/n8n/configure-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/webhooks'] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Webhook criado com sucesso!" });
    }
  });

  const toggleWebhook = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/n8n/webhooks/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/webhooks'] });
    }
  });

  const deleteWebhook = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/n8n/webhooks/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/webhooks'] });
      toast({ title: "Webhook excluído com sucesso!" });
    }
  });

  const updateWebhook = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WebhookConfigForm }) =>
      fetch(`/api/n8n/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/webhooks'] });
      setEditingWebhook(null);
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Webhook atualizado com sucesso!" });
    }
  });

  const onSubmit = (data: WebhookConfigForm) => {
    if (editingWebhook) {
      updateWebhook.mutate({ id: editingWebhook.id, data });
    } else {
      createWebhook.mutate(data);
    }
  };

  const handleEdit = (webhook: N8nWebhook) => {
    setEditingWebhook(webhook);
    form.reset({
      name: webhook.name,
      webhookUrl: webhook.webhookUrl,
      contentType: webhook.contentType,
      frequency: webhook.frequency,
      filters: webhook.filters || { keywords: [], categories: [], sources: [] },
      isActive: webhook.isActive
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (webhook: N8nWebhook) => {
    if (confirm(`Tem certeza que deseja excluir o webhook "${webhook.name}"?`)) {
      deleteWebhook.mutate(webhook.id);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    toast({ title: "URL copiada!", description: label });
    setTimeout(() => setCopiedUrl(''), 2000);
  };

  const getContentTypeIcon = (type: string) => {
    const icons = {
      educational: BookOpen,
      news: Newspaper,
      articles: Microscope,
      courses: GraduationCap
    };
    const Icon = icons[type as keyof typeof icons] || Database;
    return <Icon className="h-4 w-4" />;
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      realtime: 'bg-green-50 text-green-700 border-green-200',
      hourly: 'bg-blue-50 text-blue-700 border-blue-200', 
      daily: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      weekly: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[frequency as keyof typeof colors] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <Navbar />
      
      {/* Modern Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-green-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Integração N8N</h1>
                <p className="text-purple-100 text-lg flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Automação de Conteúdo Educacional Médico
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/admin/content-management">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" data-testid="button-manage-content">
                  <Database className="h-4 w-4 mr-2" />
                  Gerenciar Conteúdo
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="bg-white hover:bg-gray-50 text-gray-900" data-testid="button-back-admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 -mt-8 pb-12">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white transform hover:scale-105 transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Webhooks Ativos</p>
              <p className="text-4xl font-bold text-green-600 mb-1">{webhooks.filter(w => w.isActive).length}</p>
              <p className="text-xs text-gray-500">Coletando dados agora</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white transform hover:scale-105 transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Webhook className="h-6 w-6 text-blue-600" />
                </div>
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Webhooks</p>
              <p className="text-4xl font-bold text-blue-600 mb-1">{webhooks.length}</p>
              <p className="text-xs text-gray-500">Configurações salvas</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white transform hover:scale-105 transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <Sparkles className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Sucessos</p>
              <p className="text-4xl font-bold text-green-600 mb-1">
                {webhooks.reduce((acc, w) => acc + w.successCount, 0)}
              </p>
              <p className="text-xs text-gray-500">Conteúdos recebidos</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white transform hover:scale-105 transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-red-100 p-3 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <RefreshCw className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Erros</p>
              <p className="text-4xl font-bold text-red-600 mb-1">
                {webhooks.reduce((acc, w) => acc + w.errorCount, 0)}
              </p>
              <p className="text-xs text-gray-500">Requer atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <Settings className="h-6 w-6 mr-3 text-purple-600" />
                  Configuração e Documentação
                </CardTitle>
                <CardDescription className="mt-2">
                  Configure webhooks N8N e obtenha URLs de integração
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setEditingWebhook(null);
                  form.reset();
                  setShowCreateDialog(true);
                }} 
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg"
                data-testid="button-create-webhook"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Webhook
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs defaultValue="endpoints" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl h-auto">
                <TabsTrigger 
                  value="endpoints" 
                  className="flex items-center space-x-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                  data-testid="tab-endpoints"
                >
                  <Link2 className="h-4 w-4" />
                  <span className="font-medium">URLs de Webhook</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="webhooks" 
                  className="flex items-center space-x-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                  data-testid="tab-webhooks"
                >
                  <Webhook className="h-4 w-4" />
                  <span className="font-medium">Webhooks Ativos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="docs" 
                  className="flex items-center space-x-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                  data-testid="tab-docs"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">Documentação</span>
                </TabsTrigger>
              </TabsList>

              {/* URLs Tab */}
              <TabsContent value="endpoints" className="space-y-6">
                <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <AlertTitle className="text-blue-900 font-semibold">URLs de Webhook VittaVerde</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    Use estas URLs no N8N para enviar conteúdo automaticamente para a plataforma
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  {Object.entries(webhookEndpoints).map(([type, url]) => (
                    <Card key={type} className="border-2 hover:border-purple-300 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                {getContentTypeIcon(type)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 capitalize">
                                  {type === 'educational' ? 'Conteúdo Educacional' :
                                   type === 'news' ? 'Notícias Médicas' :
                                   type === 'articles' ? 'Artigos Científicos' : 'Cursos'}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  POST Request
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm break-all">
                              {url}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(url, type)}
                            className="shrink-0"
                            data-testid={`button-copy-${type}`}
                          >
                            {copiedUrl === type ? (
                              <><Check className="h-4 w-4 mr-2 text-green-600" /> Copiado!</>
                            ) : (
                              <><Copy className="h-4 w-4 mr-2" /> Copiar</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Terminal className="h-5 w-5 text-amber-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-amber-900 mb-2">Formato de Dados Esperado (JSON)</h3>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "title": "Título do Conteúdo",
  "description": "Descrição breve",
  "content": "Conteúdo completo em texto",
  "category": "basics|advanced|clinical|research",
  "specialty": "general|neurology|oncology|psychiatry",
  "difficulty": "beginner|intermediate|advanced",
  "duration": 15,
  "imageUrl": "https://...",
  "videoUrl": "https://...",
  "tags": ["cbd", "cannabis"],
  "featured": false,
  "isActive": true
}`}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Webhooks Tab */}
              <TabsContent value="webhooks" className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : webhooks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Webhook className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">Nenhum webhook configurado</p>
                    <p className="text-gray-500 text-sm mt-1">Crie seu primeiro webhook para começar a receber conteúdo</p>
                    <Button 
                      onClick={() => setShowCreateDialog(true)} 
                      className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Webhook
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Nome & URL</TableHead>
                          <TableHead className="font-semibold">Tipo</TableHead>
                          <TableHead className="font-semibold">Frequência</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Resultados</TableHead>
                          <TableHead className="font-semibold">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {webhooks.map((webhook) => (
                          <TableRow key={webhook.id} className="hover:bg-purple-50/50" data-testid={`webhook-row-${webhook.id}`}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  {getContentTypeIcon(webhook.contentType)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{webhook.name}</div>
                                  <div className="text-xs text-gray-500 truncate max-w-xs font-mono">
                                    {webhook.webhookUrl}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {webhook.contentType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getFrequencyBadge(webhook.frequency)} border capitalize`}>
                                {webhook.frequency}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={webhook.isActive}
                                  onCheckedChange={(checked) => 
                                    toggleWebhook.mutate({ id: webhook.id, isActive: checked })
                                  }
                                  disabled={toggleWebhook.isPending}
                                  data-testid={`switch-active-${webhook.id}`}
                                />
                                <span className={`text-sm font-medium ${webhook.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                  {webhook.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {webhook.successCount} sucessos
                                </div>
                                {webhook.errorCount > 0 && (
                                  <div className="flex items-center text-sm text-red-600">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    {webhook.errorCount} erros
                                  </div>
                                )}
                                {webhook.lastTriggered && (
                                  <div className="text-xs text-gray-500">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {new Date(webhook.lastTriggered).toLocaleString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEdit(webhook)}
                                  className="hover:bg-blue-50"
                                  data-testid={`button-edit-${webhook.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:bg-red-50" 
                                  onClick={() => handleDelete(webhook)}
                                  data-testid={`button-delete-${webhook.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Documentation Tab */}
              <TabsContent value="docs" className="space-y-6">
                <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-900 font-semibold">Guia Completo de Integração N8N</AlertTitle>
                  <AlertDescription className="text-green-800">
                    Siga os passos abaixo para configurar a automação de conteúdo
                  </AlertDescription>
                </Alert>

                <Card className="border-2">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                    <CardTitle className="flex items-center text-lg">
                      <Code className="h-5 w-5 mr-2 text-purple-600" />
                      Passo 1: Configurar Workflow no N8N
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ol className="list-decimal list-inside space-y-3 text-gray-700">
                      <li className="font-medium">Acesse sua instância N8N</li>
                      <li className="font-medium">Crie um novo Workflow</li>
                      <li className="font-medium">Adicione nó de coleta de dados:
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm font-normal">
                          <li>HTTP Request (para APIs externas)</li>
                          <li>RSS Feed (para feeds RSS)</li>
                          <li>Google Sheets (para planilhas)</li>
                          <li>Webhook (para receber dados)</li>
                        </ul>
                      </li>
                      <li className="font-medium">Configure filtros e transformações de dados</li>
                      <li className="font-medium">Adicione nó HTTP Request para enviar para VittaVerde</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="flex items-center text-lg">
                      <Send className="h-5 w-5 mr-2 text-blue-600" />
                      Passo 2: Configurar HTTP Request Node
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">Método:</h4>
                      <Badge className="bg-green-100 text-green-800 font-mono">POST</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">URL:</h4>
                      <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm break-all">
                        {webhookEndpoints.educational}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        (Escolha a URL correspondente ao tipo de conteúdo na aba "URLs de Webhook")
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">Headers:</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm">
{`Content-Type: application/json`}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">Body (JSON):</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "title": "{{$node["Nome_do_No_Anterior"].json["campo_titulo"]}}",
  "description": "{{$node["Nome_do_No_Anterior"].json["campo_descricao"]}}",
  "content": "{{$node["Nome_do_No_Anterior"].json["campo_conteudo"]}}",
  "category": "basics",
  "specialty": "general",
  "difficulty": "beginner",
  "duration": 15,
  "imageUrl": "{{$node["Nome_do_No_Anterior"].json["campo_imagem"]}}",
  "videoUrl": "",
  "tags": ["cbd", "cannabis"],
  "featured": false,
  "isActive": true
}`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                    <CardTitle className="flex items-center text-lg">
                      <CheckCircle className="h-5 w-5 mr-2 text-amber-600" />
                      Passo 3: Testar e Ativar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ol className="list-decimal list-inside space-y-3 text-gray-700">
                      <li className="font-medium">Execute o workflow manualmente no N8N</li>
                      <li className="font-medium">Verifique os logs do nó HTTP Request</li>
                      <li className="font-medium">Confira se o conteúdo apareceu em "Gerenciar Conteúdo"</li>
                      <li className="font-medium">Configure Schedule Trigger:
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm font-normal">
                          <li>Every Hour (a cada hora)</li>
                          <li>Every Day (diariamente)</li>
                          <li>Custom Cron (personalizado)</li>
                        </ul>
                      </li>
                      <li className="font-medium">Ative o workflow no N8N</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="border-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-6 w-6 text-purple-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-purple-900 mb-3">Exemplos de Fontes de Dados</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-lg border">
                            <h4 className="font-medium text-sm mb-1">PubMed API</h4>
                            <p className="text-xs text-gray-600">Artigos científicos sobre cannabis</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border">
                            <h4 className="font-medium text-sm mb-1">RSS Feeds</h4>
                            <p className="text-xs text-gray-600">Notícias de sites especializados</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border">
                            <h4 className="font-medium text-sm mb-1">Google Scholar</h4>
                            <p className="text-xs text-gray-600">Pesquisas acadêmicas</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border">
                            <h4 className="font-medium text-sm mb-1">NewsAPI</h4>
                            <p className="text-xs text-gray-600">Notícias em tempo real</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                  <AlertTitle className="text-blue-900 font-semibold">Recursos Externos</AlertTitle>
                  <AlertDescription className="text-blue-800 space-y-2">
                    <p>Documentação oficial do N8N: <a href="https://docs.n8n.io" target="_blank" rel="noopener" className="underline font-medium">docs.n8n.io</a></p>
                    <p>Exemplos de workflows: <a href="https://n8n.io/workflows" target="_blank" rel="noopener" className="underline font-medium">n8n.io/workflows</a></p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center">
              <Webhook className="h-6 w-6 mr-2 text-purple-600" />
              {editingWebhook ? 'Editar Webhook N8N' : 'Configurar Novo Webhook N8N'}
            </DialogTitle>
            <DialogDescription>
              Configure um webhook do N8N para enviar dados para a plataforma
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Webhook *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Artigos Cannabis Medicina" data-testid="input-name" />
                      </FormControl>
                      <FormDescription>Nome descritivo para identificar este webhook</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="webhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Webhook N8N *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://n8n.exemplo.com/webhook/..." data-testid="input-webhook-url" />
                      </FormControl>
                      <FormDescription>URL do webhook criado no seu workflow N8N</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Conteúdo *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-content-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="educational">Material Educacional</SelectItem>
                            <SelectItem value="news">Notícias Médicas</SelectItem>
                            <SelectItem value="articles">Artigos Científicos</SelectItem>
                            <SelectItem value="courses">Cursos Online</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-frequency">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="realtime">Tempo Real</SelectItem>
                            <SelectItem value="hourly">A Cada Hora</SelectItem>
                            <SelectItem value="daily">Diariamente</SelectItem>
                            <SelectItem value="weekly">Semanalmente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-gray-900">Filtros Opcionais</h4>
                  <FormField
                    control={form.control}
                    name="filters.keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Palavras-chave</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="CBD, cannabis, epilepsia (separados por vírgula)"
                            onChange={(e) => field.onChange(e.target.value.split(',').map(k => k.trim()))}
                            data-testid="input-keywords"
                          />
                        </FormControl>
                        <FormDescription>Filtre conteúdo por palavras-chave específicas</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="filters.sources"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fontes Preferenciais</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="pubmed.gov, anvisa.gov.br (separados por vírgula)"
                            onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                            data-testid="input-sources"
                          />
                        </FormControl>
                        <FormDescription>Priorize conteúdo de fontes específicas</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-green-50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-semibold">Ativar Webhook</FormLabel>
                        <FormDescription>
                          O webhook começará a receber e processar dados imediatamente
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingWebhook(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    disabled={createWebhook.isPending || updateWebhook.isPending}
                    data-testid="button-submit"
                  >
                    {(createWebhook.isPending || updateWebhook.isPending) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {editingWebhook ? 'Atualizando...' : 'Criando...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {editingWebhook ? 'Atualizar Webhook' : 'Criar Webhook'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default N8nConfigPage;
