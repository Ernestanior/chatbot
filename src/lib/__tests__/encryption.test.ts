import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "../encryption";
import crypto from "crypto";

beforeAll(() => {
  // Set a deterministic 32-byte hex key for tests
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
});

describe("encryption", () => {
  it("encrypts and decrypts a string correctly", () => {
    const original = "EAABwzLixnjYBO...fake_token_123";
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext for same input (random IV)", () => {
    const text = "same_input";
    const a = encrypt(text);
    const b = encrypt(text);
    expect(a).not.toBe(b);
    // Both decrypt to same value
    expect(decrypt(a)).toBe(text);
    expect(decrypt(b)).toBe(text);
  });

  it("handles empty string", () => {
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("handles unicode / CJK characters", () => {
    const text = "你好世界 🌍 こんにちは";
    expect(decrypt(encrypt(text))).toBe(text);
  });

  it("handles long tokens", () => {
    const longToken = "x".repeat(2000);
    expect(decrypt(encrypt(longToken))).toBe(longToken);
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encrypt("secret");
    const buf = Buffer.from(encrypted, "base64");
    buf[buf.length - 1] ^= 0xff; // flip last byte
    const tampered = buf.toString("base64");
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws when ENCRYPTION_KEY is missing", () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
    process.env.ENCRYPTION_KEY = saved;
  });
});
