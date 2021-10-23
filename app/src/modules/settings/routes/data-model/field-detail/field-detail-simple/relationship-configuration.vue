<template>
	<div class="relationship">
		<div class="field half-left" v-if="localType === 'm2o'">
			<div class="label type-label">
				{{ t('related_collection') }}
			</div>

			<related-collection-select v-model="relatedCollectionM2O" />
		</div>

		<template v-else-if="localType === 'o2m'">
			<div class="field half-left">
				<div class="label type-label">
					{{ t('related_collection') }}
				</div>

				<related-collection-select v-model="o2mCollection" />
			</div>

			<div class="field half-right">
				<div class="label type-label">
					{{ t('foreign_key') }}
				</div>

				<related-field-select v-model="o2mField" :collection="o2mCollection" :disabled="!o2mCollection" />
			</div>
		</template>

		<div class="field half-left" v-if="localType === 'm2m'">
			<div class="label type-label">
				{{ t('related_collection') }}
			</div>

			<related-collection-select v-model="relatedCollectionM2O" />
		</div>

		<div class="field half-left" v-if="localType === 'translations'">
			<div class="label type-label">
				{{ t('languages_collection') }}
			</div>

			<related-collection-select v-model="relatedCollectionM2O" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { LOCAL_TYPES } from '@directus/shared/constants';
import { syncFieldDetailStoreProperty } from '../store';
import { useI18n } from 'vue-i18n';
import RelatedCollectionSelect from '../shared/related-collection-select.vue';
import RelatedFieldSelect from '../shared/related-field-select.vue';

export default defineComponent({
	components: { RelatedCollectionSelect, RelatedFieldSelect },
	props: {
		localType: {
			type: String as PropType<typeof LOCAL_TYPES[number]>,
			required: true,
		},
	},
	setup() {
		const { t } = useI18n();
		const relatedCollectionM2O = syncFieldDetailStoreProperty('relations.m2o.related_collection');
		const o2mCollection = syncFieldDetailStoreProperty('relations.o2m.collection');
		const o2mField = syncFieldDetailStoreProperty('relations.o2m.field');

		return { relatedCollectionM2O, o2mCollection, o2mField, t };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.relationship {
	@include form-grid;

	--v-select-font-family: var(--family-monospace);
	--v-input-font-family: var(--family-monospace);

	margin-bottom: 20px;

	.v-input.matches {
		--v-input-color: var(--primary);
	}
}
</style>
