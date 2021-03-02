<template>
	<div class="tree-view-group">
		<v-list-group :value="item" :expand-icon="false" hide-method="show">
			<template #activator="{ active }">
				<v-list-item-icon class="indicator" :class="{ empty: !hasChildren, active }">
					<v-icon name="expand_more" />
				</v-list-item-icon>
				<v-list-item-content class="preview">
					<draggable class="dropzone" :list="item[childrenField]" :group="draggableGroup" />
					<render-template :collection="collection" :template="template" :item="item" />
				</v-list-item-content>
			</template>

			<draggable
				:set-data="hideDragImage"
				:list="item[childrenField]"
				:group="draggableGroup"
				@change="$emit('change', $event)"
			>
				<div v-for="(item, index) in item[childrenField]" :key="item[primaryKeyField]">
					<tree-view-group
						:primary-key-field="primaryKeyField"
						:children-field="childrenField"
						:template="template"
						:item="item"
						:collection="collection"
						:draggable-group="draggableGroup"
						@input="replaceItem(index, $event)"
						@deselect="removeItem(index)"
					/>
				</div>
			</draggable>
		</v-list-group>

		<div class="actions">
			<v-icon v-tooltip="$t('edit')" name="launch" @click="editActive = true" />
			<v-icon v-tooltip="$t('deselect')" name="clear" @click="$emit('deselect')" />
		</div>

		<drawer-item
			:active.sync="editActive"
			:collection="collection"
			:primary-key="item[primaryKeyField]"
			:edits="item"
			@input="$emit('input', $event)"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed } from '@vue/composition-api';
import DrawerItem from '@/views/private/components/drawer-item';
import draggable from 'vuedraggable';
import hideDragImage from '@/utils/hide-drag-image';

import { ChangesObject } from './types';

export default defineComponent({
	components: { DrawerItem, draggable },
	name: 'tree-view-group',
	props: {
		collection: {
			type: String,
			required: true,
		},
		item: {
			type: Object,
			required: true,
		},
		childrenField: {
			type: String,
			required: true,
		},
		primaryKeyField: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			required: true,
		},
		draggableGroup: {
			type: String,
			required: true,
		},
		value: {
			type: Object as PropType<ChangesObject>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const editActive = ref(false);

		const hasChildren = computed(() => {
			return props.item[props.childrenField].length > 0;
		});

		return {
			editActive,
			replaceItem,
			hasChildren,
			hideDragImage,
			removeItem,
		};

		function replaceItem(index: number, item: Record<string, any>) {
			emit('input', {
				...props.item,
				[props.childrenField]: (props.item[props.childrenField] as any[]).map((child, childIndex) => {
					if (childIndex === index) {
						return item;
					}

					return child;
				}),
			});
		}

		function removeItem(index: number) {
			emit('input', {
				...props.item,
				[props.childrenField]: (props.item[props.childrenField] as any[]).filter(
					(child, childIndex) => childIndex !== index
				),
			});
		}
	},
});
</script>

<style lang="scss" scoped>
.tree-view-group {
	position: relative;

	& > .actions {
		position: absolute;
		top: 4px;
		right: 4px;
		z-index: +1;
		// opacity: 0;
		// pointer-events: none;
		transition: opacity var(--fast) var(--transition);

		--v-icon-color: var(--foreground-subdued);
		--v-icon-color-hover: var(--foreground-normal);

		.v-icon + .v-icon {
			margin-left: 4px;
		}
	}

	// &:hover {
	// 	& > .actions {
	// 		pointer-events: all;
	// 		opacity: 1;
	// 	}
	// }
}

.preview {
	position: relative;

	.dropzone {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		> * {
			display: none;
		}
	}
}

.indicator {
	transform: rotate(-90deg);

	&.empty {
		opacity: 0;
	}

	&.active {
		transform: rotate(0deg);
	}
}
</style>
