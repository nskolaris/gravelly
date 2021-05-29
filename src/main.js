import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { LMap, LTileLayer, LPolyline, LMarker, LCircleMarker, LCircle, LIcon } from 'vue2-leaflet'
import 'leaflet/dist/leaflet.css'
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'

Vue.component('LMap', LMap)
Vue.component('LTileLayer', LTileLayer)
Vue.component('LPolyline', LPolyline)
Vue.component('LMarker', LMarker)
Vue.component('LCircleMarker', LCircleMarker)
Vue.component('LCircle', LCircle)
Vue.component('LIcon', LIcon)

Vue.config.productionTip = false

new Vue({
	router,
	store,
	render: h => h(App)
}).$mount('#app')
