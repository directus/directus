import { Buffer } from 'node:buffer';

export const uint8ArrayToBuffer = (array: Uint8Array): Buffer<ArrayBuffer> => Buffer.from(array);
