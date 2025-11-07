<script setup lang="ts">
import api from '@/api';
import { useClipboard } from '@/composables/use-clipboard';
import { getRootPath } from '@/utils/get-root-path';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import { useGroupable } from '@directus/composables';
import { PrimaryKey, Share } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { Ref, computed, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ShareItem from './share-item.vue';

const props = defineProps<{
	collection: string;
	primaryKey: string | number;
	allowed: boolean;
}>();

const { t } = useI18n();

const title = computed(() => t('shares'));

const { collection, primaryKey } = toRefs(props);

const { active: open } = useGroupable({
	value: title.value,
	group: 'sidebar-detail',
});

const { copyToClipboard } = useClipboard();

const {
	shares,
	shareToEdit,
	shareToSend,
	shareToDelete,
	sharesCount,
	loading,
	loadingCount,
	sendPublicLink,
	sendEmails,
	error,
	getShares,
	getSharesCount,
	input,
	send,
	select,
	unselect,
	remove,
	sending,
	deleting,
} = useShares(collection, primaryKey);

onMounted(() => {
	getSharesCount();
	if (open.value) getShares();
});

function onToggle(open: boolean) {
	if (open && shares.value === null) getShares();
}

function useShares(collection: Ref<string>, primaryKey: Ref<PrimaryKey>) {
	const shares = ref<Share[] | null>(null);
	const sharesCount = ref(0);
	const error = ref(null);
	const loading = ref(false);
	const loadingCount = ref(false);
	const deleting = ref(false);
	const shareToEdit = ref<string | null>(null);
	const shareToSend = ref<Share | null>(null);
	const shareToDelete = ref<Share | null>(null);
	const sending = ref(false);
	const sendEmails = ref('');

	watch([collection, primaryKey], () => refresh());

	const sendPublicLink = computed(() => {
		if (!shareToSend.value) return null;
		return window.location.origin + getRootPath() + 'admin/shared/' + shareToSend.value.id;
	});

	return {
		shares,
		shareToEdit,
		shareToSend,
		shareToDelete,
		sharesCount,
		loading,
		loadingCount,
		sendPublicLink,
		sendEmails,
		error,
		getShares,
		getSharesCount,
		input,
		send,
		select,
		unselect,
		remove,
		sending,
		deleting,
	};

	async function input(data: any) {
		if (!data) return;

		data.collection = collection.value;
		data.item = primaryKey.value;

		try {
			if (shareToEdit.value === '+') {
				await api.post('/shares', data);
			} else {
				await api.patch(`/shares/${shareToEdit.value}`, data);
			}

			await refresh();

			shareToEdit.value = null;
		} catch (error) {
			unexpectedError(error);
		}
	}

	function select(id: string) {
		shareToEdit.value = id;
	}

	function unselect() {
		shareToEdit.value = null;
	}

	async function refresh() {
		await getSharesCount();
		await getShares();
	}

	async function getShares() {
		error.value = null;
		loading.value = true;

		try {
			const response = await api.get(`/shares`, {
				params: {
					filter: {
						_and: [
							{
								collection: {
									_eq: collection.value,
								},
							},
							{
								item: {
									_eq: primaryKey.value,
								},
							},
						],
					},
					sort: 'name',
				},
			});

			shares.value = response.data.data;
		} catch (error: any) {
			error.value = error;
		} finally {
			loading.value = false;
		}
	}

	async function getSharesCount() {
		error.value = null;
		loadingCount.value = true;

		try {
			const response = await api.get(`/shares`, {
				params: {
					filter: {
						_and: [
							{
								collection: {
									_eq: collection.value,
								},
							},
							{
								item: {
									_eq: primaryKey.value,
								},
							},
						],
					},
					aggregate: {
						count: 'id',
					},
				},
			});

			sharesCount.value = Number(response.data.data[0].count.id);
		} catch (error: any) {
			error.value = error;
		} finally {
			loadingCount.value = false;
		}
	}

	async function remove() {
		if (!shareToDelete.value || deleting.value) return;

		deleting.value = true;

		try {
			await api.delete(`/shares/${shareToDelete.value.id}`);
			await refresh();
			shareToDelete.value = null;
		} catch (error) {
			unexpectedError(error);
		} finally {
			deleting.value = false;
		}
	}

	async function send() {
		if (!shareToSend.value || loading.value) return;

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
		} catch (error) {
			unexpectedError(error);
		} finally {
			sending.value = false;
		}
	}
}

async function copy(id: string) {
	const url = window.location.origin + getRootPath() + 'admin/shared/' + id;
	await copyToClipboard(url, { success: t('share_copy_link_success'), fail: t('share_copy_link_error') });
}
</script>

<template>
	<sidebar-detail
		id="shares"
		:title
		icon="share"
		:badge="!loadingCount && sharesCount > 0 ? abbreviateNumber(sharesCount) : null"
		@toggle="onToggle"
	>
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

		<v-dialog
			:model-value="!!shareToDelete"
			@update:model-value="shareToDelete = null"
			@esc="shareToDelete = null"
			@apply="remove"
		>
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

		<v-dialog
			:model-value="!!shareToSend"
			@update:model-value="shareToSend = null"
			@esc="shareToSend = null"
			@apply="send"
		>
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

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	position: sticky;
	inset-block-start: 0;
	z-index: 2;
	margin-block: 8px;
	padding-block: 8px;
	background-color: var(--theme--background-normal);
	box-shadow: 0 0 4px 2px var(--theme--background-normal);
}

.empty {
	margin-block: 16px;
	margin-inline-start: 2px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.grid {
	--theme--form--row-gap: 20px;

	@include mixins.form-grid;
}
</style>
