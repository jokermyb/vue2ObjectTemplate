import Vue from 'vue'
import App from './App.vue'
import router from '@/router'
import { createPinia } from 'pinia'

Vue.config.productionTip = false

const pinia = createPinia()
Vue.use(pinia)

new Vue({
	router,
	render: h => h(App),
}).$mount('#app')
