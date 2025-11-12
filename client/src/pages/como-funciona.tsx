import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, Heart, Shield, Stethoscope, Users, Moon, 
  Activity, Zap, Smile, CheckCircle, ArrowRight, 
  Calendar, Clock, User, FileText, Star, Bone, Apple, Plus
} from "lucide-react";

export default function ComoFunciona() {
  const [activeSection, setActiveSection] = useState("saude");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-16 sm:pt-20">
        {/* Navigation Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="mb-16">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-2 bg-white shadow-xl rounded-2xl border border-green-100">
            <TabsTrigger value="saude" className="flex flex-col p-5 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-50 data-[state=active]:to-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-lg transition-all hover:bg-green-25">
              <div className="p-2 rounded-lg bg-emerald-100 data-[state=active]:bg-emerald-200 mb-3">
                <Heart className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm font-semibold">Saúde</span>
            </TabsTrigger>
            <TabsTrigger value="condicoes" className="flex flex-col p-5 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-50 data-[state=active]:text-green-700 data-[state=active]:shadow-lg transition-all hover:bg-green-25">
              <div className="p-2 rounded-lg bg-green-100 data-[state=active]:bg-green-200 mb-3">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold">Condições</span>
            </TabsTrigger>
            <TabsTrigger value="jornada" className="flex flex-col p-5 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-50 data-[state=active]:to-green-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-lg transition-all hover:bg-green-25">
              <div className="p-2 rounded-lg bg-teal-100 data-[state=active]:bg-teal-200 mb-3">
                <User className="h-6 w-6 text-teal-600" />
              </div>
              <span className="text-sm font-semibold">Jornada</span>
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex flex-col p-5 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-teal-50 data-[state=active]:text-green-700 data-[state=active]:shadow-lg transition-all hover:bg-green-25">
              <div className="p-2 rounded-lg bg-green-100 data-[state=active]:bg-green-200 mb-3">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold">Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* Saúde & Bem-Estar Section */}
          <TabsContent value="saude" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Cannabis Medicinal para sua Saúde</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Descubra como o CBD pode transformar sua qualidade de vida
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-900">Como o CBD pode ajudar?</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Alívio da Dor</h4>
                      <p className="text-gray-700">
                        Redução significativa de dores crônicas e inflamações
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Saúde Mental</h4>
                      <p className="text-gray-700">
                        Melhora da ansiedade, depressão e equilíbrio emocional
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Moon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Qualidade do Sono</h4>
                      <p className="text-gray-700">
                        Sono mais profundo e reparador
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Qualidade de Vida</h4>
                      <p className="text-gray-700">
                        Mais disposição e bem-estar no dia a dia
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl hover:shadow-2xl transition-all group cursor-pointer hover:scale-105">
                <CardHeader>
                  <CardTitle className="text-2xl text-green-800 text-center group-hover:text-green-900 transition-colors">
                    Resultados Comprovados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform">85%</div>
                    <p className="text-gray-700 font-medium">Relatam melhora na dor</p>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600 mb-2 group-hover:scale-110 transition-transform">79%</div>
                    <p className="text-gray-700 font-medium">Reduziram outros medicamentos</p>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-purple-600 mb-2 group-hover:scale-110 transition-transform">92%</div>
                    <p className="text-gray-700 font-medium">Melhoraram o sono</p>
                  </div>
                  <div className="text-center pt-4">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      Baseado em estudos científicos
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA dentro da aba Saúde */}
            <div className="text-center">
              <Card className="bg-white p-8 shadow-lg border border-green-100 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Pronto para começar sua jornada?
                </h3>
                <Link href="/login">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all w-full">
                    <Stethoscope className="w-6 h-6 mr-3" />
                    Agendar Consulta
                  </Button>
                </Link>
              </Card>
            </div>
          </TabsContent>

          {/* Condições Tratadas */}
          <TabsContent value="condicoes" className="space-y-12">
            {/* Header Clean */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Condições Tratadas</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                O CBD é utilizado no tratamento de diversas condições de saúde
              </p>
            </div>

            {/* Grid de Condições */}
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[
                // Featured conditions
                { name: "Ansiedade", icon: Heart, iconColor: "text-blue-600", bgColor: "bg-blue-100", featured: true },
                { name: "Dor Crônica", icon: Activity, iconColor: "text-purple-600", bgColor: "bg-purple-100", featured: true },
                { name: "Insônia", icon: Moon, iconColor: "text-indigo-600", bgColor: "bg-indigo-100", featured: true },
                // CFM Epilepsies
                { name: "Síndrome de Dravet", icon: Zap, iconColor: "text-green-600", bgColor: "bg-green-100", cfm: true },
                { name: "Síndrome de Lennox-Gastaut", icon: Plus, iconColor: "text-green-600", bgColor: "bg-green-100", cfm: true },
                { name: "Esclerose Tuberosa", icon: Activity, iconColor: "text-green-600", bgColor: "bg-green-100", cfm: true },
                // Other conditions
                { name: "Fibromialgia", icon: Activity, iconColor: "text-pink-600", bgColor: "bg-pink-100" },
                { name: "Autismo", icon: Users, iconColor: "text-teal-600", bgColor: "bg-teal-100" },
                { name: "Parkinson", icon: Brain, iconColor: "text-orange-600", bgColor: "bg-orange-100" },
                { name: "Artrite", icon: Bone, iconColor: "text-red-600", bgColor: "bg-red-100" },
                { name: "Esclerose Múltipla", icon: Brain, iconColor: "text-violet-600", bgColor: "bg-violet-100" },
                { name: "Transtornos Alimentares", icon: Heart, iconColor: "text-emerald-600", bgColor: "bg-emerald-100" }
              ].map((condition, index) => (
                <Card 
                  key={index} 
                  className="group relative transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer border border-gray-200 bg-white hover:border-gray-300"
                >
                  <CardContent className="p-6 text-center">
                    {/* Icon com contraste correto */}
                    <div className={`w-12 h-12 ${condition.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                      <condition.icon className={`h-6 w-6 ${condition.iconColor}`} />
                    </div>
                    
                    {/* Title */}
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-3">
                      {condition.name}
                    </h4>
                    
                    {/* Tags abaixo do nome - todas as condições têm tag */}
                    {condition.featured && (
                      <span className="inline-block bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">
                        ⭐ Mais Comum
                      </span>
                    )}
                    
                    {condition.cfm && (
                      <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                        ✓ Aprovado CFM
                      </span>
                    )}
                    
                    {!condition.featured && !condition.cfm && (
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                        Prescrição Médica
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Nota Médica Clean */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg max-w-4xl mx-auto">
              <div className="flex items-start space-x-3">
                <Stethoscope className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> O uso de CBD requer prescrição médica. Consulte sempre um profissional de saúde qualificado.
                </p>
              </div>
            </div>

            {/* CTA Clean */}
            <div className="text-center">
              <Link href="/login">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Agendar Consulta
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Sua Jornada */}
          <TabsContent value="jornada" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Sua Jornada Conosco</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Do primeiro contato até receber seu tratamento em casa
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: 1, title: "Consulta Médica", desc: "Avaliação online com médico especializado", icon: Stethoscope, time: "30 min" },
                { step: 2, title: "Prescrição", desc: "Receba sua prescrição médica", icon: FileText, time: "Imediato" },
                { step: 3, title: "Autorização", desc: "Processo ANVISA facilitado", icon: Shield, time: "Na hora" },
                { step: 4, title: "Tratamento", desc: "Produto entregue em casa", icon: Heart, time: "7-15 dias" }
              ].map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-sm">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 mb-3">{item.desc}</p>
                  <Badge className="bg-green-100 text-green-700">
                    ⏱️ {item.time}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="seguranca" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Segurança e Legalidade</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Todo o processo é 100% legal e regulamentado
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-6 w-6 text-green-600 mr-2" />
                  Aprovado pela ANVISA
                </h3>
                <p className="text-gray-700">
                  Todos os produtos são aprovados e regulamentados pela ANVISA
                </p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Stethoscope className="h-6 w-6 text-blue-600 mr-2" />
                  Prescrição Médica
                </h3>
                <p className="text-gray-700">
                  Tratamento supervisionado por médicos parceiros certificados
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Final */}
        <Card className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Comece Sua Jornada Hoje
            </h2>
            <p className="text-xl mb-8 opacity-95 max-w-3xl mx-auto">
              Junte-se a milhares de brasileiros que já estão transformando suas vidas com Cannabis Medicinal
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/consulta">
                <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Agendar Consulta
                </Button>
              </Link>
              <Link href="/produtos">
                <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100">
                  <Heart className="h-5 w-5 mr-2" />
                  Ver Produtos
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