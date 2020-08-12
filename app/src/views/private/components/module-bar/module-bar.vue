<template>
	<div class="module-bar">
		<module-bar-logo />
		<div class="modules">
			<v-button
				v-for="module in _modules"
				v-tooltip.right="module.name"
				:key="module.id"
				icon
				x-large
				:to="module.to"
				:href="module.href"
				tile
				:style="
					module.color
						? {
								'--v-button-background-color-activated': module.color,
						  }
						: null
				"
			>
				<v-icon :name="module.icon" />
			</v-button>
		</div>
		<module-bar-avatar />
	</div>
</template>

<script lang="ts">
import { defineComponent, Ref, computed } from '@vue/composition-api';

import { modules } from '@/modules/';
import ModuleBarLogo from '../module-bar-logo/';
import ModuleBarAvatar from '../module-bar-avatar/';
import { useUserStore } from '@/stores/';

export default defineComponent({
	components: {
		ModuleBarLogo,
		ModuleBarAvatar,
	},
	setup() {
		const userStore = useUserStore();

		const _modules = computed(() => {
			const customModuleListing = userStore.state.currentUser?.role.module_listing;

			if (customModuleListing && Array.isArray(customModuleListing) && customModuleListing.length > 0) {
				return customModuleListing.map((custom) => {
					if (custom.link.startsWith('http') || custom.link.startsWith('//')) {
						return {
							...custom,
							href: custom.link,
						};
					} else {
						return {
							...custom,
							to: custom.link,
						};
					}
				});
			}

			return modules
				.map((module) => ({
					...module,
					href: module.link || null,
					to: module.link === undefined ? `/${module.id}/` : null,
				}))
				.filter((module) => {
					if (module.hidden !== undefined) {
						if ((module.hidden as boolean) === true || (module.hidden as Ref<boolean>).value === true) {
							return false;
						}
					}
					return true;
				});
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
		--v-button-background-color-hover: var(--module-background);
		--v-button-background-color-activated: var(--module-background-alt);
	}
}
</style>
