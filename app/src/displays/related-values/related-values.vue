<script setup lang="ts">
import { getLocalTypeForField } from '@/utils/get-local-type';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { getItemRoute } from '@/utils/get-route';
import { useCollection } from '@directus/composables';
import { get } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRelationM2A } from '@/composables/use-relation-m2a';
import { ref } from 'vue';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';

const props = defineProps<{
	collection: string;
	field: string;
	value: Record<string, any> | Record<string, any>[] | null;
	template?: string;
}>();

const { t, te } = useI18n();

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
	return getLocalTypeForField(props.collection, props.field);
});

const { primaryKeyField } = useCollection(relatedCollection);

const primaryKeyFieldPath = computed(() => {
	return relatedCollectionData.value!.path
		? [...relatedCollectionData.value!.path, primaryKeyField.value?.field].join('.')
		: primaryKeyField.value?.field;
});

const internalTemplate = computed(() => {
	return props.template || `{{ ${primaryKeyFieldPath.value!} }}`;
});

const { relationInfo: m2aRelationInfo } = useRelationM2A(ref(props.collection), ref(props.field));

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

function getLinkForItem(item: any) {
	if (!relatedCollectionData.value || !primaryKeyFieldPath.value) return null;

	// For m2a relationships, we need to handle the structure differently
	if (localType.value === 'm2a' && m2aRelationInfo.value) {
		const collectionField = m2aRelationInfo.value.collectionField.field;
		const junctionField = m2aRelationInfo.value.junctionField.field;
		const collection = item[collectionField];

		if (!collection) return null;

		const pkField = m2aRelationInfo.value.relationPrimaryKeyFields[collection]?.field;

		if (!pkField) return null;

		// For m2a, the junction field contains the primary key value directly
		const primaryKey = item[junctionField];

		if (!primaryKey) return null;

		const route = getItemRoute(collection, primaryKey);
		return route;
	}

	// For other relationship types, use the original logic
	const primaryKey = get(item, primaryKeyFieldPath.value);
	return getItemRoute(relatedCollection.value, primaryKey);
}

// For m2a relationships, get the collection name for each item
function getCollectionName(item: any) {
	if (localType.value === 'm2a' && m2aRelationInfo.value) {
		const collectionField = m2aRelationInfo.value.collectionField.field;
		const collection = item[collectionField];

		if (te(`collection_names_singular.${collection}`)) {
			return t(`collection_names_singular.${collection}`);
		}

		if (te(`collection_names_plural.${collection}`)) {
			return t(`collection_names_plural.${collection}`);
		}

		// Try to get the collection info from the allowed collections
		const allowedCollection = m2aRelationInfo.value.allowedCollections.find((c) => c.collection === collection);
		return allowedCollection?.name || collection;
	}

	return null;
}

// For m2a relationships, get the template for each item based on its collection
function getTemplateForItem(item: any) {
	if (localType.value === 'm2a' && m2aRelationInfo.value) {
		const collectionField = m2aRelationInfo.value.collectionField.field;
		const collection = item[collectionField];

		if (props.template) return props.template;

		const pkField = m2aRelationInfo.value.relationPrimaryKeyFields[collection]?.field;
		return pkField ? `{{ ${pkField} }}` : '{{ id }}';
	}

	return internalTemplate.value;
}

// For m2a relationships, get the item data for rendering
function getItemData(item: any) {
	if (localType.value === 'm2a' && m2aRelationInfo.value) {
		// For m2a displays, the junction field contains the primary key value
		// We need to create a simple object with the primary key for template rendering
		const junctionField = m2aRelationInfo.value.junctionField.field;
		const primaryKey = item[junctionField];
		const collectionField = m2aRelationInfo.value.collectionField.field;
		const collection = item[collectionField];
		const pkField = m2aRelationInfo.value.relationPrimaryKeyFields[collection]?.field;

		if (pkField && primaryKey) {
			return { [pkField]: primaryKey };
		}

		return item;
	}

	return item;
}

// For m2a relationships, get the collection for rendering
function getItemCollection(item: any) {
	if (localType.value === 'm2a' && m2aRelationInfo.value) {
		const collectionField = m2aRelationInfo.value.collectionField.field;
		return item[collectionField];
	}

	return junctionCollection.value ?? relatedCollection.value;
}
</script>

<template>
	<value-null v-if="!relatedCollection" />
	<v-menu
		v-else-if="['o2m', 'm2m', 'm2a', 'translations', 'files'].includes(localType!.toLowerCase())"
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

		<v-list class="links">
			<v-list-item v-for="item in value" :key="item[primaryKeyFieldPath!]">
				<v-list-item-content>
					<!-- For m2a relationships, show collection name and template -->
					<template v-if="localType === 'm2a'">
						<span class="collection-name">{{ getCollectionName(item) }}:</span>
						<render-template
							:template="getTemplateForItem(item)"
							:item="getItemData(item)"
							:collection="getItemCollection(item)"
						/>
					</template>
					<!-- For other relationships, use the original logic -->
					<template v-else>
						<render-template
							:template="internalTemplate"
							:item="item"
							:collection="junctionCollection ?? relatedCollection"
						/>
					</template>
				</v-list-item-content>
				<v-list-item-icon>
					<router-link :to="getLinkForItem(item)!"><v-icon name="launch" small /></router-link>
				</v-list-item-icon>
			</v-list-item>
		</v-list>
	</v-menu>
	<render-template v-else :template="internalTemplate" :item="value" :collection="relatedCollection" />
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

	.collection-name {
		color: var(--theme--primary);
		white-space: nowrap;
		margin-inline-end: 1ch;
	}
}
</style>
