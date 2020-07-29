<template>
	<public-view>
		<h1 class="type-title">{{ $t('sign_in') }}</h1>

		<continue-as v-if="authenticated" />

		<login-form v-else :sso-error="ssoErrorCode" />

		<template #notice>
			<v-icon name="lock_outlined" left />
			{{ $t('not_authenticated') }}
		</template>
	</public-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import LoginForm from './components/login-form/';
import ContinueAs from './components/continue-as/';
import useAppStore from '../../stores/app';
import useSettingsStore from '../../stores/settings';

export default defineComponent({
	props: {
		ssoErrorCode: {
			type: String,
			default: null,
		},
	},
	components: { LoginForm, ContinueAs },
	setup() {
		const appStore = useAppStore();
		const settingsStore = useSettingsStore();

		return {
			authenticated: appStore.state.authenticated,
			currentProject: settingsStore.state.settings,
		};
	},
});
</script>

<style lang="scss" scoped>
h1 {
	margin-bottom: 20px;
}
</style>
