import type { DeepPartial, Field } from '@directus/types';

export interface RepeaterProps {
	value: Record<string, unknown>[] | null;
	field?: string;
	fields?: DeepPartial<Field>[];
	template?: string;
	addLabel?: string;
	sort?: string;
	limit?: number;
	disabled?: boolean;
	nonEditable?: boolean;
	headerPlaceholder?: string;
	collection?: string;
	placeholder?: string;
	direction?: string;
	showConfirmDiscard?: boolean;
}

export type RepeaterEmits = {
	(e: 'input', value: Record<string, unknown>[] | null): void;
};
