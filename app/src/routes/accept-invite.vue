<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import api, { RequestError } from '@/api';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import { translateAPIError } from '@/lang';
import { jwtPayload } from '@/utils/jwt-payload';
import PublicView from '@/views/public';

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

useHead({
	title: t('create_account'),
});
</script>

<template>
	<PublicView>
		<h1 class="type-title">{{ $t('create_account') }}</h1>

		<form @submit.prevent="onSubmit">
			<VInput :model-value="email" disabled />

			<VInput
				v-model="password"
				:placeholder="$t('password')"
				autofocus
				autocomplete="password"
				type="password"
				:disabled="done"
			/>

			<VNotice v-if="done" type="success">{{ $t('account_created_successfully') }}</VNotice>

			<VNotice v-if="error" type="danger">
				{{ errorFormatted }}
			</VNotice>

			<VButton v-if="!done" type="submit" :loading="creating" large>{{ $t('create') }}</VButton>
			<VButton v-else large :to="signInLink">{{ $t('sign_in') }}</VButton>
		</form>

		<template #notice>
			<VIcon name="lock" left />
			{{ $t('not_authenticated') }}
		</template>
	</PublicView>
</template>

<style lang="scss" scoped>
h1 {
	margin-block-end: 20px;
}

.v-input,
.v-notice {
	margin-block-end: 20px;
}
</style>
