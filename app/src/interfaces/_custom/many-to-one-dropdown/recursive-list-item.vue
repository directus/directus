<template>
	<v-list-group :active="containsCurrentItem">
		<template #activator>
			<v-list-item class="link" :value="item.id" @click="hasChildren ? null : emitValue(item.id)">
				<v-list-item-content>
					<render-template :collection="collection" :item="item" :template="template" />
				</v-list-item-content>
			</v-list-item>
		</template>

		<!-- Adds the current item (without children) to the children array to let the user select it... -->
		<v-list-group class="fake-children" v-if="hasChildren">
			<template #activator>
				<v-list-item class="link" :value="item.id" @click="emitValue(item.id)">
					<v-list-item-content>
						<render-template :collection="collection" :item="item" :template="template + '...'" />
					</v-list-item-content>
				</v-list-item>
			</template>
		</v-list-group>
		<!-- Recrusive group children -->
		<recursive-list-item
			v-for="item in children"
			:key="item.id"
			:collection="collection"
			:children-field="childrenField"
			:parent-field="parentField"
			:item="item"
			:children="item.children"
			:template="template"
			@input="emitValue"
			:currentItem="currentItem"
			:computedItems="computedItems"
		/>
	</v-list-group>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType } from '@vue/composition-api';

export default defineComponent({
	name: 'recursive-list-item',
	props: {
		parentField: {
			type: String,
			required: true,
		},
		childrenField: {
			type: String,
			required: true,
		},
		children: {
			required: true,
			type: Array as PropType<Record<string, any>[]>,
			default: () => [],
		},
		item: {
			required: true,
			type: Object,
		},
		computedItems: {
			required: true,
			type: Object,
		},
		currentItem: {
			type: Object,
		},
		collection: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		function emitValue(value: string) {
			emit('input', value);
		}

		const hasChildren = computed(() => props.item.children?.length > 0);
		const containsCurrentItem = computed(() => {
			if (props.currentItem == null) return false;
			return props.computedItems.list[props.currentItem?.id].includes(props.item.id);
		});

		return {
			emitValue,
			hasChildren,
			containsCurrentItem,
		};
	},
});
</script>
<style lang="scss" scoped>
.fake-children {
	font-style: italic;
	opacity: 0.8;
}
</style>
