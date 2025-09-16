import type { Component } from 'vue';
import type { PrimaryKey } from '../items.js';

export interface EditorConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;
	component: Component;
	collections?: string[];
	options?: any;
}

export interface EditorProps {
	collection: string;
	primaryKey?: PrimaryKey | null;
	readonly?: boolean;
}
