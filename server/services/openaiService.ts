import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get a response from OpenAI
export async function getOpenAIResponse(
  message: string,
  context: string = "You are a helpful AI assistant."
): Promise<{ success: boolean; answer?: string; error?: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: "OpenAI API key is not configured.",
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: context,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = response.choices[0].message.content?.trim();

    return {
      success: true,
      answer: answer || "I'm not sure how to respond to that.",
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);

    return {
      success: false,
      error: `Error getting response from OpenAI: ${error.message}`,
    };
  }
}