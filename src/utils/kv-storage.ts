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

  /**
   * Updates a specific field in the stored record. If the field is an array, this method
   * allows you to push a new item into that array.
   *
   * @param {string} id - The unique identifier for the record.
   * @param {string} field - The field to update within the record.
   * @param {any} value - The value to set or push to the field.
   * @param {boolean} [push=false] - Whether to push the value to an array or simply update the field.
   * @returns {Promise<void>} - A promise that resolves when the operation completes.
   */
  async updateField(
    id: string,
    field: keyof T,
    value: any,
    push: boolean = false
  ): Promise<void> {
    const record = await this.get(id);

    if (!record) {
      throw new Error(`Record with ID ${id} not found.`);
    }

    if (push && Array.isArray(record[field])) {
      // Ensure no duplicates in the array
      const existingArray = record[field] as any[];
      const existingItemIndex = existingArray.findIndex((item: any) =>
        typeof item === "object" && item.ticketId
          ? item.ticketId === value.ticketId
          : item === value
      );
      if (existingItemIndex === -1) {
        existingArray.push(value);
      }
    } else {
      record[field] = value;
    }

    await this.save(id, record);
  }

  /**
   * Removes an item from an array field in the stored record.
   *
   * @param {string} id - The unique identifier for the record.
   * @param {string} field - The field to update within the record.
   * @param {any} value - The value to remove from the array.
   * @returns {Promise<void>} - A promise that resolves when the operation completes.
   */
  async popItemFromField(
    id: string,
    field: keyof T,
    value: any
  ): Promise<void> {
    const record = await this.get(id);

    if (!record) {
      throw new Error(`Record with ID ${id} not found.`);
    }

    if (Array.isArray(record[field])) {
      record[field] = (record[field] as any[]).filter((item) => item !== value);
    } else {
      throw new Error(`Field ${String(field)} is not an array.`);
    }

    await this.save(id, record);
  }
}
