<template>
	<div class="select-multiple-checkbox-tree">
		<div v-if="showSearch" class="search">
			<v-input v-model="search" class="input" type="text" :placeholder="t('search')">
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
			:disabled="disabled"
			:choices="choices"
			:value-combining="valueCombining"
			:show-selection-only="searchDebounced ? false : showSelectionOnly"
			@update:model-value="$emit('input', $event)"
		/>

		<div class="footer">
			<span :class="{ active: showSelectionOnly === false }" @click="showSelectionOnly = false">
				{{ t('interfaces.select-multiple-checkbox-tree.show_all') }}
			</span>
			/
			<span :class="{ active: showSelectionOnly === true }" @click="showSelectionOnly = true">
				{{ t('interfaces.select-multiple-checkbox-tree.show_selected') }}
			</span>
		</div>
	</div>
</template>

<script lang="ts">
import { debounce } from 'lodash';
import { defineComponent, nextTick, PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type Choice = {
	text: string;
	value: string | number;
	children?: Choice[];
};

function deepCount(choices: Choice[]): number {
	return choices.reduce((count, choice) => {
		return count + (choice.children ? deepCount(choice.children) : 0) + 1;
	}, 0);
}

export default defineComponent({
	props: {
		value: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		choices: {
			type: Array as PropType<Choice[]>,
			default: () => [],
		},
		valueCombining: {
			type: String as PropType<'all' | 'branch' | 'leaf' | 'indeterminate' | 'exclusive'>,
			default: 'all',
		},
	},
	emits: ['input'],
	setup(props) {
		const { t } = useI18n();
		const search = ref('');

		const total = deepCount(props.choices);

		const showSearch = ref(total > 10);
		const showSelectionOnly = ref(false);
		nextTick(() => {
			if (showSearch.value && (props.value?.length ?? false)) {
				showSelectionOnly.value = true;
			}
		});

		const setSearchDebounced = debounce((val: string) => {
			searchDebounced.value = val;
		}, 250);

		watch(search, setSearchDebounced);

		const searchDebounced = ref('');

		return { search, t, showSearch, searchDebounced, showSelectionOnly };
	},
});
</script>

<style scoped>
.select-multiple-checkbox-tree {
	max-height: var(--input-height-max);
	overflow: auto;
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}

.search {
	position: sticky;
	top: 0;
	z-index: 2;
	padding: 10px;
	padding-bottom: 0;
}

.search .v-input {
	box-shadow: 0 0 4px 4px var(--background-page);
}

.footer {
	position: sticky;
	right: 0;
	bottom: 0;
	z-index: 2;
	float: right;
	width: max-content;
	padding: 4px 8px;
	text-align: right;
	background-color: var(--background-page);
	border-top-left-radius: var(--border-radius);
}

.footer > span {
	color: var(--foreground-subdued);
	cursor: pointer;
	transition: color var(--fast) var(--transition);
}

.footer > span:hover {
	color: var(--foreground-normal);
}

.footer > span.active {
	color: var(--primary);
}
</style>
