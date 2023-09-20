<template>
	<v-drawer
		:title="t('promote_version_drawer_title', { version: currentVersion.name })"
		class="version-drawer"
		persistent
		:model-value="active"
		@cancel="$emit('cancel')"
		@esc="$emit('cancel')"
	>
		<div class="content">
			<div class="grid">
				<v-notice v-if="isOutdated" type="warning" class="field full">
					{{ t('outdated_notice') }}
				</v-notice>
				<v-notice v-else type="info" class="field full">
					{{ t('promote_notice') }}
				</v-notice>
				<div v-for="field in comparedFields" :key="field.field" class="field full">
					<div class="type-label">
						{{ field.name }}
					</div>
					<div
						class="compare main"
						:class="{ active: !selectedFields.includes(field.field) }"
						@click="removeField(field.field)"
					>
						<v-icon name="looks_one" />
						<version-promote-field class="field-content" :value="comparedData?.main[field.field]" />
						<template v-if="!selectedFields.includes(field.field)">
							<v-chip class="version" x-small>{{ t('main_version') }}</v-chip>
							<v-icon name="check" />
						</template>
					</div>
					<div
						class="compare current"
						:class="{ active: selectedFields.includes(field.field) }"
						@click="addField(field.field)"
					>
						<v-icon name="looks_two" />
						<version-promote-field class="field-content" :value="comparedData?.current[field.field]" />
						<template v-if="selectedFields.includes(field.field)">
							<v-chip class="version" x-small>{{ currentVersion.name }}</v-chip>
							<v-icon name="check" />
						</template>
					</div>
				</div>
			</div>
		</div>

		<template #actions>
			<v-button
				v-tooltip.bottom="selectedFields.length === 0 ? t('promote_version_disabled') : t('promote_version')"
				:loading="promoting"
				:disabled="selectedFields.length === 0"
				icon
				rounded
				@click="promote"
			>
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<script setup lang="ts">
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { Field, Version } from '@directus/types';
import { ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VersionPromoteField from './version-promote-field.vue';

type Comparison = {
	outdated: boolean;
	mainHash: string;
	current: Record<string, any>;
	main: Record<string, any>;
};

interface Props {
	active: boolean;
	currentVersion: Version;
}

const { t } = useI18n();

const fieldsStore = useFieldsStore();

const props = defineProps<Props>();

const { active, currentVersion } = toRefs(props);

const isOutdated = ref<boolean>(false);

const mainHash = ref<string>('');

const comparedFields = ref<Field[]>([]);

const selectedFields = ref<string[]>([]);

const comparedData = ref<Comparison | null>(null);

const loading = ref(false);

const emit = defineEmits<{
	cancel: [];
	promote: [];
}>();

watch(
	active,
	(value) => {
		if (value) getComparison();
	},
	{ immediate: true }
);

function addField(field: string) {
	selectedFields.value = [...selectedFields.value, field];
}

function removeField(field: string) {
	selectedFields.value = selectedFields.value.filter((f) => f !== field);
}

async function getComparison() {
	loading.value = true;

	try {
		const result: Comparison = await api
			.get(`/versions/${unref(currentVersion).id}/compare`)
			.then((res) => res.data.data);

		isOutdated.value = result.outdated;

		mainHash.value = result.mainHash;

		comparedFields.value = Object.keys(result.main)
			.map((fieldKey) => fieldsStore.getField(unref(currentVersion).collection, fieldKey))
			.filter((field): field is Field => !!field);

		selectedFields.value = comparedFields.value.map((field) => field.field);

		comparedData.value = result;
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		loading.value = false;
	}
}

const promoting = ref(false);

async function promote() {
	promoting.value = true;

	try {
		await api.post(
			`/versions/${unref(currentVersion).id}/promote`,
			unref(selectedFields).length > 0
				? { mainHash: unref(mainHash), fields: unref(selectedFields) }
				: { mainHash: unref(mainHash) }
		);

		emit('promote');
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		promoting.value = false;
	}
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);

	.grid {
		@include form-grid;
	}
}

.compare {
	display: flex;
	align-items: center;
	width: 100%;
	padding: 8px;
	gap: 8px;
	color: var(--foreground-subdued);
	background-color: var(--background-subdued);
	cursor: pointer;

	.field-content {
		flex-grow: 1;
	}

	.version {
		text-transform: uppercase;
	}

	&.main {
		border-radius: var(--border-radius) var(--border-radius) 0 0;
		&.active {
			color: var(--secondary);
			background-color: var(--secondary-alt);

			.version {
				color: var(--secondary);
				border-color: var(--secondary);
				background-color: var(--secondary-25);
			}
		}
	}

	&.current {
		border-radius: 0 0 var(--border-radius) var(--border-radius);
		&.active {
			color: var(--primary);
			background-color: var(--primary-alt);

			.version {
				color: var(--primary);
				border-color: var(--primary);
				background-color: var(--primary-25);
			}
		}
	}
}
</style>
