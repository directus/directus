<template>
	<div class="tree-view-item">
		<v-list-group @click="editActive = true" :value="item">
			<template #activator>
				<v-list-item-icon>
					<v-icon class="drag-handle" name="drag_handle" small />
				</v-list-item-icon>
				<v-list-item-content>
					<render-template :collection="collection" :template="template" :item="item" />
				</v-list-item-content>
			</template>

			<draggable
				:list="item[childrenField] || []"
				handle=".drag-handle"
				:group="{ name: draggableGroup }"
				@change="$emit('change', $event)"
			>
				<tree-view-item
					v-for="item in item[childrenField]"
					:key="item[primaryKeyField]"
					:primary-key-field="primaryKeyField"
					:children-field="childrenField"
					:template="template"
					:item="item"
					:collection="collection"
					:draggable-group="draggableGroup"
				/>
			</draggable>
		</v-list-group>

		<drawer-item :active.sync="editActive" :collection="collection" :primary-key="item[primaryKeyField]" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import DrawerItem from '@/views/private/components/drawer-item';
import draggable from 'vuedraggable';

import { ChangesObject } from './types';

export default defineComponent({
	components: { DrawerItem, draggable },
	name: 'tree-view-item',
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
	setup() {
		const editActive = ref(false);
		return { editActive };
	},
});
</script>

<style lang="scss" scoped></style>
