export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { placa = '', serie = '' } = req.body ?? {}

  const params = new URLSearchParams({ placa, serie })

  const upstream = await fetch(
    'https://siox.finanzasoaxaca.gob.mx/pagoTenencia/busquedaVehiculo.htm',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://siox.finanzasoaxaca.gob.mx/pagoTenencia',
        'User-Agent': 'Mozilla/5.0',
      },
      body: params,
    }
  )

  const html = await upstream.text()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
