/**
 * KVModel provides an abstraction layer over Cloudflare's KV storage, allowing
 * for the easy manipulation of data stored under a specific namespace.
 *
 * This generic class is designed to handle objects with a known shape, providing
 * methods to create, retrieve, update, and delete records in the KV store.
 *
 * @template T - The type of object stored in this model, which extends a simple key-value pair record.
 */
export class KVModel<T extends Record<string, any>> {
  private namespace: string;
  private kv: KVNamespace;

  /**
   * Constructs a new KVModel instance.
   *
   * @param {string} namespace - The namespace under which all records are stored.
   * @param {KVNamespace} kv - The KV namespace binding from the Cloudflare environment.
   */
  constructor(namespace: string, kv: KVNamespace) {
    this.namespace = namespace;
    this.kv = kv;
  }

  /**
   * Generates a namespaced key for a given ID.
   *
   * @param {string} id - The unique identifier for the record.
   * @returns {string} - The full key including the namespace.
   */
  private generateKey(id: string): string {
    return `${this.namespace}:${id}`;
  }

  /**
   * Saves or updates a record in KV storage.
   *
   * @param {string} id - The unique identifier for the record.
   * @param {T} data - The data to be stored.
   * @param {number} [expiresIn] - Optional expiration time in seconds.
   * @returns {Promise<void>} - A promise that resolves when the operation completes.
   */
  async save(id: string, data: T, expiresIn?: number): Promise<void> {
    const key = this.generateKey(id);
    const expiration = expiresIn
      ? Math.floor(Date.now() / 1000) + expiresIn
      : undefined;
    await this.kv.put(key, JSON.stringify(data), { expiration });
  }

  /**
   * Retrieves a record by ID from KV storage.
   *
   * @param {string} id - The unique identifier for the record.
   * @returns {Promise<T | null>} - The retrieved record or null if not found.
   */
  async get(id: string): Promise<T | null> {
    const key = this.generateKey(id);
    const data = await this.kv.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Deletes a record by ID from KV storage.
   *
   * @param {string} id - The unique identifier for the record.
   * @returns {Promise<void>} - A promise that resolves when the operation completes.
   */
  async delete(id: string): Promise<void> {
    const key = this.generateKey(id);
    await this.kv.delete(key);
  }

  /**
   * Counts the number of records in the namespace, or those matching an optional prefix.
   *
   * @param {string} [extra] - Optional prefix to limit which records are counted.
   * @returns {Promise<number>} - The number of matching records.
   */
  async count(extra?: string): Promise<number> {
    const keys = await this.kv.list({
      prefix: extra ? `${this.namespace}:${extra}:` : `${this.namespace}:`,
    });
    return keys.keys.length;
  }
}
