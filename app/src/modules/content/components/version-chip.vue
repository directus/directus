<script setup lang="ts">
import type { ContentVersion } from '@directus/types';
import { computed } from 'vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { DRAFT_VERSION_KEY } from '@/constants';
import { getVersionDisplayName } from '@/utils/get-version-display-name';

const { version } = defineProps<{
	version: Pick<ContentVersion, 'key' | 'name'> | null;
	active?: boolean;
}>();

const kind = computed(() => {
	if (!version) return 'primary';
	if (version.key === DRAFT_VERSION_KEY) return 'secondary';
	return 'neutral';
});
</script>

<template>
	<VChip small clickable :label="false" class="version-chip" :kind :class="[{ active }]">
		<VTextOverflow class="version-name" :text="getVersionDisplayName(version)" placement="bottom" />
		<VIcon small name="arrow_drop_down" />
	</VChip>
</template>

<style lang="scss" scoped>
.version-chip.v-chip {
	--v-chip-font-weight: var(--theme--fonts--title--font-weight);

	padding-inline: 0.6875rem 0.3125rem;
}

.version-name {
	max-inline-size: 12.5rem;
	min-inline-size: 0;
}
</style>
