import { clamp } from 'lodash';
import { onMounted, ref, Ref, watch } from 'vue';

export type SnapZone = {
	snapPos: number;
	width: number;
	onSnap?: () => void;
	onPointerUp?: () => void;
};

export function useResize(
	target: Ref<HTMLElement | undefined>,
	minWidth: Ref<number>,
	maxWidth: Ref<number>,
	defaultWidth: Ref<number>,
	width: Ref<number> = ref(defaultWidth.value),
	enabled: Ref<boolean> = ref(true),
	options?: Ref<{ snapZones?: SnapZone[]; alwaysShowHandle?: boolean }>
) {
	const dragging = ref(false);
	let dragStartX = 0;
	let dragStartWidth = 0;
	let animationFrameID: number | null = null;

	let grabBar: HTMLDivElement | null = null;
	let wrapper: HTMLDivElement | null = null;

	onMounted(() => {
		watch(
			enabled,
			(value) => {
				if (value) enable();
				else disable();
			},
			{ immediate: true }
		);

		watch(
			() => options,
			(newOptions) => {
				if (newOptions?.value.alwaysShowHandle) {
					grabBar?.classList.add('always-show');
				} else {
					grabBar?.classList.remove('always-show');
				}
			}
		);
	});

	return { width, dragging };

	function enable() {
		if (!target.value) return;

		wrapper = document.createElement('div');
		wrapper.classList.add('resize-wrapper');

		target.value.parentElement!.insertBefore(wrapper, target.value);
		target.value.style.width = `${width.value}px`;
		wrapper.appendChild(target.value);

		grabBar = document.createElement('div');
		grabBar.classList.add('grab-bar');

		if (options?.value.alwaysShowHandle) grabBar.classList.add('always-show');

		grabBar.onpointerenter = () => {
			if (grabBar) grabBar.classList.add('active');
		};

		grabBar.onpointerleave = () => {
			if (grabBar) grabBar.classList.remove('active');
		};

		grabBar.onpointerdown = onPointerDown;
		grabBar.ondblclick = resetWidth;

		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);

		wrapper.appendChild(grabBar);
	}

	function disable() {
		if (wrapper && grabBar) {
			if (target.value) {
				wrapper.parentElement!.insertBefore(target.value, wrapper);
			}

			grabBar.onpointerdown = null;
			grabBar.ondblclick = null;
			grabBar.onpointerenter = null;
			grabBar.onpointerleave = null;

			wrapper.parentElement!.removeChild(wrapper);
		}

		onPointerUp();

		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);
	}

	function resetWidth() {
		width.value = defaultWidth.value;
		target.value!.style.width = `${defaultWidth.value}px`;
	}

	function onPointerDown(event: PointerEvent) {
		dragging.value = true;
		dragStartX = event.pageX;
		dragStartWidth = target.value!.offsetWidth;
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging.value) return;

		animationFrameID = window.requestAnimationFrame(() => {
			const newWidth = clamp(dragStartWidth + (event.pageX - dragStartX), minWidth.value, maxWidth.value);

			const snapZones = options?.value.snapZones;

			if (Array.isArray(snapZones)) {
				for (const zone of snapZones) {
					if (Math.abs(newWidth - zone.snapPos) < zone.width) {
						target.value!.style.width = `${zone.snapPos}px`;
						width.value = zone.snapPos;

						if (zone.onSnap) zone.onSnap();
						return;
					}
				}
			}

			target.value!.style.width = `${newWidth}px`;
			width.value = newWidth;
		});
	}

	function onPointerUp() {
		if (!dragging.value) return;

		dragging.value = false;

		const snapZones = options?.value.snapZones;

		if (Array.isArray(snapZones)) {
			for (const zone of snapZones) {
				if (Math.abs(width.value - zone.snapPos) < zone.width) {
					if (zone.onPointerUp) zone.onPointerUp();
					break;
				}
			}
		}

		if (animationFrameID) {
			window.cancelAnimationFrame(animationFrameID);
		}
	}
}
