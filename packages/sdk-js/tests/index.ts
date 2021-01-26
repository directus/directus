import DirectusSDK from '../src/index';
import {
	ItemsHandler,
	UtilsHandler,
	ActivityHandler,
	FoldersHandler,
	PermissionsHandler,
	PresetsHandler,
	RolesHandler,
	UsersHandler,
	SettingsHandler,
	FilesHandler,
	AuthHandler,
	CollectionsHandler,
	FieldsHandler,
	RelationsHandler,
	RevisionsHandler,
	ServerHandler,
} from '../src/handlers/';

import { expect } from 'chai';
import { MemoryStore } from '../src/utils';

describe('DirectusSDK', () => {
	let directus: DirectusSDK;

	beforeEach(() => (directus = new DirectusSDK('http://example.com')));

	it('Initializes', () => {
		expect(directus).to.be.instanceOf(DirectusSDK);
	});

	it('Sets the passed authOptions', () => {
		const fakeStore = { async getItem() {}, async setItem() {} };
		const directusWithOptions = new DirectusSDK('http://example.com', {
			auth: {
				autoRefresh: false,
				storage: fakeStore,
				mode: 'json',
			},
		});

		expect(directusWithOptions['authOptions'].autoRefresh).to.be.false;
		expect(directusWithOptions['authOptions'].mode).to.equal('json');
		expect(directusWithOptions['authOptions'].storage).to.equal(fakeStore);
	});

	it('Defaults to the correct auth options', () => {
		expect(directus['authOptions'].autoRefresh).to.be.false;
		expect(directus['authOptions'].mode).to.equal('cookie');
		expect(directus['authOptions'].storage).to.be.instanceOf(MemoryStore);
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

	it('Returns ActivityHandler instance for #activity', () => {
		expect(directus.activity).to.be.instanceOf(ActivityHandler);
	});

	it('Returns AuthHandler for #auth', () => {
		expect(directus.auth).to.be.instanceOf(AuthHandler);
	});

	it('Returns CollectionsHandler for #collections', () => {
		expect(directus.collections).to.be.instanceOf(CollectionsHandler);
	});

	it('Returns FieldsHandler for #fields', () => {
		expect(directus.fields).to.be.instanceOf(FieldsHandler);
	});

	it('Returns FilesHandler for #users', () => {
		expect(directus.files).to.be.instanceOf(FilesHandler);
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

	it('Returns RelationsHandler for #roles', () => {
		expect(directus.relations).to.be.instanceOf(RelationsHandler);
	});

	it('Returns RevisionsHandler for #revisions', () => {
		expect(directus.revisions).to.be.instanceOf(RevisionsHandler);
	});

	it('Returns RolesHandler for #roles', () => {
		expect(directus.roles).to.be.instanceOf(RolesHandler);
	});

	it('Returns ServerHandler for #server', () => {
		expect(directus.server).to.be.instanceOf(ServerHandler);
	});

	it('Returns SettingsHandler for #settings', () => {
		expect(directus.settings).to.be.instanceOf(SettingsHandler);
	});

	it('Returns UsersHandler for #users', () => {
		expect(directus.users).to.be.instanceOf(UsersHandler);
	});

	it('Returns UtilsHandler for #utils', () => {
		expect(directus.utils).to.be.instanceOf(UtilsHandler);
	});
});
