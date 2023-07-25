export function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}

export function delayedSleep(ms: number) {
	let sleepIsRunning = false;
	let resolve: (value?: unknown) => void;

	const sleep = new Promise((r) => {
		resolve = r;
	});

	const sleepStart = () => {
		sleepIsRunning = true;

		const timeout = setTimeout(() => {
			sleepIsRunning = false;
			resolve();
		}, ms);

		timeout.unref();
	};

	return { sleep, sleepStart, sleepIsRunning };
}
