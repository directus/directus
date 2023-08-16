<template>
	<sidebar-detail :title="t('shares')" icon="share" :badge="count">
		<v-notice v-if="error" type="danger">{{ t('unexpected_error') }}</v-notice>
		<v-progress-linear v-else-if="loading" indeterminate />

		<div v-else-if="!shares || shares.length === 0" class="empty">
			<div class="content">{{ t('no_shares') }}</div>
		</div>

		<template v-for="share in shares" :key="share.id">
			<share-item
				:share="share"
				@copy="copy(share.id)"
				@edit="select(share.id)"
				@delete="shareToDelete = share"
				@invite="shareToSend = share"
			/>
		</template>

		<drawer-item
			collection="directus_shares"
			:primary-key="shareToEdit"
			:active="!!shareToEdit"
			@update:active="unselect"
			@input="input"
		/>

		<v-dialog :model-value="!!shareToDelete" @update:model-value="shareToDelete = null" @esc="shareToDelete = null">
			<v-card>
				<v-card-title>{{ t('delete_share') }}</v-card-title>
				<v-card-text>{{ t('delete_are_you_sure') }}</v-card-text>

				<v-card-actions>
					<v-button secondary @click="shareToDelete = null">
						{{ t('cancel') }}
					</v-button>
					<v-button kind="danger" :loading="deleting" @click="remove">
						{{ t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :model-value="!!shareToSend" @update:model-value="shareToSend = null" @esc="shareToSend = null">
			<v-card>
				<v-card-title>{{ t('share_send_link') }}</v-card-title>
				<v-card-text>
					<div class="grid">
						<div class="field">
							<v-input disabled :model-value="sendPublicLink" />
						</div>

						<div class="field">
							<div class="type-label">{{ t('emails') }}</div>
							<v-textarea v-model="sendEmails" :nullable="false" placeholder="admin@example.com, user@example.com..." />
						</div>
					</div>
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="shareToSend = null">
						{{ t('cancel') }}
					</v-button>
					<v-button :loading="sending" @click="send">
						{{ t('share_send_link') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-button v-if="allowed" full-width @click="select('+')">
			{{ t('new_share') }}
		</v-button>
	</sidebar-detail>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { getRootPath } from '@/utils/get-root-path';
import { unexpectedError } from '@/utils/unexpected-error';
import { Share } from '@directus/types';
import { useClipboard } from '@/composables/use-clipboard';

import api from '@/api';
import ShareItem from './share-item.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';

const props = defineProps<{
	collection: string;
	primaryKey: string | number;
	allowed: boolean;
}>();

const { t } = useI18n();

const { copyToClipboard } = useClipboard();

const shares = ref<Share[] | null>([]);
const count = ref(0);
const error = ref(null);
const loading = ref(false);
const deleting = ref(false);
const shareToEdit = ref<string | null>(null);
const shareToSend = ref<Share | null>(null);
const shareToDelete = ref<Share | null>(null);
const sending = ref(false);
const sendEmails = ref('');

const sendPublicLink = computed(() => {
	if (!shareToSend.value) return null;
	return window.location.origin + getRootPath() + 'admin/shared/' + shareToSend.value.id;
});

refresh();

async function input(data: any) {
	if (!data) return;

	data.collection = props.collection;
	data.item = props.primaryKey;

	try {
		if (shareToEdit.value === '+') {
			await api.post('/shares', data);
		} else {
			await api.patch(`/shares/${shareToEdit.value}`, data);
		}

		await refresh();

		shareToEdit.value = null;
	} catch (error: any) {
		unexpectedError(error);
	}
}

async function copy(id: string) {
	const url = window.location.origin + getRootPath() + 'admin/shared/' + id;
	await copyToClipboard(url, { success: t('share_copy_link_success'), fail: t('share_copy_link_error') });
}

function select(id: string) {
	shareToEdit.value = id;
}

function unselect() {
	shareToEdit.value = null;
}

async function refresh() {
	error.value = null;
	loading.value = true;

	try {
		const response = await api.get(`/shares`, {
			params: {
				filter: {
					_and: [
						{
							collection: {
								_eq: props.collection,
							},
						},
						{
							item: {
								_eq: props.primaryKey,
							},
						},
					],
				},
				sort: 'name',
			},
		});

		count.value = response.data.data.length;
		shares.value = response.data.data;
	} catch (error: any) {
		error.value = error;
	} finally {
		loading.value = false;
	}
}

async function remove() {
	if (!shareToDelete.value) return;

	deleting.value = true;

	try {
		await api.delete(`/shares/${shareToDelete.value.id}`);
		await refresh();
		shareToDelete.value = null;
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		deleting.value = false;
	}
}

async function send() {
	if (!shareToSend.value) return;

	sending.value = true;

	try {
		const emailsParsed = sendEmails.value
			.split(/,|\n/)
			.filter((e) => e)
			.map((email) => email.trim());

		await api.post('/shares/invite', {
			emails: emailsParsed,
			share: shareToSend.value.id,
		});

		sendEmails.value = '';

		shareToSend.value = null;
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		sending.value = false;
	}
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.sidebar-detail {
	--v-badge-background-color: var(--primary);
}

.v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	position: sticky;
	top: 0;
	z-index: 2;
	margin-top: 8px;
	margin-bottom: 8px;
	padding-top: 8px;
	padding-bottom: 8px;
	background-color: var(--background-normal);
	box-shadow: 0 0 4px 2px var(--background-normal);
}

.empty {
	margin-top: 16px;
	margin-bottom: 16px;
	margin-left: 2px;
	color: var(--foreground-subdued);
	font-style: italic;
}

.grid {
	--form-vertical-gap: 20px;

	@include form-grid;
}
</style>
