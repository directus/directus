<template>
	<v-list nav>
		<v-list-item :to="`/${project}/users/all`">
			<v-list-item-icon><v-icon name="people" /></v-list-item-icon>
			<v-list-item-content>{{ $t('all_users') }}</v-list-item-content>
		</v-list-item>

		<v-divider v-if="(roles && roles.length > 0) || loading" />

		<template v-if="loading">
			<v-list-item v-for="n in 4" :key="n">
				<v-skeleton-loader type="list-item-icon" />
			</v-list-item>
		</template>

		<v-list-item v-for="{ name, id } in roles" :key="id" :to="`/${project}/users/${id}`">
			<v-list-item-icon><v-icon name="people" /></v-list-item-icon>
			<v-list-item-content>{{ name }}</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import useNavigation from '../../compositions/use-navigation';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();
		const { roles, loading } = useNavigation();

		return { roles, loading, project: projectsStore.state.currentProjectKey };
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
