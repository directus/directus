<template>
	<v-checkbox
		block
		:icon-on="iconOn"
		:icon-off="iconOff"
		:label="label"
		:model-value="value"
		:indeterminate="value === null"
		:disabled="disabled"
		:style="{
			'--v-checkbox-color': color,
		}"
		@click.stop="toggleInput"
	/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { i18n } from '@/lang';

export default defineComponent({
	props: {
		value: {
			type: Boolean,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		nullable: {
			type: Boolean,
			default: false,
		},
		label: {
			type: String,
			default: i18n.global.t('enabled'),
		},
		iconOn: {
			type: String,
			default: 'check_box',
		},
		iconOff: {
			type: String,
			default: 'check_box_outline_blank',
		},
		color: {
			type: String,
			default: '#00C897',
		},
	},
	emits: ['input'],
	setup(props, context) {
		const toggleInput = () => {
			if (props.nullable === true) {
				if (props.value === null) {
					context.emit('input', true);
				}
				else if (props.value === false) {
					context.emit('input', null);
				}
				else {
					context.emit('input', false);
				}
			} else {
				if (props.value === null || props.value === false) {
					context.emit('input', true);
				}
				else {
					context.emit('input', false);
				}
			}
		};

		return { toggleInput };
	},
});
</script>
