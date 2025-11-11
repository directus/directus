<script setup lang="ts">
import { toRefs } from 'vue';
import { useRouter } from 'vue-router';
import useNavigation from '../composables/use-navigation';
import NavigationRole from './navigation-role.vue';

const props = defineProps<{
	currentRole?: string;
}>();

const { currentRole } = toRefs(props);

const router = useRouter();

const { roles, roleTree, openRoles, loading } = useNavigation(currentRole);

function handleClick({ role }: { role: string }) {
	router.push(`/users/roles/${role}`);
}
</script>

<template>
	<v-list nav>
		<v-list-item to="/users" exact :active="!currentRole">
			<v-list-item-icon><v-icon name="folder_shared" /></v-list-item-icon>
			<v-list-item-content>{{ $t('all_users') }}</v-list-item-content>
		</v-list-item>

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
