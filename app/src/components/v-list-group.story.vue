<script setup lang="ts">
import VListGroup from './v-list-group.vue';
import VListItem from './v-list-item.vue';
import VList from './v-list.vue';
</script>

<template>
	<Story title="VList/VListGroup">
		<VList>
			<VListItem>Item 1</VListItem>
			<VListItem>Item 2</VListItem>

			<VListGroup>
				<template #activator>
					<VListItem>Group Item 3</VListItem>
				</template>

				<VListItem>Item 3-1</VListItem>
				<VListItem>Item 3-2</VListItem>
				<VListItem>Item 3-2</VListItem>
			</VListGroup>

			<VListItem>Item 4</VListItem>
		</VList>
	</Story>
</template>
