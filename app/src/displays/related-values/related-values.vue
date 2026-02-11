<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { get } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { getLocalTypeForField } from '@/utils/get-local-type';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { getItemRoute } from '@/utils/get-route';
import { transformTemplateVariablesWithPath } from '@/utils/transform-template-variables-with-path';
import RenderTemplate from '@/views/private/components/render-template.vue';
import ValueNull from '@/views/private/components/value-null.vue';

const props = defineProps<{
	collection: string;
	field: string;
	value: Record<string, any> | Record<string, any>[] | null;
	template?: string;
}>();

const { t, te } = useI18n();

const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();

const relatedCollectionData = computed(() => {
	return getRelatedCollection(props.collection, props.field);
});

const relatedCollection = computed(() => {
	return relatedCollectionData.value!.relatedCollection;
});

const junctionCollection = computed(() => {
	return relatedCollectionData.value!.junctionCollection;
});

const localType = computed(() => {
	return getLocalTypeForField(props.collection, props.field)?.toLowerCase();
});

const { primaryKeyField } = useCollection(relatedCollection);

const primaryKeyFieldPath = computed(() => {
	return relatedCollectionData.value!.path
		? [...relatedCollectionData.value!.path, primaryKeyField.value?.field].join('.')
		: primaryKeyField.value?.field;
});

const internalTemplate = computed(() => {
	if (props.template) return props.template;

	// Try junction collection display template
	if (junctionCollection.value) {
		const junctionInfo = collectionsStore.getCollection(junctionCollection.value);
		const junctionTemplate = junctionInfo?.meta?.display_template;

		if (junctionTemplate) return junctionTemplate;
	}

	// Try related collection display template
	const collectionMeta = collectionsStore.getCollection(relatedCollection.value);
	const relatedTemplate = collectionMeta?.meta?.display_template;

	if (relatedTemplate) {
		const path = relatedCollectionData.value?.path ?? [];
		return transformTemplateVariablesWithPath(relatedTemplate, path);
	}

	// Fallback to primary key template
	return `{{ ${primaryKeyFieldPath.value!} }}`;
});

const unit = computed(() => {
	if (Array.isArray(props.value)) {
		if (props.value.length === 1) {
			if (te(`collection_names_singular.${relatedCollection.value}`)) {
				return t(`collection_names_singular.${relatedCollection.value}`);
			} else {
				return t('item');
			}
		} else {
			if (te(`collection_names_plural.${relatedCollection.value}`)) {
				return t(`collection_names_plural.${relatedCollection.value}`);
			} else {
				return t('items');
			}
		}
	}

	return null;
});

/**
 * Transform M2A collection-specific template syntax
 * Transforms {{item:CollectionName.field}} to {{item.field}} if collection matches
 */
function transformM2ATemplate(template: string, itemCollection: string): string {
	const regex = /{{item:([^.]+)\.([^}]+)}}/g;
	let transformedTemplate = template;

	for (const match of [...template.matchAll(regex)]) {
		const fullMatch = match[0];
		const templateCollection = match[1];
		const field = match[2];

		if (templateCollection === itemCollection) {
			transformedTemplate = transformedTemplate.replace(fullMatch, `{{item.${field}}}`);
		} else {
			transformedTemplate = transformedTemplate.replace(fullMatch, '');
		}
	}

	return transformedTemplate;
}

/**
 * Get the collection name for a specific item.
 * For M2A, reads from the item's "collection" field.
 * Otherwise, returns junction or related collection.
 */
function getCollectionForItem(item: any): string {
	if (localType.value === 'm2a') {
		return item.collection || relatedCollection.value;
	}

	return junctionCollection.value ?? relatedCollection.value;
}

/**
 * Get the display template for a specific item.
 * For M2A, resolves template dynamically based on item's collection.
 * For other types, uses the standard internalTemplate.
 */
function getTemplateForItem(item: any): string {
	if (localType.value !== 'm2a') {
		return internalTemplate.value || '';
	}

	// M2A case
	// Field configuration display template
	if (props.template) {
		const itemCollection = getCollectionForItem(item);
		return transformM2ATemplate(props.template, itemCollection);
	}

	// Junction collection display template
	if (relatedCollection.value) {
		const junctionMeta = collectionsStore.getCollection(relatedCollection.value);
		const junctionTemplate = junctionMeta?.meta?.display_template;

		if (junctionTemplate) {
			const itemCollection = getCollectionForItem(item);
			return transformM2ATemplate(junctionTemplate, itemCollection);
		}
	}

	// Target collection display template
	const itemCollection = getCollectionForItem(item);
	const targetCollection = collectionsStore.getCollection(itemCollection);
	const template = targetCollection?.meta?.display_template;

	if (template) {
		// Transform "{{name}}" to "{{item.name}}" for M2A data structure
		return transformTemplateVariablesWithPath(template, ['item']);
	}

	// Fallback: primary key of item's collection
	const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(itemCollection);
	return `{{ item.${primaryKeyField?.field || 'id'} }}`;
}

function getLinkForItem(item: any) {
	if (!relatedCollectionData.value || !primaryKeyFieldPath.value) return null;

	// For M2A, get the collection from the item
	const collection = localType.value === 'm2a' ? getCollectionForItem(item) : relatedCollection.value;

	const primaryKey = get(item, primaryKeyFieldPath.value);

	return getItemRoute(collection, primaryKey);
}
</script>

<template>
	<ValueNull v-if="!relatedCollection" />
	<VMenu
		v-else-if="['o2m', 'm2m', 'm2a', 'translations', 'files'].includes(localType!)"
		show-arrow
		:disabled="value?.length === 0"
	>
		<template #activator="{ toggle }">
			<span class="toggle" :class="{ disabled: value?.length === 0 }" @click.stop="toggle">
				<span class="label">
					{{ value?.length }}
					<template v-if="value?.length >= 100">+</template>
					{{ unit }}
				</span>
			</span>
		</template>

		<VList class="links">
			<VListItem v-for="item in value" :key="item[primaryKeyFieldPath!]">
				<VListItemContent>
					<RenderTemplate :template="getTemplateForItem(item)" :item="item" :collection="getCollectionForItem(item)" />
				</VListItemContent>
				<VListItemIcon>
					<RouterLink :to="getLinkForItem(item)!"><VIcon name="launch" small /></RouterLink>
				</VListItemIcon>
			</VListItem>
		</VList>
	</VMenu>
	<RenderTemplate v-else :template="internalTemplate" :item="value" :collection="relatedCollection" />
</template>

<style lang="scss" scoped>
.toggle {
	position: relative;

	--toggle-px: 6px;
	--toggle-py: 4px;

	&::before {
		position: absolute;
		inset-block-start: calc(-1 * var(--toggle-py));
		inset-inline-start: calc(-1 * var(--toggle-px));
		z-index: 1;
		inline-size: calc(100% + var(--toggle-px) * 2);
		block-size: calc(100% + var(--toggle-py) * 2);
		background-color: var(--theme--background-normal);
		border-radius: var(--theme--border-radius);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		content: '';
	}

	.label {
		position: relative;
		z-index: 2;
	}

	&:not(.disabled):hover::before {
		opacity: 1;
	}

	&:not(.disabled):active::before {
		background-color: var(--theme--background-accent);
	}

	.render-template > .v-menu & {
		margin: var(--toggle-py) var(--toggle-px);
	}
}

.render-template > .v-menu {
	display: inline;
}

.disabled {
	color: var(--theme--foreground-subdued);
	pointer-events: none;
}

.links {
	.v-list-item-content {
		block-size: var(--v-list-item-min-height, 32px);
	}
}
</style>
