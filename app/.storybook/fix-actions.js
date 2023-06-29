import { action } from '@storybook/addon-actions';

export function fix(args, argTypes) {
	if (args === undefined) args = {};

	for (let type of Object.values(argTypes)) {
		if (type.table.category !== 'events') continue;

		if (type.name.startsWith('update:')) {
			args[type.name] = (event) => {
				action(type.name)(event);
			};
		} else args[type.name] = action(type.name);
	}

	return { args };
}
