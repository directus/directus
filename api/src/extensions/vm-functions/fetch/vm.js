const ivm = $0
const makeFetch = $1

function fetch(url, options) {
	return new Promise((resolve, reject) => {
		makeFetch.apply(undefined, [
			url,
			options,
			new ivm.Reference((data, text, json) => {
				resolve({
					...data,
					text: async () => await text.applySyncPromise(undefined, []),
					json: async () => await json.applySyncPromise(undefined, [])
				})
			}),
			new ivm.Reference((...args) => {
				reject(...args)
			})
		]);
	})

}

globalThis.fetch = fetch
