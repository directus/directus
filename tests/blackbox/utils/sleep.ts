export function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}

export function delayedSleep(ms: number) {
	let isRunning = false;
	let resolve: (value?: unknown) => void;

	const sleep = new Promise((r) => {
		resolve = r;
	});

	const sleepIsRunning = () => {
		return isRunning;
	};

	const sleepStart = () => {
		isRunning = true;

		const timeout = setTimeout(() => {
			isRunning = false;
			resolve();
		}, ms);

		timeout.unref();
	};

	return { sleep, sleepStart, sleepIsRunning };
}
