<template>
	<public-view>
		<h1 class="type-heading-large">{{ $t('sign_in') }}</h1>

		<continue-as v-if="alreadyAuthenticated" />
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

export default defineComponent({
	components: { LoginForm, ContinueAs },
	setup() {
		const userStore = useUserStore();
		const alreadyAuthenticated = computed<boolean>(() =>
			notEmpty(userStore.state.currentUser?.id)
		);

		return { alreadyAuthenticated };
	}
});
</script>

<style lang="scss" scoped>
h1 {
	margin-bottom: 44px;
}
</style>
