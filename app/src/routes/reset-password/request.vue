<script setup lang="ts">
import api, { RequestError } from '@/api';
import VButton from '@/components/v-button.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import { translateAPIError } from '@/lang';
import { useHead } from '@unhead/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';

const { t } = useI18n();

const email = ref(null);

const sending = ref(false);
const error = ref<RequestError | null>(null);
const done = ref(false);

const errorFormatted = computed(() => {
	if (error.value) {
		return translateAPIError(error.value);
	}

	return null;
});

const signInLink = computed(() => `/login`);

async function onSubmit() {
	sending.value = true;
	error.value = null;

	try {
		await api.post(`/auth/password/request`, {
			email: email.value,
		});

		done.value = true;
	} catch (err: any) {
		error.value = err;
	} finally {
		sending.value = false;
	}
}

useHead({
	title: t('reset_password'),
});
</script>

<template>
	<form @submit.prevent="onSubmit">
		<VInput v-model="email" autofocus autocomplete="username" type="email" :placeholder="$t('email')" />
		<VNotice v-if="done" type="success">{{ $t('password_reset_sent') }}</VNotice>
		<VNotice v-if="error" type="danger">
			{{ errorFormatted }}
		</VNotice>
		<div class="buttons">
			<VButton type="submit" :loading="sending" large>{{ $t('reset') }}</VButton>
			<RouterLink :to="signInLink" class="sign-in">{{ $t('sign_in') }}</RouterLink>
		</div>
	</form>
</template>

<style lang="scss" scoped>
.buttons {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.v-input,
.v-notice {
	margin-block-end: 20px;
}

.sign-in {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}
</style>
