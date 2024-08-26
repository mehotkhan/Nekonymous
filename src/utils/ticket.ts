import { schnorr } from "@noble/curves/secp256k1";
import { utf8ToBytes } from "@noble/hashes/utils";

/**
 * Converts a Uint8Array to a Base64 string.
 * @param bytes The bytes to convert.
 * @returns The Base64 string.
 */
const bytesToBase64 = (bytes: Uint8Array): string => {
  return btoa(String.fromCharCode(...bytes));
};

/**
 * Converts a Base64 string to a Uint8Array.
 * @param base64 The Base64 string to convert.
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
 * Derives the public key from the ticket ID (private key).
 * This public key is used as a unique identifier for the conversation.
 * @param ticketId The ticket ID (private key) in Base64 format.
 * @returns The derived public key as a Base64 string.
 */
export const getConversationId = (ticketId: string): string => {
  return bytesToBase64(schnorr.getPublicKey(base64ToBytes(ticketId)));
};

/**
 * Generates a unique ticket ID (private key) for use in encryption.
 * The ticket ID is a random private key in Base64 format.
 * @returns The generated ticket ID as a Base64 string.
 */
export const generateTicketId = (): string => {
  const privateKey: Uint8Array = schnorr.utils.randomPrivateKey();
  return bytesToBase64(privateKey);
};

/**
 * Derives an AES key from a private key for encryption and decryption.
 * @param privateKey The private key used to derive the AES key.
 * @returns A promise that resolves to a CryptoKey object for AES-GCM operations.
 */
const deriveAESKey = async (privateKey: Uint8Array): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    "raw",
    privateKey.slice(0, 32), // Use the first 32 bytes of the private key
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
};

/**
 * Encrypts the conversation payload using the private key.
 * @param ticketId The ticket ID (private key) in Base64 format.
 * @param payload The conversation payload to encrypt.
 * @returns A promise that resolves to the encrypted payload as a Base64 string.
 */
export const encryptedPayload = async (
  ticketId: string,
  payload: string
): Promise<string> => {
  const privateKey = base64ToBytes(ticketId);
  const aesKey = await deriveAESKey(privateKey);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate a random IV
  const data = utf8ToBytes(payload);

  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data
  );

  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(encryptedData))}`;
};

/**
 * Decrypts the conversation payload using the private key.
 * @param ticketId The ticket ID (private key) in Base64 format.
 * @param encryptedPayload The encrypted payload as a Base64 string.
 * @returns A promise that resolves to the decrypted payload as a string.
 */
export const decryptPayload = async (
  ticketId: string,
  encryptedPayload: string
): Promise<string> => {
  const privateKey = base64ToBytes(ticketId);
  const [ivBase64, dataBase64] = encryptedPayload.split(":");
  const iv = base64ToBytes(ivBase64);
  const encryptedBytes = base64ToBytes(dataBase64);

  const aesKey = await deriveAESKey(privateKey);

  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encryptedBytes
  );

  // Use TextDecoder to convert the decrypted bytes back into a string
  return new TextDecoder().decode(decryptedData);
};
