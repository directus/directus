<template>
	<v-list nav>
		<v-list-item to="/users" exact :active="currentRole === null">
			<v-list-item-icon><v-icon name="folder_shared" /></v-list-item-icon>
			<v-list-item-content>{{ t('all_users') }}</v-list-item-content>
		</v-list-item>

		<v-divider v-if="(roles && roles.length > 0) || loading" />

		<template v-if="loading">
			<v-list-item v-for="n in 4" :key="n">
				<v-skeleton-loader type="list-item-icon" />
			</v-list-item>
		</template>

		<navigation-role
			v-for="role in roles"
			:key="role.id"
			:role="role"
			:last-admin="lastAdminRoleId === role.id"
			:active="currentRole === role.id"
		/>

		<v-divider v-if="(roles && roles.length > 0) || loading" />

		<navigation-bookmark v-for="bookmark in childBookmarks" :key="bookmark.id" :bookmark="bookmark" go-to="/users" />
	</v-list>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, defineComponent } from 'vue';
import { Collection } from '@/types/collections';
import { usePresetsStore } from '@/stores/presets';
import { useCollectionsStore } from '@/stores/collections';

import useNavigation from '../composables/use-navigation';
import NavigationRole from './navigation-role.vue';
import NavigationBookmark from '@/modules/content/components/navigation-bookmark.vue';

export default defineComponent({
	components: { NavigationRole, NavigationBookmark },
	props: {
		currentRole: {
			type: String,
			default: null,
		},
	},
	setup() {
		const { t } = useI18n();

		const { roles, loading } = useNavigation();

		const presetsStore = usePresetsStore();
		const collectionsStore = useCollectionsStore();
		const collection = computed(() =>
			collectionsStore.crudSafeSystemCollections.find(
				(collection: Collection) => collection.collection === 'directus_users'
			)
		);

		const childBookmarks = computed(() => (collection.value ? getChildBookmarks(collection.value) : []));

		const lastAdminRoleId = computed(() => {
			if (!roles.value) return null;
			const adminRoles = roles.value.filter((role) => role.admin_access === true);
			return adminRoles.length === 1 ? adminRoles[0].id : null;
		});

		return { t, roles, loading, childBookmarks, lastAdminRoleId };

		function getChildBookmarks(collection: Collection) {
			return presetsStore.bookmarks.filter((bookmark) => bookmark.collection === collection.collection);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--background-normal-alt);
}

.v-divider {
	--v-divider-color: var(--background-normal-alt);
}
</style>
