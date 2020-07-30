<template>
	<v-list nav>
		<v-list-item @click="$emit('filter', null)" :active="currentFolder === null">
			<v-list-item-icon><v-icon name="folder_special" /></v-list-item-icon>
			<v-list-item-content>{{ $t('all_files') }}</v-list-item-content>
		</v-list-item>

		<v-divider v-if="loading || folders.length > 0" />

		<template v-if="loading && (folders === null || folders.length === 0)">
			<v-list-item v-for="n in 4" :key="n">
				<v-skeleton-loader type="list-item-icon" />
			</v-list-item>
		</template>

		<div class="folders">
			<navigation-folder
				@click="$emit('filter', $event)"
				v-for="folder in folders"
				:key="folder.id"
				:folder="folder"
				:current-folder="currentFolder"
				:click-handler="(id) => $emit('filter', id)"
			/>
		</div>
	</v-list>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import useFolders from '../../composables/use-folders';
import NavigationFolder from './navigation-folder.vue';

export default defineComponent({
	components: { NavigationFolder },
	model: {
		prop: 'currentFolder',
		event: 'filter',
	},
	props: {
		currentFolder: {
			type: String,
			default: null,
		},
	},
	setup() {
		const { folders, error, loading } = useFolders();

		return { folders, error, loading };
	},
});
</script>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--background-normal-alt);
}

.folders {
	width: 100%;
	overflow-x: hidden;

	::v-deep .v-list-item-content {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
}
</style>
