import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, Video, FileText, Search, Star, Clock, Play,
  ArrowLeft, Sparkles, Award, Newspaper, ArrowUpRight,
  Users, TrendingUp, BookMarked, Heart, GraduationCap, Layers
} from 'lucide-react';

interface EducationalContent {
  id: string;
  title: string;
  contentType: 'article' | 'video' | 'course';
  category: string;
  duration: number;
  imageUrl?: string;
  tags: string[];
  viewCount: number;
  rating: number;
  priority: 'low' | 'medium' | 'high';
}

export default function UniversidadePacientePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      if (user?.role === 'admin') {
        setLocation('/admin');
      } else {
        setLocation('/paciente');
      }
    }
  };
  
  const { data: educationalContentData = [], isLoading: loadingContent } = useQuery<EducationalContent[]>({
    queryKey: ['/api/university/educational-content?audience=patient'],
    retry: false,
  });

  const educationalContent: EducationalContent[] = educationalContentData;

  const filteredContent = useMemo(() => {
    let courses: EducationalContent[] = [];
    let videos: EducationalContent[] = [];
    let articles: EducationalContent[] = [];

    if (selectedFilter === 'all' || selectedFilter === 'courses') {
      courses = educationalContent.filter(c => c.contentType === 'course');
    }
    if (selectedFilter === 'all' || selectedFilter === 'videos') {
      videos = educationalContent.filter(c => c.contentType === 'video');
    }
    if (selectedFilter === 'all' || selectedFilter === 'articles') {
      articles = educationalContent.filter(c => c.contentType === 'article');
    }

    return { courses, videos, articles };
  }, [selectedFilter, educationalContent]);

  const categories = [
    { 
      id: 'all', 
      label: 'Todos', 
      icon: Layers, 
      count: educationalContent.length 
    },
    { 
      id: 'courses', 
      label: 'Cursos', 
      icon: GraduationCap, 
      count: educationalContent.filter(c => c.contentType === 'course').length 
    },
    { 
      id: 'videos', 
      label: 'Vídeos', 
      icon: Video, 
      count: educationalContent.filter(c => c.contentType === 'video').length 
    },
    { 
      id: 'articles', 
      label: 'Artigos', 
      icon: Newspaper, 
      count: educationalContent.filter(c => c.contentType === 'article').length 
    }
  ];

  const isLoading = loadingContent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50">
      <Navbar />
      
      {/* Hero Section - Mobile Optimized */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-lime-200/20 via-green-200/20 to-emerald-200/20 lg:from-lime-200/30 lg:via-green-200/30 lg:to-emerald-200/30"></div>
        
        <div className="relative max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-20">
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <Button 
              onClick={handleBack}
              size="sm"
              className="bg-white/90 backdrop-blur-xl border border-lime-300 text-lime-800 hover:bg-white px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-6"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              Voltar
            </Button>
          </div>

          <div className="mb-6 sm:mb-10 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 leading-tight">
              Aprenda sobre
              <span className="block bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 bg-clip-text text-transparent">
                Cannabis Medicinal
              </span>
            </h1>
            <p className="text-sm sm:text-base lg:text-2xl text-gray-700 leading-relaxed mb-4 sm:mb-6 lg:mb-10">
              Conteúdo educacional sobre CBD, uso seguro, regulamentação ANVISA
            </p>
            
            {/* Search Bar - Compact Mobile */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-lime-400 to-green-500 rounded-2xl sm:rounded-3xl blur-lg lg:blur-xl opacity-20 lg:opacity-30"></div>
              <div className="relative bg-white/90 backdrop-blur-xl border border-lime-200 rounded-2xl sm:rounded-3xl p-1 sm:p-2 shadow-md sm:shadow-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-lime-600 flex-shrink-0" />
                    <Input
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 bg-transparent text-gray-900 placeholder:text-gray-500 text-sm sm:text-base lg:text-lg h-10 sm:h-12 lg:h-16 focus-visible:ring-0"
                      data-testid="input-search-content"
                    />
                  </div>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-3 sm:px-6 lg:px-10 py-2 sm:py-4 lg:py-7 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm lg:text-lg hover:from-lime-600 hover:to-green-700 flex-shrink-0"
                  >
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Buscar</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - Mobile Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[
              { icon: BookMarked, value: educationalContent.length, label: 'Conteúdos', color: 'from-lime-500 to-green-500' },
              { icon: Users, value: '2.5k+', label: 'Pacientes', color: 'from-green-500 to-emerald-500' },
              { icon: TrendingUp, value: '95%', label: 'Satisfação', color: 'from-emerald-500 to-lime-500' },
              { icon: Award, value: '20+', label: 'Especialistas', color: 'from-lime-500 to-green-500' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-xl border border-lime-200 rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-6 hover:bg-white transition-all group shadow-md lg:shadow-lg">
                <div className={`inline-flex p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-gradient-to-r ${stat.color} mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                </div>
                <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-900 mb-1 lg:mb-2">{stat.value}</div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-10 lg:py-16">
        
        {/* Categories Filter - Horizontal Scroll Mobile */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 lg:mb-12 overflow-x-auto pb-2 sm:pb-4 scrollbar-hide snap-x snap-mandatory">
          {categories.map(cat => (
            <Button
              key={cat.id}
              size="sm"
              onClick={() => setSelectedFilter(cat.id)}
              data-testid={`filter-${cat.id}`}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-xl font-semibold whitespace-nowrap transition-all snap-start flex-shrink-0 text-xs sm:text-sm lg:text-base ${
                selectedFilter === cat.id
                  ? 'bg-gradient-to-r from-lime-500 to-green-600 text-white border-0 shadow-md lg:shadow-lg'
                  : 'bg-white/80 backdrop-blur-xl border border-lime-200 text-gray-700 hover:bg-white'
              }`}
            >
              <cat.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{cat.label}</span>
              <Badge className={`text-xs ${selectedFilter === cat.id ? 'bg-white/20 text-white border-0' : 'bg-lime-100 text-lime-700 border-0'}`}>
                {cat.count}
              </Badge>
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-32">
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-lime-200 rounded-3xl px-8 py-6 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
              <span className="text-gray-700 text-lg">Carregando conteúdo...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Content */}
            {selectedFilter === 'all' && educationalContent.filter(c => c.priority === 'high').length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-4xl font-bold text-gray-900">Em Destaque</h2>
                  <Button variant="ghost" className="text-lime-600 hover:text-lime-700 hover:bg-lime-50">
                    Ver Tudo
                    <ArrowUpRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {educationalContent.filter(c => c.priority === 'high').slice(0, 2).map((content) => (
                    <div key={content.id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-lime-400/50 to-green-500/50 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Card className="relative border-0 bg-white/90 backdrop-blur-2xl overflow-hidden rounded-3xl hover:bg-white transition-all shadow-xl border border-lime-200">
                        <div className="relative h-80 overflow-hidden">
                          {content.imageUrl && (
                            <img 
                              src={content.imageUrl} 
                              alt={content.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                          <div className="absolute top-6 left-6 right-6 flex items-start justify-between">
                            <Badge className="bg-black/60 backdrop-blur-xl text-white border-0 px-4 py-2">
                              <GraduationCap className="h-4 w-4 mr-2" />
                              {content.contentType === 'video' ? 'Vídeo' : content.contentType === 'course' ? 'Curso' : 'Artigo'}
                            </Badge>
                            <div className="flex gap-2">
                              <Badge className="bg-lime-500/90 backdrop-blur-xl text-white border-0 px-4 py-2 font-semibold">
                                <Star className="h-4 w-4 mr-1 fill-white" />
                                {content.rating}
                              </Badge>
                            </div>
                          </div>
                          <div className="absolute bottom-6 left-6 right-6">
                            <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2">{content.title}</h3>
                            <div className="flex items-center gap-4 text-gray-300">
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {content.duration}min
                              </span>
                              <span className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {content.viewCount} visualizações
                              </span>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-8">
                          <div className="flex flex-wrap gap-2 mb-6">
                            {content.tags.slice(0, 4).map(tag => (
                              <Badge key={tag} className="bg-lime-500/10 text-lime-700 border border-lime-500/20">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button 
                            onClick={() => setLocation(`/paciente/conteudo/${content.id}`)}
                            className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white py-7 rounded-2xl font-semibold text-lg hover:from-lime-600 hover:to-green-700 shadow-xl shadow-lime-500/30"
                            data-testid={`button-start-${content.id}`}
                          >
                            <Play className="h-5 w-5 mr-3" />
                            Começar Agora
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cursos */}
            {filteredContent.courses.length > 0 && (
              <div className="mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">
                  {selectedFilter === 'courses' ? 'Todos os Cursos' : 'Cursos'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {filteredContent.courses.map(content => (
                    <Card key={content.id} className="group border-0 bg-white/80 backdrop-blur-2xl overflow-hidden rounded-2xl sm:rounded-3xl hover:bg-white transition-all hover:-translate-y-1 sm:hover:-translate-y-2 shadow-md sm:shadow-lg border border-lime-200">
                      <div className="relative h-40 sm:h-48 lg:h-56 overflow-hidden">
                        {content.imageUrl && (
                          <img 
                            src={content.imageUrl} 
                            alt={content.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4">
                          <Badge className="bg-black/60 backdrop-blur-xl text-white border-0 text-xs">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Curso
                          </Badge>
                        </div>
                        <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4">
                          <Badge className="bg-lime-500/90 backdrop-blur-xl text-white border-0 text-xs">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            {content.rating}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 leading-tight">{content.title}</h3>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {content.duration}min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                            {content.viewCount}
                          </span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => setLocation(`/paciente/conteudo/${content.id}`)}
                          className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white rounded-xl hover:from-lime-600 hover:to-green-700 text-xs sm:text-sm py-2 sm:py-3" 
                          data-testid={`button-view-${content.id}`}
                        >
                          <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          Começar Curso
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Vídeos */}
            {filteredContent.videos.length > 0 && (
              <div className="mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">
                  {selectedFilter === 'videos' ? 'Todos os Vídeos' : 'Vídeos'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {filteredContent.videos.map(content => (
                    <Card key={content.id} className="group border-0 bg-white/80 backdrop-blur-2xl overflow-hidden rounded-2xl sm:rounded-3xl hover:bg-white transition-all hover:-translate-y-1 sm:hover:-translate-y-2 shadow-md sm:shadow-lg border border-lime-200">
                      <div className="relative h-40 sm:h-48 lg:h-56 overflow-hidden">
                        {content.imageUrl && (
                          <img 
                            src={content.imageUrl} 
                            alt={content.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4">
                          <Badge className="bg-black/60 backdrop-blur-xl text-white border-0 text-xs">
                            <Video className="h-3 w-3 mr-1" />
                            Vídeo
                          </Badge>
                        </div>
                        <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4">
                          <Badge className="bg-green-500/90 backdrop-blur-xl text-white border-0 text-xs">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            {content.rating}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 leading-tight">{content.title}</h3>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {content.duration}min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                            {content.viewCount}
                          </span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => setLocation(`/paciente/conteudo/${content.id}`)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 text-xs sm:text-sm py-2 sm:py-3" 
                          data-testid={`button-view-${content.id}`}
                        >
                          <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          Assistir Vídeo
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Artigos */}
            {filteredContent.articles.length > 0 && (
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-8">
                  {selectedFilter === 'articles' ? 'Todos os Artigos' : 'Artigos'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredContent.articles.map(content => (
                    <Card key={content.id} className="group border-0 bg-white/80 backdrop-blur-2xl overflow-hidden rounded-3xl hover:bg-white transition-all hover:-translate-y-2 shadow-lg border border-lime-200">
                      <div className="relative h-56 overflow-hidden">
                        {content.imageUrl && (
                          <img 
                            src={content.imageUrl} 
                            alt={content.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-black/60 backdrop-blur-xl text-white border-0">
                            <FileText className="h-3 w-3 mr-1" />
                            Artigo
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-emerald-500/90 backdrop-blur-xl text-white border-0">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            {content.rating}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{content.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {content.duration}min leitura
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {content.viewCount}
                          </span>
                        </div>
                        <Button 
                          onClick={() => setLocation(`/paciente/conteudo/${content.id}`)}
                          className="w-full bg-gradient-to-r from-emerald-500 to-lime-600 text-white rounded-xl hover:from-emerald-600 hover:to-lime-700" 
                          data-testid={`button-view-${content.id}`}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Ler Artigo
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
