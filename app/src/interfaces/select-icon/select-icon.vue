<template>
	<v-menu attached :disabled="disabled">
		<template #activator="{ active, activate }">
			<v-input
				v-model="searchQuery"
				:disabled="disabled"
				:placeholder="value ? formatTitle(value) : t('interfaces.select-icon.search_for_icon')"
				:class="{ 'has-value': value }"
				:nullable="false"
				@focus="activate"
			>
				<template v-if="value" #prepend>
					<v-icon clickable :name="value" :class="{ active: value }" @click="activate" />
				</template>

				<template #append>
					<v-icon v-if="value !== null" clickable name="close" @click="setIcon(null)" />
					<v-icon
						v-else
						clickable
						name="expand_more"
						class="open-indicator"
						:class="{ open: active }"
						@click="activate"
					/>
				</template>
			</v-input>
		</template>

		<div class="content" :class="width">
			<template v-for="(group, index) in filteredIcons" :key="group.name">
				<div v-if="group.icons.length > 0" class="icons">
					<v-icon
						v-for="icon in group.icons"
						:key="icon"
						:name="icon"
						:class="{ active: icon === value }"
						clickable
						@click="setIcon(icon)"
					/>
				</div>
				<v-divider v-if="group.icons.length > 0 && index !== filteredIcons.length - 1" />
			</template>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import icons from './icons.json';

withDefaults(
	defineProps<{
		value: string | null;
		disabled?: boolean;
		width?: string;
	}>(),
	{
		width: 'half',
	}
);

const emit = defineEmits(['input']);

const { t } = useI18n();

const searchQuery = ref('');

const filteredIcons = computed(() => {
	if (searchQuery.value.length === 0) return icons;

	return icons.map((group) => {
		const icons = group.icons.filter((icon) => icon.includes(searchQuery.value.toLowerCase()));

		return {
			name: group.name,
			icons,
		};
	});
});

function setIcon(icon: string | null) {
	searchQuery.value = '';

	emit('input', icon);
}
</script>

<style lang="scss" scoped>
.v-input.has-value {
	--v-input-placeholder-color: var(--primary);

	&:focus-within {
		--v-input-placeholder-color: var(--foreground-subdued);
	}
}

.content {
	padding: 8px;

	--v-icon-color-hover: var(--foreground-normal);

	.v-icon.active {
		color: var(--primary);
	}

	.v-divider {
		--v-divider-color: var(--background-normal);

		margin: 0 22px;
	}
}

.icons {
	display: grid;
	grid-gap: 8px;
	grid-template-columns: repeat(auto-fit, 24px);
	justify-content: center;
	padding: 20px 0;
	color: var(--foreground-subdued);
}

.open-indicator {
	transform: scaleY(1);
	transition: transform var(--fast) var(--transition);
}

.open-indicator.open {
	transform: scaleY(-1);
}
</style>
