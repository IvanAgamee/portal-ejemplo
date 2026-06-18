// URL base del portal tributario de Zacatecas
const BASE = 'https://portaltributario.zacatecas.gob.mx'

// Función principal que Vercel ejecuta cuando llega una petición a /api/zacatecas.
// Recibe placa y VIN (número de serie) desde el frontend y devuelve el JSON del portal.
// A diferencia de otros estados, Zacatecas expone una API REST directa:
// no requiere sesión previa ni tokens, solo un GET con los datos en la URL.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { placa = '', vin = '' } = req.body ?? {}

  // Construir la URL de consulta con placa y VIN codificados.
  // El tercer parámetro "false" indica que no es una consulta de pago.
  const url = `${BASE}/api/vehicular/calculoVehicular/${encodeURIComponent(placa.trim().toUpperCase())}/${encodeURIComponent(vin.trim().toUpperCase())}/false`

  const upstream = await fetch(url, {
    headers: {
      'Accept':     'application/json',
      'Referer':    `${BASE}/vehicular/presupuestoTenencia.jsp`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  // Reenviar el JSON al frontend conservando el status original del portal:
  // 400 significa que la placa/VIN no fueron encontrados, 200 que sí.
  const data = await upstream.json()
  res.status(upstream.status).json(data)
}
