<template>
	<draggable
		class="drag-area"
		:class="{ root, drag }"
		tag="ul"
		:list="tree"
		:group="{ name: 'g1' }"
		item-key="id"
		draggable=".row"
		v-bind="dragOptions"
		@start="drag = true"
		@end="drag = false"
		:set-data="hideDragImage"
		:disabled="disabled"
		:force-fallback="true"
		@change="$emit('change', $event)"
	>
		<li class="row" v-for="(item, index) in tree" :key="item.id">
			<item-preview
				:item="item"
				:template="template"
				:collection="collection"
				:primary-key-field="primaryKeyField"
				:disabled="disabled"
				:parent-field="parentField"
				@input="replaceItem(index, $event)"
				@deselect="removeItem(index)"
			/>
			<nested-draggable
				:tree="item[childrenField] || []"
				:template="template"
				:collection="collection"
				:primary-key-field="primaryKeyField"
				:parent-field="parentField"
				:children-field="childrenField"
				:disabled="disabled"
				@change="$emit('change', $event)"
				@input="replaceChildren(index, $event)"
			/>
		</li>
	</draggable>
</template>

<script lang="ts">
import draggable from 'vuedraggable';
import { defineComponent, ref, PropType } from '@vue/composition-api';
import hideDragImage from '@/utils/hide-drag-image';
import ItemPreview from './item-preview.vue';

export default defineComponent({
	name: 'nested-draggable',
	props: {
		tree: {
			required: true,
			type: Array as PropType<Record<string, any>[]>,
			default: () => [],
		},
		root: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			required: true,
		},
		primaryKeyField: {
			type: String,
			required: true,
		},
		parentField: {
			type: String,
			required: true,
		},
		childrenField: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	components: {
		draggable,
		ItemPreview,
	},
	setup(props, { emit }) {
		const drag = ref(false);

		const editActive = ref(false);

		return {
			drag,
			hideDragImage,
			editActive,
			dragOptions: {
				animation: 150,
				group: 'description',
				disabled: false,
				ghostClass: 'ghost',
			},
			replaceItem,
			removeItem,
			replaceChildren,
		};

		function replaceItem(index: number, item: Record<string, any>) {
			emit(
				'input',
				props.tree.map((child, childIndex) => {
					if (childIndex === index) {
						return item;
					}
					return child;
				})
			);
		}

		function removeItem(index: number) {
			emit(
				'input',
				props.tree.filter((child, childIndex) => childIndex !== index)
			);
		}

		function replaceChildren(index: number, tree: Record<string, any>[]) {
			emit(
				'input',
				props.tree.map((child, childIndex) => {
					if (childIndex === index) {
						return {
							...child,
							[props.childrenField]: tree,
						};
					}

					return child;
				})
			);
		}
	},
});
</script>

<style lang="scss" scoped>
.drag-area {
	min-height: 12px;

	&.root {
		margin-left: 0;
		padding: 0;

		&:empty {
			min-height: 0;
		}
	}
}

.row {
	.preview {
		padding: 12px 12px;
		background-color: var(--card-face-color);
		border-radius: var(--border-radius);
		box-shadow: 0px 0px 6px 0px rgba(var(--card-shadow-color), 0.2);
		cursor: grab;
		transition: var(--fast) var(--transition);
		transition-property: box-shadow, background-color;

		& + .drag-area:not(:empty) {
			padding-top: 12px;
		}
	}
}

.flip-list-move {
	transition: transform 0.5s;
}

.ghost .preview {
	background-color: var(--primary-alt);
	box-shadow: 0 !important;
}
</style>
