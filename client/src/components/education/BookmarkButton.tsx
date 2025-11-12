import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

interface BookmarkButtonProps {
  id: string;
  isBookmarked: boolean;
  onToggle: (id: string) => void;
  variant?: "patient" | "medical";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function BookmarkButton({
  id,
  isBookmarked,
  onToggle,
  variant = "patient",
  size = "sm",
  className = ""
}: BookmarkButtonProps) {
  
  // Explicit color classes to avoid dynamic Tailwind class generation
  const bookmarkColorClass = isBookmarked
    ? variant === "medical" 
      ? "fill-blue-500 text-blue-500"
      : "fill-green-500 text-green-500"
    : "text-gray-400 hover:text-gray-600";
  
  const hoverClass = variant === "medical" ? "hover:bg-blue-50 dark:hover:bg-blue-900/20" : "hover:bg-green-50 dark:hover:bg-green-900/20";
  
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => onToggle(id)}
      className={`h-8 w-8 p-0 ${hoverClass} ${className}`}
      data-testid={`button-bookmark-${id}`}
      aria-label={isBookmarked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Bookmark className={`h-4 w-4 transition-colors ${bookmarkColorClass}`} />
    </Button>
  );
}