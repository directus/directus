<template>
	<div class="public-view">
		<div class="container">
			<public-view-logo :version="version" />
			<div class="content">
				<slot />
			</div>
			<div class="notice">
				<slot name="notice">
					<v-icon name="person" />
					Not Authenticated
				</slot>
			</div>
		</div>
		<div class="art" :style="artStyles"></div>
	</div>
</template>

<script lang="ts">
import { version } from '../../../package.json';
import { createComponent, computed } from '@vue/composition-api';
import { ProjectArt } from './types';
import PublicViewLogo from './_logo.vue';
import { useProjectsStore, ProjectWithKey, ProjectError } from '@/stores/projects';

const defaultProjectArt: ProjectArt = {
	color: '#263238',
	background_image: null,
	foreground_image: null,
	note: null
};

export default createComponent({
	components: {
		PublicViewLogo
	},
	setup() {
		const projectsStore = useProjectsStore();

		const projectArt = computed<ProjectArt>(() => {
			const { currentProject } = projectsStore;

			if (
				currentProject.value === null ||
				(currentProject.value as ProjectError).error !== undefined
			) {
				return defaultProjectArt;
			}

			const project = currentProject.value as ProjectWithKey;

			return {
				color: project.api.project_color,
				background_image:
					project.api.project_background?.full_url || defaultProjectArt.background_image,
				foreground_image:
					project.api.project_foreground?.full_url || defaultProjectArt.foreground_image,
				note: project.api.project_public_note || null
			};
		});

		const artStyles = computed(() => ({
			background: projectArt.value.background_image || projectArt.value.color
		}));

		return { version, artStyles };
	}
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.public-view {
	display: flex;
	width: 100%;
	height: 100%;

	.container {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 100%;
		max-width: 500px;
		height: 100%;
		padding: 20px;
		overflow-x: hidden;
		overflow-y: auto;
		background-color: var(--page-background-color);
		box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.25);

		@include breakpoint(small) {
			padding: 40px 80px;
		}
	}

	.art {
		display: none;
		flex-grow: 1;
		height: 100%;

		@include breakpoint(small) {
			display: block;
		}
	}
}
</style>
