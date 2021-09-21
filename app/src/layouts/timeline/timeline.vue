<template>
	<div></div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, watch, PropType, ref } from 'vue';
import Day from './day.vue'

import useElementSize from '@/composables/use-element-size';
import { Field, Item } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';
import { Collection } from '@directus/shared/types';

export default defineComponent({
	components: { Day },
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		selectMode: {
			type: Boolean,
			required: true,
		},
		readonly: {
			type: Boolean,
			required: true,
		},
		items: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		loading: {
			type: Boolean,
			required: true,
		},
		error: {
			type: Object as PropType<any>,
			default: null,
		},
		totalPages: {
			type: Number,
			required: true,
		},
		page: {
			type: Number,
			required: true,
		},
		toPage: {
			type: Function as PropType<(newPage: number) => void>,
			required: true,
		},
		itemCount: {
			type: Number,
			default: null,
		},
		fieldsInCollection: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		limit: {
			type: Number,
			required: true,
		},
		size: {
			type: Number,
			required: true,
		},
		primaryKeyField: {
			type: Object as PropType<Field>,
			default: null,
		},
		icon: {
			type: String,
			required: true,
		},
		imageSource: {
			type: String,
			default: null,
		},
		title: {
			type: String,
			default: null,
		},
		subtitle: {
			type: String,
			default: null,
		},
		getLinkForItem: {
			type: Function as PropType<(item: Record<string, any>) => string | undefined>,
			required: true,
		},
		imageFit: {
			type: String,
			required: true,
		},
		sort: {
			type: String,
			required: true,
		},
		info: {
			type: Object as PropType<Collection>,
			default: null,
		},
		isSingleRow: {
			type: Boolean,
			required: true,
		},
		width: {
			type: Number,
			required: true,
		},
		activeFilterCount: {
			type: Number,
			required: true,
		},
		selectAll: {
			type: Function as PropType<() => void>,
			required: true,
		},
		resetPresetAndRefresh: {
			type: Function as PropType<() => Promise<void>>,
			required: true,
		},
	},
	emits: ['update:selection', 'update:limit', 'update:size', 'update:sort', 'update:width'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const selectionWritable = useSync(props, 'selection', emit);
		const limitWritable = useSync(props, 'limit', emit);
		const sizeWritable = useSync(props, 'size', emit);
		const sortWritable = useSync(props, 'sort', emit);

		const layoutElement = ref<HTMLElement>();

		const { width } = useElementSize(layoutElement);

		watch(width, () => {
			emit('update:width', width.value);
		});

		return { t, selectionWritable, limitWritable, sizeWritable, sortWritable, layoutElement };
	},
});
</script>

<style lang="scss" scoped>

</style>
