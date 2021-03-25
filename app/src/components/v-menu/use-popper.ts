import { createPopper } from '@popperjs/core/lib/popper-base';
import popperOffsets from '@popperjs/core/lib/modifiers/popperOffsets';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import computeStyles from '@popperjs/core/lib/modifiers/computeStyles';
import eventListeners from '@popperjs/core/lib/modifiers/eventListeners';
import arrow from '@popperjs/core/lib/modifiers/arrow';
import flip from '@popperjs/core/lib/modifiers/flip';
import offset from '@popperjs/core/lib/modifiers/offset';
import { Instance, Placement, Modifier } from '@popperjs/core';

import { onUnmounted, ref, Ref, watch } from '@vue/composition-api';

export function usePopper(
	reference: Ref<HTMLElement | null>,
	popper: Ref<HTMLElement | null>,
	options: Readonly<Ref<Readonly<{ placement: Placement; attached: boolean; arrow: boolean }>>>
) {
	const popperInstance = ref<Instance | null>(null);
	const styles = ref({});
	const arrowStyles = ref({});

	// The internal placement can change based on the flip / overflow modifiers
	const placement = ref(options.value.placement);

	onUnmounted(() => {
		stop();
	});

	watch(
		options,
		() => {
			popperInstance.value?.setOptions({
				placement: options.value.attached ? 'bottom-start' : options.value.placement,
				modifiers: getModifiers(),
			});
		},
		{ immediate: true }
	);

	const observer = new MutationObserver(() => {
		popperInstance.value?.forceUpdate();
	});

	return { popperInstance, placement, start, stop, styles, arrowStyles };

	function start() {
		return new Promise((resolve) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			popperInstance.value = createPopper(reference.value!, popper.value!, {
				placement: options.value.attached ? 'bottom-start' : options.value.placement,
				modifiers: getModifiers(resolve),
				strategy: 'fixed',
			});
			popperInstance.value.forceUpdate();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			observer.observe(popper.value!, {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true,
			});
		});
	}

	function stop() {
		popperInstance.value?.destroy();
		observer.disconnect();
	}

	function getModifiers(callback: (value?: unknown) => void = () => undefined) {
		const modifiers: Partial<Modifier<string, any>>[] = [
			popperOffsets,
			{
				...offset,
				options: {
					offset: options.value.attached ? [0, 0] : [0, 8],
				},
			},
			{
				...preventOverflow,
				options: {
					padding: 8,
				},
			},
			{
				name: 'arrow',
				options: {
					padding: 6,
				},
			},
			computeStyles,
			flip,
			eventListeners,
			{
				name: 'placementUpdater',
				enabled: true,
				phase: 'afterWrite',
				fn({ state }) {
					placement.value = state.placement;
				},
			},
			{
				name: 'applyStyles',
				enabled: true,
				phase: 'write',
				fn({ state }) {
					styles.value = state.styles.popper;
					arrowStyles.value = state.styles.arrow;
					callback();
				},
			},
		];

		if (options.value.arrow === true) {
			modifiers.push(arrow);
		}

		if (options.value.attached === true) {
			modifiers.push({
				name: 'sameWidth',
				enabled: true,
				fn: ({ state }) => {
					state.styles.popper.width = `${state.rects.reference.width}px`;
				},
				phase: 'beforeWrite',
				requires: ['computeStyles'],
			});
		}

		return modifiers;
	}
}
