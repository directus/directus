<template>
	<v-notice v-if="!choices" type="warning">
		{{ $t('choices_option_configured_incorrectly') }}
	</v-notice>
	<v-select
		v-else
		multiple
		:value="value"
		@input="$listeners.input"
		:items="choices"
		:disabled="disabled"
		:show-deselect="allowNone"
		:placeholder="placeholder"
		:allow-other="allowOther"
		:close-on-content-click="false"
	>
		<template #prepend v-if="icon">
			<v-icon :name="icon" />
		</template>
	</v-select>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

type Option = {
	text: string;
	value: string | number | boolean;
};

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
			type: Array as PropType<Option[]>,
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
});
</script>
