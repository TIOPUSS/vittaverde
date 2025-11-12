import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import Navbar from '@/components/layout/navbar';
import { SimpleFileUpload } from '@/components/SimpleFileUpload';
import { 
  Plus, Edit, Trash2, FileText, BookOpen, Newspaper, Microscope, 
  Users, Activity, TrendingUp, Database, Bot, User, Eye,
  Search, Settings, Zap, ArrowLeft, Sparkles, CheckCircle, XCircle,
  Calendar, Clock, Star, Tag, Filter, LayoutGrid, List, Upload, 
  Video, Image as ImageIcon, X, GraduationCap, Stethoscope, UserCircle2, Globe
} from 'lucide-react';

// Schemas
const educationalContentSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  content: z.string().min(50, "Conteúdo deve ter pelo menos 50 caracteres"),
  contentType: z.enum(["article", "video", "course", "news"]).default("article"),
  category: z.enum(["basics", "advanced", "clinical", "research", "cannabis-types"]),
  specialty: z.enum(["general", "neurology", "oncology", "psychiatry", "pain-management"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.number().min(1, "Duração deve ser pelo menos 1 minuto"),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  targetAudience: z.enum(["doctor", "patient", "both"]).default("patient"),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

type EducationalContentForm = z.infer<typeof educationalContentSchema>;

// Course Module interfaces - Lições isoladas (não linkadas com conteúdo publicado)
interface CourseLesson {
  id: string;
  title: string; // Título próprio da lição
  type: 'video' | 'article';
  fileUrl: string; // URL do arquivo (vídeo ou documento) uploadado
  duration?: number; // Duração estimada em minutos
  order: number;
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
}

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  specialty?: string;
  difficulty?: string;
  duration?: number;
  tags?: string[];
  imageUrl?: string;
  videoUrl?: string;
  targetAudience?: 'doctor' | 'patient' | 'both';
  featured: boolean;
  isActive?: boolean;
  createdAt: string;
  source: 'manual' | 'n8n' | 'telemedicine';
  type: 'educational' | 'news' | 'article' | 'video' | 'course';
  metadata?: any; // Para armazenar módulos do curso
}

interface ContentStats {
  manualContent?: number;
  n8nContent?: number;
  telemedicineContent?: number;
  totalActive?: number;
  doctorContent?: number;
  patientContent?: number;
}

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'both'>('patient');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterContentType, setFilterContentType] = useState<string>('all');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  
  // Course modules states
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  
  // Lesson form states (inline)
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'video' | 'article'>('video');
  const [lessonFileUrl, setLessonFileUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState<number>(5);
  const [addingLessonToModule, setAddingLessonToModule] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch content data
  const { data: educationalContent = [], isLoading: loadingEducational } = useQuery<ContentItem[]>({
    queryKey: ['/api/admin/educational-content'],
    retry: false,
  });

  const { data: medicalNews = [], isLoading: loadingNews } = useQuery<any[]>({
    queryKey: ['/api/admin/medical-news'],
    retry: false,
  });

  const { data: scientificArticles = [], isLoading: loadingArticles } = useQuery<any[]>({
    queryKey: ['/api/admin/scientific-articles'],
    retry: false,
  });

  const { data: contentStats = {} as ContentStats } = useQuery<ContentStats>({
    queryKey: ['/api/admin/content-stats'],
    retry: false,
  });

  const educationalForm = useForm<EducationalContentForm>({
    resolver: zodResolver(educationalContentSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      contentType: 'article',
      category: 'basics',
      specialty: 'general',
      difficulty: 'beginner',
      duration: 15,
      tags: [],
      imageUrl: '',
      videoUrl: '',
      targetAudience: activeTab,
      featured: false,
      isActive: true
    }
  });

  // Update targetAudience when tab changes
  useEffect(() => {
    educationalForm.setValue('targetAudience', activeTab);
  }, [activeTab]);

  // Mutations
  const createEducationalContent = useMutation({
    mutationFn: (data: EducationalContentForm) =>
      fetch('/api/admin/educational-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/educational-content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content-stats'] });
      setShowCreateDialog(false);
      educationalForm.reset();
      setUploadedImageUrl('');
      setUploadedVideoUrl('');
    }
  });

  const updateEducationalContent = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EducationalContentForm }) =>
      fetch(`/api/admin/educational-content/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/educational-content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content-stats'] });
      setShowEditDialog(false);
      setEditingItem(null);
      educationalForm.reset();
      setUploadedImageUrl('');
      setUploadedVideoUrl('');
    }
  });

  const deleteEducationalContent = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/educational-content/${id}`, {
        method: 'DELETE',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/educational-content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content-stats'] });
      setShowDeleteDialog(false);
      setDeletingItem(null);
    }
  });

  const handleSubmit = educationalForm.handleSubmit((data) => {
    // VALIDAÇÃO: Se for curso, verificar se tem módulos
    if (data.contentType === 'course') {
      if (courseModules.length === 0) {
        alert('❌ ERRO: Cursos devem ter pelo menos 1 módulo.\n\nClique em "Adicionar Módulo" para criar a estrutura do curso.');
        return;
      }
      
      // Verificar se cada módulo tem lições
      const emptyModules = courseModules.filter(m => m.lessons.length === 0);
      if (emptyModules.length > 0) {
        alert(`❌ ERRO: Todos os módulos devem ter pelo menos 1 lição.\n\nMódulos vazios: ${emptyModules.map(m => `"${m.title}"`).join(', ')}\n\nClique em "Nova Lição" para adicionar conteúdo.`);
        return;
      }
    }
    
    const finalData: any = {
      ...data,
      imageUrl: uploadedImageUrl || data.imageUrl,
      videoUrl: uploadedVideoUrl || data.videoUrl
    };
    
    // Se for curso, adicionar módulos ao metadata
    if (data.contentType === 'course') {
      finalData.metadata = {
        modules: courseModules
      };
    }
    
    if (editingItem) {
      updateEducationalContent.mutate({ id: editingItem.id, data: finalData });
    } else {
      createEducationalContent.mutate(finalData);
    }
  });

  const handleView = (item: ContentItem) => {
    setViewingItem(item);
    setShowViewDialog(true);
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    educationalForm.reset({
      title: item.title,
      description: item.description || '',
      content: item.content || '',
      contentType: (item.type || 'article') as any,
      category: (item.category || 'basics') as any,
      specialty: (item.specialty || 'general') as any,
      difficulty: (item.difficulty || 'beginner') as any,
      duration: item.duration || 15,
      tags: item.tags || [],
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      targetAudience: item.targetAudience || 'patient',
      featured: item.featured || false,
      isActive: item.isActive ?? true
    });
    setUploadedImageUrl(item.imageUrl || '');
    setUploadedVideoUrl(item.videoUrl || '');
    
    // Se for curso, carregar módulos do metadata
    if (item.type === 'course' && (item as any).metadata?.modules) {
      setCourseModules((item as any).metadata.modules);
    } else {
      setCourseModules([]);
    }
    
    setShowEditDialog(true);
  };

  const handleDelete = (item: ContentItem) => {
    setDeletingItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteEducationalContent.mutate(deletingItem.id);
    }
  };

  // Upload handlers
  const handleImageUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL;
      setUploadedImageUrl(imageUrl);
      educationalForm.setValue('imageUrl', imageUrl);
    }
  };

  const handleVideoUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const videoUrl = uploadedFile.uploadURL;
      setUploadedVideoUrl(videoUrl);
      educationalForm.setValue('videoUrl', videoUrl);
    }
  };

  const getImageUploadParameters = async () => {
    const response = await fetch('/api/object-storage/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `content-image-${Date.now()}.jpg`,
        contentType: 'image/jpeg'
      })
    });
    const data = await response.json();
    return { method: 'PUT' as const, url: data.uploadUrl };
  };

  const getVideoUploadParameters = async () => {
    const response = await fetch('/api/object-storage/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `content-video-${Date.now()}.mp4`,
        contentType: 'video/mp4'
      })
    });
    const data = await response.json();
    return { method: 'PUT' as const, url: data.uploadUrl };
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      manual: { color: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white", icon: User, label: "Manual" },
      n8n: { color: "bg-gradient-to-r from-green-500 to-emerald-600 text-white", icon: Bot, label: "N8N" },
      telemedicine: { color: "bg-gradient-to-r from-teal-500 to-teal-600 text-white", icon: Activity, label: "Telemedicina" }
    };
    const badge = badges[source as keyof typeof badges] || badges.manual;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} border-0 shadow-lg font-medium`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </Badge>
    );
  };

  const getAudienceBadge = (audience?: string) => {
    if (!audience) return null;
    const badges = {
      doctor: { color: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white", icon: Stethoscope, label: "Médicos" },
      patient: { color: "bg-gradient-to-r from-teal-500 to-teal-600 text-white", icon: UserCircle2, label: "Pacientes" },
      both: { color: "bg-gradient-to-r from-green-500 to-emerald-600 text-white", icon: Globe, label: "Ambos" }
    };
    const badge = badges[audience as keyof typeof badges] || badges.patient;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} border-0 shadow-lg font-medium`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      article: { color: "bg-blue-50 text-blue-700 border border-blue-200", icon: FileText, label: "Artigo" },
      video: { color: "bg-purple-50 text-purple-700 border border-purple-200", icon: Video, label: "Vídeo" },
      course: { color: "bg-indigo-50 text-indigo-700 border border-indigo-200", icon: GraduationCap, label: "Curso" },
      news: { color: "bg-orange-50 text-orange-700 border border-orange-200", icon: Newspaper, label: "Notícia" }
    };
    const badge = badges[type as keyof typeof badges] || badges.article;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} shadow-sm font-medium`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </Badge>
    );
  };

  const filteredContent = educationalContent.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSource = filterSource === 'all' || item.source === filterSource;
    const matchesContentType = filterContentType === 'all' || item.type === filterContentType;
    const matchesAudience = item.targetAudience === activeTab || item.targetAudience === 'both';
    return matchesSearch && matchesCategory && matchesSource && matchesContentType && matchesAudience;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/20">
      <Navbar />
      
      {/* Ultra Compact Header - Mobile First */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 text-white overflow-hidden">
        <div className="hidden sm:block absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 w-full sm:w-auto">
              <div className="bg-white/20 backdrop-blur-xl p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl shadow-2xl border border-white/20">
                <Database className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold mb-0.5 sm:mb-1 lg:mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-100">
                  Gestão de Conteúdo
                </h1>
                <p className="text-emerald-100 text-xs sm:text-sm lg:text-base flex items-center backdrop-blur-sm bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full w-fit">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 animate-pulse flex-shrink-0" />
                  <span className="truncate">Sistema Unificado</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link href="/admin/n8n-config" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-xl text-xs sm:text-sm py-2 sm:py-2 h-8 sm:h-9" data-testid="button-configure-n8n">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  <span className="hidden sm:inline">Configurar N8N</span>
                  <span className="sm:hidden">N8N</span>
                </Button>
              </Link>
              <Link href="/admin" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 shadow-xl text-xs sm:text-sm py-2 sm:py-2 h-8 sm:h-9" data-testid="button-back-admin">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 sm:pb-12">
        
        {/* Stats Cards - Muito Compacto Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6">
          <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl" data-testid="card-manual-content">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-1 sm:p-1.5 rounded-md">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Manual</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600">{contentStats.manualContent || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl" data-testid="card-n8n-content">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-1 sm:p-1.5 rounded-md">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">N8N Auto</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{contentStats.n8nContent || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl" data-testid="card-total-active">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-1 sm:p-1.5 rounded-md">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase">Total Ativo</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600">{contentStats.totalActive || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card - Compact Mobile */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl">
          <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-green-50 p-4 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl flex items-center bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 text-emerald-600 flex-shrink-0" />
                  <span>Gerenciar Conteúdo</span>
                </CardTitle>
                <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                  Crie e organize conteúdo para médicos e pacientes
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setCourseModules([]);
                  setShowCreateDialog(true);
                }} 
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl text-xs sm:text-sm py-2 sm:py-2.5 h-8 sm:h-9"
                data-testid="button-create-content"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                Novo Conteúdo
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-4 lg:p-6">
            {/* Tabs - Compact Mobile with Snap Scroll */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-5 sm:space-y-4">
              <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-200 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl h-auto shadow-inner min-w-max sm:min-w-0">
                  <TabsTrigger 
                    value="patient" 
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-lime-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all snap-center whitespace-nowrap"
                    data-testid="tab-patient"
                  >
                    <UserCircle2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="font-semibold text-xs sm:text-sm">Universidade Paciente</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="doctor" 
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all snap-center whitespace-nowrap"
                    data-testid="tab-doctor"
                  >
                    <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="font-semibold text-xs sm:text-sm">Universidade Médica</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="both" 
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all snap-center whitespace-nowrap"
                    data-testid="tab-both"
                  >
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="font-semibold text-xs sm:text-sm">Universidade Vendedor</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Compact Filters - Stack Vertical Mobile */}
              <div className="flex flex-col gap-3 sm:gap-3 bg-gradient-to-r from-emerald-50/50 to-green-50/50 p-3 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-gray-200 shadow-inner">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                    <Input
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 sm:pl-10 bg-white/80 backdrop-blur-sm border-gray-300 h-9 sm:h-10 lg:h-11 rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <Select value={filterContentType} onValueChange={setFilterContentType}>
                    <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm h-9 sm:h-10 lg:h-11 rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm" data-testid="select-content-type">
                      <SelectValue placeholder="Tipo de Conteúdo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="article">Artigo</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="course">Curso</SelectItem>
                      <SelectItem value="news">Notícia</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm h-9 sm:h-10 lg:h-11 rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm" data-testid="select-source">
                      <SelectValue placeholder="Fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as fontes</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="n8n">N8N</SelectItem>
                      <SelectItem value="telemedicine">Telemedicina</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 justify-start sm:justify-end">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-lg sm:rounded-xl"
                      data-testid="button-grid-view"
                    >
                      <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-lg sm:rounded-xl"
                      data-testid="button-list-view"
                    >
                      <List className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content Display - Mobile Optimized */}
              <TabsContent value={activeTab} className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                {loadingEducational || loadingNews || loadingArticles ? (
                  <div className="flex items-center justify-center py-12 sm:py-16">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600"></div>
                      <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 animate-pulse" />
                    </div>
                  </div>
                ) : filteredContent.length === 0 ? (
                  <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300">
                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 mb-3 sm:mb-4" />
                    <p className="text-gray-600 font-semibold text-base sm:text-lg">Nenhum conteúdo encontrado</p>
                    <p className="text-gray-500 text-sm mt-1 sm:mt-2">Crie seu primeiro conteúdo para começar</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {filteredContent.map((item) => (
                      <Card key={item.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden transform hover:-translate-y-1 rounded-2xl sm:rounded-3xl" data-testid={`card-content-${item.id}`}>
                        <div className="h-1.5 sm:h-2 bg-gradient-to-r from-emerald-500 to-green-500" />
                        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
                          <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                            <div className="flex gap-2 flex-wrap">
                              {getTypeBadge(item.type)}
                              {getSourceBadge(item.source)}
                              {getAudienceBadge(item.targetAudience)}
                            </div>
                            {item.featured && (
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                                <Star className="h-3 w-3 mr-1" />
                                Destaque
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base sm:text-lg line-clamp-2 group-hover:text-emerald-600 transition-colors">
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 p-3 sm:p-4 lg:p-6">
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {item.category}
                              </Badge>
                            )}
                            {item.isActive !== undefined && (
                              <Badge className={item.isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}>
                                {item.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                {item.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                              <span className="sm:hidden">{new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-11 sm:h-9 px-2 sm:px-3 hover:bg-blue-50 hover:text-emerald-600 rounded-lg"
                                onClick={() => handleView(item)}
                                data-testid={`button-view-${item.id}`}
                              >
                                <Eye className="h-4 w-4 sm:h-4 sm:w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-11 sm:h-9 px-2 sm:px-3 hover:bg-green-50 hover:text-green-600 rounded-lg"
                                onClick={() => handleEdit(item)}
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit className="h-4 w-4 sm:h-4 sm:w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-11 sm:h-9 px-2 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                onClick={() => handleDelete(item)}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredContent.map((item) => (
                      <Card key={item.id} className="hover:shadow-xl transition-all duration-200 border bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl" data-testid={`list-item-${item.id}`}>
                        <CardContent className="p-3 sm:p-4 lg:p-5">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-start sm:items-center flex-col sm:flex-row gap-2 sm:gap-4 flex-1 w-full sm:w-auto">
                              <div className="flex gap-2 flex-wrap">
                                {getTypeBadge(item.type)}
                                {getSourceBadge(item.source)}
                                {getAudienceBadge(item.targetAudience)}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900 hover:text-emerald-600 transition-colors">{item.title}</h3>
                                <div className="flex items-center gap-2 sm:gap-3 mt-1">
                                  {item.category && (
                                    <span className="text-xs text-gray-500">{item.category}</span>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    <span className="hidden sm:inline">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                                    <span className="sm:hidden">{new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
                              {item.featured && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">Destaque</span>
                                </Badge>
                              )}
                              {item.isActive !== undefined && (
                                <Badge className={item.isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700 text-xs"}>
                                  {item.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-11 sm:h-9 px-2 sm:px-3 hover:bg-blue-50 hover:text-emerald-600 rounded-lg"
                                onClick={() => handleView(item)}
                                data-testid={`button-view-list-${item.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-11 sm:h-9 px-2 sm:px-3 hover:bg-green-50 hover:text-green-600 rounded-lg"
                                onClick={() => handleEdit(item)}
                                data-testid={`button-edit-list-${item.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-11 sm:h-9 px-2 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                onClick={() => handleDelete(item)}
                                data-testid={`button-delete-list-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog - Mobile Optimized */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-5xl h-[92vh] p-0 gap-0 bg-white flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-emerald-600 px-3 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3 text-white">
              <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span>Criar Novo Conteúdo</span>
            </DialogTitle>
            <DialogDescription className="text-emerald-50 mt-1 sm:mt-2 text-sm sm:text-base">
              Preencha as informações para criar um novo conteúdo educacional
            </DialogDescription>
          </div>
          
          <div className="flex-1 overflow-hidden bg-gray-50">
            <ScrollArea className="h-full">
              <Form {...educationalForm}>
                <form onSubmit={handleSubmit} className="p-3 sm:p-6 lg:p-8 space-y-3 sm:space-y-6 lg:space-y-8 pb-24 sm:pb-32">
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-200 shadow-sm">
                  <FormField
                    control={educationalForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base font-semibold text-gray-900">Título *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite o título do conteúdo" 
                            className="h-11 sm:h-12 border-gray-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-blue-500 transition-colors text-sm sm:text-base" 
                            {...field} 
                            data-testid="input-title" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-200 shadow-sm">
                  <FormField
                    control={educationalForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base font-semibold text-gray-900">Descrição *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Breve descrição do conteúdo"
                            className="resize-none border-gray-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-blue-500 transition-colors min-h-[100px] text-sm sm:text-base"
                            rows={4}
                            {...field} 
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-200 shadow-sm">
                  <FormField
                    control={educationalForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base font-semibold text-gray-900">Conteúdo Completo *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Conteúdo detalhado do material educacional"
                            className="resize-none border-gray-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-blue-500 transition-colors min-h-[160px] text-sm sm:text-base"
                            rows={7}
                            {...field} 
                            data-testid="input-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <FormField
                      control={educationalForm.control}
                      name="contentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-gray-900">Tipo de Conteúdo *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-gray-300 focus:outline-none focus:ring-0 focus:border-blue-500" data-testid="select-content-type-field">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="article">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span>Artigo</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="video">
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4" />
                                  <span>Vídeo</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="course">
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4" />
                                  <span>Curso</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="news">
                                <div className="flex items-center gap-2">
                                  <Newspaper className="h-4 w-4" />
                                  <span>Notícia</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <FormField
                      control={educationalForm.control}
                      name="targetAudience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-gray-900">Universidade *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-gray-50 border-gray-300" data-testid="select-target-audience">
                                <SelectValue placeholder="Selecione o público" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="patient">
                                <div className="flex items-center gap-2">
                                  <UserCircle2 className="h-4 w-4" />
                                  <span>Universidade Paciente</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="doctor">
                                <div className="flex items-center gap-2">
                                  <Stethoscope className="h-4 w-4" />
                                  <span>Universidade Médica</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="both">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>Universidade Vendedor (compartilhado)</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-gray-500 mt-2">Automaticamente definido pela aba selecionada</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dynamic Media Upload Section based on Content Type */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 flex items-center text-base mb-4">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg mr-2">
                      <Upload className="h-4 w-4 text-emerald-600" />
                    </div>
                    {educationalForm.watch('contentType') === 'article' && 'Upload de Arquivo (PDF, DOCX, PPTX)'}
                    {educationalForm.watch('contentType') === 'video' && 'Upload de Vídeo'}
                    {educationalForm.watch('contentType') === 'course' && 'Imagem de Capa do Curso'}
                    {educationalForm.watch('contentType') === 'news' && 'Upload de Notícia'}
                  </h3>

                  {/* Artigo - Upload de Capa e Documento */}
                  {educationalForm.watch('contentType') === 'article' && (
                    <div className="space-y-4">
                      {/* Capa do Artigo */}
                      <SimpleFileUpload
                        label="Imagem de Capa do Artigo *"
                        accept="image/*"
                        maxSize={10}
                        uploadType="image"
                        currentFile={uploadedImageUrl}
                        onUploadComplete={(url) => {
                          setUploadedImageUrl(url);
                          educationalForm.setValue('imageUrl', url);
                        }}
                      />

                      {/* Documento do Artigo */}
                      <SimpleFileUpload
                        label="Arquivo do Artigo (PDF, DOCX, PPTX) *"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        maxSize={50}
                        uploadType="document"
                        currentFile={uploadedVideoUrl}
                        onUploadComplete={(url) => {
                          setUploadedVideoUrl(url);
                          educationalForm.setValue('videoUrl', url);
                        }}
                      />
                    </div>
                  )}

                  {/* Vídeo - Upload de Capa e Vídeo */}
                  {educationalForm.watch('contentType') === 'video' && (
                    <div className="space-y-4">
                      {/* Thumbnail do Vídeo */}
                      <SimpleFileUpload
                        label="Thumbnail do Vídeo *"
                        accept="image/*"
                        maxSize={10}
                        uploadType="image"
                        currentFile={uploadedImageUrl}
                        onUploadComplete={(url) => {
                          setUploadedImageUrl(url);
                          educationalForm.setValue('imageUrl', url);
                        }}
                      />

                      {/* Arquivo de Vídeo */}
                      <SimpleFileUpload
                        label="Arquivo de Vídeo *"
                        accept="video/*,.mp4,.mov,.avi"
                        maxSize={100}
                        uploadType="video"
                        currentFile={uploadedVideoUrl}
                        onUploadComplete={(url) => {
                          setUploadedVideoUrl(url);
                          educationalForm.setValue('videoUrl', url);
                        }}
                      />
                    </div>
                  )}

                  {/* Curso - Upload de Imagem de Capa */}
                  {educationalForm.watch('contentType') === 'course' && (
                    <SimpleFileUpload
                      label="Imagem de Capa do Curso *"
                      accept="image/*"
                      maxSize={10}
                      uploadType="image"
                      currentFile={uploadedImageUrl}
                      onUploadComplete={(url) => {
                        setUploadedImageUrl(url);
                        educationalForm.setValue('imageUrl', url);
                      }}
                    />
                  )}

                  {/* Notícia - Upload de Capa e Arquivo da Notícia */}
                  {educationalForm.watch('contentType') === 'news' && (
                    <div className="space-y-4">
                      {/* Capa da Notícia */}
                      <SimpleFileUpload
                        label="Imagem de Capa da Notícia *"
                        accept="image/*"
                        maxSize={10}
                        uploadType="image"
                        currentFile={uploadedImageUrl}
                        onUploadComplete={(url) => {
                          setUploadedImageUrl(url);
                          educationalForm.setValue('imageUrl', url);
                        }}
                      />

                      {/* Arquivo da Notícia (pode ser qualquer coisa) */}
                      <SimpleFileUpload
                        label="Arquivo da Notícia (Imagem, Vídeo, PDF, etc) - Opcional"
                        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword"
                        maxSize={100}
                        uploadType="document"
                        currentFile={uploadedVideoUrl}
                        onUploadComplete={(url) => {
                          setUploadedVideoUrl(url);
                          educationalForm.setValue('videoUrl', url);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Gestão de Módulos do Curso */}
                {educationalForm.watch('contentType') === 'course' && (
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Estrutura do Curso (Módulos e Lições)
                      </h3>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setModuleTitle('');
                          setModuleDescription('');
                          setCurrentModuleIndex(null);
                          setShowModuleDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Módulo
                      </Button>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
                      {courseModules.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <GraduationCap className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">Nenhum módulo adicionado ainda</p>
                          <p className="text-xs mt-1">Clique em "Adicionar Módulo" para começar a estruturar seu curso</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {courseModules.map((module, moduleIndex) => (
                            <div key={module.id} className="border border-emerald-200 rounded-lg p-4 bg-white">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-bold text-emerald-900">
                                    Módulo {module.order}: {module.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (addingLessonToModule === moduleIndex) {
                                        setAddingLessonToModule(null);
                                        setLessonTitle('');
                                        setLessonFileUrl('');
                                      } else {
                                        setAddingLessonToModule(moduleIndex);
                                        setLessonTitle('');
                                        setLessonFileUrl('');
                                        setLessonType('video');
                                        setLessonDuration(5);
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    {addingLessonToModule === moduleIndex ? 'Cancelar' : 'Nova Lição'}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600"
                                    onClick={() => {
                                      setCourseModules(courseModules.filter((_, i) => i !== moduleIndex));
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Inline Lesson Form */}
                              {addingLessonToModule === moduleIndex && (
                                <div className="mt-4 p-4 bg-emerald-50 rounded-lg border-2 border-emerald-300 space-y-3">
                                  <h5 className="font-semibold text-emerald-900 flex items-center">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nova Lição - Upload Direto
                                  </h5>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-sm font-medium block mb-1">Título da Lição *</label>
                                      <Input
                                        value={lessonTitle}
                                        onChange={(e) => setLessonTitle(e.target.value)}
                                        placeholder="Ex: Introdução ao CBD"
                                        className="bg-white"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="text-sm font-medium block mb-1">Tipo *</label>
                                      <Select value={lessonType} onValueChange={(value: 'video' | 'article') => setLessonType(value)}>
                                        <SelectTrigger className="bg-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="video">📹 Vídeo</SelectItem>
                                          <SelectItem value="article">📄 Artigo/Documento</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <SimpleFileUpload
                                      label={lessonType === 'video' ? 'Upload de Vídeo (MP4, MOV, AVI)' : 'Upload de Documento (PDF, DOCX, PPTX)'}
                                      accept={lessonType === 'video' ? 'video/*,.mp4,.mov,.avi' : '.pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword'}
                                      maxSize={lessonType === 'video' ? 100 : 50}
                                      uploadType={lessonType === 'video' ? 'video' : 'document'}
                                      currentFile={lessonFileUrl}
                                      onUploadComplete={(url) => setLessonFileUrl(url)}
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium block mb-1">Duração Estimada (minutos)</label>
                                    <Input
                                      type="number"
                                      value={lessonDuration}
                                      onChange={(e) => setLessonDuration(parseInt(e.target.value) || 5)}
                                      min={1}
                                      className="bg-white w-32"
                                    />
                                  </div>
                                  
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setAddingLessonToModule(null);
                                        setLessonTitle('');
                                        setLessonFileUrl('');
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => {
                                        if (!lessonTitle || !lessonFileUrl) {
                                          alert('Por favor, preencha o título e faça o upload do arquivo');
                                          return;
                                        }
                                        
                                        const newLesson: CourseLesson = {
                                          id: crypto.randomUUID(),
                                          title: lessonTitle,
                                          type: lessonType,
                                          fileUrl: lessonFileUrl,
                                          duration: lessonDuration,
                                          order: module.lessons.length + 1
                                        };
                                        
                                        const updatedModules = [...courseModules];
                                        updatedModules[moduleIndex].lessons.push(newLesson);
                                        setCourseModules(updatedModules);
                                        
                                        // Reset form
                                        setLessonTitle('');
                                        setLessonFileUrl('');
                                        setLessonType('video');
                                        setLessonDuration(5);
                                        setAddingLessonToModule(null);
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Adicionar Lição
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {module.lessons.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <div className="flex items-center gap-2">
                                        {lesson.type === 'video' ? (
                                          <Video className="h-4 w-4 text-teal-600" />
                                        ) : (
                                          <FileText className="h-4 w-4 text-emerald-600" />
                                        )}
                                        <span className="text-sm">
                                          {lesson.order}. {lesson.title}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {lesson.type === 'video' ? 'Vídeo' : 'Artigo'}
                                        </Badge>
                                        {lesson.duration && (
                                          <span className="text-xs text-gray-500">({lesson.duration} min)</span>
                                        )}
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-600"
                                        onClick={() => {
                                          const updatedModules = [...courseModules];
                                          updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
                                          setCourseModules(updatedModules);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-emerald-800 flex items-start gap-2">
                        <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Estrutura profissional:</strong> Organize seu curso em módulos (4-8 recomendado), cada um com 3-7 lições. 
                          Adicione vídeos, artigos e recursos para uma experiência completa de aprendizado.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={educationalForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="basics">Básico</SelectItem>
                            <SelectItem value="advanced">Avançado</SelectItem>
                            <SelectItem value="clinical">Clínico</SelectItem>
                            <SelectItem value="research">Pesquisa</SelectItem>
                            <SelectItem value="cannabis-types">Tipos de Cannabis</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={educationalForm.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dificuldade *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-difficulty">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Iniciante</SelectItem>
                            <SelectItem value="intermediate">Intermediário</SelectItem>
                            <SelectItem value="advanced">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={educationalForm.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especialidade *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-specialty">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">Geral</SelectItem>
                            <SelectItem value="neurology">Neurologia</SelectItem>
                            <SelectItem value="oncology">Oncologia</SelectItem>
                            <SelectItem value="psychiatry">Psiquiatria</SelectItem>
                            <SelectItem value="pain-management">Dor Crônica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={educationalForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração (minutos) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="15"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            data-testid="input-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={educationalForm.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 p-4 bg-amber-50/80 rounded-xl border border-amber-200/50">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-featured"
                            className="data-[state=checked]:bg-amber-500 mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-semibold flex items-center gap-1.5 text-slate-800">
                            <Star className="h-4 w-4 text-amber-600" />
                            Conteúdo em Destaque
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-600">
                            Aparecerá em posição de destaque
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={educationalForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 p-4 bg-emerald-50/80 rounded-xl border border-emerald-200/50">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                            className="data-[state=checked]:bg-emerald-500 mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-semibold flex items-center gap-1.5 text-slate-800">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            Publicar Agora
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-600">
                            Tornar visível imediatamente
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                </form>
              </Form>
            </ScrollArea>
          </div>

          {/* Status do Curso - Alerta Visual */}
          {educationalForm.watch('contentType') === 'course' && (
            <div className={`mx-6 mb-4 p-4 rounded-lg border-2 ${
              courseModules.length > 0 && courseModules.every(m => m.lessons.length > 0)
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-start gap-3">
                {courseModules.length > 0 && courseModules.every(m => m.lessons.length > 0) ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {courseModules.length > 0 && courseModules.every(m => m.lessons.length > 0) 
                      ? '✅ Curso pronto para publicar!' 
                      : '⚠️ Estrutura do curso incompleta'}
                  </p>
                  <p className="text-xs mt-1 text-gray-600">
                    {courseModules.length} módulo(s) • {courseModules.reduce((acc, m) => acc + m.lessons.length, 0)} lição(ões)
                    {courseModules.length === 0 && ' - Adicione pelo menos 1 módulo'}
                    {courseModules.some(m => m.lessons.length === 0) && ' - Alguns módulos não têm lições'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex justify-end gap-2 sm:gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setUploadedImageUrl('');
                setUploadedVideoUrl('');
              }}
              className="min-w-[100px] sm:min-w-[120px] h-11 sm:h-10 text-sm sm:text-base"
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 min-w-[140px] sm:min-w-[160px] h-11 sm:h-10 shadow-lg shadow-blue-500/30 text-sm sm:text-base"
              disabled={createEducationalContent.isPending}
              data-testid="button-save"
            >
              {createEducationalContent.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Conteúdo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Content Dialog - Mobile Optimized */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setEditingItem(null);
          educationalForm.reset();
          setUploadedImageUrl('');
          setUploadedVideoUrl('');
        }
      }}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 flex flex-col rounded-2xl sm:rounded-3xl">
          <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-3 sm:px-6 py-4 sm:py-5">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Editar Conteúdo
              </span>
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Atualize as informações do conteúdo educacional
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-3 sm:px-6">
              <Form {...educationalForm}>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6 py-4 sm:py-6 pb-32 sm:pb-40">
                <FormField
                  control={educationalForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o título do conteúdo"
                          className="h-12 focus-visible:ring-offset-0"
                          {...field} 
                          data-testid="input-edit-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={educationalForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Breve descrição do conteúdo"
                          className="resize-none focus-visible:ring-offset-0"
                          rows={3}
                          {...field} 
                          data-testid="input-edit-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={educationalForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo Completo *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Conteúdo detalhado do material educacional"
                          className="resize-none focus-visible:ring-offset-0"
                          rows={6}
                          {...field} 
                          data-testid="input-edit-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={educationalForm.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conteúdo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12" data-testid="select-edit-content-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="article">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Artigo</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              <span>Vídeo</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="course">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>Curso</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="news">
                            <div className="flex items-center gap-2">
                              <Newspaper className="h-4 w-4" />
                              <span>Notícia</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dynamic Media Upload Section based on Content Type - Edit */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 flex items-center text-base mb-4">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg mr-2">
                      <Upload className="h-4 w-4 text-emerald-600" />
                    </div>
                    {educationalForm.watch('contentType') === 'article' && 'Upload de Arquivo (PDF, DOCX, PPTX)'}
                    {educationalForm.watch('contentType') === 'video' && 'Upload de Vídeo'}
                    {educationalForm.watch('contentType') === 'course' && 'Imagem de Capa do Curso'}
                    {educationalForm.watch('contentType') === 'news' && 'Upload de Notícia'}
                  </h3>

                  {/* Artigo - Upload de Documento */}
                  {educationalForm.watch('contentType') === 'article' && (
                    <SimpleFileUpload
                      label="Arquivo do Artigo (PDF, DOCX, PPTX)"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword"
                      maxSize={50}
                      uploadType="document"
                      currentFile={uploadedVideoUrl}
                      onUploadComplete={(url) => {
                        setUploadedVideoUrl(url);
                        educationalForm.setValue('videoUrl', url);
                      }}
                    />
                  )}

                  {/* Vídeo - Upload de Vídeo */}
                  {educationalForm.watch('contentType') === 'video' && (
                    <SimpleFileUpload
                      label="Arquivo de Vídeo"
                      accept="video/*,.mp4,.mov,.avi"
                      maxSize={100}
                      uploadType="video"
                      currentFile={uploadedVideoUrl}
                      onUploadComplete={(url) => {
                        setUploadedVideoUrl(url);
                        educationalForm.setValue('videoUrl', url);
                      }}
                    />
                  )}

                  {/* Curso - Upload de Imagem de Capa */}
                  {educationalForm.watch('contentType') === 'course' && (
                    <SimpleFileUpload
                      label="Imagem de Capa do Curso"
                      accept="image/*"
                      maxSize={10}
                      uploadType="image"
                      currentFile={uploadedImageUrl}
                      onUploadComplete={(url) => {
                        setUploadedImageUrl(url);
                        educationalForm.setValue('imageUrl', url);
                      }}
                    />
                  )}

                  {/* Notícia - Upload de Capa e Arquivo */}
                  {educationalForm.watch('contentType') === 'news' && (
                    <div className="space-y-4">
                      <SimpleFileUpload
                        label="Imagem de Capa da Notícia"
                        accept="image/*"
                        maxSize={10}
                        uploadType="image"
                        currentFile={uploadedImageUrl}
                        onUploadComplete={(url) => {
                          setUploadedImageUrl(url);
                          educationalForm.setValue('imageUrl', url);
                        }}
                      />

                      <SimpleFileUpload
                        label="Arquivo da Notícia (Imagem, Vídeo, PDF, etc) - Opcional"
                        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword"
                        maxSize={100}
                        uploadType="document"
                        currentFile={uploadedVideoUrl}
                        onUploadComplete={(url) => {
                          setUploadedVideoUrl(url);
                          educationalForm.setValue('videoUrl', url);
                        }}
                      />
                    </div>
                  )}
                </div>

                </form>
              </Form>
            </ScrollArea>
          </div>

          {/* Status do Curso - Alerta Visual (Edit) */}
          {educationalForm.watch('contentType') === 'course' && (
            <div className={`mx-6 mb-4 p-4 rounded-lg border-2 ${
              courseModules.length > 0 && courseModules.every(m => m.lessons.length > 0)
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-start gap-3">
                {courseModules.length > 0 && courseModules.every(m => m.lessons.length > 0) ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {courseModules.length > 0 && courseModules.every(m => m.lessons.length > 0) 
                      ? '✅ Curso pronto para publicar!' 
                      : '⚠️ Estrutura do curso incompleta'}
                  </p>
                  <p className="text-xs mt-1 text-gray-600">
                    {courseModules.length} módulo(s) • {courseModules.reduce((acc, m) => acc + m.lessons.length, 0)} lição(ões)
                    {courseModules.length === 0 && ' - Adicione pelo menos 1 módulo'}
                    {courseModules.some(m => m.lessons.length === 0) && ' - Alguns módulos não têm lições'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex justify-end gap-2 sm:gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setEditingItem(null);
                setUploadedImageUrl('');
                setUploadedVideoUrl('');
              }}
              className="min-w-[100px] sm:min-w-[120px] h-11 sm:h-10 text-sm sm:text-base"
              data-testid="button-edit-cancel"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 min-w-[140px] sm:min-w-[160px] h-11 sm:h-10 shadow-lg shadow-emerald-500/30 text-sm sm:text-base"
              disabled={updateEducationalContent.isPending}
              data-testid="button-edit-save"
            >
              {updateEducationalContent.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Atualizar Conteúdo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Content Dialog - Mobile Optimized */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-3 sm:p-6 rounded-2xl sm:rounded-3xl">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              <Eye className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2 text-emerald-600" />
              {viewingItem?.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {viewingItem && (
              <div className="space-y-3 sm:space-y-6 pr-2 sm:pr-4">
                <div className="flex flex-wrap gap-2">
                  {getTypeBadge(viewingItem.type)}
                  {getSourceBadge(viewingItem.source)}
                  {getAudienceBadge(viewingItem.targetAudience)}
                  {viewingItem.featured && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                  {viewingItem.isActive !== undefined && (
                    <Badge className={viewingItem.isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}>
                      {viewingItem.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  )}
                </div>

                {viewingItem.imageUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">Imagem de Capa</h3>
                    <img src={viewingItem.imageUrl} alt={viewingItem.title} className="w-full rounded-lg shadow-md" />
                  </div>
                )}

                {viewingItem.videoUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">Vídeo</h3>
                    <video src={viewingItem.videoUrl} controls className="w-full rounded-lg shadow-md" />
                  </div>
                )}

                {viewingItem.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewingItem.description}</p>
                  </div>
                )}

                {viewingItem.content && (
                  <div>
                    <h3 className="font-semibold mb-2">Conteúdo Completo</h3>
                    <div className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{viewingItem.content}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {viewingItem.category && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Categoria</h4>
                      <p className="text-gray-900">{viewingItem.category}</p>
                    </div>
                  )}
                  {viewingItem.specialty && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Especialidade</h4>
                      <p className="text-gray-900">{viewingItem.specialty}</p>
                    </div>
                  )}
                  {viewingItem.difficulty && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Dificuldade</h4>
                      <p className="text-gray-900">{viewingItem.difficulty}</p>
                    </div>
                  )}
                  {viewingItem.duration && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Duração</h4>
                      <p className="text-gray-900">{viewingItem.duration} minutos</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Data de Criação</h4>
                  <p className="text-gray-900">{new Date(viewingItem.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              <GraduationCap className="h-6 w-6 mr-2 text-emerald-600" />
              Adicionar Módulo do Curso
            </DialogTitle>
            <DialogDescription>
              Crie um módulo com título e descrição. Depois adicione lições (vídeos/artigos) ao módulo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título do Módulo *</label>
              <Input
                placeholder="Ex: Introdução ao CBD e Sistema Endocanabinoide"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição do Módulo *</label>
              <Textarea
                placeholder="Descreva o que os alunos aprenderão neste módulo..."
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (!moduleTitle || !moduleDescription) {
                  alert('Por favor, preencha título e descrição do módulo');
                  return;
                }
                const newModule: CourseModule = {
                  id: crypto.randomUUID(),
                  title: moduleTitle,
                  description: moduleDescription,
                  order: courseModules.length + 1,
                  lessons: []
                };
                setCourseModules([...courseModules, newModule]);
                setModuleTitle('');
                setModuleDescription('');
                setShowModuleDialog(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Módulo
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <Trash2 className="h-5 w-5 mr-2" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "<span className="font-semibold">{deletingItem?.title}</span>"?
              Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
