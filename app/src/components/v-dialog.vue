<script setup lang="ts">
import { ref, computed, useTemplateRef, watch, nextTick } from 'vue';
import { useFocusTrapManager } from '@/composables/use-focus-trap-manager';
import { useShortcut } from '@/composables/use-shortcut';
import { useDialogRouteLeave } from '@/composables/use-dialog-route';
import TransitionDialog from '@/components/transition/dialog.vue';
import VOverlay from '@/components/v-overlay.vue';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';

export type ApplyShortcut = 'meta+enter' | 'meta+s';

interface Props {
	modelValue?: boolean;
	persistent?: boolean;
	placement?: 'left' | 'right' | 'center';
	/** Lets other overlays (drawer) open on top */
	keepBehind?: boolean;
	applyShortcut?: ApplyShortcut;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	persistent: false,
	placement: 'center',
	applyShortcut: 'meta+enter',
});

const emit = defineEmits(['esc', 'apply', 'update:modelValue']);

useShortcut('escape', (_event, cancelNext) => {
	if (internalActive.value) {
		emit('esc');
		cancelNext();
	}
});

useShortcut(props.applyShortcut, (_event, cancelNext) => {
	if (internalActive.value) {
		emit('apply');
		cancelNext();
	}
});

useShortcut('meta+s', (_event, cancelNext) => {
	if (props.applyShortcut === 'meta+s') return;
	if (internalActive.value) cancelNext();
});

const localActive = ref(false);

const className = ref<string | null>(null);

const internalActive = computed({
	get() {
		return props.modelValue !== undefined ? props.modelValue : localActive.value;
	},
	set(newActive: boolean) {
		localActive.value = newActive;
		emit('update:modelValue', newActive);
	},
});

const leave = useDialogRouteLeave();

useOverlayFocusTrap();

function emitToggle() {
	if (props.persistent === false) {
		emit('update:modelValue', !props.modelValue);
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

function useOverlayFocusTrap() {
	const overlayEl = useTemplateRef<HTMLDivElement>('overlayEl');
	const { addFocusTrap } = useFocusTrapManager();

	const focusTrap = useFocusTrap(overlayEl, {
		escapeDeactivates: false,
		initialFocus: false,
	});

	addFocusTrap(focusTrap);

	watch(
		internalActive,
		async (newActive) => {
			await nextTick();

			if (newActive) focusTrap.activate();
			else focusTrap.deactivate();
		},
		{ immediate: true },
	);
}
</script>

<template>
	<div class="v-dialog">
		<slot name="activator" v-bind="{ on: () => (internalActive = true) }" />

		<teleport to="#dialog-outlet">
			<TransitionDialog @after-leave="leave">
				<component
					:is="placement === 'center' ? 'span' : 'div'"
					v-if="internalActive"
					ref="overlayEl"
					class="container"
					:class="[className, placement, keepBehind ? 'keep-behind' : null]"
				>
					<VOverlay active absolute @click="emitToggle" />
					<slot />
				</component>
			</TransitionDialog>
		</teleport>
	</div>
</template>

<style lang="scss" scoped>
.v-dialog {
	--v-dialog-z-index: 100;

	display: contents;
}

.container {
	position: fixed;
	inset-block-start: 0;
	inset-inline-start: 0;
	z-index: 500;
	display: flex;
	inline-size: 100%;
	block-size: 100%;

	&.keep-behind {
		z-index: 490;
	}
}

.container > :slotted(*) {
	z-index: 2;
	box-shadow: 0 4px 12px rgb(38 50 56 / 0.1);
}

.container.center {
	align-items: center;
	justify-content: center;
	z-index: 600;

	&.keep-behind {
		z-index: 500;
	}
}

.container.center.nudge > :slotted(*:not(:first-child)) {
	animation: nudge 200ms;
}

.container.left {
	align-items: center;
	justify-content: flex-start;
}

.container.right {
	align-items: center;
	justify-content: flex-end;
}

.container.left.nudge > :slotted(*:not(:first-child)) {
	transform-origin: left;

	html[dir='rtl'] & {
		transform-origin: right;
	}

	animation: shake 200ms;
}

.container.right.nudge > :slotted(*:not(:first-child)) {
	transform-origin: right;

	html[dir='rtl'] & {
		transform-origin: left;
	}

	animation: shake 200ms;
}

.container :slotted(.v-card) {
	--v-card-min-width: calc(100vw - 40px);
	--v-card-padding: 28px;
	--v-card-background-color: var(--theme--background);
}

.container :slotted(.v-card) .v-card-title {
	padding-block-end: 8px;
}

.container :slotted(.v-card) .v-card-actions {
	flex-flow: column-reverse wrap;
}

.container :slotted(.v-card) .v-card-actions .v-button {
	inline-size: 100%;
}

.container :slotted(.v-card) .v-card-actions .v-button .button {
	inline-size: 100%;
}

.container :slotted(.v-card) .v-card-actions > .v-button + .v-button {
	margin-block-end: 20px;
	margin-inline-start: 0;
}

.container :slotted(.v-sheet) {
	--v-sheet-padding: 24px;
	--v-sheet-max-width: 560px;
}

.container .v-overlay {
	--v-overlay-z-index: 1;
}

@media (width > 640px) {
	.container :slotted(.v-card) {
		--v-card-min-width: 540px;
	}

	.container :slotted(.v-card) .v-card-actions {
		flex-direction: inherit;
		flex-wrap: nowrap;
	}

	.container :slotted(.v-card) .v-card-actions .v-button {
		inline-size: auto;
	}

	.container :slotted(.v-card) .v-card-actions .v-button .button {
		inline-size: auto;
	}

	.container :slotted(.v-card) .v-card-actions > .v-button + .v-button {
		margin-block-end: 0;
		margin-inline-start: 12px;
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
