import { KVModel } from "./kv-storage";

/**
 * Increments a stat by a given amount in the KV store.
 *
 * @param {KVModel<number>} statsModel - The stats KV model instance.
 * @param {string} statKey - The key for the statistic to increment.
 * @param {number} amount - The amount by which to increment the stat.
 */
export const incrementStat = async (
  statsModel: KVModel<number>,
  statKey: string,
  amount: number = 1
) => {
  const today = new Date().toISOString().split("T")[0]; // Get only the date part
  const fullStatKey = `${statKey}:${today}`;
  const currentValue = (await statsModel.get(fullStatKey)) || 0;
  await statsModel.save(fullStatKey, currentValue + amount);
};
