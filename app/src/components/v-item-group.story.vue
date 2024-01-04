<script setup lang="ts">
import { ref } from 'vue';
import VItemGroup from './v-item-group.vue';

const value = ref(['item1']);
</script>

<template>
	<Story title="VItemGroup">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-item-group v-model="value" v-bind="state">
				<v-item v-slot="{ active }" watch value="item1">First item is active: {{ active }}</v-item>
				<v-item v-slot="{ active }" value="item2">Second item is active: {{ active }}</v-item>
			</v-item-group>
		</template>

		<template #controls>
			<HstJson v-model="value" title="Value" />
		</template>
	</Story>
</template>
