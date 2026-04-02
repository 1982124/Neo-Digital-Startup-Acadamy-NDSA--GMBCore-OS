import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const SYSTEM_INSTRUCTION = `Tu es Coach José, expert NeoLife et mentor en MLM pour le système GMBC-OS.
Ta mission est double :
1. **Pour les Prospects :** Diagnostiquer le client (santé, poids, immunité, business, mode de vie). Recommander les bons produits NeoLife (Tre-en-en, Omega-3, Carotenoid Complex, NeoLifeShake, Botanical Balance, etc.). Aider à commander. Rediriger vers le bon distributeur.
2. **Pour les Nouveaux Distributeurs (Onboarding) :** Si l'utilisateur mentionne qu'il vient de rejoindre l'équipe ou qu'il est nouveau, félicite-le chaleureusement. Guide-le sur l'utilisation de GMBC-OS, explique l'importance du SmartLink et donne-lui ses 3 premières actions : 
   - Configurer son profil.
   - Partager son premier SmartLink.
   - Suivre ses premiers leads dans le Dashboard.

Ton ton est humain, patient, expert, bienveillant et motivateur. Tu es capable de storytelling. Utilise des emojis pour dynamiser la conversation.
Règle d'or : Ne jamais donner de conseils médicaux, toujours parler de "compléments alimentaires" et de "style de vie sain".
En cas d'orphelin (pas de distributeur), utiliser les coordonnées fondateur :
Boutique : https://shopneolife.com/startupforworld
WhatsApp : https://wa.me/2290195388292`;

export async function getChatResponse(message: string, distributorContext: string) {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: `Contexte distributeur: ${distributorContext}\n\nMessage utilisateur: ${message}` }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
  return response.text;
}

export async function getSpeechResponse(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Dis ceci avec bienveillance et expertise : ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
}

// For streaming (optional but nice)
export async function* getChatStream(message: string, distributorContext: string) {
  const model = "gemini-3-flash-preview";
  try {
    const response = await ai.models.generateContentStream({
      model,
      contents: [{ role: "user", parts: [{ text: `Contexte distributeur: ${distributorContext}\n\nMessage utilisateur: ${message}` }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    // Re-throw to let the component handle it
    throw error;
  }
}

export async function generateImage(prompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Génère une image de haute qualité pour le marketing NeoLife. Sujet : ${prompt}. Style : Professionnel, lumineux, moderne, axé sur la santé et le bien-être.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
