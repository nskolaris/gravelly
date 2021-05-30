import { NuxtConfig } from '@nuxt/types'

// https://typescript.nuxtjs.org/cookbook/configuration
const config: NuxtConfig = {
	server: {
		port: process.env.port ?? 8080
	},
	ssr: false,
	target: 'static',
	srcDir: 'src/',
	components: true,
	head: {
		title: 'Gravelly',
		titleTemplate: `%s | Gravelly`
	},
	loadingIndicator: {
		background: '#171717'
	},
	plugins: [],
	css: ['@/assets/css/base.scss'],
	modules: [
		'nuxt-client-init-module',
		'@nuxtjs/axios',
		'nuxt-leaflet'
	],
	buildModules: [
		'@nuxt/typescript-build',
		'@nuxt/components',
		'nuxt-typed-vuex'
	],
	router: {
		linkActiveClass: 'is-active',
		linkExactActiveClass: 'is-active'
	},
	axios: {
		baseURL: 'http://localhost:3000/api/'
	},
	env: {
		domain: process.env.domain ?? `http://localhost:${process.env.port ?? 8080}`,
		stravaClientId: process.env.VUE_APP_STRAVA_CLIENT_ID ?? '',
		stravaClientSecret: process.env.VUE_APP_STRAVA_CLIENT_SECRET ?? '',
		orsApiKey: process.env.VUE_APP_ORS_API_KEY ?? ''
	},
	build: {
		postcss: false,
		babel: {
			presets ({ isServer }) {
				return [
					[
						require.resolve('@nuxt/babel-preset-app-edge'), // For nuxt-edge users
						{
							buildTarget: isServer ? 'server' : 'client',
							corejs: { version: 3 }
						}
					]
				]
			}
		},
		extend (config, { isClient, isDev }) {
			if (isDev) {
				if (config.output) config.output.globalObject = 'this'
				config.devtool = isClient ? 'source-map' : 'inline-source-map'
			}
		}
	}
}
export default config
