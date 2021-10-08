<template>
	<v-notice v-if="!choices" type="warning">
		{{ t('choices_option_configured_incorrectly') }}
	</v-notice>
	<v-select
		v-else
		:model-value="value"
		:items="choices"
		:disabled="disabled"
		:show-deselect="allowNone"
		:placeholder="placeholder"
		:allow-other="allowOther"
		@update:model-value="emitter($event)"
	>
		<template v-if="icon" #prepend>
			<v-icon :name="icon" />
		</template>
	</v-select>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';
import { i18n } from '@/lang';

type Option = {
	text: string;
	value: string | number | boolean;
	children?: Option[];
};

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
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
			default: i18n.global.t('select_an_item'),
		},
		allowOther: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['input'],
	setup(props, { emit, attrs }) {
		const { t } = useI18n();
		const valueType = ['bigInteger', 'integer', 'float', 'decimal'].includes(attrs.type) ? 'number' : 'text';

		return { t, emitter };

		function emitter(value) {
			if (valueType === 'number') {
				emit('input', parseInt(value, 10) || null);
			} else {
				emit('input', value);
			}
		}
	},
});
</script>
