import type { Permission } from '@directus/types';
import { expect, test } from 'vitest';
import { mergePermissions } from './merge-permissions.js';

test('merge empty permission arrays', () => {
	const permissions = mergePermissions('and', [], []);

	expect(permissions).toEqual([]);
});

test('merge two permissions', () => {
	const perm1: Permission = {
		collection: 'collection',
		policy: 'some-policy',
		action: 'read',
		permissions: {},
		validation: {},
		presets: {},
		fields: ['*'],
	};

	const perm2: Permission = {
		collection: 'collection',
		policy: 'some-policy',
		action: 'read',
		permissions: {},
		validation: {},
		presets: {},
		fields: ['*'],
	};

	let permissions = mergePermissions('and', [perm1], [perm2]);

	expect(permissions).toEqual([
		{
			collection: 'collection',
			policy: 'some-policy',
			action: 'read',
			permissions: {
				_and: [{}, {}],
			},
			validation: {
				_and: [{}, {}],
			},
			presets: {},
			fields: ['*'],
		},
	]);

	permissions = mergePermissions('or', [perm1], [perm2]);

	expect(permissions).toEqual([
		{
			collection: 'collection',
			policy: 'some-policy',
			action: 'read',
			permissions: {},
			validation: {},
			presets: {},
			fields: ['*'],
		},
	]);
});

test('merge three permissions', () => {
	const perm1: Permission = {
		collection: 'collection',
		policy: 'some-policy',
		action: 'update',
		permissions: {},
		validation: {},
		presets: {},
		fields: ['*'],
	};

	const perm2: Permission = {
		collection: 'collection',
		policy: 'some-policy',
		action: 'read',
		permissions: {},
		validation: {},
		presets: {},
		fields: ['aa', 'bb'],
	};

	const perm3: Permission = {
		collection: 'collection',
		policy: 'some-policy',
		action: 'read',
		permissions: { aa: { _eq: 1 } },
		validation: {},
		presets: {},
		fields: ['aa'],
	};

	let permissions = mergePermissions('and', [perm1, perm3], [perm2]);

	expect(permissions).toEqual([
		{
			collection: 'collection',
			policy: 'some-policy',
			action: 'update',
			permissions: {},
			validation: {},
			presets: {},
			fields: ['*'],
		},
		{
			collection: 'collection',
			policy: 'some-policy',
			action: 'read',
			permissions: {
				_and: [{ aa: { _eq: 1 } }, {}],
			},
			validation: {
				_and: [{}, {}],
			},
			presets: {},
			fields: ['aa'],
		},
	]);

	permissions = mergePermissions('or', [perm1, perm3], [perm2]);

	expect(permissions).toEqual([
		{
			collection: 'collection',
			policy: 'some-policy',
			action: 'update',
			permissions: {},
			validation: {},
			presets: {},
			fields: ['*'],
		},
		{
			collection: 'collection',
			policy: 'some-policy',
			action: 'read',
			permissions: {},
			validation: {},
			presets: {},
			fields: ['aa', 'bb'],
		},
	]);
});
