
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getFinancialAdvice(query: string, balance: number) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Ты — ИИ-ассистент банка NAEB (версия iOS 26). 
      Текущий баланс пользователя: ${balance} ₽. 
      Пользователь спрашивает: "${query}". 
      Дай краткий, современный и футуристичный финансовый совет на русском языке (максимум 2 предложения).`,
    });
    // Use the .text property directly as per guidelines.
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Произошла ошибка квантового соединения. Попробуйте позже.";
  }
}
