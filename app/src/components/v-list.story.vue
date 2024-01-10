<script setup lang="ts">
import VList from './v-list.vue';
</script>

<template>
	<Story title="VList/VList">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-list v-bind="state">
				<v-list-item>Item 1</v-list-item>
				<v-list-item>Item 2</v-list-item>
				<v-list-item>Item 3</v-list-item>
			</v-list>
		</template>
	</Story>
</template>
