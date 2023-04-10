<template>
	<div class="select-multiple-checkbox-tree">
		<div v-if="choices.length > 10" class="search">
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
			:show-selection-only="showSelectionOnly"
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
import { defineComponent, PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type Choice = {
	text: string;
	value: string | number;
	children?: Choice[];
};

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
	setup() {
		const { t } = useI18n();
		const search = ref('');

		const showSelectionOnly = ref(false);

		const setSearchDebounced = debounce((val: string) => {
			searchDebounced.value = val;
		}, 250);

		watch(search, setSearchDebounced);

		const searchDebounced = ref('');

		return { search, t, searchDebounced, showSelectionOnly };
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
