<template>
	<div class="v-dialog">
		<slot name="activator" v-bind="{ on: () => $emit('toggle', true) }" />

		<portal to="dialog-outlet">
			<transition name="dialog">
				<div v-if="active" class="container" :class="[className]">
					<v-overlay active absolute @click="emitToggle" />
					<slot />
				</div>
			</transition>
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
@import '@/styles/mixins/breakpoint';

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
	transition: opacity var(--medium) var(--transition);

	::v-deep .v-card {
		--v-card-min-width: 540px;
		--v-card-padding: 20px;
		--v-card-background-color: var(--background-page);
	}

	::v-deep .v-sheet {
		--v-sheet-padding: 24px;
		--v-sheet-max-width: 560px;
	}

	.v-overlay {
		--v-overlay-z-index: 1;
	}

	&.nudge {
		animation: nudge 200ms;
	}

	::v-deep > * {
		z-index: 2;
		box-shadow: 0px 4px 12px rgba(38, 50, 56, 0.1);
	}
}

@keyframes nudge {
	0% {
		transform: scale(1);
	}

	50% {
		transform: scale(1.02);
	}

	100% {
		transform: scale(1);
	}
}

.dialog-enter-active,
.dialog-leave-active {
	transition: opacity var(--slow) var(--transition);

	::v-deep > *:not(.v-overlay) {
		transform: translateY(0px);
		transition: transform var(--slow) var(--transition-in);
	}
}

.dialog-enter,
.dialog-leave-to {
	opacity: 0;

	::v-deep > *:not(.v-overlay) {
		transform: translateY(50px);
		transition: transform var(--slow) var(--transition-out);
	}
}
</style>
