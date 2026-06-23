// Endpoints del portal de tenencia de Guerrero. 
const BUSCA_VEH = 'https://esefina.ingresos-guerrero.gob.mx/Tenencia/ModuloExterno/BuscaVeh.php'
const REFERER   = 'https://esefina.ingresos-guerrero.gob.mx/Tenencia/ModuloExterno/'

// X-Requested-With indica al servidor PHP que es una petición AJAX
const HEADERS = {
  'Content-Type':    'application/x-www-form-urlencoded',
  'Referer':         REFERER,
  'Origin':          'https://esefina.ingresos-guerrero.gob.mx',
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { placa = '', serie = '' } = req.body ?? {}
  const base = {
    serie: serie.trim().toUpperCase(),
    placa: placa.trim().toUpperCase(),
  }

  // Verifica si el vehículo tiene adeudos o liquidaciones.
  // Si el portal responde con error == 1, el vehículo no existe y se detiene la consulta.
  const r1 = await fetch(BUSCA_VEH, {
    method: 'POST',
    headers: HEADERS,
    body: new URLSearchParams({ ...base, opcion: '2' }).toString(),
  })
  const data1 = await r1.json()

  if (data1.error == 1) {
    return res.status(200).json({ encontrado: false, mensaje: data1.mensaje })
  }

  // Obtiene los datos generales del vehículo (marca, modelo, año, etc.).
  // Solo se ejecuta si el paso anterior confirmó que el vehículo existe.
  const r2 = await fetch(BUSCA_VEH, {
    method: 'POST',
    headers: HEADERS,
    body: new URLSearchParams({ ...base, opcion: '1' }).toString(),
  })
  const data2 = await r2.json()

  res.status(200).json({
    encontrado:  true,
    liquidacion: data1.Liquidacion ?? [],
    mensajeHtml: data1.mensaje ?? '',
    vehiculo:    data2,
  })
}
