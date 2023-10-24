<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import { LOCAL_TYPES } from '@directus/constants';
import { orderBy } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import RelatedFieldSelect from '../shared/related-field-select.vue';
import { syncFieldDetailStoreProperty } from '../store';

defineProps<{
	localType: (typeof LOCAL_TYPES)[number];
}>();

const collectionsStore = useCollectionsStore();

const { t } = useI18n();
const relatedCollectionM2O = syncFieldDetailStoreProperty('relations.m2o.related_collection');
const o2mCollection = syncFieldDetailStoreProperty('relations.o2m.collection');
const o2mField = syncFieldDetailStoreProperty('relations.o2m.field');
const oneAllowedCollections = syncFieldDetailStoreProperty('relations.m2o.meta.one_allowed_collections', []);

const availableCollections = computed(() => {
	return [
		...orderBy(collectionsStore.databaseCollections, ['collection'], ['asc']),
		{
			divider: true,
		},
		{
			collection: t('system'),
			selectable: false,
			children: orderBy(collectionsStore.crudSafeSystemCollections, ['collection'], ['asc']),
		},
	];
});
</script>

<template>
	<div class="relationship">
		<div v-if="localType === 'm2o'" class="field full">
			<div class="label type-label">
				{{ t('related_collection') }}
				<v-icon v-tooltip="t('required')" class="required-mark" sup name="star" filled />
			</div>

			<related-collection-select v-model="relatedCollectionM2O" />
		</div>

		<template v-else-if="localType === 'o2m'">
			<div class="field half-left">
				<div class="label type-label">
					{{ t('related_collection') }}
					<v-icon v-tooltip="t('required')" class="required-mark" sup name="star" filled />
				</div>

				<related-collection-select v-model="o2mCollection" />
			</div>

			<div class="field half-right">
				<div class="label type-label">
					{{ t('foreign_key') }}
					<v-icon v-tooltip="t('required')" class="required-mark" sup name="star" filled />
				</div>

				<related-field-select v-model="o2mField" :collection="o2mCollection" :disabled="!o2mCollection" />
			</div>
		</template>

		<div v-if="localType === 'm2m'" class="field full">
			<div class="label type-label">
				{{ t('related_collection') }}
				<v-icon v-tooltip="t('required')" class="required-mark" sup name="star" filled />
			</div>

			<related-collection-select v-model="relatedCollectionM2O" />
		</div>

		<div v-if="localType === 'translations'" class="field full">
			<div class="label type-label">
				{{ t('languages_collection') }}
				<v-icon v-tooltip="t('required')" class="required-mark" sup name="star" filled />
			</div>

			<related-collection-select v-model="relatedCollectionM2O" />
		</div>

		<div v-if="localType === 'm2a'" class="field full">
			<div class="label type-label">
				{{ t('related_collections') }}
				<v-icon v-tooltip="t('required')" class="required-mark" sup name="star" filled />
			</div>

			<v-select
				v-model="oneAllowedCollections"
				:placeholder="t('collection') + '...'"
				:items="availableCollections"
				item-value="collection"
				item-text="collection"
				item-label-font-family="var(--theme--font-family-monospace)"
				item-disabled="meta.singleton"
				multiple
				:multiple-preview-threshold="0"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.relationship {
	@include form-grid;

	--v-select-font-family: var(--theme--font-family-monospace);
	--v-input-font-family: var(--theme--font-family-monospace);

	&:not(:empty) {
		margin-bottom: 20px;
	}

	.v-input.matches {
		--v-input-color: var(--theme--primary);
	}
}
</style>
