import { action } from '@storybook/addon-actions';

export function fix(args, argTypes) {

    if(args === undefined) args = {}

    for(let type of Object.values(argTypes)) {
        if(type.table.category === 'events') {
            args[type.name] = action(type.name);
        }
    }

    return args
}