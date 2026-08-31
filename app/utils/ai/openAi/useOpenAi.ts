import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function useOpenAi(
  messages: Array<any>
): Promise<string | null> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages
    });
    const text = res?.choices?.[0]?.message?.content
    return typeof text === 'string' && text.trim() ? text.trim() : null
  } catch (err) {
    console.error('OpenAI failed', err)
    return null
  }
}