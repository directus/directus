<template>
	<public-view class="install" :wide="['project', 'database'].includes(currentPane[0])">
		<v-tabs-items v-model="currentPane">
			<v-tab-item value="welcome">
				<install-welcome :first="first" @next="nextPane" v-model="token" />
			</v-tab-item>
			<v-tab-item value="requirements">
				<install-requirements :token="token" :first="first" @prev="prevPane" @next="nextPane" />
			</v-tab-item>
			<v-tab-item value="project">
				<install-project :first="first" v-model="projectInfo" @prev="prevPane" @next="nextPane" />
			</v-tab-item>
			<v-tab-item value="database">
				<install-database v-model="databaseInfo" :first="first" @prev="prevPane" @next="nextPane" />
			</v-tab-item>
			<v-tab-item value="final">
				<install-final
					:project="projectInfo"
					:database="databaseInfo"
					:first="first"
					:token="token"
					@prev="prevPane"
					@next="finish"
				/>
			</v-tab-item>
		</v-tabs-items>
	</public-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref, reactive } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import InstallWelcome from './install-welcome.vue';
import InstallRequirements from './install-requirements.vue';
import InstallProject from './install-project.vue';
import InstallDatabase from './install-database.vue';
import InstallFinal from './install-final.vue';
import router from '@/router';

export default defineComponent({
	components: {
		InstallWelcome,
		InstallRequirements,
		InstallProject,
		InstallDatabase,
		InstallFinal,
	},
	setup() {
		const projectsStore = useProjectsStore();

		const first = computed(() => {
			return projectsStore.state.needsInstall;
		});

		const panes = ['welcome', 'requirements', 'project', 'database', 'final'];

		const currentPane = ref(['welcome']);

		const token = ref(null);

		const projectInfo = reactive({
			project_name: null,
			project: null,
			user_email: null,
			user_password: null,
		});

		const databaseInfo = reactive({
			db_host: 'localhost',
			db_name: null,
			db_password: null,
			db_port: 3306,
			db_user: null,
		});

		return {
			currentPane,
			first,
			prevPane,
			nextPane,
			projectInfo,
			databaseInfo,
			token,
			finish,
		};

		function prevPane() {
			const currentIndex = panes.findIndex((pane) => currentPane.value[0] === pane);
			currentPane.value = [panes[currentIndex - 1]];
		}

		function nextPane() {
			const currentIndex = panes.findIndex((pane) => currentPane.value[0] === pane);
			currentPane.value = [panes[currentIndex + 1]];
		}

		async function finish() {
			await projectsStore.hydrate();
			router.push('/');
		}
	},
});
</script>

<style lang="scss" scoped>
::v-deep {
	.pane-title,
	.pane-content {
		margin-bottom: 32px;
	}

	.pane-buttons {
		display: flex;
		align-items: center;

		.v-button {
			margin-right: 12px;
		}
	}

	.pane-form {
		display: grid;
		grid-gap: 32px 48px;
		grid-template-columns: repeat(2, 1fr);

		.label {
			margin-bottom: 8px;
		}
	}
}
</style>
