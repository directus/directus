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
		<v-menu>
			<template #activator="{ toggle }">
				<v-icon clickable class="options" name="more_vert" @click="toggle" />
			</template>
			<v-list>
				<v-list-item clickable>
					<v-list-item-icon><v-icon name="folder_open" /></v-list-item-icon>
					<v-list-item-content>Choose from Library</v-list-item-content>
				</v-list-item>

				<v-list-item clickable>
					<v-list-item-icon><v-icon name="link" /></v-list-item-icon>
					<v-list-item-content>Choose from Url</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
	</Story>
</template>
