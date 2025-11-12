import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { CheckCircle, FileText, Shield, ArrowRight, AlertCircle, Clock, Calendar, ExternalLink, MousePointerClick } from "lucide-react";

export default function AnvisaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-emerald-600/5 to-teal-600/5"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 px-5 py-2 rounded-full shadow-lg border border-blue-300">
              <Shield className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-semibold text-blue-800">Portal do Governo Federal</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Autorização ANVISA
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Aprenda como você mesmo pode solicitar a autorização ANVISA<br/>
              de forma rápida e gratuita no portal do governo.
            </p>
          </div>
        </div>
      </div>

      {/* Alert Info - VOCÊ FAZ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16">
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-0 shadow-2xl">
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MousePointerClick className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Você Faz a Solicitação</h3>
            </div>
            <p className="text-white/95 text-lg max-w-3xl mx-auto">
              A autorização ANVISA é feita por <strong>você mesmo</strong> no site do governo federal.
              É rápido, fácil e <strong>100% gratuito</strong>. Nós te ensinamos o passo a passo abaixo!
            </p>
          </div>
        </Card>
      </div>

      {/* Passo a Passo Detalhado */}
      <div className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Como Fazer sua Autorização ANVISA
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12">
            Siga estes passos simples e solicite você mesmo:
          </p>

          <div className="space-y-6">
            {/* Passo 1 - Receita Médica */}
            <Card className="border-2 border-green-200 hover:border-green-400 transition-all overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 md:p-10 flex items-center justify-center md:w-48">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">1</div>
                    <div className="text-white/90 font-semibold">Pré-requisito</div>
                  </div>
                </div>
                <div className="p-8 md:p-10 flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Tenha sua receita médica em mãos
                  </h3>
                  <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                    Você precisa de uma receita médica que indique o tratamento com CBD.
                    A receita deve conter o nome do produto e a dosagem recomendada.
                  </p>
                  <Button
                    onClick={() => window.location.href = '/consulta'}
                    variant="outline"
                    className="border-2 border-green-600 text-green-700 hover:bg-green-50"
                    data-testid="button-consulta-passo1"
                  >
                    Não tem receita? Agende aqui
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Passo 2 - Conta Gov.br */}
            <Card className="border-2 border-green-200 hover:border-green-400 transition-all overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 md:p-10 flex items-center justify-center md:w-48">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">2</div>
                    <div className="text-white/90 font-semibold">5 minutos</div>
                  </div>
                </div>
                <div className="p-8 md:p-10 flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Crie sua conta no Gov.br
                  </h3>
                  <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                    O governo exige uma conta Gov.br para fazer solicitações oficiais.
                    <strong> É totalmente gratuito</strong> e leva apenas 5 minutos.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-800">
                      <strong>Você vai precisar:</strong> CPF, e-mail e número de celular
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open('https://sso.acesso.gov.br/', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-gov-br"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Criar Conta Gov.br Agora
                  </Button>
                </div>
              </div>
            </Card>

            {/* Passo 3 - Portal ANVISA */}
            <Card className="border-2 border-green-200 hover:border-green-400 transition-all overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-teal-500 to-green-600 p-8 md:p-10 flex items-center justify-center md:w-48">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">3</div>
                    <div className="text-white/90 font-semibold">10 minutos</div>
                  </div>
                </div>
                <div className="p-8 md:p-10 flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Entre no Portal da ANVISA e solicite
                  </h3>
                  <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                    Acesse o portal oficial da ANVISA com sua conta Gov.br e preencha o formulário de solicitação.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-2">O que você vai precisar no portal:</p>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                          <li>Receita médica (foto ou PDF)</li>
                          <li>RG ou CNH (foto ou PDF)</li>
                          <li>Comprovante de residência</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => window.open('https://www.gov.br/pt-br/servicos/solicitar-autorizacao-para-importacao-excepcional-de-produtos-a-base-de-canabidiol', '_blank')}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl"
                    data-testid="button-portal-anvisa"
                  >
                    <Shield className="mr-2 h-5 w-5" />
                    Acessar Portal ANVISA
                  </Button>
                </div>
              </div>
            </Card>

            {/* Passo 4 - Aprovação */}
            <Card className="border-2 border-green-200 hover:border-green-400 transition-all overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 md:p-10 flex items-center justify-center md:w-48">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">4</div>
                    <div className="text-white/90 font-semibold">Automático</div>
                  </div>
                </div>
                <div className="p-8 md:p-10 flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Receba sua autorização na hora
                  </h3>
                  <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                    Após preencher o formulário, a ANVISA libera a autorização <strong>automaticamente</strong>.
                    Você vai receber o documento por email e também pode baixar direto no portal.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-900 font-semibold">
                      ✅ Pronto! Agora você pode fazer upload da autorização aqui na VittaVerde e começar a comprar
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Informações Importantes */}
      <div className="bg-gradient-to-br from-gray-50 to-green-50/30 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Informações Importantes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Gratuito */}
            <Card className="border-2 border-green-200 bg-white text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Gratuito</h3>
              <p className="text-gray-600">
                A autorização da ANVISA não custa nada. Você não paga ao governo.
              </p>
            </Card>

            {/* Rápido */}
            <Card className="border-2 border-teal-200 bg-white text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                <Clock className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Aprovação na Hora</h3>
              <p className="text-gray-600">
                Após enviar os documentos, a aprovação sai automaticamente.
              </p>
            </Card>

            {/* Validade */}
            <Card className="border-2 border-blue-200 bg-white text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Válida por 2 Anos</h3>
              <p className="text-gray-600">
                Sua autorização vale por até 2 anos ou pelo tempo da receita.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Dúvidas Frequentes */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Dúvidas Frequentes
        </h2>

        <div className="space-y-4">
          <Card className="border-2 border-gray-200">
            <div className="p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                🏥 Qualquer médico pode fazer a receita?
              </h3>
              <p className="text-gray-700">
                Sim! Pode ser <strong>qualquer médico</strong> com CRM ativo. Não precisa ser especialista.
              </p>
            </div>
          </Card>

          <Card className="border-2 border-gray-200">
            <div className="p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                ⏱️ Quanto tempo demora para ser aprovado?
              </h3>
              <p className="text-gray-700">
                A aprovação é <strong>instantânea</strong>! Assim que você envia os documentos corretos, a ANVISA aprova na hora.
              </p>
            </div>
          </Card>

          <Card className="border-2 border-gray-200">
            <div className="p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                📱 Posso fazer pelo celular?
              </h3>
              <p className="text-gray-700">
                Sim! O portal da ANVISA funciona perfeitamente no celular. Você pode tirar fotos dos documentos e enviar direto.
              </p>
            </div>
          </Card>

          <Card className="border-2 border-gray-200">
            <div className="p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                📄 E depois que eu receber a autorização?
              </h3>
              <p className="text-gray-700">
                Faça upload da autorização aqui na VittaVerde (na página da <strong>Loja</strong>) e nossa equipe valida. Depois você pode comprar!
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Final */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comece agora mesmo!
          </h2>
          <p className="text-white/90 text-xl mb-8">
            Primeiro passo: criar sua conta Gov.br para acessar o portal da ANVISA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.open('https://sso.acesso.gov.br/', '_blank')}
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 px-10 py-6 text-lg rounded-xl shadow-xl font-bold"
              data-testid="button-criar-conta-final"
            >
              Criar Conta Gov.br
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => window.open('https://www.gov.br/pt-br/servicos/solicitar-autorizacao-para-importacao-excepcional-de-produtos-a-base-de-canabidiol', '_blank')}
              variant="outline"
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-6 text-lg rounded-xl"
              data-testid="button-portal-final"
            >
              Ir para Portal ANVISA
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
