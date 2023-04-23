<template>
	<v-menu v-model="active" show-arrow placement="top" trigger="hover" :delay="300">
		<template #activator><slot /></template>

		<div v-if="loading" class="loading">
			<v-skeleton-loader class="avatar" />
			<div>
				<v-skeleton-loader type="text" />
				<v-skeleton-loader type="text" />
				<v-skeleton-loader type="text" />
			</div>
		</div>

		<div v-else-if="error" class="error">
			{{ error }}
		</div>

		<div v-else-if="data" class="user-box" @click.stop="navigateToUser">
			<v-avatar x-large class="avatar">
				<v-image v-if="avatarSrc" :src="avatarSrc" :alt="data.first_name" />
				<v-icon v-else name="person" />
			</v-avatar>
			<div class="data">
				<div class="name type-title">{{ userName(data) }}</div>
				<div class="status-role" :class="data!.status">{{ t(data.status) }} {{ data.role.name }}</div>
				<div class="email">{{ data.email }}</div>
			</div>
		</div>
	</v-menu>
</template>

<script setup lang="ts">
import api from '@/api';
import { userName } from '@/utils/user-name';
import { User } from '@directus/types';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const props = defineProps<{
	user: string;
}>();

const { t } = useI18n();

const router = useRouter();

const loading = ref(false);
const error = ref(null);
const data = ref<User | null>(null);

const avatarSrc = computed(() => {
	if (data.value === null) return null;

	if (data.value.avatar?.id) {
		return `/assets/${data.value.avatar.id}?key=system-medium-cover`;
	}

	return null;
});

const active = ref(false);

watch(active, () => {
	if (active.value === true && data.value === null && loading.value === false) {
		fetchUser();
	}
});

onUnmounted(() => {
	loading.value = false;
	error.value = null;
	data.value = null;
});

async function fetchUser() {
	loading.value = true;
	error.value = null;

	try {
		const response = await api.get(`/users/${props.user}`, {
			params: {
				fields: ['id', 'first_name', 'last_name', 'avatar.id', 'role.name', 'status', 'email'],
			},
		});

		data.value = response.data.data;
	} catch (err: any) {
		error.value = err;
	} finally {
		loading.value = false;
	}
}

function navigateToUser() {
	if (data.value) router.push(`/users/${data.value.id}`);
}
</script>

<style lang="scss" scoped>
.hover-trigger {
	width: max-content;
}

.user-box {
	display: flex;
	min-width: 300px;
	padding: 8px 4px;
	cursor: pointer;

	.v-avatar {
		margin-right: 16px;
	}

	.status-role {
		&.invited {
			color: var(--primary);
		}

		&.active {
			color: var(--success);
		}

		&.suspended {
			color: var(--warning);
		}

		&.deleted {
			color: var(--danger);
		}
	}

	.email {
		color: var(--foreground-subdued);
	}
}

.trigger {
	cursor: help;

	&:hover {
		border-bottom: 2px dotted var(--foreground-subdued);
	}
}

.loading {
	--v-skeleton-loader-background-color: var(--background-normal);

	display: flex;
	align-items: center;
	height: 80px;
	margin: 8px 4px;

	.avatar {
		width: 80px;
		height: 80px;
		margin-right: 16px;
	}

	div {
		width: 140px;

		.v-skeleton-loader:not(:last-child) {
			margin-bottom: 12px;
		}
	}
}
</style>
