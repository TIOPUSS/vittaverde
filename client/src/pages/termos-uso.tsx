import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { FileText, AlertTriangle, CheckCircle, Scale } from "lucide-react";

export default function TermosUso() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 pb-16 sm:pb-24">
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-4 px-2">
            Termos de Uso
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="prose prose-green max-w-none">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-6 sm:mb-12 shadow-xl">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3">Leia Atentamente</h3>
                <p className="text-amber-50 text-sm sm:text-lg leading-relaxed">
                  Ao utilizar a plataforma VittaVerde, você concorda integralmente com estes Termos de Uso. 
                  Se não concordar, não utilize nossos serviços.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              1. Sobre a VittaVerde
            </h2>
            <p className="text-sm sm:text-base text-gray-700">
              A VittaVerde é uma plataforma de <strong>intermediação de importação</strong> de produtos à base de cannabis medicinal, 
              operando em conformidade com a Resolução RDC nº 660/2022 da ANVISA e demais normativas sanitárias brasileiras.
            </p>
            <p className="text-sm sm:text-base text-gray-700 mt-3 sm:mt-4">
              <strong>CNPJ:</strong> 37.000.632/0001-65
            </p>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
                <Scale className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              2. Serviços Oferecidos
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
              Nossa plataforma oferece:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Consultas Médicas Especializadas:</strong> Agendamento com médicos habilitados para prescrição de cannabis medicinal</li>
              <li><strong>Intermediação de Importação:</strong> Processamento de pedidos junto a fornecedores internacionais autorizados</li>
              <li><strong>Suporte ANVISA:</strong> Auxílio no processo de autorização sanitária para importação</li>
              <li><strong>Acompanhamento:</strong> Rastreamento do pedido e suporte pós-venda</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">3. Requisitos Legais</h2>
            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
              Para utilizar nossos serviços, você deve:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Ser maior de 18 anos ou ter autorização de responsável legal</li>
              <li>Possuir prescrição médica válida para produtos à base de cannabis</li>
              <li>Obter autorização da ANVISA para importação (com nosso auxílio)</li>
              <li>Fornecer documentação verdadeira e atualizada</li>
              <li>Utilizar os produtos conforme prescrição médica</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">4. Responsabilidades do Usuário</h2>
            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
              Você se compromete a:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Fornecer informações verdadeiras e completas sobre sua condição de saúde</li>
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Não compartilhar produtos de cannabis medicinal com terceiros</li>
              <li>Seguir rigorosamente a prescrição médica fornecida</li>
              <li>Informar qualquer reação adversa ao médico responsável</li>
              <li>Não utilizar a plataforma para fins ilegais ou não autorizados</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">5. Intermediação e Limitação de Responsabilidade</h2>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
              <p className="text-sm sm:text-base text-gray-700">
                <strong className="text-blue-800">IMPORTANTE:</strong> A VittaVerde atua exclusivamente como <strong>intermediadora</strong> 
                na importação de produtos de cannabis medicinal. Não somos fabricantes, distribuidores diretos ou prestadores de serviços médicos.
              </p>
            </div>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Os médicos que atendem pela plataforma são profissionais independentes com CRM ativo</li>
              <li>Os produtos são fornecidos por fabricantes internacionais certificados</li>
              <li>A eficácia do tratamento depende de diversos fatores individuais</li>
              <li>Prazos de entrega podem variar conforme processos aduaneiros e ANVISA</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">6. Prescrição Médica e Uso Responsável</h2>
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4">
              <p className="text-sm sm:text-base text-gray-700">
                <strong className="text-red-800">ATENÇÃO:</strong> Produtos de cannabis medicinal só podem ser adquiridos mediante 
                prescrição médica válida. O uso sem prescrição ou em desacordo com orientação médica é ilegal e perigoso à saúde.
              </p>
            </div>
            <p className="text-sm sm:text-base text-gray-700">
              A prescrição médica deve:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li>Ser emitida por médico com CRM ativo</li>
              <li>Conter identificação completa do paciente</li>
              <li>Especificar produto, concentração e posologia</li>
              <li>Ter validade máxima de 6 meses</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">7. Preços e Pagamento</h2>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Preços são apresentados em reais (BRL) e incluem impostos aplicáveis</li>
              <li>Valores podem variar conforme cotação do dólar e taxas de importação</li>
              <li>Pagamento deve ser realizado antes do processamento do pedido</li>
              <li>Taxas de autorização ANVISA são cobradas separadamente quando aplicável</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">8. Política de Cancelamento</h2>
            <p className="text-sm sm:text-base text-gray-700">
              Devido à natureza regulamentada dos produtos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li>Cancelamentos só são aceitos antes do envio ao fornecedor internacional</li>
              <li>Após autorização ANVISA, não é possível cancelar ou trocar produtos</li>
              <li>Devoluções só são aceitas em caso de produto com defeito de fabricação</li>
              <li>Reembolsos seguem prazo de até 30 dias úteis após aprovação</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">9. Propriedade Intelectual</h2>
            <p className="text-sm sm:text-base text-gray-700">
              Todo conteúdo da plataforma VittaVerde (textos, imagens, logos, design) é protegido por direitos autorais. 
              É proibida reprodução sem autorização expressa.
            </p>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">10. Modificações nos Termos</h2>
            <p className="text-sm sm:text-base text-gray-700">
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
              Mudanças significativas serão notificadas por e-mail com 30 dias de antecedência.
            </p>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">11. Lei Aplicável e Foro</h2>
            <p className="text-sm sm:text-base text-gray-700">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. 
              Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer questões relacionadas.
            </p>
          </section>

          <section className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              Aceite dos Termos
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
              Ao criar uma conta ou utilizar qualquer serviço da VittaVerde, você declara que:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>Leu e compreendeu integralmente estes Termos de Uso</li>
              <li>Concorda com todas as disposições aqui estabelecidas</li>
              <li>Está ciente das responsabilidades e obrigações legais</li>
              <li>Utilizará a plataforma de forma ética e legal</li>
            </ul>
          </section>

          <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-green-200 mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              Contato Jurídico
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
              Para dúvidas sobre estes Termos de Uso:
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">E-mail</p>
                    <a href="mailto:juridico@vittaverde.com.br" className="text-sm sm:text-lg font-semibold text-green-600 hover:text-green-700 break-all">
                      juridico@vittaverde.com.br
                    </a>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">CNPJ</p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900">37.000.632/0001-65</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
