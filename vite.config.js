import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const QROO_BUSCAR = 'https://satq.qroo.gob.mx/controlvehicular/rec/buscar.php'

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

export default defineConfig({
  plugins: [vue(), quintanarooDevPlugin()],
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
