<script setup lang="ts">
import VRemove from './v-remove.vue';
</script>

<template>
	<Story title="VRemove" icon="material-symbols:delete">
		<Variant title="Basic">
			<v-remove />
		</Variant>
		<Variant title="Confirm">
			<v-remove confirm />
		</Variant>
	</Story>
</template>
