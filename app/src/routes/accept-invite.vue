<template>
	<public-view>
		<h1 class="type-title">{{ t('create_account') }}</h1>

		<form @submit.prevent="onSubmit">
			<v-input :model-value="email" disabled />

			<v-input
				v-model="password"
				:placeholder="t('password')"
				autofocus
				autocomplete="password"
				type="password"
				:disabled="done"
			/>

			<v-notice v-if="done" type="success">{{ t('account_created_successfully') }}</v-notice>

			<v-notice v-if="error" type="danger">
				{{ errorFormatted }}
			</v-notice>

			<v-button v-if="!done" type="submit" :loading="creating" large>{{ t('create') }}</v-button>
			<v-button v-else large :to="signInLink">{{ t('sign_in') }}</v-button>
		</form>

		<template #notice>
			<v-icon name="lock" left />
			{{ t('not_authenticated') }}
		</template>
	</public-view>
</template>

<script setup lang="ts">
import api, { RequestError } from '@/api';
import { translateAPIError } from '@/lang';
import { jwtPayload } from '@/utils/jwt-payload';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();

const route = useRoute();

const acceptToken = computed(() => route.query.token as string);

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

async function onSubmit() {
	creating.value = true;
	error.value = null;

	try {
		await api.post(`/users/invite/accept`, {
			password: password.value,
			token: acceptToken.value,
		});

		done.value = true;
	} catch (err: any) {
		error.value = err;
	} finally {
		creating.value = false;
	}
}
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
