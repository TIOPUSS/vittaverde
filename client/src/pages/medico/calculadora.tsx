import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Calculator, ArrowLeft, Info } from "lucide-react";

export default function CalculadoraDosagemPage() {
  const [peso, setPeso] = useState("");
  const [condicao, setCondicao] = useState("");
  const [tipoProduto, setTipoProduto] = useState("");
  const [resultado, setResultado] = useState<any>(null);

  const calcularDosagem = () => {
    if (!peso || !condicao || !tipoProduto) return;

    const pesoNum = parseFloat(peso);
    let dosagemCBD = 0;
    let dosagemTHC = 0;

    // Lógica básica de cálculo (exemplo)
    switch (condicao) {
      case "ansiedade":
        dosagemCBD = pesoNum * 0.5; // 0.5mg/kg
        dosagemTHC = 0;
        break;
      case "dor":
        dosagemCBD = pesoNum * 0.8;
        dosagemTHC = pesoNum * 0.1;
        break;
      case "insonia":
        dosagemCBD = pesoNum * 0.6;
        dosagemTHC = pesoNum * 0.2;
        break;
      case "epilepsia":
        dosagemCBD = pesoNum * 2.5;
        dosagemTHC = 0;
        break;
      default:
        dosagemCBD = pesoNum * 0.3;
    }

    setResultado({
      cbd: Math.round(dosagemCBD * 10) / 10,
      thc: Math.round(dosagemTHC * 10) / 10,
      frequencia: "2x ao dia",
      observacao: "Iniciar com dose baixa e ajustar conforme necessário"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/medico/centro-medico">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Centro Médico
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Calculadora de Dosagem
            </span>
          </h1>
          <p className="text-lg text-gray-600">
            Ferramenta para cálculo personalizado de dosagem CBD/THC
          </p>
          
          {/* Coming Soon Banner */}
          <div className="mt-6 p-6 bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-emerald-300 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl">
                <Calculator className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-900">🚀 Em Breve!</h3>
                <p className="text-emerald-700">Esta ferramenta está em desenvolvimento e estará disponível em breve com cálculos personalizados baseados em evidências científicas.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="border-0 shadow-xl">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-600"></div>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                Dados do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="peso">Peso do Paciente (kg)</Label>
                  <Input
                    id="peso"
                    type="number"
                    placeholder="Ex: 70"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    className="mt-2"
                    data-testid="input-peso"
                  />
                </div>

                <div>
                  <Label htmlFor="condicao">Condição a Tratar</Label>
                  <Select value={condicao} onValueChange={setCondicao}>
                    <SelectTrigger className="mt-2" data-testid="select-condicao">
                      <SelectValue placeholder="Selecione a condição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ansiedade">Ansiedade</SelectItem>
                      <SelectItem value="dor">Dor Crônica</SelectItem>
                      <SelectItem value="insonia">Insônia</SelectItem>
                      <SelectItem value="epilepsia">Epilepsia</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de Produto</Label>
                  <Select value={tipoProduto} onValueChange={setTipoProduto}>
                    <SelectTrigger className="mt-2" data-testid="select-tipo">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oleo">Óleo</SelectItem>
                      <SelectItem value="capsula">Cápsula</SelectItem>
                      <SelectItem value="goma">Goma</SelectItem>
                      <SelectItem value="topico">Tópico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={calcularDosagem}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-6"
                disabled={!peso || !condicao || !tipoProduto}
                data-testid="button-calcular"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calcular Dosagem
              </Button>
            </CardContent>
          </Card>

          {resultado && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Info className="h-6 w-6 text-green-600" />
                  Resultado da Dosagem
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-600 mb-1">CBD</p>
                    <p className="text-3xl font-bold text-green-600" data-testid="text-resultado-cbd">
                      {resultado.cbd} mg
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-600 mb-1">THC</p>
                    <p className="text-3xl font-bold text-teal-600" data-testid="text-resultado-thc">
                      {resultado.thc} mg
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-600 mb-1">Frequência</p>
                  <p className="text-lg font-semibold">{resultado.frequencia}</p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 mb-1">⚠️ Observações Importantes</p>
                  <p className="text-sm text-yellow-700">{resultado.observacao}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
