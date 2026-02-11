<script setup lang="ts">
import { User } from '@directus/types';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import VAvatar from '@/components/v-avatar.vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import VMenu from '@/components/v-menu.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import { getAssetUrl } from '@/utils/get-asset-url';
import { userName } from '@/utils/user-name';

const props = defineProps<{
	user: string;
}>();

const router = useRouter();

const loading = ref(false);
const error = ref(null);
const data = ref<User | null>(null);

const avatarSrc = computed(() => {
	if (data.value === null) return null;

	if (data.value.avatar?.id) {
		return getAssetUrl(data.value.avatar.id, {
			imageKey: 'system-medium-cover',
			cacheBuster: data.value.avatar.modified_on,
		});
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
				fields: ['id', 'first_name', 'last_name', 'avatar.id', 'avatar.modified_on', 'role.name', 'status', 'email'],
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

<template>
	<VMenu v-model="active" show-arrow placement="top" trigger="hover" :delay="300">
		<template #activator><slot /></template>

		<div v-if="loading" class="loading">
			<VSkeletonLoader class="avatar" />
			<div>
				<VSkeletonLoader type="text" />
				<VSkeletonLoader type="text" />
				<VSkeletonLoader type="text" />
			</div>
		</div>

		<div v-else-if="error" class="error">
			{{ error }}
		</div>

		<div v-else-if="data" class="user-box" @click.stop="navigateToUser">
			<VAvatar x-large class="avatar">
				<VImage v-if="avatarSrc" :src="avatarSrc" :alt="data.first_name" />
				<VIcon v-else name="person" />
			</VAvatar>
			<div class="data">
				<div class="name type-title">{{ userName(data) }}</div>
				<VChip class="status" :class="data.status" small>
					{{ $t(`fields.directus_users.status_${data.status}`) }}
				</VChip>
				<VChip v-if="data.role?.name" small>{{ data.role.name }}</VChip>
				<div class="email">{{ data.email }}</div>
			</div>
		</div>
	</VMenu>
</template>

<style lang="scss" scoped>
.hover-trigger {
	inline-size: max-content;
}

.user-box {
	display: flex;
	min-inline-size: 300px;
	padding: 8px 4px;
	cursor: pointer;

	.v-avatar {
		margin-inline-end: 16px;
	}

	.status {
		margin-inline-end: 4px;

		&.active {
			--v-chip-color: var(--theme--success);
			--v-chip-background-color: var(--success-25);
		}

		&.draft {
			--v-chip-color: var(--pink);
			--v-chip-background-color: var(--pink-25);
		}

		&.invited {
			--v-chip-color: var(--theme--primary);
			--v-chip-background-color: var(--theme--primary-subdued);
		}

		&.suspended {
			--v-chip-color: var(--theme--warning);
			--v-chip-background-color: var(--warning-25);
		}

		&.archived {
			--v-chip-color: var(--theme--danger);
			--v-chip-background-color: var(--danger-25);
		}
	}

	.email {
		color: var(--theme--foreground-subdued);
	}
}

.trigger {
	cursor: help;

	&:hover {
		border-block-end: 2px dotted var(--theme--foreground-subdued);
	}
}

.loading {
	--v-skeleton-loader-background-color: var(--theme--background-normal);

	display: flex;
	align-items: center;
	block-size: 80px;
	margin: 8px 4px;

	.avatar {
		inline-size: 80px;
		block-size: 80px;
		margin-inline-end: 16px;
	}

	div {
		inline-size: 140px;

		.v-skeleton-loader:not(:last-child) {
			margin-block-end: 12px;
		}
	}
}
</style>
