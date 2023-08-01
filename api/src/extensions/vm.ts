import type { ExtensionManager } from "./extensions.js";
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');


export class VmManager {
    private extensionManager: ExtensionManager;

    constructor(extensionManager: ExtensionManager) {
        this.extensionManager = extensionManager;
    }

    async run() {
        this.extensionManager

        const isolateSizeMb = 64;
        const scriptTimeoutMs = 10_000;

        const isolate = new ivm.Isolate({ memoryLimit: isolateSizeMb });
        const context = await isolate.createContext();

        const jail = context.global;
        jail.setSync('global', jail.derefInto());

        jail.setSync('log', function (...args: any[]) {
            console.log(...args);
        });

        jail.setSync('addOne', function (num: number) {
            return num + 1;
        });

        jail.setSync('process', { env: {} }, { copy: true });

        try {
            context.eval(`
            while (true) {}
        `, {
                timeout: scriptTimeoutMs
            }).then(() => {
                console.log('Script completed successfully');
            }).catch((err: any) => {
                console.log('Script failed:', err);
            })
        } catch (e) {
            console.log('Script failed:', e);
        }
    }
}