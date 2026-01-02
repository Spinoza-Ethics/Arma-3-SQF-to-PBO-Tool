
import { GoogleGenAI, Type } from "@google/genai";
import { ModConfig, SQFFile } from "../types";

// Service for generating Arma 3 mod metadata using Gemini
export const generateModMetadata = async (files: SQFFile[], config: ModConfig) => {
  // Instantiate GoogleGenAI inside the function to ensure it uses the current API key from process.env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fileSummary = files.map(f => `${f.name} (${f.type})`).join(', ');
  
  const prompt = `
    I am creating an Arma 3 mod. 
    Mod Name: ${config.name}
    Author: ${config.author}
    Files: ${fileSummary}

    Please generate a professional description for the Steam Workshop and a valid config.cpp structure for this mod.
    The config.cpp should include CfgPatches and CfgFunctions if applicable.
    Assume the tag is "${config.tag}".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini failed:", error);
    return "Failed to generate metadata.";
  }
};

// Suggests a valid Arma 3 function name based on filename and content
export const suggestFunctionNames = async (fileName: string, content: string): Promise<string> => {
    // Instantiate GoogleGenAI inside the function to ensure it uses the current API key from process.env
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Suggest a short, descriptive Arma 3 function name for an SQF file named "${fileName}". 
    Content snippet: ${content.substring(0, 500)}
    Return ONLY the function name (e.g., spawnVehicle).`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        return response.text.trim().replace(/[^a-zA-Z0-9_]/g, '');
    } catch {
        return fileName.split('.')[0];
    }
}
