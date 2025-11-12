import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, Mail, RefreshCw, CheckCircle2, Shield } from "lucide-react";

export default function VerifyCodePage() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();
  
  // Get email from URL params
  const urlParams = new URLSearchParams(searchParams);
  const emailFromUrl = urlParams.get("email") || "";
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-focus next input
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (newCode.every(digit => digit) && newCode.join("").length === 6) {
      verifyCode(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newCode = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
    setCode(newCode);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();

    // Auto-submit if code is complete
    if (pastedData.length === 6) {
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (codeToVerify: string) => {
    if (!emailFromUrl) {
      toast({
        title: "Erro",
        description: "Email não encontrado. Por favor, faça o registro novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await apiRequest("/api/verify-code", "POST", {
        email: emailFromUrl,
        code: codeToVerify,
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Email verificado!",
          description: "Sua conta foi ativada com sucesso. Redirecionando...",
        });
        
        // Redirect based on user role
        setTimeout(() => {
          if (data.user && data.user.role === 'client') {
            setLocation("/patologias");
          } else {
            setLocation("/login");
          }
        }, 1500);
      } else {
        const error = await response.json();
        toast({
          title: "❌ Código inválido",
          description: error.message || "Verifique o código e tente novamente.",
          variant: "destructive",
        });
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast({
        title: "❌ Erro na verificação",
        description: "Não foi possível verificar o código. Tente novamente.",
        variant: "destructive",
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    if (!emailFromUrl) {
      toast({
        title: "Erro",
        description: "Email não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);

    try {
      const response = await apiRequest("/api/resend-code", "POST", {
        email: emailFromUrl,
      });

      if (response.ok) {
        toast({
          title: "✅ Código reenviado!",
          description: "Verifique sua caixa de entrada.",
        });
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Não foi possível reenviar o código.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível reenviar o código.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <Mail className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Verificar Email
            </h1>
            <p className="text-gray-600">
              Enviamos um código de 6 dígitos para
            </p>
            <p className="text-green-600 font-semibold">
              {emailFromUrl}
            </p>
          </div>

          {/* Code Input */}
          <div className="space-y-4">
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  data-testid={`input-code-${index}`}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              onClick={() => verifyCode(code.join(""))}
              disabled={code.join("").length !== 6 || isVerifying}
              className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
              data-testid="button-verify"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Verificando...
                </>
              ) : (
                <>
                  Verificar Código
                  <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Não recebeu o código?
              </p>
              <Button
                onClick={resendCode}
                disabled={isResending}
                variant="outline"
                className="border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold"
                data-testid="button-resend"
              >
                {isResending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    Reenviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reenviar Código
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 mb-1">Segurança</p>
              <p className="text-blue-700">
                O código expira em 24 horas e só pode ser usado uma vez
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              onClick={() => setLocation("/login")}
              className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              data-testid="link-login"
            >
              ← Voltar para login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
