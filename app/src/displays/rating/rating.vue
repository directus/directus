<template>
	<span v-if="simple" class="rating simple">
		<v-icon small name="star" filled />
		{{ value }}
	</span>
	<div v-else v-tooltip.bottom.start="value" class="rating detailed">
		<div class="active" :style="ratingPercentage">
			<v-icon v-for="index in starCount" :key="index" small name="star" filled />
		</div>
		<div class="inactive">
			<v-icon v-for="index in starCount" :key="index" small name="star" />
		</div>
	</div>
</template>

<script setup lang="ts">
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
	width: (Number(props.value) / starCount.value) * 100 + '%',
}));
</script>

<style lang="scss" scoped>
.rating {
	&.simple {
		display: inline-flex;
		align-items: center;
		padding: 2px 6px 2px 4px;
		color: #ffc107;
		font-weight: 600;
		background-color: rgb(255 193 7 / 0.15);
		border-radius: var(--border-radius);

		.v-icon {
			margin-right: 4px;
		}
	}

	&.detailed {
		position: relative;
		width: min-content;

		.active {
			position: relative;
			z-index: 2;
			display: inline-flex;
			width: 0%;
			overflow: hidden;
			color: #ffc107;
		}

		.inactive {
			position: absolute;
			top: 0;
			left: 0;
			z-index: 1;
			display: inline-flex;
			color: var(--background-normal);
		}
	}
}
</style>
