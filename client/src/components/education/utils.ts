/**
 * Shared utility functions for educational components
 */

// Função para obter cor da dificuldade/nível
export function getDifficultyColor(difficulty: string): string {
  const lower = difficulty.toLowerCase();
  if (lower.includes("iniciante") || lower.includes("básico")) {
    return "bg-green-100 text-green-800";
  }
  if (lower.includes("intermediário")) {
    return "bg-yellow-100 text-yellow-800";
  }
  if (lower.includes("avançado")) {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-800";
}

// Função para obter cor da categoria médica
export function getMedicalLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case "básico":
      return "bg-blue-100 text-blue-800";
    case "intermediário":
      return "bg-orange-100 text-orange-800";
    case "avançado":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Função para obter status de webinar
export function getWebinarStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "upcoming":
      return "bg-blue-100 text-blue-800";
    case "available":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Função para obter texto do status
export function getWebinarStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case "upcoming":
      return "Em breve";
    case "available":
      return "Disponível";
    case "completed":
      return "Finalizado";
    default:
      return status;
  }
}

// Interface para dados de progresso do usuário
export interface UserProgress {
  totalRead?: number;
  totalTime?: number;
  certificates?: number;
  streak?: number;
  currentCredits?: number;
  requiredCredits?: number;
  certificatesEarned?: number;
  coursesCompleted?: number;
  researchRead?: number;
  webinarsAttended?: number;
}

// Função para salvar progresso no localStorage
export function saveProgress(key: string, progress: UserProgress): void {
  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

// Função para carregar progresso do localStorage
export function loadProgress(key: string): UserProgress | null {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading progress:', error);
    return null;
  }
}

// Função para salvar lista no localStorage
export function saveList(key: string, list: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    console.error('Error saving list:', error);
  }
}

// Função para carregar lista do localStorage
export function loadList(key: string): string[] {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading list:', error);
    return [];
  }
}

// Função para formatar duração
export function formatDuration(duration: string): string {
  return duration.replace(/min/g, 'min').replace(/h/g, 'h');
}

// Função para formatar números
export function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

// Função para filtrar conteúdo por busca
export function filterBySearch<T extends { title: string; description?: string; tags?: string[]; topics?: string[] }>(
  items: T[],
  searchTerm: string
): T[] {
  if (!searchTerm.trim()) return items;
  
  const search = searchTerm.toLowerCase();
  return items.filter(item => 
    item.title.toLowerCase().includes(search) ||
    item.description?.toLowerCase().includes(search) ||
    item.tags?.some(tag => tag.toLowerCase().includes(search)) ||
    item.topics?.some(topic => topic.toLowerCase().includes(search))
  );
}

// Função para filtrar por categoria
export function filterByCategory<T extends { category: string }>(
  items: T[],
  selectedCategory: string
): T[] {
  if (selectedCategory === "all") return items;
  return items.filter(item => item.category === selectedCategory);
}

// Função para calcular porcentagem de progresso
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}