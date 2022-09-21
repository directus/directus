import { Ref } from 'vue';

export type RefRecord<T> = { [k in keyof T]: Ref<T[k]> };
