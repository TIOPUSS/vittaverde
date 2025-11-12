import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ExternalLink, Key, Shield, Activity, Stethoscope, Users, Clock, CheckCircle, Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const partnerFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  ssoUrl: z.string().url("URL de SSO inválida"),
  webhookUrl: z.string().url("URL de webhook inválida").optional().or(z.literal("")),
  sharedSecret: z.string().min(16, "Secret deve ter no mínimo 16 caracteres"),
  isActive: z.boolean().default(true),
  tokenExpirationMinutes: z.number().min(5).max(120).default(15),
  logoUrl: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  specialties: z.string().optional(),
  notes: z.string().optional(),
});

type PartnerFormData = z.infer<typeof partnerFormSchema>;

interface Partner {
  id: string;
  name: string;
  description?: string;
  ssoUrl: string;
  webhookUrl?: string;
  sharedSecret: string;
  isActive: boolean;
  tokenExpirationMinutes: number;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  specialties?: string[];
  notes?: string;
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function PartnerIntegrations() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partner-integrations"],
  });

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      name: "",
      description: "",
      ssoUrl: "",
      webhookUrl: "",
      sharedSecret: "",
      isActive: true,
      tokenExpirationMinutes: 15,
      logoUrl: "",
      contactEmail: "",
      contactPhone: "",
      specialties: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const response = await fetch("/api/admin/partner-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          specialties: data.specialties ? data.specialties.split(",").map(s => s.trim()) : [],
        }),
      });
      if (!response.ok) throw new Error("Failed to create partner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-integrations"] });
      toast({
        title: "✅ Parceiro criado!",
        description: "Integração configurada com sucesso.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "❌ Erro ao criar parceiro",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PartnerFormData> }) => {
      const response = await fetch(`/api/admin/partner-integrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          specialties: data.specialties ? (data.specialties as string).split(",").map(s => s.trim()) : undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to update partner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-integrations"] });
      toast({
        title: "✅ Parceiro atualizado!",
        description: "Alterações salvas com sucesso.",
      });
      setDialogOpen(false);
      setEditingPartner(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "❌ Erro ao atualizar",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/partner-integrations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete partner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-integrations"] });
      toast({
        title: "🗑️ Parceiro removido",
        description: "Integração excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erro ao excluir",
        description: "Não foi possível remover a integração.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PartnerFormData) => {
    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    form.reset({
      name: partner.name,
      description: partner.description || "",
      ssoUrl: partner.ssoUrl,
      webhookUrl: partner.webhookUrl || "",
      sharedSecret: partner.sharedSecret === "***HIDDEN***" ? "" : partner.sharedSecret,
      isActive: partner.isActive,
      tokenExpirationMinutes: partner.tokenExpirationMinutes,
      logoUrl: partner.logoUrl || "",
      contactEmail: partner.contactEmail || "",
      contactPhone: partner.contactPhone || "",
      specialties: partner.specialties?.join(", ") || "",
      notes: partner.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const generateRandomSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secret = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    form.setValue("sharedSecret", secret);
    toast({
      title: "🔑 Secret gerada!",
      description: "Chave aleatória criada com sucesso.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando parceiros...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <Navbar />
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 pt-24">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-xl">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Parceiros SSO
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Configure médicos parceiros para login automático seguro
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingPartner(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  data-testid="button-add-partner"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Parceiro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <Shield className="w-6 h-6 text-teal-600" />
                    {editingPartner ? "Editar Parceiro" : "Novo Parceiro SSO"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure a integração de Single Sign-On com médico parceiro
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                      <h3 className="font-semibold text-teal-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Informações Básicas
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Parceiro *</FormLabel>
                              <FormControl>
                                <Input placeholder="Dr. João Silva" {...field} data-testid="input-partner-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="logoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL do Logo</FormLabel>
                              <FormControl>
                                <Input placeholder="https://exemplo.com/logo.png" {...field} data-testid="input-logo-url" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Médico especialista em cannabis medicinal..." {...field} data-testid="input-partner-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* SSO Configuration */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Configuração SSO
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="ssoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL de SSO *</FormLabel>
                              <FormControl>
                                <Input placeholder="https://parceiro.com/sso/login" {...field} data-testid="input-sso-url" />
                              </FormControl>
                              <FormDescription>
                                Endpoint que receberá o token JWT para login automático
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="sharedSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chave Secreta Compartilhada *</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder={editingPartner ? "Deixe vazio para manter" : "Mínimo 16 caracteres"}
                                    {...field}
                                    data-testid="input-shared-secret"
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={generateRandomSecret}
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                                  data-testid="button-generate-secret"
                                >
                                  <Key className="w-4 h-4 mr-2" />
                                  Gerar
                                </Button>
                              </div>
                              <FormDescription>
                                Usada para assinar o JWT. Clique em "Gerar" para criar automaticamente.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tokenExpirationMinutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiração do Token (minutos)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  data-testid="input-token-expiration"
                                />
                              </FormControl>
                              <FormDescription>
                                Tempo de validade do JWT (5-120 minutos)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="webhookUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL de Webhook (Opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://parceiro.com/webhook" {...field} data-testid="input-webhook-url" />
                              </FormControl>
                              <FormDescription>
                                Notificação enviada quando paciente faz login
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Contact & Specialties */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5" />
                        Contato e Especialidades
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email de Contato</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="contato@parceiro.com" {...field} data-testid="input-contact-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone de Contato</FormLabel>
                              <FormControl>
                                <Input placeholder="+55 11 99999-9999" {...field} data-testid="input-contact-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="specialties"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Especialidades (separadas por vírgula)</FormLabel>
                            <FormControl>
                              <Input placeholder="Cardiologia, Neurologia, Cannabis Medicinal" {...field} data-testid="input-specialties" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Notas Internas</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Observações sobre o parceiro..." {...field} data-testid="input-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Active Toggle */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                          <div>
                            <FormLabel className="text-base font-semibold">Ativo</FormLabel>
                            <FormDescription>
                              Permitir que pacientes acessem este parceiro via SSO
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-is-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDialogOpen(false);
                          setEditingPartner(null);
                          form.reset();
                        }}
                        data-testid="button-cancel"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                        data-testid="button-save-partner"
                      >
                        {editingPartner ? "Salvar Alterações" : "Criar Parceiro"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        {partners && partners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl">
                    <Users className="h-8 w-8 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de Parceiros</p>
                    <p className="text-3xl font-bold text-gray-900">{partners.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Parceiros Ativos</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {partners.filter(p => p.isActive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de Acessos</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {partners.reduce((sum, p) => sum + (p.usageCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Partners Grid */}
        {partners && partners.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <Card 
                key={partner.id} 
                className="border-0 shadow-xl bg-white/90 backdrop-blur hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                data-testid={`card-partner-${partner.id}`}
              >
                <div className={`h-2 ${partner.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'}`} />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {partner.logoUrl ? (
                        <img src={partner.logoUrl} alt={partner.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                          <Stethoscope className="w-6 h-6 text-teal-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate text-lg">{partner.name}</CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">
                          {partner.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={partner.isActive ? "default" : "secondary"} className="flex-shrink-0">
                      {partner.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {partner.specialties && partner.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {partner.specialties.slice(0, 3).map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                          {specialty}
                        </Badge>
                      ))}
                      {partner.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                          +{partner.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Token: {partner.tokenExpirationMinutes}min</span>
                    </div>
                    {partner.usageCount > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span>{partner.usageCount} acesso{partner.usageCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 truncate">
                      <ExternalLink className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <a
                        href={partner.ssoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-purple-600 transition-colors"
                        data-testid={`link-sso-url-${partner.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {partner.ssoUrl}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(partner)}
                      className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                      data-testid={`button-edit-${partner.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(partner.id, partner.name)}
                      className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      data-testid={`button-delete-${partner.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full mb-6">
                <Shield className="w-16 h-16 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum parceiro configurado</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Adicione médicos parceiros para permitir que pacientes façam login automático com SSO
              </p>
              <Button 
                onClick={() => setDialogOpen(true)} 
                size="lg"
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-xl"
                data-testid="button-add-first-partner"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Primeiro Parceiro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
