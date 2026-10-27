export interface ChoiceCardItem<T extends string | number = string | number> {
	/** Value emitted when this card is selected */
	value: T;
	/** Primary text displayed on the card */
	label?: string;
	/** Secondary text displayed below the label */
	description?: string;
	/** Material icon name displayed at the top of the card */
	icon?: string;
	/** Disable this individual card */
	disabled?: boolean;
}
