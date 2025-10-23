import { GoogleGenAI, Type } from "@google/genai";
import { NutriScore } from "../types";

// We will initialize the AI client lazily to prevent the app from crashing on load
// if the API_KEY environment variable is not available.
let ai: GoogleGenAI;

function getAiClient() {
    if (!ai) {
        // The API key is expected to be available as process.env.API_KEY.
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            // This error will be shown if the API_KEY environment variable is not set.
            throw new Error("API-Schlüssel nicht konfiguriert. Bitte stellen Sie sicher, dass die Umgebungsvariable 'API_KEY' in Ihren Projekteinstellungen (z.B. bei Vercel) gesetzt ist. Sie können die Funktionalität Ihres Schlüssels auch im Einstellungsmenü der App testen.");
        }
        ai = new GoogleGenAI({ apiKey });
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
    const gemini = getAiClient(); // Initialize and get the client here

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
    // Re-throw the original error to allow the UI to display specific messages
    if (error instanceof Error) {
        throw error;
    }
    // Fallback for non-Error throws
    throw new Error("Could not analyze image with AI. Please try again or enter details manually.");
  }
};