<template>
	<v-menu show-arrow placement="left-start" class="permissions-toggle" close-on-content-click :disabled="saving">
		<template #activator="{ toggle }">
			<span>
				<v-progress-circular class="spinner" indeterminate small v-if="saving" />
				<div class="box" :class="value" v-else @click="toggle">
					<v-icon v-if="iconName" :name="iconName" />
				</div>
			</span>
		</template>

		<v-list dense>
			<v-list-item
				v-for="option in _options"
				:key="option.value"
				:active="value === option.value"
				@click="save(option.value)"
			>
				<v-list-item-icon>
					<div class="box" :class="option.value">
						<v-icon v-if="option.icon" :name="option.icon" />
					</div>
				</v-list-item-icon>
				<v-list-item-content>{{ option.name }}</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import i18n from '@/lang';
import { Permission } from '../../composables/use-permissions';

export default defineComponent({
	props: {
		value: {
			type: String,
			required: true,
		},
		options: {
			type: Array as PropType<string[]>,
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		status: {
			type: String,
			default: null,
		},
		savePermission: {
			type: Function as PropType<(values: Partial<Permission>) => {}>,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
		permissionId: {
			type: Number,
			default: undefined,
		},
		collection: {
			type: String,
			required: true,
		},
		role: {
			type: Number,
			required: true,
		},
	},
	setup(props) {
		const iconName = computed(() => {
			return getIconForValue(props.value);
		});

		const _options = computed(() => {
			return props.options.map((option) => ({
				value: option,
				name: i18n.t(option),
				icon: getIconForValue(option),
			}));
		});

		const saving = ref(false);

		return { iconName, _options, save, saving };

		async function save(newValue: string) {
			saving.value = true;

			const values: Partial<Permission> = {
				[props.type]: newValue,
				collection: props.collection,
				status: props.status,
				role: props.role,
			};

			if (props.permissionId) {
				values.id = props.permissionId;
			}

			await props.savePermission(values);

			saving.value = false;
		}

		function getIconForValue(value: string) {
			switch (value) {
				case 'indeterminate':
					return 'remove';
				case 'mine':
					return 'person';
				case 'role':
					return 'group';
				case 'full':
					return 'check';
				case 'read':
					return 'remove_red_eye';
				case 'create':
					return 'add';
				case 'update':
					return 'edit';
				case 'none':
					return null;
				default:
					return 'check_box_outline_blank';
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.box {
	--color: var(--foreground-subdued);

	position: relative;
	left: 3px; // aligns it better with regular material icons
	display: flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	background-color: var(--color);
	border: 2px solid transparent;
	border-radius: 2px;
	cursor: pointer;

	&.none {
		--color: transparent;

		border-color: var(--foreground-subdued);
	}

	&.indeterminate {
		--color: var(--foreground-subdued);
	}

	&.mine {
		--color: #ff9800;
	}

	&.role {
		--color: #fbc02d;
	}

	&.full {
		--color: var(--success);
	}

	.v-icon {
		--v-icon-size: 14px;
		--v-icon-color: var(--foreground-inverted);
	}
}
</style>
