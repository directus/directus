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
	return 'normal';
});
</script>

<template>
	<VChip small clickable :label="false" class="version-chip" :class="[kind, { active }]">
		<VTextOverflow class="version-name" :text="getVersionDisplayName(version)" placement="bottom" />
		<VIcon small name="arrow_drop_down" />
	</VChip>
</template>

<style lang="scss" scoped>
.version-chip.v-chip {
	--v-chip-font-weight: var(--theme--fonts--title--font-weight);

	padding-inline: 0.6875rem 0.3125rem;
	border-width: 0;

	&.primary {
		--v-chip-color: var(--foreground-inverted);
		--v-chip-background-color: var(--theme--primary);
		--v-chip-background-color-hover: var(--theme--primary-accent);
	}

	&.secondary {
		--v-chip-color: var(--foreground-inverted);
		--v-chip-background-color: var(--theme--secondary);
		--v-chip-background-color-hover: var(--theme--secondary-accent);
	}

	&.normal {
		--v-chip-color: var(--theme--foreground);
		--v-chip-color-hover: var(--v-chip-color);
		--v-chip-background-color: var(--theme--background-normal);
		--v-chip-background-color-hover: var(--theme--background-accent);
	}

	&.primary,
	&.secondary,
	&.normal {
		&.active {
			--v-chip-background-color: var(--v-chip-background-color-hover);
		}
	}
}

.version-name {
	max-inline-size: 12.5rem;
	min-inline-size: 0;
}
</style>
