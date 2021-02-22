<template>
	<div class="tree-view-item" @click="editActive = true">
		<v-list-item-icon>
			<v-icon name="drag_handle" small />
		</v-list-item-icon>
		<v-list-item-content>
			<render-template :collection="collection" :template="template" :item="item" />
		</v-list-item-content>

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

<style lang="scss" scoped>
.tree-view-item {
	display: contents;
}
</style>
