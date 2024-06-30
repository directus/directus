<script setup lang="ts">
import VListGroup from './v-list-group.vue';
</script>

<template>
	<Story title="VList/VListGroup">
		<!-- <v-list>
				<v-list-item>Item 1</v-list-item>
				<v-list-item>Item 2</v-list-item> -->

		<ul class="v-list">
			<v-list-group>
				<template #activator>
					<v-list-item>Group Item 3</v-list-item>
				</template>

				<v-list-item>Item 3-1</v-list-item>
				<v-list-item>Item 3-2</v-list-item>
				<v-list-item>Item 3-2</v-list-item>
			</v-list-group>
		</ul>

		<!-- <v-list-item>Item 4</v-list-item>
			</v-list> -->
	</Story>
</template>

<style scoped>
.v-list {
	list-style: none;
	padding: var(--v-list-padding, 4px 0);
}
</style>
