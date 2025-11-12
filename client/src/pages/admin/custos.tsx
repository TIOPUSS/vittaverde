import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  DollarSign, Plus, TrendingDown, Calendar, 
  Tag, CreditCard, Trash2, Edit, ArrowLeft, Receipt,
  Wallet
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CustosPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['/api/expenses'],
  });

  const { data: summary } = useQuery({
    queryKey: ['/api/expenses/summary'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/expenses', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/summary'] });
      toast({ title: "✅ Custo registrado com sucesso!" });
      setShowForm(false);
      setFormData({});
    },
    onError: (error: any) => {
      console.error("Erro ao registrar custo:", error);
      const errorMessage = error?.message || "Erro ao registrar custo";
      toast({ 
        title: "❌ Erro ao registrar custo", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await apiRequest(`/api/expenses/${id}`, 'PATCH', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/summary'] });
      toast({ title: "✅ Custo atualizado com sucesso!" });
      setEditingExpense(null);
      setFormData({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/expenses/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/summary'] });
      toast({ title: "✅ Custo excluído com sucesso!" });
    }
  });

  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data with correct types for Drizzle schema
    const dataToSubmit = {
      description: formData.description,
      category: formData.category,
      amount: String(formData.amount), // Decimal expects string
      expenseDate: formData.expenseDate ? new Date(formData.expenseDate) : new Date(),
      paymentMethod: formData.paymentMethod || null,
      vendor: formData.vendor || null,
      notes: formData.notes || null,
      status: 'paid' // Default status
    };
    
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate?.split('T')[0],
      paymentMethod: expense.paymentMethod,
      vendor: expense.vendor,
      notes: expense.notes,
      status: expense.status
    });
    setShowForm(true);
  };

  const categories = [
    { value: 'operacional', label: 'Operacional', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'marketing', label: 'Marketing', color: 'bg-green-100 text-green-700' },
    { value: 'pessoal', label: 'Pessoal', color: 'bg-teal-100 text-teal-700' },
    { value: 'tecnologia', label: 'Tecnologia', color: 'bg-cyan-100 text-cyan-700' },
    { value: 'impostos', label: 'Impostos', color: 'bg-orange-100 text-orange-700' },
    { value: 'outros', label: 'Outros', color: 'bg-gray-100 text-gray-700' }
  ];

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-700';
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-2xl">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-3xl border border-white/30 shadow-xl">
                <Wallet className="h-12 w-12 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">💰 Gestão de Custos</h1>
                <p className="text-emerald-100 text-lg">Controle total sobre despesas e custos operacionais</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 font-semibold px-6 py-6">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button 
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingExpense(null);
                  setFormData({});
                }}
                className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-6 py-6 shadow-xl"
                data-testid="button-add-expense"
              >
                <Plus className="h-5 w-5 mr-2" />
                {showForm ? 'Cancelar' : 'Novo Custo'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-3xl transition-all hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total de Custos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    R$ {totalExpenses.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-3xl transition-all hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-600"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total de Registros</p>
                  <p className="text-3xl font-bold text-gray-900">{expenses?.length || 0}</p>
                </div>
                <div className="p-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden hover:shadow-3xl transition-all hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-600"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Categorias</p>
                  <p className="text-3xl font-bold text-gray-900">{summary?.length || 0}</p>
                </div>
                <div className="p-4 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600">
                  <Tag className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="border-0 shadow-2xl mb-10 overflow-hidden bg-white/95 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
              <CardTitle className="text-2xl text-gray-900">
                {editingExpense ? '✏️ Editar Custo' : '➕ Novo Custo'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Aluguel do escritório"
                      required
                      data-testid="input-description"
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Select 
                      value={formData.category || ''}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger data-testid="select-category" className="border-emerald-200 focus:border-emerald-500">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Valor (R$) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                      data-testid="input-amount"
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expenseDate">Data *</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={formData.expenseDate || ''}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      required
                      data-testid="input-date"
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                    <Select 
                      value={formData.paymentMethod || ''}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger data-testid="select-payment" className="border-emerald-200 focus:border-emerald-500">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vendor">Fornecedor/Prestador</Label>
                    <Input
                      id="vendor"
                      value={formData.vendor || ''}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="Nome do fornecedor"
                      data-testid="input-vendor"
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informações adicionais..."
                      rows={3}
                      data-testid="textarea-notes"
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:opacity-90 font-semibold px-8"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : (editingExpense ? 'Atualizar' : 'Registrar Custo')}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Expenses List */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-2xl text-gray-900">📋 Custos Registrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Carregando custos...</div>
            ) : !expenses || expenses.length === 0 ? (
              <div className="p-12 text-center">
                <TrendingDown className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum custo registrado</h3>
                <p className="text-gray-500">Adicione custos para começar o controle financeiro</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Data</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Descrição</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Categoria</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Valor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Fornecedor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-emerald-50">
                    {expenses.map((expense: any) => (
                      <tr key={expense.id} className="hover:bg-emerald-50 transition-colors" data-testid={`row-expense-${expense.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                            {format(new Date(expense.expenseDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{expense.description}</div>
                          {expense.notes && <div className="text-sm text-gray-500 mt-1">{expense.notes}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getCategoryColor(expense.category)}>
                            {getCategoryLabel(expense.category)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-orange-600">R$ {parseFloat(expense.amount).toFixed(2)}</div>
                          {expense.paymentMethod && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {expense.paymentMethod}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{expense.vendor || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(expense)}
                              className="hover:bg-emerald-50 hover:text-emerald-600"
                              data-testid={`button-edit-${expense.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir este custo?')) {
                                  deleteMutation.mutate(expense.id);
                                }
                              }}
                              className="hover:bg-red-50 hover:text-red-600"
                              data-testid={`button-delete-${expense.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
