import type { ExtensionManager } from "./extensions.js";
import { init, WASI } from '@wasmer/wasi';
import { readFile } from "fs/promises";

await init()

export class WasmManager {
    private extensionManager: ExtensionManager;
    private wasmModule: WebAssembly.Module | null = null;

    constructor(extensionManager: ExtensionManager) {
        this.extensionManager = extensionManager;
    }

    async run() {
        let isFirstRun = false;
        this.extensionManager

        if (!this.wasmModule) {
            isFirstRun = true;
            const wasmBytes = await readFile("./js.wasm");
            this.wasmModule = await WebAssembly.compile(new Uint8Array(wasmBytes));
        }

        let wasi = new WASI({
            args: ["js.wasm", "-f", "/input.js"],
            preopens: { '/': '/' },
            env: {},
        })

        wasi.instantiate(this.wasmModule, {});

        let file = wasi.fs.open("/input.js", { read: true, write: true, create: true });
        file.writeString(`
        console.log("hello wasi!")
        `);
        file.seek(0);

        try {
            let exitCode = wasi.start();
            console.log("Done!")
            let stdout = wasi.getStdoutString();
            console.log(wasi.getStderrString())

            console.log(`${stdout}(exit code: ${exitCode})`);
        } catch (error) {
            console.error(error);
            console.log(wasi.getStderrString())
        }
    }
}