<template>
	<div ref="templateEl" class="render-template">
		<span class="vertical-aligner" />
		<template v-for="(part, index) in parts" :key="index">
			<value-null v-if="part === null || (typeof part === 'object' && part.value === null)" />
			<component
				:is="`display-${part.component}`"
				v-else-if="typeof part === 'object' && part.component"
				v-bind="part.options"
				:value="part.value"
				:interface="part.interface"
				:interface-options="part.interfaceOptions"
				:type="part.type"
				:collection="part.collection"
				:field="part.field"
			/>
			<span v-else-if="typeof part === 'string'" :dir="direction">{{ translate(part) }}</span>
			<span v-else>{{ part }}</span>
		</template>
	</div>
</template>

<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { useCollectionsStore } from '@/stores/collections';
import { getDefaultDisplayForType } from '@/utils/get-default-display-for-type';
import { translate } from '@/utils/translate-literal';
import { Field } from '@directus/shared/types';
import { get } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { te } = useI18n();

interface Props {
	template: string;
	collection: string;
	fields?: Field[];
	item?: Record<string, any>;
	direction?: string;
}

const props = withDefaults(defineProps<Props>(), {
	fields: () => [],
	item: () => ({}),
	direction: undefined,
});

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();
const collectionsStore = useCollectionsStore();

const templateEl = ref<HTMLElement>();

const regex = /({{.*?}})/g;

const parts = computed(() =>
	props.template
		.split(regex)
		.filter((p) => p)
		.map((part) => {
			if (part.startsWith('{{') === false) return part;

			let fieldKey = part.replace(/{{/g, '').replace(/}}/g, '').trim();
			let fieldKeyBefore = fieldKey.split('.').slice(0, -1).join('.');
			let fieldKeyAfter = fieldKey.split('.').slice(-1)[0];

			// Try getting the value from the item, return some question marks if it doesn't exist
			let value = get(props.item, fieldKeyBefore);

			return Array.isArray(value) ? handleArray(fieldKeyBefore, fieldKeyAfter) : handleObject(fieldKey);
		})
		.map((p) => p ?? null)
);

function handleArray(fieldKeyBefore: string, fieldKeyAfter: string) {
	const value = get(props.item, fieldKeyBefore);
	const field =
		fieldsStore.getField(props.collection, fieldKeyBefore) ||
		props.fields?.find((field) => field.field === fieldKeyBefore);

	if (value === undefined) return null;

	if (!field) return value;

	const displayInfo = useExtension(
		'display',
		computed(() => field.meta?.display ?? null)
	);

	let component = field.meta?.display;
	let options = field.meta?.display_options;

	if (!displayInfo.value) {
		component = 'related-values';
		options = { template: `{{${fieldKeyAfter}}}` };
	}

	return {
		component,
		options,
		value: value,
		interface: field.meta?.interface,
		interfaceOptions: field.meta?.options,
		type: field.type,
		collection: field.collection,
		field: field.field,
	};
}

function handleM2AFields(fieldKey: string): { realPath: string; objectPath: string } {
	const parts = fieldKey.split('.');
	const pathSoFar = {
		realPath: '',
		objectPath: '',
	};

	for (const part of parts) {
		const curRealPath = pathSoFar.realPath === '' ? part : `${pathSoFar.realPath}.${part}`;
		if (part.includes(':')) {
			const [key, collection] = part.split(':');
			const field =
				fieldsStore.getField(props.collection, curRealPath) ||
				props.fields?.find((field) => field.field === curRealPath);
			if (field) {
				const relations = relationsStore.getRelationsForField(field.collection, field.field);
				const m2aRelation = relations.find((relation) => relation.meta?.one_allowed_collections != null);
				const collectionField = m2aRelation?.meta?.one_collection_field;

				if (collectionField) {
					let newKey = `.${key}`;
					let curItemCollection = undefined;
					if (pathSoFar.objectPath === '') {
						curItemCollection = get(props.item, collectionField);
					} else {
						const m2aFieldValue = get(props.item, pathSoFar.objectPath);

						if (Array.isArray(m2aFieldValue)) {
							curItemCollection = get(m2aFieldValue, [0, collectionField]);
							newKey = `[0].${key}`;
						} else {
							curItemCollection = get(m2aFieldValue, collectionField);
						}
					}
					if (curItemCollection === collection) {
						// The item is in the correct scope for the collection
						// we can safely remove the collection scope from the field
						pathSoFar.objectPath = pathSoFar.objectPath === '' ? key : `${pathSoFar.objectPath}${newKey}`;
					} else {
						break;
					}
				} else {
					// Otherwise we should stop there, since the item
					// is not in the correct collection scope for this template field
					// Instead we return the previous field path, which will give us the junction id
					break;
				}
			}
		} else {
			pathSoFar.objectPath = pathSoFar.objectPath === '' ? part : [pathSoFar.objectPath, part].join('.');
		}
		pathSoFar.realPath = curRealPath;
	}

	return pathSoFar;
}

function handleObject(fieldKey: string) {
	const m2aSpecialFieldsRegex = /\$(collection_name_singular|collection_name_plural|item_default_display_template)/g;

	/*
	 * If any m2a special fields are found, we need to replace those with the
	 * appropriate value, otherwise finding the field will fail. They should
	 * always be at the end, so we don't need to worry about nesting deeper.
	 */

	let { objectPath: fieldKeyObjectPath, realPath: fieldKeyReal } = handleM2AFields(fieldKey);

	const specialField = fieldKeyObjectPath.match(m2aSpecialFieldsRegex)?.[0];
	if (specialField) {
		const fieldKeyBase = fieldKeyObjectPath.replace(RegExp(`\\.?\\${specialField}`), '');
		let m2aJunctionCollection = props.collection;
		if (fieldKeyBase !== '') {
			const field =
				fieldsStore.getField(props.collection, fieldKeyBase) ||
				props.fields?.find((field) => field.field === fieldKeyReal);
			if (field?.collection) {
				m2aJunctionCollection = field.collection;
			}
		}
		const relations = relationsStore.getRelationsForCollection(m2aJunctionCollection);
		const m2aRelation = relations.find(
			(relation) => relation.meta?.one_allowed_collections != null && relation.meta?.one_collection_field != null
		);
		if (m2aRelation) {
			const itemCollectionPath =
				fieldKeyBase !== ''
					? [fieldKeyBase, m2aRelation.meta!.one_collection_field!].join('.')
					: m2aRelation.meta!.one_collection_field!;
			const itemCollection = get(props.item, itemCollectionPath);
			const itemCollectionInfo = collectionsStore.getCollection(itemCollection);
			if (itemCollectionInfo) {
				if (specialField === '$collection_name_singular') {
					return te(`collection_names_singular.${itemCollectionInfo.collection}`)
						? `$t:collection_names_singular.${itemCollectionInfo.collection}`
						: itemCollectionInfo.name;
				}
				if (specialField === '$collection_name_plural') {
					return te(`collection_names_plural.${itemCollectionInfo.collection}`)
						? `$t:collection_names_plural.${itemCollectionInfo.collection}`
						: itemCollectionInfo.name;
				}
				if (specialField === '$item_default_display_template') {
					return {
						component: 'related-values',
						options: { template: itemCollectionInfo.meta?.display_template },
						value: fieldKeyBase !== '' ? props.item[fieldKeyBase][m2aRelation.field] : props.item[m2aRelation.field],
						interface: null,
						interfaceOptions: null,
						type: 'unknown',
						collection: m2aJunctionCollection,
						field: `${m2aRelation.field}:${itemCollectionInfo.collection}`,
					};
				}
			}
		}
		// None of the above has worked, so it's best we just discard this field and fall back
		fieldKeyObjectPath = fieldKeyBase;
		fieldKeyReal = fieldKeyReal.replace(RegExp(`\\.?\\${specialField}`), '');
	}

	const field =
		fieldsStore.getField(props.collection, fieldKeyReal) || props.fields?.find((field) => field.field === fieldKeyReal);

	/**
	 * This is for cases where you are rendering a display template directly on
	 * directus_files. The $thumbnail fields doesn't exist, but instead renders a
	 * thumbnail based on the other fields in the file info. In that case, the value
	 * should be the whole related file object, not just the fake "thumbnail" field. By
	 * stripping out the thumbnail part in the field key path, the rest of the function
	 * will extract the value correctly.
	 */
	if (field && field.collection === 'directus_files' && field.field === '$thumbnail') {
		fieldKeyReal = fieldKeyReal
			.split('.')
			.filter((part) => part !== '$thumbnail')
			.join('.');
	}

	let value = get(props.item, fieldKeyObjectPath);

	if (value === undefined) return null;

	if (!field) return value;

	const display = field?.meta?.display || getDefaultDisplayForType(field.type);

	// No need to render the empty display overhead in this case
	if (display === 'raw') return value;

	const displayInfo = useExtension(
		'display',
		computed(() => display)
	);

	// If used display doesn't exist in the current project, return raw value
	if (!displayInfo.value) return value;

	return {
		component: display,
		options: field.meta?.display_options,
		value: value,
		interface: field.meta?.interface,
		interfaceOptions: field.meta?.options,
		type: field.type,
		collection: field.collection,
		field: field.field,
	};
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/no-wrap';

.render-template {
	height: 100%;
	position: relative;
	max-width: 100%;
	padding-right: 8px;

	.vertical-aligner {
		display: inline-block;
		width: 0;
		height: 100%;
		vertical-align: middle;
	}

	@include no-wrap;

	> * {
		vertical-align: middle;
	}

	.render-template {
		display: inline;
	}
}

.subdued {
	color: var(--foreground-subdued);
}
</style>
