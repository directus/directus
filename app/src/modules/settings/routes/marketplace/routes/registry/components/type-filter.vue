<script setup lang="ts">
import { EXTENSION_TYPES } from '@directus/extensions';
import { useI18n } from 'vue-i18n';

const type = defineModel<string | null>();

const { t } = useI18n();
</script>

<template>
	<div class="type-filter">
		<label :class="{ active: type === null }">
			<input v-model="type" :value="null" type="radio" name="type" />
			{{ t('all') }}
		</label>

		<label v-for="extType in EXTENSION_TYPES" :key="extType" :class="{ active: type === extType }">
			<input v-model="type" :value="extType" type="radio" name="type" />
			{{ t(`extension_${extType}s`) }}
		</label>
	</div>
</template>

<style scoped>
.type-filter {
	display: flex;
	gap: 4px 32px;
	flex-wrap: wrap;
	width: 100%;
}

input {
	display: none;
}

label {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition-out);
	cursor: pointer;

	&:hover {
		transition: none;
		color: var(--theme--foreground);
	}

	&.active {
		color: var(--theme--foreground-accent);
	}
}
</style>
