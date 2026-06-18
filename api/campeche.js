export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { placa = '', serie = '' } = req.body ?? {}

  const params = new URLSearchParams({ placa: placa.toUpperCase(), serie: serie.toUpperCase() })

  const upstream = await fetch(
    `https://api-miportal-siaf.seafi.campeche.gob.mx/padrones/tramite/1?${params}`,
    {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://miportal-siaf.seafi.campeche.gob.mx/',
        'User-Agent': 'Mozilla/5.0',
      },
    }
  )

  const data = await upstream.json()
  res.status(200).json(data)
}
