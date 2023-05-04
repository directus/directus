<template>
	<user-popover v-if="value" :user="value.id">
		<div class="user" :class="display">
			<v-image
				v-if="(display === 'avatar' || display === 'both') && src"
				:src="src"
				role="presentation"
				:alt="value && userName(value)"
				:class="{ circle }"
			/>
			<img
				v-else-if="(display === 'avatar' || display === 'both') && src === null"
				src="../../assets/avatar-placeholder.svg"
				role="presentation"
				:alt="value && userName(value)"
				:class="{ circle }"
			/>
			<span v-if="display === 'name' || display === 'both'">{{ userName(value) }}</span>
		</div>
	</user-popover>
</template>

<script setup lang="ts">
import { userName } from '@/utils/user-name';
import { User } from '@directus/types';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		value: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'> | null;
		display?: 'avatar' | 'name' | 'both';
		circle?: boolean;
	}>(),
	{
		display: 'both',
	}
);

const src = computed(() => {
	if (props.value === null) return null;

	if (props.value.avatar?.id) {
		return `/assets/${props.value.avatar.id}?key=system-small-cover`;
	}

	return null;
});
</script>

<style lang="scss" scoped>
.user {
	display: flex;
	align-items: center;
	height: 100%;

	img {
		display: inline-block;
		width: auto;
		height: 100%;
		vertical-align: -30%;
		border-radius: 4px;

		&.circle {
			border-radius: 100%;
		}
	}

	&.both {
		img {
			margin-right: 8px;
		}
	}
}
</style>
