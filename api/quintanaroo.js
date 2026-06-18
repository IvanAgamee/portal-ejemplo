const BUSCAR = 'https://satq.qroo.gob.mx/controlvehicular/rec/buscar.php'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { placa = '', folio = '' } = req.body ?? {}

  // Step 1: POST to buscar.php — PHP validates plate+folio, stores in session, then JS-redirects
  const step1 = await fetch(BUSCAR, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer':      'https://satq.qroo.gob.mx/controlvehicular/',
      'User-Agent':   'Mozilla/5.0',
    },
    body: new URLSearchParams({
      Placa:          placa.toUpperCase(),
      Serie_Corta:    folio,
      tipo_servicio:  'tenencia',
      opcion_prg:     'referencias',
    }).toString(),
  })

  // The PHP session cookie (CONTROLVEHICULAR_REC) is the first Set-Cookie header
  const cookieHeader = (step1.headers.get('set-cookie') ?? '').split(';')[0]
  const html1 = await step1.text()

  // Extract the JS window.location redirect target
  const m = html1.match(/window\.location\s*=\s*["']([^"']+)["']/)
  if (!m) return res.status(500).json({ error: 'Respuesta inesperada del portal' })

  if (m[1].includes('no_pasa')) {
    return res.status(200).json({ encontrado: false })
  }

  // Step 2: GET the success page with the PHP session cookie so it can read the stored result
  const successUrl = new URL(m[1], BUSCAR).href
  const step2 = await fetch(successUrl, {
    headers: {
      'Cookie':     cookieHeader,
      'Referer':    BUSCAR,
      'User-Agent': 'Mozilla/5.0',
    },
  })

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(await step2.text())
}
