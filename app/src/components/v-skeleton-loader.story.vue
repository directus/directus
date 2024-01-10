<script setup lang="ts">
import VSkeletonLoader from './v-skeleton-loader.vue';
</script>

<template>
	<Story title="VSkeletonLoader">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-skeleton-loader v-bind="state" />
		</template>
	</Story>
</template>
