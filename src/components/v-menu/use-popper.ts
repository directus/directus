import { createPopper } from '@popperjs/core/lib/popper-base';
import popperOffsets from '@popperjs/core/lib/modifiers/popperOffsets';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import computeStyles from '@popperjs/core/lib/modifiers/computeStyles';
import applyStyles from '@popperjs/core/lib/modifiers/applyStyles';
import eventListeners from '@popperjs/core/lib/modifiers/eventListeners';
import arrow from '@popperjs/core/lib/modifiers/arrow';
import flip from '@popperjs/core/lib/modifiers/flip';
import offset from '@popperjs/core/lib/modifiers/offset';
import { Instance, Placement, Modifier } from '@popperjs/core';

import { onMounted, onUnmounted, ref, Ref, watch } from '@vue/composition-api';

export function usePopper(
	reference: Ref<HTMLElement | null>,
	popper: Ref<HTMLElement | null>,
	options: Readonly<Ref<Readonly<{ placement: Placement; attached: boolean; arrow: boolean }>>>
) {
	const popperInstance = ref<Instance>(null);

	// The internal placement can change based on the flip / overflow modifiers
	const placement = ref(options.value.placement);

	onMounted(() => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		popperInstance.value = createPopper(reference.value!, popper.value!, {
			placement: options.value.attached ? 'bottom-start' : options.value.placement,
			modifiers: getModifiers(),
		});
	});

	onUnmounted(() => {
		popperInstance.value?.destroy();
	});

	watch(options, () => {
		popperInstance.value?.setOptions({
			placement: options.value.attached ? 'bottom-start' : options.value.placement,
			modifiers: getModifiers(),
		});
	});

	return { popperInstance, placement };

	function getModifiers() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const modifiers: Partial<Modifier<any>>[] = [
			popperOffsets,
			preventOverflow,
			{
				...offset,
				options: {
					offset: options.value.attached ? [0, 0] : [0, 8],
				},
			},
			computeStyles,
			applyStyles,
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
