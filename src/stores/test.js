import { defineStore } from 'pinia'

export const useTestStore = defineStore({
	id: 'test',
	state: ()=>({
		count: 0
	}),
	getters: {
		getCount(){
			return this.count
		}
	},
	actions: {
		setCount(){
			this.count++
		}
	}
})