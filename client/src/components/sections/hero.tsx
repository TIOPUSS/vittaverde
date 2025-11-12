import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Stethoscope, Leaf, UserRound, Tag, Truck, Headphones } from "lucide-react";

export default function Hero() {
  return (
    <section className="gradient-bg text-white py-20 lg:py-32 relative overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="slide-in">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight" data-testid="hero-title">
              Acesso Legal à <span className="text-vitta-light">Cannabis Medicinal</span> no Brasil
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-vitta-light" data-testid="hero-description">
              Plataforma completa para consulta médica, prescrição e intermediação de importação legal de produtos à base de canabidiol conforme RDC 660/2022
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <button 
                  className="w-full sm:w-auto bg-white text-green-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center border-0"
                  data-testid="button-schedule-consultation"
                >
                  <Stethoscope className="mr-2 h-5 w-5 text-green-700" />
                  Agendar Consulta
                </button>
              </Link>
              <Link href="/produtos">
                <button 
                  className="w-full sm:w-auto bg-white text-green-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center border-0"
                  data-testid="button-view-products"
                >
                  <Leaf className="mr-2 h-5 w-5 text-green-700" />
                  Ver Produtos
                </button>
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:block">
            {/* Modern medical illustration */}
            <div className="floating-animation bg-white bg-opacity-20 rounded-2xl p-8 backdrop-blur-sm" data-testid="hero-illustration">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-30 rounded-lg p-4 text-center" data-testid="feature-online-consultation">
                  <UserRound className="mx-auto text-3xl mb-2 h-8 w-8" />
                  <p className="text-sm">Consulta Online</p>
                </div>
                <div className="bg-white bg-opacity-30 rounded-lg p-4 text-center" data-testid="feature-anvisa-authorization">
                  <Tag className="mx-auto text-3xl mb-2 h-8 w-8" />
                  <p className="text-sm">Autorização ANVISA</p>
                </div>
                <div className="bg-white bg-opacity-30 rounded-lg p-4 text-center" data-testid="feature-secure-delivery">
                  <Truck className="mx-auto text-3xl mb-2 h-8 w-8" />
                  <p className="text-sm">Entrega Segura</p>
                </div>
                <div className="bg-white bg-opacity-30 rounded-lg p-4 text-center" data-testid="feature-24h-support">
                  <Headphones className="mx-auto text-3xl mb-2 h-8 w-8" />
                  <p className="text-sm">Suporte 24h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
