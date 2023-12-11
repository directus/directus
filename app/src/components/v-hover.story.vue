<script setup lang="ts">
import VHover from './v-hover.vue';
</script>

<template>
	<Story title="VHover">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-hover v-slot="{ hover }" v-bind="state">
				Hover me!
				<div v-if="hover">This is only shown on hover.</div>
			</v-hover>
		</template>
	</Story>
</template>
