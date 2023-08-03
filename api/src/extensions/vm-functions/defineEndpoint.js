function defineEndpoint(callback) {
	const router = {
		get: (path, endpoint_callback) => {
			console.log(2)
			makeEndpoint('get', path, new ivm.Callback(endpoint_callback, { async: true }));
		}
	}
	callback(router)
}
