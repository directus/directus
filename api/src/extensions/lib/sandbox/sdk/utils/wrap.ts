/**
 * Call the passed function in a try-catch, and return the output wrapped in a state object.
 *
 * This is needed as isolated-vm doesn't allow the isolate to catch errors that are thrown in the
 * host. Instead, we'll wrap the output in a known shape which allows the isolated sdk context to
 * re-throw the error in the correct context.
 *
 * @see https://github.com/laverdet/isolated-vm/issues/417
 */
export function wrap(name: string, util: (...args: any[]) => any) {
	return async (...args: any[]) => {
		try {
			return { result: await util(...args), error: false };
		} catch (error) {
			// isolated-vm expects objects thrown from within the vm to be an instance of `Error`
			let result;

			if (error instanceof Error) {
				// Don't expose the stack trace to the vm
				delete error.stack;

				// Serialize the remaining error properties
				for (const key of Object.getOwnPropertyNames(error)) {
					const value = error[key as keyof typeof error];

					if (!value || typeof value !== 'object') continue;

					error[key as keyof typeof error] = JSON.stringify(value, getCircularReplacer());
				}

				result = error;
			} else if (error && typeof error !== 'object') {
				result = error;
			} else {
				result = new Error(`Unknown error in "${name}" Sandbox SDK function`);
			}

			return { result, error: true };
		}
	};
}

function getCircularReplacer() {
	const seen = new WeakSet();

	return (_key: string, value: unknown) => {
		if (value !== null && typeof value === 'object') {
			if (seen.has(value)) {
				return '[Circular]';
			}

			seen.add(value);
		}

		return value;
	};
}
