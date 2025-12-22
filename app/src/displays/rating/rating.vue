<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import { computed } from 'vue';

type InterfaceOptions = {
	minValue: number;
	maxValue: number;
	stepInterval: number;
};

interface Props {
	value?: string | number | null;
	simple?: boolean;
	interfaceOptions?: InterfaceOptions | null;
}

const props = withDefaults(defineProps<Props>(), {
	value: undefined,
	simple: false,
	interfaceOptions: undefined,
});

const starCount = computed(() => {
	if (props.interfaceOptions === null) return 5;

	return Math.ceil(props.interfaceOptions?.maxValue ?? 5);
});

const ratingPercentage = computed(() => ({
	inlineSize: (Number(props.value) / starCount.value) * 100 + '%',
}));
</script>

<template>
	<span v-if="simple" class="rating simple">
		<VIcon small name="star" filled />
		{{ value }}
	</span>
	<div v-else v-tooltip.bottom.start="value" class="rating detailed">
		<div class="active" :style="ratingPercentage">
			<VIcon v-for="index in starCount" :key="index" small name="star" filled />
		</div>
		<div class="inactive">
			<VIcon v-for="index in starCount" :key="index" small name="star" />
		</div>
	</div>
</template>

<style lang="scss" scoped>
.rating {
	&.simple {
		display: inline-flex;
		align-items: center;
		padding: 2px 6px 2px 4px;
		color: #ffc107;
		font-weight: 600;
		background-color: rgb(255 193 7 / 0.15);
		border-radius: var(--theme--border-radius);

		.v-icon {
			margin-inline-end: 4px;
		}
	}

	&.detailed {
		position: relative;
		inline-size: min-content;
		display: inline-flex;
		block-size: var(--v-icon-size, 24px);

		.active {
			position: relative;
			z-index: 2;
			display: inline-flex;
			inline-size: 0%;
			overflow: hidden;
			color: #ffc107;
		}

		.inactive {
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: 0;
			z-index: 1;
			display: inline-flex;
			color: var(--theme--background-normal);
		}
	}
}
</style>
