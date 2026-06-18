// URL del portal de tenencia vehicular de Chiapas (ASP.NET)
const BASE_URL = 'https://soluciones.finanzaschiapas.gob.mx/liquidacion_vehicular/default.aspx'

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

// Busca el valor de un campo oculto dentro del HTML de una página ASP.NET.
// ASP.NET guarda información del estado del servidor en campos como __VIEWSTATE
// que el formulario debe devolver tal cual en cada POST.
function extractField(html, name) {
  const re = new RegExp(`name="${name}"[^>]*value="([^"]*)"`)
  return (html.match(re) || [])[1] ?? ''
}

// Función principal que Vercel ejecuta cuando llega una petición a /api/chiapas.
// Recibe placa y tipo de vehículo desde el frontend y devuelve el HTML del resultado.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { placa = '', tipoVehiculo = '1' } = req.body ?? {}

  // Paso 1: cargar la página del portal para obtener las cookies de sesión
  // y los campos ocultos que ASP.NET exige en el siguiente POST.
  const step1 = await fetch(BASE_URL, {
    headers: {
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9',
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  const cookieHeader = extractCookies(step1.headers)
  const html1        = await step1.text()

  // Extraer los tres tokens que ASP.NET requiere para validar que el POST
  // viene de su propio formulario y no de una petición externa.
  const viewState      = extractField(html1, '__VIEWSTATE')
  const viewStateGen   = extractField(html1, '__VIEWSTATEGENERATOR')
  const eventValidation = extractField(html1, '__EVENTVALIDATION')

  // Si no se pudo obtener el ViewState, el portal no respondió correctamente.
  if (!viewState) {
    return res.status(500).json({ error: 'No se pudo obtener el estado del formulario de Chiapas' })
  }

  // Paso 2: enviar la consulta real con la placa, el tipo de vehículo
  // y todos los tokens que el portal ASP.NET espera recibir.
  const body = new URLSearchParams({
    '__LASTFOCUS':                             '',
    '__EVENTTARGET':                           '',
    '__EVENTARGUMENT':                         '',
    '__VIEWSTATE':                             viewState,
    '__VIEWSTATEGENERATOR':                    viewStateGen,
    '__EVENTVALIDATION':                       eventValidation,
    'ctl00$main_holder$drp_TipoVehiculo':      tipoVehiculo,
    'ctl00$main_holder$drp_Filtro':            '1',
    'ctl00$main_holder$txt_Serie':             '',
    'ctl00$main_holder$txt_Modelo':            '',
    'ctl00$main_holder$txt_RFC':               '',
    'ctl00$main_holder$txt_Placa':             placa.trim().toUpperCase(),
    'ctl00$main_holder$btn_Liquidacion':       'Liquidación 2026',
  })

  const step2 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/x-www-form-urlencoded',
      'Cookie':          cookieHeader,
      'Referer':         BASE_URL,
      'Origin':          'https://soluciones.finanzaschiapas.gob.mx',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9',
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: body.toString(),
  })

  // Devolver el HTML del resultado directamente al frontend para que lo parsee.
  const html2 = await step2.text()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html2)
}
