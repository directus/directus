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
import ForceSupervisor from 'graphology-layout-force/worker';
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
import { getRandomPosition } from './bunny';
import { CollectionOptions } from './types';

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
	primaryKeyField: Field | null;
	fixedPositions: boolean;
	collectionsOptions: Record<string, CollectionOptions>;
	baseColor: string;
	baseSize: number;
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

const _emit = defineEmits(['update:selection', 'update:tableHeaders', 'update:limit', 'update:fields']);

const container = ref<HTMLElement | null>(null);

let draggedNode: string | null = null;
let isDragging = false;
let renderer: Sigma | null = null;
let layout: ForceSupervisor | null = null;
let graph: Graph = new Graph();

const fieldsStore = useFieldsStore();

watch(
	() => props.running,
	(running) => {
		if (running) {
			layout?.start();
		} else {
			layout?.stop();
		}
	}
);

watch(
	() => props.items,
	(newItems, oldItems) => {
		if (isEqual(newItems, oldItems)) return;
		const relationField = props.layoutOptions?.relationField;
		if (relationField === null) return;

		graph.clear();

		for (const item of newItems) {
			const key = `${props.collection}:${item[props.primaryKeyField!.field]}`;
			addNode(props.collection, key, item);
		}

		for (const item of newItems) {
			const relationData = item[relationField];

			if (Array.isArray(relationData)) {
				for (const relation of relationData) {
					createRelatedItem(relation, item);
				}
			} else if (isNil(relationData) === false) {
				createRelatedItem(relationData, item);
			}
		}
	},
	{ immediate: true }
);

function createRelatedItem(data: Record<string, any>, item: Record<string, any>) {
	let collection: string;
	let key: string;

	if (props.relationInfo?.type === 'm2a') {
		collection = data[props.relationInfo.collectionField.field];
		const idField = fieldsStore.getPrimaryKeyFieldForCollection(collection)!.field;
		const id = data[props.relationInfo.junctionField.field][idField];
		key = `${collection}:${id}`;

		addNode(collection, key, data[props.relationInfo.junctionField.field]);
	} else if (props.relationInfo?.type === 'm2m') {
		collection = props.relationInfo!.junctionCollection.collection;
		const id = data[props.relationInfo!.junctionField!.field][props.relationInfo!.relatedPrimaryKeyField.field];
		key = `${props.relationInfo!.relatedCollection.collection}:${id}`;

		addNode(collection, key, data);
	} else {
		collection = props.relationInfo!.relatedCollection.collection;
		const id = data[props.relationInfo!.relatedPrimaryKeyField.field];
		key = `${collection}:${id}`;

		addNode(collection, key, data);
	}

	graph.addEdge(`${props.collection}:${item[props.primaryKeyField!.field]}`, key);
}

function addNode(collection: string, key: string, data: Record<string, any>) {
	if (graph.hasNode(key)) return;

	let { x, y } = getRandomPosition();
	let size = props.baseSize;
	let color = props.baseColor;
	const label = renderStringTemplate(props.displayTemplates[collection], data).displayValue.value;
	const xField = props.collectionsOptions[collection].xField;
	const yField = props.collectionsOptions[collection].yField;
	const sizeField = props.collectionsOptions[collection].sizeField;
	const colorField = props.collectionsOptions[collection].colorField;

	if (
		props.fixedPositions &&
		xField &&
		yField &&
		typeof data[xField] === 'number' &&
		typeof data[yField] === 'number'
	) {
		x = data[xField];
		y = data[yField];
	}

	if (sizeField && Number.isInteger(data[sizeField])) {
		size = data[sizeField];
	}

	if (colorField && typeof data[colorField] === 'string') {
		color = data[colorField];
	}

	graph.addNode(key, {
		label,
		x,
		y,
		size,
		color,
	});
}

onMounted(() => {
	if (container.value === null) return;

	if (props.fixedPositions === false) {
		layout = new ForceSupervisor(graph, {
			isNodeFixed: (_, attr) => attr.highlighted,
		});

		layout.start();
	}

	renderer = new Sigma(graph, container.value, {
		allowInvalidContainer: true,
	});

	renderer.on('downNode', (event) => {
		draggedNode = event.node;
	});

	renderer.getMouseCaptor().on('mousemovebody', (event) => {
		if (!renderer || !draggedNode) return;

		isDragging = true;

		const { x, y } = renderer.viewportToGraph(event);

		graph.setNodeAttribute(draggedNode, 'x', x);
		graph.setNodeAttribute(draggedNode, 'y', y);

		event.preventSigmaDefault();
		event.original.preventDefault();
		event.original.stopPropagation();
	});

	renderer.getMouseCaptor().on('mouseup', () => {
		if (isDragging === false && draggedNode !== null) {
			router.push({ path: `/content/${draggedNode.split(':')[0]}/${draggedNode.split(':')[1]}` });
			return;
		}
		isDragging = false;
		draggedNode = null;
	});

	renderer.getMouseCaptor().on('mousedown', () => {
		if (renderer && !renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
	});
});

onUnmounted(() => {
	if (renderer) renderer.kill();
	if (layout) layout.kill();
});
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
