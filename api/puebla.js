const BASE = 'https://rl.puebla.gob.mx'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { placa = '', serie = '', folio = '' } = req.body ?? {}

  const params = new URLSearchParams({
    placa:       placa.trim().toUpperCase(),
    numeroserie: serie.trim().toUpperCase(),
    folio:       folio.trim(),
  })

  const upstream = await fetch(
    `${BASE}/api/ControlVehicular/ConsultaPagos?${params}`,
    {
      headers: {
        'Accept':     'application/json',
        'Referer':    `${BASE}/PagosVehiculo`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }
  )

  const data = await upstream.json()
  res.status(upstream.status).json(data)
}
