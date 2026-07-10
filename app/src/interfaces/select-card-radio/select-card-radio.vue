<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui';
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CardPreview from '../select-card/card-preview.vue';
import type { Choice } from '../select-card/types';
import { useCardSearch } from '../select-card/use-card-search';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';

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

const selectedValue = ref(props.value);
const hasSelectedValue = computed(() => selectedValue.value !== null && selectedValue.value !== undefined);

const { searchQuery, showSearch, filteredChoices, clearSearch } = useCardSearch(computed(() => props.choices));

watch(
	() => props.value,
	(newValue) => {
		selectedValue.value = newValue;
	},
);

function handleChange(value: AcceptableValue) {
	emit('input', value as string | number);
}
</script>

<template>
	<div class="card-select-interface content" :class="`size-${size}`">
		<VInput v-if="showSearch" v-model="searchQuery" :placeholder="t('search')" small type="search">
			<template #prepend>
				<VIcon name="search" />
			</template>
			<template #append>
				<VIcon v-if="searchQuery" name="close" clickable @click="clearSearch" />
			</template>
		</VInput>

		<RadioGroupRoot v-model="selectedValue" :disabled="disabled" class="group" @update:model-value="handleChange">
			<TransitionGroup name="list" tag="div" class="grid" :class="{ 'two-column-floor': filteredChoices.length > 1 }">
				<RadioGroupItem
					v-for="choice in filteredChoices"
					:key="choice.value"
					:value="choice.value"
					:aria-label="choice.text"
					class="interface radio-root"
					:class="{ active: selectedValue === choice.value, gray: hasSelectedValue && selectedValue !== choice.value }"
				>
					<CardPreview
						:choice="choice"
						:is-selected="selectedValue === choice.value"
						:disabled="disabled"
						selection-type="radio"
					/>
				</RadioGroupItem>
			</TransitionGroup>

			<VNotice v-if="filteredChoices.length === 0 && searchQuery" type="info">
				{{ t('no_results') }}
			</VNotice>
		</RadioGroupRoot>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

@include mixins.card-select-interface('.radio-root');
</style>
