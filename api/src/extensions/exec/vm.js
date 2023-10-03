const ivm = $0;
const execBridge = $1;

function exec(type, ...args) {
	return new Promise((resolve, reject) => {

		if (type === 'create-endpoint' && typeof options['callback'] === 'function') {
			options['callback'] = new ivm.Reference(options['callback']);
		}

		execBridge.applyIgnored(null, [
			type,
			new ivm.ExternalCopy(args).copyInto(),
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
