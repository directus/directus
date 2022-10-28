<template>
	<div class="layout-graph">
		<div id="container" ref="container"></div>
	</div>
</template>

<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script lang="ts" setup>
import Graph from 'graphology';
import Sigma from 'sigma';
import ForceSupervisor from "graphology-layout-force/worker";
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { renderStringTemplate } from '@/utils/render-string-template';
import { router } from '@/router';
import { isEqual, isNil } from 'lodash';
import { RelationM2A } from '@/composables/use-relation-m2a';
import { RelationM2M } from '@/composables/use-relation-m2m';
import { RelationM2O } from '@/composables/use-relation-m2o';
import { RelationO2M } from '@/composables/use-relation-o2m';
import { useFieldsStore } from '@/stores/fields';
import { Field } from '@directus/shared/types';
import { Vector2 } from '@/utils/vector2';

interface Props {
	collection: string;
	readonly: boolean;
	loading: boolean;
	error?: any;
	totalPages: number;
	page: number;
	toPage: (newPage: number) => void;
	itemCount?: number;
	fields: string[];
	limit: number;
	sortField?: string;
	selectAll: () => void;
	search?: string;
	layoutOptions: Record<string, any>;
	items: Record<string, any>[];
	relationInfo: RelationM2A | RelationM2M | RelationM2O | RelationO2M | null;
	displayTemplates: Record<string, string>;
	running: boolean;
	primaryKeyField: Field | null
	fixedPositions: boolean
}

const props = withDefaults(defineProps<Props>(), {
	selection: () => [],
	showSelect: 'none',
	error: null,
	itemCount: undefined,
	tableSort: undefined,
	primaryKeyField: undefined,
	info: undefined,
	sortField: undefined,
	filterUser: undefined,
	search: undefined,
	layoutOptions: () => ({}),
	onSortChange: () => undefined,
	onAlignChange: () => undefined,
});

let angle = 0
let radius = 0.1

function getCirclePosition() {
	const x = Math.cos(angle) * radius
	const y = Math.sin(angle) * radius

	angle = (angle + 0.653) % (Math.PI * 2)
	radius += 0.1 / radius + 0.01

	return { x, y }
}

const emit = defineEmits(['update:selection', 'update:tableHeaders', 'update:limit', 'update:fields']);

const container = ref<HTMLElement | null>(null)

let draggedNode: string | null = null
let isDragging = false
let renderer: Sigma | null = null
let layout: ForceSupervisor | null = null
let graph: Graph = new Graph()
const size = 10

const fieldsStore = useFieldsStore()

watch(() => props.running, (running) => {
	if (running) {
		layout?.start()
	} else {
		layout?.stop()
	}
})

watch(() => props.items, (newItems, oldItems) => {
	if(isEqual(newItems, oldItems)) return
	const relationField = props.layoutOptions?.relationField
	if(relationField === null) return

	graph.clear()

	for(const item of newItems) {

		const { x, y } = getCirclePosition()

		graph.addNode(`${props.collection}:${item[props.primaryKeyField!.field]}`, {
			label: renderStringTemplate(props.displayTemplates[props.collection], item).displayValue.value,
			x,
			y,
			size: size,
			color: '#000',
		});
	}

	console.log(newItems)

	for(const item of newItems) {
		const relationData = item[relationField]

		if(Array.isArray(relationData)) {
			for(const relation of relationData) {
				createRelatedItem(relation, item)
			}
		} else if(isNil(relationData) === false) {
			createRelatedItem(relationData, item)
		}
	}
}, {immediate: true})

function createRelatedItem(data: Record<string, any>, item: Record<string, any>) {
	let collection: string
	let id: string
	let label: string | false

	if(props.relationInfo?.type === 'm2a') {
		collection = data[props.relationInfo.collectionField.field]
		const idField = fieldsStore.getPrimaryKeyFieldForCollection(collection)!.field
		id = data[props.relationInfo.junctionField.field][idField]
		label = renderStringTemplate(props.displayTemplates[collection], data[props.relationInfo.junctionField.field]).displayValue.value

	} else if(props.relationInfo?.type === 'm2m') {
		collection = props.relationInfo!.relatedCollection.collection
		id = data[props.relationInfo!.junctionField!.field][props.relationInfo!.relatedPrimaryKeyField.field]
		label = renderStringTemplate(props.displayTemplates[props.relationInfo!.junctionCollection.collection], data).displayValue.value

	} else  {
		collection = props.relationInfo!.relatedCollection.collection
		id = data[props.relationInfo!.relatedPrimaryKeyField.field]
		label = renderStringTemplate(props.displayTemplates[collection], data).displayValue.value
	}

	if(!graph.hasNode(`${collection}:${id}`)) {

		const { x, y } = getCirclePosition()

		graph.addNode(`${collection}:${id}`, {
			label,
			x,
			y,
			size: size,
			color: '#000',
		});
	}

	graph.addEdge(`${props.collection}:${item[props.primaryKeyField!.field]}`, `${collection}:${id}`);
}

onMounted(() => {
	if(container.value === null) return

	if(props.fixedPositions === false) {
		layout = new ForceSupervisor(graph, {
			isNodeFixed: (_, attr) => attr.highlighted
		})

		layout.start()
	}

	renderer = new Sigma(graph, container.value, {
		allowInvalidContainer: true
	})

	renderer.on('downNode', (event) => {
		draggedNode = event.node
	})

	renderer.getMouseCaptor().on('mousemovebody', (event) => {
		if(!renderer || !draggedNode) return

		isDragging = true

		const { x, y } = renderer.viewportToGraph(event)

		graph.setNodeAttribute(draggedNode, 'x', x)
		graph.setNodeAttribute(draggedNode, 'y', y)

		event.preventSigmaDefault()
		event.original.preventDefault()
		event.original.stopPropagation()
	})

	renderer.getMouseCaptor().on('mouseup', () => {
		if(isDragging === false && draggedNode !== null) {
			router.push({path: `/content/${draggedNode.split(':')[0]}/${draggedNode.split(':')[1]}`})
			return
		}
		isDragging = false;
		draggedNode = null;
	})

	renderer.getMouseCaptor().on("mousedown", () => {
		if (renderer && !renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
	});
})

onUnmounted(() => {
	if(renderer) renderer.kill()
	if(layout) layout.kill()
})

</script>

<style lang="scss" scoped>
.layout-graph {
	display: contents;
	margin: var(--content-padding);
	margin-bottom: var(--content-padding-bottom);

	#container {
		height: calc(100% - 60px);
		width: 100%;
	}
}

</style>
