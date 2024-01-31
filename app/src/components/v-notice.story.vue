<script setup lang="ts">
import VNotice from './v-notice.vue';
</script>

<template>
	<Story title="VNotice">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-notice v-bind="state">Making a pizza ist best done without ordering a pizza.</v-notice>
		</template>
	</Story>
</template>
