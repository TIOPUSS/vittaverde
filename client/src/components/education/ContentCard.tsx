import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Eye, Star, CheckCircle, Award, PlayCircle, FileText, Bookmark } from "lucide-react";
import { getDifficultyColor } from "./utils";

interface ContentCardProps {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  category: string;
  type?: string;
  duration?: string;
  level?: string;
  difficulty?: string;
  rating?: number;
  views?: number;
  enrolledStudents?: number;
  author?: string;
  instructor?: string;
  institution?: string;
  tags?: string[];
  topics?: string[];
  featured?: boolean;
  completed?: boolean;
  bookmarked?: boolean;
  certificate?: boolean;
  hasQuiz?: boolean;
  cmeCredits?: number;
  variant?: "patient" | "medical";
  onAction?: () => void;
  onBookmark?: () => void;
  onQuiz?: () => void;
  onCertificate?: () => void;
  actionText?: string;
  className?: string;
}

export function ContentCard({
  id,
  title,
  description,
  summary,
  category,
  type = "course",
  duration,
  level,
  difficulty,
  rating,
  views,
  enrolledStudents,
  author,
  instructor,
  institution,
  tags = [],
  topics = [],
  featured = false,
  completed = false,
  bookmarked = false,
  certificate = false,
  hasQuiz = false,
  cmeCredits,
  variant = "patient",
  onAction,
  onBookmark,
  onQuiz,
  onCertificate,
  actionText = "Estudar",
  className = ""
}: ContentCardProps) {
  // Using shared getDifficultyColor function from utils

  // Função para ícone do tipo
  const getTypeIcon = (contentType: string) => {
    const typeMap: { [key: string]: any } = {
      video: PlayCircle,
      interactive: Star,
      calculator: Award,
      guide: FileText,
      course: BookOpen,
      document: FileText,
      article: FileText,
      faq: FileText
    };
    return typeMap[contentType] || BookOpen;
  };

  const TypeIcon = getTypeIcon(type);
  const gradientClass = variant === "medical" 
    ? "bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700" 
    : "bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-700";
  
  // Explicit bookmark color classes to avoid dynamic Tailwind generation
  const bookmarkColorClass = bookmarked
    ? variant === "medical"
      ? "fill-blue-500 text-blue-500"
      : "fill-green-500 text-green-500"
    : "text-gray-400";

  return (
    <Card 
      className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${gradientClass} ${className}`}
      data-testid={`card-content-${id}`}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2 flex-wrap">
            {(level || difficulty) && (
              <Badge className={getDifficultyColor(level || difficulty || "")}>
                {level || difficulty}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <TypeIcon className="h-3 w-3 mr-1" />
              {type}
            </Badge>
            {cmeCredits && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                {cmeCredits} CME
              </Badge>
            )}
            {featured && (
              <Badge className="text-xs bg-purple-100 text-purple-800">
                ✨ Destaque
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {onBookmark && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBookmark}
                className="h-8 w-8 p-0"
                data-testid={`button-bookmark-${id}`}
              >
                <Bookmark className={`h-4 w-4 ${bookmarkColorClass}`} />
              </Button>
            )}
            {completed && (
              <CheckCircle className="h-5 w-5 text-green-600" data-testid={`icon-completed-${id}`} />
            )}
          </div>
        </div>
        
        <CardTitle className="text-xl leading-tight mb-2 text-gray-900 dark:text-gray-100">{title}</CardTitle>
        
        {summary && (
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">{summary}</p>
        )}
        
        {description && !summary && (
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">{description}</p>
        )}
        
        {(author || instructor) && (
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {instructor || author}
          </div>
        )}
        
        {institution && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{institution}</div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Métricas */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-4">
            {duration && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {duration}
              </div>
            )}
            {(views != null || enrolledStudents != null) && (
              <div className="flex items-center">
                {variant === "medical" ? <Users className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {enrolledStudents ?? views?.toLocaleString()}
              </div>
            )}
            {rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                {rating}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {(tags.length > 0 || topics.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-4">
            {(tags.length > 0 ? tags : topics).slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button 
            className={`flex-1 text-sm ${
              completed 
                ? 'bg-green-600 hover:bg-green-700' 
                : variant === "medical"
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
            }`}
            onClick={onAction}
            disabled={completed}
            data-testid={`button-action-${id}`}
          >
            {completed ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluído
              </>
            ) : (
              <>
                <TypeIcon className="h-4 w-4 mr-2" />
                {actionText}
              </>
            )}
          </Button>
          
          {hasQuiz && onQuiz && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onQuiz}
              className="hover:bg-blue-50" 
              data-testid={`button-quiz-${id}`}
            >
              <Star className="h-4 w-4" />
            </Button>
          )}
          
          {certificate && onCertificate && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCertificate}
              className="hover:bg-purple-50" 
              data-testid={`button-certificate-${id}`}
            >
              <Award className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}