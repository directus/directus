export function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}

export function delayedSleep(ms: number) {
	let isRunning = false;
	let done = false;
	let resolve: (value?: unknown) => void;

	const sleep = new Promise((r) => {
		resolve = r;
	});

	const sleepStart = () => {
		if (done) {
			return;
		}

		isRunning = true;

		setTimeout(() => {
			isRunning = false;
			done = true;
			resolve();
		}, ms);
	};

	const sleepIsRunning = () => {
		return isRunning;
	};

	return { sleep, sleepStart, sleepIsRunning };
}
