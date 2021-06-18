export type Choice = {
	text: string;
	value: string | number;
	children?: Choice[];
};
