import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/hooks/useAuth";
import { 
  Shield, 
  CheckCircle, 
  Calendar,
  ArrowRight,
  Stethoscope,
  FileText,
  Building2,
  Truck,
  Heart,
  Award,
  Users,
  Clock,
  Star,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Check,
  Leaf,
  Brain,
  Activity,
  Zap
} from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Verificar age verification com timer (30 dias)
  useEffect(() => {
    const ageVerified = localStorage.getItem('vittaverde_age_verified');
    if (ageVerified) {
      const verifiedTime = parseInt(ageVerified, 10);
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 dias
      const now = Date.now();
      const daysRemaining = Math.floor((thirtyDaysInMs - (now - verifiedTime)) / (24 * 60 * 60 * 1000));
      
      if (now - verifiedTime < thirtyDaysInMs) {
        console.log(`✅ Idade verificada. Válido por mais ${daysRemaining} dias.`);
        setShowAgeVerification(false);
      } else {
        console.log('⏰ Verificação de idade expirou. Mostrando modal novamente.');
        localStorage.removeItem('vittaverde_age_verified');
        setShowAgeVerification(true);
      }
    } else {
      console.log('🆕 Primeira visita. Mostrando verificação de idade.');
      setShowAgeVerification(true);
    }
  }, []);

  // Array de depoimentos
  const testimonials = [
    {
      text: "A VittaVerde transformou minha qualidade de vida. O processo foi transparente, os médicos extremamente atenciosos e o tratamento realmente funciona.",
      name: "Maria Silva",
      role: "Paciente desde 2025"
    },
    {
      text: "Finalmente encontrei um tratamento eficaz para minha dor crônica. A equipe me guiou em cada etapa do processo ANVISA com total profissionalismo.",
      name: "João Santos",
      role: "Paciente desde 2025"
    },
    {
      text: "O atendimento personalizado e a qualidade dos produtos superaram minhas expectativas. Recomendo a VittaVerde de olhos fechados.",
      name: "Ana Paula",
      role: "Paciente desde 2025"
    },
    {
      text: "Depois de anos sofrendo com insônia, finalmente consigo dormir bem. A VittaVerde mudou minha vida para melhor.",
      name: "Carlos Mendes",
      role: "Paciente desde 2025"
    },
    {
      text: "Processo rápido, seguro e totalmente legalizado. A ansiedade que me acompanhava há anos está sob controle.",
      name: "Beatriz Costa",
      role: "Paciente desde 2025"
    }
  ];

  // Auto-play dos depoimentos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Troca a cada 5 segundos

    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    if (isLoggedIn) {
      setShowAgeVerification(false);
    }
  }, [isLoggedIn]);

  const handleAgeConfirm = (isOver18: boolean) => {
    if (isOver18) {
      // Salva timestamp no localStorage (válido por 30 dias)
      localStorage.setItem('vittaverde_age_verified', Date.now().toString());
      setShowAgeVerification(false);
    } else {
      // Redireciona para o Google se menor de 18
      window.location.href = 'https://www.google.com';
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.role) {
      const roleRoutes = {
        admin: "/admin",
        doctor: "/medico", 
        consultant: "/comercial",
        vendor: "/vendedor",
        patient: "/bem-estar",
        client: "/bem-estar"
      };
      
      const targetRoute = roleRoutes[user.role as keyof typeof roleRoutes];
      if (targetRoute) {
        setLocation(targetRoute);
      }
    }
  }, [isLoggedIn, user?.role, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Age Verification Modal - BACKDROP BLUR */}
      {showAgeVerification && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xl z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden my-8 border border-white/20">
            {/* Decorative elements sutis */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100/30 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-100/30 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Verificação de Idade
              </h2>
              <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
                Este site contém informações sobre <strong>cannabis medicinal</strong>. 
                Confirme que você tem <strong>mais de 18 anos</strong>.
              </p>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 mb-0.5">Aviso Legal</p>
                    <p className="text-xs text-amber-800">
                      Produtos disponíveis apenas com prescrição médica
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => handleAgeConfirm(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-base font-bold rounded-xl shadow-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Tenho 18 anos ou mais
                </Button>
                
                <Button
                  onClick={() => handleAgeConfirm(false)}
                  variant="ghost"
                  className="w-full text-gray-600 hover:bg-gray-100 py-6 rounded-2xl"
                >
                  Tenho menos de 18 anos
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar - pré-renderiza escondido para carregar mais rápido */}
      <div className={showAgeVerification ? "hidden" : ""}>
        <Navbar />
      </div>
      
      {/* Hero Section - MOBILE-FIRST 2025 */}
      <section className="relative bg-gradient-to-b from-green-50 to-white pt-20 pb-24 sm:pt-24 sm:pb-32 lg:pt-12 lg:pb-20 overflow-hidden">
        {/* Decorative elements - More prominent on desktop */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 lg:w-[600px] lg:h-[600px] bg-gradient-to-br from-green-300 to-emerald-200 rounded-full blur-3xl opacity-40 lg:opacity-50"></div>
          <div className="hidden lg:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-teal-200 to-green-300 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 w-full">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-16 xl:gap-20 items-center">
            
            {/* Left - Content */}
            <div className="text-center lg:text-left space-y-6">
              {/* Headline - LARGE */}
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-gray-900 leading-[1.1] tracking-tight pb-3">
                  Cannabis
                  <span className="block bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mt-4 pb-2">
                    Medicinal Legal
                  </span>
                </h1>
                
                {/* Value prop - LARGER */}
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Sua jornada para uma vida com mais qualidade e bem-estar começa aqui.
                </p>
              </div>

              {/* CTAs - LARGER */}
              <div className="flex flex-col lg:flex-row gap-4 pt-2">
                {/* Primary CTA */}
                {isLoggedIn ? (
                  <Link href="/paciente/consulta" className="block lg:inline-block">
                    <Button 
                      className="w-full lg:w-auto h-14 px-8 group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all"
                      data-testid="button-acessar-area"
                    >
                      Acessar Minha Área
                      <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/registro" className="block lg:inline-block">
                    <Button 
                      className="w-full lg:w-auto h-14 px-8 group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all"
                      data-testid="button-comecar-tratamento"
                    >
                      Começar Tratamento
                      <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
                
                {/* Secondary CTA - desktop */}
                <Link href="/anvisa" className="hidden lg:inline-block">
                  <Button 
                    variant="outline"
                    className="h-14 px-8 border-2 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-green-500 text-lg font-bold rounded-xl transition-all"
                    data-testid="button-rastrear"
                  >
                    <Shield className="w-6 h-6 mr-2" />
                    Rastrear ANVISA
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators - LARGER */}
              <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
                <div className="text-center lg:text-left">
                  <div className="text-3xl lg:text-5xl font-black text-gray-900">5.000+</div>
                  <div className="text-xs lg:text-base text-gray-600 font-medium">Pacientes</div>
                </div>
                <div className="w-px h-10 lg:h-14 bg-gray-300"></div>
                <div className="text-center lg:text-left">
                  <div className="flex items-center gap-1 lg:gap-2 mb-1">
                    <div className="text-3xl lg:text-5xl font-black text-gray-900">4.9</div>
                    <Star className="w-5 h-5 lg:w-8 lg:h-8 text-amber-400 fill-current" />
                  </div>
                  <div className="text-xs lg:text-base text-gray-600 font-medium">Avaliação</div>
                </div>
                <div className="w-px h-10 lg:h-14 bg-gray-300"></div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl lg:text-5xl font-black text-gray-900">100%</div>
                  <div className="text-xs lg:text-base text-gray-600 font-medium">Seguro</div>
                </div>
              </div>
            </div>

            {/* Right - Feature Cards - LARGER */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-6">
                {[
                  {
                    icon: Stethoscope,
                    title: "Mais de 250 Médicos Parceiros",
                    desc: "250+ profissionais certificados",
                    gradient: "from-blue-500 to-blue-600",
                    bgGradient: "from-blue-50 to-blue-100"
                  },
                  {
                    icon: Shield,
                    title: "100% Legal",
                    desc: "Processo regulamentado",
                    gradient: "from-green-500 to-green-600",
                    bgGradient: "from-green-50 to-green-100"
                  },
                  {
                    icon: Clock,
                    title: "Suporte 24/7",
                    desc: "Equipe sempre disponível",
                    gradient: "from-purple-500 to-purple-600",
                    bgGradient: "from-purple-50 to-purple-100"
                  },
                  {
                    icon: Truck,
                    title: "Entrega Segura",
                    desc: "Rastreamento completo",
                    gradient: "from-amber-500 to-amber-600",
                    bgGradient: "from-amber-50 to-amber-100"
                  }
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-green-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity`}></div>
                    
                    <div className="relative">
                      <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-all`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-3">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed text-base">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - MOBILE FIRST 2025 */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          {/* Header - Bold & Simple */}
          <div className="text-center max-w-2xl lg:max-w-3xl mx-auto mb-16 sm:mb-20 lg:mb-24 space-y-6">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 leading-tight">
              Como Funciona
            </h2>
            <p className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl text-gray-600 font-medium">
              Quatro passos para seu tratamento
            </p>
          </div>

          {/* Steps - Vertical on mobile, horizontal on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8 xl:gap-12">
            {[
              {
                num: "01",
                icon: Stethoscope,
                title: "Consulta Médica",
                desc: "Avaliação completa com especialista em cannabis medicinal",
                badge: "Com médicos parceiros credenciados",
                color: "from-green-500 to-emerald-600",
                iconBg: "bg-gradient-to-br from-green-100 to-emerald-100"
              },
              {
                num: "02",
                icon: FileText,
                title: "Prescrição",
                desc: "Receita personalizada de acordo com sua condição de saúde",
                color: "from-blue-500 to-indigo-600",
                iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100"
              },
              {
                num: "03",
                icon: Building2,
                title: "Autorização",
                desc: "Cuidamos de todo o processo ANVISA para você",
                color: "from-purple-500 to-violet-600",
                iconBg: "bg-gradient-to-br from-purple-100 to-violet-100"
              },
              {
                num: "04",
                icon: Truck,
                title: "Entrega",
                desc: "Produto chega com segurança e rastreamento em sua casa",
                color: "from-amber-500 to-orange-600",
                iconBg: "bg-gradient-to-br from-amber-100 to-orange-100"
              }
            ].map((step, i) => (
              <div key={i} className="group relative bg-white rounded-3xl p-10 hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-green-200">
                {/* Large number */}
                <div className={`inline-flex items-center justify-center w-20 h-20 lg:w-20 lg:h-20 bg-gradient-to-br ${step.color} text-white rounded-2xl text-4xl font-black mb-8 shadow-lg`}>
                  {step.num}
                </div>

                {/* Icon */}
                <div className="mb-6">
                  <step.icon className="w-12 h-12 text-gray-700" />
                </div>

                {/* Title - Bold & Clear */}
                <h3 className="text-2xl lg:text-2xl xl:text-3xl font-black text-gray-900 mb-4 leading-tight">
                  {step.title}
                </h3>

                {/* Description - Readable */}
                <p className="text-lg lg:text-lg xl:text-xl text-gray-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial - Carousel - REDESIGNED MOBILE */}
      <section className="py-12 sm:py-14 lg:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-3xl p-8 sm:p-12 lg:p-16 text-center overflow-hidden shadow-xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 sm:w-48 sm:h-48 bg-green-200/20 rounded-full -mr-20 sm:-mr-24 -mt-20 sm:-mt-24 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-40 sm:h-40 bg-emerald-200/20 rounded-full -ml-16 sm:-ml-20 -mb-16 sm:-mb-20 blur-2xl"></div>
            
            <div className="relative">
              <div className="flex justify-center gap-1 sm:gap-2 mb-6 sm:mb-8">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 fill-current drop-shadow-md" />
                ))}
              </div>
              
              {/* Depoimento com animação */}
              <div className="min-h-[140px] sm:min-h-[180px] flex items-center justify-center px-2">
                <p 
                  key={currentTestimonial} 
                  className="text-xl sm:text-2xl lg:text-3xl text-gray-900 font-semibold mb-8 sm:mb-10 leading-relaxed animate-in fade-in duration-700"
                >
                  "{testimonials[currentTestimonial].text}"
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4 sm:gap-5 mb-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl"></div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 text-lg sm:text-xl">{testimonials[currentTestimonial].name}</div>
                  <div className="text-gray-600 text-base sm:text-lg">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>

              {/* Indicadores (dots) */}
              <div className="flex justify-center gap-2 sm:gap-3">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentTestimonial 
                        ? 'w-10 h-3 bg-gradient-to-r from-green-600 to-emerald-600' 
                        : 'w-3 h-3 bg-green-300 hover:bg-green-400'
                    }`}
                    aria-label={`Ver depoimento ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions - REDESIGNED MOBILE */}
      <section className="py-12 sm:py-14 lg:py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-200 rounded-full mb-5 sm:mb-6">
              <Heart className="w-5 h-5 text-blue-600" />
              <span className="text-sm sm:text-base font-bold text-blue-700">Tratamentos Eficazes</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 sm:mb-6">
              Condições que Tratamos
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600">
              Cannabis medicinal comprovadamente eficaz para diversas condições
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { title: "Dor Crônica", icon: Heart, gradient: "from-red-500 to-pink-600", iconBg: "bg-gradient-to-br from-red-50 to-pink-50" },
              { title: "Ansiedade e Depressão", icon: Brain, gradient: "from-purple-500 to-violet-600", iconBg: "bg-gradient-to-br from-purple-50 to-violet-50" },
              { title: "Insônia", icon: Activity, gradient: "from-indigo-500 to-blue-600", iconBg: "bg-gradient-to-br from-indigo-50 to-blue-50" },
              { title: "Epilepsia", icon: Zap, gradient: "from-yellow-500 to-amber-600", iconBg: "bg-gradient-to-br from-yellow-50 to-amber-50" },
              { title: "Esclerose Múltipla", icon: Stethoscope, gradient: "from-green-500 to-emerald-600", iconBg: "bg-gradient-to-br from-green-50 to-emerald-50" },
              { title: "Náusea e Vômitos", icon: Leaf, gradient: "from-teal-500 to-cyan-600", iconBg: "bg-gradient-to-br from-teal-50 to-cyan-50" }
            ].map((condition, i) => (
              <div
                key={i}
                className="group relative bg-white border-2 border-gray-200 rounded-3xl p-6 sm:p-7 lg:p-8 hover:border-green-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden"
              >
                <div className={`absolute -bottom-8 -right-8 w-32 h-32 ${condition.iconBg} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                <div className="relative flex items-center gap-4 sm:gap-5">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${condition.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all flex-shrink-0`}>
                    <condition.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                      {condition.title}
                    </h3>
                  </div>
                  <Check className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center px-4 sm:px-0">
            <Link href="/registro">
              <Button 
                size="lg"
                className="w-full sm:w-auto group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 sm:px-10 lg:px-14 py-5 sm:py-7 lg:py-9 text-base sm:text-lg lg:text-xl xl:text-2xl font-bold rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
              >
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 mr-2 sm:mr-3 lg:mr-4" />
                Agendar Consulta Médica
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 ml-2 sm:ml-3 lg:ml-4 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA - MOBILE OPTIMIZED */}
      <section className="relative py-12 sm:py-14 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-5 sm:mb-6 lg:mb-8">
            Pronto para Começar?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed">
            Dê o primeiro passo rumo a uma vida com mais qualidade e bem-estar
          </p>
          
          <Link href="/registro">
            <Button 
              size="lg"
              className="w-full sm:w-auto group bg-white hover:bg-gray-50 text-gray-900 px-8 sm:px-10 lg:px-14 py-5 sm:py-7 lg:py-9 text-base sm:text-lg lg:text-xl xl:text-2xl font-bold rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 mr-2 sm:mr-3 lg:mr-4" />
              Começar Tratamento Agora
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 ml-2 sm:ml-3 lg:ml-4 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
