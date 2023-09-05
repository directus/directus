<template>
	<div class="extension-types" :class="{ app }">
		<template v-if="loading">
			<v-skeleton-loader v-for="i in 8" :key="i" type="text" />
		</template>
		<template v-else>
			<RouterLink :class="{ active: type === 'all' }" to="#" class="extension-type" @click="onClick('all')">
				All
			</RouterLink>
			<RouterLink
				v-if="app"
				to="#"
				class="extension-type"
				:class="{ active: type === 'installed' }"
				@click="onClick('installed')"
			>
				Installed
			</RouterLink>
			<RouterLink
				v-for="typeOption in types"
				:key="typeOption.type"
				class="extension-type"
				to="#"
				:class="{ active: type === typeOption.type }"
				@click="onClick(typeOption.type)"
			>
				{{ typeOption.name }}
			</RouterLink>
		</template>
	</div>
</template>

<script setup lang="ts">
import type { AxiosInstance } from 'axios';
import { inject, ref, onMounted } from 'vue';

interface Props {
	app?: boolean;
	search?: string;
	type: string;
}

interface Type {
	type: string;
	name: string;
}

withDefaults(defineProps<Props>(), {
	search: '',
	app: false,
});

const emit = defineEmits(['update:type']);

const api = inject('api') as AxiosInstance;

const types = ref<Type[]>([]);

const loading = ref(true);

onMounted(() => {
	loadTypes();
});

async function loadTypes() {
	loading.value = true;
	const response = await api.get('/items/extension_types');
	types.value = response.data.data;
	loading.value = false;
}

function onClick(type: string) {
	emit('update:type', type);
}
</script>

<style lang="scss" scoped>
.extension-types {
	display: flex;
	gap: 16px;

	.v-skeleton-loader {
		height: 24px;
	}

	.extension-type {
		text-decoration: none;
		cursor: pointer;
		background-color: transparent;
		border: none;
		padding: 0px 10px;
		height: 32px;
		border-radius: 16px;
		display: flex;
		align-items: center;

		&.active,
		&:hover {
			background-color: var(--primary-75);
		}
	}

	&.app .extension-type {
		padding: 0px;

		&.active,
		&:hover {
			background-color: transparent;
			color: var(--primary);
		}
	}
}
</style>
