<template>
	<sidebar-detail icon="info" :title="t('information')" close>
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
			<div v-if="user.created_on">
				<dt>{{ t('created_on') }}</dt>
				<dd>{{ user.created_on }}</dd>
			</div>
			<div v-if="user.created_by">
				<dt>{{ t('created_by') }}</dt>
				<dd>{{ user.created_by }}</dd>
			</div>
			<div v-if="user.modified_on">
				<dt>{{ t('modified_on') }}</dt>
				<dd>{{ user.modified_on }}</dd>
			</div>
		</dl>

		<v-divider />

		<div v-md="t('page_help_users_item')" class="page-description" />
	</sidebar-detail>
</template>

<script setup lang="ts">
import { useClipboard } from '@/composables/use-clipboard';
import { localizedFormat } from '@/utils/localized-format';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	user?: Record<string, any>;
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
	{ immediate: true }
);
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 20px 0;
}

.description-list {
	display: flex;
	align-items: center;

	.clipboard-icon {
		--v-icon-color: var(--foreground-subdued);
		--v-icon-color-hover: var(--foreground-normal);

		margin-left: 4px;
	}
}
</style>
