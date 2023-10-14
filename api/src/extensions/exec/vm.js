// @ts-nocheck

const ivm = $0;
const execBridge = $1;

function exec(...args) {
	return new Promise((resolve, reject) => {
		// Turn callback functions into references
		if (
			['register-endpoint', 'register-action', 'register-filter', 'register-operation'].includes(args[0]) &&
			typeof args[1]['handler'] === 'function'
		) {
			args[1]['handler'] = new ivm.Reference(args[1]['handler']);
		}

		execBridge.applyIgnored(null, [
			new ivm.ExternalCopy(args).copyInto(),
			new ivm.Reference((error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			}),
		]);
	});
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
