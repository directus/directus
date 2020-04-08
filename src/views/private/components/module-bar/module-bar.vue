<template>
	<div class="module-bar">
		<module-bar-logo />
		<div class="modules">
			<v-button v-for="module in _modules" :key="module.id" icon x-large :to="module.to" tile>
				<v-icon :name="module.icon" />
			</v-button>
		</div>
		<module-bar-avatar />
	</div>
</template>

<script lang="ts">
import { defineComponent, Ref } from '@vue/composition-api';
import { useProjectsStore } from '@/stores/projects';
import { modules } from '@/modules/';
import ModuleBarLogo from '../module-bar-logo/';
import ModuleBarAvatar from '../module-bar-avatar/';

export default defineComponent({
	components: {
		ModuleBarLogo,
		ModuleBarAvatar,
	},
	setup() {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = projectsStore.state;

		const _modules = modules
			.map((module) => ({
				...module,
				to: `/${currentProjectKey}/${module.id}/`,
			}))
			.filter((module) => {
				if (module.hidden !== undefined) {
					if (
						(module.hidden as boolean) === true ||
						(module.hidden as Ref<boolean>).value === true
					) {
						return false;
					}
				}
				return true;
			});

		return { _modules };
	},
});
</script>

<style lang="scss" scoped>
.module-bar {
	display: flex;
	flex-direction: column;
	width: 64px;
	height: 100%;
	background-color: var(--module-background);

	.modules {
		flex-grow: 1;
		overflow-x: hidden;
		overflow-y: auto;
	}

	.v-button {
		--v-button-color: var(--module-icon);
		--v-button-color-activated: var(--module-icon-alt);
		--v-button-background-color: var(--module-background);
		--v-button-background-color-activated: var(--module-background-alt);
	}
}
</style>
