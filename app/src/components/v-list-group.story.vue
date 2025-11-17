<script setup lang="ts">
import VListGroup from './v-list-group.vue';
</script>

<template>
	<Story title="VList/VListGroup" icon="material-symbols:segment">
		<v-list>
			<v-list-item>Item 1</v-list-item>
			<v-list-item>Item 2</v-list-item>

			<v-list-group>
				<template #activator>
					<v-list-item>Group Item 3</v-list-item>
				</template>

				<v-list-item>Item 3-1</v-list-item>
				<v-list-item>Item 3-2</v-list-item>
				<v-list-item>Item 3-2</v-list-item>
			</v-list-group>

			<v-list-item>Item 4</v-list-item>
		</v-list>
	</Story>
</template>
