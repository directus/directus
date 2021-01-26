<template>
	<v-menu attached :disabled="disabled">
		<template #activator="{ active, activate }">
			<v-input
				:disabled="disabled"
				:placeholder="value ? formatTitle(value) : $t('interfaces.icon.search_for_icon')"
				v-model="searchQuery"
				@focus="activate"
				:class="{ 'has-value': value }"
				:nullable="false"
			>
				<template #prepend>
					<v-icon v-if="value" @click="activate" :name="value" :class="{ active: value }" />
				</template>

				<template #append>
					<v-icon v-if="value !== null" @click="setIcon(null)" name="close" />
					<v-icon v-else @click="activate" name="expand_more" class="open-indicator" :class="{ open: active }" />
				</template>
			</v-input>
		</template>

		<div class="content" :class="width">
			<template v-for="(group, index) in filteredIcons">
				<div :key="'icon-group-' + group.name" class="icons" v-if="group.icons.length > 0">
					<v-icon
						v-for="icon in group.icons"
						:key="icon"
						:name="icon"
						:class="{ active: icon === value }"
						@click="setIcon(icon)"
					/>
				</div>
				<v-divider :key="'divider-' + group.name" v-if="group.icons.length > 0 && index !== filteredIcons.length - 1" />
			</template>
		</div>
	</v-menu>
</template>

<script lang="ts">
import icons from './icons.json';
import { defineComponent, ref, computed } from '@vue/composition-api';
import formatTitle from '@directus/format-title';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: 'search',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		width: {
			type: String,
			default: 'half',
		},
	},
	setup(props, { emit }) {
		const searchQuery = ref('');

		const filteredIcons = computed(() => {
			return icons.map((group) => {
				if (searchQuery.value.length === 0) return group;

				const icons = group.icons.filter((icon) => icon.includes(searchQuery.value.toLowerCase()));

				return {
					...group,
					icons: icons,
					length: icons.length,
				};
			});
		});

		return {
			icons,
			setIcon,
			searchQuery,
			filteredIcons,
			formatTitle,
		};

		function setIcon(icon: string | null) {
			searchQuery.value = '';

			emit('input', icon);
		}
	},
});
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

	.v-icon:hover {
		color: var(--foreground-normal);
	}

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
