// URL del portal de refrendo digital vehicular de Michoacán (PHP)
const BASE_URL = 'https://refrendodigital.michoacan.gob.mx/'

// Extrae las cookies de la cabecera Set-Cookie de una respuesta HTTP.
// El portal puede enviar varias cookies (sesión + balanceo AWS) separadas por coma;
// hay que dividirlas correctamente y quedarse solo con el par nombre=valor.
function extractCookies(headers) {
  const raw = headers.get('set-cookie') ?? ''
  if (!raw) return ''
  // Dividir en coma solo cuando va seguida del inicio de una nueva cookie (nombre=)
  return raw
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
    .map(c => c.split(';')[0].trim())
    .join('; ')
}

// Función principal que Vercel ejecuta cuando llega una petición a /api/michoacan.
// Recibe placa y número de serie desde el frontend y devuelve el HTML del resultado.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { placa = '', serie = '' } = req.body ?? {}

  // Paso 1: cargar la página del portal para obtener dos cosas:
  //   - Las cookies de sesión que identifican al visitante.
  //   - El token CSRF, que el portal genera por visita para evitar que
  //     terceros envíen formularios sin haber cargado la página primero.
  const step1 = await fetch(BASE_URL, {
    headers: {
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9',
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  const cookieHeader = extractCookies(step1.headers)
  const html1 = await step1.text()

  // Buscar el campo oculto csrf_token dentro del HTML del formulario.
  // El portal PHP lo inyecta en cada carga de página con un valor único.
  const inputTag = html1.match(/<input[^>]+name="csrf_token"[^>]*>/)
  const csrfToken = inputTag?.[0].match(/value="([^"]+)"/)?.[1]
  if (!csrfToken) {
    return res.status(500).json({ error: 'No se pudo obtener el token CSRF del portal de Michoacán' })
  }

  // Paso 2: enviar la consulta con la placa, el número de serie,
  // las cookies de sesión y el token CSRF obtenidos en el paso anterior.
  const step2 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Cookie':        cookieHeader,
      'Referer':       BASE_URL,
      'Origin':        'https://refrendodigital.michoacan.gob.mx',
      'Accept':        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9',
      'User-Agent':    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: new URLSearchParams({
      placa:                    placa.trim().toUpperCase(),
      serie:                    serie.trim().toUpperCase(),
      csrf_token:               csrfToken,
      'g-recaptcha-response':   '', // el portal lo valida del lado del servidor; se envía vacío
      mos:                      '1',
      token:                    '',
    }).toString(),
  })

  // Devolver el HTML del resultado directamente al frontend para que lo parsee.
  const html2 = await step2.text()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html2)
}
