<script setup lang="ts">
import api, { RequestError } from '@/api';
import { login, logout } from '@/auth';
import VButton from '@/components/v-button.vue';
import VError from '@/components/v-error.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { usePermissionsStore } from '@/stores/permissions';
import { useRelationsStore } from '@/stores/relations';
import { getItemRoute } from '@/utils/get-route';
import SharedView from '@/views/shared/shared-view.vue';
import { useCollection } from '@directus/composables';
import { useAppStore } from '@directus/stores';
import { Share } from '@directus/types';
import { useHead } from '@unhead/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import ShareItem from './components/share-item.vue';

type ShareInfo = Pick<
	Share,
	'id' | 'collection' | 'item' | 'password' | 'date_start' | 'date_end' | 'max_uses' | 'times_used'
>;

const { t } = useI18n();

const appStore = useAppStore();
const authenticated = computed(() => appStore.authenticated);

const loading = ref(true);
const authenticating = ref(false);

const notFound = ref(false);

const error = ref<RequestError | null>(null);

const router = useRouter();
const route = useRoute();

const shareId = route.params.id as string;
const share = ref<ShareInfo>();

const usesLeft = ref<number | null>(null);

const usesLeftNoticeType = computed(() => {
	if (!usesLeft.value) return 'info';
	if (usesLeft.value < 3) return 'warning';
	return 'info';
});

const password = ref<string>();
const passwordWrong = ref(false);

getShareInformation(shareId);

const { info } = useCollection(computed(() => share.value?.collection ?? null));
const collectionName = computed(() => info.value?.name);

const title = computed(() => {
	if (notFound.value) return t('share_access_not_found_title');
	if (collectionName.value) return t('viewing_in', { collection: collectionName.value });
	return t('share_access_page');
});

async function getShareInformation(shareId: string) {
	loading.value = true;

	try {
		const response = await api.get(`/shares/info/${shareId}`);
		share.value = response.data.data;

		if (!share.value) {
			notFound.value = true;
			loading.value = false;
			return;
		}

		const { max_uses, times_used } = share.value;

		if (max_uses) {
			usesLeft.value = max_uses - times_used;
		}

		await handleAuth();
	} catch (err: any) {
		if (err.response?.status === 404 || err.response?.status === 403) {
			notFound.value = true;
		} else {
			error.value = err;
		}
	} finally {
		loading.value = false;
	}
}

async function handleAuth() {
	if (appStore.authenticated) {
		const currentUser = await api.get('/users/me', { params: { fields: ['id'] } });

		if (currentUser.data.data?.share) {
			if (currentUser.data.data.share !== shareId) {
				await logout({ navigate: false });
			} else {
				await hydrate();
			}
		}

		// Logged in as regular user
		if (currentUser.data.data?.id && !currentUser.data.data?.share) {
			router.replace(getItemRoute(share.value!.collection, share.value!.item));
			return;
		}
	}

	if (!share.value?.password && !share.value?.max_uses) {
		if (appStore.authenticated) {
			await hydrate();
		} else {
			await authenticate();
		}
	}
}

async function hydrate() {
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();
	const permissionsStore = usePermissionsStore();
	const relationsStore = useRelationsStore();

	await collectionsStore.hydrate();
	await permissionsStore.hydrate();
	await fieldsStore.hydrate({ skipTranslation: true });
	await relationsStore.hydrate();
}

async function authenticate() {
	authenticating.value = true;

	try {
		const credentials = { share: shareId, password: password.value };
		await login({ share: true, credentials });
	} catch (err: any) {
		if (err?.response?.data?.errors?.[0]?.extensions?.code === 'INVALID_CREDENTIALS') {
			passwordWrong.value = true;
			return;
		}

		error.value = err;
	} finally {
		authenticating.value = false;
	}
}

useHead({ title });
</script>

<template>
	<div v-if="loading" class="hydrating">
		<VProgressCircular indeterminate />
	</div>

	<SharedView v-else :inline="!authenticated" :title="title">
		<div v-if="notFound">
			<strong>{{ $t('share_access_not_found') }}</strong>
			{{ $t('share_access_not_found_desc') }}
		</div>

		<VError v-else-if="error" :error="error" />

		<template v-else-if="share">
			<template v-if="!authenticated">
				<VNotice v-if="usesLeft !== undefined && usesLeft !== null" :type="usesLeftNoticeType">
					{{ $t('shared_uses_left', usesLeft) }}
				</VNotice>

				<template v-if="usesLeft !== 0">
					<VInput
						v-if="share.password"
						class="password"
						:class="{ invalid: passwordWrong }"
						type="password"
						:placeholder="$t('shared_enter_passcode')"
						@update:model-value="password = $event"
					/>
					<VButton :busy="authenticating" @click="authenticate">
						{{ $t('share_access_page') }}
					</VButton>
				</template>
			</template>

			<template v-else>
				<ShareItem :collection="share.collection" :primary-key="share.item" />
			</template>
		</template>
	</SharedView>
</template>

<style lang="scss" scoped>
h2 {
	margin-block-end: 20px;
}

.v-input,
.v-notice {
	margin-block-end: 32px;
}

.hydrating {
	position: fixed;
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 100%;
	block-size: 100%;
}

.password {
	position: relative;
}

.password.invalid::before {
	position: absolute;
	inset-block-start: -12px;
	inset-inline-start: -12px;
	inline-size: calc(100% + 24px);
	block-size: calc(100% + 24px);
	background-color: var(--danger-alt);
	border-radius: var(--theme--border-radius);
	transition: var(--medium) var(--transition);
	transition-property: background-color, padding, margin;
	content: '';
}
</style>
