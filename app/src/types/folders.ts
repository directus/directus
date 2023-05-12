export type SpecialFolder = 'all' | 'mine' | 'recent';

export type FolderTarget = { folder?: string; special?: never } | { special?: SpecialFolder; folder?: never };
