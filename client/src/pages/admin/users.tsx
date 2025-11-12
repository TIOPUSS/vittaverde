import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  Users, Search, Filter, Eye, Edit, Trash2, Plus,
  UserCheck, Stethoscope, Heart, Shield
} from "lucide-react";

const userFormSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  role: z.enum(["patient", "doctor", "consultant", "admin", "vendor"]),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  commissionRate: z.string().optional(),
  customCode: z.string().optional()
});

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      phone: "",
      role: "patient",
      password: "",
      commissionRate: "10"
    }
  });

  // Fetch users from API
  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/users']
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userFormSchema>) => {
      // Criar usuário (backend já processa comissão do consultant)
      const user = await apiRequest('/api/users', 'POST', userData) as any;
      
      // Apenas vendedor externo tem link de rastreamento
      if (userData.role === 'vendor' && user?.id) {
        const commissionRate = userData.commissionRate ? parseFloat(userData.commissionRate) / 100 : 0.10;
        await apiRequest(`/api/admin/vendor/enable/${user.id}`, 'POST', {
          commissionRate,
          customCode: userData.customCode || undefined
        });
      }
      
      return user;
    },
    onSuccess: (user: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "✅ Usuário criado",
        description: user.role === 'vendor' ? "Vendedor externo criado com link de rastreamento!" : "Usuário criado com sucesso!",
      });
      setIsNewUserDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: any }) => {
      return await apiRequest(`/api/users/${id}`, 'PUT', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Usuário atualizado",
        description: "Usuário atualizado com sucesso!",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Erro", 
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/users/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Usuário excluído",
        description: "Usuário excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      });
    }
  });

  const handleCreateUser = (data: z.infer<typeof userFormSchema>) => {
    createUserMutation.mutate(data);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    form.reset({
      fullName: user.fullName,
      username: user.username, 
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: "",
      commissionRate: user.commissionRate || "10"
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = (data: z.infer<typeof userFormSchema>) => {
    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        userData: data
      });
    }
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "patient": return <Heart className="h-4 w-4" />;
      case "doctor": return <Stethoscope className="h-4 w-4" />;
      case "consultant": return <Users className="h-4 w-4" />;
      case "admin": return <Shield className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "patient": return "Paciente";
      case "doctor": return "Médico";
      case "consultant": return "Comercial";
      case "admin": return "Admin";
      case "vendor": return "Vendedor Externo";
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "patient": return "bg-green-100 text-green-800";
      case "doctor": return "bg-teal-100 text-teal-800";
      case "consultant": return "bg-emerald-100 text-emerald-800";
      case "admin": return "bg-lime-100 text-lime-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || (user.status || "active") === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Elementos Decorativos */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-green-200/40 to-emerald-200/40 rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-gradient-to-r from-teal-200/30 to-green-200/30 rounded-full opacity-50 animate-bounce"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-r from-emerald-300/20 to-green-300/20 rounded-full animate-float"></div>
      
      <Navbar />
      
      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Gerenciar Usuários
              </span>
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              Administre todos os usuários da plataforma <strong className="text-green-600">VittaVerde</strong>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button 
                variant="outline" 
                className="border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 font-semibold"
                data-testid="button-back-admin"
              >
                ← Voltar ao Dashboard
              </Button>
            </Link>
            <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  data-testid="button-add-user"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-2 border-green-100">
                <DialogHeader className="pb-6 border-b-2 border-green-100">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Criar Novo Usuário</DialogTitle>
                  <p className="text-gray-600 mt-2">Preencha os dados para criar um novo usuário na plataforma <strong className="text-green-600">VittaVerde</strong></p>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-5 pt-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Nome Completo</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Digite o nome completo"
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Nome de Usuário</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="nome.usuario"
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="usuario@email.com"
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Telefone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999"
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Tipo de Usuário</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger 
                                className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium"
                                data-testid="select-user-role"
                              >
                                <SelectValue placeholder="Selecione o tipo de usuário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="patient">
                                <div className="flex items-center space-x-2">
                                  <Heart className="h-4 w-4 text-green-600" />
                                  <span>Paciente</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="doctor">
                                <div className="flex items-center space-x-2">
                                  <Stethoscope className="h-4 w-4 text-blue-600" />
                                  <span>Médico</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="consultant">
                                <div className="flex items-center space-x-2">
                                  <UserCheck className="h-4 w-4 text-purple-600" />
                                  <span>Comercial</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center space-x-2">
                                  <Shield className="h-4 w-4 text-orange-600" />
                                  <span>Administrador</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="vendor">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-emerald-600" />
                                  <span>Vendedor Externo</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("role") === "vendor" && (
                      <FormField
                        control={form.control}
                        name="customCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-gray-700">Código Personalizado (opcional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: EMPRESAXYZ (deixe vazio para gerar automaticamente)"
                                className="h-12 border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {(form.watch("role") === "vendor" || form.watch("role") === "consultant") && (
                      <FormField
                        control={form.control}
                        name="commissionRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-gray-700">Taxa de Comissão (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="10"
                                className="h-12 border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-700">Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Digite uma senha segura"
                              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-3 pt-6 border-t-2 border-green-100">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsNewUserDialogOpen(false)}
                        className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 font-semibold"
                        data-testid="button-cancel-user"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createUserMutation.isPending}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        data-testid="button-create-user"
                      >
                        {createUserMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span>Criando...</span>
                          </div>
                        ) : (
                          "Criar Usuário"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Total de Usuários</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{users.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl group-hover:rotate-12 transition-transform">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Pacientes</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{users.filter(u => u.role === 'patient').length}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-hover:rotate-12 transition-transform">
                  <Heart className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Médicos</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{users.filter(u => u.role === 'doctor').length}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl group-hover:rotate-12 transition-transform">
                  <Stethoscope className="h-8 w-8 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100 hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Admins</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-lime-100 to-lime-200 rounded-xl group-hover:rotate-12 transition-transform">
                  <Shield className="h-8 w-8 text-lime-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-xl border border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-gray-900">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mr-4">
                <Filter className="h-6 w-6 text-green-600" />
              </div>
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou usuário..."
                  className="pl-10 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-users"
                />
              </div>
              
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium" data-testid="select-filter-role">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="patient">Paciente</SelectItem>
                  <SelectItem value="doctor">Médico</SelectItem>
                  <SelectItem value="consultant">Comercial</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="vendor">Vendedor Externo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium" data-testid="select-filter-status">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-2xl text-gray-900">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl mr-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                Lista de Usuários ({filteredUsers.length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando usuários...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="space-y-4">
                  {filteredUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-green-50/30 rounded-xl border-2 border-green-100 hover:border-green-300 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`p-3 rounded-xl ${getRoleColor(user.role)} group-hover:scale-110 transition-transform`}>
                              {getRoleIcon(user.role)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors">{user.fullName}</h3>
                              <p className="text-sm text-gray-600 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-900 font-medium">{user.email}</p>
                          <p className="text-sm text-gray-600">{user.phone}</p>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Badge className={`${getRoleColor(user.role)} font-semibold px-3 py-1 rounded-full`}>
                            <span className="mr-1">{getRoleIcon(user.role)}</span>
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Badge className={`${getStatusColor(user.status || "active")} font-semibold px-3 py-1 rounded-full`}>
                            {(user.status || "active") === 'active' ? '✅ Ativo' : user.status}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600">
                          <p>Criado em: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                          <p>Último login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {user.role === 'patient' && user.clientId && (
                          <Link href={`/admin/paciente/${user.clientId}/bem-estar`}>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                              data-testid={`button-wellness-${user.id}`}
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                          onClick={() => handleViewUser(user)}
                          data-testid={`button-view-${user.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all"
                          onClick={() => handleEditUser(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all" 
                          onClick={() => handleDeleteUser(user.id)}
                          data-testid={`button-delete-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border-2 border-green-100 shadow-2xl">
          <DialogHeader className="pb-6 border-b-2 border-green-100">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Editar Usuário</DialogTitle>
            <p className="text-gray-600 mt-2">Atualize os dados do usuário <strong className="text-green-600">{selectedUser?.fullName}</strong></p>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Nome Completo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome completo" 
                        className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Usuário</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="nome.usuario" 
                        className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="email@exemplo.com" 
                        className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Telefone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(11) 99999-9999" 
                        className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Tipo de Usuário</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="patient">Paciente</SelectItem>
                        <SelectItem value="doctor">Médico</SelectItem>
                        <SelectItem value="consultant">Comercial</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="vendor">Vendedor Externo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Nova Senha (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Deixe em branco para manter atual" 
                        className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("role") === "consultant" && (
                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-gray-700">
                        Taxa de Comissão (%)
                        <span className="text-xs text-gray-500 ml-2">Porcentagem sobre vendas fechadas</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="10" 
                          className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                          {...field} 
                          data-testid="input-commission-rate"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500 mt-1">
                        Taxa padrão: 10%. Ex: Para uma venda de R$ 1.000, a comissão será R$ {((parseFloat(field.value || "10") / 100) * 1000).toFixed(0)}.
                      </p>
                    </FormItem>
                  )}
                />
              )}
              <div className="flex justify-end space-x-3 pt-6 border-t-2 border-green-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 font-semibold"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  {updateUserMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Atualizando...</span>
                    </div>
                  ) : (
                    "Atualizar Usuário"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white border-2 border-green-100 shadow-2xl">
          <DialogHeader className="pb-6 border-b-2 border-green-100">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${getRoleColor(selectedUser.role)}`}>
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.fullName}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Telefone</p>
                  <p className="text-sm text-gray-900">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Tipo</p>
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {getRoleLabel(selectedUser.role)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <Badge className={getStatusColor(selectedUser.status || "active")}>
                    {(selectedUser.status || "active") === 'active' ? 'Ativo' : selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Criado em</p>
                  <p className="text-sm text-gray-900">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Último login</p>
                  <p className="text-sm text-gray-900">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                  </p>
                </div>
              </div>
              
              {(selectedUser.isExternalVendor || selectedUser.role === 'vendor') && selectedUser.affiliateCode && (
                <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                  <p className="text-sm font-bold text-emerald-800 mb-2">🔗 Link de Rastreamento (Vendedor Externo)</p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-2 bg-white border border-emerald-300 rounded text-sm text-emerald-900 font-mono">
                      {import.meta.env.PROD 
                        ? `https://vittaverde.com/${selectedUser.affiliateCode.toLowerCase()}`
                        : `https://${window.location.host}/${selectedUser.affiliateCode.toLowerCase()}`
                      }
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => {
                        const link = import.meta.env.PROD 
                          ? `https://vittaverde.com/${selectedUser.affiliateCode.toLowerCase()}`
                          : `https://${window.location.host}/${selectedUser.affiliateCode.toLowerCase()}`;
                        navigator.clipboard.writeText(link);
                        toast({ title: "✅ Link copiado!", description: "Link de rastreamento copiado para a área de transferência" });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-emerald-600 mt-2">
                    Código: <strong>{selectedUser.affiliateCode}</strong> | 
                    Comissão: <strong>{selectedUser.commissionRate ? parseFloat(selectedUser.commissionRate).toFixed(0) : 10}%</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}