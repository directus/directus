<template>
	<v-notice v-if="!items" warning>
		{{ $t('choices_option_configured_incorrectly') }}
	</v-notice>
	<v-select
		v-else
		multiple
		:value="value"
		@input="$listeners.input"
		:items="items"
		:disabled="disabled"
		:show-deselect="allowNone"
		:placeholder="placeholder"
		:allow-other="allowOther"
	>
		<template #prepend v-if="icon">
			<v-icon :name="icon" />
		</template>
	</v-select>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import parseChoices from '@/utils/parse-choices';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Array as PropType<string[]>,
			default: null,
		},
		choices: {
			type: String,
			default: null,
		},
		icon: {
			type: String,
			default: null,
		},
		allowNone: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		allowOther: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const items = computed(() => {
			if (props.choices === null || props.choices.length === 0) return null;

			return parseChoices(props.choices);
		});

		return { items };
	},
});
</script>
