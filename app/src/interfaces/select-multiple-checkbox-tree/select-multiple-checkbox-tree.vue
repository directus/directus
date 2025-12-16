<script setup lang="ts">
import VCheckboxTree from '@/components/v-checkbox-tree/v-checkbox-tree.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import { debounce } from 'lodash';
import { computed, ref, toRefs, watch } from 'vue';

export type Choice = {
	text: string;
	value: string | number;
	children?: Choice[];
};

const props = withDefaults(
	defineProps<{
		value?: string[] | null;
		disabled?: boolean;
		nonEditable?: boolean;
		choices?: Choice[];
		valueCombining?: 'all' | 'branch' | 'leaf' | 'indeterminate' | 'exclusive';
	}>(),
	{
		value: () => [],
		choices: () => [],
		valueCombining: 'all',
	},
);

defineEmits(['input']);

const search = ref('');

const { choices, value } = toRefs(props);
const items = computed(() => choices.value || []);

const showSelectionOnly = ref(false);

const setSearchDebounced = debounce((val: string) => {
	searchDebounced.value = val;
}, 250);

watch(search, setSearchDebounced);

const searchDebounced = ref('');
</script>

<template>
	<v-notice v-if="items.length === 0" type="info">
		{{ $t('no_options_available') }}
	</v-notice>
	<div v-else class="select-multiple-checkbox-tree">
		<div v-if="items.length > 10" class="search">
			<v-input v-model="search" class="input" type="text" :placeholder="$t('search')">
				<template #prepend>
					<v-icon name="search" />
				</template>

				<template v-if="search" #append>
					<v-icon name="clear" clickable @click="search = ''" />
				</template>
			</v-input>
		</div>

		<v-checkbox-tree
			:model-value="value"
			:search="searchDebounced"
			:disabled
			:non-editable
			:choices="items"
			:value-combining="valueCombining"
			:show-selection-only="showSelectionOnly"
			@update:model-value="$emit('input', $event)"
		/>

		<div class="footer">
			<button :class="{ active: showSelectionOnly === false }" @click="showSelectionOnly = false">
				{{ $t('interfaces.select-multiple-checkbox-tree.show_all') }}
			</button>
			/
			<button
				:class="{ active: showSelectionOnly === true }"
				:disabled="value == null || value.length === 0"
				@click="showSelectionOnly = true"
			>
				{{ $t('interfaces.select-multiple-checkbox-tree.show_selected') }}
			</button>
		</div>
	</div>
</template>

<style scoped>
.select-multiple-checkbox-tree {
	max-block-size: var(--input-height-max);
	overflow: auto;
	background-color: var(--theme--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
}

.search {
	position: sticky;
	inset-block-start: 0;
	z-index: 2;
	padding: 10px;
	padding-block-end: 0;
}

.search .v-input {
	box-shadow: 0 0 4px 4px var(--theme--background);
}

.footer {
	position: sticky;
	inset-inline-end: 0;
	inset-block-end: 0;
	z-index: 2;
	float: inline-end;
	inline-size: max-content;
	padding: 4px 8px;
	text-align: end;
	background-color: var(--theme--background);
	border-start-start-radius: var(--theme--border-radius);
}

.footer > button {
	color: var(--theme--form--field--input--foreground-subdued);
	cursor: pointer;
	transition: color var(--fast) var(--transition);
}

.footer > button:hover {
	color: var(--theme--form--field--input--foreground);
}

.footer > button.active {
	color: var(--theme--primary);
}

.footer > button:disabled {
	color: var(--theme--form--field--input--foreground-subdued);
	cursor: not-allowed;
}
</style>
