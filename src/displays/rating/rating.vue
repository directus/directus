<template>
	<span v-if="false" class="rating simple">
		<v-icon small name="star" />
		{{ value }}
	</span>
	<span v-else class="rating detailed" v-tooltip.bottom="value">
		<div class="active" :style="ratingPercentage">
			<v-icon v-for="index in starCount" :key="index" small name="star" />
		</div>
		<div class="inactive">
			<v-icon v-for="index in starCount" :key="index" small name="star" />
		</div>
	</span>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';

type InterfaceOptions = {
	maxStars: number;
};

export default defineComponent({
	props: {
		value: {
			type: Number,
			default: null,
		},
		interfaceOptions: {
			type: Object as PropType<InterfaceOptions>,
			default: null,
		},
		total: {
			type: Number,
			default: 5,
		},
	},
	setup(props) {
		const starCount = computed(() => {
			if (props.interfaceOptions === null) return 5;

			return props.interfaceOptions.maxStars;
		});

		const ratingPercentage = computed(() => ({
			width: (props.value / starCount.value) * 100 + '%',
		}));

		return { starCount, ratingPercentage };
	},
});
</script>

<style lang="scss" scoped>
.rating {
	&.simple {
		display: flex;
		align-items: center;
		padding: 2px 6px 2px 4px;
		color: #ffc107;
		font-weight: 600;
		background-color: rgba(255, 193, 7, 0.15);
		border-radius: var(--border-radius);

		.v-icon {
			margin-right: 4px;
		}
	}

	&.detailed {
		position: relative;
		.active {
			position: relative;
			z-index: 2;
			width: 0%;
			overflow: hidden;
			color: #ffc107;
		}
		.inactive {
			position: absolute;
			top: 0;
			left: 0;
			z-index: 1;
			color: var(--background-normal);
		}
	}
}
</style>
