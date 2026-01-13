
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getLocationDescription(lat: number, lng: number): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Descreva brevemente este local baseado nas coordenadas Latitude: ${lat}, Longitude: ${lng}. Se não for possível ser específico, diga apenas a região aproximada. Responda em uma frase curta em português.`,
    });
    return response.text?.trim() || "Localização desconhecida";
  } catch (error) {
    console.error("Erro ao obter descrição do local:", error);
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  }
}
