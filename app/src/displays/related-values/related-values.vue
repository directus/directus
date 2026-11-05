<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { get } from 'lodash-es';
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { getM2ACollectionTemplates, getM2AJunctionTemplate } from './m2a';
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

const { relationInfo } = useRelationM2A(toRef(props, 'collection'), toRef(props, 'field'));

const m2aInfo = computed(() => (localType.value === 'm2a' ? relationInfo.value : undefined));

const m2aJunctionTemplate = computed(() =>
	m2aInfo.value ? getM2AJunctionTemplate(m2aInfo.value, props.template) : null,
);

const m2aCollectionTemplates = computed(() =>
	m2aInfo.value && !m2aJunctionTemplate.value ? getM2ACollectionTemplates(m2aInfo.value) : null,
);

const internalTemplate = computed(() => {
	return m2aJunctionTemplate.value || props.template || `{{ ${primaryKeyFieldPath.value!} }}`;
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

function getM2ACollectionName(collection: string) {
	if (te(`collection_names_singular.${collection}`)) return t(`collection_names_singular.${collection}`);
	if (te(`collection_names_plural.${collection}`)) return t(`collection_names_plural.${collection}`);

	return m2aInfo.value?.allowedCollections.find((allowed) => allowed.collection === collection)?.name ?? collection;
}

function getLinkForItem(item: any) {
	if (m2aInfo.value) {
		const collection = item[m2aInfo.value.collectionField.field];
		const primaryKeyField = m2aInfo.value.relationPrimaryKeyFields[collection]?.field;
		const primaryKey = primaryKeyField ? get(item, [m2aInfo.value.junctionField.field, primaryKeyField]) : null;

		return primaryKey === null || primaryKey === undefined ? null : getItemRoute(collection, primaryKey);
	}

	if (!relatedCollectionData.value || !primaryKeyFieldPath.value) return null;
	const primaryKey = get(item, primaryKeyFieldPath.value);

	return getItemRoute(relatedCollection.value, primaryKey);
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
			<VListItem v-for="item in value" :key="item[primaryKeyFieldPath!]">
				<VListItemContent>
					<div v-if="m2aInfo && m2aCollectionTemplates" class="m2a-item">
						<span class="collection">{{ getM2ACollectionName(item[m2aInfo.collectionField.field]) }}:</span>
						<RenderTemplate
							:template="m2aCollectionTemplates[item[m2aInfo.collectionField.field]]!"
							:item="item[m2aInfo.junctionField.field]"
							:collection="item[m2aInfo.collectionField.field]"
						/>
					</div>
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
	<RenderTemplate v-else :template="internalTemplate" :item="value" :collection="relatedCollection" />
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

	.m2a-item {
		display: flex;
		align-items: center;
		min-inline-size: 0;
	}

	.collection {
		color: var(--theme--primary);
		white-space: nowrap;
		margin-inline-end: 1ch;
	}
}
</style>
