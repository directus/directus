import { DEFAULT_REGISTRY } from "../constants.js"
import ky from 'ky';

export interface GetApiVersionOptions {
	registry?: string;
}

export const getApiVersion = async (options?: GetApiVersionOptions) => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;


}
