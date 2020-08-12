<template>
	<div class="v-dialog">
		<slot name="activator" v-bind="{ on: () => (_active = true) }" />

		<portal to="dialog-outlet">
			<div v-if="_active" class="container" :class="[className]" :key="id">
				<v-overlay active absolute @click="emitToggle" />
				<slot />
			</div>
		</portal>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import { nanoid } from 'nanoid';

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
	},
	setup(props, { emit }) {
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
</style>
