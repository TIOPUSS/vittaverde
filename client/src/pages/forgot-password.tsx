import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock, Check } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Multi-step form state
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Request reset code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao enviar código');
      }

      toast({
        title: "Código Enviado!",
        description: data.message || "Verifique seu email",
      });

      setStep('code');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao enviar código",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Código inválido');
      }

      toast({
        title: "Código Verificado!",
        description: data.message || "Agora defina sua nova senha",
      });

      setStep('password');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Código Inválido",
        description: error.message || "Verifique o código e tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao resetar senha');
      }

      toast({
        title: "Senha Alterada!",
        description: data.message || "Você já pode fazer login",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao resetar senha",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-green-50">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-2 border-emerald-200 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mb-4">
              {step === 'email' && <Mail className="h-8 w-8 text-white" />}
              {step === 'code' && <Lock className="h-8 w-8 text-white" />}
              {step === 'password' && <Check className="h-8 w-8 text-white" />}
            </div>
            
            <CardTitle className="text-2xl font-bold text-emerald-900">
              Recuperação de Senha
            </CardTitle>
            
            <CardDescription>
              {step === 'email' && "Digite seu email para receber o código"}
              {step === 'code' && "Digite o código enviado para seu email"}
              {step === 'password' && "Defina sua nova senha"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'email' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-emerald-200 text-emerald-900'
              }`}>
                1
              </div>
              <div className={`h-1 w-12 ${
                step === 'code' || step === 'password' 
                  ? 'bg-emerald-600' 
                  : 'bg-gray-300'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'code' 
                  ? 'bg-emerald-600 text-white' 
                  : step === 'password'
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`h-1 w-12 ${
                step === 'password' 
                  ? 'bg-emerald-600' 
                  : 'bg-gray-300'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'password' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>

            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="border-emerald-300 focus:border-emerald-500"
                    data-testid="input-email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  disabled={loading}
                  data-testid="button-send-code"
                >
                  {loading ? "Enviando..." : "Enviar Código"}
                </Button>
              </form>
            )}

            {/* Step 2: Code */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de 6 dígitos</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    disabled={loading}
                    maxLength={6}
                    className="border-emerald-300 focus:border-emerald-500 text-center text-2xl tracking-widest font-bold"
                    data-testid="input-code"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Enviado para: {email}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  disabled={loading || code.length !== 6}
                  data-testid="button-verify-code"
                >
                  {loading ? "Verificando..." : "Verificar Código"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('email')}
                  data-testid="button-back-to-email"
                >
                  Voltar
                </Button>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="border-emerald-300 focus:border-emerald-500"
                    data-testid="input-new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="border-emerald-300 focus:border-emerald-500"
                    data-testid="input-confirm-password"
                  />
                </div>

                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-600 text-center">
                    ⚠️ As senhas não coincidem
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  data-testid="button-reset-password"
                >
                  {loading ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            )}

            {/* Back to Login */}
            <div className="text-center pt-4 border-t border-gray-200">
              <a
                href="/login"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center space-x-2"
                data-testid="link-back-to-login"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Login</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
