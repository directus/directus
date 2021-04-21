export class NotAuthenticated extends Error {
	constructor() {
		super('No authentication');
	}
}

export class InvalidRefreshTime extends Error {
	constructor() {
		super('Invalid authentication refresh time interval');
	}
}
