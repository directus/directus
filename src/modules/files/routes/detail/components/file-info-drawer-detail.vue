<template>
	<drawer-detail icon="info_outline" :title="$t('file_details')" close>
		<dl>
			<div v-if="type">
				<dt>{{ $t('type') }}</dt>
				<dd>{{ readableMimeType(type) || type }}</dd>
			</div>

			<div v-if="width && height">
				<dt>{{ $t('dimensions') }}</dt>
				<dd>{{ $n(width) }} × {{ $n(height) }}</dd>
			</div>

			<div v-if="filesize">
				<dt>{{ $t('size') }}</dt>
				<dd>{{ size }}</dd>
			</div>

			<div v-if="creationDate">
				<dt>{{ $t('created') }}</dt>
				<dd>{{ creationDate }}</dd>
			</div>

			<div v-if="checksum" class="checksum">
				<dt>{{ $t('checksum') }}</dt>
				<dd>{{ checksum }}</dd>
			</div>
		</dl>
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import readableMimeType from '@/utils/readable-mime-type';
import bytes from 'bytes';
import i18n from '@/lang';
import localizedFormat from '@/utils/localized-format';

export default defineComponent({
	inheritAttrs: false,
	props: {
		type: {
			type: String,
			default: null,
		},
		width: {
			type: Number,
			default: null,
		},
		height: {
			type: Number,
			default: null,
		},
		filesize: {
			type: Number,
			default: null,
		},
		uploaded_on: {
			type: String,
			default: null,
		},
		checksum: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const size = computed(() => {
			if (!props.filesize) return null;

			return bytes(props.filesize, { decimalPlaces: 2, unitSeparator: ' ' }); // { locale: i18n.locale.split('-')[0] }
		});

		const creationDate = ref<string | null>(null);

		localizedFormat(new Date(props.uploaded_on), String(i18n.t('date-fns_datetime'))).then((result) => {
			creationDate.value = result;
		});

		return { readableMimeType, size, creationDate };
	},
});
</script>

<style lang="scss" scoped>
dl > div {
	display: flex;
	margin-bottom: 12px;
}

dt,
dd {
	display: inline-block;
}

dt {
	margin-right: 8px;
	font-weight: 600;
}

dd {
	flex-grow: 1;
	overflow: hidden;
	color: var(--foreground-subdued);
	white-space: nowrap;
	text-overflow: ellipsis;
}

.checksum {
	dd {
		font-family: var(--family-monospace);
	}
}
</style>
