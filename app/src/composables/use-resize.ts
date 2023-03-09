import { clamp } from "lodash";
import { onMounted, onUnmounted, ref, Ref } from "vue"

export function useResize(target: Ref<HTMLElement | undefined>, minWidth: Ref<number>, maxWidth: Ref<number>, defaultWidth: Ref<number>) {
	let dragging = false;
	let dragStartX = 0;
	let dragStartWidth = 0;
	let animationFrameID: number | null = null;

    let grabBar: HTMLDivElement | null = null
    let wrapper: HTMLDivElement | null = null

    const width = ref(defaultWidth.value)

    onMounted(() => {
        wrapper = document.createElement('div')
        wrapper.classList.add('resize-wrapper')

        if(target.value) {
            target.value.parentElement!.insertBefore(wrapper, target.value)
            wrapper.appendChild(target.value)
        }

        grabBar = document.createElement('div')
        grabBar.classList.add('grab-bar')

        grabBar.onpointerenter = () => {
            if(grabBar) grabBar.classList.add('active')
        }

        grabBar.onpointerleave = () => {
            if(grabBar) grabBar.classList.remove('active')
        }

        grabBar.onpointerdown = onPointerDown
        grabBar.ondblclick = resetWidth

        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)

        wrapper.appendChild(grabBar)
    })

    onUnmounted(() => {
        if(wrapper) {
            if(target.value) {
                wrapper.parentElement!.insertBefore(target.value, wrapper)
                wrapper.removeChild(target.value)
            }

            wrapper.parentElement!.removeChild(wrapper)
        }

        if(grabBar) {
            grabBar.onpointerdown = null
            grabBar.ondblclick = null
            grabBar.onpointerenter = null
            grabBar.onpointerleave = null

            if(target.value) target.value.removeChild(grabBar)
        }

        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
    })

    return { width }

    function resetWidth() {
        width.value = defaultWidth.value
		target.value!.style.width = `${defaultWidth.value}px`;
	}

	function onPointerDown(event: PointerEvent) {
		dragging = true;
		dragStartX = event.pageX;
		dragStartWidth = target.value!.offsetWidth;
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;

		animationFrameID = window.requestAnimationFrame(() => {
            const newWidth = clamp(dragStartWidth + (event.pageX - dragStartX), minWidth.value, maxWidth.value);
			target.value!.style.width = `${newWidth}px`;
            width.value = newWidth
		});
	}

	function onPointerUp() {
		if (dragging === true) {
			dragging = false;
			if (animationFrameID) {
				window.cancelAnimationFrame(animationFrameID);
			}
		}
	}
}