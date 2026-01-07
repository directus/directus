<script setup lang="ts">
import { Role } from '@directus/types';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useClipboard } from '@/composables/use-clipboard';
import SidebarDetail from '@/views/private/components/sidebar-detail.vue';

defineProps<{
	role: Role | null;
}>();

const { isCopySupported, copyToClipboard } = useClipboard();
</script>

<template>
	<SidebarDetail v-if="role" id="role" icon="info" :title="$t('information')">
		<dl>
			<div class="description-list">
				<dt>{{ $t('primary_key') }}</dt>
				<dd>{{ role.id }}</dd>
				<VIcon
					v-if="isCopySupported"
					name="content_copy"
					small
					clickable
					class="clipboard-icon"
					@click="copyToClipboard(role!.id)"
				/>
			</div>
		</dl>
	</SidebarDetail>
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
