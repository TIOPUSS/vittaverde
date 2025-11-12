import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, Clock, Eye, Star, BookOpen, 
  Video, FileText, Calendar, Tag, Award, Sparkles
} from 'lucide-react';

interface EducationalContent {
  id: string;
  title: string;
  content: string;
  contentType: 'article' | 'video' | 'course';
  category: string;
  specialty?: string;
  difficulty?: string;
  duration?: number;
  imageUrl?: string;
  videoUrl?: string;
  tags: string[];
  targetAudience: string;
  publishedAt: string;
  viewCount: number;
  rating: number;
  source: string;
}

export default function ConteudoComercialPage() {
  const [match, params] = useRoute('/comercial/conteudo/:id');
  const [, setLocation] = useLocation();
  const contentId = params?.id;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: content, isLoading } = useQuery<EducationalContent>({
    queryKey: [`/api/university/educational-content/${contentId}`],
    enabled: !!contentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-white/10 rounded-2xl w-3/4"></div>
            <div className="h-96 bg-white/10 rounded-3xl"></div>
            <div className="space-y-3">
              <div className="h-4 bg-white/10 rounded"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="mb-6">
            <BookOpen className="h-20 w-20 mx-auto text-blue-400 mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Conteúdo não encontrado
            </h1>
          </div>
          <Button 
            onClick={() => setLocation('/comercial/universidade')}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Universidade
          </Button>
        </div>
      </div>
    );
  }

  const getContentIcon = () => {
    switch (content.contentType) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'course': return <BookOpen className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getContentTypeLabel = () => {
    switch (content.contentType) {
      case 'video': return 'Vídeo';
      case 'course': return 'Curso';
      case 'article': return 'Artigo';
      default: return content.contentType;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar />
      
      {/* Hero Section - Seguindo padrão da Universidade */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-indigo-600/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button 
            onClick={() => setLocation('/comercial/universidade')}
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 px-6 py-6 mb-8"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>

          {/* Content Header */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2">
                {getContentIcon()}
                <span className="ml-2">{getContentTypeLabel()}</span>
              </Badge>
              {content.specialty && (
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  {content.specialty}
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {content.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-white/80">
              {content.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{content.duration} min</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <span>{content.viewCount} visualizações</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span>{content.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{new Date(content.publishedAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Player */}
            {content.contentType === 'video' && content.videoUrl && (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-slate-900/50 flex items-center justify-center">
                    <Video className="h-20 w-20 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Article Image */}
            {content.contentType === 'article' && content.imageUrl && (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
                <CardContent className="p-0">
                  <img 
                    src={content.imageUrl} 
                    alt={content.title}
                    className="w-full h-auto object-cover"
                  />
                </CardContent>
              </Card>
            )}

            {/* Content Body */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-8">
                <div 
                  className="prose prose-invert prose-lg max-w-none text-white/90 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: content.content }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag, index) => (
                      <Badge 
                        key={index}
                        className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Info */}
            {content.contentType === 'course' && (
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Informações do Curso</h3>
                  </div>
                  <div className="space-y-3">
                    {content.difficulty && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Nível:</span>
                        <Badge className="bg-white/20 text-white border-white/30">
                          {content.difficulty}
                        </Badge>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Categoria:</span>
                      <span className="text-white font-medium">{content.category}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Source */}
            <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Fonte</h3>
                </div>
                <p className="text-white/90">{content.source}</p>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 border-0">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                  Quer saber mais?
                </h3>
                <p className="text-white/90 mb-4">
                  Explore mais conteúdos educacionais na nossa universidade
                </p>
                <Button 
                  onClick={() => setLocation('/comercial/universidade')}
                  className="w-full bg-white text-blue-600 hover:bg-white/90"
                  data-testid="button-more-content"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Mais Conteúdos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
