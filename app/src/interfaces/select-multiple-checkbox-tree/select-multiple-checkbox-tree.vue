<template>
	<div class="select-multiple-checkbox-tree">
		<div class="search">
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
			@update:model-value="$emit('input', $event)"
		/>
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

		const setSearchDebounced = debounce((val: string) => {
			searchDebounced.value = val;
		}, 250);

		watch(search, setSearchDebounced);

		const searchDebounced = ref('');

		return { search, t, searchDebounced };
	},
});
</script>

<style scoped>
.select-multiple-checkbox-tree {
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}

.search {
	padding: 10px;
	padding-bottom: 0;
}
</style>
