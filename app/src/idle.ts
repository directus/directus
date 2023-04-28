import { throttle } from 'lodash';
import mitt from 'mitt';

const events = ['pointermove', 'pointerdown', 'keydown'];

export const time = 5 * 60 * 1000; // 5 min in ms

let timeout: number | null;

let visible = true;
let idle = false;

export const idleTracker = mitt();

const throttledOnIdleEvents = throttle(onIdleEvents, 500);

export function startIdleTracking(): void {
	document.addEventListener('visibilitychange', onVisibilityChange);

	for (const event of events) {
		document.addEventListener(event, throttledOnIdleEvents);
	}

	resetTimeout();
}

export function stopIdleTracking(): void {
	document.removeEventListener('visibilitychange', onVisibilityChange);

	for (const event of events) {
		document.removeEventListener(event, throttledOnIdleEvents);
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
		window.clearTimeout(timeout);
		timeout = null;
	}

	timeout = window.setTimeout(() => {
		idle = true;
		idleTracker.emit('idle');
	}, time);
}
