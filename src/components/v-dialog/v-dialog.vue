<template>
	<div class="v-dialog">
		<slot name="activator" v-bind="{ on: () => $emit('toggle', true) }" />

		<portal to="dialog-outlet">
			<div class="container" :class="[{ active }, className]">
				<v-overlay :active="active" absolute @click="emitToggle" />
				<div class="content">
					<slot />
				</div>
			</div>
		</portal>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		active: {
			type: Boolean,
			default: false,
		},
		persistent: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const className = ref<string>(null);

		return { emitToggle, className, nudge };

		function emitToggle() {
			if (props.persistent === false) {
				emit('toggle', !props.active);
			} else {
				nudge();
			}
		}

		function nudge() {
			className.value = 'nudge';

			setTimeout(() => {
				className.value = null;
			}, 200);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-dialog {
	--v-dialog-z-index: 100;

	display: contents;
}

.container {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	opacity: 0;
	transition: opacity var(--medium) var(--transition);
	pointer-events: none;

	.v-card {
		--v-card-min-width: 400px;
		--v-card-padding: 24px;
	}

	.v-sheet {
		--v-sheet-padding: 24px;
		--v-sheet-max-width: 560px;
	}

	.v-overlay {
		--v-overlay-z-index: 1;
	}

	.content {
		position: relative;
		z-index: 2;
		max-height: 90%;
		transform: translateY(-50px);
		opacity: 0;
		transition: var(--medium) var(--transition-in);
		transition-property: opacity, transform;
	}

	&.active {
		opacity: 1;
		pointer-events: all;

		.content {
			transform: translateY(-100px);
			opacity: 1;
		}
	}

	&.nudge {
		animation: nudge 200ms;
	}
}

@keyframes nudge {
	0% {
		transform: scale(1);
	}

	50% {
		transform: scale(1.05);
	}

	100% {
		transform: scale(1);
	}
}
</style>
