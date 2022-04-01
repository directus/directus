"use strict";
// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.numToUint8 = void 0;
function numToUint8(num) {
    return new Uint8Array([
        (num & 0xff000000) >> 24,
        (num & 0x00ff0000) >> 16,
        (num & 0x0000ff00) >> 8,
        num & 0x000000ff,
    ]);
}
exports.numToUint8 = numToUint8;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtVG9VaW50OC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9udW1Ub1VpbnQ4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxvRUFBb0U7QUFDcEUsc0NBQXNDOzs7QUFFdEMsU0FBZ0IsVUFBVSxDQUFDLEdBQVc7SUFDcEMsT0FBTyxJQUFJLFVBQVUsQ0FBQztRQUNwQixDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFO1FBQ3hCLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUU7UUFDeEIsQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztRQUN2QixHQUFHLEdBQUcsVUFBVTtLQUNqQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBUEQsZ0NBT0MiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgQW1hem9uLmNvbSBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjBcblxuZXhwb3J0IGZ1bmN0aW9uIG51bVRvVWludDgobnVtOiBudW1iZXIpIHtcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFtcbiAgICAobnVtICYgMHhmZjAwMDAwMCkgPj4gMjQsXG4gICAgKG51bSAmIDB4MDBmZjAwMDApID4+IDE2LFxuICAgIChudW0gJiAweDAwMDBmZjAwKSA+PiA4LFxuICAgIG51bSAmIDB4MDAwMDAwZmYsXG4gIF0pO1xufVxuIl19