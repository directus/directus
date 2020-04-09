<template>
	<div class="project-chooser">
		<button class="toggle" :disabled="projects.length === 1" @click="active = !active">
			{{ currentProject.name }}
		</button>
		<transition-expand>
			<div v-if="active" class="options-wrapper">
				<div class="options">
					<v-divider />

					<router-link
						v-for="project in projects"
						class="router-link"
						:key="project.key"
						:to="`/${project.key}/collections`"
					>
						<v-radio
							:inputValue="currentProjectKey"
							:value="project.key"
							:label="project.name || project.key"
						/>
					</router-link>
				</div>
			</div>
		</transition-expand>
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref } from '@vue/composition-api';
import { useProjectsStore } from '@/stores/projects';
import router from '@/router';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();
		const { projects, currentProjectKey } = toRefs(projectsStore.state);
		const active = ref(false);

		const currentProject = projectsStore.currentProject;

		return {
			projects,
			currentProjectKey,
			navigateToProject,
			projectsStore,
			currentProject,
			active,
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
	color: var(--foreground-normal);
	background-color: var(--background-normal-alt);

	.toggle {
		width: 100%;
		height: 64px;
		padding: 0 20px;
		text-align: left;
	}

	.options-wrapper {
		position: absolute;
		z-index: 3;
		width: 100%;
	}

	.options {
		padding: 20px;
		padding-top: 0;
		background-color: var(--background-normal-alt);
	}

	.v-divider {
		--v-divider-color: var(--background-normal);

		margin-bottom: 20px;
	}

	.router-link {
		display: block;
		text-decoration: none;

		&:not(:last-child) {
			margin-bottom: 12px;
		}
	}
}
</style>
