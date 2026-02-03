<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { I18nT } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';
import api from '@/api';
import { logout } from '@/auth';
import VButton from '@/components/v-button.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { hydrate } from '@/hydrate';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';

const router = useRouter();

const loading = ref(false);
const name = ref<string | null>(null);
const lastPage = ref<string | null>(null);

const userPromise = fetchUser();

onMounted(() => {
	if ('continue' in router.currentRoute.value.query) {
		hydrateAndLogin();
	}
});

async function fetchUser() {
	loading.value = true;

	try {
		const response = await api.get(`/users/me`, {
			params: {
				fields: ['email', 'first_name', 'last_name', 'last_page'],
			},
		});

		if (response.data.data.share) {
			await logout();
		}

		name.value = userName(response.data.data);
		lastPage.value = response.data.data.last_page;
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

async function hydrateAndLogin() {
	await hydrate();
	await userPromise;
	const redirectQuery = router.currentRoute.value.query.redirect as string;
	router.push(redirectQuery || lastPage.value || `/content`);
}
</script>

<template>
	<div class="continue-as">
		<VProgressCircular v-if="loading" indeterminate />
		<template v-else>
			<I18nT keypath="continue_as" scope="global" tag="p">
				<template #name>
					<b>{{ name }}</b>
				</template>
			</I18nT>
			<div class="actions">
				<RouterLink to="/logout" class="sign-out">{{ $t('sign_out') }}</RouterLink>
				<VButton autofocus large @click="hydrateAndLogin">{{ $t('continue_label') }}</VButton>
			</div>
		</template>
	</div>
</template>

<style scoped>
.continue-as p {
	margin-block-end: 32px;
}

.continue-as :deep(b) {
	font-weight: 600;
}

.continue-as .actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.continue-as .sign-out {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);
}

.continue-as .sign-out:hover {
	color: var(--theme--foreground);
}
</style>
