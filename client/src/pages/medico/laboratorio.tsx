import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { FlaskConical, ArrowLeft, Upload, FileText, CheckCircle2, XCircle } from "lucide-react";

export default function LaboratorioPage() {
  const [paciente, setPaciente] = useState("");
  
  // Dados de exemplo de exames
  const examesRecentes = [
    {
      id: 1,
      paciente: "Maria Silva",
      tipo: "Hemograma Completo",
      data: "05/10/2025",
      status: "Concluído",
      resultado: "Normal"
    },
    {
      id: 2,
      paciente: "João Santos",
      tipo: "Teste de Potência CBD",
      data: "04/10/2025",
      status: "Concluído",
      resultado: "CBD: 15.2% | THC: <0.3%"
    },
    {
      id: 3,
      paciente: "Ana Costa",
      tipo: "Perfil Lipídico",
      data: "03/10/2025",
      status: "Em Análise",
      resultado: "Pendente"
    },
    {
      id: 4,
      paciente: "Carlos Oliveira",
      tipo: "Análise de Terpenos",
      data: "02/10/2025",
      status: "Concluído",
      resultado: "Limoneno: 2.1% | Mirceno: 1.8%"
    }
  ];

  const examesFiltrados = paciente 
    ? examesRecentes.filter(e => e.paciente.toLowerCase().includes(paciente.toLowerCase()))
    : examesRecentes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/medico/centro-medico">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Centro Médico
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Análise Laboratorial
            </span>
          </h1>
          <p className="text-lg text-gray-600">
            Gestão de exames e resultados laboratoriais
          </p>
          
          {/* Coming Soon Banner */}
          <div className="mt-6 p-6 bg-gradient-to-r from-teal-100 to-cyan-100 border-2 border-teal-300 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl">
                <FlaskConical className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-teal-900">🚀 Em Breve!</h3>
                <p className="text-teal-700">Módulo de análise laboratorial em desenvolvimento. Em breve você terá acesso a gestão completa de exames e resultados.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-600"></div>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="busca">Buscar Paciente</Label>
                  <Input
                    id="busca"
                    placeholder="Digite o nome do paciente..."
                    value={paciente}
                    onChange={(e) => setPaciente(e.target.value)}
                    className="mt-2"
                    data-testid="input-busca-paciente"
                  />
                </div>
                <div className="flex items-end gap-3">
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white" data-testid="button-novo-exame">
                    <Upload className="h-4 w-4 mr-2" />
                    Novo Exame
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600">
                  <FlaskConical className="h-6 w-6 text-white" />
                </div>
                Exames Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {examesFiltrados.map((exame) => (
                  <div
                    key={exame.id}
                    className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg shadow border border-gray-100 hover:shadow-md transition-shadow"
                    data-testid={`exame-${exame.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">{exame.paciente}</h3>
                        <p className="text-sm text-gray-600">{exame.tipo}</p>
                      </div>
                      <Badge
                        className={
                          exame.status === "Concluído"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }
                      >
                        {exame.status === "Concluído" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {exame.status}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data do Exame</p>
                        <p className="text-sm font-semibold text-gray-700">{exame.data}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Resultado</p>
                        <p className="text-sm font-semibold text-gray-700">{exame.resultado}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-teal-200 text-teal-600 hover:bg-teal-50"
                        data-testid={`button-visualizar-${exame.id}`}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Visualizar Laudo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                        data-testid={`button-download-${exame.id}`}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                ))}

                {examesFiltrados.length === 0 && (
                  <div className="text-center py-12">
                    <FlaskConical className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum exame encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
