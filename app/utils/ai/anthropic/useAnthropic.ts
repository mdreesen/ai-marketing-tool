export async function useAnthropic(
    messages: Array<any>
): Promise<string | null> {
  try {
    const res = await $fetch<any>('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': `${process.env.ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: {
        model: 'claude-3-5-haiku-latest',
        max_tokens: 150,
        messages: messages
      }
    })
    const text = res?.content?.find((b: any) => b.type === 'text')?.text
    return typeof text === 'string' && text.trim() ? text.trim() : null
  } catch (err) {
    console.error('Anthropic narration failed, using deterministic headline:', err)
    return null
  }
}