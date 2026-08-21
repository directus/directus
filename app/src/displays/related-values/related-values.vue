<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { get } from 'lodash';
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { useRelationM2A } from '@/composables/use-relation-m2a';
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
const { relationInfo } = useRelationM2A(toRef(props, 'collection'), toRef(props, 'field'));

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
	return localType.value === 'm2a' ? relationInfo.value : undefined;
});

const items = computed(() => {
	return Array.isArray(props.value) ? props.value : [];
});

const singleItem = computed(() => {
	return props.value && !Array.isArray(props.value) ? props.value : undefined;
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
		if (m2aRelationInfo.value) {
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

function getLinkForItem(item: Record<string, any>) {
	if (m2aRelationInfo.value) {
		const collection = getM2ACollection(item);
		const primaryKeyField = collection ? m2aRelationInfo.value.relationPrimaryKeyFields[collection] : undefined;
		const primaryKey = primaryKeyField ? getM2AValue(item)?.[primaryKeyField.field] : undefined;

		if (!collection || primaryKey === null || primaryKey === undefined) return null;

		return getItemRoute(collection, primaryKey);
	}

	if (!relatedCollectionData.value || !primaryKeyFieldPath.value) return null;
	const primaryKey = get(item, primaryKeyFieldPath.value);

	return getItemRoute(relatedCollection.value, primaryKey);
}

function getM2ACollection(item: Record<string, any>) {
	return m2aRelationInfo.value ? item[m2aRelationInfo.value.collectionField.field] : undefined;
}

function getM2AValue(item: Record<string, any>): Record<string, any> | undefined {
	if (!m2aRelationInfo.value) return undefined;

	const value = item[m2aRelationInfo.value.junctionField.field];
	return value && !Array.isArray(value) && typeof value === 'object' ? value : undefined;
}

function getM2ATemplate(item: Record<string, any>) {
	const collection = getM2ACollection(item);
	if (!collection || !m2aRelationInfo.value) return '';

	const collectionInfo = m2aRelationInfo.value.allowedCollections.find((item) => item.collection === collection);
	const primaryKeyField = m2aRelationInfo.value.relationPrimaryKeyFields[collection];

	return collectionInfo?.meta?.display_template || (primaryKeyField ? `{{ ${primaryKeyField.field} }}` : '');
}

function getM2ACollectionName(item: Record<string, any>) {
	const collection = getM2ACollection(item);
	if (!collection) return t('item');

	if (te(`collection_names_singular.${collection}`)) {
		return t(`collection_names_singular.${collection}`);
	}

	return m2aRelationInfo.value?.allowedCollections.find((item) => item.collection === collection)?.name ?? collection;
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
			<VListItem v-for="item in items" :key="item[primaryKeyFieldPath!]">
				<VListItemContent>
					<div v-if="m2aRelationInfo && !template" class="m2a-item">
						<span class="collection">{{ getM2ACollectionName(item) }}:</span>
						<RenderTemplate
							:template="getM2ATemplate(item)"
							:item="getM2AValue(item)"
							:collection="getM2ACollection(item)"
						/>
					</div>
					<RenderTemplate
						v-else
						:template="internalTemplate"
						:item="item"
						:collection="junctionCollection ?? relatedCollection"
					/>
				</VListItemContent>
				<VListItemIcon>
					<RouterLink v-if="getLinkForItem(item)" :to="getLinkForItem(item)!">
						<VIcon name="launch" small />
					</RouterLink>
				</VListItemIcon>
			</VListItem>
		</VList>
	</VMenu>
	<RenderTemplate v-else :template="internalTemplate" :item="singleItem" :collection="relatedCollection" />
</template>

<style lang="scss" scoped>
.toggle {
	position: relative;

	--toggle-px: 0.3125rem;
	--toggle-py: 0.25rem;

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
		block-size: var(--v-list-item-min-height, 1.8125rem);
	}
}

.m2a-item {
	display: flex;
	gap: 0.25rem;

	.collection {
		font-weight: 600;
	}
}
</style>
