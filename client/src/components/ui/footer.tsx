import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">VittaVerde</h3>
            <p className="text-gray-300 text-sm">
              Intermediação legal para acesso ao CBD medicinal no Brasil conforme RDC 660/2022.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Serviços</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/consulta" className="hover:text-white">Consulta Médica</Link></li>
              <li><Link href="/produtos" className="hover:text-white">Produtos CBD</Link></li>
              <li><Link href="/rastreamento" className="hover:text-white">Rastreamento</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><a href="tel:+5511999999999" className="hover:text-white">WhatsApp: (11) 99999-9999</a></li>
              <li><a href="mailto:contato@vittaverde.com.br" className="hover:text-white">contato@vittaverde.com.br</a></li>
              <li><span className="text-gray-300">Atendimento: 9h às 18h</span></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
              <li><span className="text-gray-300">CNPJ: 00.000.000/0001-00</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2024 VittaVerde. Todos os direitos reservados. Intermediação de importação conforme RDC 660/2022.</p>
        </div>
      </div>
    </footer>
  );
}