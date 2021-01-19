<template>
	<v-notice v-if="!choices" type="warning">
		{{ $t('choices_option_configured_incorrectly') }}
	</v-notice>
	<v-select
		v-else
		:value="value"
		@input="$listeners.input"
		:items="choices"
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
import { defineComponent, PropType } from '@vue/composition-api';
import i18n from '@/lang';

type Option = {
	text: string;
	value: string | number;
};

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: [String, Number, Date],
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
			default: i18n.t('select_an_item'),
		},
		allowOther: {
			type: Boolean,
			default: false,
		},
	},
});
</script>
