<script setup lang="ts">
import VIcon from './v-icon/v-icon.vue';
import VListItemContent from './v-list-item-content.vue';
import VListItemIcon from './v-list-item-icon.vue';
import VListItem from './v-list-item.vue';
import VList from './v-list.vue';
import VMenu from './v-menu.vue';
</script>

<template>
	<Story title="VMenu">
		<VMenu>
			<template #activator="{ toggle }">
				<VIcon clickable class="options" name="more_vert" @click="toggle" />
			</template>
			<VList>
				<VListItem clickable>
					<VListItemIcon><VIcon name="folder_open" /></VListItemIcon>
					<VListItemContent>Choose from Library</VListItemContent>
				</VListItem>

				<VListItem clickable>
					<VListItemIcon><VIcon name="link" /></VListItemIcon>
					<VListItemContent>Choose from Url</VListItemContent>
				</VListItem>
			</VList>
		</VMenu>
	</Story>
</template>
