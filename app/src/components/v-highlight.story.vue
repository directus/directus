<script setup lang="ts">
import VHighlight from './v-highlight.vue';

function initState() {
	return {
		text: 'The cake is a lie.',
		query: ['cake', 'lie'],
	};
}
</script>

<template>
	<Story title="VHighlight" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-highlight v-bind="state" />
		</template>
	</Story>
</template>
