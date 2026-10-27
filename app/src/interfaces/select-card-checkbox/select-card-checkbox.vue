<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CardPreview from '../select-card/card-preview.vue';
import type { Choice } from '../select-card/types';
import { useCardSearch } from '../select-card/use-card-search';
import VCheckboxCards from '@/components/v-checkbox-cards.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';

const props = withDefaults(
	defineProps<{
		value?: string[] | null;
		disabled?: boolean;
		choices?: Choice<string>[] | null;
		size?: 'small' | 'medium' | 'large';
	}>(),
	{
		disabled: false,
		choices: null,
		size: 'medium',
	},
);

const emit = defineEmits<{
	input: [value: string[]];
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

		<VCheckboxCards
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
					selection-type="checkbox"
					:label-id="labelId"
					:description-id="descriptionId"
				/>
			</template>
		</VCheckboxCards>

		<VNotice v-if="filteredChoices.length === 0" type="info">
			{{ t(searchQuery ? 'no_results' : 'no_options_available') }}
		</VNotice>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

@include mixins.card-select-interface('.v-checkbox-card');
</style>
