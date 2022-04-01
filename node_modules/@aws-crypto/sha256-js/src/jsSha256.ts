import { BLOCK_SIZE } from "./constants";
import { RawSha256 } from "./RawSha256";
import { Hash, SourceData } from "@aws-sdk/types";
import { isEmptyData, convertToBuffer } from "@aws-crypto/util";

export class Sha256 implements Hash {
  private readonly hash = new RawSha256();
  private readonly outer?: RawSha256;
  private error: any;

  constructor(secret?: SourceData) {
    if (secret) {
      this.outer = new RawSha256();
      const inner = bufferFromSecret(secret);
      const outer = new Uint8Array(BLOCK_SIZE);
      outer.set(inner);

      for (let i = 0; i < BLOCK_SIZE; i++) {
        inner[i] ^= 0x36;
        outer[i] ^= 0x5c;
      }

      this.hash.update(inner);
      this.outer.update(outer);

      // overwrite the copied key in memory
      for (let i = 0; i < inner.byteLength; i++) {
        inner[i] = 0;
      }
    }
  }

  update(toHash: SourceData): void {
    if (isEmptyData(toHash) || this.error) {
      return;
    }

    try {
      this.hash.update(convertToBuffer(toHash));
    } catch (e) {
      this.error = e;
    }
  }

  /* This synchronous method keeps compatibility
   * with the v2 aws-sdk.
   */
  digestSync(): Uint8Array {
    if (this.error) {
      throw this.error;
    }

    if (this.outer) {
      if (!this.outer.finished) {
        this.outer.update(this.hash.digest());
      }

      return this.outer.digest();
    }

    return this.hash.digest();
  }

  /* The underlying digest method here is synchronous.
   * To keep the same interface with the other hash functions
   * the default is to expose this as an async method.
   * However, it can sometimes be useful to have a sync method.
   */
  async digest(): Promise<Uint8Array> {
    return this.digestSync();
  }
}

function bufferFromSecret(secret: SourceData): Uint8Array {
  let input = convertToBuffer(secret);

  if (input.byteLength > BLOCK_SIZE) {
    const bufferHash = new RawSha256();
    bufferHash.update(input);
    input = bufferHash.digest();
  }

  const buffer = new Uint8Array(BLOCK_SIZE);
  buffer.set(input);
  return buffer;
}
