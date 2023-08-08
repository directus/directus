const ivm = $0
const requestService = $1

class ItemsService {

	constructor(collection) {
		const service = requestService.applySync(null, [
			'items',
			collection
		])

		return new Proxy({}, {
			get: (target, prop) => {
				return (...args) => {
					console.log('args', args, prop, service)
					return new Promise((resolve, reject) => {

						service.apply(null, [
							new ivm.Reference(resolve),
							new ivm.Reference(reject),
							prop,
							new ivm.ExternalCopy(args).copyInto()
						])
					})
				}
			}
		})
	}
}

globalThis.ItemsService = ItemsService
