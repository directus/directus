<template>
	<v-notice v-if="!choices" type="warning">
		{{ t('choices_option_configured_incorrectly') }}
	</v-notice>
	<v-select
		v-else
		multiple
		:model-value="value"
		@update:model-value="$emit('input', $event)"
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
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';

type Option = {
	text: string;
	value: string | number | boolean;
};

export default defineComponent({
	emits: ['input'],
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
	setup() {
		const { t } = useI18n();
		return { t };
	},
});
</script>
