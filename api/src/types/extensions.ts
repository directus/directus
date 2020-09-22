import { ListenerFn } from 'eventemitter2';

export type HookRegisterFunction = (context: any) => Record<string, ListenerFn>;
