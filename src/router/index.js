import { createRouter, createWebHistory } from 'vue-router'
import CatalogView from '@/views/CatalogView.vue'
import FormView from '@/views/FormView.vue'
import SearchView from '@/views/SearchView.vue'
import ConfigView from '@/views/ConfigView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/catalogo' },
    { path: '/catalogo', name: 'catalogo', component: CatalogView },
    { path: '/cadastrar', name: 'cadastrar', component: FormView },
    { path: '/cadastrar/:id', name: 'editar', component: FormView, props: true },
    { path: '/buscar', name: 'buscar', component: SearchView },
    { path: '/configuracoes', name: 'configuracoes', component: ConfigView }
  ]
})

export default router
