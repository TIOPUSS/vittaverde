import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GoogleReCaptcha } from "@/components/google-recaptcha";
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Sparkles
} from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // reCAPTCHA temporariamente desabilitado
    // if (!recaptchaToken) {
    //   toast({
    //     title: "Verificação de segurança",
    //     description: "Aguarde a verificação automática...",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    try {
      const result = await login(formData.email, formData.password, recaptchaToken || undefined);

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta à VittaVerde",
      });

      if (result?.targetUrl) {
        setTimeout(() => {
          setLocation(result.targetUrl);
        }, 500);
      }
    } catch (error: any) {
      if (error.message && error.message.includes("Email não verificado")) {
        toast({
          title: "Email não verificado",
          description: "Verifique sua caixa de entrada para ativar sua conta antes de fazer login.",
          variant: "destructive",
          duration: 6000,
        });
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-green-50 to-white overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 lg:w-[600px] lg:h-[600px] bg-gradient-to-br from-green-300 to-emerald-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-teal-200 to-green-300 rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Link href="/">
            <Button 
              variant="ghost" 
              className="group hover-elevate active-elevate-2"
              data-testid="link-home"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900">VittaVerde</span>
            </Link>
            
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-3">
              Bem-vindo de volta
            </h1>
            <p className="text-lg text-gray-600">
              Acesse sua conta para continuar
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-semibold text-base">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-12 h-14 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl text-base transition-all"
                    placeholder="seu@email.com"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-900 font-semibold text-base">
                    Senha
                  </Label>
                  <Link 
                    href="/esqueci-senha" 
                    className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline transition-all"
                    data-testid="link-forgot-password"
                  >
                    Esqueceu?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-12 pr-12 h-14 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl text-base transition-all"
                    placeholder="Digite sua senha"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Google reCAPTCHA v3 - Temporariamente desabilitado */}
              {/* <GoogleReCaptcha 
                onVerify={(token) => setRecaptchaToken(token)}
                action="login"
              /> */}

              {/* Botão de Login */}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all group"
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar na plataforma
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Registro Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <Link 
                href="/registro" 
                className="text-green-600 hover:text-green-700 font-bold hover:underline transition-all" 
                data-testid="link-register"
              >
                Criar conta gratuita
              </Link>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-black text-gray-900">100%</div>
              <div className="text-xs text-gray-600 font-medium">Legal</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-gray-900">5.000+</div>
              <div className="text-xs text-gray-600 font-medium">Pacientes</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-gray-900">4.9★</div>
              <div className="text-xs text-gray-600 font-medium">Avaliação</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
