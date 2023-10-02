const ivm = $0;
const execBridge = $1;
const execBridgeSync = $2;

/**
 * Main communication bus to nodejs
 * @param {string} type
 * @param {Record<string, any>} options
 * @returns {Promise<any>}
 */
function exec(type, options) {
	log('exec', Object.keys(this))

	return new Promise((resolve, reject) => {

		log('exec', type, typeof options['callback'])

		if (type === 'create-endpoint' && typeof options['callback'] === 'function') {
			options['callback'] = new ivm.Reference(options['callback']);
		}

		log('exec', type, options, execBridge)


		try {
			execBridge.applySync(null, [
				type,
				new ivm.ExternalCopy(options).copyInto(),
				new ivm.Reference((error, result) => {
					if (error) {
						reject(error);
					} else {
						resolve(result);
					}
				}),
			]);
		} catch (error) {
			log(error)
		}
	})
}

/**
 * Main communication bus to nodejs (Just a test)
 * @param {string} type
 * @param {Record<string, any>} options
 * @returns {any}
 */
function execSync(type, options) {
	if (type === 'create-endpoint' && typeof options['callback'] === 'function') {
		options['callback'] = new ivm.Reference(options['callback']);
	}

	return execBridgeSync.applySyncPromise(null, [
		type,
		options,
	]);
}

globalThis.exec = exec;
globalThis.execSync = execSync;
