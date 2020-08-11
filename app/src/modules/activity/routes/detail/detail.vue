<template>
	<v-modal active title="Activity Item" @toggle="close">
		<v-progress-circular indeterminate v-if="loading" />

		<template v-else-if="error">
			<v-notice type="danger">
				{{ error }}
			</v-notice>
		</template>

		<template v-else>
			<!-- @TODO add final design -->
			<p class="type-label">User:</p>
			<user-popover v-if="item.action_by" :user="item.action_by.id">
				{{ item.action_by.first_name }} {{ item.action_by.last_name }}
			</user-popover>

			<p class="type-label">Action:</p>
			<p>{{ item.action }}</p>

			<p class="type-label">Date:</p>
			<p>{{ item.action_on }}</p>

			<p class="type-label">IP Address:</p>
			<p>{{ item.ip }}</p>

			<p class="type-label">User Agent:</p>
			<p>{{ item.user_agent }}</p>

			<p class="type-label">Collection:</p>
			<p>{{ item.collection }}</p>

			<p class="type-label">Item:</p>
			<p>{{ item.item }}</p>
		</template>

		<template #footer>
			<v-button v-if="openItemLink" :to="openItemLink">
				<v-icon name="launch" left />
				{{ $t('open') }}
			</v-button>

			<v-button to="/activity">{{ $t('done') }}</v-button>
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref, watch } from '@vue/composition-api';
import { i18n } from '@/lang';
import router from '@/router';
import api from '@/api';

type Values = {
	[field: string]: any;
};

type ActivityRecord = {
	action_by: {
		first_name: string;
		last_name: string;
	} | null;
	action: string;
	action_on: string;
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

			return `/collections/${item.value.collection}/${item.value.item}`;
		});

		watch(() => props.primaryKey, loadActivity, { immediate: true });

		return {
			item,
			loading,
			error,
			close,
			openItemLink,
		};

		async function loadActivity() {
			loading.value = true;

			try {
				const response = await api.get(`/activity/${props.primaryKey}`, {
					params: {
						fields: [
							'action_by.id',
							'action_by.first_name',
							'action_by.last_name',
							'action',
							'action_on',
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
</style>
