<template>
	<sidebar-detail icon="info" :title="t('information')" close>
		<template v-if="role">
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

			<v-divider />
		</template>
		<div v-md="t('page_help_settings_roles_item')" class="page-description" />
	</sidebar-detail>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useClipboard } from '@/composables/use-clipboard';

interface Props {
	role?: Record<string, any> | null;
}

withDefaults(defineProps<Props>(), {
	role: () => null,
});

const { t } = useI18n();

const { isCopySupported, copyToClipboard } = useClipboard();
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
