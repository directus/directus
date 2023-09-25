export function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}

export function delayedSleep(ms: number) {
	let hasStarted = false;
	let resolve: (value?: unknown) => void;

	const sleep = new Promise((r) => {
		resolve = r;
	});

	const sleepStart = () => {
		if (hasStarted) {
			return;
		}

		hasStarted = true;

		setTimeout(() => {
			resolve();
		}, ms);
	};

	const sleepHasStarted = () => {
		return hasStarted;
	};

	return { sleep, sleepStart, sleepHasStarted };
}
