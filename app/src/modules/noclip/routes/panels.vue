<template>
	<private-view :title="title">
		<template v-if="breadcrumb" #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people_alt" />
			</v-button>
		</template>

		<template #actions:prepend></template>

		<template #actions></template>

		<template #navigation>
			<navigation />
		</template>

		<div class="main">
			<div class="component">
				<v-workspace
					:edit-mode="editMode"
					:tiles="tiles"
					:zoom-to-fit="zoomToFit"
					@duplicate="() => {}"
					@edit="() => {}"
					@update="updatePanel"
					@delete="() => {}"
					@move="() => {}"
				>
					<template #default="{ tile }">
						<div class="panel-container">
							<component
								:is="`panel-${id}`"
								v-bind="bindings"
								:id="tile.id"
								:height="tile.height"
								:width="tile.width"
								:now="now"
							/>
						</div>
					</template>
				</v-workspace>
			</div>

			<v-divider>{{ t('props') }}</v-divider>

			<div class="props">
				<v-form v-model="bindings" :fields="fields" />
			</div>

			<v-divider>{{ t('panel') }}</v-divider>

			<div class="props">
				<v-form v-model="tiles[0]" :fields="panelFields" />
			</div>

			<v-divider>{{ t('workspace') }}</v-divider>

			<div class="props">
				<v-form v-model="workspaceOptions" :fields="workspaceFields" />
			</div>
		</div>

		<template #sidebar></template>
	</private-view>
</template>

<script lang="ts" setup>
import Navigation from '../components/navigation.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { DeepPartial, Field, PanelConfig } from '@directus/shared/types';
import formatTitle from '@directus/format-title';
import { merge } from 'lodash';
import { getFieldDefaults } from '../utils/getFieldDefaults';
import { getDefaultValue, typeToString } from '../utils/getDefaultValue';
import { getComponent } from '../utils/getComponent';
import { getPanel } from '@/panels';
import VWorkspace from '@/components/v-workspace.vue';
import { AppTile } from '@/components/v-workspace-tile.vue';
import { getOptions } from '../utils/getOptions';

interface Props {
	id: string;
}

const props = withDefaults(defineProps<Props>(), {});

const { t } = useI18n();
const now = new Date();
const { breadcrumb, title } = useBreadcrumb();

const panelInfo = computed(() => getPanel(props.id));
const zoomToFit = ref(false);
const editMode = ref(false);
const bindings = ref<Record<string, any>>({});
const loaded = ref(false);

const workspaceOptions = computed({
	get() {
		return {
			editMode: editMode.value,
			zoomToFit: zoomToFit.value,
		};
	},
	set({ editMode: newEditMode, zoomToFit: newZoomToFit }) {
		editMode.value = newEditMode;
		zoomToFit.value = newZoomToFit;
	},
});

const tiles = ref<AppTile[]>([
	{
		height: 20,
		width: 20,
		x: 10,
		y: 2,
		id: 'my-id',
		name: 'My Panel',
	},
]);

watch(
	panelInfo,
	(value) => {
		updateDefaults(value);
		updateField(value);
	},
	{ immediate: true }
);

async function updateDefaults(value?: PanelConfig) {
	if (value) {
		loaded.value = false;
		bindings.value = {};
		let propInfo = (await getComponent(value.component)).props;
		if (!propInfo) return;

		const fieldDefaults = getFieldDefaults('interface', props.id);

		for (const [key, value] of Object.entries(propInfo)) {
			bindings.value[key] = fieldDefaults[key]?.default ?? getDefaultValue(value);
		}

		loaded.value = true;
	} else {
		loaded.value = false;
	}
}

const fields = ref<Field[]>([]);

async function updateField(value?: PanelConfig) {
	if (!value) return [];
	const propInfo = (await getComponent(value.component)).props;

	if (!propInfo) return [];

	const fieldDefaults = getOptions(value.options);

	const keys = new Set([...Object.keys(propInfo), ...Object.keys(fieldDefaults)]);

	fields.value = [...keys].map((key) => {
		return merge(
			{
				field: key,
				meta: {
					width: 'half',
					required: propInfo[key]?.required ?? false,
				},
				name: formatTitle(key),
				type: typeToString(propInfo[key]?.type),
			} as Field,
			fieldDefaults[key] ?? {}
		);
	});
}

function useBreadcrumb() {
	const breadcrumb = computed(() => {
		return [
			{
				name: t('user_directory'),
				to: `/noclip`,
			},
		];
	});

	const title = computed(() => {
		return `Panels / ${panelInfo.value?.name}`;
	});

	return { breadcrumb, title };
}

function updatePanel({
	edits,
}: {
	edits: { width?: number; height?: number; position_x?: number; position_y?: number };
}) {
	if (edits.position_x) tiles.value[0].x = edits.position_x;
	if (edits.position_y) tiles.value[0].y = edits.position_y;
	if (edits.width) tiles.value[0].width = edits.width;
	if (edits.height) tiles.value[0].height = edits.height;
}

const panelFields = computed(() => {
	const fields: DeepPartial<Field>[] = [
		{
			field: 'id',
			type: 'string',
		},
		{
			field: 'height',
			type: 'integer',
		},
		{
			field: 'width',
			type: 'integer',
		},
		{
			field: 'x',
			type: 'integer',
		},
		{
			field: 'y',
			type: 'integer',
		},
		{
			field: 'name',
			type: 'string',
		},
		{
			field: 'icon',
			type: 'string',
		},
		{
			field: 'color',
			type: 'string',
		},
		{
			field: 'note',
			type: 'string',
		},
		{
			field: 'showHeader',
			type: 'boolean',
		},
		{
			field: 'minWidth',
			type: 'integer',
		},
		{
			field: 'minHeight',
			type: 'integer',
		},
		{
			field: 'draggable',
			type: 'boolean',
		},
		{
			field: 'borderRadius',
			type: 'json',
		},
	];

	return fields.map((panel) => ({ ...panel, meta: { width: 'half' }, name: formatTitle(panel.field ?? '') }));
});

const workspaceFields = computed(() => [
	{
		field: 'editMode',
		type: 'boolean',
		name: t('edit_mode'),
		meta: {
			width: 'half',
		},
	},
	{
		field: 'zoomToFit',
		type: 'boolean',
		name: t('zoom_to_fit'),
		meta: {
			width: 'half',
		},
	},
]);
</script>

<style lang="scss" scoped>
.main {
	padding: var(--content-padding);

	.v-divider {
		margin: 40px 0;
	}
}

.event {
	width: 100%;
	margin: 5px 0;
	cursor: pointer;

	&:hover::before {
		z-index: -1;
		position: absolute;
		content: '';
		top: -5px;
		bottom: -5px;
		left: -5px;
		right: -5px;
		background-color: var(--background-normal-alt);
		border-radius: var(--border-radius);
	}

	.title {
		display: flex;
		justify-content: space-between;

		.date {
			color: var(--foreground-subdued);
		}
	}

	.value {
		color: var(--primary);
	}
}
</style>
