<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CardPreview from '../select-card/card-preview.vue';
import type { Choice } from '../select-card/types';
import { useCardSearch } from '../select-card/use-card-search';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VRadioCards from '@/components/v-radio-cards.vue';

const props = withDefaults(
	defineProps<{
		value?: string | number | null;
		disabled?: boolean;
		choices?: Choice[] | null;
		size?: 'small' | 'medium' | 'large';
	}>(),
	{
		disabled: false,
		choices: null,
		size: 'medium',
	},
);

const emit = defineEmits<{
	input: [value: string | number | null];
}>();

const { t } = useI18n();

const { searchQuery, showSearch, filteredChoices, clearSearch } = useCardSearch(computed(() => props.choices));

const items = computed(() => filteredChoices.value.map((choice) => ({ ...choice, label: choice.text })));
</script>

<template>
	<div class="card-select-interface content" :class="`size-${size}`">
		<VInput v-if="showSearch" v-model="searchQuery" :placeholder="t('search')" small type="search">
			<template #prepend>
				<VIcon name="search" />
			</template>
			<template #append>
				<VIcon v-if="searchQuery" name="close" clickable :aria-label="t('clear_value')" @click="clearSearch" />
			</template>
		</VInput>

		<VRadioCards
			:model-value="value"
			:items="items"
			:disabled="disabled"
			class="grid"
			:class="{ 'two-column-floor': filteredChoices.length > 1 }"
			@update:model-value="emit('input', $event)"
		>
			<template #item="{ index, selected, labelId, descriptionId }">
				<CardPreview
					:choice="filteredChoices[index]!"
					:is-selected="selected"
					selection-type="radio"
					:label-id="labelId"
					:description-id="descriptionId"
				/>
			</template>
		</VRadioCards>

		<VNotice v-if="filteredChoices.length === 0" type="info">
			{{ t(searchQuery ? 'no_results' : 'no_options_available') }}
		</VNotice>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

@include mixins.card-select-interface('.v-radio-card');
</style>
