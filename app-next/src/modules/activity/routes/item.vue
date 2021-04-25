<template>
	<v-drawer active title="Activity Item" @toggle="close" @cancel="close">
		<v-progress-circular indeterminate v-if="loading" />

		<div class="content" v-else-if="error">
			<v-notice type="danger">
				{{ error }}
			</v-notice>
		</div>

		<div class="content" v-else>
			<!-- @TODO add final design -->
			<p class="type-label">User:</p>
			<user-popover v-if="item.user" :user="item.user.id">
				{{ userName(item.user) }}
			</user-popover>

			<p class="type-label">Action:</p>
			<p>{{ item.action }}</p>

			<p class="type-label">Date:</p>
			<p>{{ item.timestamp }}</p>

			<p class="type-label">IP Address:</p>
			<p>{{ item.ip }}</p>

			<p class="type-label">User Agent:</p>
			<p>{{ item.user_agent }}</p>

			<p class="type-label">Collection:</p>
			<p>{{ item.collection }}</p>

			<p class="type-label">Item:</p>
			<p>{{ item.item }}</p>
		</div>

		<template #actions>
			<v-button v-if="openItemLink" :to="openItemLink" icon rounded v-tooltip.bottom="$t('open')">
				<v-icon name="launch" />
			</v-button>

			<v-button to="/activity" icon rounded v-tooltip.bottom="$t('done')">
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref, watch } from '@vue/composition-api';
import router from '@/router';
import api from '@/api';
import { userName } from '@/utils/user-name';

type Values = {
	[field: string]: any;
};

type ActivityRecord = {
	user: {
		email: string;
		first_name: string;
		last_name: string;
	} | null;
	action: string;
	timestamp: string;
	ip: string;
	user_agent: string;
	collection: string;
	item: string;
};

export default defineComponent({
	name: 'activity-detail',
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { primaryKey } = toRefs(props);
		const item = ref<ActivityRecord>();
		const loading = ref(false);
		const error = ref<any>(null);

		const openItemLink = computed(() => {
			if (!item || !item.value) return;

			return `/collections/${item.value.collection}/${encodeURIComponent(item.value.item)}`;
		});

		watch(() => props.primaryKey, loadActivity, { immediate: true });

		return {
			item,
			loading,
			error,
			close,
			openItemLink,
			userName,
		};

		async function loadActivity() {
			loading.value = true;

			try {
				const response = await api.get(`/activity/${props.primaryKey}`, {
					params: {
						fields: [
							'user.id',
							'user.email',
							'user.first_name',
							'user.last_name',
							'action',
							'timestamp',
							'ip',
							'user_agent',
							'collection',
							'item',
						],
					},
				});

				item.value = response.data.data;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}

		function close() {
			router.push('/activity');
		}
	},
});
</script>

<style lang="scss" scoped>
.type-label:not(:first-child) {
	margin-top: 24px;
}

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}
</style>
