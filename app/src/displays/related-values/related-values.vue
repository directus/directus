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
import { useRelationsStore } from '@/stores/relations';
import { getLocalTypeForField } from '@/utils/get-local-type';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { getItemRoute } from '@/utils/get-route';
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
const relationsStore = useRelationsStore();

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

const m2aRelationInfo = computed(() => {
	if (localType.value !== 'm2a') return null;

	const relations = relationsStore.getRelationsForField(props.collection, props.field);

	const junction = relations.find(
		(relation) =>
			relation.related_collection === props.collection &&
			relation.meta?.one_field === props.field &&
			relation.meta?.junction_field,
	);

	if (!junction) return null;

	const relation = relations.find(
		(relation) => relation.collection === junction.collection && relation.field === junction.meta?.junction_field,
	);

	if (!relation?.meta?.one_collection_field || !junction.meta?.junction_field) return null;

	const primaryKeyFields = Object.fromEntries(
		(relation.meta.one_allowed_collections ?? [])
			.map((collection) => [collection, fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field ?? null])
			.filter(([, field]) => field !== null),
	) as Record<string, string>;

	const templates = Object.fromEntries(
		Object.entries(primaryKeyFields).map(([collection, primaryKeyField]) => [
			collection,
			collectionsStore.getCollection(collection)?.meta?.display_template || `{{ ${primaryKeyField} }}`,
		]),
	);

	return {
		collectionField: relation.meta.one_collection_field,
		junctionField: junction.meta.junction_field,
		primaryKeyFields,
		templates,
	};
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

const unit = computed(() => {
	if (Array.isArray(props.value)) {
		if (localType.value === 'm2a') {
			return props.value.length === 1 ? t('item') : t('items');
		}

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
	if (m2aRelationInfo.value) {
		const itemCollection = item?.[m2aRelationInfo.value.collectionField];
		const primaryKeyField = itemCollection ? m2aRelationInfo.value.primaryKeyFields[itemCollection] : null;

		const primaryKey =
			itemCollection && primaryKeyField ? item?.[m2aRelationInfo.value.junctionField]?.[primaryKeyField] : null;

		if (!itemCollection || primaryKey === null || primaryKey === undefined) return null;

		return getItemRoute(itemCollection, primaryKey);
	}

	if (!relatedCollectionData.value || !primaryKeyFieldPath.value) return null;
	const primaryKey = get(item, primaryKeyFieldPath.value);

	return getItemRoute(relatedCollection.value, primaryKey);
}

function getM2ACollection(item: any) {
	return m2aRelationInfo.value ? (item?.[m2aRelationInfo.value.collectionField] ?? null) : null;
}

function getM2ATemplate(item: any) {
	const itemCollection = getM2ACollection(item);

	if (!itemCollection || !m2aRelationInfo.value) return '';

	return m2aRelationInfo.value.templates[itemCollection] ?? '';
}

function getM2AValue(item: any) {
	return m2aRelationInfo.value ? (item?.[m2aRelationInfo.value.junctionField] ?? null) : null;
}

function getM2APrefix(item: any) {
	const itemCollection = getM2ACollection(item);

	if (!itemCollection) return t('item');

	if (te(`collection_names_singular.${itemCollection}`)) {
		return t(`collection_names_singular.${itemCollection}`);
	}

	return collectionsStore.getCollection(itemCollection)?.name ?? itemCollection;
}
</script>

<template>
	<ValueNull v-if="!relatedCollection" />
	<VMenu
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

		<VList class="links">
			<template v-if="localType === 'm2a' && !template">
				<VListItem v-for="item in value" :key="item[primaryKeyFieldPath!]">
					<VListItemContent class="m2a-item">
						<span class="collection">{{ getM2APrefix(item) }}:</span>
						<RenderTemplate
							:template="getM2ATemplate(item)"
							:item="getM2AValue(item)"
							:collection="getM2ACollection(item) || undefined"
						/>
					</VListItemContent>
					<VListItemIcon>
						<RouterLink v-if="getLinkForItem(item)" :to="getLinkForItem(item)!">
							<VIcon name="launch" small />
						</RouterLink>
					</VListItemIcon>
				</VListItem>
			</template>

			<template v-else>
				<VListItem v-for="item in value" :key="item[primaryKeyFieldPath!]">
					<VListItemContent>
						<RenderTemplate
							:template="internalTemplate"
							:item="item"
							:collection="junctionCollection ?? relatedCollection"
						/>
					</VListItemContent>
					<VListItemIcon>
						<RouterLink :to="getLinkForItem(item)!"><VIcon name="launch" small /></RouterLink>
					</VListItemIcon>
				</VListItem>
			</template>
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

.m2a-item {
	display: flex;
	gap: 4px;

	.collection {
		font-weight: 600;
	}
}
</style>
