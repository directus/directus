<template>
	<div class="boolean" :style="styles">
		<value-null v-if="value === null" />
		<template v-else>
			<v-icon v-if="iconOn !== null && iconOff !== null" :name="value ? iconOn : iconOff"></v-icon>
			<span v-if="labelOn !== null && labelOff !== null">{{ value ? labelOn : labelOff }}</span>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';

type Choice = {
	value: string;
	text: string;
	color: string | null;
};

export default defineComponent({
	props: {
		value: {
			type: Boolean,
			default: false,
		},
		labelOn: {
			type: String,
			default: null,
		},
		labelOff: {
			type: String,
			default: null,
		},
		iconOn: {
			type: String,
			default: 'check',
		},
		iconOff: {
			type: String,
			default: 'close',
		},
		colorOn: {
			type: String,
			default: '#00C897',
		},
		colorOff: {
			type: String,
			default: '#B0BEC5',
		},
	},
	setup(props) {
		const styles = computed(() => {
			const style: Record<string, any> = {};

			if (props.colorOn !== null && props.colorOff !== null) {
				style['color'] = props.value ? props.colorOn : props.colorOff;
				style['--v-icon-color'] = props.value ? props.colorOn : props.colorOff;
			}
			return style;
		});

		return { styles };
	},
});
</script>

<style lang="scss" scoped>
.boolean {
	display: inline-flex;
	align-items: center;

	.v-icon {
		margin-right: 4px;
	}
}
</style>
