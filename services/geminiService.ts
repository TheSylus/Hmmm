import { GoogleGenAI, Type } from "@google/genai";
import { NutriScore } from "../types";

let ai: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

function getApiKey(): string {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (!storedApiKey) {
        throw new Error("API-Schlüssel nicht im lokalen Speicher gefunden. Bitte geben Sie einen Schlüssel ein.");
    }
    return storedApiKey;
}

function getAiClient() {
    const apiKey = getApiKey();
    // Re-initialize the client only if the key has changed
    if (!ai || apiKey !== currentApiKey) {
        ai = new GoogleGenAI({ apiKey });
        currentApiKey = apiKey;
    }
    return ai;
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const analyzeFoodImage = async (base64Image: string): Promise<{ name: string; tags: string[]; nutriScore?: NutriScore; boundingBox?: BoundingBox }> => {
  const match = base64Image.match(/^data:(image\/[a-z]+);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid base64 image string.");
  }
  const mimeType = match[1];
  const data = match[2];

  try {
    const gemini = getAiClient();

    const imagePart = {
      inlineData: {
        mimeType,
        data,
      },
    };

    const textPart = {
      text: "Analyze this image of a food product. Identify the product's full name, provide up to 5 relevant tags, and find the Nutri-Score (A-E). Also, identify the primary food product in the image and return its bounding box. The bounding box should be an object with 'x', 'y', 'width', and 'height' properties, where each value is normalized between 0.0 and 1.0 (e.g., x=0.25 means 25% from the left edge). If any field is not found, return null for it. Return a single JSON object.",
    };

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The full name of the product as seen on the label.",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of relevant tags for the product.",
            },
            nutriScore: {
              type: Type.STRING,
              description: "The Nutri-Score rating (A, B, C, D, or E) if visible. Null if not found.",
            },
            boundingBox: {
              type: Type.OBJECT,
              description: "Normalized bounding box of the main product.",
              properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
              }
            }
          },
          required: ["name", "tags"],
        },
      },
    });
    
    const jsonString = response.text;
    const result = JSON.parse(jsonString);
    
    // Validate Nutri-Score before returning
    const validScores: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];
    if (result.nutriScore && !validScores.includes(result.nutriScore.toUpperCase())) {
      result.nutriScore = null;
    }
    
    return result;

  } catch (error) {
    console.error("Error analyzing food image:", error);
    if (error instanceof Error) {
        // Provide a more user-friendly error for invalid keys
        if (error.message.includes('API key not valid')) {
            throw new Error('Der gespeicherte API-Schlüssel ist ungültig. Bitte geben Sie einen neuen in den Einstellungen ein.');
        }
        throw error;
    }
    throw new Error("Bild konnte nicht mit KI analysiert werden. Bitte versuchen Sie es erneut oder geben Sie die Details manuell ein.");
  }
};