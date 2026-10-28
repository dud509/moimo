/*
 * 모두가 같은 마을을 보도록 모이모를 모아 두는 곳 — Vercel 함수 + Upstash Redis.
 *
 *   GET    /api/moimo          마을에 있는 모이모 전부
 *   POST   /api/moimo          새 모이모 하나 { id, name, x, y, phase, at, note? }
 *   DELETE /api/moimo?id=…     하나 내보내기 — 헤더 x-admin 이 MOIMO_ADMIN 과 같아야 한다
 *
 * 유전자는 이름에서 늘 다시 계산하므로 저장하지 않는다.
 */
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'moimo:residents'

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  })
  const j = await r.json()
  if (j.error) throw new Error(j.error)
  return j.result
}

const num = (v) => typeof v === 'number' && Number.isFinite(v)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'store not connected' })
  try {
    if (req.method === 'GET') {
      const list = (await redis(['LRANGE', KEY, '0', '-1'])) || []
      return res.status(200).json(list.map((s) => JSON.parse(s)))
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
      const name = typeof b.name === 'string' ? b.name.trim().slice(0, 10) : ''
      if (typeof b.id !== 'string' || !name || !num(b.x) || !num(b.y)) return res.status(400).json({ error: 'bad resident' })
      const r = {
        id: b.id.slice(0, 40), name, x: b.x, y: b.y,
        phase: num(b.phase) ? b.phase : 0, at: Date.now(),
        ...(typeof b.note === 'string' && b.note.trim() ? { note: b.note.trim().slice(0, 40) } : {}),
      }
      await redis(['RPUSH', KEY, JSON.stringify(r)])
      return res.status(200).json(r)
    }
    if (req.method === 'DELETE') {
      if (!process.env.MOIMO_ADMIN || req.headers['x-admin'] !== process.env.MOIMO_ADMIN) return res.status(403).json({ error: 'forbidden' })
      const id = String(req.query.id || '')
      const list = (await redis(['LRANGE', KEY, '0', '-1'])) || []
      const hit = list.find((s) => JSON.parse(s).id === id)
      if (hit) await redis(['LREM', KEY, '1', hit])
      return res.status(200).json({ removed: !!hit })
    }
    return res.status(405).end()
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}
