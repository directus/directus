export class NotAuthenticated extends Error {
	constructor() {
		super('No authentication');
	}
}
