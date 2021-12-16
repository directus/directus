<template>
	<sidebar-detail :title="t('shares')" icon="share" :badge="count">
		<v-notice v-if="error" type="danger">{{ t('unexpected_error') }}</v-notice>
		<v-progress-linear v-else-if="loading" indeterminate />

		<div v-else-if="!shares || shares.length === 0" class="empty">
			<div class="content">{{ t('no_shares') }}</div>
		</div>

		<template v-for="share in shares" :key="share.id">
			<share-item :share="share" @click="select(share.id)" />
		</template>

		<drawer-item
			collection="directus_shares"
			:primary-key="selected"
			:active="!!selected"
			@cancel="unselect"
			@input="input"
		/>
		<v-button v-if="allowed" @click="select('+')">
			{{ t('new_share') }}
		</v-button>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref } from 'vue';
import DrawerItem from '@/views/private/components/drawer-item';

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

		const { shares, count, loading, error, refresh, select, unselect, selected } = useShares(
			props.collection,
			props.primaryKey
		);
		refresh();

		return { t, shares, loading, error, refresh, count, select, unselect, selected, input };

		async function input(data: any) {
			if (!data) return;
			data.collection = props.collection;
			data.item = props.primaryKey;
			try {
				if (selected.value === '+') {
					const res = await api.post('/shares', data);
				} else {
					await api.patch(`/shares/${selected.value}`, data);
				}
				refresh();
			} catch (error) {
				// TODO: handle error
			}
			selected.value = undefined;
		}

		function useShares(collection: string, primaryKey: string | number) {
			const shares = ref<any[] | null>(null);
			const count = ref(0);
			const error = ref(null);
			const loading = ref(false);
			const selected = ref<any>();

			return { shares, count, error, loading, refresh, select, unselect, selected };

			function select(id: string) {
				selected.value = id;
			}

			function unselect() {
				selected.value = undefined;
			}
			async function refresh() {
				error.value = null;
				loading.value = true;

				try {
					const response = await api.get(`/shares`, {
						params: {
							'filter[collection][_eq]': collection,
							'filter[item][_eq]': primaryKey,
							fields: ['id', 'name', 'password', 'max_uses', 'times_used', 'date_created', 'date_start', 'date_end'],
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
</style>
