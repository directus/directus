<template>
	<v-menu v-if="project" show-arrow placement="bottom-start" close-on-content-click>
		<template #activator="{ toggle }">
			<div class="project-chooser" @click="toggle">
				<div class="public-view-logo" v-if="project && project.logo">
					<img :src="project.logo" :alt="project.name || project.key" />
				</div>
				<img v-else class="default-logo" src="./logo-dark.svg" alt="Directus" />
				<h1 class="title type-title">{{ project && (project.name || project.key) }}</h1>
				<v-icon name="expand_more" />
			</div>
		</template>

		<v-list dense>
			<v-list-item
				v-for="availableProject in projects"
				:key="availableProject.key"
				:active="availableProject.key === project.key"
				:disabled="availableProject.key === project.key"
				@click="toProject(availableProject.key)"
			>
				<v-list-item-icon><v-icon name="launch" /></v-list-item-icon>
				<v-list-item-content>
					{{ availableProject.name || availableProject.key }}
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>

	<div class="spacer" v-else />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import router from '@/router';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();

		return {
			project: projectsStore.currentProject,
			projects: projectsStore.formatted,
			toProject,
		};

		function toProject(key: string) {
			router.push(`/${key}/login`);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-menu {
	--v-menu-min-width: 300px;
}

.project-chooser {
	display: flex;
	align-items: center;
	width: max-content;
	height: 64px;
	cursor: pointer;
}

.public-view-logo {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64px;
	height: 64px;
	background-color: var(--brand);
	border-radius: var(--border-radius);
}

.default-logo {
	width: 64px;
}

.title {
	margin-left: 12px;
}

.v-icon {
	--v-icon-color: var(--foreground-subdued);

	margin-left: 4px;
}
</style>
