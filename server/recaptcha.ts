/**
 * Google reCAPTCHA v3 Verification
 * Valida tokens do reCAPTCHA no backend
 */

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verifyRecaptcha(token: string, expectedAction?: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY não configurada");
    return false;
  }

  if (!token) {
    console.error("[reCAPTCHA] Token não fornecido");
    return false;
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      console.error("[reCAPTCHA] Verificação falhou:", data["error-codes"]);
      return false;
    }

    // reCAPTCHA v3 retorna um score de 0.0 a 1.0
    // 1.0 = muito provavelmente humano
    // 0.0 = muito provavelmente bot
    const score = data.score || 0;
    const minScore = 0.5; // Score mínimo aceitável

    if (score < minScore) {
      console.warn(`[reCAPTCHA] Score muito baixo: ${score} (mínimo: ${minScore})`);
      return false;
    }

    // Verificar se a ação corresponde (opcional)
    if (expectedAction && data.action !== expectedAction) {
      console.warn(`[reCAPTCHA] Ação incorreta. Esperado: ${expectedAction}, Recebido: ${data.action}`);
      return false;
    }

    console.log(`[reCAPTCHA] ✅ Verificação bem-sucedida - Score: ${score}`);
    return true;

  } catch (error) {
    console.error("[reCAPTCHA] Erro ao verificar token:", error);
    return false;
  }
}
