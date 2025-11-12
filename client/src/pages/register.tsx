import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Eye, EyeOff, Shield, Check, X, 
  Lock, Mail, User, Phone, ArrowRight, ArrowLeft,
  AlertTriangle, Sparkles, CreditCard, Calendar
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { GoogleReCaptcha } from "@/components/google-recaptcha";

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

// Função para formatar CPF
function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

// Função para validar idade mínima
function validateMinAge(birthDate: string, minAge: number = 18): boolean {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= minAge;
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const registerSchema = z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string()
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número")
      .regex(/[!@#$%*&]/, "Senha deve conter pelo menos um caractere especial (!@#$%*&)"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Nome completo deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
    cpf: z.string()
      .min(1, "CPF é obrigatório")
      .refine((value) => validateCPF(value), {
        message: "CPF inválido"
      }),
    birthDate: z.string()
      .min(1, "Data de nascimento é obrigatória")
      .refine((value) => {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }, {
        message: "Data inválida"
      })
      .refine((value) => validateMinAge(value, 18), {
        message: "Você deve ter pelo menos 18 anos para se cadastrar"
      }),
    phone: z.string().min(1, "Telefone é obrigatório").refine(
      (value) => isValidPhoneNumber(value),
      { message: "Número de telefone inválido para o país selecionado" }
    ),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Você deve aceitar os Termos de Uso e Política de Privacidade",
    }),
    role: z.literal("client"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "client",
      acceptTerms: false
    }
  });

  const { register: registerUser } = useAuth();

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      try {
        const response = await registerUser(data);
        return { ...response, email: data.email };
      } catch (error: any) {
        console.error('Registration error details:', error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      if (data.emailSent && !data.user) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email e digite o código de verificação.",
          duration: 6000,
        });
        setLocation(`/verificar-email?email=${encodeURIComponent(data.email)}`);
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo à VittaVerde",
        });
        setLocation("/patologias");
      }
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      let errorMessage = "Erro ao criar conta";
      if (error.message) {
        if (error.message.includes("User with this email already exists")) {
          errorMessage = "Este e-mail já está cadastrado";
        } else if (error.message.includes("duplicate key")) {
          errorMessage = "Este e-mail já está cadastrado";
        } else {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    // reCAPTCHA temporariamente desabilitado
    // if (!recaptchaToken) {
    //   toast({
    //     title: "Verificação de segurança",
    //     description: "Aguarde a verificação automática do Google reCAPTCHA...",
    //     variant: "destructive",
    //   });
    //   return;
    // }
    registerMutation.mutate({ ...data, recaptchaToken: recaptchaToken || undefined });
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%*&]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(passwordValue);
  
  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-orange-500";
    if (strength <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength === 0) return "";
    if (strength <= 2) return "Fraca";
    if (strength <= 3) return "Média";
    if (strength <= 4) return "Boa";
    return "Forte";
  };

  const passwordChecks = [
    { label: "Mínimo 8 caracteres", valid: passwordValue.length >= 8 },
    { label: "Letra maiúscula", valid: /[A-Z]/.test(passwordValue) },
    { label: "Letra minúscula", valid: /[a-z]/.test(passwordValue) },
    { label: "Número", valid: /[0-9]/.test(passwordValue) },
    { label: "Caractere especial (!@#$%*&)", valid: /[!@#$%*&]/.test(passwordValue) },
  ];

  const passwordsMatch = confirmPasswordValue.length > 0 && passwordValue === confirmPasswordValue;

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-green-50 to-white overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 lg:w-[600px] lg:h-[600px] bg-gradient-to-br from-green-300 to-emerald-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-teal-200 to-green-300 rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 py-12">
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

        {/* Register Card */}
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900">VittaVerde</span>
            </Link>
            
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-3">
              Crie sua conta
            </h1>
            <p className="text-lg text-gray-600">
              Comece sua jornada para uma vida com mais qualidade
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Nome Completo */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-900 font-semibold text-base">
                  Nome Completo
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Digite seu nome completo"
                    className="pl-12 h-14 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl text-base transition-all"
                    data-testid="input-fullName"
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-600 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* CPF e Data de Nascimento - Lado a Lado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* CPF */}
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-gray-900 font-semibold text-base">
                    CPF
                  </Label>
                  <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                      <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                        <Input
                          id="cpf"
                          type="text"
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className="pl-12 h-14 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl text-base transition-all"
                          data-testid="input-cpf"
                          value={field.value || ""}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </div>
                    )}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-red-600 flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.cpf.message}
                    </p>
                  )}
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-gray-900 font-semibold text-base">
                    Data de Nascimento
                  </Label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                    <Input
                      id="birthDate"
                      type="date"
                      className="pl-12 h-14 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl text-base transition-all"
                      data-testid="input-birthDate"
                      max={new Date().toISOString().split('T')[0]}
                      {...register("birthDate")}
                    />
                  </div>
                  {errors.birthDate && (
                    <p className="text-sm text-red-600 flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.birthDate.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email e Telefone - Lado a Lado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                      placeholder="seu@email.com"
                      className="pl-12 h-14 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl text-base transition-all"
                      data-testid="input-email"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-900 font-semibold text-base">
                    Telefone
                  </Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <div className="h-14 border-2 border-gray-200 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100 rounded-xl transition-all bg-white flex items-center px-4">
                          <PhoneInput
                            international
                            defaultCountry="BR"
                            value={field.value || ""}
                            onChange={field.onChange}
                            className="flex-1"
                            numberInputProps={{
                              className: "h-full w-full text-base bg-transparent border-none outline-none focus:ring-0",
                              style: { border: 'none', outline: 'none', boxShadow: 'none' }
                            }}
                            data-testid="input-phone"
                          />
                        </div>
                      </div>
                    )}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-semibold text-base">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha segura"
                    className="pl-12 pr-12 h-14 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl text-base transition-all"
                    data-testid="input-password"
                    {...register("password", {
                      onChange: (e) => setPasswordValue(e.target.value)
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Força da Senha */}
                {passwordValue.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Força da senha</span>
                      <span className="text-xs font-bold text-gray-900">
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all ${
                            level <= passwordStrength ? getStrengthColor(passwordStrength) : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Requisitos da Senha */}
                {passwordValue.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
                    {passwordChecks.map((check, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {check.valid ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300" />
                        )}
                        <span className={check.valid ? "text-green-700 font-medium" : "text-gray-500"}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-900 font-semibold text-base">
                  Confirmar Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    className="pl-12 pr-12 h-14 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl text-base transition-all"
                    data-testid="input-confirm-password"
                    {...register("confirmPassword", {
                      onChange: (e) => setConfirmPasswordValue(e.target.value)
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Match Indicator */}
                {confirmPasswordValue.length > 0 && (
                  <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                    passwordsMatch ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {passwordsMatch ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span className="font-medium">As senhas coincidem</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        <span className="font-medium">As senhas não coincidem</span>
                      </>
                    )}
                  </div>
                )}

                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <input type="hidden" {...register("role")} value="client" />

              {/* Google reCAPTCHA v3 - Temporariamente desabilitado */}
              {/* <GoogleReCaptcha 
                onVerify={(token) => setRecaptchaToken(token)}
                action="register"
              /> */}

              {/* Aceite dos Termos - OBRIGATÓRIO */}
              <div className="space-y-3">
                <Controller
                  name="acceptTerms"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="acceptTerms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                        data-testid="checkbox-accept-terms"
                      />
                      <label
                        htmlFor="acceptTerms"
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                      >
                        Ao criar uma conta, você concorda com nossos{' '}
                        <Link 
                          href="/termos-uso" 
                          target="_blank"
                          className="text-green-600 hover:text-green-700 font-semibold hover:underline"
                        >
                          Termos de Uso
                        </Link>
                        {' '}e{' '}
                        <Link 
                          href="/politica-privacidade" 
                          target="_blank"
                          className="text-green-600 hover:text-green-700 font-semibold hover:underline"
                        >
                          Política de Privacidade
                        </Link>
                      </label>
                    </div>
                  )}
                />
                {errors.acceptTerms && (
                  <p className="text-sm text-red-600 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.acceptTerms.message}
                  </p>
                )}
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900 mb-1">Seus dados estão protegidos</p>
                  <p className="text-green-700">
                    Utilizamos criptografia de ponta a ponta para garantir a segurança das suas informações
                  </p>
                </div>
              </div>

              {/* Botão Submit */}
              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all group"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Criando conta...
                  </>
                ) : (
                  <>
                    Criar minha conta
                    <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <Link 
                href="/login" 
                className="text-green-600 hover:text-green-700 font-bold hover:underline transition-all" 
                data-testid="link-login"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
