export default async function handler(req, res) {
  const placa = req.query?.numero_de_placa_vigente ?? ''

  const url = `https://apifuncionarios.minayarit.gob.mx/recaudacion/vehiculos-public/?numero_de_placa_vigente=${encodeURIComponent(placa)}`

  const upstream = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  const data = await upstream.json()
  res.status(200).json(data)
}
