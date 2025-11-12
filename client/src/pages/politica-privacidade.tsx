import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Shield, Lock, Eye, FileText } from "lucide-react";

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 pb-16 sm:pb-24">
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-4 px-2">
            Política de Privacidade
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="prose prose-green max-w-none">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-6 sm:mb-12 shadow-xl">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3">Seu Compromisso com a Privacidade</h3>
                <p className="text-green-50 text-sm sm:text-lg leading-relaxed">
                  A VittaVerde está comprometida em proteger sua privacidade e seus dados pessoais de saúde conforme a Lei Geral de Proteção de Dados (LGPD).
                </p>
              </div>
            </div>
          </div>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              1. Informações que Coletamos
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
              Para fornecer nossos serviços de intermediação de importação de produtos à base de cannabis medicinal, coletamos:
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li><strong>Dados Pessoais:</strong> Nome completo, CPF, RG, data de nascimento, endereço completo</li>
              <li><strong>Dados de Contato:</strong> E-mail, telefone, WhatsApp</li>
              <li><strong>Dados de Saúde:</strong> Condições médicas, histórico de tratamentos, prescrições médicas</li>
              <li><strong>Documentação:</strong> Prescrição médica, autorização ANVISA, documentos de identificação</li>
              <li><strong>Dados de Navegação:</strong> Endereço IP, cookies, páginas visitadas</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
                <Eye className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              2. Como Usamos suas Informações
            </h2>
            <p className="text-gray-700 mb-4">
              Utilizamos seus dados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Processar e intermediar a importação de produtos de cannabis medicinal</li>
              <li>Solicitar e acompanhar autorizações junto à ANVISA</li>
              <li>Facilitar consultas médicas especializadas</li>
              <li>Comunicar sobre o status do seu pedido e tratamento</li>
              <li>Cumprir obrigações legais e regulatórias (RDC 660/2022)</li>
              <li>Melhorar nossos serviços e atendimento</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
                <Lock className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              3. Proteção de Dados de Saúde
            </h2>
            <p className="text-gray-700 mb-4">
              Dados de saúde são considerados dados sensíveis pela LGPD e recebem proteção especial:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Armazenamento em servidores criptografados e seguros</li>
              <li>Acesso restrito apenas a profissionais autorizados</li>
              <li>Protocolos de segurança equivalentes a padrões hospitalares</li>
              <li>Conformidade com as resoluções do Conselho Federal de Medicina</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">4. Compartilhamento de Dados</h2>
            <p className="text-gray-700 mb-4">
              Seus dados podem ser compartilhados apenas com:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>ANVISA:</strong> Para obtenção de autorização de importação</li>
              <li><strong>Médicos Credenciados:</strong> Para avaliação e prescrição</li>
              <li><strong>Fornecedores Internacionais:</strong> Para processamento de pedidos</li>
              <li><strong>Transportadoras:</strong> Para entrega dos produtos</li>
              <li><strong>Autoridades Competentes:</strong> Quando exigido por lei</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">5. Seus Direitos</h2>
            <p className="text-gray-700 mb-4">
              Conforme a LGPD, você tem direito a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correção de dados incompletos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados a outro fornecedor</li>
              <li>Revogação do consentimento</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Para exercer seus direitos, entre em contato através de <a href="mailto:privacidade@vittaverde.com.br" className="text-green-600 hover:text-green-700 font-semibold">privacidade@vittaverde.com.br</a>
            </p>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">6. Retenção de Dados</h2>
            <p className="text-gray-700">
              Mantemos seus dados pelo período necessário para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
              <li>Cumprimento de obrigações legais (mínimo de 5 anos conforme legislação sanitária)</li>
              <li>Exercício regular de direitos em processos judiciais ou administrativos</li>
              <li>Continuidade do seu tratamento médico</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">7. Cookies e Tecnologias</h2>
            <p className="text-gray-700">
              Utilizamos cookies para melhorar sua experiência no site. Você pode gerenciar suas preferências de cookies nas configurações do navegador.
            </p>
          </section>

          <section className="mb-6 sm:mb-10 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">8. Alterações na Política</h2>
            <p className="text-gray-700">
              Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas através do e-mail cadastrado.
            </p>
          </section>

          <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-green-200">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              Contato - DPO
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
              Para questões sobre privacidade e proteção de dados, contate nosso Encarregado de Proteção de Dados (DPO):
            </p>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-500">E-mail</p>
                  <a href="mailto:privacidade@vittaverde.com.br" className="text-sm sm:text-lg font-semibold text-green-600 hover:text-green-700 break-all">
                    privacidade@vittaverde.com.br
                  </a>
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
