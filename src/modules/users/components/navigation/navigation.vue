<template>
	<v-list nav>
		<v-list-item to="/my-project/users/all">
			<v-list-item-icon><v-icon name="people" /></v-list-item-icon>
			<v-list-item-content>{{ $t('all_users') }}</v-list-item-content>
		</v-list-item>

		<v-divider />

		<v-list-item v-for="{ name, id } in roles" :key="id" :to="`/${project}/users/${id}`">
			<v-list-item-icon><v-icon name="people" /></v-list-item-icon>
			<v-list-item-content>{{ name }}</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import useRolesStore from '@/stores/roles';
import useProjectsStore from '@/stores/projects';

export default defineComponent({
	setup() {
		const rolesStore = useRolesStore();
		const projectsStore = useProjectsStore();

		return { roles: rolesStore.state.roles, project: projectsStore.state.currentProjectKey };
	},
});
</script>

<style lang="scss" scoped>
::v-deep .v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--background-normal-alt);
}

.v-divider {
	--v-divider-color: var(--background-normal-alt);
}
</style>
