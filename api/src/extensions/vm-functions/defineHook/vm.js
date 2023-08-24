const ivm = $0
const makeHook = $1

function defineHook(callback) {
	const registerFunctions = {
		filter: (event, handler) => {
			makeHook.apply(undefined, [
				'filter',
				event,
				new ivm.Reference((...args) => {
					handler(...args)
				})
			]);
		},
		action: (event, handler) => {
			makeHook.apply(undefined, [
				'filter',
				event,
				new ivm.Reference((...args) => {
					handler(...args)
				})
			]);
		},
		init: (event, handler) => {
			makeHook.apply(undefined, [
				'init',
				event,
				new ivm.Reference((...args) => {
					handler(...args)
				})
			]);
		},
		schedule: (cors, handler) => {
			makeHook.apply(undefined, [
				'init',
				cors,
				new ivm.Reference((...args) => {
					handler(...args)
				})
			]);
		},
		embed: (position, code) => {
			makeHook.apply(undefined, [
				'embed',
				position,
				typeof code === 'function' ? new ivm.Reference(code) : code
			]);
		}
	}

	callback(registerFunctions)
}

globalThis.defineHook = defineHook
