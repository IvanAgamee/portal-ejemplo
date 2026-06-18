export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { niv = '', placa = '' } = req.body ?? {}

  const params = new URLSearchParams({ niv, placa })

  const upstream = await fetch(
    'https://a-tenenciaonline.sefintlax.gob.mx/TenenciaEnLinea/consultar_tenencia/resultados',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://a-tenenciaonline.sefintlax.gob.mx/TenenciaEnLinea/consultar_tenencia/',
        'User-Agent': 'Mozilla/5.0',
      },
      body: params,
    }
  )

  const html = await upstream.text()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
