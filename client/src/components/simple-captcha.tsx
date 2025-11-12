import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Shield } from "lucide-react";

interface SimpleCaptchaProps {
  onVerify: (isValid: boolean) => void;
  onReset?: () => void;
}

export function SimpleCaptcha({ onVerify, onReset }: SimpleCaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const generateNumbers = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer("");
    setIsVerified(false);
    onVerify(false);
    if (onReset) onReset();
  };

  useEffect(() => {
    generateNumbers();
  }, []);

  const handleVerify = () => {
    const correctAnswer = num1 + num2;
    const isCorrect = parseInt(userAnswer) === correctAnswer;
    setIsVerified(isCorrect);
    onVerify(isCorrect);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserAnswer(value);
    
    // Auto-verify if user enters a complete answer
    if (value.length > 0) {
      const correctAnswer = num1 + num2;
      const isCorrect = parseInt(value) === correctAnswer;
      if (isCorrect) {
        setIsVerified(true);
        onVerify(true);
      } else if (value.length >= correctAnswer.toString().length) {
        setIsVerified(false);
        onVerify(false);
      }
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-gray-900 font-semibold text-base flex items-center gap-2">
        <Shield className="h-4 w-4 text-green-600" />
        Verificação de Segurança
      </Label>
      
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Pergunta */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">Quanto é:</p>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm">
                {num1}
              </div>
              <span className="text-xl font-bold text-gray-600">+</span>
              <div className="text-2xl font-bold text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm">
                {num2}
              </div>
              <span className="text-xl font-bold text-gray-600">=</span>
              <Input
                type="number"
                value={userAnswer}
                onChange={handleInputChange}
                placeholder="?"
                className={`w-20 h-12 text-xl font-bold text-center border-2 transition-all ${
                  isVerified 
                    ? "border-green-500 bg-green-50" 
                    : userAnswer && !isVerified && userAnswer.length >= 2
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                data-testid="input-captcha"
              />
            </div>
          </div>

          {/* Botão de refresh */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={generateNumbers}
            className="hover-elevate active-elevate-2"
            data-testid="button-captcha-refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>

        {/* Status */}
        {isVerified && (
          <div className="mt-3 flex items-center gap-2 text-green-600 font-medium text-sm">
            <Shield className="h-4 w-4" />
            Verificação concluída com sucesso!
          </div>
        )}
        {userAnswer && !isVerified && userAnswer.length >= 2 && (
          <div className="mt-3 flex items-center gap-2 text-red-600 font-medium text-sm">
            <Shield className="h-4 w-4" />
            Resposta incorreta. Tente novamente.
          </div>
        )}
      </div>
    </div>
  );
}
