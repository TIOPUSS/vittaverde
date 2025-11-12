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

export default function ConteudoMedicoPage() {
  const [match, params] = useRoute('/medico/conteudo/:id');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="mb-6">
            <BookOpen className="h-20 w-20 mx-auto text-emerald-400 mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Conteúdo não encontrado
            </h1>
          </div>
          <Button 
            onClick={() => setLocation('/medico/universidade')}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900">
      <Navbar />
      
      {/* Hero Section - Seguindo padrão da Universidade */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-teal-600/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button 
            onClick={() => setLocation('/medico/universidade')}
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 px-6 py-6 mb-8"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2">
              {getContentIcon()}
              <span className="ml-2 font-semibold">{getContentTypeLabel()}</span>
            </Badge>
            <Badge className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 font-semibold">
              {content.category}
            </Badge>
            {content.difficulty && (
              <Badge className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2 font-semibold">
                {content.difficulty}
              </Badge>
            )}
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight max-w-4xl">
            {content.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-300">
            {content.duration && (
              <span className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">{content.duration} min</span>
              </span>
            )}
            <span className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
              <Eye className="h-5 w-5" />
              <span className="font-semibold">{content.viewCount} visualizações</span>
            </span>
            <span className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{content.rating}/5</span>
            </span>
            <span className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl">
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">{new Date(content.publishedAt).toLocaleDateString('pt-BR')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Player */}
            {content.contentType === 'video' && content.videoUrl && (
              <Card className="border-0 bg-white/5 backdrop-blur-2xl overflow-hidden rounded-3xl">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black">
                    <iframe
                      src={content.videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={content.title}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image */}
            {content.imageUrl && content.contentType !== 'video' && (
              <Card className="border-0 bg-white/5 backdrop-blur-2xl overflow-hidden rounded-3xl hover:bg-white/10 transition-all">
                <CardContent className="p-6">
                  <img 
                    src={content.imageUrl} 
                    alt={content.title}
                    className="w-full h-auto rounded-2xl"
                  />
                </CardContent>
              </Card>
            )}

            {/* Article Content */}
            <Card className="border-0 bg-white/5 backdrop-blur-2xl rounded-3xl hover:bg-white/10 transition-all">
              <CardContent className="p-8 lg:p-12">
                <div 
                  className="prose prose-lg prose-invert max-w-none
                    prose-headings:text-white prose-headings:font-bold
                    prose-p:text-gray-300 prose-p:leading-relaxed
                    prose-a:text-emerald-400 prose-a:font-semibold hover:prose-a:text-emerald-300
                    prose-strong:text-emerald-400
                    prose-ul:text-gray-300 prose-ol:text-gray-300
                    prose-li:text-gray-300
                    prose-blockquote:text-gray-400 prose-blockquote:border-emerald-500
                    prose-code:text-emerald-400 prose-code:bg-white/10 prose-code:px-1 prose-code:rounded"
                  dangerouslySetInnerHTML={{ __html: content.content }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <Card className="border-0 bg-white/5 backdrop-blur-2xl rounded-3xl hover:bg-white/10 transition-all">
                <CardContent className="p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                      <Tag className="h-5 w-5 text-emerald-400" />
                    </div>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag, index) => (
                      <Badge 
                        key={index}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 text-gray-300 hover:bg-white/20 transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Source Info */}
            <Card className="border-0 bg-white/5 backdrop-blur-2xl rounded-3xl hover:bg-white/10 transition-all">
              <CardContent className="p-6">
                <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-lg">
                  <div className="p-2 bg-teal-500/20 rounded-xl">
                    <Award className="h-5 w-5 text-teal-400" />
                  </div>
                  Sobre este conteúdo
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
                    <span className="font-semibold text-emerald-400">Fonte:</span>
                    <p className="text-gray-300 mt-1">{content.source}</p>
                  </div>
                  {content.specialty && (
                    <div className="p-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
                      <span className="font-semibold text-green-400">Especialidade:</span>
                      <p className="text-gray-300 mt-1">{content.specialty}</p>
                    </div>
                  )}
                  <div className="p-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
                    <span className="font-semibold text-teal-400">Público-alvo:</span>
                    <p className="text-gray-300 mt-1">
                      {content.targetAudience === 'patient' ? 'Pacientes' : 
                       content.targetAudience === 'doctor' ? 'Médicos' : 'Todos'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/50 to-teal-500/50 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Card className="relative border-0 bg-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden hover:bg-white/10 transition-all">
                <CardContent className="p-8 text-white">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <Sparkles className="w-full h-full" />
                  </div>
                  <h3 className="font-black text-2xl mb-3 relative z-10">Gostou do conteúdo?</h3>
                  <p className="text-gray-300 mb-6 text-sm leading-relaxed relative z-10">
                    Continue sua jornada de aprendizado com mais materiais sobre Cannabis Medicinal
                  </p>
                  <Button 
                    onClick={() => setLocation('/medico/universidade')}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 font-bold py-6 text-base rounded-2xl relative z-10"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Ver mais conteúdos
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
