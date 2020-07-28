import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

export default class WebhooksService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_webhooks', options);
	}
}
