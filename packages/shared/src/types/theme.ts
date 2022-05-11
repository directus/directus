type Hex = `#${string}`;
type Link = `var(--${string})`;

interface BaseColorVariants {
	normal?: Hex | Link;
	accent?: Hex | Link;
	subtle?: Hex | Link;
}

interface GlobalSettings {
	font?: {
		family?: {
			sans?: string | string[];
			serif?: string | string[];
			mono?: string | string[];
		};
	};
	color?: {
		primary?: BaseColorVariants;
		secondary?: BaseColorVariants;
		success?: BaseColorVariants;
		warning?: BaseColorVariants;
		danger?: BaseColorVariants;
		foreground?: BaseColorVariants & {
			invert?: Hex | Link;
		};
		background?: BaseColorVariants & {
			page?: Hex | Link;
			invert?: Hex | Link;
		};
		border?: BaseColorVariants;
	};
	border?: {
		width?: number;
		radius?: number;
	};
}

interface SubProperty {
	[key: string]: string | number | Hex | Link | SubProperty;
}

interface ComponentSettings {
	/** Key corresponds to category identifier */
	[key: string]: SubProperty;
}

interface ThemeSettings {
	/** General, global settings that will cascade down through the entire app */
	global?: GlobalSettings;
	/** Category-level settings */
	components?: ComponentSettings;
}

/** For use with theming interface */
// interface ThemingConfiguration {}

export interface Theme {
	/** Display name for theme */
	name: string;
	/** Theme author */
	author?: string;
	/** Short description of theme */
	description?: string;
	/** List of theme settings to parse */
	theme: ThemeSettings;
	/** Configuration settings for use in theming interface */
	// config?: ThemingConfiguration;
}
