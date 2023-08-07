const ivm = $0
const makeHook = $1

function defineHook(callback) {
	const registerFunctions = {
		filter: (event, handler) => {
			console.log("register filter hook")
			makeHook.apply(undefined, [
				'filter',
				event,
				new ivm.Reference((...args) => {
					handler(...args)
				})
			]);
		},
		action: (event, handler) => {
			console.log("register filter hook")
			makeHook.apply(undefined, [
				'filter',
				event,
				new ivm.Reference((...args) => {
					handler(...args)
				})
			]);
		},
	}
	callback(registerFunctions)
}

globalThis.defineHook = defineHook
