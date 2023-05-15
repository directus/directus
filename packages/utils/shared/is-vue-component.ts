import type { Component } from 'vue';
import { isObject } from './is-object.js';

export function isVueComponent(input: unknown): input is Component {
	if (!isObject(input)) return false;

	// A Vue component usually provides a 'setup' and/or 'render' function
	// (unfortunately there is no more accurate way to find out, but this should be enough for most cases)
	return input['setup'] instanceof Function || input['render'] instanceof Function;
}
