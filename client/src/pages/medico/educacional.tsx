import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Search, ArrowLeft, GraduationCap, Stethoscope, Calendar, Trophy,
  BookOpen, FileText, Video, Download, ExternalLink, Clock, Users,
  CheckCircle, AlertTriangle, Star, Eye, Award, Brain, Heart,
  Shield, Microscope, UserCheck, FileCheck, PlayCircle, Filter,
  TrendingUp, BarChart3, MessageSquare, Bell, Settings, Bookmark,
  Target, Zap, TrendingDown, Activity, ChevronUp, ChevronDown,
  Globe, Timer, BookmarkCheck, UserPlus, Mail, Share2, X, Calculator
} from "lucide-react";

export default function MedicoEducacional() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedInstitution, setSelectedInstitution] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [bookmarkedContent, setBookmarkedContent] = useState<string[]>([]);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "new_course", message: "Novo curso: Cannabis em Cardiologia", unread: true },
    { id: 2, type: "cme_deadline", message: "Lembrete: 16 créditos CME restantes para 2025", unread: true },
    { id: 3, type: "webinar", message: "Webinar em 2 dias: CBD no Tratamento de Ansiedade", unread: false }
  ]);
  const [cmeProgress, setCmeProgress] = useState({
    currentCredits: 24,
    requiredCredits: 40,
    certificatesEarned: 3,
    coursesCompleted: 8,
    researchRead: 15,
    webinarsAttended: 5,
    monthlyGoal: 10,
    weeklyStudyHours: 8.5,
    averageRating: 4.7,
    totalStudyTime: 156,
    streak: 12,
    rank: "Expert",
    percentile: 85
  });

  // Gerenciar progresso de CME e completude
  const markCourseComplete = (courseId: string) => {
    if (completedCourses.includes(courseId)) return;
    setCompletedCourses(prev => [...prev, courseId]);
    const course = medicalCourses.find(c => c.id === courseId);
    if (course) {
      setCmeProgress(prev => ({
        ...prev,
        currentCredits: prev.currentCredits + course.cmeCredits,
        coursesCompleted: prev.coursesCompleted + 1,
        certificatesEarned: course.certificate ? prev.certificatesEarned + 1 : prev.certificatesEarned
      }));
    }
  };

  // Função para converter duração em minutos
  const parseDurationToMinutes = (duration: string): number => {
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)min/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    return hours * 60 + minutes;
  };

  const toggleBookmark = (contentId: string) => {
    setBookmarkedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  // Cursos médicos avançados sobre cannabis medicinal
  const medicalCourses = [
    {
      id: "endocannabinoid-system",
      title: "🧠 Sistema Endocanabinoide: Fundamentos Científicos",
      category: "basic",
      specialty: "neurologia",
      type: "course",
      duration: "4h 30min",
      level: "Básico",
      cmeCredits: 4,
      instructor: "Dr. Roberto Silva, PhD - Neurologia",
      institution: "USP - Faculdade de Medicina",
      description: "Curso fundamental sobre o sistema endocanabinoide, receptores CB1/CB2, neurotransmissão e bases farmacológicas da cannabis medicinal.",
      modules: 8,
      certificate: true,
      featured: true,
      rating: 4.9,
      enrolledStudents: 1250,
      lastUpdated: "2025-09-15",
      topics: ["Sistema ECS", "Receptores", "Anandamida", "2-AG", "Farmacologia"],
      difficulty: "Introdutório",
      summary: "Base científica essencial para prescrição responsável de cannabis medicinal."
    },
    {
      id: "clinical-protocols",
      title: "📋 Protocolos Clínicos e Prescrição Segura",
      category: "clinical",
      specialty: "dor",
      type: "course",
      duration: "6h 15min",
      level: "Intermediário",
      cmeCredits: 6,
      instructor: "Dra. Marina Santos - CRM-SP 98765",
      institution: "Hospital Sírio-Libanês",
      description: "Protocolos clínicos validados, estratégias de titulação, monitoramento de pacientes e manejo de efeitos adversos.",
      modules: 12,
      certificate: true,
      featured: true,
      rating: 4.8,
      enrolledStudents: 892,
      lastUpdated: "2025-09-10",
      topics: ["Titulação", "Monitoramento", "Efeitos Adversos", "Interações"],
      difficulty: "Intermediário",
      summary: "Métodos clínicos validados para prescrição eficaz e segura."
    },
    {
      id: "pediatric-cannabis",
      title: "👶 Cannabis Medicinal em Pediatria",
      category: "specialized",
      specialty: "pediatria",
      type: "course",
      duration: "5h 00min",
      level: "Avançado",
      cmeCredits: 5,
      instructor: "Dr. Carlos Medeiros - Pediatria",
      institution: "Hospital das Clínicas - FMUSP",
      description: "Considerações especiais para prescrição pediátrica: epilepsia refratária, TEA, dosagens pediátricas e acompanhamento familiar.",
      modules: 10,
      certificate: true,
      featured: true,
      rating: 4.9,
      enrolledStudents: 456,
      lastUpdated: "2025-09-12",
      topics: ["Epilepsia", "TEA", "Dosagem Pediátrica", "Família"],
      difficulty: "Especializado",
      summary: "Especialização em cannabis medicinal para crianças e adolescentes."
    },
    {
      id: "geriatric-cannabis",
      title: "👵 Cannabis Geriátrica: Idosos e Cannabis Medicinal",
      category: "specialized",
      specialty: "geriatria",
      type: "course",
      duration: "3h 45min",
      level: "Intermediário",
      cmeCredits: 4,
      instructor: "Dra. Ana Paula Ribeiro - Geriatria",
      institution: "UNIFESP",
      description: "Particularidades da prescrição em idosos: alterações farmacocinéticas, polifarmácia, doenças crônicas e qualidade de vida.",
      modules: 7,
      certificate: true,
      featured: false,
      rating: 4.7,
      enrolledStudents: 634,
      lastUpdated: "2025-09-08",
      topics: ["Polifarmácia", "Farmacocinética", "Doenças Crônicas"],
      difficulty: "Intermediário", 
      summary: "Abordagem geriátrica especializada para cannabis medicinal."
    },
    {
      id: "research-methodology",
      title: "🔬 Metodologia de Pesquisa em Cannabis Medicinal",
      category: "research",
      specialty: "neurologia",
      type: "course",
      duration: "8h 30min",
      level: "Avançado",
      cmeCredits: 8,
      instructor: "Prof. Dr. João Carvalho - Farmacologia",
      institution: "UNICAMP",
      description: "Metodologia científica para pesquisa clínica com cannabis: desenho de estudos, bioética, análise estatística e publicação.",
      modules: 16,
      certificate: true,
      featured: false,
      rating: 4.6,
      enrolledStudents: 287,
      lastUpdated: "2025-09-05",
      topics: ["Metodologia", "Bioética", "Estatística", "Publicação"],
      difficulty: "Avançado",
      summary: "Formação em pesquisa científica de excelência em cannabis medicinal."
    },
    {
      id: "legal-aspects",
      title: "⚖️ Aspectos Legais e Regulamentários",
      category: "legal",
      specialty: "dor",
      type: "course",
      duration: "2h 15min",
      level: "Básico",
      cmeCredits: 2,
      instructor: "Dr. Luís Fernando - Direito Médico",
      institution: "CFM",
      description: "Legislação atual, RDC 660/2022, responsabilidades médicas, documentação necessária e aspectos éticos da prescrição.",
      modules: 5,
      certificate: true,
      featured: true,
      rating: 4.8,
      enrolledStudents: 1890,
      lastUpdated: "2025-09-14",
      topics: ["RDC 660", "Ética Médica", "CFM", "ANVISA"],
      difficulty: "Essencial",
      summary: "Marco legal e responsabilidades profissionais na prescrição."
    }
  ];

  // Pesquisas médicas recentes
  const researchPapers = [
    {
      id: "epilepsy-cbd-2024",
      title: "Efficacy of CBD in Drug-Resistant Epilepsy: 5-Year Follow-up Study",
      journal: "New England Journal of Medicine",
      date: "2024-08",
      authors: "Silva, A.M., et al.",
      institution: "HC-FMUSP",
      category: "Neurologia",
      impact: 45.3,
      citations: 127,
      pdfUrl: "#",
      abstract: "Long-term efficacy and safety analysis of CBD in 485 pediatric patients with drug-resistant epilepsy...",
      keyFindings: ["78% reduction in seizure frequency", "Minimal long-term side effects", "Quality of life improvement"],
      bookmarked: false
    },
    {
      id: "chronic-pain-thc-cbd",
      title: "THC:CBD Ratios in Chronic Pain Management: Randomized Controlled Trial",
      journal: "Pain Medicine Journal",
      date: "2024-07",
      authors: "Santos, M.F., et al.",
      institution: "Hospital Sírio-Libanês",
      category: "Dor",
      impact: 3.8,
      citations: 89,
      pdfUrl: "#",
      abstract: "Comparative analysis of different THC:CBD ratios in 320 chronic pain patients over 12 months...",
      keyFindings: ["1:1 ratio most effective for neuropathic pain", "2:1 CBD:THC optimal for inflammatory pain"],
      bookmarked: false
    },
    {
      id: "geriatric-safety-profile",
      title: "Safety Profile of Medical Cannabis in Geriatric Population: Real-World Evidence",
      journal: "Journal of American Geriatrics Society",
      date: "2024-06",
      authors: "Costa, R.L., et al.",
      institution: "UNIFESP",
      category: "Geriatria",
      impact: 4.2,
      citations: 56,
      pdfUrl: "#",
      abstract: "Comprehensive safety analysis of medical cannabis use in 1,200+ elderly patients...",
      keyFindings: ["Low adverse event rate (8%)", "No significant drug interactions", "Improved sleep quality"],
      bookmarked: false
    }
  ];

  // Webinars médicos especializados
  const webinars = [
    {
      id: "cannabis-cardiology",
      title: "Cannabis Medicinal e Cardiologia: Interações e Precauções",
      date: "2025-09-20",
      time: "19h00",
      duration: "90min",
      speaker: "Dr. Fernando Alves",
      specialty: "Cardiologia",
      institution: "InCor - HCFMUSP",
      status: "upcoming",
      cmeCredits: 2,
      maxAttendees: 500,
      currentAttendees: 387,
      description: "Análise das interações cardiovasculares da cannabis medicinal, precauções em cardiopatas e protocolos de segurança.",
      topics: ["Interações CV", "Precauções", "Monitoramento"]
    },
    {
      id: "psychiatry-cannabis-anxiety",
      title: "CBD no Tratamento de Transtornos de Ansiedade: Evidências Atuais",
      date: "2025-09-18",
      time: "20h00",
      duration: "75min",
      speaker: "Dra. Mariana Luz",
      specialty: "Psiquiatria",
      institution: "IPq - HCFMUSP",
      status: "available",
      cmeCredits: 2,
      maxAttendees: 300,
      currentAttendees: 245,
      description: "Revisão sistemática sobre eficácia do CBD em ansiedade, protocolos de dosagem e casos clínicos.",
      topics: ["Ansiedade", "CBD", "Casos Clínicos"]
    },
    {
      id: "oncology-cannabis-supportive",
      title: "Cannabis Medicinal em Cuidados Paliativos Oncológicos",
      date: "2025-09-15",
      time: "19h30",
      duration: "120min",
      speaker: "Dr. Ricardo Mourão",
      specialty: "Oncologia",
      institution: "INCA",
      status: "completed",
      cmeCredits: 3,
      maxAttendees: 400,
      currentAttendees: 398,
      description: "Cannabis como terapia adjuvante em oncologia: náusea, dor, apetite e qualidade de vida.",
      topics: ["Cuidados Paliativos", "Sintomas", "QV"]
    }
  ];

  // Categorias e filtros avançados
  const categories = [
    { id: "all", label: "Todos os Conteúdos", icon: BookOpen },
    { id: "basic", label: "Fundamentos", icon: Brain },
    { id: "clinical", label: "Prática Clínica", icon: Stethoscope },
    { id: "specialized", label: "Especialidades", icon: UserCheck },
    { id: "research", label: "Pesquisa", icon: Microscope },
    { id: "legal", label: "Legal e Ético", icon: Shield }
  ];
  
  const specialties = [
    { id: "all", label: "Todas as Especialidades" },
    { id: "neurologia", label: "Neurologia" },
    { id: "psiquiatria", label: "Psiquiatria" },
    { id: "oncologia", label: "Oncologia" },
    { id: "pediatria", label: "Pediatria" },
    { id: "geriatria", label: "Geriatria" },
    { id: "cardiologia", label: "Cardiologia" },
    { id: "reumatologia", label: "Reumatologia" },
    { id: "dor", label: "Medicina da Dor" }
  ];
  
  const levels = [
    { id: "all", label: "Todos os Níveis" },
    { id: "Básico", label: "Básico" },
    { id: "Intermediário", label: "Intermediário" },
    { id: "Avançado", label: "Avançado" }
  ];
  
  const institutions = [
    { id: "all", label: "Todas as Instituições" },
    { id: "USP", label: "USP - Faculdade de Medicina" },
    { id: "UNIFESP", label: "UNIFESP" },
    { id: "UNICAMP", label: "UNICAMP" },
    { id: "HC", label: "Hospital das Clínicas" },
    { id: "Sírio", label: "Hospital Sírio-Libanês" },
    { id: "CFM", label: "CFM" }
  ];
  
  const sortOptions = [
    { id: "featured", label: "Destacados" },
    { id: "newest", label: "Mais Recentes" },
    { id: "rating", label: "Melhor Avaliados" },
    { id: "popular", label: "Mais Populares" },
    { id: "duration", label: "Duração" },
    { id: "cme", label: "Créditos CME" }
  ];

  // Função avançada para filtrar conteúdo
  const filteredCourses = medicalCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    const matchesSpecialty = selectedSpecialty === "all" || ((course as any).specialty && (course as any).specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()));
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel;
    const matchesInstitution = selectedInstitution === "all" || course.institution.toLowerCase().includes(selectedInstitution.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesSpecialty && matchesLevel && matchesInstitution;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case "rating":
        return b.rating - a.rating;
      case "popular":
        return b.enrolledStudents - a.enrolledStudents;
      case "duration":
        return parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration);
      case "cme":
        return b.cmeCredits - a.cmeCredits;
      case "featured":
      default:
        return b.featured ? 1 : -1;
    }
  });

  const filteredResearch = researchPapers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         paper.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         paper.category.toLowerCase().includes(searchTerm.toLowerCase());
    // Map research categories to our filter categories
    const matchesCategory = selectedCategory === "all" || 
                           (selectedCategory === "research" && paper.category) ||
                           (selectedCategory === "basic" && paper.category.toLowerCase().includes("neurologia")) ||
                           (selectedCategory === "clinical" && paper.category.toLowerCase().includes("dor")) ||
                           (selectedCategory === "specialized" && paper.category.toLowerCase().includes("geriatria"));
    return matchesSearch && matchesCategory;
  });

  const filteredWebinars = webinars.filter(webinar => {
    const matchesSearch = webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webinar.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webinar.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    // Map webinar specialties to our filter categories  
    const matchesCategory = selectedCategory === "all" ||
                           (selectedCategory === "clinical" && webinar.specialty && 
                            (webinar.specialty.toLowerCase().includes("cardiologia") || 
                             webinar.specialty.toLowerCase().includes("psiquiatria") || 
                             webinar.specialty.toLowerCase().includes("oncologia"))) ||
                           (selectedCategory === "specialized" && webinar.specialty);
    return matchesSearch && matchesCategory;
  });

  const featuredCourses = medicalCourses.filter(course => course.featured);

  // Persistência no localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('vittaverde_medical_progress');
    if (savedProgress) {
      const data = JSON.parse(savedProgress);
      setCompletedCourses(data.completedCourses || []);
      setBookmarkedContent(data.bookmarkedContent || []);
      setCmeProgress(data.cmeProgress || cmeProgress);
    }
    
    // Carregar notificações
    const savedNotifications = localStorage.getItem('vittaverde_notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vittaverde_medical_progress', JSON.stringify({
      completedCourses,
      bookmarkedContent,
      cmeProgress
    }));
  }, [completedCourses, bookmarkedContent, cmeProgress]);
  
  // Persistir notificações
  useEffect(() => {
    localStorage.setItem('vittaverde_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Funções auxiliares para cores e ícones
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Básico": return "bg-blue-100 text-blue-800";
      case "Intermediário": return "bg-orange-100 text-orange-800";
      case "Avançado": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "available": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming": return "Em breve";
      case "available": return "Disponível"; 
      case "completed": return "Finalizado";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Profissional */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex items-center space-x-4">
            <Link href="/medico" data-testid="link-back-dashboard">
              <Button variant="outline" size="sm" className="hover:bg-blue-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2" data-testid="title-medical-university">
                🏥 Universidade Médica VittaVerde
              </h1>
              <p className="text-gray-600 text-lg">
                Educação Médica Continuada em Cannabis Medicinal
              </p>
            </div>
          </div>
          
          {/* Dashboard Avançado CME */}
          <div className="bg-white rounded-xl shadow-lg border p-6 min-w-[380px]" data-testid="cme-advanced-dashboard">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Dashboard CME</h3>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200">
                  {cmeProgress.rank}
                </Badge>
              </div>
            </div>
            
            {/* Progresso Principal */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Créditos CME 2025:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-blue-600" data-testid="text-cme-current">{cmeProgress.currentCredits}/{cmeProgress.requiredCredits}</span>
                  <ChevronUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <Progress value={(cmeProgress.currentCredits / cmeProgress.requiredCredits) * 100} className="h-3" />
              
              {/* Estatísticas em Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <Award className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <div className="font-bold text-green-700" data-testid="text-certificates">{cmeProgress.certificatesEarned}</div>
                  <div className="text-green-600">Certificados</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <BookOpen className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                  <div className="font-bold text-blue-700" data-testid="text-courses-completed">{cmeProgress.coursesCompleted}</div>
                  <div className="text-blue-600">Cursos</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                  <div className="font-bold text-purple-700">{cmeProgress.totalStudyTime}h</div>
                  <div className="text-purple-600">Estudo</div>
                </div>
              </div>
              
              {/* Métricas Avançadas */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Target className="h-3 w-3 text-orange-500" />
                    <span className="text-gray-600">Meta Mensal:</span>
                  </div>
                  <span className="font-medium text-orange-600">{cmeProgress.monthlyGoal} CME</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span className="text-gray-600">Sequência:</span>
                  </div>
                  <span className="font-medium text-yellow-600">{cmeProgress.streak} dias</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-indigo-500" />
                    <span className="text-gray-600">Avaliação:</span>
                  </div>
                  <span className="font-medium text-indigo-600">{cmeProgress.averageRating}/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-gray-600">Percentil:</span>
                  </div>
                  <span className="font-medium text-green-600">{cmeProgress.percentile}%</span>
                </div>
              </div>
              
              <div className="text-xs text-center text-gray-500 pt-2 border-t border-gray-50">
                <div className="flex items-center justify-center space-x-2">
                  <Activity className="h-3 w-3" />
                  <span>{Math.round((cmeProgress.currentCredits / cmeProgress.requiredCredits) * 100)}% do objetivo anual • Posição: Top {100 - cmeProgress.percentile}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sistema de Busca Avançado */}
        <div className="bg-white rounded-xl shadow-sm border mb-8" data-testid="advanced-search-section">
          {/* Barra de Busca Principal */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por curso, instrutor, instituição, tema..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg border-gray-200 focus:border-blue-500"
                  data-testid="input-medical-search"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Sistema de Notificações Funcional */}
              <div className="flex items-center space-x-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <Bell className="h-4 w-4 mr-2" />
                      Avisos
                      {notifications.filter(n => n.unread).length > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white flex items-center justify-center">
                          {notifications.filter(n => n.unread).length}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center justify-between">
                        📢 Notificações
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                            }}
                            className="text-xs"
                          >
                            Marcar todas lidas
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setNotifications([])}
                            className="text-xs text-red-600"
                          >
                            Limpar tudo
                          </Button>
                        </div>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>Nenhuma notificação</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-3 rounded-lg border transition-all hover:bg-gray-50 cursor-pointer ${
                              notification.unread ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                            }`}
                            onClick={() => {
                              setNotifications(prev => 
                                prev.map(n => 
                                  n.id === notification.id ? { ...n, unread: false } : n
                                )
                              );
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  {notification.type === "new_course" && <BookOpen className="h-4 w-4 text-blue-500" />}
                                  {notification.type === "cme_deadline" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                                  {notification.type === "webinar" && <Video className="h-4 w-4 text-green-500" />}
                                  <span className="text-xs text-gray-500 uppercase">
                                    {notification.type === "new_course" && "Novo Curso"}
                                    {notification.type === "cme_deadline" && "CME Deadline"}
                                    {notification.type === "webinar" && "Webinar"}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-900">{notification.message}</p>
                              </div>
                              {notification.unread && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtros Avançados</span>
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Filtros Rápidos */}
          <div className="p-4 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 ${
                      selectedCategory === category.id 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "hover:bg-blue-50 hover:text-blue-600 border-gray-200 bg-white"
                    }`}
                    data-testid={`filter-medical-${category.id}`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{category.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
          
          {/* Filtros Avançados */}
          {showAdvancedFilters && (
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Especialidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {specialties.map(specialty => (
                      <option key={specialty.id} value={specialty.id}>{specialty.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Nível */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nível</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {levels.map(level => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Instituição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instituição</label>
                  <select
                    value={selectedInstitution}
                    onChange={(e) => setSelectedInstitution(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {institutions.map(institution => (
                      <option key={institution.id} value={institution.id}>{institution.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Ordenação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {filteredCourses.length} cursos encontrados
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedSpecialty("all");
                      setSelectedLevel("all");
                      setSelectedInstitution("all");
                      setSortBy("featured");
                      setSearchTerm("");
                    }}
                  >
                    Limpar Filtros
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Compartilhar</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="courses" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-12 bg-gray-100" data-testid="medical-tabs">
            <TabsTrigger value="courses" className="text-sm font-medium">📚 Cursos CME</TabsTrigger>
            <TabsTrigger value="research" className="text-sm font-medium">🔬 Pesquisas</TabsTrigger>
            <TabsTrigger value="webinars" className="text-sm font-medium">🎥 Webinars</TabsTrigger>
            <TabsTrigger value="certificates" className="text-sm font-medium">🏆 Certificados</TabsTrigger>
          </TabsList>

          {/* Tab de Cursos CME */}
          <TabsContent value="courses" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📚 Cursos de Educação Médica Continuada</h2>
              <p className="text-gray-600">{filteredCourses.length} cursos disponíveis • Certificados reconhecidos pelo CFM</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const isCompleted = completedCourses.includes(course.id);
                const isBookmarked = bookmarkedContent.includes(course.id);
                
                return (
                  <Card key={course.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50" data-testid={`card-medical-course-${course.id}`}>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2">
                          <Badge className={getLevelColor(course.level)}>
                            {course.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            {course.cmeCredits} CME
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBookmark(course.id)}
                            className="h-8 w-8 p-0"
                            data-testid={`button-bookmark-course-${course.id}`}
                          >
                            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-gray-400'}`} />
                          </Button>
                          {isCompleted && (
                            <CheckCircle className="h-5 w-5 text-green-600" data-testid={`icon-completed-course-${course.id}`} />
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-xl leading-tight mb-2">{course.title}</CardTitle>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{course.summary}</p>
                      <div className="text-sm text-blue-600 font-medium">{course.instructor}</div>
                      <div className="text-xs text-gray-500">{course.institution}</div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {course.duration}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {course.enrolledStudents}
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                            {course.rating}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className={`flex-1 text-sm ${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                          onClick={() => !isCompleted && markCourseComplete(course.id)}
                          disabled={isCompleted}
                          data-testid={`button-enroll-${course.id}`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Concluído
                            </>
                          ) : (
                            <>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Iniciar Curso
                            </>
                          )}
                        </Button>
                        {/* Botão de Quiz Interativo */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="hover:bg-blue-50 border-blue-200 text-blue-600" 
                              data-testid={`button-quiz-${course.id}`}
                            >
                              <Brain className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>🧠 Quiz Interativo: {course.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">Questão 1 de 5</h4>
                                <p className="text-blue-800 mb-4">Qual é o principal receptor do sistema endocanabinoide encontrado no sistema nervoso central?</p>
                                <div className="space-y-2">
                                  {["CB1", "CB2", "TRPV1", "GPR55"].map((option, idx) => (
                                    <Button key={idx} variant="outline" className="w-full justify-start text-left hover:bg-blue-100">
                                      {String.fromCharCode(65 + idx)}) {option}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <Button variant="outline">Anterior</Button>
                                <div className="flex space-x-2">
                                  <Button variant="outline">Pular</Button>
                                  <Button>Próxima</Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {course.certificate && (
                          <Button variant="outline" size="sm" className="hover:bg-yellow-50 border-yellow-200" data-testid={`button-certificate-${course.id}`}>
                            <Award className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab de Recursos Interativos */}
          <TabsContent value="interactive" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 Recursos Interativos</h2>
              <p className="text-gray-600">Simuladores clínicos, casos práticos e ferramentas interativas para aprendizado ativo</p>
            </div>
            
            {/* Simuladores Clínicos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-green-100 text-green-800">Simulador</Badge>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">4.9</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl">🧬 Simulador de Prescrição Cannabis</CardTitle>
                  <p className="text-gray-600 text-sm">Simule prescrições reais com feedback instantâneo baseado em guidelines clínicos</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Casos disponíveis:</span>
                      <span className="font-medium">15 cenários</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duração média:</span>
                      <span className="font-medium">20-30 min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">CME Credits:</span>
                      <span className="font-medium text-green-600">2 créditos</span>
                    </div>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Iniciar Simulação
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-blue-100 text-blue-800">Calculadora</Badge>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">1,234 usos</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl">💊 Calculadora de Dosagem</CardTitle>
                  <p className="text-gray-600 text-sm">Ferramenta para cálculo preciso de dosagens de CBD/THC baseado em peso e condição</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Condições:</span>
                      <span className="font-medium">12 patologias</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Faixas etárias:</span>
                      <span className="font-medium">Pediátrica, Adulto, Geriátrica</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Última atualização:</span>
                      <span className="font-medium">Set 2025</span>
                    </div>
                  </div>
                  <Button disabled className="w-full bg-gray-300 text-gray-600 cursor-not-allowed">
                    EM BREVE
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Casos Práticos Interativos */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Casos Clínicos Interativos</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  {
                    id: "case-epilepsy",
                    title: "Epilepsia Refratária Pediátrica",
                    patient: "Sofia, 8 anos",
                    specialty: "Neurologia",
                    difficulty: "Intermediário",
                    duration: "45 min",
                    cme: 3,
                    description: "Criança com epilepsia refratária, múltiplas medicações sem controle adequado."
                  },
                  {
                    id: "case-chronic-pain",
                    title: "Dor Crônica Neuropática",
                    patient: "Carlos, 65 anos",
                    specialty: "Medicina da Dor",
                    difficulty: "Avançado",
                    duration: "60 min",
                    cme: 4,
                    description: "Paciente diabético com neuropatia periférica e dor intratável."
                  },
                  {
                    id: "case-cancer-palliative",
                    title: "Cuidados Paliativos Oncológicos",
                    patient: "Maria, 58 anos",
                    specialty: "Oncologia",
                    difficulty: "Intermediário",
                    duration: "50 min",
                    cme: 3,
                    description: "Paciente oncológica terminal com múltiplos sintomas descontrolados."
                  }
                ].map((clinicalCase) => (
                  <Card key={clinicalCase.id} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">{clinicalCase.specialty}</Badge>
                        <Badge className={`text-xs ${
                          clinicalCase.difficulty === "Básico" ? "bg-green-100 text-green-800" :
                          clinicalCase.difficulty === "Intermediário" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {clinicalCase.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{clinicalCase.title}</CardTitle>
                      <p className="text-sm text-blue-600 font-medium">{clinicalCase.patient}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{clinicalCase.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{clinicalCase.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Award className="h-3 w-3 text-yellow-500" />
                          <span>{clinicalCase.cme} CME</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                        <FileText className="h-4 w-4 mr-2" />
                        Iniciar Caso
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Ferramentas Adicionais */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">🛠️ Ferramentas Clínicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    icon: Globe, 
                    title: "Drug Interactions Checker", 
                    description: "Verificador de interações medicamentosas",
                    color: "from-orange-500 to-red-500"
                  },
                  { 
                    icon: Timer, 
                    title: "Onset Calculator", 
                    description: "Calculadora de tempo de início de ação",
                    color: "from-green-500 to-blue-500"
                  },
                  { 
                    icon: BookmarkCheck, 
                    title: "Protocol Builder", 
                    description: "Construtor de protocolos personalizados",
                    color: "from-purple-500 to-pink-500"
                  },
                  { 
                    icon: UserPlus, 
                    title: "Patient Tracker", 
                    description: "Rastreador de evolução do paciente",
                    color: "from-blue-500 to-indigo-500"
                  }
                ].map((tool, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r ${tool.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{tool.title}</h4>
                      <p className="text-xs text-gray-600">{tool.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tab de Pesquisas */}
          <TabsContent value="research" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🔬 Pesquisas Científicas Recentes</h2>
              <p className="text-gray-600">Evidências científicas atualizadas • Peer-reviewed journals</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {filteredResearch.map((paper) => (
                <Card key={paper.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300" data-testid={`card-research-${paper.id}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {paper.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Impact: {paper.impact}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {paper.citations} citações
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">{paper.date}</div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                      {paper.title}
                    </h3>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="mb-1"><strong>Autores:</strong> {paper.authors}</div>
                      <div className="mb-1"><strong>Publicado em:</strong> {paper.journal}</div>
                      <div><strong>Instituição:</strong> {paper.institution}</div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 leading-relaxed">{paper.abstract}</p>
                    
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Principais Achados:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {paper.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" data-testid={`button-view-paper-${paper.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Artigo Completo
                      </Button>
                      <Button size="sm" variant="outline" className="hover:bg-gray-50" data-testid={`button-download-pdf-${paper.id}`}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => toggleBookmark(paper.id)}
                        className="hover:bg-blue-50"
                        data-testid={`button-bookmark-paper-${paper.id}`}
                      >
                        <Bookmark className={`h-4 w-4 ${bookmarkedContent.includes(paper.id) ? 'fill-blue-500 text-blue-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab de Webinars */}
          <TabsContent value="webinars" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎥 Webinars e Conferências</h2>
              <p className="text-gray-600">Educação ao vivo com especialistas • CME certificado</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {filteredWebinars.map((webinar) => (
                <Card key={webinar.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300" data-testid={`card-webinar-${webinar.id}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <Badge className={getStatusColor(webinar.status)}>
                          {getStatusText(webinar.status)}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                          {webinar.cmeCredits} CME
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {webinar.currentAttendees}/{webinar.maxAttendees} inscritos
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">{webinar.duration}</div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {webinar.title}
                    </h3>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        {webinar.date} às {webinar.time}
                      </div>
                      <div className="flex items-center mb-2">
                        <Stethoscope className="h-4 w-4 mr-2 text-blue-500" />
                        {webinar.speaker} - {webinar.specialty}
                      </div>
                      <div className="flex items-center mb-3">
                        <GraduationCap className="h-4 w-4 mr-2 text-blue-500" />
                        {webinar.institution}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{webinar.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {webinar.topics.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex space-x-3">
                      {webinar.status === "upcoming" && (
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" data-testid={`button-register-${webinar.id}`}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Inscrever-se
                        </Button>
                      )}
                      {webinar.status === "available" && (
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" data-testid={`button-watch-${webinar.id}`}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Assistir Ao Vivo
                        </Button>
                      )}
                      {webinar.status === "completed" && (
                        <Button variant="outline" className="flex-1 hover:bg-gray-50" data-testid={`button-replay-${webinar.id}`}>
                          <Video className="h-4 w-4 mr-2" />
                          Ver Gravação
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleBookmark(webinar.id)}
                        className="hover:bg-blue-50" 
                        data-testid={`button-bookmark-webinar-${webinar.id}`}
                      >
                        <Bookmark className={`h-4 w-4 ${bookmarkedContent.includes(webinar.id) ? 'fill-blue-500 text-blue-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab de Certificados */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🏆 Meus Certificados</h2>
              <p className="text-gray-600">Certificados CME obtidos • Reconhecidos pelo CFM</p>
            </div>
            
            {completedCourses.filter(courseId => {
              const course = medicalCourses.find(c => c.id === courseId);
              return course && course.certificate;
            }).length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum certificado ainda</h3>
                <p className="text-gray-500 mb-6">Complete cursos para ganhar certificados CME</p>
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-view-courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Cursos Disponíveis
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {medicalCourses
                  .filter(course => completedCourses.includes(course.id) && course.certificate)
                  .map((course) => (
                    <Card key={course.id} className="border-2 border-yellow-200 shadow-md bg-gradient-to-br from-yellow-50 to-orange-50" data-testid={`card-certificate-${course.id}`}>
                      <CardHeader className="text-center pb-3">
                        <Award className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                        <CardTitle className="text-lg text-gray-900">{course.title}</CardTitle>
                        <div className="text-sm text-gray-600">{course.institution}</div>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <div className="text-2xl font-bold text-yellow-600 mb-1">{course.cmeCredits}</div>
                          <div className="text-sm text-gray-600">Créditos CME</div>
                        </div>
                        <div className="text-xs text-gray-500 mb-4">
                          Certificado emitido em {new Date().toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-yellow-600 hover:bg-yellow-700" data-testid={`button-download-cert-${course.id}`}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" className="hover:bg-yellow-50" data-testid={`button-verify-cert-${course.id}`}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}