/**
 * I know this looks a little silly, but it allows us to explicitly differentiate between when we're
 * expecting an item vs any other generic object.
 */

export type Item = Record<string, any>;

export type PrimaryKey = string | number;
