<template>
	<v-divider v-if="section.divider" />
	<v-list-group
		v-else-if="section.children"
		scope="docs-navigation"
		:dense="dense"
		:multiple="false"
		:value="section.to"
	>
		<template #activator>
			<v-list-item-icon v-if="section.icon !== undefined"><v-icon :name="section.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="section.name" />
			</v-list-item-content>
		</template>

		<navigation-list-item v-for="(child, index) in section.children" :key="index" :section="child" dense />
	</v-list-group>

	<v-list-item v-else scope="docs-navigation" :to="`/docs${section.to}`" :dense="dense" :value="section.to">
		<v-list-item-icon v-if="section.icon !== undefined"><v-icon :name="section.icon" /></v-list-item-icon>
		<v-list-item-content>
			<v-text-overflow :text="section.name" />
		</v-list-item-content>
	</v-list-item>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Link, Group } from '@directus/docs';

export default defineComponent({
	name: 'NavigationListItem',
	props: {
		section: {
			type: Object as PropType<Link | Group>,
			default: null,
		},
		dense: {
			type: Boolean,
			default: false,
		},
	},
});
</script>
