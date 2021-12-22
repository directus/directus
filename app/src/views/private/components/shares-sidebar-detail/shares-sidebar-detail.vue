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
				@send="shareToSend = share"
				@delete="confirmDelete"
			/>
		</template>

		<drawer-item
			collection="directus_shares"
			:primary-key="selected"
			:active="!!selected"
			@cancel="unselect"
			@input="input"
		/>

		<v-dialog v-model="shareToDelete" @esc="shareToDelete = null">
			<v-card>
				<v-card-title>{{ t('delete_comment') }}</v-card-title>
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

		<v-button v-if="allowed" class="new-share" @click="select('+')">
			{{ t('new_share') }}
		</v-button>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref } from 'vue';
import DrawerItem from '@/views/private/components/drawer-item';
import { getRootPath } from '@/utils/get-root-path';
import { unexpectedError } from '@/utils/unexpected-error';
import { Share } from '@directus/shared/types';

import api from '@/api';
import ShareItem from './share-item.vue';

export default defineComponent({
	components: { ShareItem, DrawerItem },
	props: {
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: [String, Number],
			required: true,
		},
		allowed: {
			type: Boolean,
			required: true,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const shares = ref<Share[] | null>(null);
		const count = ref(0);
		const error = ref(null);
		const loading = ref(false);
		const shareToEdit = ref<string | null>(null);
		const shareToSend = ref<Share | null>(null);
		const shareToDelete = ref<Share | null>(null);

		refresh();

		return {
			shareToDelete,
			t,
			shares,
			loading,
			error,
			refresh,
			count,
			select,
			unselect,
			shareToEdit,
			input,
			copy,
			shareToSend,
		};

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
			await navigator?.clipboard?.writeText(url);
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
						'filter[collection][_eq]': props.collection,
						'filter[item][_eq]': props.primaryKey,
						fields: ['id', 'name', 'password', 'max_uses', 'times_used', 'date_created', 'date_start', 'date_end'],
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
	},
});
</script>

<style lang="scss" scoped>
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
	margin-bottom: 8px;
	margin-left: 2px;
	color: var(--foreground-subdued);
	font-style: italic;
}

.new-share {
	--v-button-width: 100%;

	width: 100%;
}
</style>
