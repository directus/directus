import { BaseException } from './base';

export class RouteNotFoundException extends BaseException {
	constructor(path: string) {
		super(`Route ${path} doesn't exist.`, 404, 'ROUTE_NOT_FOUND');
	}
}
