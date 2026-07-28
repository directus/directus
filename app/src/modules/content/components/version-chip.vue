<script setup lang="ts">
import { VERSION_KEY_DRAFT } from '@directus/constants';
import type { ContentVersion } from '@directus/types';
import { computed } from 'vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { getVersionDisplayName } from '@/utils/get-version-display-name';

const { version, clickable = true } = defineProps<{
	version: Pick<ContentVersion, 'key' | 'name'> | null;
	clickable?: boolean;
}>();

const kind = computed(() => {
	if (!version) return 'primary';
	if (version.key === VERSION_KEY_DRAFT) return 'secondary';
	return 'neutral';
});
</script>

<template>
	<VChip small :clickable :label="false" class="version-chip" :class="{ 'not-clickable': !clickable }" :kind>
		<VTextOverflow class="version-name" :text="getVersionDisplayName(version)" placement="bottom" />
		<VIcon v-if="clickable" small name="arrow_drop_down" />
	</VChip>
</template>

<style lang="scss" scoped>
.version-chip.v-chip {
	--v-chip-font-weight: var(--theme--fonts--title--font-weight);

	padding-inline: 0.6875rem 0.3125rem;

	&.not-clickable {
		padding-inline: 0.6875rem;
	}
}

.version-name {
	max-inline-size: 12.5rem;
	min-inline-size: 0;
}
</style>
