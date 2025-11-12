import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6 sm:py-12 mt-8 sm:mt-0" data-testid="footer">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Mobile: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* VittaVerde - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 mb-2 sm:mb-0">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 text-green-400">VittaVerde</h3>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Intermediação legal para acesso à Cannabis Medicinal no Brasil conforme RDC 660/2022.
            </p>
          </div>
          
          {/* Navegação */}
          <div>
            <h4 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-gray-100">Navegação</h4>
            <ul className="space-y-1 sm:space-y-2 text-gray-300 text-xs sm:text-sm">
              <li><Link href="/como-funciona" className="hover:text-white transition-colors">Como Funciona</Link></li>
              <li><Link href="/loja" className="hover:text-white transition-colors">Loja</Link></li>
              <li><Link href="/anvisa" className="hover:text-white transition-colors">ANVISA</Link></li>
            </ul>
          </div>
          
          {/* Contato */}
          <div>
            <h4 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-gray-100">Contato</h4>
            <ul className="space-y-1 sm:space-y-2 text-gray-300 text-xs sm:text-sm">
              <li>
                <a href="mailto:contato@vittaverde.com.br" className="hover:text-white transition-colors break-all">
                  contato@<wbr/>vittaverde.<wbr/>com.br
                </a>
              </li>
              <li><span className="text-gray-400">9h às 18h</span></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 text-gray-100">Legal</h4>
            <ul className="space-y-1 sm:space-y-2 text-gray-300 text-xs sm:text-sm">
              <li><Link href="/politica-privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
              <li><Link href="/termos-uso" className="hover:text-white transition-colors">Termos</Link></li>
              <li><span className="text-gray-400 text-xs">CNPJ: 37.000.632/<wbr/>0001-65</span></li>
            </ul>
          </div>
        </div>
        
        {/* Footer bottom */}
        <div className="border-t border-gray-800 pt-4 sm:pt-8 mt-6 sm:mt-8 text-center text-gray-400 text-xs sm:text-sm">
          <p className="leading-relaxed">
            <span className="hidden sm:inline">&copy; 2024 VittaVerde. Todos os direitos reservados. Intermediação de importação conforme RDC 660/2022.</span>
            <span className="sm:hidden">&copy; 2024 VittaVerde.<br/>Intermediação conforme RDC 660/2022.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
