import { DatabaseHelper } from "../types.js";

export abstract class JsonHelper extends DatabaseHelper {
    protected isSupported: boolean | null = null;
    protected abstract checkSupport(): Promise<boolean>;
    async supported(): Promise<boolean> {
        if (this.isSupported === null) {
            this.isSupported = await this.checkSupport();
        }

        return this.isSupported;
    }
}