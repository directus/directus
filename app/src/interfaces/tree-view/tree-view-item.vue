<template>
	<v-list-item v-if="!item[childrenField] || item[childrenField].length === 0">
		<v-list-item-content>
			<render-template :collection="collection" :template="template" :item="item" />
		</v-list-item-content>
	</v-list-item>

	<v-list-group v-else>
		<template #activator>
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
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
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
});
</script>

<style lang="scss" scoped></style>
