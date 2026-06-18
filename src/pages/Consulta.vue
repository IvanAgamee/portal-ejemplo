<script setup>
import { ref, computed, watch } from 'vue'

const ESTADOS = [
  { valor: 'aguascalientes',    nombre: 'Aguascalientes',      disponible: false },
  { valor: 'bajacalifornia',    nombre: 'Baja California',     disponible: false },
  { valor: 'bajacaliforniasur', nombre: 'Baja California Sur', disponible: false },
  { valor: 'campeche',          nombre: 'Campeche',            disponible: true  },
  { valor: 'chiapas',           nombre: 'Chiapas',             disponible: true  },
  { valor: 'chihuahua',         nombre: 'Chihuahua',           disponible: true  },
  { valor: 'cdmx',              nombre: 'Ciudad de México',    disponible: false },
  { valor: 'coahuila',          nombre: 'Coahuila',            disponible: false },
  { valor: 'colima',            nombre: 'Colima',              disponible: false },
  { valor: 'durango',           nombre: 'Durango',             disponible: false },
  { valor: 'guanajuato',        nombre: 'Guanajuato',          disponible: false },
  { valor: 'guerrero',          nombre: 'Guerrero',            disponible: false },
  { valor: 'hidalgo',           nombre: 'Hidalgo',             disponible: false },
  { valor: 'jalisco',           nombre: 'Jalisco',             disponible: true  },
  { valor: 'michoacan',         nombre: 'Michoacán',           disponible: true  },
  { valor: 'nayarit',           nombre: 'Nayarit',             disponible: true  },
  { valor: 'nuevoleon',         nombre: 'Nuevo León',          disponible: false },
  { valor: 'oaxaca',            nombre: 'Oaxaca',              disponible: true  },
  { valor: 'puebla',            nombre: 'Puebla',              disponible: true  },
  { valor: 'queretaro',         nombre: 'Querétaro',           disponible: false },
  { valor: 'quintanaroo',       nombre: 'Quintana Roo',        disponible: true  },
  { valor: 'sanluispotosi',     nombre: 'San Luis Potosí',     disponible: false },
  { valor: 'sinaloa',           nombre: 'Sinaloa',             disponible: false },
  { valor: 'sonora',            nombre: 'Sonora',              disponible: false },
  { valor: 'tabasco',           nombre: 'Tabasco',             disponible: false },
  { valor: 'tamaulipas',        nombre: 'Tamaulipas',          disponible: false },
  { valor: 'tlaxcala',          nombre: 'Tlaxcala',            disponible: true  },
  { valor: 'veracruz',          nombre: 'Veracruz',            disponible: false },
  { valor: 'yucatan',           nombre: 'Yucatán',             disponible: false },
  { valor: 'zacatecas',         nombre: 'Zacatecas',           disponible: true  },
]

const NAYARIT_ESTADOS = {
  1:  { nombre: 'En Funcionamiento',         critico: false },
  2:  { nombre: 'De Baja',                   critico: false },
  3:  { nombre: 'Con Reporte de Robo',       critico: true  },
  4:  { nombre: 'Vehículo Ilegal',           critico: true  },
  5:  { nombre: 'Documentos Falsos',         critico: true  },
  6:  { nombre: 'Adeudos Fiscales Pendientes', critico: true },
  7:  { nombre: 'Robo de Placa',             critico: true  },
  8:  { nombre: 'Otros',                     critico: false },
  9:  { nombre: 'Pago de Tenencia a Plazos', critico: true  },
  10: { nombre: 'Suspendido',                critico: true  },
}

const estadoSeleccionado = ref('')
const cargando = ref(false)
const resultado = ref(null)
const errorMsg = ref('')

// Campos del formulario
const placa        = ref('')
const serie        = ref('')
const motor        = ref('')
const propietario  = ref('')
const tipoBusqueda   = ref('placa') // Oaxaca: 'placa' | 'serie'
const tipoVehiculo   = ref('1')     // Chiapas: 1=Automóvil 2=Remolque 3=Motocicleta

const estadoActual = computed(() =>
  ESTADOS.find(e => e.valor === estadoSeleccionado.value) ?? null
)

// Flag para distinguir cambio de estado automático (por placa) vs manual (por select)
const autoDetectando  = ref(false)
const estadoDetectado = ref(false)
const modoManual      = ref(false)

function detectarEstadoPorPlaca(val) {
  const p = val.trim().toUpperCase().replace(/[-\s.]/g, '')
  if (p.length < 2) return null
  // Prefijos más específicos primero para evitar colisiones
  if (/^QROO/.test(p))  return 'quintanaroo'
  if (/^TLAX/.test(p))  return 'tlaxcala'
  if (/^CAM/.test(p))   return 'campeche'
  if (/^NAY/.test(p))   return 'nayarit'
  if (/^OAX/.test(p))   return 'oaxaca'
  if (/^JAL/.test(p))   return 'jalisco'
  if (/^PUE/.test(p))   return 'puebla'
  if (/^MICH/.test(p))  return 'michoacan'
  if (/^CHIS/.test(p))  return 'chiapas'
  if (/^CHIH/.test(p))  return 'chihuahua'
  if (/^ZAC/.test(p))   return 'zacatecas'
  if (/^TLA/.test(p))   return 'tlaxcala'
  if (/^QRO/.test(p))   return null          // Querétaro – no disponible
  if (/^QR/.test(p))    return 'quintanaroo'
  if (/^TL/.test(p))    return 'tlaxcala'
  if (/^JA/.test(p))    return 'jalisco'
  if (/^OA/.test(p))    return 'oaxaca'
  if (/^NA/.test(p))    return 'nayarit'
  if (/^NY/.test(p))    return 'nayarit'
  if (/^CA/.test(p))    return 'campeche'
  if (/^PP/.test(p))    return 'puebla'
  if (/^PU/.test(p))    return 'puebla'
  if (/^MI/.test(p))    return 'michoacan'
  if (/^CH/.test(p))    return 'chihuahua'
  if (/^ZA/.test(p))    return 'zacatecas'
  return null
}

// El usuario cambió el estado manualmente desde el select
function onEstadoManual() {
  modoManual.value      = true
  estadoDetectado.value = false
}

watch(estadoSeleccionado, () => {
  resultado.value = null
  errorMsg.value  = ''
  if (!autoDetectando.value) {
    // Cambio manual: limpiar campos adicionales pero conservar la placa
    serie.value        = ''
    motor.value        = ''
    propietario.value  = ''
    tipoBusqueda.value = 'placa'
    tipoVehiculo.value = '1'
    estadoDetectado.value = false
  }
  autoDetectando.value = false
})

watch(placa, (val) => {
  if (!val.trim()) {
    modoManual.value      = false
    estadoDetectado.value = false
    return
  }
  if (modoManual.value) return

  const detected = detectarEstadoPorPlaca(val)
  if (!detected) { estadoDetectado.value = false; return }

  const estado = ESTADOS.find(e => e.valor === detected)
  if (!estado?.disponible) return

  estadoDetectado.value = true
  if (detected !== estadoSeleccionado.value) {
    autoDetectando.value     = true
    estadoSeleccionado.value = detected
  }
})

function limpiarResultados() {
  resultado.value = null
  errorMsg.value  = ''
}

async function consultar() {
  limpiarResultados()
  cargando.value = true
  try {
    if (estadoSeleccionado.value === 'oaxaca')   await consultarOaxaca()
    if (estadoSeleccionado.value === 'nayarit')  await consultarNayarit()
    if (estadoSeleccionado.value === 'jalisco')  await consultarJalisco()
    if (estadoSeleccionado.value === 'puebla')   await consultarPuebla()
    if (estadoSeleccionado.value === 'tlaxcala') await consultarTlaxcala()
    if (estadoSeleccionado.value === 'campeche')     await consultarCampeche()
    if (estadoSeleccionado.value === 'quintanaroo') await consultarQuintanaroo()
    if (estadoSeleccionado.value === 'michoacan')   await consultarMichoacan()
    if (estadoSeleccionado.value === 'chihuahua')   await consultarChihuahua()
    if (estadoSeleccionado.value === 'chiapas')     await consultarChiapas()
    if (estadoSeleccionado.value === 'zacatecas')   await consultarZacatecas()
  } catch {
    errorMsg.value = 'Error de conexión. Intenta de nuevo.'
  } finally {
    cargando.value = false
  }
}

// Quintana Roo: dos pasos HTTP, requiere placa + folio de tarjeta de circulación, parsea HTML con referencias de pago
async function consultarQuintanaroo() {
  const res = await fetch('/api/quintanaroo', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placa: placa.value.trim().toUpperCase(),
      folio: serie.value.trim(),
    }),
  })

  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const data = await res.json()
    if (!data.encontrado) {
      errorMsg.value = 'No se encontró ningún vehículo con esa placa y folio en Quintana Roo.'
    }
    return
  }

  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const content = doc.querySelector('.lista') ?? doc.querySelector('body')
  resultado.value = { tipo: 'html', html: content?.innerHTML ?? html }
}

// Chiapas: portal ASP.NET, extrae ViewState con GET previo y filtra resultados por tipo de vehículo
async function consultarChiapas() {
  const res = await fetch('/api/chiapas', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placa:        placa.value.trim().toUpperCase(),
      tipoVehiculo: tipoVehiculo.value,
    }),
  })

  const html = await res.text()

  if (html.trim().length < 500) {
    errorMsg.value = 'Error de comunicación con el portal de Chiapas. Intenta de nuevo.'
    return
  }

  if (html.includes('No existe registro del veh')) {
    errorMsg.value = 'No se encontró ningún vehículo con esa placa en Chiapas.'
    return
  }

  const doc         = new DOMParser().parseFromString(html, 'text/html')
  const updatePanel = doc.getElementById('main_holder_updatePanel')
  resultado.value   = { tipo: 'html', html: updatePanel?.innerHTML ?? html }
}

// Chihuahua: portal Java, requiere JSESSIONID del GET inicial; decodifica la respuesta de ISO-8859-1 a UTF-8
async function consultarChihuahua() {
  const res = await fetch('/api/chihuahua', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placa: placa.value.trim().toUpperCase() }),
  })

  const html = await res.text()
  const doc  = new DOMParser().parseFromString(html, 'text/html')

  const bodyText = doc.body?.innerText ?? doc.body?.textContent ?? ''
  if (bodyText.includes('no se encuentra registrado')) {
    errorMsg.value = 'No se encontró ningún vehículo con esa placa en Chihuahua.'
    return
  }
  if (bodyText.includes('La sesi') && bodyText.includes('ha terminado')) {
    errorMsg.value = 'Error de sesión con el portal de Chihuahua. Intenta de nuevo.'
    return
  }

  const table = doc.querySelector('table.tabla4') ?? doc.querySelector('table') ?? doc.body
  resultado.value = { tipo: 'html', html: table?.innerHTML ?? html }
}

// Michoacán: portal PHP con CSRF obligatorio; extrae el token del GET inicial y lo envía junto con placa y serie
async function consultarMichoacan() {
  const res = await fetch('/api/michoacan', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placa: placa.value.trim().toUpperCase(),
      serie: serie.value.trim().toUpperCase(),
    }),
  })

  const html = await res.text()

  if (html.trim().length < 100) {
    errorMsg.value = 'Error de comunicación con el portal de Michoacán. Intenta de nuevo.'
    return
  }

  const doc     = new DOMParser().parseFromString(html, 'text/html')
  const content = doc.getElementById('div-veh-msg')

  if (!content?.innerHTML?.trim()) {
    errorMsg.value = 'No se encontró ningún vehículo con esa placa y número de serie en Michoacán.'
    return
  }

  resultado.value = { tipo: 'html', html: content.innerHTML }
}

// Zacatecas: API REST JSON directa, un solo GET por placa + VIN, sin sesión ni tokens previos
async function consultarZacatecas() {
  const res = await fetch('/api/zacatecas', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placa: placa.value.trim().toUpperCase(),
      vin:   serie.value.trim().toUpperCase(),
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    errorMsg.value = data.mensaje ?? 'No se encontró ningún vehículo con esa placa y VIN en Zacatecas.'
    return
  }

  resultado.value = { tipo: 'zacatecas', data }
}

// Campeche: API REST JSON, devuelve lista de vehículos con indicador de adeudos por placa y serie
async function consultarCampeche() {
  const res  = await fetch('/api/campeche', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placa: placa.value.trim().toUpperCase(),
      serie: serie.value.trim().toUpperCase(),
    }),
  })
  const data = await res.json()

  if (!data.success || !data.content?.length) {
    errorMsg.value = 'No se encontró ningún vehículo con esa placa y número de serie en Campeche.'
    return
  }

  resultado.value = { tipo: 'campeche', vehiculos: data.content }
}

// Tlaxcala: envía NIV + placa en form-encoded, toma el último panel-body del HTML de respuesta
async function consultarTlaxcala() {
  const body = new URLSearchParams({
    niv:   serie.value.trim().toUpperCase(),
    placa: placa.value.trim().toUpperCase(),
  })

  const res  = await fetch('/api/tlaxcala', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const html = await res.text()

  if (html.includes('no encontrado')) {
    errorMsg.value = 'No se encontró ningún vehículo con ese NIV y placa en Tlaxcala.'
    return
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const panelBodies = doc.querySelectorAll('.panel-body')
  const resultPanel = panelBodies[panelBodies.length - 1]
  resultado.value = { tipo: 'html', html: resultPanel?.innerHTML ?? html }
}

// Puebla: API REST JSON, devuelve datos del vehículo y lista de adeudos detallada por placa y serie
async function consultarPuebla() {
  const res  = await fetch('/api/puebla', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placa: placa.value.trim().toUpperCase(),
      serie: serie.value.trim().toUpperCase(),
    }),
  })
  const data = await res.json()

  if (!data.bResultado) {
    errorMsg.value = 'No se encontró ningún vehículo con esa placa y número de serie en Puebla.'
    return
  }

  resultado.value = { tipo: 'puebla', data }
}

// Oaxaca: admite búsqueda por placa o por número de serie; extrae el bloque del trámite del HTML de respuesta
async function consultarOaxaca() {
  const body = new URLSearchParams({
    placa: tipoBusqueda.value === 'placa' ? placa.value.trim().toUpperCase() : '',
    serie: tipoBusqueda.value === 'serie' ? serie.value.trim().toUpperCase() : '',
  })

  const res  = await fetch('/api/oaxaca', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const html = await res.text()

  if (html.includes('No existe un vehiculo')) {
    errorMsg.value = 'No se encontró ningún vehículo con la placa o serie ingresada en Oaxaca.'
    return
  }

  const doc     = new DOMParser().parseFromString(html, 'text/html')
  const content = doc.getElementById('formFinalizarTramite')
  resultado.value = { tipo: 'html', html: content?.innerHTML ?? html }
}

// Nayarit: API REST JSON pública; devuelve estado operativo del vehículo con código numérico por placa
async function consultarNayarit() {
  const placaVal = placa.value.trim().toUpperCase()
  const res  = await fetch(`/api/nayarit?numero_de_placa_vigente=${encodeURIComponent(placaVal)}`)
  const data = await res.json()

  if (!data.results?.length) {
    errorMsg.value = 'No se encontró ningún vehículo con esa placa en Nayarit.'
    return
  }

  const vehiculo = data.results[0]
  resultado.value = {
    tipo:     'nayarit',
    vehiculo,
    status:   NAYARIT_ESTADOS[vehiculo.estatus_del_vehiculo] ?? { nombre: 'Desconocido', critico: false },
  }
}

// Jalisco: requiere los cuatro datos de la tarjeta de circulación; parsea HTML con tabla de adeudos
async function consultarJalisco() {
  const body = new URLSearchParams({
    origen:           'normal',
    accion:           'getAdeudos',
    placa:            placa.value.trim().toUpperCase(),
    numeroSerie:      serie.value.trim().toUpperCase(),
    numeroMotor:      motor.value.trim().toUpperCase(),
    nombrePropietario: propietario.value.trim().toUpperCase(),
  })

  const res  = await fetch('/api/jalisco', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const html = await res.text()
  const doc  = new DOMParser().parseFromString(html, 'text/html')

  const errorEl   = doc.getElementById('error')
  const errorText = errorEl?.textContent?.trim()

  if (errorText) {
    errorMsg.value = errorText
    return
  }

  const contenido = doc.getElementById('contenido')
  resultado.value = { tipo: 'html', html: contenido?.innerHTML ?? html }
}

const formularioValido = computed(() => {
  if (!estadoSeleccionado.value) return false
  if (estadoSeleccionado.value === 'oaxaca') {
    return tipoBusqueda.value === 'placa' ? placa.value.trim().length >= 3 : serie.value.trim().length >= 5
  }
  if (estadoSeleccionado.value === 'nayarit') return placa.value.trim().length >= 3
  if (estadoSeleccionado.value === 'jalisco') {
    return placa.value.trim().length >= 3 &&
           serie.value.trim().length >= 5  &&
           motor.value.trim().length >= 2  &&
           propietario.value.trim().length >= 2
  }
  if (estadoSeleccionado.value === 'puebla') {
    return placa.value.trim().length >= 3 && serie.value.trim().length >= 5
  }
  if (estadoSeleccionado.value === 'tlaxcala') {
    return placa.value.trim().length >= 3 && serie.value.trim().length >= 5
  }
  if (estadoSeleccionado.value === 'campeche') {
    return placa.value.trim().length >= 3 && serie.value.trim().length >= 5
  }
  if (estadoSeleccionado.value === 'quintanaroo') {
    return placa.value.trim().length >= 3 && serie.value.trim().length >= 1
  }
  if (estadoSeleccionado.value === 'michoacan') {
    return placa.value.trim().length >= 3 && serie.value.trim().length >= 5
  }
  if (estadoSeleccionado.value === 'chihuahua') {
    return placa.value.trim().length >= 3
  }
  if (estadoSeleccionado.value === 'chiapas') {
    return placa.value.trim().length >= 3
  }
  if (estadoSeleccionado.value === 'zacatecas') {
    return placa.value.trim().length >= 3 && serie.value.trim().length >= 3
  }
  return false
})
</script>

<template>
  <div class="consulta-page">

    <!-- Header -->
    <header class="header">
      <div class="header-inner">
        <RouterLink to="/" class="back-link">
          <span class="back-arrow">&#8592;</span> Regresar
        </RouterLink>
        <h1>CONSULTA DE ADEUDOS</h1>
        <p>Verifica si tu vehículo tiene adeudos pendientes</p>
      </div>
    </header>

    <!-- Formulario -->
    <main class="main">
      <div class="card form-card">

        <!-- Placa global: siempre visible, dispara la auto-detección de estado -->
        <div
          class="field"
          v-show="!(estadoSeleccionado === 'oaxaca' && tipoBusqueda === 'serie')"
        >
          <label class="label" for="placa-global">Número de placa</label>
          <input
            id="placa-global"
            v-model="placa"
            class="input"
            type="text"
            placeholder="Ej: JA12345, QR1234, CAM001…"
            maxlength="10"
            @input="placa = placa.toUpperCase()"
          />
        </div>

        <!-- Select de estado -->
        <div class="field">
          <label class="label" for="estado">Estado</label>
          <select
            id="estado"
            v-model="estadoSeleccionado"
            class="select"
            @change="onEstadoManual"
          >
            <option value="" disabled>Selecciona un estado...</option>
            <optgroup label="Disponibles">
              <option
                v-for="e in ESTADOS.filter(e => e.disponible)"
                :key="e.valor"
                :value="e.valor"
              >{{ e.nombre }}</option>
            </optgroup>
            <optgroup label="Próximamente">
              <option
                v-for="e in ESTADOS.filter(e => !e.disponible)"
                :key="e.valor"
                :value="e.valor"
                disabled
              >{{ e.nombre }}</option>
            </optgroup>
          </select>
          <div v-if="estadoDetectado" class="detect-badge">
            ✓ Estado detectado automáticamente
          </div>
        </div>

        <!-- Campos adicionales por estado (la placa ya está arriba) -->
        <template v-if="estadoSeleccionado === 'oaxaca'">
          <div class="field">
            <label class="label">Tipo de búsqueda</label>
            <div class="toggle-group">
              <button
                :class="['toggle-btn', { active: tipoBusqueda === 'placa' }]"
                @click="tipoBusqueda = 'placa'"
                type="button"
              >Por Placa</button>
              <button
                :class="['toggle-btn', { active: tipoBusqueda === 'serie' }]"
                @click="tipoBusqueda = 'serie'"
                type="button"
              >Por Número de Serie</button>
            </div>
          </div>

          <!-- Modo serie: mostrar campo serie (la placa global se oculta) -->
          <div v-if="tipoBusqueda === 'serie'" class="field">
            <label class="label" for="serie-oax">Número de serie (mín. 5 caracteres)</label>
            <input
              id="serie-oax"
              v-model="serie"
              class="input"
              type="text"
              placeholder="Últimos 5 o más caracteres del NIV"
              maxlength="17"
              @input="serie = serie.toUpperCase()"
            />
          </div>
        </template>

        <template v-else-if="estadoSeleccionado === 'jalisco'">
          <div class="info-banner">
            Jalisco requiere datos adicionales tal como aparecen en tu tarjeta de circulación.
          </div>
          <div class="field">
            <label class="label" for="serie-jal">Número de serie (mín. 5 caracteres)</label>
            <input
              id="serie-jal"
              v-model="serie"
              class="input"
              type="text"
              placeholder="Últimos 5 o más caracteres del NIV"
              maxlength="17"
              @input="serie = serie.toUpperCase()"
            />
          </div>
          <div class="field">
            <label class="label" for="motor-jal">Número de motor</label>
            <input
              id="motor-jal"
              v-model="motor"
              class="input"
              type="text"
              placeholder="Número de motor"
              maxlength="20"
              @input="motor = motor.toUpperCase()"
            />
          </div>
          <div class="field">
            <label class="label" for="prop-jal">Nombre del propietario</label>
            <input
              id="prop-jal"
              v-model="propietario"
              class="input"
              type="text"
              placeholder="Nombre completo tal como aparece en la tarjeta"
              @input="propietario = propietario.toUpperCase()"
            />
          </div>
        </template>

        <template v-else-if="estadoSeleccionado === 'campeche'">
          <div class="field">
            <label class="label" for="serie-cam">Número de serie / NIV (mín. 5 caracteres)</label>
            <input
              id="serie-cam"
              v-model="serie"
              class="input"
              type="text"
              placeholder="Últimos 5 o más caracteres del NIV"
              maxlength="17"
              @input="serie = serie.toUpperCase()"
            />
          </div>
        </template>

        <template v-else-if="estadoSeleccionado === 'tlaxcala'">
          <div class="field">
            <label class="label" for="niv-tlax">NIV / Número de serie (mín. 5 caracteres)</label>
            <input
              id="niv-tlax"
              v-model="serie"
              class="input"
              type="text"
              placeholder="Últimos 5 o más caracteres del NIV"
              maxlength="17"
              @input="serie = serie.toUpperCase()"
            />
          </div>
        </template>

        <template v-else-if="estadoSeleccionado === 'puebla'">
          <div class="field">
            <label class="label" for="serie-pue">Número de serie (mín. 5 caracteres)</label>
            <input
              id="serie-pue"
              v-model="serie"
              class="input"
              type="text"
              placeholder="Últimos 5 o más caracteres del NIV"
              maxlength="17"
              @input="serie = serie.toUpperCase()"
            />
          </div>
        </template>

        <template v-else-if="estadoSeleccionado === 'quintanaroo'">
          <div class="info-banner">
            Quintana Roo requiere el Folio Electrónico de tu Tarjeta de Circulación además de la placa.
          </div>
          <div class="field">
            <label class="label" for="folio-qroo">Folio Electrónico de la Tarjeta de Circulación</label>
            <input
              id="folio-qroo"
              v-model="serie"
              class="input"
              type="text"
              inputmode="numeric"
              placeholder="Hasta 9 dígitos"
              maxlength="9"
              @input="serie = serie.replace(/\D/g, '')"
            />
          </div>
        </template>

        <template v-else-if="estadoSeleccionado === 'chiapas'">
          <div class="field">
            <label class="label" for="tipo-chias">Tipo de vehículo</label>
            <select
              id="tipo-chias"
              v-model="tipoVehiculo"
              class="select"
            >
              <option value="1">Automóvil</option>
              <option value="2">Remolque</option>
              <option value="3">Motocicleta</option>
            </select>
          </div>
        </template>

        <template v-else-if="estadoSeleccionado === 'chihuahua'">
          <div class="info-banner">
            Chihuahua solo requiere el número de placa. También puedes consultar con el folio de permiso para circular.
          </div>
        </template>

        <template v-else-if="estadoSeleccionado === 'michoacan'">
          <div class="field">
            <label class="label" for="serie-mich">Número de serie (mín. 5 caracteres)</label>
            <input
              id="serie-mich"
              v-model="serie"
              class="input"
              type="text"
              placeholder="Últimos 5 o más caracteres del NIV"
              maxlength="17"
              @input="serie = serie.toUpperCase()"
            />
          </div>
        </template>

        <template v-else-if="estadoSeleccionado === 'zacatecas'">
          <div class="info-banner">
            Zacatecas requiere los últimos 5 caracteres del VIN/NIV además de la placa.
          </div>
          <div class="field">
            <label class="label" for="vin-zac">VIN / Número de serie (últimos 5 caracteres)</label>
            <input
              id="vin-zac"
              v-model="serie"
              class="input"
              type="text"
              placeholder="Últimos 5 caracteres del NIV"
              maxlength="17"
              @input="serie = serie.toUpperCase()"
            />
          </div>
        </template>

        <!-- Botón -->
        <button
          v-if="estadoActual?.disponible"
          class="btn-consultar"
          :disabled="!formularioValido || cargando"
          @click="consultar"
        >
          <span v-if="cargando" class="spinner"></span>
          <span>{{ cargando ? 'Consultando...' : 'Consultar' }}</span>
        </button>

      </div>

      <!-- Resultados -->
      <div v-if="errorMsg" class="card result-card error-card">
        <div class="result-icon">✕</div>
        <p class="result-title">Sin resultados</p>
        <p class="result-msg">{{ errorMsg }}</p>
      </div>

      <!-- Nayarit: resultado estructurado -->
      <div v-else-if="resultado?.tipo === 'nayarit'" class="card result-card">
        <div class="result-icon ok">✓</div>
        <p class="result-title">Vehículo encontrado en Nayarit</p>

        <div :class="['status-badge', resultado.status.critico ? 'critico' : 'ok']">
          {{ resultado.status.nombre }}
        </div>

        <div class="vehiculo-grid">
          <div class="vehiculo-item">
            <span class="vitem-label">Placa</span>
            <span class="vitem-val">{{ resultado.vehiculo.numero_de_placa_vigente ?? '—' }}</span>
          </div>
          <div class="vehiculo-item">
            <span class="vitem-label">Modelo</span>
            <span class="vitem-val">{{ resultado.vehiculo.modelo ?? '—' }}</span>
          </div>
          <div class="vehiculo-item" style="grid-column: span 2">
            <span class="vitem-label">NIV / Número de serie</span>
            <span class="vitem-val mono">{{ resultado.vehiculo.numero_de_identificacion_vehicular ?? '—' }}</span>
          </div>
        </div>

        <p v-if="resultado.status.critico" class="aviso-critico">
          Este vehículo tiene una situación crítica. Verifica en el portal oficial de Nayarit para más detalles.
        </p>
      </div>

      <!-- Campeche: resultado estructurado -->
      <div v-else-if="resultado?.tipo === 'campeche'" class="card result-card">
        <div class="result-icon ok">✓</div>
        <p class="result-title">Vehículo encontrado en Campeche</p>

        <div v-for="(v, i) in resultado.vehiculos" :key="i" class="vehiculo-grid" :style="i > 0 ? 'margin-top:1rem;border-top:1px solid #eee;padding-top:1rem' : ''">
          <div class="vehiculo-item">
            <span class="vitem-label">Placa</span>
            <span class="vitem-val">{{ v.placa ?? '—' }}</span>
          </div>
          <div class="vehiculo-item">
            <span class="vitem-label">Modelo</span>
            <span class="vitem-val">{{ v.modelo ?? '—' }}</span>
          </div>
          <div class="vehiculo-item" style="grid-column: span 2">
            <span class="vitem-label">Titular</span>
            <span class="vitem-val">{{ [v.nombre, v.a_paterno, v.a_materno].filter(Boolean).join(' ') || '—' }}</span>
          </div>
          <div v-if="v.estaAlDia != null" class="vehiculo-item" style="grid-column: span 2">
            <span class="vitem-label">Estado de adeudos</span>
            <span :class="['vitem-val', v.estaAlDia ? 'text-ok' : 'text-critico']">
              {{ v.estaAlDia ? 'Al día' : 'Adeudos pendientes' }}
            </span>
          </div>
        </div>

        <p class="aviso-critico" style="margin-top:1rem">
          Para ver el detalle de adeudos y realizar el pago, visita el portal oficial de Campeche.
        </p>
      </div>

      <!-- Puebla: resultado estructurado -->
      <div v-else-if="resultado?.tipo === 'puebla'" class="card result-card">
        <div class="result-icon ok">✓</div>
        <p class="result-title">Vehículo encontrado en Puebla</p>

        <div class="vehiculo-grid puebla-grid">
          <div class="vehiculo-item">
            <span class="vitem-label">Placa</span>
            <span class="vitem-val">{{ resultado.data.vchPlaca ?? '—' }}</span>
          </div>
          <div class="vehiculo-item">
            <span class="vitem-label">Modelo</span>
            <span class="vitem-val">{{ resultado.data.iModelo || '—' }}</span>
          </div>
          <div class="vehiculo-item">
            <span class="vitem-label">Marca</span>
            <span class="vitem-val">{{ resultado.data.vchMarca ?? '—' }}</span>
          </div>
          <div class="vehiculo-item">
            <span class="vitem-label">Línea / Tipo</span>
            <span class="vitem-val">{{ [resultado.data.vchLInea, resultado.data.vchTipo].filter(Boolean).join(' / ') || '—' }}</span>
          </div>
          <div class="vehiculo-item" style="grid-column: span 2">
            <span class="vitem-label">Titular</span>
            <span class="vitem-val">{{ resultado.data.vchNombreConcatenado ?? '—' }}</span>
          </div>
          <div class="vehiculo-item" style="grid-column: span 2">
            <span class="vitem-label">NIV / Número de serie</span>
            <span class="vitem-val mono">{{ resultado.data.vchSerie ?? '—' }}</span>
          </div>
        </div>

        <template v-if="resultado.data.Adeudos?.length">
          <p class="adeudos-titulo">Adeudos pendientes</p>
          <div class="adeudos-lista">
            <div v-for="(a, i) in resultado.data.Adeudos" :key="i" class="adeudo-item">
              <span class="adeudo-desc">{{ a.vchDescripcion ?? a.descripcion ?? `Adeudo ${i + 1}` }}</span>
              <span class="adeudo-monto">${{ Number(a.mImporte ?? a.importe ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </template>
        <div v-else class="status-badge ok" style="margin-top:1rem">
          Sin adeudos registrados
        </div>
      </div>

      <!-- Zacatecas: resultado estructurado -->
      <div v-else-if="resultado?.tipo === 'zacatecas'" class="card result-card">
        <div class="result-icon ok">✓</div>
        <p class="result-title">Vehículo encontrado en Zacatecas</p>

        <div class="vehiculo-grid">
          <div class="vehiculo-item">
            <span class="vitem-label">Placa</span>
            <span class="vitem-val">{{ resultado.data.vehiculo?.placa ?? '—' }}</span>
          </div>
          <div class="vehiculo-item">
            <span class="vitem-label">Año</span>
            <span class="vitem-val">{{ resultado.data.vehiculo?.anio ?? '—' }}</span>
          </div>
          <div class="vehiculo-item">
            <span class="vitem-label">Marca</span>
            <span class="vitem-val">{{ resultado.data.vehiculo?.marca ?? '—' }}</span>
          </div>
          <div class="vehiculo-item">
            <span class="vitem-label">Modelo</span>
            <span class="vitem-val">{{ resultado.data.vehiculo?.modelo ?? '—' }}</span>
          </div>
          <div class="vehiculo-item" style="grid-column: span 2">
            <span class="vitem-label">Propietario</span>
            <span class="vitem-val">{{ resultado.data.contribuyente?.nombre ?? '—' }}</span>
          </div>
        </div>

        <template v-if="resultado.data.tenenciaContribucionList?.length">
          <p class="adeudos-titulo">Adeudos pendientes</p>
          <div class="adeudos-lista">
            <div v-for="(t, i) in resultado.data.tenenciaContribucionList" :key="i" class="adeudo-item">
              <div style="flex:1">
                <div style="font-weight:600;margin-bottom:0.25rem">{{ t.contribucion }} {{ t.ejercicio }}</div>
                <div v-if="t.tenenciaConceptoList?.length" style="font-size:0.8rem;color:#777">
                  <span v-for="(c, j) in t.tenenciaConceptoList" :key="j" style="display:block">
                    {{ c.concepto }}: ${{ Number(c.importe ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}
                  </span>
                </div>
              </div>
              <span class="adeudo-monto">${{ Number(t.importe ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="adeudo-item" style="background:#ffebee;border-color:#ef9a9a">
              <span class="adeudo-desc" style="font-weight:700">Total</span>
              <span class="adeudo-monto">${{ Number(resultado.data.total ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </template>
        <div v-else class="status-badge ok" style="margin-top:1rem">
          Sin adeudos registrados
        </div>
      </div>

      <!-- Oaxaca / Jalisco: resultado en HTML -->
      <div v-else-if="resultado?.tipo === 'html'" class="card result-card html-result">
        <p class="result-title">Resultado</p>
        <div class="html-content" v-html="resultado.html"></div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* ── Variables ─────────────────────────────────────────────────────── */
:root {
  --vino:       #6d1a2a;
  --vino-dark:  #4e1220;
  --vino-light: #8b2236;
}

/* ── Layout ─────────────────────────────────────────────────────────── */
.consulta-page {
  min-height: 100vh;
  background: #f4f4f4;
  font-family: system-ui, -apple-system, sans-serif;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.header {
  background: #6d1a2a;
  color: #fff;
  padding: 2rem 1rem 2.5rem;
}

.header-inner {
  max-width: 640px;
  margin: 0 auto;
}

.back-link {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 3rem;
  transition: color 0.15s;
}
.back-link:hover { color: #fff; }
.back-arrow { font-size: 1.1rem; }

.header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.4rem;
  letter-spacing: 1px;
}

.header p {
  margin: 0;
  opacity: 0.8;
  font-size: 0.95rem;
}

/* ── Main ───────────────────────────────────────────────────────────── */
.main {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Card ───────────────────────────────────────────────────────────── */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

/* ── Fields ─────────────────────────────────────────────────────────── */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.select,
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  color: #1a1a1a;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.select:focus,
.input:focus {
  outline: none;
  border-color: #6d1a2a;
  box-shadow: 0 0 0 3px rgba(109,26,42,0.12);
}

.select option:disabled {
  color: #aaa;
}

/* ── Toggle ─────────────────────────────────────────────────────────── */
.toggle-group {
  display: flex;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.toggle-btn {
  flex: 1;
  padding: 0.65rem 1rem;
  border: none;
  background: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.toggle-btn + .toggle-btn {
  border-left: 1.5px solid #ddd;
}
.toggle-btn.active {
  background: #6d1a2a;
  color: #fff;
  font-weight: 600;
}

/* ── Info banner ────────────────────────────────────────────────────── */
.info-banner {
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.88rem;
  color: #795548;
  line-height: 1.5;
}

/* ── Submit button ──────────────────────────────────────────────────── */
.btn-consultar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.9rem 1.5rem;
  background: #6d1a2a;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  margin-top: 0.4rem;
}
.btn-consultar:hover:not(:disabled) {
  background: #8b2236;
  transform: translateY(-1px);
}
.btn-consultar:disabled {
  background: #c8a0a8;
  cursor: not-allowed;
}

/* ── Spinner ────────────────────────────────────────────────────────── */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Result cards ───────────────────────────────────────────────────── */
.result-card {
  text-align: center;
}

.result-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #ffebee;
  color: #c62828;
  font-size: 1.4rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}
.result-icon.ok {
  background: #e8f5e9;
  color: #2e7d32;
}

.result-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem;
}
.result-msg {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.error-card {
  border-left: 4px solid #c62828;
}

/* ── Nayarit status badge ───────────────────────────────────────────── */
.status-badge {
  display: inline-block;
  padding: 0.4rem 1.2rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0.8rem 0 1.5rem;
}
.status-badge.critico {
  background: #ffebee;
  color: #b71c1c;
  border: 1px solid #ef9a9a;
}
.status-badge.ok {
  background: #e8f5e9;
  color: #1b5e20;
  border: 1px solid #a5d6a7;
}

.vehiculo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.5rem;
  text-align: left;
}

.vehiculo-item {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.vitem-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 0.25rem;
}
.vitem-val {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
}
.mono { font-family: monospace; font-size: 0.9rem; }

.aviso-critico {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #fff3e0;
  border: 1px solid #ffcc80;
  border-radius: 8px;
  font-size: 0.88rem;
  color: #e65100;
  line-height: 1.5;
}

/* ── HTML result ────────────────────────────────────────────────────── */
.html-result { text-align: left; }
.html-content {
  margin-top: 1rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #333;
}
.html-content :deep(h3),
.html-content :deep(h4) {
  color: #6d1a2a;
  margin: 0.5rem 0;
}
.html-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
  font-size: 0.88rem;
}
.html-content :deep(th) {
  background: #6d1a2a;
  color: #fff;
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.html-content :deep(td) {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #eee;
}
.html-content :deep(button) { display: none; }

/* ── Estado text colors ─────────────────────────────────────────────── */
.text-ok    { color: #2e7d32; font-weight: 700; }
.text-critico { color: #b71c1c; font-weight: 700; }

/* ── Puebla adeudos ─────────────────────────────────────────────────── */
.puebla-grid { margin-top: 0.5rem; }

.adeudos-titulo {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6d1a2a;
  margin: 1.5rem 0 0.75rem;
  text-align: left;
}

.adeudos-lista {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.adeudo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
}

.adeudo-desc { color: #4a4a4a; flex: 1; }
.adeudo-monto {
  font-weight: 700;
  color: #b71c1c;
  margin-left: 1rem;
  white-space: nowrap;
}

/* ── Auto-detect badge ──────────────────────────────────────────────── */
.detect-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.45rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #1b5e20;
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  padding: 0.28rem 0.75rem;
}

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .card { padding: 1.25rem; }
  .vehiculo-grid { grid-template-columns: 1fr; }
  .vehiculo-item[style] { grid-column: span 1; }
}
</style>
