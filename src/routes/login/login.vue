<template>
	<public-view>
		<h1 class="type-title">{{ $t('sign_in') }}</h1>

		<continue-as v-if="currentProject.authenticated" />
		<v-notice danger v-else-if="currentProject && currentProject.error">
			{{ errorFormatted }}
		</v-notice>
		<login-form v-else />

		<template #notice>
			<v-icon name="lock_outlined" left />
			{{ $t('not_authenticated') }}
		</template>
	</public-view>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import LoginForm from './components/login-form/';
import ContinueAs from './components/continue-as/';
import useProjectsStore from '../../stores/projects';

import { translateAPIError } from '@/lang';

export default defineComponent({
	components: { LoginForm, ContinueAs },
	setup() {
		const projectsStore = useProjectsStore();

		const errorFormatted = computed(() => {
			if (projectsStore.currentProject.value?.error) {
				return translateAPIError(projectsStore.currentProject.value.error.code);
			}

			return null;
		});

		return { errorFormatted, currentProject: projectsStore.currentProject };
	},
});
</script>

<style lang="scss" scoped>
h1 {
	margin-bottom: 20px;
}
</style>
