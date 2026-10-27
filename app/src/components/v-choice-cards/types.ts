export interface ChoiceCardItem<T extends string | number = string | number> {
	value: T;
	label?: string;
	description?: string;
	icon?: string;
	disabled?: boolean;
}
