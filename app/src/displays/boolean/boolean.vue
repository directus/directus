<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		value: boolean;
		labelOn: string | null;
		labelOff: string | null;
		iconOn: string | null;
		iconOff: string | null;
		colorOn: string;
		colorOff: string;
	}>(),
	{
		value: false,
		labelOn: null,
		labelOff: null,
		iconOn: 'check',
		iconOff: 'close',
		colorOn: 'var(--theme--primary)',
		colorOff: 'var(--theme--foreground-subdued)',
	},
);

const styles = computed(() => {
	const style: Record<string, any> = {};

	if (props.colorOn !== null && props.colorOff !== null) {
		style['color'] = props.value ? props.colorOn : props.colorOff;
		style['--v-icon-color'] = props.value ? props.colorOn : props.colorOff;
	}

	return style;
});
</script>

<template>
	<div class="boolean" :style="styles">
		<value-null v-if="value === null" />
		<template v-else>
			<v-icon v-if="iconOn !== null && iconOff !== null" :name="value ? iconOn : iconOff"></v-icon>
			<span v-if="labelOn !== null && labelOff !== null">{{ value ? labelOn : labelOff }}</span>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.boolean {
	display: inline-flex;
	align-items: center;

	.v-icon {
		margin-inline-end: 4px;
	}
}
</style>
