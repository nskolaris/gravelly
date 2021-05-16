import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import * as VueGoogleMaps from 'vue2-google-maps'
import { LMap, LTileLayer, LPolyline, LMarker, LCircleMarker } from 'vue2-leaflet'
import 'leaflet/dist/leaflet.css';

Vue.component('l-map', LMap)
Vue.component('l-tile-layer', LTileLayer)
Vue.component('l-polyline', LPolyline)
Vue.component('l-marker', LMarker)
Vue.component('l-circle-marker', LCircleMarker)

Vue.config.productionTip = false

Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyChGK3APgZLcGM1Wh6tQMV9diTKsaRGUPE',
    libraries: 'places', // This is required if you use the Autocomplete plugin
    // OR: libraries: 'places,drawing'
    // OR: libraries: 'places,drawing,visualization'
    // (as you require)
 
    //// If you want to set the version, you can do so:
    // v: '3.26',
  },
 
  //// If you intend to programmatically custom event listener code
  //// (e.g. `this.$refs.gmap.$on('zoom_changed', someFunc)`)
  //// instead of going through Vue templates (e.g. `<GmapMap @zoom_changed="someFunc">`)
  //// you might need to turn this on.
  // autobindAllEvents: false,
 
  //// If you want to manually install components, e.g.
  //// import {GmapMarker} from 'vue2-google-maps/src/components/marker'
  //// Vue.component('GmapMarker', GmapMarker)
  //// then disable the following:
  // installComponents: true,
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
