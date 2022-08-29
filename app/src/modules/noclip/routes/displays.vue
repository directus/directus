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

		<template #actions:prepend>
			
		</template>

		<template #actions>
			
		</template>

		<template #navigation>
			<navigation />
		</template>

        <div class="main">
            <div class="component">
                <component v-if="loaded" :is="`display-${id}`" v-bind="bindings" />
            </div>

            <v-divider>{{t('props')}}</v-divider>

            <div class="props">
                <v-form v-model="bindings" :fields="fields" />
            </div>
        </div>
	</private-view>
</template>

<script lang="ts" setup>
import Navigation from '../components/navigation.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { DisplayConfig, Field } from '@directus/shared/types';
import formatTitle from '@directus/format-title';
import { getDisplay } from '@/displays';
import { getDefaultValue, typeToString } from '../utils/getDefaultValue';
import { keyBy, merge } from 'lodash';
import { getFieldDefaults } from '../utils/getFieldDefaults';
import { getComponent } from '../utils/getComponent';

interface Props {
    id: string
}

const props = withDefaults(defineProps<Props>(), {
});

const { t } = useI18n();

const { breadcrumb, title } = useBreadcrumb();

const displayInfo = computed(() => getDisplay(props.id))

const bindings = ref<Record<string, any>>({})
const loaded = ref(false)

watch(displayInfo, (value) => {
    updateDefaults(value)
    updateField(value)
}, { immediate: true })

async function updateDefaults(value?: DisplayConfig) {
    if (value) {
        loaded.value = false
        bindings.value = {}
        let propInfo = (await getComponent(value.component)).props
        if(!propInfo) return

        const fieldDefaults = getFieldDefaults('display', props.id)

        for(const [key, value] of Object.entries(propInfo)) {
            bindings.value[key] = fieldDefaults[key]?.default ?? getDefaultValue(value)
        }

        loaded.value = true
    } else {
        loaded.value = false
    }
}

const fields = ref<Field[]>([])

async function updateField(value?: DisplayConfig) {
    if (!value) return []
    const propInfo = (await getComponent(value.component)).props

    if(!propInfo) return []

    const fieldDefaults = getFieldDefaults('display', props.id)

    const keys = new Set([...Object.keys(propInfo), ...Object.keys(fieldDefaults)])

    fields.value = [...keys].map(key => {

        return merge({
            field: key,
            meta: {
                width: 'half',
                required: propInfo[key].required ?? false,
            },
            name: formatTitle(key),
            type: typeToString(propInfo[key].type),
        } as Field,
            fieldDefaults[key] ?? {},
        )
    })
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
		return `Displays / ${displayInfo.value?.name}`;
	});

	return { breadcrumb, title };
}
</script>

<style lang="scss" scoped>
.main {
    padding: var(--content-padding);
    .component {
        margin-bottom: 40px;
    }

    .props {
        margin-top: 40px;
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
        color: var(--primary)
    }
}
</style>
