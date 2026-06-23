// URLs del portal de adeudos vehiculares de Chihuahua (servidor Java/JSP).

// Carga la página principal y genera la sesión
const PORTAL_URL = 'https://ipagos.chihuahua.gob.mx/consultas/adeudo/principal.jsp'
// Recibe la consulta por placa.
const QUERY_URL  = 'https://ipagos.chihuahua.gob.mx/consultas/adeudo/loginAdeudo.jsp'

// Extrae las cookies de la cabecera Set-Cookie de una respuesta HTTP.
function extractCookies(headers) {
  const raw = headers.get('set-cookie') ?? ''
  if (!raw) return ''
  return raw
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
    .map(c => c.split(';')[0].trim())
    .join('; ')
}

// Recibe la placa desde el frontend y devuelve el HTML del resultado.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { placa = '' } = req.body ?? {}

  // Cargar la página principal del portal para que el servidor Java
  // genere una cookie de sesión (JSESSIONID). Sin ella, el POST siguiente
  // es rechazado porque el servidor no reconoce al visitante.
  const step1 = await fetch(PORTAL_URL, {
    headers: {
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9',
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  const cookieHeader = extractCookies(step1.headers)

  // Envia la placa al portal usando la sesión obtenida  
  const step2 = await fetch(QUERY_URL, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/x-www-form-urlencoded',
      'Cookie':          cookieHeader,
      'Referer':         PORTAL_URL,
      'Origin':          'https://ipagos.chihuahua.gob.mx',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9',
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: new URLSearchParams({
      noPlaca: placa.trim().toUpperCase(),
      Login:   'Entrar',
    }).toString(),
  })
  
  // Se decodifica manualmente y se reenvía como UTF-8.
  const buffer = await step2.arrayBuffer()
  const html   = new TextDecoder('iso-8859-1').decode(buffer)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
