<template>
	<public-view>
		<h1 class="type-heading-large">{{ $t('sign_in') }}</h1>

		<continue-as v-if="alreadyAuthenticated" />
		<project-error
			v-else-if="currentProject.error"
			:error="currentProject.error"
			:status="currentProject.status"
		/>
		<login-form v-else />

		<template #notice>
			<v-icon name="lock_outlined" left />
			{{ $t('not_authenticated') }}
		</template>
	</public-view>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { useUserStore } from '@/stores/user';
import { notEmpty } from '@/utils/is-empty';
import LoginForm from './components/login-form/';
import ContinueAs from './components/continue-as/';
import ProjectError from './components/project-error/';
import useProjectsStore from '../../stores/projects';

export default defineComponent({
	components: { LoginForm, ContinueAs, ProjectError },
	setup() {
		const userStore = useUserStore();
		const projectsStore = useProjectsStore();
		const currentProject = projectsStore.currentProject;

		const alreadyAuthenticated = computed<boolean>(() =>
			notEmpty(userStore.state.currentUser?.id)
		);

		return { alreadyAuthenticated, currentProject };
	}
});
</script>

<style lang="scss" scoped>
h1 {
	margin-bottom: 44px;
}
</style>
