function defineEndpoint(callback) {
	const router = {
		get: (path, endpoint_callback) => {
			makeEndpoint('get', path, new ivm.Callback(endpoint_callback));
		}
	}
	callback(router)
}
