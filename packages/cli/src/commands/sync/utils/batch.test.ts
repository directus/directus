import { describe, expect, it } from 'vitest';
import { remapSystemRecord } from './batch.js';
import { allResources, type Resource } from './resources.js';

function resource(collection: string): Resource {
	const found = allResources().find((entry) => entry.collection === collection);
	if (found === undefined) throw new Error(`no resource for ${collection}`);
	return found;
}

const bucket = {
	directus_access: { a1: 'ta1' },
	directus_roles: { sr: 'tr' },
	directus_policies: { sp: 'tp' },
	directus_folders: { fChild: 'tChild', fParent: 'tParent' },
};

describe('remapSystemRecord', () => {
	it('replaces the primary key and every static FK with its target-space id, reporting the send pair', () => {
		const { record, sent } = remapSystemRecord(
			{ id: 'a1', role: 'sr', policy: 'sp', user: null },
			resource('directus_access'),
			bucket,
		);

		expect(record).toEqual({ id: 'ta1', role: 'tr', policy: 'tp', user: null });
		expect(sent).toEqual({ sourceId: 'a1', sentPk: 'ta1' });
	});

	it('leaves an FK with no mapping verbatim — an in-batch new record or a genuine dangle, never a guess', () => {
		const { record } = remapSystemRecord(
			{ id: 'a1', role: 'unmapped', policy: 'sp', user: null },
			resource('directus_access'),
			bucket,
		);

		expect(record['role']).toBe('unmapped');
		expect(record['policy']).toBe('tp');
	});

	it('leaves the primary key verbatim on a miss and reports sentPk as the source id', () => {
		const miss = remapSystemRecord({ id: 'new', name: 'New' }, resource('directus_roles'), bucket);
		expect(miss.record['id']).toBe('new');
		expect(miss.sent).toEqual({ sourceId: 'new', sentPk: 'new' });
	});

	it('remaps a folder onto its target id and its parent onto the target parent — the self-ref tree survives', () => {
		const { record, sent } = remapSystemRecord(
			{ id: 'fChild', name: 'Images', parent: 'fParent' },
			resource('directus_folders'),
			bucket,
		);

		expect(record).toEqual({ id: 'tChild', name: 'Images', parent: 'tParent' });
		expect(sent).toEqual({ sourceId: 'fChild', sentPk: 'tChild' });
	});

	it('never mutates the input record and leaves non-key fields untouched', () => {
		const input = { id: 'sr', name: 'Editor', icon: 'shield', parent: null };
		const { record } = remapSystemRecord(input, resource('directus_roles'), bucket);

		expect(input.id).toBe('sr');
		expect(record).toEqual({ id: 'tr', name: 'Editor', icon: 'shield', parent: null });
	});
});
