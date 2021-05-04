<template>
	<public-view>
		<h1 class="type-title">{{ $t('create_account') }}</h1>

		<form @submit.prevent="onSubmit">
			<v-input :value="email" disabled />

			<v-input
				:placeholder="$t('password')"
				autofocus
				autocomplete="password"
				type="password"
				v-model="password"
				:disabled="done"
			/>

			<v-notice type="success" v-if="done">{{ $t('account_created_successfully') }}</v-notice>

			<v-notice type="danger" v-if="error">
				{{ errorFormatted }}
			</v-notice>

			<v-button v-if="!done" type="submit" :loading="creating" large>{{ $t('create') }}</v-button>
			<v-button v-else large :to="signInLink">{{ $t('sign_in') }}</v-button>
		</form>

		<template #notice>
			<v-icon name="lock_outlined" left />
			{{ $t('not_authenticated') }}
		</template>
	</public-view>
</template>

<script lang="ts">
import router from '@/router';
import { defineComponent, computed, ref } from '@vue/composition-api';
import { translateAPIError } from '@/lang';
import api, { RequestError } from '@/api';
import jwtPayload from '@/utils/jwt-payload';

export default defineComponent({
	setup() {
		const acceptToken = computed(() => router.currentRoute.query.token as string);

		const password = ref(null);

		const creating = ref(false);
		const error = ref<RequestError | null>(null);
		const done = ref(false);

		const errorFormatted = computed(() => {
			if (error.value) {
				return translateAPIError(error.value);
			}
			return null;
		});

		const signInLink = computed(() => `/login`);

		const email = computed(() => jwtPayload(acceptToken.value).email);

		return {
			creating,
			error,
			done,
			password,
			onSubmit,
			signInLink,
			errorFormatted,
			email,
		};

		async function onSubmit() {
			creating.value = true;
			error.value = null;

			try {
				await api.post(`/users/invite/accept`, {
					password: password.value,
					token: acceptToken.value,
				});

				done.value = true;
			} catch (err) {
				error.value = err;
			} finally {
				creating.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
h1 {
	margin-bottom: 20px;
}

.v-input,
.v-notice {
	margin-bottom: 20px;
}
</style>
