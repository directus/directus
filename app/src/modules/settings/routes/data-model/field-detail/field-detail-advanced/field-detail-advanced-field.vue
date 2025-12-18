<script setup lang="ts">
import VCheckbox from '@/components/v-checkbox.vue';
import VNotice from '@/components/v-notice.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import InterfaceSystemInputTranslatedString from '@/interfaces/_system/system-input-translated-string/input-translated-string.vue';
import InterfaceList from '@/interfaces/list/list.vue';
import { useUserStore } from '@/stores/user';
import { SEARCHABLE_TYPES } from '@directus/constants';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

const fieldDetailStore = useFieldDetailStore();
const readonly = syncFieldDetailStoreProperty('field.meta.readonly', false);
const hidden = syncFieldDetailStoreProperty('field.meta.hidden', false);
const required = syncFieldDetailStoreProperty('field.meta.required', false);
const note = syncFieldDetailStoreProperty('field.meta.note');
const translations = syncFieldDetailStoreProperty('field.meta.translations');
const { loading, field, localType } = storeToRefs(fieldDetailStore);
const type = computed(() => field.value.type);
const isGenerated = computed(() => field.value.schema?.is_generated);
const userStore = useUserStore();
const searchable = syncFieldDetailStoreProperty('field.meta.searchable', true);

const isSearchableType = computed(() => {
	// exclude alias fields (o2m, m2m, m2a) as they don't store searchable data
	if (type.value === 'alias') return false;

	// exclude relational fields except m2o, which stores foreign keys that are typically not useful for search
	if (localType.value && localType.value !== 'standard') return false;

	return SEARCHABLE_TYPES.includes(type.value);
});
</script>

<template>
	<div class="form">
		<div v-if="!isGenerated" class="field half-left">
			<div class="label type-label">{{ $t('readonly') }}</div>
			<VCheckbox v-model="readonly" :label="$t('readonly_field_label')" block />
		</div>

		<div v-if="!isGenerated" class="field half-right">
			<div class="label type-label">{{ $t('required') }}</div>
			<VCheckbox v-model="required" :label="$t('require_value_to_be_set')" block />
		</div>

		<VNotice v-if="readonly && required" type="warning" class="full no-margin">
			{{ $t('required_readonly_field_warning') }}
		</VNotice>

		<div class="field half-left">
			<div class="label type-label">{{ $t('hidden') }}</div>
			<VCheckbox v-model="hidden" :label="$t('hidden_on_detail')" block />
		</div>

		<div v-if="isSearchableType" class="field half-right">
			<div class="label type-label">{{ $t('searchable') }}</div>
			<VCheckbox v-model="searchable" :label="$t('field_searchable')" block />
		</div>

		<div v-if="type !== 'group'" class="field full">
			<div class="label type-label">{{ $t('note') }}</div>
			<VSkeletonLoader v-if="loading" />
			<InterfaceSystemInputTranslatedString v-else :value="note" :placeholder="$t('add_note')" @input="note = $event" />
		</div>

		<div class="field full">
			<div class="label type-label">{{ $t('field_name_translations') }}</div>

			<InterfaceList
				:template="'[{{ language }}] {{ translation }}'"
				:fields="[
					{
						field: 'language',
						type: 'string',
						name: $t('language'),
						meta: {
							interface: 'system-language',
							width: 'full',
							required: true,
							display: 'formatted-value',
							display_options: {
								font: 'monospace',
								color: 'var(--theme--foreground-subdued)',
							},
						},
						schema: {
							default_value: userStore.language,
						},
					},
					{
						field: 'translation',
						type: 'string',
						name: $t('translation'),
						meta: {
							interface: 'input-multiline',
							width: 'full',
							required: true,
							options: {
								placeholder: $t('translation_placeholder'),
							},
						},
					},
				]"
				:value="translations"
				@input="translations = $event"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.type-title {
	margin-block-end: 32px;
}

.form {
	--theme--form--row-gap: 32px;
	--theme--form--column-gap: 32px;

	@include mixins.form-grid;
}

.monospace {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
}

.required {
	--v-icon-color: var(--theme--primary);
}

.v-notice:not(.no-margin) {
	margin-block-end: 36px;
}
</style>
