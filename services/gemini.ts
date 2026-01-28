
import { GoogleGenAI } from "@google/genai";

export async function getFinancialAdvice(query: string, balance: number) {
  try {
    // Инициализация внутри функции гарантирует, что process.env доступен в момент вызова
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Ты — ИИ-ассистент банка NAEB. Баланс: ${balance} ₽. Юзер: "${query}". Дай совет в 1 предложении.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Связь с квантовым ядром прервана.";
  }
}
