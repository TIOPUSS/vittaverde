import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Users, DollarSign, MapPin, 
  ArrowRight, Sparkles, Clock, CheckCircle
} from "lucide-react";

export default function MarketInsights() {
  return (
    <section className="py-20 bg-gradient-to-br from-green-900 via-green-800 to-teal-900 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-yellow-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-green-400 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center bg-yellow-400/20 text-yellow-300 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Revolução em Números
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              Saúde que 
              <span className="text-yellow-300"> Transforma Vidas</span>
            </h2>
            
            <p className="text-xl text-green-100 leading-relaxed">
              Descubra como <span className="font-semibold text-white">672 mil brasileiros</span> já 
              encontraram alívio natural para dores crônicas, ansiedade e epilepsia. Uma revolução 
              <span className="font-semibold text-yellow-300"> na medicina</span> que oferece 
              esperança real para milhões.
            </p>

            <div className="flex items-center space-x-4 text-green-200">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span className="text-sm">Leitura: 3 min</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">Baseado em dados oficiais</span>
              </div>
            </div>

            <Link href="/como-funciona">
              <Button 
                size="lg" 
                className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-semibold group transition-all duration-300"
                data-testid="button-como-funciona-hero"
              >
                Entender Como Funciona
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Right side - Statistics Cards */}
          <div className="grid gap-4">
            <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-300" />
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                    Crescimento 2024
                  </Badge>
                </div>
                <div className="text-3xl font-bold mb-2">672 mil</div>
                <p className="text-green-100 text-sm">Vidas transformadas no Brasil</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                    <DollarSign className="h-5 w-5 text-green-300" />
                  </div>
                  <div className="text-2xl font-bold mb-1">85%</div>
                  <p className="text-green-100 text-xs">Melhora na dor</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                    <MapPin className="h-5 w-5 text-purple-300" />
                  </div>
                  <div className="text-2xl font-bold mb-1">79%</div>
                  <p className="text-green-100 text-xs">Redução ansiedade</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur border-yellow-400/30 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-yellow-300" />
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">
                    Potencial
                  </Badge>
                </div>
                <div className="text-3xl font-bold mb-2 text-yellow-300">20 milhões</div>
                <p className="text-yellow-100 text-sm">
                  Brasileiros podem se beneficiar do tratamento
                </p>
                <div className="mt-3 text-xs text-yellow-200 opacity-75">
                  Apenas 3,3% do mercado potencial foi explorado
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">
              Por que tantos brasileiros encontraram alívio na cannabis medicinal?
            </h3>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              Descubra como a cannabis medicinal pode ajudar você a recuperar sua qualidade 
              de vida de forma natural e segura.
            </p>
            <Link href="/como-funciona">
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                data-testid="button-como-funciona-bottom"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Descobrir Como Pode Me Ajudar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}