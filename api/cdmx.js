const BASE = 'https://data.finanzas.cdmx.gob.mx'

function extractCookies(headers) {
  const raw = headers.get('set-cookie') ?? ''
  if (!raw) return ''
  return raw
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
    .map(c => c.split(';')[0].trim())
    .join('; ')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, placa = '', captchaCode = '', sessionToken = '' } = req.body ?? {}

  if (action === 'init') {
    const pageRes = await fetch(`${BASE}/consulta_adeudos`, {
      headers: {
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9',
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })

    const cookies    = extractCookies(pageRes.headers)
    const html       = await pageRes.text()
    const csrf       = html.match(/csrf-token" content="([^"]+)"/)?.[1] ?? ''
    const captchaUrl = html.match(/src="(https:\/\/data\.finanzas\.cdmx\.gob\.mx\/captcha\/flat\?[^"]+)"/)?.[1] ?? ''

    if (!csrf || !captchaUrl) {
      return res.status(500).json({ error: 'No se pudo cargar el portal de CDMX.' })
    }

    const imgRes = await fetch(captchaUrl, {
      headers: {
        'Cookie':     cookies,
        'Referer':    `${BASE}/consulta_adeudos`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })

    const imgBuffer = await imgRes.arrayBuffer()
    const imgBase64 = Buffer.from(imgBuffer).toString('base64')

    const token = Buffer.from(JSON.stringify({ cookies, csrf })).toString('base64')

    return res.status(200).json({
      captchaImage: `data:image/png;base64,${imgBase64}`,
      sessionToken: token,
    })
  }

  if (action === 'consulta') {
    let cookies, csrf
    try {
      ;({ cookies, csrf } = JSON.parse(Buffer.from(sessionToken, 'base64').toString()))
    } catch {
      return res.status(400).json({ error: 'Sesión inválida. Recarga el captcha.' })
    }

    const body = new URLSearchParams({
      placa:        placa.trim().toUpperCase(),
      captcha_code: captchaCode.trim(),
    })

    const queryRes = await fetch(`${BASE}/consulta_adeudos/obtenAdeudos`, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/x-www-form-urlencoded; charset=UTF-8',
        'X-CSRF-TOKEN':    csrf,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer':         `${BASE}/consulta_adeudos`,
        'Cookie':          cookies,
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: body.toString(),
    })

    const data = await queryRes.json()
    return res.status(queryRes.status).json(data)
  }

  return res.status(400).json({ error: 'Acción no válida.' })
}
