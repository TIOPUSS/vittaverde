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
  BookOpen, Video, Search, Star, Clock, Play,
  ArrowLeft, Zap, TrendingUp, Users, Trophy, Target,
  BookMarked, Layers, GraduationCap, Newspaper, ArrowUpRight, Award
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

export default function UniversidadeVendedorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    // Redirecionar baseado no role do usuário
    if (user?.role === 'admin') {
      setLocation('/admin');
    } else if (user?.role === 'vendor') {
      setLocation('/vendedor');
    } else {
      setLocation('/comercial');
    }
  };
  
  const { data: educationalContentData = [], isLoading: loadingContent } = useQuery<EducationalContent[]>({
    queryKey: ['/api/university/educational-content?audience=both'],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar />
      
      {/* Hero Section - Mobile Optimized */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-indigo-600/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-48 h-48 sm:w-72 sm:h-72 sm:top-20 sm:left-20 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 sm:bottom-20 sm:right-20 bg-indigo-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-20">
          <div className="flex items-center justify-between mb-6 sm:mb-12">
            <Button 
              onClick={handleBack}
              className="bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 px-3 py-2.5 sm:px-6 sm:py-6"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </div>

          <div className="max-w-4xl mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 sm:mb-6 leading-tight">
              Desenvolva suas
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Habilidades Comerciais
              </span>
            </h1>
            <p className="text-sm sm:text-lg lg:text-2xl text-gray-300 leading-relaxed mb-6 sm:mb-10">
              Treinamentos especializados em vendas de Cannabis Medicinal e gestão de leads
            </p>
            
            {/* Search Bar - Mobile Optimized */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl opacity-50"></div>
              <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex-1 flex items-center gap-2 sm:gap-4 px-3 sm:px-6">
                    <Search className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
                    <Input
                      placeholder="Buscar treinamentos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 bg-transparent text-white placeholder:text-gray-400 text-sm sm:text-lg h-10 sm:h-16 focus-visible:ring-0"
                      data-testid="input-search-content"
                    />
                  </div>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 sm:px-10 sm:py-7 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-lg hover:from-blue-600 hover:to-indigo-600">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Buscar</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - Mobile Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[
              { icon: BookMarked, value: educationalContent.length, label: 'Treinamentos', color: 'from-blue-500 to-cyan-500' },
              { icon: Users, value: '850+', label: 'Vendedores', color: 'from-cyan-500 to-indigo-500' },
              { icon: Trophy, value: '92%', label: 'Sucesso', color: 'from-indigo-500 to-blue-500' },
              { icon: Award, value: '15+', label: 'Certificações', color: 'from-blue-500 to-cyan-500' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 hover:bg-white/10 transition-all group">
                <div className={`inline-flex p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${stat.color} mb-2 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-4 w-4 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">{stat.value}</div>
                <div className="text-xs sm:text-base text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-16">
        
        {/* Categories Filter - Mobile Scroll */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-12 overflow-x-auto pb-2 sm:pb-4 scrollbar-hide snap-x snap-mandatory">
          {categories.map(cat => (
            <Button
              key={cat.id}
              onClick={() => setSelectedFilter(cat.id)}
              data-testid={`filter-${cat.id}`}
              className={`flex items-center gap-1.5 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold whitespace-nowrap transition-all snap-start flex-shrink-0 text-xs sm:text-base ${
                selectedFilter === cat.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0'
                  : 'bg-white/5 backdrop-blur-xl border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <cat.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{cat.label}</span>
              <Badge className={`text-xs ${selectedFilter === cat.id ? 'bg-white/20 text-white border-0' : 'bg-white/10 text-gray-400 border-0'}`}>
                {cat.count}
              </Badge>
            </Button>
          ))}
        </div>

        {loadingContent ? (
          <div className="text-center py-32">
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="text-gray-300 text-lg">Carregando conteúdo...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Content */}
            {selectedFilter === 'all' && educationalContent.filter(c => c.priority === 'high').length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-4xl font-bold text-white">Em Destaque</h2>
                  <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
                    Ver Tudo
                    <ArrowUpRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {educationalContent.filter(c => c.priority === 'high').slice(0, 2).map((content) => (
                    <div key={content.id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-indigo-500/50 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Card className="relative border-0 bg-white/5 backdrop-blur-2xl overflow-hidden rounded-3xl hover:bg-white/10 transition-all">
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
                              {content.contentType === 'video' && <Video className="h-4 w-4 mr-2" />}
                              {content.contentType === 'course' && <GraduationCap className="h-4 w-4 mr-2" />}
                              {content.contentType === 'article' && <BookOpen className="h-4 w-4 mr-2" />}
                              {content.contentType}
                            </Badge>
                            <Badge className="bg-blue-500/90 backdrop-blur-xl text-white border-0 px-4 py-2 font-semibold">
                              <Star className="h-4 w-4 mr-1 fill-white" />
                              {content.rating}
                            </Badge>
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
                                {content.viewCount} alunos
                              </span>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-8">
                          <div className="flex flex-wrap gap-2 mb-6">
                            {content.tags.slice(0, 4).map(tag => (
                              <Badge key={tag} className="bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button 
                            onClick={() => setLocation(`/comercial/conteudo/${content.id}`)}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-7 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-600 shadow-xl shadow-blue-500/50" 
                            data-testid={`button-access-${content.id}`}
                          >
                            <Play className="h-5 w-5 mr-3" />
                            Iniciar Treinamento
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
              <div className="mb-16">
                <h2 className="text-4xl font-bold text-white mb-8">
                  {selectedFilter === 'courses' ? 'Todos os Cursos' : 'Cursos'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredContent.courses.map(content => (
                    <Card key={content.id} className="group border-0 bg-white/5 backdrop-blur-2xl overflow-hidden rounded-3xl hover:bg-white/10 transition-all hover:-translate-y-2">
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
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Curso
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-blue-500/90 backdrop-blur-xl text-white border-0">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            {content.rating}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">{content.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {content.duration}min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {content.viewCount}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {content.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          onClick={() => setLocation(`/comercial/conteudo/${content.id}`)}
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-6 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600" 
                          data-testid={`button-access-course-${content.id}`}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Acessar Curso
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Vídeos */}
            {filteredContent.videos.length > 0 && (
              <div className="mb-16">
                <h2 className="text-4xl font-bold text-white mb-8">
                  {selectedFilter === 'videos' ? 'Todos os Vídeos' : 'Vídeos'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredContent.videos.map(content => (
                    <Card key={content.id} className="group border-0 bg-white/5 backdrop-blur-2xl overflow-hidden rounded-3xl hover:bg-white/10 transition-all hover:-translate-y-2">
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
                            <Video className="h-3 w-3 mr-1" />
                            Vídeo
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-blue-500/90 backdrop-blur-xl text-white border-0">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            {content.rating}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">{content.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {content.duration}min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {content.viewCount}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {content.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          onClick={() => setLocation(`/comercial/conteudo/${content.id}`)}
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-6 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600" 
                          data-testid={`button-access-video-${content.id}`}
                        >
                          <Play className="h-4 w-4 mr-2" />
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
              <div className="mb-16">
                <h2 className="text-4xl font-bold text-white mb-8">
                  {selectedFilter === 'articles' ? 'Todos os Artigos' : 'Artigos'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredContent.articles.map(content => (
                    <Card key={content.id} className="group border-0 bg-white/5 backdrop-blur-2xl overflow-hidden rounded-3xl hover:bg-white/10 transition-all hover:-translate-y-2">
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
                            <BookOpen className="h-3 w-3 mr-1" />
                            Artigo
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-blue-500/90 backdrop-blur-xl text-white border-0">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            {content.rating}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">{content.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {content.duration}min leitura
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {content.viewCount}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {content.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          onClick={() => setLocation(`/comercial/conteudo/${content.id}`)}
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-6 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600" 
                          data-testid={`button-access-article-${content.id}`}
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
