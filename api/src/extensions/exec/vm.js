const ivm = $0;
const execBridge = $1;

/**
 * Main communication bus to nodejs
 * @param {string} type
 * @param {Record<string, any>} options
 * @returns {Promise<any>}
 */
function exec(type, options) {
	return new Promise((resolve, reject) => {

		if (type === 'create-endpoint' && typeof options['callback'] === 'function') {
			options['callback'] = new ivm.Reference(options['callback']);
		}

		execBridge.applyIgnored(null, [
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
	})
}

globalThis.exec = exec;

// Future implementation for sync calls

// const execBridgeSync = $2;

// /**
//  * Main communication bus to nodejs (Just a test)
//  * @param {string} type
//  * @param {Record<string, any>} options
//  * @returns {any}
//  */
// function execSync(type, options) {
// 	if (type === 'create-endpoint' && typeof options['callback'] === 'function') {
// 		options['callback'] = new ivm.Reference(options['callback']);
// 	}

// 	return execBridgeSync.applySyncPromise(null, [
// 		type,
// 		options,
// 	]);
// }


// globalThis.execSync = execSync;
