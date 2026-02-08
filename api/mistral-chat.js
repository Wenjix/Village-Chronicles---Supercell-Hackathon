const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'
const DEFAULT_MODEL = 'mistral-small-latest'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing server env MISTRAL_API_KEY' })
  }

  let payload
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const messages = Array.isArray(payload?.messages) ? payload.messages : null
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] is required' })
  }

  const model = payload?.model || process.env.MISTRAL_MODEL || DEFAULT_MODEL
  const maxTokens = Number.isFinite(payload?.max_tokens) ? payload.max_tokens : 200
  const temperature = Number.isFinite(payload?.temperature) ? payload.temperature : 0.85

  try {
    const upstream = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => upstream.statusText)
      return res.status(upstream.status).json({ error: errText || 'Mistral API error' })
    }

    const data = await upstream.json()
    const content = data?.choices?.[0]?.message?.content?.trim?.() || ''
    return res.status(200).json({ content })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Proxy request failed' })
  }
}
