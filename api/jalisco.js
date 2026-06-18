export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    placa             = '',
    numeroSerie       = '',
    numeroMotor       = '',
    nombrePropietario = '',
  } = req.body ?? {}

  const params = new URLSearchParams({
    origen:            'normal',
    accion:            'getAdeudos',
    placa,
    numeroSerie,
    numeroMotor,
    nombrePropietario,
  })

  const upstream = await fetch(
    'https://gobiernoenlinea1.jalisco.gob.mx/serviciosVehiculares/adeudos',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://gobiernoenlinea1.jalisco.gob.mx/serviciosVehiculares/adeudos',
        'User-Agent': 'Mozilla/5.0',
      },
      body: params,
    }
  )

  const html = await upstream.text()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
