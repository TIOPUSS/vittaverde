import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Tag, Plus, Edit, Trash2, Search, Palette, 
  CheckCircle, AlertCircle, Hash
} from "lucide-react";

// Tag form schema
const tagSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  color: z.string().min(1, "Cor é obrigatória"),
  isActive: z.boolean().default(true),
});

type TagForm = z.infer<typeof tagSchema>;

// Predefined color options
const colorOptions = [
  { name: "Vermelho", value: "red", bg: "bg-red-500", text: "text-red-700", bgLight: "bg-red-50" },
  { name: "Laranja", value: "orange", bg: "bg-orange-500", text: "text-orange-700", bgLight: "bg-orange-50" },
  { name: "Amarelo", value: "yellow", bg: "bg-yellow-500", text: "text-yellow-700", bgLight: "bg-yellow-50" },
  { name: "Verde", value: "green", bg: "bg-green-500", text: "text-green-700", bgLight: "bg-green-50" },
  { name: "Azul", value: "blue", bg: "bg-blue-500", text: "text-blue-700", bgLight: "bg-blue-50" },
  { name: "Índigo", value: "indigo", bg: "bg-indigo-500", text: "text-indigo-700", bgLight: "bg-indigo-50" },
  { name: "Roxo", value: "purple", bg: "bg-purple-500", text: "text-purple-700", bgLight: "bg-purple-50" },
  { name: "Rosa", value: "pink", bg: "bg-pink-500", text: "text-pink-700", bgLight: "bg-pink-50" },
  { name: "Cinza", value: "gray", bg: "bg-gray-500", text: "text-gray-700", bgLight: "bg-gray-50" },
  { name: "Esmeralda", value: "emerald", bg: "bg-emerald-500", text: "text-emerald-700", bgLight: "bg-emerald-50" },
  { name: "Teal", value: "teal", bg: "bg-teal-500", text: "text-teal-700", bgLight: "bg-teal-50" },
  { name: "Cyan", value: "cyan", bg: "bg-cyan-500", text: "text-cyan-700", bgLight: "bg-cyan-50" },
];

export default function AdminTagsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState("green");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for new/edit tags
  const form = useForm<TagForm>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "green",
      isActive: true,
    },
  });

  // Fetch tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["/api/tags"],
    retry: false,
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: TagForm) => {
      return await apiRequest("/api/tags", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Tag criada!",
        description: "A tag foi adicionada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setShowNewTagDialog(false);
      form.reset();
      setSelectedColor("green");
    },
    onError: () => {
      toast({
        title: "❌ Erro ao criar tag",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TagForm }) => {
      return await apiRequest(`/api/tags/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Tag atualizada!",
        description: "As informações da tag foram atualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setEditingTag(null);
      form.reset();
      setSelectedColor("green");
    },
    onError: () => {
      toast({
        title: "❌ Erro ao atualizar",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/tags/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "✅ Tag removida!",
        description: "A tag foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    },
    onError: () => {
      toast({
        title: "❌ Erro ao remover",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TagForm) => {
    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, data });
    } else {
      createTagMutation.mutate(data);
    }
  };

  const handleEditTag = (tag: any) => {
    setEditingTag(tag);
    setSelectedColor(tag.color);
    form.reset({
      name: tag.name,
      description: tag.description || "",
      color: tag.color,
      isActive: tag.isActive,
    });
    setShowNewTagDialog(true);
  };

  const handleDeleteTag = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta tag?")) {
      deleteTagMutation.mutate(id);
    }
  };

  const handleNewTag = () => {
    setEditingTag(null);
    form.reset({
      name: "",
      description: "",
      color: "green",
      isActive: true,
    });
    setSelectedColor("green");
    setShowNewTagDialog(true);
  };

  // Use API data or show loading state
  const tagsList = Array.isArray(tags) ? tags : [];

  // Filter tags
  const filteredTags = tagsList.filter((tag: any) => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && tag.isActive) ||
                         (filterStatus === "inactive" && !tag.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: tagsList.length,
    active: tagsList.filter((t: any) => t.isActive).length,
    colors: tagsList.reduce((acc: string[], tag: any) => {
      if (!acc.includes(tag.color)) {
        acc.push(tag.color);
      }
      return acc;
    }, []).length,
  };

  // Get color data for a tag
  const getColorData = (colorValue: string) => {
    return colorOptions.find(c => c.value === colorValue) || colorOptions[0];
  };

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
            <h1 className="text-2xl lg:text-3xl font-bold mb-3 leading-tight">
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Gerenciar Tags
              </span>
            </h1>
            <p className="text-base text-gray-700 leading-relaxed">
              Administre as tags para organizar o <strong className="text-green-600">CRM e conteúdo</strong>
            </p>
            <div className="flex items-center mt-4">
              <Link href="/admin">
                <Button 
                  variant="outline" 
                  className="border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 font-semibold mr-4"
                >
                  ← Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
          
          <Button 
            onClick={handleNewTag}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            data-testid="button-new-tag"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Tag
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-green-100 hover:shadow-xl transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Total de Tags</p>
                  <p className="text-2xl font-bold text-green-600">{stats.total}</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-green-100 hover:shadow-xl transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tags Ativas</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-green-100 hover:shadow-xl transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Cores Utilizadas</p>
                  <p className="text-2xl font-bold text-teal-600">{stats.colors}</p>
                </div>
                <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
                  <Palette className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-xl border border-green-100">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-200 focus:border-green-500 rounded-xl"
                  data-testid="input-search-tags"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border-2 border-gray-200 focus:border-green-500 rounded-xl px-3 py-2 bg-white"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Apenas Ativas</option>
                <option value="inactive">Apenas Inativas</option>
              </select>
              
              <div className="text-sm text-gray-600 flex items-center">
                Mostrando {filteredTags.length} tags
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags List */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-green-100">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
              <Hash className="h-6 w-6 mr-2 text-green-600" />
              Lista de Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600 mb-2">
                  {searchTerm ? "Nenhuma tag encontrada" : "Nenhuma tag cadastrada"}
                </p>
                <p className="text-gray-500">
                  {searchTerm ? "Tente ajustar os filtros" : "Comece criando sua primeira tag"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTags.map((tag: any) => {
                  const colorData = getColorData(tag.color);
                  return (
                    <Card 
                      key={tag.id} 
                      className="bg-white border-2 border-gray-100 hover:border-green-300 hover:shadow-lg transition-all group"
                      data-testid={`card-tag-${tag.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${colorData.bg}`}></div>
                            <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                              {tag.name}
                            </h3>
                          </div>
                          <Badge variant={tag.isActive ? "default" : "secondary"}>
                            {tag.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        
                        {tag.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {tag.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${colorData.bgLight} ${colorData.text}`}>
                            {colorData.name}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTag(tag)}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                              data-testid={`button-edit-tag-${tag.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTag(tag.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              data-testid={`button-delete-tag-${tag.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New/Edit Tag Dialog */}
      <Dialog open={showNewTagDialog} onOpenChange={setShowNewTagDialog}>
        <DialogContent className="max-w-lg bg-white border-2 border-green-100 shadow-2xl">
          <DialogHeader className="pb-6 border-b-2 border-green-100">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {editingTag ? "Editar Tag" : "Nova Tag"}
            </DialogTitle>
            <p className="text-gray-600 mt-2">Preencha as informações da tag para organização</p>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Nome da Tag</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Urgente, Importante, Revisão" 
                        className="h-10 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400"
                        {...field} 
                        data-testid="input-tag-name" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição da tag e quando usá-la" 
                        className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white font-medium placeholder:text-gray-400 min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Cor da Tag</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              field.onChange(color.value);
                              setSelectedColor(color.value);
                            }}
                            className={`p-3 rounded-xl border-2 transition-all hover:scale-105 min-h-[80px] flex flex-col items-center justify-center ${
                              field.value === color.value 
                                ? "border-gray-800 shadow-lg scale-105" 
                                : "border-gray-200 hover:border-gray-400"
                            }`}
                            data-testid={`button-color-${color.value}`}
                          >
                            <div className={`w-8 h-8 rounded-full ${color.bg} mx-auto mb-1`}></div>
                            <p className="text-xs font-medium text-gray-700 text-center leading-tight break-words">{color.name}</p>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-gray-300"
                        data-testid="checkbox-tag-active"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-bold text-gray-700">Tag ativa</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewTagDialog(false)}
                  className="border-2 border-gray-300 hover:border-gray-400"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  disabled={createTagMutation.isPending || updateTagMutation.isPending}
                  data-testid="button-save-tag"
                >
                  {createTagMutation.isPending || updateTagMutation.isPending ? "Salvando..." : "Salvar Tag"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}