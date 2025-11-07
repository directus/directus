<script setup lang="ts">
import { useClipboard } from '@/composables/use-clipboard';
import { Role } from '@directus/types';
import { useI18n } from 'vue-i18n';

defineProps<{
	role: Role | null;
}>();

const { t } = useI18n();

const { isCopySupported, copyToClipboard } = useClipboard();
</script>

<template>
	<sidebar-detail v-if="role" id="role" icon="info" :title="t('information')">
		<dl>
			<div class="description-list">
				<dt>{{ t('primary_key') }}</dt>
				<dd>{{ role.id }}</dd>
				<v-icon
					v-if="isCopySupported"
					name="content_copy"
					small
					clickable
					class="clipboard-icon"
					@click="copyToClipboard(role!.id)"
				/>
			</div>
		</dl>
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
