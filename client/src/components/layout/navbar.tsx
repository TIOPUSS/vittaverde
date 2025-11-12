import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, LogOut, User, ShoppingCart, Sparkles, Home, ShoppingBag, Package, FileCheck, Users, Briefcase, GraduationCap, Stethoscope, HelpCircle, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const { itemCount } = useCart();

  const getNavItems = () => {
    if (!isLoggedIn) {
      return [
        { href: "/como-funciona", label: "Como Funciona", icon: HelpCircle },
        { href: "/anvisa", label: "Autorização ANVISA", icon: FileCheck },
      ];
    }

    switch (user?.role) {
      case "admin":
        return [
          { href: "/", label: "Início", icon: Home },
          { href: "/admin/usuarios", label: "Usuários", icon: Users },
          { href: "/produtos", label: "Produtos", icon: ShoppingBag },
          { href: "/comercial/crm", label: "CRM", icon: Briefcase },
          { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
        ];
      case "doctor":
        return [
          { href: "/medico/centro-medico", label: "Centro Médico", icon: Stethoscope },
          { href: "/medico/universidade", label: "Universidade", icon: GraduationCap },
        ];
      case "consultant":
        return [
          { href: "/comercial/crm", label: "CRM", icon: Briefcase },
          { href: "/comercial/universidade", label: "Universidade", icon: GraduationCap },
        ];
      case "vendor":
        return [
          { href: "/vendedor", label: "Início", icon: Home },
          { href: "/produtos", label: "Loja", icon: ShoppingBag },
        ];
      case "patient":
      case "client":
        return [
          { href: "/", label: "Início", icon: Home },
          { href: "/produtos", label: "Loja Lifestyle", icon: ShoppingBag },
          { href: "/paciente/pedidos", label: "Pedidos", icon: Package },
          { href: "/anvisa", label: "ANVISA", icon: FileCheck },
        ];
      default:
        return [
          { href: "/como-funciona", label: "Como Funciona", icon: HelpCircle },
          { href: "/anvisa", label: "Autorização ANVISA", icon: FileCheck },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-50 w-full" data-testid="navbar">
      {/* Barra colorida no topo */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
      
      {/* Header principal com fundo especial */}
      <div className="bg-gradient-to-b from-white to-gray-50/50 backdrop-blur-xl border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            
            {/* Logo - SUPER GIGANTE MAS NAO AUMENTA HEADER */}
            <Link href="/" className="flex-shrink-0 group -my-12" data-testid="link-home">
              <img 
                src="/logo-vittaverde-nova.png" 
                alt="VittaVerde" 
                className="h-52 sm:h-56 lg:h-52 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Desktop Navigation - COM ESTILO */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`nav-${item.href.replace('/', '')}`}
                  >
                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                      isActive 
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 !text-white shadow-lg shadow-green-500/30" 
                        : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                    }`}>
                      {Icon && <Icon className={isActive ? "h-4 w-4 !text-white" : "h-4 w-4"} />}
                      <span className={isActive ? "!text-white" : ""}>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Cart com badge especial */}
              {isLoggedIn && user?.role !== 'vendor' && (
                <Link href="/carrinho" data-testid="button-cart">
                  <div className="relative group cursor-pointer">
                    <div className="w-11 h-11 bg-gray-100 hover:bg-green-50 rounded-xl flex items-center justify-center transition-all group-hover:scale-110">
                      <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-green-600 transition-colors" />
                    </div>
                    {itemCount > 0 && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg ring-2 ring-white animate-pulse">
                        {itemCount}
                      </div>
                    )}
                  </div>
                </Link>
              )}

              {!isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Link href="/login" data-testid="button-login">
                    <button className="px-5 py-2.5 font-bold text-sm text-gray-700 hover:text-green-600 rounded-lg hover:bg-green-50 transition-all">
                      Entrar
                    </button>
                  </Link>
                  
                  <Link href="/registro" data-testid="button-start-treatment">
                    <div className="relative group">
                      {/* Glow effect externo */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
                      
                      {/* Botão */}
                      <button className="relative flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-black text-sm shadow-xl transition-all group-hover:scale-105">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        Iniciar Jornada
                      </button>
                    </div>
                  </Link>
                </div>
              ) : (
                <button
                  onClick={logout}
                  className="px-5 py-2.5 font-bold text-sm text-gray-700 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                  data-testid="button-logout"
                >
                  Sair
                </button>
              )}
            </div>

            {/* Mobile */}
            <div className="lg:hidden flex items-center gap-3">
              {isLoggedIn && user?.role !== 'vendor' && (
                <Link href="/carrinho" data-testid="button-cart-mobile">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-gray-700" />
                    </div>
                    {itemCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-black rounded-full flex items-center justify-center ring-2 ring-white">
                        {itemCount}
                      </div>
                    )}
                  </div>
                </Link>
              )}

              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <button className="w-10 h-10 bg-gray-100 hover:bg-green-50 rounded-lg flex items-center justify-center transition-colors" data-testid="button-menu">
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </button>
                </SheetTrigger>
                
                <SheetContent side="right" className="w-full max-w-sm p-0">
                  <div className="flex flex-col h-full bg-gradient-to-br from-white to-green-50/30">
                    {/* Header */}
                    <div className="p-6 bg-white border-b border-gray-100 flex justify-center">
                      <img 
                        src="/logo-vittaverde-nova.png" 
                        alt="VittaVerde" 
                        className="h-24 w-auto"
                      />
                    </div>

                    {/* Menu */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                      {navItems.map((item) => {
                        const isActive = location === item.href;
                        const Icon = item.icon;
                        
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            data-testid={`nav-mobile-${item.href.replace('/', '')}`}
                          >
                            <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${
                              isActive 
                                ? "bg-gradient-to-r from-green-600 to-emerald-600 !text-white shadow-xl shadow-green-500/30" 
                                : "text-gray-700 hover:bg-white hover:shadow-lg"
                            }`}>
                              {Icon && <Icon className={isActive ? "h-5 w-5 !text-white" : "h-5 w-5"} />}
                              <span className={isActive ? "!text-white" : ""}>{item.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Footer */}
                    <div className="p-6 bg-white border-t border-gray-100 space-y-3">
                      {!isLoggedIn ? (
                        <>
                          <Link href="/login" onClick={() => setIsOpen(false)} data-testid="button-mobile-login">
                            <button className="w-full px-6 py-3.5 border-2 border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              Entrar
                            </button>
                          </Link>
                          
                          <Link href="/registro" onClick={() => setIsOpen(false)} data-testid="button-mobile-start-treatment">
                            <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3.5 rounded-xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              Iniciar Jornada
                            </button>
                          </Link>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            logout();
                            setIsOpen(false);
                          }}
                          className="w-full px-6 py-3.5 border-2 border-red-200 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 transition-colors"
                          data-testid="button-mobile-logout"
                        >
                          Sair
                        </button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
