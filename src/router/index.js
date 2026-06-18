import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Consulta from '../pages/Consulta.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/consulta', component: Consulta },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
