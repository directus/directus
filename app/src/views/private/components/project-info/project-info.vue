<template>
	<div class="project-info">
		<latency-indicator />
		<div class="project-selector" @click="handleOpenOrganismsDialog">
			<span class="project-name">{{ name }}</span>
			<span v-if="saas" class="project-organism">
				<span class="project-organism__label">
					{{ activeOrganism ? activeOrganism.name : t('project_info.select_organism') }}
				</span>
				<div class="project-organism__icon">
					<v-icon :small="true" name="expand_more" />
				</div>
			</span>
		</div>
	</div>
	<v-dialog v-if="saas" v-model="openOrganismsDialog" @esc="openOrganismsDialog = false">
		<v-sheet>
			<h2 :text="t('project_info.select_organism')"></h2>

			<v-list>
				<template v-for="organism of availableOrganisms" :key="organism.id">
					<v-list-item
						:disabled="updatingSelectedOrganism"
						:active="activeOrganism && organism.id === activeOrganism.id"
						:clickable="true"
						@click="handleSelectOrganism(organism.id)"
					>
						{{ organism.name }}
					</v-list-item>
				</template>
			</v-list>
			<v-progress-linear v-if="updatingSelectedOrganism" indeterminate />
		</v-sheet>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import LatencyIndicator from '../latency-indicator';
import { useServerStore, useUserStore } from '@/stores/';
import { refresh } from '@/auth';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	components: { LatencyIndicator },
	setup() {
		const { t } = useI18n();

		const serverStore = useServerStore();
		const userStore = useUserStore();

		const openOrganismsDialog = ref(false);
		const updatingSelectedOrganism = ref(false);

		const name = computed(() => serverStore.info?.project?.project_name);
		const saas = computed(() => serverStore.info?.project?.saas_mode === true);

		const activeOrganism = computed(() => (saas.value ? userStore.currentUser?.active_organism ?? null : null));
		const availableOrganisms = computed(() => (saas.value ? userStore.currentUser?.available_organisms ?? [] : null));

		return { name, saas, activeOrganism, availableOrganisms, openOrganismsDialog, updatingSelectedOrganism, t };
	},
	methods: {
		handleOpenOrganismsDialog() {
			this.openOrganismsDialog = true;
		},
		async handleSelectOrganism(organism: string) {
			const userStore = useUserStore();

			this.updatingSelectedOrganism = true;
			try {
				await refresh({ organism });
				await userStore.hydrate();
				this.openOrganismsDialog = false;
			} finally {
				this.updatingSelectedOrganism = false;
			}
		},
	},
});
</script>

<style lang="scss" scoped>
.project-info {
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
	height: 64px;
	padding: 0 20px;
	color: var(--foreground-normal-alt);
	text-align: left;
	background-color: var(--background-normal-alt);

	.project-selector {
		flex-grow: 1;
		margin-left: 12px;

		& .project-organism {
			display: flex;
			align-items: center;
			font-size: 0.8rem;
			transition: 0.2s linear color;

			&:hover {
				color: var(--sidebar-detail-color-active);
			}

			&__label {
				padding-right: 0.1rem;
			}
		}
	}
}
</style>
