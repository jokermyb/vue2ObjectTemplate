import Vue from 'vue'
import Router from 'vue-router'

const files = require.context('./modules/', false, /\.js$/)
const routes = []
files.keys().forEach(key => {
	routes.push(files(key).default)
})

Vue.use(Router)

const router = new Router({
	routes: [
		{
			path: '/',
			name: 'Home',
			component: () => import('@/components/HelloWorld.vue')
		},
		...routes
	]
})

export default router;