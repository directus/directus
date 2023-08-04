const ivm = $0
const makeEndpoint = $1

function defineEndpoint(callback) {
	const router = {
		get: (path, endpoint_callback) => {
			console.log("register endpoint")
			makeEndpoint.apply(undefined, [
				'get',
				path,
				new ivm.Reference((...args) => {
					endpoint_callback(...args)
				})
			]);
		}
	}
	callback(router)
}

globalThis.defineEndpoint = defineEndpoint
