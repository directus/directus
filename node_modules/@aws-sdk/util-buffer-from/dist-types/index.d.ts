import { Buffer } from "buffer";
export declare const fromArrayBuffer: (input: ArrayBuffer, offset?: number, length?: number) => Buffer;
export declare type StringEncoding = "ascii" | "utf8" | "utf16le" | "ucs2" | "base64" | "latin1" | "binary" | "hex";
export declare const fromString: (input: string, encoding?: StringEncoding | undefined) => Buffer;
