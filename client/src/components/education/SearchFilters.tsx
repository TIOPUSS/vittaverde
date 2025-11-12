import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

interface Category {
  id: string;
  label: string;
  icon: any;
}

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  placeholder?: string;
  variant?: "patient" | "medical";
  showClearButton?: boolean;
  className?: string;
}

export function SearchFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  placeholder = "Buscar conteúdos...",
  variant = "patient",
  showClearButton = true,
  className = ""
}: SearchFiltersProps) {
  
  const focusClass = variant === "medical" ? "focus:border-blue-500" : "focus:border-green-500";
  
  const handleClearSearch = () => {
    onSearchChange("");
    onCategoryChange("all");
  };

  const hasActiveFilters = searchTerm.length > 0 || selectedCategory !== "all";

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`} data-testid="search-filters-container">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Campo de Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`pl-10 h-12 text-lg border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${focusClass}`}
            data-testid="input-search"
          />
          {searchTerm && showClearButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap gap-2">
          <div className="hidden sm:flex items-center text-sm text-gray-600 dark:text-gray-400 mr-2">
            <Filter className="h-4 w-4 mr-1" />
            Filtros:
          </div>
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className={`flex items-center space-x-2 transition-colors ${
                  isSelected 
                    ? variant === "medical" 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-green-600 hover:bg-green-700"
                    : variant === "medical"
                      ? "hover:bg-blue-50 hover:text-blue-600 border-gray-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:border-gray-700"
                      : "hover:bg-green-50 hover:text-green-600 border-gray-200 dark:hover:bg-green-900/20 dark:hover:text-green-400 dark:border-gray-700"
                }`}
                data-testid={`filter-${category.id}`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Indicador de Filtros Ativos */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Filtros ativos:</span>
            {searchTerm && (
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                variant === "medical" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              }`}>
                "{searchTerm}"
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                variant === "medical" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              }`}>
                {categories.find(c => c.id === selectedCategory)?.label}
              </span>
            )}
          </div>
          {showClearButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              data-testid="button-clear-all-filters"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}