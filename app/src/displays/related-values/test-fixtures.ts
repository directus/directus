import type { Field, Relation } from '@directus/types';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

function field(collection: string, name: string, type: string, meta: Partial<Field['meta']> = {}): Field {
	return {
		collection,
		field: name,
		type,
		name,
		schema: type === 'alias' ? null : { is_primary_key: name === 'id' || name === 'uid' },
		meta: { collection, field: name, special: null, display: null, ...meta },
	} as Field;
}

function collection(name: string, displayName: string, displayTemplate: string | null = null) {
	return {
		collection: name,
		name: displayName,
		meta: { collection: name, display_template: displayTemplate, status: 'active' },
		schema: { name },
	};
}

// The junction uses `target` and `kind` so tests catch hard-coded `item` and `collection` names.
export function seedM2A({ junctionTemplate = null }: { junctionTemplate?: string | null } = {}) {
	useCollectionsStore().collections = [
		collection('pages', 'Pages'),
		collection('pages_blocks', 'Pages Blocks', junctionTemplate),
		collection('headings', 'Headings', '{{text}}'),
		collection('texts', 'Texts'),
	] as any;

	useFieldsStore().fields = [
		field('pages', 'id', 'integer'),
		field('pages', 'blocks', 'alias', { special: ['m2a'] }),
		field('pages_blocks', 'id', 'integer'),
		field('pages_blocks', 'pages_id', 'integer'),
		field('pages_blocks', 'target', 'string'),
		field('pages_blocks', 'kind', 'string'),
		field('headings', 'id', 'integer'),
		field('headings', 'text', 'string'),
		field('texts', 'uid', 'uuid'),
		field('texts', 'body', 'text'),
	];

	useRelationsStore().relations = [
		{
			collection: 'pages_blocks',
			field: 'target',
			related_collection: null,
			schema: null,
			meta: {
				many_collection: 'pages_blocks',
				many_field: 'target',
				one_collection: null,
				one_field: null,
				one_collection_field: 'kind',
				one_allowed_collections: ['headings', 'texts'],
				junction_field: 'pages_id',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
		{
			collection: 'pages_blocks',
			field: 'pages_id',
			related_collection: 'pages',
			schema: null,
			meta: {
				many_collection: 'pages_blocks',
				many_field: 'pages_id',
				one_collection: 'pages',
				one_field: 'blocks',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: 'target',
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	] as Relation[];
}
