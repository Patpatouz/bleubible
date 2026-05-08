import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// Always use process.env.GEMINI_API_KEY in Vite projects for AI Studio
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ExplanationResponse {
  summary: string;
  historicalContext: string;
  application: string;
}

export interface RecommendationResponse {
  verses: {
    reference: string;
    text: string;
  }[];
  explanation: string;
  readingPlanId?: string;
}

export interface PrayerResponse {
  title: string;
  prayer: string;
  verses: {
    reference: string;
    text: string;
  }[];
}

export interface StudyAidResponse {
  crossReferences: {
    reference: string;
    text: string;
    reason: string;
  }[];
  keyTerms: {
    term: string;
    definition: string;
  }[];
  theologyInsights: string;
}

export const geminiService = {
  /**
   * Get advanced study context for a specific chapter or range
   */
  getStudyContext: async (reference: string, text: string): Promise<StudyAidResponse> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide advanced study tools for the following Bible text:
Reference: ${reference}
Text: ${text}

Include:
1. 3-5 Cross-references (other relevant verses) with a brief reason why they correlate.
2. 3-5 Key terms or names found in the text with their biblical definitions or significance.
3. A section on theological insights and deeper meanings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crossReferences: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    reference: { type: Type.STRING },
                    text: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["reference", "text", "reason"]
                }
              },
              keyTerms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  },
                  required: ["term", "definition"]
                }
              },
              theologyInsights: { type: Type.STRING }
            },
            required: ["crossReferences", "keyTerms", "theologyInsights"]
          }
        }
      });

      return JSON.parse(response.text || "{}") as StudyAidResponse;
    } catch (error) {
      console.error("Gemini Study Context Error:", error);
      throw error;
    }
  },

  /**
   * Get an explanation for a specific verse
   */
  explainVerse: async (verseText: string, reference: string): Promise<ExplanationResponse> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain the following Bible verse in plain English, providing summary, historical context, and modern application.\n\nReference: ${reference}\nVerse: ${verseText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A plain English summary of the verse's meaning." },
              historicalContext: { type: Type.STRING, description: "The historical and cultural context of when this was written." },
              application: { type: Type.STRING, description: "How this verse applies to life today." }
            },
            required: ["summary", "historicalContext", "application"]
          }
        }
      });

      return JSON.parse(response.text || "{}") as ExplanationResponse;
    } catch (error) {
      console.error("Gemini Explain Verse Error:", error);
      throw error;
    }
  },

  /**
   * Get mood-based Bible recommendations
   */
  getMoodRecommendations: async (mood: string): Promise<RecommendationResponse> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The user is feeling: "${mood}". Recommend 3 relevant Bible verses and explain why they are helpful. Also suggest if there's a general topic/theme they should look for in reading plans.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    reference: { type: Type.STRING },
                    text: { type: Type.STRING }
                  },
                  required: ["reference", "text"]
                }
              },
              explanation: { type: Type.STRING, description: "Why these verses help with this specific mood." },
              readingPlanId: { type: Type.STRING, description: "The ID of a relevant reading plan if applicable (optional)." }
            },
            required: ["verses", "explanation"]
          }
        }
      });

      return JSON.parse(response.text || "{}") as RecommendationResponse;
    } catch (error) {
      console.error("Gemini Mood Recommendation Error:", error);
      throw error;
    }
  },

  /**
   * Generate a daily prayer based on user context or just a general uplifting one
   */
  /**
   * Generate a daily prayer based on user context or just a general uplifting one
   */
  generatePrayer: async (topic?: string): Promise<PrayerResponse> => {
    try {
      const prompt = topic 
        ? `Generate a heartfelt, scripturally-grounded daily prayer about: "${topic}". Include a title, the prayer itself, and 2-3 supporting Bible verses.`
        : `Generate a heartfelt, scripturally-grounded daily prayer for spiritual growth and peace. Include a title, the prayer itself, and 2-3 supporting Bible verses.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              prayer: { type: Type.STRING },
              verses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    reference: { type: Type.STRING },
                    text: { type: Type.STRING }
                  },
                  required: ["reference", "text"]
                }
              }
            },
            required: ["title", "prayer", "verses"]
          }
        }
      });

      return JSON.parse(response.text || "{}") as PrayerResponse;
    } catch (error) {
      console.error("Gemini Generate Prayer Error:", error);
      throw error;
    }
  },

  /**
   * Identifies Jesus' speech in a given Bible chapter text.
   * Returns a list of segments that are Jesus' speech.
   */
  detectJesusSpeech: async (reference: string, text: string): Promise<Record<string, string[]>> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Identify all the words spoken by Jesus in the following Bible text:
Reference: ${reference}
Text: ${text}

For each verse number, provide an array of strings representing the exact segments of text that are Jesus' speech. If a whole verse is his speech, include the whole text. If only part of a verse is his speech, include only that part. If no words in a verse are spoken by Jesus, omit that verse.

Return as an object mapping verse numbers (strings) to arrays of speech segments (strings).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            additionalProperties: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini Detect Jesus Speech Error:", error);
      throw error;
    }
  }
};
