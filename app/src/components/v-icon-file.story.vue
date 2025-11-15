<script setup lang="ts">
import VIconFile from './v-icon-file.vue';

function initState() {
	return {
		ext: 'png',
	};
}
</script>

<template>
	<Story title="VIconFile" icon="material-symbols:draft" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-icon-file v-bind="state">My Button</v-icon-file>
		</template>
	</Story>
</template>
