<script setup lang="ts">
import { toRefs, computed } from 'vue';
import { useRouter } from 'vue-router';
import useNavigation from '../composables/use-navigation';
import NavigationRole from './navigation-role.vue';
import NavigationItem from './navigation-item.vue';
import { useCollectionsStore } from '@/stores/collections';

const props = defineProps<{
	currentRole?: string;
	hasBookmark?: boolean;
}>();

const { currentRole } = toRefs(props);

const router = useRouter();
const collectionsStore = useCollectionsStore();

const { roles, roleTree, openRoles, loading } = useNavigation(currentRole);
const collection = computed(() => collectionsStore.getCollection('directus_users'));

function handleClick({ role }: { role: string }) {
	router.push(`/users/roles/${role}`);
}
</script>

<template>
	<v-list nav>
		<navigation-item show-hidden :collection="collection" :active="!currentRole" />

		<v-divider v-if="(roles && roles.length > 0) || loading" />

		<template v-if="loading">
			<v-list-item v-for="n in 4" :key="n">
				<v-skeleton-loader type="list-item-icon" />
			</v-list-item>
		</template>

		<v-item-group v-model="openRoles" scope="role-navigation" multiple>
			<navigation-role
				v-for="role in roleTree"
				:key="role.id"
				:role="role"
				:current-role="currentRole"
				:active="!hasBookmark && role.id == currentRole"
				@click="handleClick"
			/>
		</v-item-group>
	</v-list>
</template>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--theme--background-accent);
}

.v-divider {
	--v-divider-color: var(--theme--background-accent);
}
</style>
