<script setup lang="ts">
import VBreadcrumb from './v-breadcrumb.vue';

function initState() {
	return {
		items: [
			{
				to: '/',
				name: 'Home',
			},
			{
				to: '/settings',
				name: 'Settings',
				icon: 'settings',
			},
			{
				to: '/settings/profile',
				name: 'Profile',
				icon: 'person',
				disabled: true,
			},
		],
	};
}
</script>

<template>
	<Story title="VBreadcrumb" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-breadcrumb v-bind="state" />
		</template>
	</Story>
</template>
