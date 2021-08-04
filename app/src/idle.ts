import mitt from 'mitt';

const events = ['pointermove', 'pointerdown', 'keydown'];
const time = 5 * 60 * 1000; // 5 min in ms

let timeout: NodeJS.Timeout;

let visible = true;
let idle = false;

export const idleTracker = mitt();

export function startIdleTracking(): void {
	document.addEventListener('visibilitychange', onVisibilityChange);

	for (const event of events) {
		document.addEventListener(event, onIdleEvents);
	}

	resetTimeout();
}

export function stopIdleTracking(): void {
	document.removeEventListener('visibilitychange', onVisibilityChange);

	for (const event of events) {
		document.removeEventListener(event, onIdleEvents);
	}
}

function onIdleEvents() {
	if (idle === true) {
		idle = false;
		idleTracker.emit('active');
	}

	resetTimeout();
}

function onVisibilityChange() {
	if (document.visibilityState === 'hidden' && visible === true) {
		visible = false;
		idleTracker.emit('hide');
	}

	if (document.visibilityState === 'visible' && visible === false) {
		visible = true;
		idleTracker.emit('show');
	}
}

function resetTimeout() {
	if (timeout) {
		clearTimeout(timeout);
	}

	timeout = setTimeout(() => {
		idle = true;
		idleTracker.emit('idle');
	}, time);
}
