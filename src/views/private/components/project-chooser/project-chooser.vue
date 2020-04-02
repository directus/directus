<template>
	<v-menu attached>
		<template #activator="{ toggle }">
			<div class="project-chooser">
				<span @click="toggle">{{ currentProjectKey }}</span>
			</div>
		</template>

		<v-list>
			<v-list-item
				v-for="project in projects"
				:key="project.key"
				@click="navigateToProject(project.key)"
			>
				{{ (project.api && project.api.project_name) || project.key }}
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
import { useProjectsStore } from '@/stores/projects';
import router from '@/router';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();
		const { projects, currentProjectKey } = toRefs(projectsStore.state);

		return {
			projects,
			currentProjectKey,
			navigateToProject,
			projectsStore,
		};

		function navigateToProject(key: string) {
			router
				.push(`/${key}/collections`)
				/** @NOTE
				 * Vue Router considers a navigation change _in_ the navigation guard a rejection
				 * so when this push goes from /collections to /login, it will throw.
				 * In order to prevent a useless uncaught exception to show up in the console,
				 * we have to catch it here with a no-op. See
				 * https://github.com/vuejs/vue-router/issues/2881#issuecomment-520554378
				 */
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				.catch(() => {});
		}
	},
});
</script>

<style lang="scss" scoped>
.project-chooser {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 64px;
	background-color: var(--background-subdued);

	select {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		cursor: pointer;
		opacity: 0;
	}
}
</style>
