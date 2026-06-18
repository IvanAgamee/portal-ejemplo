import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const QROO_BUSCAR    = 'https://satq.qroo.gob.mx/controlvehicular/rec/buscar.php'
const MICH_BASE_URL  = 'https://refrendodigital.michoacan.gob.mx/'
const CHIH_PORTAL    = 'https://ipagos.chihuahua.gob.mx/consultas/adeudo/principal.jsp'
const CHIH_QUERY     = 'https://ipagos.chihuahua.gob.mx/consultas/adeudo/loginAdeudo.jsp'
const CHIAS_URL      = 'https://soluciones.finanzaschiapas.gob.mx/liquidacion_vehicular/default.aspx'
const ZACATECAS_BASE = 'https://portaltributario.zacatecas.gob.mx'

function extractCookiesDev(headers) {
  const raw = headers.get('set-cookie') ?? ''
  if (!raw) return ''
  return raw
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
    .map(c => c.split(';')[0].trim())
    .join('; ')
}

// Dev-server middleware for Quintana Roo: mirrors the two-step logic in api/quintanaroo.js
function quintanarooDevPlugin() {
  return {
    name: 'quintanaroo-dev',
    configureServer(server) {
      server.middlewares.use('/api/quintanaroo', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        let raw = ''
        req.on('data', c => { raw += c })
        req.on('end', async () => {
          try {
            const { placa = '', folio = '' } = JSON.parse(raw)

            const step1 = await fetch(QROO_BUSCAR, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer':      'https://satq.qroo.gob.mx/controlvehicular/',
                'User-Agent':   'Mozilla/5.0',
              },
              body: new URLSearchParams({
                Placa:         placa.toUpperCase(),
                Serie_Corta:   folio,
                tipo_servicio: 'tenencia',
                opcion_prg:    'referencias',
              }).toString(),
            })

            const cookieHeader = (step1.headers.get('set-cookie') ?? '').split(';')[0]
            const html1 = await step1.text()
            const m = html1.match(/window\.location\s*=\s*["']([^"']+)["']/)

            if (!m) {
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ error: 'Respuesta inesperada del portal' }))
            }
            if (m[1].includes('no_pasa')) {
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ encontrado: false }))
            }

            const step2 = await fetch(new URL(m[1], QROO_BUSCAR).href, {
              headers: { 'Cookie': cookieHeader, 'Referer': QROO_BUSCAR, 'User-Agent': 'Mozilla/5.0' },
            })
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(await step2.text())
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(e) }))
          }
        })
      })
    },
  }
}

function michoacanDevPlugin() {
  return {
    name: 'michoacan-dev',
    configureServer(server) {
      server.middlewares.use('/api/michoacan', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        let raw = ''
        req.on('data', c => { raw += c })
        req.on('end', async () => {
          try {
            const { placa = '', serie = '' } = JSON.parse(raw)

            const step1 = await fetch(MICH_BASE_URL, {
              headers: {
                'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-MX,es;q=0.9',
                'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            })

            const cookieHeader = extractCookiesDev(step1.headers)
            const html1 = await step1.text()

            const inputTag  = html1.match(/<input[^>]+name="csrf_token"[^>]*>/)
            const csrfToken = inputTag?.[0].match(/value="([^"]+)"/)?.[1]
            if (!csrfToken) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ error: 'No se pudo obtener CSRF token' }))
            }

            const step2 = await fetch(MICH_BASE_URL, {
              method: 'POST',
              headers: {
                'Content-Type':          'application/x-www-form-urlencoded',
                'Cookie':                cookieHeader,
                'Referer':               MICH_BASE_URL,
                'Origin':                'https://refrendodigital.michoacan.gob.mx',
                'Accept':                'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language':       'es-MX,es;q=0.9',
                'User-Agent':            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
              body: new URLSearchParams({
                placa:                  placa.trim().toUpperCase(),
                serie:                  serie.trim().toUpperCase(),
                csrf_token:             csrfToken,
                'g-recaptcha-response': '',
                mos:                    '1',
                token:                  '',
              }).toString(),
            })

            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(await step2.text())
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(e) }))
          }
        })
      })
    },
  }
}

function chihuahuaDevPlugin() {
  return {
    name: 'chihuahua-dev',
    configureServer(server) {
      server.middlewares.use('/api/chihuahua', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        let raw = ''
        req.on('data', c => { raw += c })
        req.on('end', async () => {
          try {
            const { placa = '' } = JSON.parse(raw)

            const step1 = await fetch(CHIH_PORTAL, {
              headers: {
                'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-MX,es;q=0.9',
                'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            })

            const cookieHeader = extractCookiesDev(step1.headers)

            const step2 = await fetch(CHIH_QUERY, {
              method: 'POST',
              headers: {
                'Content-Type':    'application/x-www-form-urlencoded',
                'Cookie':          cookieHeader,
                'Referer':         CHIH_PORTAL,
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

            const buffer = await step2.arrayBuffer()
            const html   = new TextDecoder('iso-8859-1').decode(buffer)

            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(html)
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(e) }))
          }
        })
      })
    },
  }
}

function chiapasDevPlugin() {
  return {
    name: 'chiapas-dev',
    configureServer(server) {
      server.middlewares.use('/api/chiapas', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        let raw = ''
        req.on('data', c => { raw += c })
        req.on('end', async () => {
          try {
            const { placa = '', tipoVehiculo = '1' } = JSON.parse(raw)

            const step1 = await fetch(CHIAS_URL, {
              headers: {
                'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-MX,es;q=0.9',
                'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            })

            const cookieHeader = extractCookiesDev(step1.headers)
            const html1        = await step1.text()

            const extractField = (html, name) => {
              const re = new RegExp(`name="${name}"[^>]*value="([^"]*)"`)
              return (html.match(re) || [])[1] ?? ''
            }

            const viewState       = extractField(html1, '__VIEWSTATE')
            const viewStateGen    = extractField(html1, '__VIEWSTATEGENERATOR')
            const eventValidation = extractField(html1, '__EVENTVALIDATION')

            if (!viewState) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ error: 'No se pudo obtener el estado del formulario' }))
            }

            const body = new URLSearchParams({
              '__LASTFOCUS':                          '',
              '__EVENTTARGET':                        '',
              '__EVENTARGUMENT':                      '',
              '__VIEWSTATE':                          viewState,
              '__VIEWSTATEGENERATOR':                 viewStateGen,
              '__EVENTVALIDATION':                    eventValidation,
              'ctl00$main_holder$drp_TipoVehiculo':   tipoVehiculo,
              'ctl00$main_holder$drp_Filtro':         '1',
              'ctl00$main_holder$txt_Serie':          '',
              'ctl00$main_holder$txt_Modelo':         '',
              'ctl00$main_holder$txt_RFC':            '',
              'ctl00$main_holder$txt_Placa':          placa.trim().toUpperCase(),
              'ctl00$main_holder$btn_Liquidacion':    'Liquidación 2026',
            })

            const step2 = await fetch(CHIAS_URL, {
              method: 'POST',
              headers: {
                'Content-Type':    'application/x-www-form-urlencoded',
                'Cookie':          cookieHeader,
                'Referer':         CHIAS_URL,
                'Origin':          'https://soluciones.finanzaschiapas.gob.mx',
                'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-MX,es;q=0.9',
                'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
              body: body.toString(),
            })

            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(await step2.text())
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(e) }))
          }
        })
      })
    },
  }
}

function zacatecasDevPlugin() {
  return {
    name: 'zacatecas-dev',
    configureServer(server) {
      server.middlewares.use('/api/zacatecas', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }
        let raw = ''
        req.on('data', c => { raw += c })
        req.on('end', async () => {
          try {
            const { placa = '', vin = '' } = JSON.parse(raw)
            const url = `${ZACATECAS_BASE}/api/vehicular/calculoVehicular/${encodeURIComponent(placa.trim().toUpperCase())}/${encodeURIComponent(vin.trim().toUpperCase())}/false`
            const upstream = await fetch(url, {
              headers: {
                'Accept':     'application/json',
                'Referer':    `${ZACATECAS_BASE}/vehicular/presupuestoTenencia.jsp`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            })
            const data = await upstream.json()
            res.statusCode = upstream.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(e) }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), quintanarooDevPlugin(), michoacanDevPlugin(), chihuahuaDevPlugin(), chiapasDevPlugin(), zacatecasDevPlugin()],
  server: {
    proxy: {
      '/api/oaxaca': {
        target: 'https://siox.finanzasoaxaca.gob.mx',
        changeOrigin: true,
        rewrite: () => '/pagoTenencia/busquedaVehiculo.htm',
        headers: { Referer: 'https://siox.finanzasoaxaca.gob.mx/pagoTenencia' },
      },
      '/api/jalisco': {
        target: 'https://gobiernoenlinea1.jalisco.gob.mx',
        changeOrigin: true,
        rewrite: () => '/serviciosVehiculares/adeudos',
        headers: { Referer: 'https://gobiernoenlinea1.jalisco.gob.mx/serviciosVehiculares/adeudos' },
      },
      '/api/nayarit': {
        target: 'https://apifuncionarios.minayarit.gob.mx',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/nayarit', '/recaudacion/vehiculos-public'),
      },
      '/api/puebla': {
        target: 'https://rl.puebla.gob.mx',
        changeOrigin: true,
        rewrite: () => '/api/AdeudoVehicular/CheckDebt',
        headers: { Referer: 'https://rl.puebla.gob.mx/AdeudoVehicular' },
      },
      '/api/tlaxcala': {
        target: 'https://a-tenenciaonline.sefintlax.gob.mx',
        changeOrigin: true,
        rewrite: () => '/TenenciaEnLinea/consultar_tenencia/resultados',
        headers: { Referer: 'https://a-tenenciaonline.sefintlax.gob.mx/TenenciaEnLinea/consultar_tenencia/' },
      },
      '/api/campeche': {
        target: 'https://api-miportal-siaf.seafi.campeche.gob.mx',
        changeOrigin: true,
        rewrite: (path, req) => {
          const url = new URL('http://x' + req.url)
          const placa = (url.searchParams.get('placa') || '').toUpperCase()
          const serie = (url.searchParams.get('serie') || '').toUpperCase()
          return `/padrones/tramite/1?placa=${encodeURIComponent(placa)}&serie=${encodeURIComponent(serie)}`
        },
        headers: { Referer: 'https://miportal-siaf.seafi.campeche.gob.mx/' },
      },
    },
  },
})
