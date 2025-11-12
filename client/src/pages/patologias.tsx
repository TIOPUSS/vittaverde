import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, Brain, Moon, Activity, Zap, Wind, Sparkles,
  ArrowRight, Flame, Pill, Droplets, HeartPulse, Calendar, Video, Leaf, User, Weight
} from "lucide-react";

export default function PatologiasPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPatologias, setSelectedPatologias] = useState<string[]>([]);
  const [selectedSintomas, setSelectedSintomas] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");

  const patologias = [
    { id: "dor_cronica", label: "Dor Crônica", icon: Activity },
    { id: "ansiedade", label: "Ansiedade", icon: Wind },
    { id: "depressao", label: "Depressão", icon: Brain },
    { id: "insonia", label: "Insônia", icon: Moon },
    { id: "epilepsia", label: "Epilepsia", icon: Zap },
    { id: "fibromialgia", label: "Fibromialgia", icon: HeartPulse },
    { id: "artrite", label: "Artrite/Artrose", icon: Activity },
    { id: "enxaqueca", label: "Enxaqueca", icon: Brain },
    { id: "parkinson", label: "Parkinson", icon: Zap },
    { id: "alzheimer", label: "Alzheimer", icon: Brain },
    { id: "esclerose", label: "Esclerose Múltipla", icon: Activity },
    { id: "autismo", label: "Autismo", icon: Heart },
    { id: "cancer", label: "Câncer (dores)", icon: HeartPulse },
    { id: "estresse", label: "Estresse", icon: Wind },
    { id: "outras", label: "Outras", icon: Sparkles }
  ];

  const sintomas = [
    { id: "dificuldade_dormir", label: "Dificuldade para dormir", icon: Moon },
    { id: "dores_corpo", label: "Dores no corpo", icon: HeartPulse },
    { id: "nervosismo", label: "Nervosismo constante", icon: Wind },
    { id: "falta_apetite", label: "Falta de apetite", icon: Droplets },
    { id: "cansaco", label: "Cansaço excessivo", icon: Activity },
    { id: "concentracao", label: "Dificuldade de concentração", icon: Brain },
    { id: "tremores", label: "Tremores", icon: Zap },
    { id: "nauseas", label: "Náuseas", icon: Pill },
    { id: "queimacao", label: "Queimação/Formigamento", icon: Flame }
  ];

  const handleContinuar = async () => {
    // Validação de idade mínima 18 anos
    if (idade && parseInt(idade) < 18) {
      toast({
        title: "Idade mínima não atingida",
        description: "Você deve ter no mínimo 18 anos para continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/patient/intake/patologias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patologias: selectedPatologias,
          sintomas: selectedSintomas,
          observacoes: observacoes,
          idade: idade,
          peso: peso
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar informações');

      localStorage.setItem("vittaverde_patologias", JSON.stringify({
        patologias: selectedPatologias,
        sintomas: selectedSintomas,
        observacoes: observacoes,
        idade: idade,
        peso: peso
      }));

      toast({ title: "✓ Informações salvas!", description: "Continuando sua jornada..." });
      setLocation("/bem-estar");
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as informações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Hero Card Verde */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-12 mb-12 overflow-hidden">
          {/* Decorações de fundo */}
          <div className="absolute top-8 left-8 opacity-20">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div className="absolute bottom-8 right-8 opacity-20">
            <Heart className="w-16 h-16 text-white" />
          </div>
          
          {/* Conteúdo Central */}
          <div className="relative text-center">
            {/* Ícone de Coração */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-8">
              <Heart className="w-10 h-10 text-white" fill="white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Sua Jornada de Bem-Estar Começa Aqui
            </h1>
            <p className="text-xl text-white/90 mb-10">
              Cuidando da sua saúde com leveza e dedicação
            </p>
            
            {/* Badges - Desktop Only */}
            <div className="hidden lg:flex flex-wrap justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <Calendar className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">Primeira Consulta</span>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <Video className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">Via Telemedicina</span>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <Leaf className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">100% Natural</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário - Condições */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Condições de saúde
            </h2>
            <p className="text-gray-600">
              Selecione todas as condições médicas que você possui (opcional)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {patologias.map((patologia) => {
              const Icon = patologia.icon;
              const isSelected = selectedPatologias.includes(patologia.id);
              
              return (
                <button
                  key={patologia.id}
                  onClick={() => setSelectedPatologias(prev => 
                    prev.includes(patologia.id) ? prev.filter(p => p !== patologia.id) : [...prev, patologia.id]
                  )}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                    ${isSelected 
                      ? 'bg-emerald-50 border-emerald-500 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                  data-testid={`button-patologia-${patologia.id}`}
                >
                  <div className={`
                    flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center
                    ${isSelected ? 'bg-emerald-500' : 'bg-gray-100'}
                  `}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span className={`text-base font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                    {patologia.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulário - Sintomas */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sintomas
            </h2>
            <p className="text-gray-600">
              Quais sintomas você está sentindo? (opcional)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sintomas.map((sintoma) => {
              const Icon = sintoma.icon;
              const isSelected = selectedSintomas.includes(sintoma.id);
              
              return (
                <button
                  key={sintoma.id}
                  onClick={() => setSelectedSintomas(prev => 
                    prev.includes(sintoma.id) ? prev.filter(s => s !== sintoma.id) : [...prev, sintoma.id]
                  )}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                    ${isSelected 
                      ? 'bg-emerald-50 border-emerald-500 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                  data-testid={`button-sintoma-${sintoma.id}`}
                >
                  <div className={`
                    flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center
                    ${isSelected ? 'bg-emerald-500' : 'bg-gray-100'}
                  `}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span className={`text-base font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                    {sintoma.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Idade e Peso */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Informações pessoais
            </h2>
            <p className="text-gray-600">
              Dados importantes para personalização do tratamento (opcional)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-5 focus-within:border-emerald-500 transition-colors">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <User className="w-5 h-5 text-gray-400" />
                Idade
              </label>
              <Input
                type="number"
                placeholder="Ex: 35"
                value={idade}
                onChange={(e) => setIdade(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 p-0 text-lg"
                data-testid="input-idade"
              />
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-5 focus-within:border-emerald-500 transition-colors">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Weight className="w-5 h-5 text-gray-400" />
                Peso (kg)
              </label>
              <Input
                type="number"
                placeholder="Ex: 70"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 p-0 text-lg"
                data-testid="input-peso"
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Informações adicionais
            </h2>
            <p className="text-gray-600">
              Compartilhe medicamentos, histórico médico ou observações (opcional)
            </p>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-5 focus-within:border-emerald-500 transition-colors">
            <Textarea
              placeholder="Ex: Uso Fluoxetina 20mg, tenho dores lombares há 3 anos..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-[140px] border-0 bg-transparent resize-none focus-visible:ring-0 p-0"
              data-testid="textarea-observacoes"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-6">
          <div className="text-sm text-gray-500">
            {selectedPatologias.length + selectedSintomas.length > 0 && (
              <span>
                {selectedPatologias.length + selectedSintomas.length} {selectedPatologias.length + selectedSintomas.length === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            )}
          </div>
          <Button
            onClick={handleContinuar}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            data-testid="button-continuar"
          >
            Continuar
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
