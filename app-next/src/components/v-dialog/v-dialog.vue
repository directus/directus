<template>
	<div class="v-dialog">
		<slot name="activator" v-bind="{ on: () => (_active = true) }" />

		<portal to="dialog-outlet">
			<div v-if="_active" class="container" :class="[className, placement]" :key="id">
				<v-overlay active absolute @click="emitToggle" />
				<slot />
			</div>
		</portal>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import { nanoid } from 'nanoid';
import useShortcut from '@/composables/use-shortcut';

export default defineComponent({
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		active: {
			type: Boolean,
			default: undefined,
		},
		persistent: {
			type: Boolean,
			default: false,
		},
		placement: {
			type: String,
			default: 'center',
			validator: (val: string) => ['center', 'right'].includes(val),
		},
	},
	setup(props, { emit }) {
		const dialog = ref<HTMLElement | null>(null);

		useShortcut('escape', (event, cancelNext) => {
			if (_active.value) {
				emit('esc');
				cancelNext();
			}
		});

		const localActive = ref(false);

		const className = ref<string | null>(null);
		const id = computed(() => nanoid());

		const _active = computed({
			get() {
				return props.active !== undefined ? props.active : localActive.value;
			},
			set(newActive: boolean) {
				localActive.value = newActive;
				emit('toggle', newActive);
			},
		});

		return { emitToggle, className, nudge, id, _active };

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
	width: 100%;
	height: 100%;

	::v-deep > * {
		z-index: 2;
		box-shadow: 0px 4px 12px rgba(38, 50, 56, 0.1);
	}

	&.center {
		align-items: center;
		justify-content: center;

		&.nudge > ::v-deep *:not(:first-child) {
			animation: nudge 200ms;
		}
	}

	&.right {
		align-items: center;
		justify-content: flex-end;

		&.nudge > ::v-deep *:not(:first-child) {
			transform-origin: right;
			animation: shake 200ms;
		}
	}

	::v-deep .v-card {
		--v-card-min-width: calc(100vw - 40px);
		--v-card-padding: 28px;
		--v-card-background-color: var(--background-page);

		.v-card-title {
			padding-bottom: 8px;
		}

		.v-card-actions {
			flex-wrap: wrap;
			flex-direction: column-reverse;
			& > .v-button + .v-button {
				margin-left: 0;
				margin-bottom: 20px;
			}
			.v-button {
				width: 100%;
				.button {
					width: 100%;
				}
			}
		}

		@include breakpoint(small) {
			--v-card-min-width: 540px;
			.v-card-actions {
				flex-wrap: nowrap;
				flex-direction: inherit;
				& > .v-button + .v-button {
					margin-left: 12px;
					margin-bottom: 0;
				}
				.v-button {
					width: auto;
					.button {
						width: auto;
					}
				}
			}
		}
	}

	::v-deep .v-sheet {
		--v-sheet-padding: 24px;
		--v-sheet-max-width: 560px;
	}

	.v-overlay {
		--v-overlay-z-index: 1;
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

@keyframes shake {
	0% {
		transform: scaleX(1);
	}

	50% {
		transform: scaleX(0.98);
	}

	100% {
		transform: scaleX(1);
	}
}
</style>
