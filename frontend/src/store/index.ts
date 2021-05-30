// The entire structure gets flattened, refer to this link https://typed-vuex.roe.dev/accessor-introduction
import { getterTree, mutationTree, actionTree, getAccessorType } from 'typed-vuex'
// import * as authentication from './authentication';

// Define root state
// https://typed-vuex.roe.dev/state
export const state = () => ({
	name: '',
	someStuff: [] as string[]
})

export type RootState = ReturnType<typeof state>

// Define getters
// https://typed-vuex.roe.dev/getters
export const getters = getterTree(state, {
	fullName: state => `Mr. ${state.name}`
})

// Define mutations
// https://typed-vuex.roe.dev/mutations
export const mutations = mutationTree(state, {
	changeName (state, data: { name: string; lastName: string }) {
		state.name = data.name
	},
	appendStuff (state, data: string) {
		const currentArray = [...state.someStuff]
		currentArray.push(data)
		state.someStuff = currentArray
	}
})

// Define actions
// https://typed-vuex.roe.dev/actions
export const actions = actionTree({ state, getters, mutations },
	{
		// nuxtClientInit: async ({ dispatch, commit, state }, context) => {
		nuxtClientInit: async ({ dispatch }) => {
			if (localStorage.getItem('gravelly-token')) {
				await dispatch('authentication/verify', localStorage.getItem('gravelly-token'))
			}
		}
	})

// This compiles to nothing and only serves to return the correct type of the accessor
export const accessorType: any = getAccessorType({
	state,
	getters,
	mutations,
	actions,
	modules: {
		// authentication,
	}
})
