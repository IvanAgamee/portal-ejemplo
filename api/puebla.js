export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { placa = '', serie = '' } = req.body ?? {}

  const upstream = await fetch(
    'https://rl.puebla.gob.mx/api/AdeudoVehicular/CheckDebt',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': 'https://rl.puebla.gob.mx/AdeudoVehicular',
        'User-Agent': 'Mozilla/5.0',
      },
      body: JSON.stringify({ placa, serie, captcha: '' }),
    }
  )

  const data = await upstream.json()
  res.status(200).json(data)
}
