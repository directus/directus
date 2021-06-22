<template>
	<div class="select-multiple-checkbox-tree">
		<div class="search">
			<v-input class="input" v-model="search" type="text" :placeholder="t('search')">
				<template #prepend>
					<v-icon name="search" />
				</template>

				<template #append v-if="search">
					<v-icon name="clear" clickable @click="search = ''" />
				</template>
			</v-input>
		</div>

		<v-checkbox-tree
			@update:model-value="$emit('input', $event)"
			:model-value="value"
			:search="search"
			:disabled="disabled"
			:choices="choices"
			:value-combining="valueCombining"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { useI18n } from 'vue-i18n';

type Choice = {
	text: string;
	value: string | number;
	children?: Choice[];
};

export default defineComponent({
	emits: ['input'],
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
	setup() {
		const { t } = useI18n();
		const search = ref('');

		return { search, t };
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
