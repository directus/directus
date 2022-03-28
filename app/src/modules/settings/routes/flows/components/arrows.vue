<template>
    <div class="arrow-container">
        <svg :width="size.width" :height="size.height" class="arrows">
            <path v-for="arrow in arrows" :d="arrow" />
        </svg>
    </div>
</template>

<script setup lang="ts">import { Vector2 } from '@/utils/vector2';
import { computed } from 'vue';
import { ATTACHMENT_OFFSET, PANEL_HEIGHT, PANEL_WIDTH, REJECT_OFFSET, RESOLVE_OFFSET } from '../constants';
import { Attachments } from '../flow.vue';

const props = defineProps<{
    panels: Record<string, any>[]
    attachments: Attachments,
    editMode: boolean
}>()

const endOffset = computed(() => props.editMode ? 12 : 2)

const size = computed(() => {
    let width = 0, height = 0
    for(const panel of props.panels) {
        width = Math.max(width, (panel.x + PANEL_WIDTH) * 20)
        height = Math.max(height, (panel.y + PANEL_HEIGHT) * 20)
    }
    return {width: width + 100, height: height + 100}
})

const arrows = computed(() => {
    const arrows: string[] = []

    for (const panel of props.panels) {
        const resolveChild = props.panels.find(pan => pan.id === panel.resolve)
        if (resolveChild) {
            const { x, y, toX, toY } = getPoints(panel, Vector2.from(RESOLVE_OFFSET), resolveChild)
            arrows.push(createLine(x, y, toX, toY))
        }

        const rejectChild = props.panels.find(pan => pan.id === panel.reject)
        if (rejectChild) {
            const { x, y, toX, toY } = getPoints(panel, Vector2.from(REJECT_OFFSET), rejectChild)
            arrows.push(createLine(x, y, toX, toY))
        }
    }
    return arrows

    function getPoints(panel: Record<string, any>, offset: Vector2, to: Record<string, any>) {
        const x = (panel.x - 1) * 20 + offset.y
        const y = (panel.y - 1) * 20 + offset.x
        const toX = (to.x - 1) * 20 + ATTACHMENT_OFFSET.x
        const toY = (to.y - 1) * 20 + ATTACHMENT_OFFSET.y

        return { x, y, toX, toY }
    }

    function createLine(x: number, y: number, toX: number, toY: number) {
        if(y === toY) return generatePath(Vector2.fromMany({x, y}, {x: toX - endOffset.value, y: toY}))

        if (x + 3 * 20 < toX) {
            const centerX = Math.floor((toX - x) / 2 / 20) * 20
            return generatePath(Vector2.fromMany({ x, y }, { x: x + centerX, y }, { x: x + centerX, y: toY }, { x: toX - endOffset.value, y: toY }))
        }

        const offsetBox = 40
        const centerY = Math.floor((toY - y) / 2 / 20) * 20
        return generatePath(Vector2.fromMany(
            { x, y },
            { x: x + offsetBox, y },
            { x: x + offsetBox, y: y + centerY },
            { x: toX - offsetBox, y: y + centerY },
            { x: toX - offsetBox, y: toY },
            { x: toX - endOffset.value, y: toY }
        ))
    }

    function generatePath(points: Vector2[]) {
        let path = `M ${points[0]}`

        if(points.length >= 3) {
            for (let i = 1; i < points.length - 1; i++) {
                path += generateCorner(points[i - 1], points[i], points[i + 1])
            }
        }
        const arrowSize = 8
        const arrow = `M ${points.at(-1)} L ${points.at(-1)?.clone().add(new Vector2(-arrowSize, -arrowSize))} M ${points.at(-1)} L ${points.at(-1)?.clone().add(new Vector2(-arrowSize, arrowSize))}`

        return path + ` L ${points.at(-1)} ${arrow}`
    }

    function generateCorner(start: Vector2, middle: Vector2, end: Vector2) {
        return ` L ${start.moveNextTo(middle)} Q ${middle} ${end.moveNextTo(middle)}`
    }
})

</script>

<style scoped lang="scss">
.arrow-container {
    position: relative;

    .arrows {
        position: absolute;
        top: 0;
        left: var(--content-padding);
        pointer-events: none;

        path {
            fill: transparent;
            stroke: var(--primary);
            stroke-width: 2px;
        }
    }
}
</style>