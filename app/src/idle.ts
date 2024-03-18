import { throttle } from 'lodash';
import emitter, { Events } from './events';

export const time = 5 * 60 * 1000; // 5 min in ms

class IdleTracker {
	readonly events: string[];
	timeout: number  | null;
	visible: boolean;
	idle: boolean;
	throttledEvents: () => any;

	constructor() {
		this.events = ['pointermove', 'pointerdown', 'keydown'];
		this.timeout = null;
		this.visible = true;
		this.idle = false;
		this.throttledEvents = throttle(this.onIdleEvents.bind(this), 500);
	}

	startTracking() {
		document.addEventListener('visibilitychange', this.onVisibilityChange);

		for (const event of this.events) {
			document.addEventListener(event, this.throttledEvents);
		}

		this.resetTimeout();
	}

	stopTracking() {
		document.removeEventListener('visibilitychange', this.onVisibilityChange);

		for (const event of this.events) {
			document.removeEventListener(event, this.throttledEvents);
		}
	}

	onIdleEvents() {
		if (this.idle === true) {
			this.idle = false;
			this.visible = true;
			emitter.emit(Events.tabActive);
		}

		this.resetTimeout();
	}

	resetTimeout() {
		if (this.timeout) {
			window.clearTimeout(this.timeout);
			this.timeout = null;
		}

		this.timeout = window.setTimeout(() => {
			this.idle = true;
			emitter.emit(Events.tabIdle);
		}, time);
	}

	onVisibilityChange() {
		if (document.visibilityState === 'hidden' && this.visible === true) {
			this.visible = false;
			emitter.emit(Events.tabHidden);
		}

		if (document.visibilityState === 'visible' && this.visible === false) {
			this.visible = true;
			emitter.emit(Events.tabActive);
		}
	}
}
