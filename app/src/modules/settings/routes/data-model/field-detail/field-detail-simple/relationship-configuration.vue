<template>
	<div class="relationship">
		<div class="field half-left" v-if="localType === 'm2o'">
			<div class="label type-label">
				{{ t('related_collection') }}
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

export default defineComponent({
	components: { RelatedCollectionSelect },
	props: {
		localType: {
			type: String as PropType<typeof LOCAL_TYPES[number]>,
			required: true,
		},
	},
	setup() {
		const { t } = useI18n();
		const relatedCollectionM2O = syncFieldDetailStoreProperty('relations.m2o.related_collection');

		return { relatedCollectionM2O, t };
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
