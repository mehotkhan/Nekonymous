import { schnorr } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha2"; // ECMAScript modules (ESM) and Common.js
import { utf8ToBytes } from "@noble/hashes/utils";

/**
 * Converts a Uint8Array to a Base64 string.
 * @param bytes - The bytes to convert.
 * @returns The Base64 string.
 */
const bytesToBase64 = (bytes: Uint8Array): string => {
  return btoa(String.fromCharCode(...bytes));
};

/**
 * Converts a Base64 string to a Uint8Array.
 * @param base64 - The Base64 string to convert.
 * @returns The resulting Uint8Array.
 */
const base64ToBytes = (base64: string): Uint8Array => {
  return new Uint8Array(
    atob(base64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
};

/**
 * Combines the private key with the APP_SECURE_KEY using a hash function.
 * This method ensures that the resulting key is of a fixed, manageable length.
 * @param privateKey - The original private key.
 * @param appSecureKey - The application-specific secure key.
 * @returns A hashed Uint8Array of the combined keys.
 */
const combineWithAppSecureKey = (
  privateKey: Uint8Array,
  appSecureKey: string
): Uint8Array => {
  const keyBytes = utf8ToBytes(appSecureKey);
  const combined = new Uint8Array(privateKey.length + keyBytes.length);

  combined.set(privateKey);
  combined.set(keyBytes, privateKey.length);

  // Use SHA-256 to hash the combined key, ensuring a fixed length
  return sha256(combined);
};

/**
 * Derives the public key (conversation ID) from the ticket ID (private key).
 * @param ticketId - The ticket ID (private key) in Base64 format.
 * @param appSecureKey - The application-specific secure key.
 * @returns The derived public key as a Base64 string.
 */
export const getConversationId = (
  ticketId: string,
  appSecureKey: string
): string => {
  const combinedKey = combineWithAppSecureKey(
    base64ToBytes(ticketId),
    appSecureKey
  );
  return bytesToBase64(schnorr.getPublicKey(combinedKey));
};

/**
 * Generates a unique ticket ID (private key) for use in encryption.
 * The ticket ID is a random private key in Base64 format, combined with the APP_SECURE_KEY.
 * @param appSecureKey - The application-specific secure key.
 * @returns The generated ticket ID as a Base64 string.
 */
export const generateTicketId = (appSecureKey: string): string => {
  const privateKey = schnorr.utils.randomPrivateKey();
  const combinedKey = combineWithAppSecureKey(privateKey, appSecureKey);
  return bytesToBase64(combinedKey);
};

/**
 * Derives an AES key from a combined private key and APP_SECURE_KEY for encryption and decryption.
 * @param combinedKey - The combined private key used to derive the AES key.
 * @returns A promise that resolves to a CryptoKey object for AES-GCM operations.
 */
const deriveAESKey = async (combinedKey: Uint8Array): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    "raw",
    combinedKey.slice(0, 32),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
};

/**
 * Encrypts the conversation payload using the combined key (private key + APP_SECURE_KEY).
 * @param ticketId - The ticket ID (private key) in Base64 format.
 * @param appSecureKey - The application-specific secure key.
 * @param payload - The conversation payload to encrypt.
 * @returns A promise that resolves to the encrypted payload as a Base64 string.
 */
export const encryptedPayload = async (
  ticketId: string,
  payload: string,
  appSecureKey: string
): Promise<string> => {
  const combinedKey = combineWithAppSecureKey(
    base64ToBytes(ticketId),
    appSecureKey
  );
  const aesKey = await deriveAESKey(combinedKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = utf8ToBytes(payload);

  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data
  );

  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(encryptedData))}`;
};

/**
 * Decrypts the conversation payload using the combined key (private key + APP_SECURE_KEY).
 * @param ticketId - The ticket ID (private key) in Base64 format.
 * @param appSecureKey - The application-specific secure key.
 * @param encryptedPayload - The encrypted payload as a Base64 string.
 * @returns A promise that resolves to the decrypted payload as a string.
 */
export const decryptPayload = async (
  ticketId: string,
  encryptedPayload: string,
  appSecureKey: string
): Promise<string> => {
  const combinedKey = combineWithAppSecureKey(
    base64ToBytes(ticketId),
    appSecureKey
  );
  const [ivBase64, dataBase64] = encryptedPayload.split(":");
  const iv = base64ToBytes(ivBase64);
  const encryptedBytes = base64ToBytes(dataBase64);

  const aesKey = await deriveAESKey(combinedKey);

  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encryptedBytes
  );

  return new TextDecoder().decode(decryptedData);
};
