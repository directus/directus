// @ts-nocheck

const ivm = $0
const makeEndpoint = $1

function defineEndpoint(callback) {
	const router = {
		all: makeFunc('all'),
		get: makeFunc('get'),
		post: makeFunc('post'),
		patch: makeFunc('patch'),
		delete: makeFunc('delete'),
		options: makeFunc('options'),
	}

	callback(router)

	function makeFunc(type) {
		return (path, endpoint_callback) => {
			makeEndpoint.apply(undefined, [
				type,
				path,
				new ivm.Reference((...args) => {
					endpoint_callback(...args)
				})
			]);
		}
	}
}

globalThis.defineEndpoint = defineEndpoint
