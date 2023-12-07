<script setup lang="ts">
import VListItem from './v-list-item.vue';
</script>

<template>
	<Story title="VList/VListItem">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-list-item v-bind="state">List Item 1</v-list-item>
		</template>
	</Story>
</template>
