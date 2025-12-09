<script setup lang="ts">
import api from '@/api';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { i18n } from '@/lang';
import { getItemRoute } from '@/utils/get-route';
import { userName } from '@/utils/user-name';
import { isSystemCollection } from '@directus/system-data';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

type ActivityRecord = {
	user: {
		id: string;
		email: string;
		first_name: string;
		last_name: string;
	} | null;
	action: string;
	action_translated: string;
	timestamp: string;
	ip: string;
	user_agent: string;
	origin: string;
	collection: string;
	item: string;
};

const props = defineProps<{
	primaryKey: string;
}>();

const { t, te } = useI18n();

const router = useRouter();

const isOpen = useDialogRoute();

const item = ref<ActivityRecord>();
const loading = ref(false);
const error = ref<any>(null);

const openItemLink = computed(() => {
	if (!item.value || isSystemCollection(item.value.collection) || item.value.action === 'delete') return;

	return getItemRoute(item.value.collection, item.value.item);
});

watch(() => props.primaryKey, loadActivity, { immediate: true });

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
					'origin',
					'collection',
					'item',
				],
			},
		});

		item.value = response.data.data;

		if (item.value) {
			if (te(`field_options.directus_activity.${item.value.action}`)) {
				item.value.action_translated = t(`field_options.directus_activity.${item.value.action}`);
			}

			item.value.timestamp = new Date(item.value.timestamp).toLocaleString(i18n.global.locale.value);
		}
	} catch (err: any) {
		error.value = err;
	} finally {
		loading.value = false;
	}
}

function close() {
	router.push('/activity');
}
</script>

<template>
	<v-drawer :model-value="isOpen" :title="$t('activity_item')" @update:model-value="close" @cancel="close">
		<v-progress-circular v-if="loading" indeterminate />

		<div v-else-if="error" class="content">
			<v-notice type="danger">
				{{ error }}
			</v-notice>
		</div>

		<div v-else-if="item" class="content">
			<!-- @TODO add final design -->
			<p class="type-label">{{ $t('user') }}:</p>
			<user-popover v-if="item.user" :user="item.user.id">
				<span>
					{{ userName(item.user) }}
				</span>
			</user-popover>

			<p class="type-label">{{ $t('action') }}:</p>
			<p>{{ item.action_translated }}</p>

			<p class="type-label">{{ $t('date') }}:</p>
			<p>{{ item.timestamp }}</p>

			<p class="type-label">{{ $t('ip_address') }}:</p>
			<p>{{ item.ip }}</p>

			<p class="type-label">{{ $t('user_agent') }}:</p>
			<p>{{ item.user_agent }}</p>

			<p class="type-label">{{ $t('origin') }}:</p>
			<p>{{ item.origin }}</p>

			<p class="type-label">{{ $t('collection') }}:</p>
			<p>{{ item.collection }}</p>

			<p class="type-label">{{ $t('item') }}:</p>
			<p>{{ item.item }}</p>
		</div>

		<template #actions>
			<v-button v-if="openItemLink" v-tooltip.bottom="$t('open')" :to="openItemLink" icon rounded small>
				<v-icon name="launch" small />
			</v-button>
		</template>
	</v-drawer>
</template>

<style lang="scss" scoped>
.type-label:not(:first-child) {
	margin-block-start: 24px;
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding);
}
</style>
