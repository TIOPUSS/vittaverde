import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  Video, 
  Stethoscope, 
  FileText, 
  Download,
  MessageCircle,
  CheckCircle2,
  Phone,
  Calendar,
  UserCheck,
  FileCheck,
  Package,
  Sparkles,
  ArrowRight,
  Star
} from "lucide-react";

interface PartnerIntegration {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  ssoUrl: string;
  isActive: boolean;
  specialties: string[] | null;
}

export default function BemEstarPage() {
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: telemedicineConfig } = useQuery<{
    redirectUrl: string | null;
    redirectLinks: Array<{name: string; url: string}> | null;
    isActive: boolean;
    integrationType: string;
  }>({
    queryKey: ['/api/telemedicine/public-config'],
  });

  const { data: partners } = useQuery<PartnerIntegration[]>({
    queryKey: ['/api/partner/public-list'],
  });
  
  const handleDownloadCatalogo = () => {
    window.open("/catalogo-vittaverde.pdf", "_blank");
  };

  const handleTelemedicina = (url?: string) => {
    let targetUrl = url || telemedicineConfig?.redirectUrl;
    if (targetUrl && telemedicineConfig?.isActive) {
      // Add https:// if no protocol specified
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      window.open(targetUrl, "_blank");
    }
  };

  const handlePartnerSSO = (partnerId: string) => {
    window.location.href = `/api/partner/redirect/${partnerId}`;
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/5541984020678?text=Olá! Gostaria de iniciar meu tratamento com cannabis medicinal.", "_blank");
  };

  // Prioriza redirectLinks, fallback para redirectUrl
  const telemedicineLinks = telemedicineConfig?.redirectLinks && telemedicineConfig.redirectLinks.length > 0
    ? telemedicineConfig.redirectLinks
    : telemedicineConfig?.redirectUrl 
      ? [{name: "Agendar Telemedicina", url: telemedicineConfig.redirectUrl}]
      : [];
  
  const activeParters = partners?.filter(p => p.isActive) || [];
  const hasAnyLinks = telemedicineLinks.length > 0 || activeParters.length > 0;
  const isTelemedicineActive = hasAnyLinks && telemedicineConfig?.isActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-2xl">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-white">
            <Badge className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 text-sm border border-white/30 mb-4">
              Etapa 2 de 2
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Como Iniciar Seu Tratamento
            </h1>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
              Escolha como deseja prosseguir: telemedicina indicada ou médico próprio
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Opções Principais */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Opção 1: Telemedicina */}
          <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 bg-white/95 backdrop-blur-sm overflow-hidden group">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
            <CardHeader className="text-center pb-6 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Video className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Telemedicina Indicada
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Consulta online com nossos parceiros especializados
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Médicos Parceiros</h4>
                    <p className="text-sm text-gray-600">
                      Parceiros com expertise em cannabis medicinal seguindo CFM Resolução 2314/2022
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Agendamento Rápido</h4>
                    <p className="text-sm text-gray-600">
                      Consultas disponíveis em até 48h, totalmente online
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Receita + ANVISA</h4>
                    <p className="text-sm text-gray-600">
                      Receita médica e autorização ANVISA incluídas no processo
                    </p>
                  </div>
                </div>
              </div>

              {!isTelemedicineActive ? (
                <Button 
                  className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-xl border-2 border-gray-300 text-gray-500 cursor-not-allowed bg-gray-50"
                  disabled={true}
                  data-testid="button-telemedicina"
                >
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="truncate">Telemedicina - Em Breve</span>
                </Button>
              ) : (
                <div className="space-y-3">
                  {telemedicineLinks.map((link, index) => (
                    <Button 
                      key={`tel-${index}`}
                      className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-xl group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                      onClick={() => handleTelemedicina(link.url)}
                      data-testid={`button-telemedicina-${index}`}
                    >
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="truncate">{link.name}</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </Button>
                  ))}
                  {activeParters.map((partner) => (
                    <Button 
                      key={partner.id}
                      className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-xl group bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                      onClick={() => handlePartnerSSO(partner.id)}
                      data-testid={`button-partner-${partner.id}`}
                    >
                      <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="truncate">{partner.name}</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opção 2: Médico Próprio */}
          <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 bg-white/95 backdrop-blur-sm overflow-hidden group">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-600"></div>
            <CardHeader className="text-center pb-6 bg-gradient-to-br from-emerald-50 to-green-50">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Stethoscope className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Médico Próprio
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Use seu médico de confiança
              </p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Seu Médico de Confiança</h4>
                    <p className="text-sm text-gray-600">
                      Continue com o profissional que já conhece seu histórico
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Catálogo de Produtos</h4>
                    <p className="text-sm text-gray-600">
                      Compartilhe nosso catálogo com seu médico para prescrição correta
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Intermediação Garantida</h4>
                    <p className="text-sm text-gray-600">
                      Cuidamos da autorização ANVISA e intermediação da importação
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <Button 
                  variant="outline"
                  className="w-full border-2 border-gray-300 text-gray-500 cursor-not-allowed py-3 text-sm font-semibold"
                  disabled
                  data-testid="button-catalogo"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Catálogo PDF - EM BREVE
                  <FileText className="h-4 w-4 ml-2" />
                </Button>

                <Link href="/loja" className="w-full">
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 py-4 sm:py-5 text-sm sm:text-base font-semibold shadow-xl group"
                    data-testid="button-loja-online"
                  >
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="truncate">Acesse a Loja Online</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processo Passo a Passo */}
        <Card className="mb-12 border-0 shadow-2xl bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Como Funciona o Processo
            </CardTitle>
            <p className="text-gray-600 mt-2 text-lg">
              Do agendamento à entrega dos produtos
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-4 gap-6">
              
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Consulta Médica</h4>
                <p className="text-sm text-gray-600">
                  Telemedicina ou médico próprio com catálogo
                </p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Receita Médica</h4>
                <p className="text-sm text-gray-600">
                  Receita válida para cannabis medicinal
                </p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">ANVISA + Importação</h4>
                <p className="text-sm text-gray-600">
                  Autorização e intermediação da importação
                </p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Entrega</h4>
                <p className="text-sm text-gray-600">
                  Produto na sua casa com segurança total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA WhatsApp */}
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white overflow-hidden">
          <CardContent className="p-12 text-center relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Dúvidas? Estamos Aqui!</h2>
              <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                Nossa equipe especializada está pronta para te ajudar em qualquer etapa da jornada. 
                Entre em contato agora mesmo via WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg"
                  onClick={handleWhatsApp}
                  className="bg-white text-green-600 hover:bg-emerald-50 px-10 py-6 text-lg font-semibold shadow-xl group"
                  data-testid="button-whatsapp"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Falar no WhatsApp
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <div className="flex items-center gap-2 text-emerald-100">
                  <Star className="h-5 w-5 text-yellow-300" />
                  <span className="font-medium">Atendimento 24/7</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acesso às Páginas do Paciente */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Link href="/paciente/pedidos">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer bg-white/95 backdrop-blur-sm group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Meus Pedidos</h3>
                  <p className="text-sm text-gray-600">Acompanhe seus pedidos e entregas</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/anvisa">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer bg-white/95 backdrop-blur-sm group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileCheck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Autorização ANVISA</h3>
                  <p className="text-sm text-gray-600">Acompanhe sua autorização</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>

      </div>
      
      <Footer />
    </div>
  );
}
