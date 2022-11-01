<template>
	<private-view title="My Custom Module" :props-siedbar-open="false">
		<div class="main-container">
			<h1>test</h1>
			<v-select
				v-model="value"
				:items="[
					{
						text: 'Item 1',
						value: 'item-1',
					},
					{
						text: 'Item 2',
						value: 'item-2',
					},
				]"
			/>
		</div>
	</private-view>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const value = ref<string>('');
</script>

<style>
.main-container {
	margin-right: 2rem;
	margin-left: 2rem;
}
</style>
