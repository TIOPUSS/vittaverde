/**
 * Educational Components - Shared components for VittaVerde University systems
 * 
 * These components are designed to be used across both Patient and Medical
 * educational interfaces, providing consistent UI patterns and functionality.
 */

// Core Components
export { ProgressCard } from './ProgressCard';
export { ContentCard } from './ContentCard';
export { SearchFilters } from './SearchFilters';
export { BookmarkButton } from './BookmarkButton';

// Utility Functions
export {
  getDifficultyColor,
  getMedicalLevelColor,
  getWebinarStatusColor,
  getWebinarStatusText,
  saveProgress,
  loadProgress,
  saveList,
  loadList,
  formatDuration,
  formatNumber,
  filterBySearch,
  filterByCategory,
  calculateProgress,
  type UserProgress
} from './utils';

// Common Types for Educational Content
export interface Category {
  id: string;
  label: string;
  icon: any;
}

export interface BaseContent {
  id: string;
  title: string;
  description: string;
  category: string;
  type?: string;
  tags?: string[];
  featured?: boolean;
  rating?: number;
  views?: number;
  author?: string;
  date?: string;
}

export interface Course extends BaseContent {
  duration: string;
  level?: string;
  difficulty?: string;
  modules?: number;
  certificate?: boolean;
  hasQuiz?: boolean;
  instructor?: string;
  institution?: string;
  cmeCredits?: number;
  enrolledStudents?: number;
  topics?: string[];
}

export interface ResearchPaper extends BaseContent {
  journal: string;
  authors: string;
  institution?: string;
  impact?: number;
  citations?: number;
  pdfUrl?: string;
  abstract?: string;
  keyFindings?: string[];
}

export interface Webinar extends BaseContent {
  date: string;
  time?: string;
  duration: string;
  speaker: string;
  specialty: string;
  institution?: string;
  status: "upcoming" | "available" | "completed";
  cmeCredits?: number;
  maxAttendees?: number;
  currentAttendees?: number;
  topics?: string[];
}