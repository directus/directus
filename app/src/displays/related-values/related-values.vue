<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { get } from 'lodash-es';
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
import { useCollectionsStore } from '@/stores/collections';
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
const { relationInfo } = useRelationM2A(toRef(props, 'collection'), toRef(props, 'field'));

const relatedCollectionData = computed(() => {
	return getRelatedCollection(props.collection, props.field);
});

const relatedCollection = computed(() => {
	return relatedCollectionData.value?.relatedCollection ?? null;
});

const junctionCollection = computed(() => {
	return relatedCollectionData.value?.junctionCollection;
});

const localType = computed(() => {
	return getLocalTypeForField(props.collection, props.field);
});

const { primaryKeyField } = useCollection(relatedCollection);

const primaryKeyFieldPath = computed(() => {
	if (!relatedCollectionData.value) return undefined;
	return relatedCollectionData.value.path
		? [...relatedCollectionData.value.path, primaryKeyField.value?.field].join('.')
		: primaryKeyField.value?.field;
});

const internalTemplate = computed(() => {
	return props.template || `{{ ${primaryKeyFieldPath.value!} }}`;
});

function getM2ACollection(item: any): string | undefined {
	if (!relationInfo.value) return undefined;
	return item[relationInfo.value.collectionField.field];
}

function getM2AItem(item: any): Record<string, any> | undefined {
	if (!relationInfo.value) return undefined;
	const junctionVal = item[relationInfo.value.junctionField.field];

	if (typeof junctionVal === 'object' && junctionVal !== null) {
		return junctionVal;
	}

	const itemCollection = getM2ACollection(item);
	const pk = itemCollection ? relationInfo.value.relationPrimaryKeyFields[itemCollection]?.field : undefined;
	return pk ? { [pk]: junctionVal } : {};
}

function getM2ATemplate(item: any): string {
	const itemCollection = getM2ACollection(item);
	if (!itemCollection || !relationInfo.value) return '';

	const collectionData = collectionsStore.getCollection(itemCollection);
	const pk = relationInfo.value.relationPrimaryKeyFields[itemCollection]?.field;
	return collectionData?.meta?.display_template || (pk ? `{{ ${pk} }}` : '');
}

function getItemKey(item: any, index: number | string) {
	if (primaryKeyFieldPath.value) {
		const key = get(item, primaryKeyFieldPath.value);
		if (key !== undefined && key !== null) return key;
	}

	return index;
}

const unit = computed(() => {
	if (Array.isArray(props.value)) {
		if (props.value.length === 1) {
			if (relatedCollection.value && te(`collection_names_singular.${relatedCollection.value}`)) {
				return t(`collection_names_singular.${relatedCollection.value}`);
			} else {
				return t('item');
			}
		} else {
			if (relatedCollection.value && te(`collection_names_plural.${relatedCollection.value}`)) {
				return t(`collection_names_plural.${relatedCollection.value}`);
			} else {
				return t('items');
			}
		}
	}

	return null;
});

function getLinkForItem(item: any) {
	if (localType.value === 'm2a' && relationInfo.value) {
		const itemCollection = getM2ACollection(item);
		if (!itemCollection) return null;

		const junctionVal = item[relationInfo.value.junctionField.field];
		const pkField = relationInfo.value.relationPrimaryKeyFields[itemCollection]?.field;

		let pk = junctionVal;

		if (typeof junctionVal === 'object' && junctionVal !== null) {
			pk = pkField ? junctionVal[pkField] : undefined;
		}

		return pk ? getItemRoute(itemCollection, pk) : null;
	}

	if (!relatedCollectionData.value || !primaryKeyFieldPath.value) return null;
	const primaryKey = get(item, primaryKeyFieldPath.value);

	return getItemRoute(relatedCollection.value!, primaryKey);
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
			<VListItem v-for="(item, index) in value" :key="getItemKey(item, index)">
				<VListItemContent>
					<RenderTemplate
						v-if="localType === 'm2a' && !template"
						:template="getM2ATemplate(item)"
						:item="getM2AItem(item)"
						:collection="getM2ACollection(item)"
						show-collection-name
					/>
					<RenderTemplate
						v-else
						:template="internalTemplate"
						:item="item"
						:collection="junctionCollection ?? relatedCollection"
					/>
				</VListItemContent>
				<VListItemIcon v-if="getLinkForItem(item)">
					<RouterLink :to="getLinkForItem(item)!"><VIcon name="launch" small /></RouterLink>
				</VListItemIcon>
			</VListItem>
		</VList>
	</VMenu>
	<RenderTemplate
		v-else-if="localType === 'm2a' && !template"
		:template="getM2ATemplate(value)"
		:item="getM2AItem(value)"
		:collection="getM2ACollection(value)"
		show-collection-name
	/>
	<RenderTemplate
		v-else
		:template="internalTemplate"
		:item="value && !Array.isArray(value) ? value : undefined"
		:collection="relatedCollection"
	/>
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
</style>
