<script setup lang="ts">
import { useClipboard } from '@/composables/use-clipboard';
import { localizedFormat } from '@/utils/localized-format';
import type { User } from '@directus/types';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	user: User | null;
	isNew?: boolean;
}>();

const { t } = useI18n();

const { isCopySupported, copyToClipboard } = useClipboard();

const lastAccessDate = ref('');

watch(
	[() => props.user, () => props.isNew],
	async () => {
		if (!props.user) return;

		if (props.user.last_access) {
			lastAccessDate.value = localizedFormat(new Date(props.user.last_access), String(t('date-fns_date_short')));
		}
	},
	{ immediate: true },
);
</script>

<template>
	<sidebar-detail id="user-info" icon="info" :title="t('information')" close>
		<dl v-if="isNew === false && user">
			<div v-if="user.id" class="description-list">
				<dt>{{ t('key') }}</dt>
				<dd>{{ user.id }}</dd>
				<v-icon
					v-if="isCopySupported"
					name="content_copy"
					small
					clickable
					class="clipboard-icon"
					@click="copyToClipboard(user.id)"
				/>
			</div>
			<div v-if="user.last_page">
				<dt>{{ t('last_page') }}</dt>
				<dd>
					<router-link :to="user.last_page">{{ user.last_page }}</router-link>
				</dd>
			</div>
			<div v-if="user.last_access">
				<dt>{{ t('last_access') }}</dt>
				<dd>{{ lastAccessDate }}</dd>
			</div>
		</dl>

		<v-divider />

		<div v-md="t('page_help_users_item')" class="page-description" />
	</sidebar-detail>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 20px 0;
}

.description-list {
	display: flex;
	align-items: center;

	.clipboard-icon {
		--v-icon-color: var(--theme--foreground-subdued);
		--v-icon-color-hover: var(--theme--foreground);

		margin-inline-start: 4px;
	}
}
</style>
