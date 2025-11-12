import { useState } from "react";
import { Shield, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CheckboxCaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export function CheckboxCaptcha({ onVerify }: CheckboxCaptchaProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCheck = (checked: boolean) => {
    setIsChecked(checked);
    
    if (checked) {
      // Simula um pequeno delay de "verificação"
      setTimeout(() => {
        setShowSuccess(true);
        onVerify(true);
      }, 300);
    } else {
      setShowSuccess(false);
      onVerify(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-gray-900 font-semibold text-base flex items-center gap-2">
        <Shield className="h-4 w-4 text-green-600" />
        Verificação de Segurança
      </Label>
      
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 border-2 rounded-xl p-5 transition-all ${
        showSuccess ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <Checkbox
            id="robot-check"
            checked={isChecked}
            onCheckedChange={handleCheck}
            className={`h-6 w-6 ${showSuccess ? 'border-green-600' : ''}`}
            data-testid="checkbox-captcha"
          />
          <label
            htmlFor="robot-check"
            className="text-base font-medium text-gray-900 cursor-pointer select-none flex-1"
          >
            Não sou um robô
          </label>
          
          {showSuccess && (
            <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-right-2">
              <Check className="h-5 w-5" />
              <span className="text-sm font-semibold">Verificado</span>
            </div>
          )}
        </div>
        
        {!showSuccess && (
          <p className="text-xs text-gray-500 mt-3 ml-10">
            Marque a caixa para confirmar que você não é um robô
          </p>
        )}
      </div>
    </div>
  );
}
