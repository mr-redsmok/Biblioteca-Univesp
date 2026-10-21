import { createRouter, createWebHistory } from 'vue-router'
import CatalogView from '@/views/CatalogView.vue'
import FormView from '@/views/FormView.vue'
import SearchView from '@/views/SearchView.vue'
import AlunosView from '@/views/AlunosView.vue'
import MatriculasView from '@/views/MatriculasView.vue'
import ImportarAlunosView from '@/views/ImportarAlunosView.vue'
import EmprestimosView from '@/views/EmprestimosView.vue'
import ConfigView from '@/views/ConfigView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/catalogo' },
    { path: '/catalogo', name: 'catalogo', component: CatalogView },
    { path: '/cadastrar', name: 'cadastrar', component: FormView },
    { path: '/cadastrar/:id', name: 'editar', component: FormView, props: true },
    { path: '/buscar', name: 'buscar', component: SearchView },
    { path: '/alunos', name: 'alunos', component: AlunosView },
    { path: '/alunos/importar', name: 'alunos-importar', component: ImportarAlunosView },
    { path: '/matriculas', name: 'matriculas', component: MatriculasView },
    { path: '/emprestimos', name: 'emprestimos', component: EmprestimosView },
    { path: '/configuracoes', name: 'configuracoes', component: ConfigView }
  ]
})

export default router
