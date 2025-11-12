import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "@/lib/types";
import { 
  FileText, Search, Phone, MessageCircle, Calendar, 
  DollarSign, User as UserIcon, Clock, CheckCircle, AlertCircle,
  Edit, Plus, TrendingUp, Target, Users, Mail, 
  PhoneCall, Video, MoreHorizontal, Star, ArrowUp, ArrowDown,
  Activity, Zap, Filter, BarChart3, PieChart, Settings, GripVertical,
  Heart, Pill, Stethoscope, ClipboardList, Leaf, Sparkles,
  TrendingDown, UserCheck, CalendarClock, BrainCircuit, 
  HeartPulse, Droplet, MessageSquare, Bell, ArrowLeft,
  X, Save, Eye, Briefcase, Trash2, Building2, MapPin, Globe, 
  Percent, Hash, Tag, Link as LinkIcon, History, Folder
} from "lucide-react";

// Lead update form schema
const leadUpdateSchema = z.object({
  status: z.enum(["novo", "contato_inicial", "aguardando_receita", "receita_recebida", "receita_validada", "produtos_liberados", "finalizado"]),
  notes: z.string().optional(),
  estimatedValue: z.string().optional(),
});

// New lead form schema
const newLeadSchema = z.object({
  patientName: z.string().min(2, "Nome do paciente é obrigatório"),
  patientEmail: z.string().email("Email inválido"),
  patientPhone: z.string().min(10, "Telefone é obrigatório"),
  consultantId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  notes: z.string().optional(),
  source: z.string().default("manual"),
});

// Complete Lead edit form schema with ALL fields
const leadEditSchema = z.object({
  // Personal Info
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  
  // Location
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  
  // CRM Data
  leadScore: z.coerce.number().min(0).max(100).optional(),
  tags: z.string().optional(), // Will be converted to array
  source: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["novo", "contato_inicial", "aguardando_receita", "receita_recebida", "receita_validada", "produtos_liberados", "finalizado"]),
  
  // Financial
  estimatedValue: z.string().optional(),
  budget: z.string().optional(),
  conversionProbability: z.coerce.number().min(0).max(100).optional(),
  
  // Timeline
  lastInteraction: z.string().optional(),
  nextFollowUp: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  
  // Social
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  
  // Other
  productsInterest: z.string().optional(), // Will be converted to array
  notes: z.string().optional(),
  referralSource: z.string().optional(),
  lostReason: z.string().optional(),
});

// Stage form schema for creating/editing stages
const stageFormSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().default("blue"),
  isActive: z.boolean().default(true),
});

type LeadUpdateForm = z.infer<typeof leadUpdateSchema>;
type NewLeadForm = z.infer<typeof newLeadSchema>;
type LeadEditForm = z.infer<typeof leadEditSchema>;
type StageForm = z.infer<typeof stageFormSchema>;

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '_'); // Replace spaces with underscore
}

// Safe Brazilian currency parser
function parseBRL(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || !value) return 0;
  
  // Remove espaços e R$
  let cleaned = value.replace(/\s/g, '').replace(/^R\$\s?/, '');
  
  // Detectar se é formato brasileiro (1.234,56) ou americano (1234.56)
  const hasBothCommaAndDot = cleaned.includes(',') && cleaned.includes('.');
  const lastCommaPos = cleaned.lastIndexOf(',');
  const lastDotPos = cleaned.lastIndexOf('.');
  
  if (hasBothCommaAndDot) {
    // Se tem ambos, o último é o decimal
    if (lastCommaPos > lastDotPos) {
      // Formato brasileiro: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato americano: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Só tem vírgula - pode ser decimal brasileiro ou separador de milhar
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Provavelmente decimal brasileiro: 123,45
      cleaned = cleaned.replace(',', '.');
    } else {
      // Provavelmente separador de milhar: 1,234,567
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    // Só tem ponto - pode ser decimal americano ou separador de milhar brasileiro
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Provavelmente decimal americano: 123.45 - já está correto
    } else {
      // Provavelmente separador de milhar brasileiro: 1.234.567
      cleaned = cleaned.replace(/\./g, '');
    }
  }
  
  const number = Number.parseFloat(cleaned);
  return Number.isFinite(number) ? number : 0;
}

// Format value as Brazilian currency
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
}

// Clean Kanban Column Component
function KanbanColumn({ 
  id, 
  title, 
  icon: Icon, 
  count, 
  leads, 
  color,
  onEditLead,
  onViewLead,
}: {
  id: string;
  title: string;
  icon: any;
  count: number;
  leads: Lead[];
  color: string;
  onEditLead: (lead: Lead) => void;
  onViewLead: (lead: Lead) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const totalValue = leads.reduce((sum, lead) => {
    return sum + parseBRL(lead.estimatedValue);
  }, 0);

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col h-full min-w-[300px] transition-all duration-200 ${
        isOver ? 'bg-blue-50 rounded-xl p-1' : ''
      }`}
    >
      {/* Clean Column Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 ${color} rounded-lg`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
              <p className="text-xs text-gray-500">{count} leads</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <p className="text-xs text-gray-600 mb-0.5 font-medium">Total</p>
          <p className="font-bold text-base text-gray-900">
            {formatBRL(totalValue)}
          </p>
        </div>
      </div>

      {/* Cards Area */}
      <div className="flex-1 min-h-0">
        <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2 p-1 min-h-[550px]">
              {leads.map((lead) => (
                <DraggableLeadCard 
                  key={lead.id} 
                  lead={lead} 
                  onView={() => onViewLead(lead)}
                />
              ))}
              
              {leads.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[500px] text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 transition-all hover:border-gray-300">
                  <Icon className="h-10 w-10 mb-2 opacity-30 text-gray-400" />
                  <p className="text-sm font-medium text-gray-500">Nenhum lead</p>
                  <p className="text-xs text-gray-400">Arraste leads aqui</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SortableContext>
      </div>
    </div>
  );
}

// Clean Lead Card Component
function DraggableLeadCard({ 
  lead, 
  onView,
}: { 
  lead: Lead; 
  onView: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-l-red-500 bg-red-50/50";
      case "high": return "border-l-orange-500 bg-orange-50/50";
      case "medium": return "border-l-blue-500 bg-blue-50/50";
      case "low": return "border-l-green-500 bg-green-50/50";
      default: return "border-l-gray-400 bg-gray-50/50";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium": return "bg-blue-100 text-blue-700 border-blue-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const initials = (lead.patientName || 'Paciente').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  const getSourceBadge = (source: string) => {
    const badges: Record<string, {label: string, color: string}> = {
      website: { label: "Site", color: "bg-blue-50 text-blue-700 border-blue-200" },
      intake: { label: "Intake", color: "bg-purple-50 text-purple-700 border-purple-200" },
      indicacao: { label: "Indicação", color: "bg-pink-50 text-pink-700 border-pink-200" },
      telefone: { label: "Telefone", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
      referral: { label: "Referência", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      manual: { label: "Manual", color: "bg-gray-50 text-gray-700 border-gray-200" },
    };
    return badges[source] || { label: source, color: "bg-gray-50 text-gray-700 border-gray-200" };
  };

  const sourceBadge = getSourceBadge(lead.source);
  const createdDate = new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const leadScore = lead.leadScore || 0;
  const scoreColor = leadScore >= 75 ? 'text-green-600' : leadScore >= 50 ? 'text-yellow-600' : leadScore >= 25 ? 'text-orange-600' : 'text-red-600';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 bg-white border-l-4 ${getPriorityColor(lead.priority)} group border border-gray-200`}
      {...attributes}
      {...listeners}
      onClick={onView}
      data-testid={`lead-card-${lead.id}`}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-9 w-9 border border-gray-200">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {lead.patientName || `Novo Lead`}
              </h4>
              {lead.company && (
                <p className="text-xs text-gray-600 truncate font-medium">{lead.company}</p>
              )}
              {lead.jobTitle && (
                <p className="text-xs text-gray-500 truncate">{lead.jobTitle}</p>
              )}
              {!lead.company && !lead.jobTitle && (
                <p className="text-xs text-gray-500 truncate">
                  {lead.patientEmail || lead.patientPhone || `ID: ${lead.id.slice(0, 8)}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={`${getPriorityBadge(lead.priority)} border text-xs px-1.5 py-0.5 capitalize font-medium`}>
              {lead.priority}
            </Badge>
            {leadScore > 0 && (
              <span className={`text-xs font-bold ${scoreColor}`}>{leadScore}%</span>
            )}
          </div>
        </div>

        {/* Contact Info */}
        {(lead.patientPhone || lead.patientEmail) && (
          <div className="space-y-1">
            {lead.patientPhone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Phone className="h-3 w-3" />
                <span className="truncate">{lead.patientPhone}</span>
              </div>
            )}
            {lead.patientEmail && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{lead.patientEmail}</span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200">
                {tag}
              </Badge>
            ))}
            {lead.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 bg-gray-50 text-gray-600">
                +{lead.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Value */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-2 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 mb-0.5 font-medium">Valor Estimado</p>
          <p className="text-base font-bold text-blue-900">
            {formatBRL(parseBRL(lead.estimatedValue || lead.budget))}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <Badge className={`${sourceBadge.color} text-xs px-2 py-0.5 font-medium border`}>
            {sourceBadge.label}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{createdDate}</span>
          </div>
        </div>

        {/* Unassigned Warning */}
        {!lead.assignedConsultantId && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
            <div className="bg-amber-100 rounded-full p-1">
              <UserCheck className="h-3 w-3 text-amber-600" />
            </div>
            <p className="text-xs font-medium text-amber-700">Sem vendedor atribuído</p>
          </div>
        )}

        {/* Drag Indicator */}
        <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-gray-400">
            <GripVertical className="h-3 w-3" />
            <span className="text-xs">Arrastar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// CRM Page - Race condition fixed
export default function ComercialCRMPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterSalesperson, setFilterSalesperson] = useState("all");
  const [showCommissions, setShowCommissions] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);
  const [isStagesConfigOpen, setIsStagesConfigOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("detalhes");
  const [isEditingLead, setIsEditingLead] = useState(false);
  
  // Stage CRUD state
  const [isStageFormOpen, setIsStageFormOpen] = useState(false);
  const [isStageDeleteDialogOpen, setIsStageDeleteDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<any | null>(null);
  const [stageToDelete, setStageToDelete] = useState<any | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LeadUpdateForm>({
    resolver: zodResolver(leadUpdateSchema),
    defaultValues: {
      status: "novo",
      notes: "",
      estimatedValue: "",
    },
  });

  const editForm = useForm<LeadEditForm>({
    resolver: zodResolver(leadEditSchema),
  });

  const newLeadForm = useForm<NewLeadForm>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: {
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      priority: "medium",
      notes: "",
      source: "manual",
    },
  });

  const stageForm = useForm<StageForm>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "blue",
      isActive: true,
    },
  });

  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/me"],
    retry: false,
  });

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    retry: false,
  });

  const { data: stages = [], isLoading: stagesLoading } = useQuery<any[]>({
    queryKey: ["/api/lead-stages"],
    retry: false,
  });

  const { data: consultants = [] } = useQuery<{ id: string; fullName: string; userId: string; commissionRate: string }[]>({
    queryKey: ["/api/consultants"],
    retry: false,
  });

  // Query para buscar vendedores externos
  const { data: externalVendors = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/vendors"],
    enabled: currentUser?.user?.role === 'admin',
    retry: false,
  });

  // History query - apenas carrega quando viewingLead está definido
  const { data: history = [], isLoading: historyLoading } = useQuery<any[]>({
    queryKey: [`/api/leads/${viewingLead?.id}/history`],
    enabled: !!viewingLead?.id,
    retry: false,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeadUpdateForm }) => {
      return await apiRequest(`/api/leads/${id}/status`, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Lead atualizado!",
        description: "As informações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setEditingLead(null);
      setIsEditDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "❌ Erro ao atualizar",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: NewLeadForm) => {
      return await apiRequest("/api/leads", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Lead criado!",
        description: "O novo lead foi adicionado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsNewLeadDialogOpen(false);
      newLeadForm.reset();
    },
    onError: () => {
      toast({
        title: "❌ Erro ao criar lead",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const editLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeadEditForm }) => {
      // Convert tags and productsInterest from string to array
      const formattedData: any = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        productsInterest: data.productsInterest ? data.productsInterest.split(',').map(p => p.trim()).filter(Boolean) : [],
      };
      
      // Remove undefined, null, and empty string fields to avoid timestamp conversion errors
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === undefined || formattedData[key] === null || formattedData[key] === '') {
          delete formattedData[key];
        }
      });
      
      return await apiRequest(`/api/leads/${id}`, "PATCH", formattedData);
    },
    onSuccess: () => {
      toast({
        title: "✅ Lead atualizado!",
        description: "Todas as informações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setViewingLead(null);
      setIsViewDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "❌ Erro ao atualizar",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/leads/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "✅ Lead excluído!",
        description: "O lead foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setLeadToDelete(null);
      setIsDeleteDialogOpen(false);
      setViewingLead(null);
      setIsViewDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "❌ Erro ao excluir",
        description: "Não foi possível excluir o lead. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Assign consultant to lead mutation
  const assignConsultantMutation = useMutation({
    mutationFn: async ({ leadId, consultantId }: { leadId: string; consultantId: string }) => {
      return await apiRequest(`/api/leads/${leadId}/assign`, "PATCH", { consultantId });
    },
    onSuccess: () => {
      toast({
        title: "✅ Vendedor atribuído!",
        description: "O lead foi atribuído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setViewingLead(null);
      setIsViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao atribuir",
        description: error.message || "Não foi possível atribuir o vendedor. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Stage CRUD Mutations
  const createStageMutation = useMutation({
    mutationFn: async (data: StageForm) => {
      const slug = generateSlug(data.name);
      const position = stages.length > 0 ? Math.max(...stages.map((s: any) => s.position)) + 1 : 0;
      return await apiRequest("/api/lead-stages", "POST", {
        ...data,
        slug,
        position,
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Stage criado!",
        description: "O novo stage foi adicionado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-stages"] });
      setIsStageFormOpen(false);
      stageForm.reset();
      setEditingStage(null);
    },
    onError: () => {
      toast({
        title: "❌ Erro ao criar stage",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StageForm }) => {
      const slug = generateSlug(data.name);
      return await apiRequest(`/api/lead-stages/${id}`, "PATCH", {
        ...data,
        slug,
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Stage atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-stages"] });
      setIsStageFormOpen(false);
      stageForm.reset();
      setEditingStage(null);
    },
    onError: () => {
      toast({
        title: "❌ Erro ao atualizar",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/lead-stages/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "✅ Stage excluído!",
        description: "O stage foi removido com sucesso.",
      });
      // Invalidate both queries to refresh the entire kanban
      queryClient.invalidateQueries({ queryKey: ["/api/lead-stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setStageToDelete(null);
      setIsStageDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao excluir",
        description: error.message || "Não foi possível excluir o stage. Pode haver leads usando este stage.",
        variant: "destructive",
      });
      setStageToDelete(null);
      setIsStageDeleteDialogOpen(false);
    },
  });

  useEffect(() => {
    if (viewingLead) {
      setIsViewDialogOpen(true);
      setActiveTab("detalhes");
      
      // Populate edit form with current lead data
      editForm.reset({
        company: viewingLead.company || "",
        jobTitle: viewingLead.jobTitle || "",
        address: viewingLead.address || "",
        city: viewingLead.city || "",
        state: viewingLead.state || "",
        zipCode: viewingLead.zipCode || "",
        leadScore: viewingLead.leadScore || 0,
        tags: viewingLead.tags?.join(', ') || "",
        source: viewingLead.source || "intake",
        priority: viewingLead.priority || "medium",
        status: viewingLead.status,
        estimatedValue: viewingLead.estimatedValue || "",
        budget: viewingLead.budget || "",
        conversionProbability: viewingLead.conversionProbability || 50,
        lastInteraction: viewingLead.lastInteraction || "",
        nextFollowUp: viewingLead.nextFollowUp || "",
        expectedCloseDate: viewingLead.expectedCloseDate || "",
        linkedin: viewingLead.linkedin || "",
        instagram: viewingLead.instagram || "",
        productsInterest: viewingLead.productsInterest?.join(', ') || "",
        notes: viewingLead.notes || "",
        referralSource: viewingLead.referralSource || "",
        lostReason: viewingLead.lostReason || "",
      });
    }
  }, [viewingLead, editForm]);

  useEffect(() => {
    if (editingStage) {
      setIsStageFormOpen(true);
      stageForm.reset({
        name: editingStage.name || "",
        description: editingStage.description || "",
        color: editingStage.color || "blue",
        isActive: editingStage.isActive !== undefined ? editingStage.isActive : true,
      });
    } else {
      stageForm.reset({
        name: "",
        description: "",
        color: "blue",
        isActive: true,
      });
    }
  }, [editingStage, stageForm]);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = (lead.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (lead.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.source.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === "all" || lead.priority === filterPriority;
      const matchesSalesperson = filterSalesperson === "all" || lead.consultantName === filterSalesperson;
      
      return matchesSearch && matchesPriority && matchesSalesperson;
    });
  }, [leads, searchTerm, filterPriority, filterSalesperson]);

  const leadsByStatus = useMemo(() => {
    // Aguardar stages carregarem
    if (!stages || stages.length === 0) {
      return {};
    }
    
    // Agrupar leads dinamicamente baseado nos stages do banco
    const grouped: Record<string, Lead[]> = {};
    
    // Inicializar com todos os stages do banco (usar slug ou value)
    stages.forEach((stage: any) => {
      const stageKey = stage.value || stage.slug;
      grouped[stageKey] = [];
    });
    
    // Distribuir os leads filtrados pelos stages
    filteredLeads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      } else {
        console.warn(`Lead com status desconhecido: ${lead.status}`, lead);
      }
    });
    
    console.log("DEBUG leadsByStatus:", grouped);
    console.log("DEBUG filteredLeads:", filteredLeads);
    console.log("DEBUG stages:", stages);
    
    return grouped;
  }, [filteredLeads, stages]);

  const uniqueSalespersons = useMemo(() => {
    const fromLeads = leads.map(l => l.consultantName).filter(Boolean);
    const fromConsultants = consultants.map(c => c.fullName).filter(Boolean);
    return Array.from(new Set([...fromLeads, ...fromConsultants] as string[]));
  }, [leads, consultants]);

  const consultantsByName = useMemo(() => {
    return Object.fromEntries(
      (consultants || []).map(c => {
        const name = c.fullName?.trim() ?? "";
        let rate = 0.10;
        
        if (c.commissionRate) {
          const parsed = parseFloat(c.commissionRate);
          if (!isNaN(parsed) && parsed > 0 && parsed <= 1) {
            rate = parsed;
          } else if (!isNaN(parsed) && parsed > 1 && parsed <= 100) {
            rate = parsed / 100;
          }
        }
        
        return [name, rate];
      })
    );
  }, [consultants]);

  const stats = {
    total: leads.length,
    novos: leads.filter(lead => lead.status === "novo").length,
    emAndamento: leads.filter(lead => ["contato_inicial", "aguardando_receita", "receita_recebida", "receita_validada", "produtos_liberados"].includes(lead.status)).length,
    finalizados: leads.filter(lead => lead.status === "finalizado").length,
    totalValue: leads
      .filter(lead => lead.status === "finalizado")
      .reduce((sum, lead) => sum + parseBRL(lead.estimatedValue), 0),
    pipelineValue: leads
      .filter(lead => lead.status !== "finalizado")
      .reduce((sum, lead) => sum + parseBRL(lead.estimatedValue), 0),
    conversionRate: leads.length > 0 ? Math.round((leads.filter(lead => lead.status === "finalizado").length / leads.length) * 100) : 0,
    avgDealSize: leads.filter(lead => lead.status === "finalizado").length > 0 
      ? leads.filter(lead => lead.status === "finalizado")
        .reduce((sum, lead) => sum + parseBRL(lead.estimatedValue), 0) / 
        leads.filter(lead => lead.status === "finalizado").length 
      : 0,
  };

  const commissionsData = useMemo(() => {
    let closedLeads = filteredLeads.filter(lead => lead.status === "finalizado");
    
    // PERMISSÃO: Vendedor vê apenas suas próprias comissões
    if (currentUser?.user?.role === "consultant") {
      const currentConsultant = consultants.find((c: any) => c.userId === currentUser?.user?.id);
      if (currentConsultant) {
        closedLeads = closedLeads.filter(lead => lead.assignedConsultantId === currentConsultant.id);
      } else {
        closedLeads = []; // Sem consultor atribuído = sem comissões
      }
    }
    
    const commissionsBySalesperson: Record<string, { 
      leads: number; 
      totalValue: number; 
      commission: number; 
      rate: number;
    }> = {};
    
    let totalCommissions = 0;
    let totalSalesValue = 0;
    
    for (const lead of closedLeads) {
      // Usar o vendedor ATRIBUÍDO ao invés do original
      const assignedConsultant = consultants.find((c: any) => c.id === lead.assignedConsultantId);
      const salesperson = (assignedConsultant?.fullName || "Não atribuído").trim();
      const leadValue = parseBRL(lead.estimatedValue);
      const rate = assignedConsultant?.commissionRate ? parseFloat(assignedConsultant.commissionRate) / 100 : 0.10;
      const commission = leadValue * rate;
      
      if (!commissionsBySalesperson[salesperson]) {
        commissionsBySalesperson[salesperson] = { 
          leads: 0,
          totalValue: 0,
          commission: 0,
          rate 
        };
      }
      
      commissionsBySalesperson[salesperson].leads += 1;
      commissionsBySalesperson[salesperson].totalValue += leadValue;
      commissionsBySalesperson[salesperson].commission += commission;
      totalCommissions += commission;
      totalSalesValue += leadValue;
    }
    
    // Calcular taxa média REAL baseado nas comissões efetivamente pagas
    const averageRate = totalSalesValue > 0 ? (totalCommissions / totalSalesValue) : 0;
    
    const filteredCommissions = filterSalesperson === "all" 
      ? { totalCommissions, commissionsBySalesperson, averageRate }
      : {
          totalCommissions: commissionsBySalesperson[filterSalesperson]?.commission || 0,
          commissionsBySalesperson: filterSalesperson in commissionsBySalesperson 
            ? { [filterSalesperson]: commissionsBySalesperson[filterSalesperson] }
            : {},
          averageRate: commissionsBySalesperson[filterSalesperson]?.rate || 0
        };

    return filteredCommissions;
  }, [filteredLeads, filterSalesperson, consultants, currentUser]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditDialogOpen(true);
    form.reset({
      status: lead.status,
      notes: lead.notes || "",
      estimatedValue: lead.estimatedValue || "",
    });
  };

  // Custom collision detection que prioriza colunas sobre leads
  const customCollisionDetection = (args: any) => {
    // Usar stages dinâmicos do banco ao invés de array hardcoded
    const validStatuses = stages ? stages.map(s => s.value) : [];
    
    // Primeiro tentar detectar colisão com colunas (droppable areas)
    const pointerCollisions = pointerWithin(args);
    const columnCollisions = pointerCollisions?.filter((collision: any) => 
      validStatuses.includes(collision.id as string)
    );
    
    if (columnCollisions && columnCollisions.length > 0) {
      return columnCollisions;
    }
    
    // Se não colidiu com nenhuma coluna, usar o algoritmo padrão
    return rectIntersection(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeLeadId = active.id as string;
    const activeLead = leads.find(lead => lead.id === activeLeadId);
    if (!activeLead) {
      setActiveId(null);
      return;
    }
    
    let targetStatus: string | null = null;
    // Usar stages dinâmicos do banco ao invés de array hardcoded
    const validStatuses = stages ? stages.map(s => s.value) : [];
    
    // Primeiro verificar se caiu diretamente em uma coluna
    if (validStatuses.includes(over.id as string)) {
      targetStatus = over.id as string;
    }
    // Se caiu sobre um lead, usar o status desse lead (que deve estar na coluna correta)
    else if (over.id && typeof over.id === 'string') {
      const targetLead = leads.find(lead => lead.id === over.id);
      if (targetLead) {
        // Garantir que estamos usando o status da coluna onde o lead REALMENTE está
        targetStatus = targetLead.status;
        
        // Debug: verificar se o status é válido
        if (!validStatuses.includes(targetStatus)) {
          console.error('Status inválido detectado:', targetStatus);
          targetStatus = null;
        }
      }
    }
    
    if (!targetStatus) {
      setActiveId(null);
      return;
    }
    
    // Bloquear movimentação para trás após "receita_validada" (apenas para consultores, admin pode mover livremente)
    const isAdmin = currentUser?.user?.role === 'admin';
    
    if (!isAdmin && stages) {
      // Usar stages dinâmicos ordenados do banco
      const statusOrder = stages.sort((a, b) => a.order - b.order).map(s => s.value);
      const currentIndex = statusOrder.indexOf(activeLead.status);
      const targetIndex = statusOrder.indexOf(targetStatus);
      const validationIndex = statusOrder.indexOf("receita_validada");
      
      if (validationIndex !== -1 && currentIndex >= validationIndex && targetIndex < currentIndex) {
        setActiveId(null);
        toast({
          variant: "destructive",
          title: "🚫 Movimento bloqueado",
          description: "Não é permitido retroceder após a validação da receita.",
        });
        return;
      }
    }
    
    if (activeLead.status !== targetStatus) {
      // Atualização otimista - atualiza a UI imediatamente
      const previousLeads = queryClient.getQueryData<Lead[]>(["/api/leads"]);
      
      queryClient.setQueryData<Lead[]>(["/api/leads"], (old) => {
        if (!old) return old;
        return old.map(lead => 
          lead.id === activeLeadId 
            ? { ...lead, status: targetStatus as Lead["status"] }
            : lead
        );
      });
      
      updateLeadMutation.mutate({
        id: activeLeadId,
        data: { status: targetStatus as Lead["status"] }
      }, {
        onError: () => {
          // Reverte em caso de erro
          queryClient.setQueryData(["/api/leads"], previousLeads);
          toast({
            variant: "destructive",
            title: "❌ Erro ao mover",
            description: "Não foi possível mover o lead. Tente novamente.",
          });
        },
        onSuccess: () => {
          toast({
            title: "✅ Lead movido!",
            description: `Lead movido com sucesso`,
          });
        }
      });
    }
    
    setActiveId(null);
  };

  // Mapa de ícones e cores por stage (fallback para stages personalizados)
  const stageIconMap: Record<string, any> = {
    "novo": Sparkles,
    "contato_inicial": PhoneCall,
    "aguardando_receita": Clock,
    "receita_recebida": FileText,
    "receita_validada": CheckCircle,
    "produtos_liberados": Pill,
    "finalizado": Heart,
  };

  // Helper para converter nome da cor do banco para classe Tailwind
  const getColorClass = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      "blue": "bg-blue-500",
      "indigo": "bg-indigo-500",
      "purple": "bg-purple-500",
      "pink": "bg-pink-500",
      "rose": "bg-rose-500",
      "orange": "bg-orange-500",
      "green": "bg-green-500",
      "emerald": "bg-emerald-500",
      "teal": "bg-teal-500",
      "cyan": "bg-cyan-500",
      "sky": "bg-sky-500",
    };
    return colorMap[colorName] || "bg-gray-500";
  };

  // Criar colunas dinamicamente a partir dos stages do banco
  const columns = useMemo(() => {
    if (!stages || stages.length === 0 || !leadsByStatus || Object.keys(leadsByStatus).length === 0) {
      return [];
    }
    
    return stages
      .sort((a, b) => a.position - b.position)
      .map(stage => {
        // Usar slug ou value (após mapeamento no backend)
        const stageKey = stage.value || stage.slug;
        return {
          id: stageKey,
          title: stage.name,
          icon: stageIconMap[stageKey] || Folder,
          color: getColorClass(stage.color), // Usar cor do banco
          leads: leadsByStatus[stageKey] || [],
          count: (leadsByStatus[stageKey] || []).length
        };
      });
  }, [stages, leadsByStatus]);

  // Mobile restriction check
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-12 sm:py-20">
          <Card className="max-w-2xl w-full border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-2xl opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-full">
                      <BarChart3 className="h-16 w-16 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    CRM Comercial
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 font-medium">
                    Plataforma Profissional de Gestão
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-100 p-3 rounded-xl flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-amber-900 text-lg mb-2">
                        Acesso Desktop Necessário
                      </h3>
                      <p className="text-amber-800 leading-relaxed">
                        O CRM Comercial possui recursos avançados de gestão que exigem uma tela maior para melhor experiência.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                  <h3 className="font-bold text-blue-900 text-lg mb-4 flex items-center justify-center gap-2">
                    <Target className="h-5 w-5" />
                    Como Acessar
                  </h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                      <p className="text-blue-800">
                        <span className="font-semibold">Desktop ou Notebook:</span> Acesse através de um computador
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                      <p className="text-blue-800">
                        <span className="font-semibold">Tablet (Paisagem):</span> Use em modo horizontal com tela ≥ 1024px
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                      <p className="text-blue-800">
                        <span className="font-semibold">Navegador Atualizado:</span> Chrome, Firefox, Safari ou Edge
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Gestão de Leads</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Kanban Visual</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4">
                    <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Dashboards</p>
                  </div>
                </div>
                <Link href="/">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    data-testid="button-back-home"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Voltar para Início
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading || stagesLoading || !stages || stages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Carregando CRM</h3>
          <p className="text-sm text-gray-600">Preparando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Clean Header */}
        <div className="mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900 mb-4 -ml-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                  CRM de Vendas
                </h1>
                <p className="text-gray-600">Gerencie seu pipeline de leads e oportunidades</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setIsStagesConfigOpen(true)}
                variant="outline"
                className="border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-medium shadow-sm px-4"
                data-testid="button-configure-stages"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Stages
              </Button>
              <Button 
                onClick={() => setIsNewLeadDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium shadow-lg px-6"
                data-testid="button-new-lead"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </div>
        </div>

        {/* Clean Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1 uppercase">Leads</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">{stats.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-teal-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1 uppercase">Valor em Andamento</p>
                  <p className="text-2xl font-bold bg-gradient-to-br from-teal-600 to-cyan-600 bg-clip-text text-transparent">{formatBRL(stats.pipelineValue)}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1 uppercase">Finalizados</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.finalizados}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1 uppercase">Valor Total (Finalizado)</p>
                  <p className="text-2xl font-bold bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">{formatBRL(stats.totalValue)}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1 uppercase">Conversão</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-600 to-teal-600 bg-clip-text text-transparent">{stats.conversionRate}%</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clean Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div className="flex items-center gap-2 flex-1 w-full">
                <Search className="h-4 w-4 text-emerald-400" />
                <Input
                  placeholder="Buscar por nome, email ou observações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200 bg-emerald-50/50"
                  data-testid="input-search"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-full lg:w-[160px] border-emerald-200 bg-emerald-50/50">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSalesperson} onValueChange={setFilterSalesperson}>
                  <SelectTrigger className="w-full lg:w-[180px] border-emerald-200 bg-emerald-50/50">
                    <SelectValue placeholder="Vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueSalespersons.map((salesperson) => (
                      <SelectItem key={salesperson} value={salesperson}>
                        {salesperson}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={showCommissions ? "default" : "outline"}
                  onClick={() => setShowCommissions(!showCommissions)}
                  className={showCommissions 
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-lg" 
                    : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}
                  data-testid="button-commissions"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Comissões
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commissions Card */}
        {showCommissions && (
          <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-lg mb-6">
            <CardHeader className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent flex items-center">
                <DollarSign className="h-6 w-6 mr-2 text-emerald-600" />
                Relatório de Comissões
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Comissões</p>
                        <p className="text-2xl font-bold bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">{formatBRL(commissionsData.totalCommissions)}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Taxa Média</p>
                        <p className="text-2xl font-bold bg-gradient-to-br from-teal-600 to-cyan-600 bg-clip-text text-transparent">{(commissionsData.averageRate * 100).toFixed(1)}%</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Vendas Fechadas</p>
                        <p className="text-2xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.finalizados}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {Object.keys(commissionsData.commissionsBySalesperson).length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Por Vendedor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(commissionsData.commissionsBySalesperson).map(([salesperson, data]) => (
                      <Card key={salesperson} className="bg-gradient-to-br from-white to-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 text-sm">{salesperson}</h4>
                            <Badge className="bg-blue-500 text-white text-xs font-bold">
                              {(data.rate * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Vendas Fechadas:</span>
                              <span className="font-semibold text-gray-900">{data.leads}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total Vendido:</span>
                              <span className="font-semibold text-gray-900">{formatBRL(data.totalValue)}</span>
                            </div>
                            <div className="pt-2 border-t border-blue-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Comissão Total:</span>
                                <span className="text-lg font-bold text-blue-600">{formatBRL(data.commission)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(commissionsData.commissionsBySalesperson).length === 0 && (
                <div className="text-center py-8">
                  <div className="p-3 bg-gray-100 rounded-full inline-block mb-3">
                    <DollarSign className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm">
                    {filterSalesperson === "all" 
                      ? "Nenhuma venda fechada encontrada."
                      : `Nenhuma venda fechada para ${filterSalesperson}.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Clean Kanban Board with Horizontal Scroll */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200 p-5 shadow-lg overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            id="kanban-context"
          >
            <div className="flex gap-4 pb-4 min-h-[700px] w-max">
              {columns.map((column) => (
                <div key={column.id} className="flex-shrink-0">
                  <KanbanColumn
                    id={column.id}
                    title={column.title}
                    icon={column.icon}
                    count={column.count}
                    leads={column.leads}
                    color={column.color}
                    onEditLead={handleEditLead}
                    onViewLead={(lead) => setViewingLead(lead)}
                  />
                </div>
              ))}
            </div>

            <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
              {activeId ? (
                (() => {
                  const draggedLead = leads.find(l => l.id === activeId);
                  if (!draggedLead) return null;
                  
                  const getPriorityColor = (priority: string) => {
                    switch (priority) {
                      case "urgent": return "border-l-red-500 bg-red-50/50";
                      case "high": return "border-l-orange-500 bg-orange-50/50";
                      case "medium": return "border-l-blue-500 bg-blue-50/50";
                      case "low": return "border-l-green-500 bg-green-50/50";
                      default: return "border-l-gray-400 bg-gray-50/50";
                    }
                  };

                  const getPriorityBadge = (priority: string) => {
                    switch (priority) {
                      case "urgent": return "bg-red-100 text-red-700 border-red-200";
                      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
                      case "medium": return "bg-blue-100 text-blue-700 border-blue-200";
                      case "low": return "bg-green-100 text-green-700 border-green-200";
                      default: return "bg-gray-100 text-gray-700 border-gray-200";
                    }
                  };

                  const initials = (draggedLead.patientName || 'Paciente').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  
                  return (
                    <div className="rotate-3 opacity-95 scale-105 cursor-grabbing">
                      <Card className={`bg-white border-l-4 ${getPriorityColor(draggedLead.priority)} border border-gray-200 shadow-lg`}>
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Avatar className="h-9 w-9 border border-gray-200">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {draggedLead.patientName || `Novo Lead`}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">
                                  {draggedLead.patientEmail || draggedLead.patientPhone || `ID: ${draggedLead.id.slice(0, 8)}`}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${getPriorityBadge(draggedLead.priority)} border text-xs px-1.5 py-0.5 capitalize font-medium`}>
                              {draggedLead.priority}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <Footer />

      {/* View Lead Dialog - Comprehensive Tabs */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) {
          setViewingLead(null);
          setActiveTab("detalhes");
          setIsEditingLead(false);
        }
      }}>
        <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-500" />
              Gerenciar Lead
            </DialogTitle>
          </DialogHeader>
          {viewingLead && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="detalhes" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Histórico
                </TabsTrigger>
              </TabsList>

              {/* Detalhes Tab */}
              <TabsContent value="detalhes" className="space-y-4">
                {/* Edit Button at Top */}
                <div className="flex justify-end">
                  {!isEditingLead ? (
                    <Button 
                      onClick={() => setIsEditingLead(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      data-testid="button-start-edit"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          editForm.handleSubmit((data) => {
                            editLeadMutation.mutate({
                              id: viewingLead.id,
                              data
                            });
                            setIsEditingLead(false);
                          })();
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        disabled={editLeadMutation.isPending}
                        data-testid="button-save-inline"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {editLeadMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsEditingLead(false);
                          editForm.reset();
                        }}
                        variant="outline"
                        className="border-gray-200"
                        data-testid="button-cancel-edit"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Header Card */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <Avatar className="h-16 w-16 border-2 border-blue-300">
                    <AvatarFallback className="bg-blue-500 text-white font-bold text-lg">
                      {(viewingLead.patientName || '').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{viewingLead.patientName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">{viewingLead.patientEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={
                      viewingLead.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                      viewingLead.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-green-100 text-green-700 border-green-200'
                    }>
                      {viewingLead.priority === 'high' ? 'Alta' : viewingLead.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Score: {viewingLead.leadScore || 0}
                    </Badge>
                  </div>
                </div>

                {/* Info Sections */}
                <div className="space-y-4">
                  {/* Informações de Contato */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      Informações de Contato
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Telefone</p>
                        <p className="font-semibold text-gray-900">{viewingLead.patientPhone || 'Não informado'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Empresa</p>
                        <p className="font-semibold text-gray-900">{viewingLead.company || 'Não informado'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Cargo</p>
                        <p className="font-semibold text-gray-900">{viewingLead.jobTitle || 'Não informado'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Status</p>
                        <p className="font-semibold text-gray-900 capitalize">{viewingLead.status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vendedor Responsável */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-emerald-500" />
                      Vendedor Responsável
                    </h4>
                    {viewingLead.assignedConsultantId ? (
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Atribuído a:</p>
                              <p className="font-bold text-emerald-700">
                                {consultants.find((c: any) => c.id === viewingLead.assignedConsultantId)?.fullName || externalVendors.find((v: any) => v.id === viewingLead.assignedConsultantId)?.fullName || 'Vendedor'}
                              </p>
                              {viewingLead.assignedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Desde {new Date(viewingLead.assignedAt).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          {currentUser?.user?.role === 'admin' && (
                            <Select
                              onValueChange={(vendorId) => {
                                assignConsultantMutation.mutate({
                                  leadId: viewingLead.id,
                                  consultantId: vendorId
                                });
                              }}
                            >
                              <SelectTrigger className="w-[200px] border-emerald-300 text-emerald-700">
                                <SelectValue placeholder="Reatribuir" />
                              </SelectTrigger>
                              <SelectContent>
                                {externalVendors.map((vendor: any) => (
                                  <SelectItem key={vendor.id} value={vendor.id}>
                                    {vendor.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-200 rounded-full">
                              <AlertCircle className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700">Nenhum vendedor atribuído</p>
                              <p className="text-xs text-gray-500">Atribua este lead a um vendedor</p>
                            </div>
                          </div>
                          {currentUser?.user?.role === 'admin' ? (
                            <Select
                              onValueChange={(vendorId) => {
                                assignConsultantMutation.mutate({
                                  leadId: viewingLead.id,
                                  consultantId: vendorId
                                });
                              }}
                            >
                              <SelectTrigger className="w-[200px] bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 [&>span]:text-white">
                                <SelectValue placeholder="Selecionar Vendedor" />
                              </SelectTrigger>
                              <SelectContent>
                                {externalVendors.map((vendor: any) => (
                                  <SelectItem key={vendor.id} value={vendor.id} data-testid={`vendor-option-${vendor.id}`}>
                                    {vendor.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Button
                              data-testid="button-assign-to-me"
                              onClick={() => {
                                // Vendedor externo pode auto-atribuir
                                const currentVendor = externalVendors.find((v: any) => v.id === currentUser?.user?.id);
                                const currentConsultant = consultants.find((c: any) => c.userId === currentUser?.user?.id);
                                
                                const assignId = currentVendor?.id || currentConsultant?.id;
                                
                                if (assignId) {
                                  assignConsultantMutation.mutate({
                                    leadId: viewingLead.id,
                                    consultantId: assignId
                                  });
                                } else {
                                  toast({
                                    title: "❌ Erro",
                                    description: "Você não está cadastrado como vendedor.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                            >
                              Atribuir para Mim
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Localização */}
                  {(viewingLead.address || viewingLead.city || viewingLead.state) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        Localização
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {viewingLead.address && (
                          <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Endereço</p>
                            <p className="font-semibold text-gray-900">{viewingLead.address}</p>
                          </div>
                        )}
                        {viewingLead.city && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Cidade</p>
                            <p className="font-semibold text-gray-900">{viewingLead.city}</p>
                          </div>
                        )}
                        {viewingLead.state && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Estado</p>
                            <p className="font-semibold text-gray-900">{viewingLead.state}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dados Financeiros */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-500" />
                      Informações Financeiras
                    </h4>
                    {!isEditingLead ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Valor Estimado</p>
                          <p className="font-bold text-blue-600">{formatBRL(parseBRL(viewingLead.estimatedValue))}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Orçamento</p>
                          <p className="font-semibold text-gray-900">{viewingLead.budget || 'Não definido'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Prob. Conversão</p>
                          <p className="font-semibold text-gray-900">{viewingLead.conversionProbability || 50}%</p>
                        </div>
                      </div>
                    ) : (
                      <Form {...editForm}>
                        <div className="grid grid-cols-3 gap-3">
                          <FormField
                            control={editForm.control}
                            name="estimatedValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor Estimado</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="R$ 0,00" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="budget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Orçamento</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="R$ 0,00" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="conversionProbability"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prob. Conversão (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} min={0} max={100} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </Form>
                    )}
                  </div>

                  {/* CRM Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-500" />
                      Dados CRM
                    </h4>
                    {!isEditingLead ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Prioridade</p>
                          <p className="font-semibold text-gray-900 capitalize">{viewingLead.priority || 'Não informado'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Lead Score</p>
                          <p className="font-semibold text-gray-900">{viewingLead.leadScore || 0}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Fonte</p>
                          <p className="font-semibold text-gray-900 capitalize">{viewingLead.source || 'Não informado'}</p>
                        </div>
                        {viewingLead.tags && viewingLead.tags.length > 0 && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Tags</p>
                            <p className="font-semibold text-gray-900">{viewingLead.tags.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Form {...editForm}>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={editForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prioridade</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Baixa</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="urgent">Urgente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="leadScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lead Score</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} min={0} max={100} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </Form>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-500" />
                      Observações
                    </h4>
                    {!isEditingLead ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-gray-900">{viewingLead.notes || 'Nenhuma observação'}</p>
                      </div>
                    ) : (
                      <Form {...editForm}>
                        <FormField
                          control={editForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea {...field} rows={4} placeholder="Notas sobre o lead..." className="bg-amber-50 border-amber-200" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </Form>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={() => {
                      setLeadToDelete(viewingLead);
                      setIsDeleteDialogOpen(true);
                    }}
                    variant="destructive"
                    className="bg-red-500 hover:bg-red-600"
                    data-testid="button-delete-lead"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  <Button 
                    onClick={() => setIsViewDialogOpen(false)}
                    variant="outline"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Fechar
                  </Button>
                </div>
              </TabsContent>

              {/* Histórico Tab */}
              <TabsContent value="historico" className="space-y-4">
                {historyLoading ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full inline-block mb-4 animate-pulse">
                      <Clock className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Carregando histórico...</p>
                  </div>
                ) : !history || history.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
                      <Clock className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Nenhum histórico disponível</p>
                    <p className="text-sm text-gray-500 mt-2">As mudanças de status aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry: any, index: number) => {
                      const isValidation = entry.newStatus === 'receita_validada';
                      const isPrescription = entry.newStatus === 'receita_recebida';
                      
                      return (
                        <div 
                          key={entry.id} 
                          className={`p-4 rounded-lg border-l-4 ${
                            isValidation 
                              ? 'bg-green-50 border-green-500' 
                              : isPrescription
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-gray-50 border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {isValidation ? (
                                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    Receita Validada
                                  </span>
                                ) : isPrescription ? (
                                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                                    <FileText className="h-4 w-4" />
                                    Receita Recebida
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold text-gray-700 capitalize">
                                    {entry.previousStatus ? `${entry.previousStatus} → ` : ''}{entry.newStatus?.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                              {entry.notes && (
                                <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                              )}
                              {(isPrescription || isValidation) && viewingLead.prescriptionUrl && (
                                <Button
                                  onClick={() => window.open(viewingLead.prescriptionUrl, '_blank')}
                                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-xs h-8"
                                  size="sm"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Ver Receita
                                </Button>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(entry.createdAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Editar Lead
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              if (editingLead) {
                updateLeadMutation.mutate({ id: editingLead.id, data });
              }
            })} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="contato_inicial">Contato Inicial</SelectItem>
                        <SelectItem value="aguardando_receita">Aguardando Receita</SelectItem>
                        <SelectItem value="receita_recebida">Receita Recebida</SelectItem>
                        <SelectItem value="receita_validada">Receita Validada</SelectItem>
                        <SelectItem value="produtos_liberados">Produtos Liberados</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="estimatedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Valor Estimado</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="R$ 0,00" className="border-gray-200" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Adicione observações..." className="border-gray-200" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={updateLeadMutation.isPending}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateLeadMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button 
                  type="button"
                  onClick={() => setIsEditDialogOpen(false)}
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Lead Dialog */}
      <Dialog open={isNewLeadDialogOpen} onOpenChange={setIsNewLeadDialogOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Criar Novo Lead
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Preencha as informações do novo lead
            </DialogDescription>
          </DialogHeader>
          <Form {...newLeadForm}>
            <form onSubmit={newLeadForm.handleSubmit((data) => {
              createLeadMutation.mutate(data);
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newLeadForm.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nome do Paciente</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome completo" className="border-gray-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newLeadForm.control}
                  name="patientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(00) 00000-0000" className="border-gray-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={newLeadForm.control}
                name="patientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@exemplo.com" className="border-gray-200" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newLeadForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-200">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newLeadForm.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Fonte</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-200">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="intake">Intake</SelectItem>
                          <SelectItem value="indicacao">Indicação</SelectItem>
                          <SelectItem value="telefone">Telefone</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={newLeadForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Informações adicionais..." className="border-gray-200" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={createLeadMutation.isPending}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createLeadMutation.isPending ? "Criando..." : "Criar Lead"}
                </Button>
                <Button 
                  type="button"
                  onClick={() => setIsNewLeadDialogOpen(false)}
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Stages Configuration Modal */}
      <Dialog open={isStagesConfigOpen} onOpenChange={setIsStagesConfigOpen}>
        <DialogContent className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 max-w-6xl max-h-[90vh] overflow-hidden border-2 border-blue-100">
          <DialogHeader className="pb-4 border-b border-blue-100">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Settings className="h-7 w-7 text-white" />
              </div>
              Configurar Stages do Kanban
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base mt-2">
              Gerencie as colunas do seu pipeline de vendas - personalize nomes, cores e ordem
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4 py-4">
              {/* Stats Header */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600 uppercase">Total Stages</p>
                      <p className="text-2xl font-bold text-blue-900">{stages.length}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-cyan-600 uppercase">Stages Ativos</p>
                      <p className="text-2xl font-bold text-cyan-900">{stages.filter((s: any) => s.isActive).length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-cyan-500" />
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 uppercase">Leads Ativos</p>
                      <p className="text-2xl font-bold text-emerald-900">{leads.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-emerald-500" />
                  </CardContent>
                </Card>
              </div>

              {/* Stages List */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    Colunas do Pipeline
                  </h3>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                      {stages.length} configurados
                    </Badge>
                    <Button
                      onClick={() => {
                        setEditingStage(null);
                        setIsStageFormOpen(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-sm"
                      size="sm"
                      data-testid="button-new-stage"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Novo Stage
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {stages.map((stage: any, index: number) => {
                    const colorClasses: Record<string, string> = {
                      blue: 'bg-blue-100 border-blue-300 text-blue-800',
                      yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                      orange: 'bg-orange-100 border-orange-300 text-orange-800',
                      purple: 'bg-purple-100 border-purple-300 text-purple-800',
                      indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800',
                      green: 'bg-green-100 border-green-300 text-green-800',
                      emerald: 'bg-emerald-100 border-emerald-300 text-emerald-800',
                    };

                    const leadsUsingStage = leads.filter(l => l.status === stage.slug).length;
                    
                    return (
                      <div
                        key={stage.id}
                        className={`group flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md ${colorClasses[stage.color] || colorClasses.blue}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <h4 className="font-bold text-base">{stage.name}</h4>
                            <p className="text-sm opacity-80">{stage.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-white/50 text-gray-700 border border-gray-300">
                            {stage.slug}
                          </Badge>
                          <div className={`w-3 h-3 rounded-full ${stage.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          
                          {/* Action buttons - visible on hover */}
                          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => setEditingStage(stage)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-white/50"
                              data-testid={`button-edit-stage-${stage.id}`}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              onClick={() => {
                                setStageToDelete(stage);
                                setIsStageDeleteDialogOpen(true);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              data-testid={`button-delete-stage-${stage.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900 mb-1">Reordenar Stages</h4>
                        <p className="text-sm text-blue-700">
                          Use drag & drop para reorganizar a ordem das colunas no kanban
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-900 mb-1">Personalizar Cores</h4>
                        <p className="text-sm text-purple-700">
                          Cada stage possui cor única para facilitar visualização
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-blue-100">
            <Button
              onClick={() => setIsStagesConfigOpen(false)}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita e todos os dados relacionados serão permanentemente removidos.
              {leadToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-900">{leadToDelete.patientName}</p>
                  <p className="text-sm text-gray-600">{leadToDelete.patientEmail}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 hover:bg-gray-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (leadToDelete) {
                  deleteLeadMutation.mutate(leadToDelete.id);
                  setIsDeleteDialogOpen(false);
                  setLeadToDelete(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
              data-testid="button-confirm-delete"
            >
              Excluir Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stage Form Dialog */}
      <Dialog open={isStageFormOpen} onOpenChange={(open) => {
        setIsStageFormOpen(open);
        if (!open) {
          setEditingStage(null);
          stageForm.reset();
        }
      }}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {editingStage ? (
                <>
                  <Edit className="h-5 w-5 text-blue-500" />
                  Editar Stage
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-blue-500" />
                  Criar Novo Stage
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingStage 
                ? "Modifique as informações do stage. O slug será atualizado automaticamente." 
                : "Preencha as informações do novo stage. O slug será gerado automaticamente a partir do nome."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...stageForm}>
            <form onSubmit={stageForm.handleSubmit((data) => {
              if (editingStage) {
                updateStageMutation.mutate({ id: editingStage.id, data });
              } else {
                createStageMutation.mutate(data);
              }
            })} className="space-y-4">
              <FormField
                control={stageForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Nome do Stage *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Contato Inicial" className="border-gray-200" />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Slug gerado: {generateSlug(field.value || "")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stageForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Descreva este stage..." className="border-gray-200" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stageForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Cor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200">
                          <SelectValue placeholder="Selecione uma cor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="blue">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-500" />
                            <span>Azul</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="indigo">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-indigo-500" />
                            <span>Índigo</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="purple">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-purple-500" />
                            <span>Roxo</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pink">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-pink-500" />
                            <span>Rosa</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="orange">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-orange-500" />
                            <span>Laranja</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="yellow">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-yellow-500" />
                            <span>Amarelo</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="green">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500" />
                            <span>Verde</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="emerald">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-emerald-500" />
                            <span>Esmeralda</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cyan">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-cyan-500" />
                            <span>Ciano</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stageForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-gray-700 font-medium">Stage Ativo</FormLabel>
                      <p className="text-sm text-gray-500">
                        Stages inativos ficam ocultos no kanban
                      </p>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={createStageMutation.isPending || updateStageMutation.isPending}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  data-testid="button-save-stage"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {(createStageMutation.isPending || updateStageMutation.isPending) ? "Salvando..." : (editingStage ? "Salvar Alterações" : "Criar Stage")}
                </Button>
                <Button 
                  type="button"
                  onClick={() => {
                    setIsStageFormOpen(false);
                    setEditingStage(null);
                    stageForm.reset();
                  }}
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Stage Delete Confirmation Dialog */}
      <AlertDialog open={isStageDeleteDialogOpen} onOpenChange={setIsStageDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão de Stage
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {stageToDelete && (
                <>
                  <p className="mb-3">
                    Tem certeza que deseja excluir o stage <span className="font-semibold text-gray-900">"{stageToDelete.name}"</span>?
                  </p>
                  {leads.filter(l => l.status === stageToDelete.slug).length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="font-semibold text-red-900 mb-1">⚠️ Atenção!</p>
                      <p className="text-sm text-red-700">
                        Existem {leads.filter(l => l.status === stageToDelete.slug).length} lead(s) usando este stage. 
                        A exclusão pode causar problemas. Considere desativar o stage ao invés de excluir.
                      </p>
                    </div>
                  )}
                  {leads.filter(l => l.status === stageToDelete.slug).length === 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">
                        Nenhum lead está usando este stage. É seguro excluir.
                      </p>
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 hover:bg-gray-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (stageToDelete) {
                  deleteStageMutation.mutate(stageToDelete.id);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
              data-testid="button-confirm-delete-stage"
            >
              {leads.filter(l => l.status === stageToDelete?.slug).length > 0 ? "Excluir Mesmo Assim" : "Excluir Stage"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
