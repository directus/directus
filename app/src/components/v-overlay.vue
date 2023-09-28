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

<style>
body {
	--v-overlay-color: var(--overlay-color);
	--v-overlay-z-index: 600;
}
</style>

<style lang="scss" scoped>
.v-overlay {
	position: fixed;
	top: 0;
	left: 0;
	z-index: var(--v-overlay-z-index);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	pointer-events: none;

	&.has-click {
		cursor: pointer;
	}

	&.absolute {
		position: absolute;
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: var(--v-overlay-color);
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
