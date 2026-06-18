// URLs del portal de adeudos vehiculares de Chihuahua (servidor Java/JSP).
// Son dos URLs distintas: la primera carga la página principal y genera la sesión,
// la segunda recibe la consulta por placa.
const PORTAL_URL = 'https://ipagos.chihuahua.gob.mx/consultas/adeudo/principal.jsp'
const QUERY_URL  = 'https://ipagos.chihuahua.gob.mx/consultas/adeudo/loginAdeudo.jsp'

// Extrae las cookies de la cabecera Set-Cookie de una respuesta HTTP.
// Es necesario porque el portal puede enviar varias cookies separadas por coma
// y hay que limpiar los atributos extra (Path, HttpOnly, etc.) para reenviarlas.
function extractCookies(headers) {
  const raw = headers.get('set-cookie') ?? ''
  if (!raw) return ''
  return raw
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
    .map(c => c.split(';')[0].trim())
    .join('; ')
}

// Función principal que Vercel ejecuta cuando llega una petición a /api/chihuahua.
// Recibe la placa desde el frontend y devuelve el HTML del resultado.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { placa = '' } = req.body ?? {}

  // Paso 1: cargar la página principal del portal para que el servidor Java
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

  // Paso 2: enviar la placa al portal usando la sesión obtenida en el paso anterior.
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

  // El portal responde en ISO-8859-1 (encoding antiguo). Si se envía tal cual,
  // los acentos y la ñ se verían como caracteres extraños en el navegador.
  // Se decodifica manualmente y se reenvía como UTF-8.
  const buffer = await step2.arrayBuffer()
  const html   = new TextDecoder('iso-8859-1').decode(buffer)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}
