<template>
	<div class="tree-view-item">
		<v-list-item v-if="!item[childrenField] || item[childrenField].length === 0" @click="editActive = true">
			<v-list-item-icon>
				<v-icon name="drag_handle" small />
			</v-list-item-icon>
			<v-list-item-content>
				<render-template :collection="collection" :template="template" :item="item" />
			</v-list-item-content>
		</v-list-item>

		<v-list-group v-else @click="editActive = true">
			<template #activator>
				<v-list-item-icon>
					<v-icon name="drag_handle" small />
				</v-list-item-icon>
				<v-list-item-content>
					<render-template :collection="collection" :template="template" :item="item" />
				</v-list-item-content>
			</template>

			<tree-view-item
				v-for="item in item[childrenField]"
				:key="item[primaryKeyField]"
				:primary-key-field="primaryKeyField"
				:children-field="childrenField"
				:template="template"
				:item="item"
				:collection="collection"
			/>
		</v-list-group>

		<drawer-item :active.sync="editActive" :collection="collection" :primary-key="item[primaryKeyField]" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import DrawerItem from '@/views/private/components/drawer-item';

export default defineComponent({
	components: { DrawerItem },
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
	},
	setup() {
		const editActive = ref(false);
		return { editActive };
	},
});
</script>

<style lang="scss" scoped></style>
