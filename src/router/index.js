import Vue from 'vue'
import VueRouter from 'vue-router'
import User from '../views/User.vue'

Vue.use(VueRouter)

const routes = [
	{
		path: '/',
		name: 'User',
		component: User
	}
]

const router = new VueRouter({
	mode: 'history',
	routes
})

export default router
