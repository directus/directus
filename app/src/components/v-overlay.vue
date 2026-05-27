<script setup lang="ts">
interface Props {
	/** Show / hide the overlay */
	active?: boolean;
	/** Makes the position absolute */
	absolute?: boolean;
	/** Makes the overlay clickable */
	clickable?: boolean;
}

withDefaults(defineProps<Props>(), {
	active: false,
	absolute: false,
	clickable: true,
});

const emit = defineEmits(['click']);

function onClick(event: MouseEvent) {
	emit('click', event);
}
</script>

<template>
	<div class="v-overlay" :class="{ active, absolute, 'has-click': clickable }" @click="onClick">
		<div class="overlay" />
		<div v-if="active" class="content"><slot /></div>
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-overlay-z-index  [600]

*/

.v-overlay {
	position: fixed;
	inset-block-start: 0;
	inset-inline-start: 0;
	z-index: var(--v-overlay-z-index, 600);
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 100%;
	block-size: 100%;
	pointer-events: none;

	&.has-click {
		cursor: pointer;
	}

	&.absolute {
		position: absolute;
	}

	.overlay {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		inline-size: 100%;
		block-size: 100%;
		background-color: var(--overlay-color);
		opacity: 0;
		transition: opacity var(--slow) var(--transition);
	}

	&.active {
		pointer-events: auto;

		.overlay {
			opacity: 1;
		}
	}

	.content {
		position: relative;
	}
}
</style>
