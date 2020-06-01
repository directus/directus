<template>
	<div class="project-chooser" :class="{ active }">
		<button ref="activator" class="toggle" :disabled="projects.length === 1" @click="active = !active">
			<latency-indicator />
			<span class="name">{{ currentProject.name }}</span>
			<v-icon class="icon" name="expand_more" />
		</button>
		<transition-expand>
			<div
				v-if="active"
				class="options-wrapper"
				v-click-outside="{
					handler: () => (active = false),
					middleware: onClickOutsideMiddleware,
				}"
			>
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
import LatencyIndicator from '../latency-indicator';

export default defineComponent({
	components: { LatencyIndicator },
	setup() {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = toRefs(projectsStore.state);
		const active = ref(false);
		const activator = ref<Element>(null);

		const currentProject = projectsStore.currentProject;

		return {
			projects: projectsStore.formatted,
			currentProjectKey,
			navigateToProject,
			projectsStore,
			currentProject,
			active,
			onClickOutsideMiddleware,
			activator,
		};

		function onClickOutsideMiddleware(event: Event) {
			return !activator.value?.contains(event.target as Node);
		}

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
		display: flex;
		align-items: center;
		width: 100%;
		height: 64px;
		padding: 0 20px;
		text-align: left;

		.latency-indicator {
			margin-right: 12px;
		}

		.name {
			flex-grow: 1;
		}

		.icon {
			color: var(--foreground-subdued);
			transform: rotate(0deg);
			opacity: 0;
			transition: opacity var(--fast) var(--transition), transform var(--medium) var(--transition);
		}

		&:hover .icon {
			opacity: 1;
		}
	}

	&.active .toggle .icon {
		transform: rotate(180deg);
		opacity: 1;
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
		box-shadow: 0px 8px 12px 0px rgba(38, 50, 56, 0.25);
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
