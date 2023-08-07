const ivm = $0
const makeOperation = $1

function defineOperationApi({ id, handler }) {

	makeOperation.apply(null, [
		id,
		new ivm.Reference((...args) => {
			handler(...args)
		})
	])
}

globalThis.defineOperationApi = defineOperationApi
