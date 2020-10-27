import DirectusSDK from '../src/index';
import {
	ItemsHandler,
	UtilsHandler,
	ActivityHandler,
	FoldersHandler,
	PermissionsHandler,
	PresetsHandler,
} from '../src/handlers/';

import { expect } from 'chai';

describe('DirectusSDK', () => {
	let directus: DirectusSDK;

	beforeEach(() => (directus = new DirectusSDK('http://example.com')));

	it('Initializes', () => {
		expect(directus).to.be.instanceOf(DirectusSDK);
	});

	it('Gets / Sets URL', () => {
		expect(directus.url).to.equal('http://example.com');

		directus.url = 'http://different.example.com';
		expect(directus.url).to.equal('http://different.example.com');
	});

	it('Syncs URL with Axios base instance', () => {
		expect(directus.axios.defaults.baseURL).to.equal('http://example.com');

		directus.url = 'http://different.example.com';
		expect(directus.axios.defaults.baseURL).to.equal('http://different.example.com');
	});

	it('Returns ItemsHandler instance for #items', () => {
		expect(directus.items('articles')).to.be.instanceOf(ItemsHandler);
	});

	it('Errors when trying to read a system collection directly', () => {
		expect(() => directus.items('directus_files')).to.throw();
	});

	it('Returns UtilsHandler instance for #utils', () => {
		expect(directus.utils).to.be.instanceOf(UtilsHandler);
	});

	it('Returns ActivityHandler instance for #activity', () => {
		expect(directus.activity).to.be.instanceOf(ActivityHandler);
	});

	it('Returns FoldersHandler for #folders', () => {
		expect(directus.folders).to.be.instanceOf(FoldersHandler);
	});

	it('Returns PermissionsHandler for #permissions', () => {
		expect(directus.permissions).to.be.instanceOf(PermissionsHandler);
	});

	it('Returns PresetsHandler for #presets', () => {
		expect(directus.presets).to.be.instanceOf(PresetsHandler);
	});
});
