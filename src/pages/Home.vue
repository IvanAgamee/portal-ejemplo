<script setup>
const estados = [
  { nombre: 'Aguascalientes', url: 'https://epagos.aguascalientes.gob.mx/controlvehicular/Vehicular/Index' },
  { nombre: 'Baja California', url: 'https://tramites.ebajacalifornia.gob.mx/ventanillaunica/tramites/controlvehicular/refrendo' },
  { nombre: 'Baja California Sur', url: 'http://apps.bcs.gob.mx:8080/servicios/tenencia.jsp' },
  { nombre: 'Campeche', url: 'https://miportal-siaf.seafi.campeche.gob.mx/tramites/buscar/eyJpZCI6MjQyNSwibm9tYnJlIjoiVmVoaWN1bGFyIn0%3D' },
  { nombre: 'Chiapas', url: 'https://soluciones.finanzaschiapas.gob.mx/liquidacion_vehicular/default.aspx' },
  { nombre: 'Chihuahua', url: 'https://ipagos.chihuahua.gob.mx/consultas/adeudo/principal.jsp' },
  { nombre: 'Ciudad de México', url: 'https://data.finanzas.cdmx.gob.mx/consulta_adeudos' },
  { nombre: 'Coahuila', url: 'https://www.pagafacil.gob.mx/pagafacilV2/epago/cv/control_vehicular_25.php' },
  { nombre: 'Colima', url: 'https://pagosyservicios.col.gob.mx/DecEstatales/PagoVehicular' },
  { nombre: 'Durango', url: 'https://www.app-pagos.durango.gob.mx/tramite/DPC-Refrendo' },
  { nombre: 'Guanajuato', url: 'https://refrendo.guanajuato.gob.mx/' },
  { nombre: 'Guerrero', url: 'https://esefina.ingresos-guerrero.gob.mx/Tenencia/ModuloExterno/' },
  { nombre: 'Hidalgo', url: 'https://ehacienda.hidalgo.gob.mx/Transparencia/VentanillaCiudadana' },
  { nombre: 'Jalisco', url: 'https://gobiernoenlinea1.jalisco.gob.mx/serviciosVehiculares/adeudos' },
  { nombre: 'Michoacán', url: 'https://refrendodigital.michoacan.gob.mx/' },
  { nombre: 'Nayarit', url: 'https://hacienda.minayarit.gob.mx/pagos/consulta-de-adeudos/vehiculo-4' },
  { nombre: 'Nuevo León', url: 'https://icvnl.gob.mx/EstadodeCuenta' },
  { nombre: 'Oaxaca', url: 'https://siox.finanzasoaxaca.gob.mx/pagoTenencia' },
  { nombre: 'Puebla', url: 'https://rl.puebla.gob.mx/AdeudoVehicular/' },
  { nombre: 'Querétaro', url: 'https://tenencia.queretaro.gob.mx/' },
  { nombre: 'Quintana Roo', url: 'https://satq.qroo.gob.mx/controlvehicular/' },
  { nombre: 'San Luis Potosí', url: 'https://satq.qroo.gob.mx/controlvehicular/' },
  { nombre: 'Sinaloa', url: 'https://ciudadano.sinaloa.gob.mx/tramites/tenencia-y-calcomania-vehicular' },
  { nombre: 'Sonora', url: 'https://cuentaunica.siiafhacienda.gob.mx/ExpressVehicular/Verificacion' },
  { nombre: 'Tabasco', url: 'https://llavecanje.tabasco.gob.mx/' },
  { nombre: 'Tamaulipas', url: 'https://finanzas.tamaulipas.gob.mx/pago-de-contribuciones/tenencia.php' },
  { nombre: 'Tlaxcala', url: 'https://a-tenenciaonline.sefintlax.gob.mx/TenenciaEnLinea/consultar_tenencia/resultados' },
  { nombre: 'Veracruz', url: 'https://ovh.veracruz.gob.mx/ovh/consultavehicular' },
  { nombre: 'Yucatán', url: 'https://pontealdia.yucatan.gob.mx' },
  { nombre: 'Zacatecas', url: 'https://portaltributario.zacatecas.gob.mx/vehicular/presupuestoTenencia.jsp' },
]
</script>

<template>
  <div class="portal">
    <header>
      <h1>PORTAL VEHICULAR</h1>
      <p>Selecciona el estado para consultar información de placa</p>
    </header>

    <main>
      <div class="grid">
        <a
          v-for="estado in estados"
          :key="estado.nombre"
          :href="estado.url ?? undefined"
          :target="estado.url ? '_blank' : undefined"
          :rel="estado.url ? 'noopener noreferrer' : undefined"
          :class="['btn', { disabled: !estado.url }]"
        >
          {{ estado.nombre }}
        </a>
      </div>
    </main>
  </div>
</template>

<style scoped>
.portal {
  min-height: 100vh;
  background: #f2f2f2;
  padding: 2rem 1rem;
}

header {
  text-align: center;
  margin-top: 3rem;
  margin-bottom: 5rem;
}

header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem;
  letter-spacing: 1px;
}

header p {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.2rem;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1.5rem;
  border-radius: 10px;
  background: #6d1a2a;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  line-height: 1.3;
  min-height: 160px;
}

.btn:hover:not(.disabled) {
  background: #8b2236;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4);
}

.btn:active:not(.disabled) {
  transform: translateY(0);
}

.btn.disabled {
  background: #555;
  color: #999;
  cursor: not-allowed;
  pointer-events: none;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }

  header h1 {
    font-size: 1.6rem;
  }
}
</style>
