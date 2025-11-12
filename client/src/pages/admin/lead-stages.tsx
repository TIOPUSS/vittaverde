import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, GripVertical, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LeadStage {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  position: number;
  isActive: boolean;
}

interface StageFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

function SortableStageCard({ stage, onEdit, onDelete }: { 
  stage: LeadStage; 
  onEdit: (stage: LeadStage) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800',
    green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-lg border-2 ${colorClasses[stage.color] || colorClasses.blue} transition-all hover:shadow-md`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        data-testid={`drag-stage-${stage.id}`}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">({stage.slug})</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stage.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(stage)}
          data-testid={`edit-stage-${stage.id}`}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(stage.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
          data-testid={`delete-stage-${stage.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function LeadStagesManagement() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<LeadStage | null>(null);
  const [formData, setFormData] = useState<StageFormData>({
    name: '',
    slug: '',
    description: '',
    color: 'blue',
    icon: 'Circle',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: stages = [], isLoading } = useQuery<LeadStage[]>({
    queryKey: ['/api/lead-stages'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: StageFormData) => {
      const response = await apiRequest('/api/lead-stages', 'POST', {
        ...data,
        position: stages.length,
        isActive: true,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-stages'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: 'Stage criado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar stage', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StageFormData & { position?: number }> }) => {
      const response = await apiRequest(`/api/lead-stages/${id}`, 'PATCH', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-stages'] });
      setEditingStage(null);
      resetForm();
      toast({ title: 'Stage atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar stage', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/lead-stages/${id}`, 'DELETE');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lead-stages'] });
      toast({ title: 'Stage arquivado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao arquivar stage', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: 'blue',
      icon: 'Circle',
    });
  };

  const handleEdit = (stage: LeadStage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      slug: stage.slug,
      description: stage.description,
      color: stage.color,
      icon: stage.icon,
    });
  };

  const handleSave = () => {
    if (editingStage) {
      updateMutation.mutate({ id: editingStage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      const newStages = arrayMove(stages, oldIndex, newIndex);

      // Update positions in database
      for (let i = 0; i < newStages.length; i++) {
        if (newStages[i].position !== i) {
          await updateMutation.mutateAsync({ 
            id: newStages[i].id, 
            data: { position: i } 
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/lead-stages'] });
    }
  };

  const colorOptions = [
    { value: 'blue', label: 'Azul' },
    { value: 'yellow', label: 'Amarelo' },
    { value: 'orange', label: 'Laranja' },
    { value: 'purple', label: 'Roxo' },
    { value: 'indigo', label: 'Índigo' },
    { value: 'green', label: 'Verde' },
    { value: 'emerald', label: 'Esmeralda' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-950 dark:to-cyan-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Gerenciar Stages do Kanban
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure as colunas do kanban de leads - arraste para reordenar
          </p>
        </div>

        {/* Create Button */}
        <Card className="mb-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Stages Ativos</span>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" data-testid="button-create-stage">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Stage
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Stage</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Novo Lead"
                        data-testid="input-stage-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Slug (identificador único)</label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        placeholder="Ex: novo_lead"
                        data-testid="input-stage-slug"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Breve descrição do stage"
                        data-testid="input-stage-description"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cor</label>
                      <select
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                        data-testid="select-stage-color"
                      >
                        {colorOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }} data-testid="button-cancel">
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={!formData.name || !formData.slug} data-testid="button-save-stage">
                      <Save className="w-4 h-4 mr-2" />
                      Criar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>
              {stages.length} stage(s) configurado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando stages...</div>
            ) : stages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum stage configurado</div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {stages.map((stage) => (
                      <SortableStageCard
                        key={stage.id}
                        stage={stage}
                        onEdit={handleEdit}
                        onDelete={(id) => {
                          if (confirm('Tem certeza que deseja arquivar este stage?')) {
                            deleteMutation.mutate(id);
                          }
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingStage} onOpenChange={(open) => !open && setEditingStage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Stage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-edit-stage-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  data-testid="input-edit-stage-slug"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  data-testid="input-edit-stage-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cor</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  data-testid="select-edit-stage-color"
                >
                  {colorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingStage(null); resetForm(); }} data-testid="button-cancel-edit">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} data-testid="button-save-edit">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
