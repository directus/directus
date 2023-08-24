const ivm = $0;
const makeFetch = $1;

function fetch(url, options) {
	return new Promise((resolve, reject) => {
		makeFetch.apply(undefined, [
			url,
			options,
			new ivm.Reference((data, text, json, blob, arrayBuffer, formData) => {
				resolve({
					...data,
					text: async () => await text.applySyncPromise(undefined, []),
					json: async () => await json.applySyncPromise(undefined, []),
					blob: async () => await blob.applySyncPromise(undefined, []),
					arrayBuffer: async () => await arrayBuffer.applySyncPromise(undefined, []),
					formData: async () => await formData.applySyncPromise(undefined, []),
				});
			}),
			new ivm.Reference((...args) => {
				reject(...args);
			}),
		]);
	});
}

globalThis.API.fetch = fetch;
