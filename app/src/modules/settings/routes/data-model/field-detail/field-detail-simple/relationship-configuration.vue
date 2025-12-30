<script setup lang="ts">
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import RelatedFieldSelect from '../shared/related-field-select.vue';
import { syncFieldDetailStoreProperty } from '../store';
import VIcon from '@/components/v-icon/v-icon.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useCollectionsStore } from '@/stores/collections';
import { LOCAL_TYPES } from '@directus/constants';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

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
		...collectionsStore.databaseCollections.filter((collection) => collection.meta),
		{
			divider: true,
		},
		{
			collection: t('system'),
			selectable: false,
			children: collectionsStore.crudSafeSystemCollections,
		},
	];
});
</script>

<template>
	<div class="relationship">
		<div v-if="localType === 'm2o'" class="field full">
			<div class="label type-label">
				{{ $t('related_collection') }}
				<VIcon v-tooltip="$t('required')" class="required-mark" sup name="star" filled />
			</div>

			<RelatedCollectionSelect v-model="relatedCollectionM2O" />
		</div>

		<template v-else-if="localType === 'o2m'">
			<div class="field half-left">
				<div class="label type-label">
					{{ $t('related_collection') }}
					<VIcon v-tooltip="$t('required')" class="required-mark" sup name="star" filled />
				</div>

				<RelatedCollectionSelect v-model="o2mCollection" />
			</div>

			<div class="field half-right">
				<div class="label type-label">
					{{ $t('foreign_key') }}
					<VIcon v-tooltip="$t('required')" class="required-mark" sup name="star" filled />
				</div>

				<RelatedFieldSelect v-model="o2mField" :collection="o2mCollection" :disabled="!o2mCollection" />
			</div>
		</template>

		<div v-if="localType === 'm2m'" class="field full">
			<div class="label type-label">
				{{ $t('related_collection') }}
				<VIcon v-tooltip="$t('required')" class="required-mark" sup name="star" filled />
			</div>

			<RelatedCollectionSelect v-model="relatedCollectionM2O" />
		</div>

		<div v-if="localType === 'translations'" class="field full">
			<div class="label type-label">
				{{ $t('languages_collection') }}
				<VIcon v-tooltip="$t('required')" class="required-mark" sup name="star" filled />
			</div>

			<RelatedCollectionSelect v-model="relatedCollectionM2O" />
		</div>

		<div v-if="localType === 'm2a'" class="field full">
			<div class="label type-label">
				{{ $t('related_collections') }}
				<VIcon v-tooltip="$t('required')" class="required-mark" sup name="star" filled />
			</div>

			<VSelect
				v-model="oneAllowedCollections"
				:placeholder="$t('collection') + '...'"
				:items="availableCollections"
				item-value="collection"
				item-text="collection"
				item-label-font-family="var(--theme--fonts--monospace--font-family)"
				item-disabled="meta.singleton"
				multiple
				:multiple-preview-threshold="0"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.relationship {
	--v-select-font-family: var(--theme--fonts--monospace--font-family);
	--v-input-font-family: var(--theme--fonts--monospace--font-family);

	@include mixins.form-grid;

	&:not(:empty) {
		margin-block-end: 20px;
	}

	.v-input.matches {
		--v-input-color: var(--theme--primary);
	}
}
</style>
