import ItemsService from './items';
import { AbstractServiceOptions } from '../types';

export default class FoldersService extends ItemsService {
	constructor(options?: AbstractServiceOptions) {
		super('directus_folders', options);
	}
}
