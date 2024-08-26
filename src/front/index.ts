import { html } from "@worker-tools/html";
import { KVModel } from "../utils/kv-storage";
import { CurrentConversation, Environment, User } from "../types";
import { convertToPersianNumbers } from "../utils/tools";

interface StatsCache {
  onlineUsersCount: number;
  conversationsCount: number;
  usersCount: number;
}

/**
 * Fetches or computes the current stats and caches them for 30 seconds.
 * If the cached stats are available, it returns them directly.
 * Otherwise, it computes the stats, stores them in KV with a 30-second TTL, and then returns them.
 *
 * @param {Environment} env - The environment variables and KV namespace bindings.
 * @returns {Promise<StatsCache>} - The stats for online users, conversations, and total users.
 */
async function getStatsWithCache(env: Environment): Promise<StatsCache> {
  const { anonymous_kv } = env;
  const statsCacheKey = "statsCache";
  const cacheTTL = 60;

  // Initialize the cache model
  const statsCacheModel = new KVModel<StatsCache>("statsCache", anonymous_kv);

  // Attempt to retrieve cached stats
  let cachedStats = await statsCacheModel.get(statsCacheKey);

  // If cached stats are not available, compute and cache them
  if (!cachedStats) {
    const userModel = new KVModel<User>("user", anonymous_kv);
    const conversationModel = new KVModel<string>("conversation", anonymous_kv);
    const currentConversationModel = new KVModel<CurrentConversation>(
      "currentConversation",
      anonymous_kv
    );

    // Compute the stats
    const onlineUsersCount = await currentConversationModel.count();
    const conversationsCount = await conversationModel.count();
    const usersCount = await userModel.count();

    // Store the computed stats in the cache with a 30-second expiration
    cachedStats = {
      onlineUsersCount,
      conversationsCount,
      usersCount,
    };
    await statsCacheModel.save(statsCacheKey, cachedStats, cacheTTL);
  }

  return cachedStats;
}

/**
 * Generates the content for the home page, displaying bot statistics such as online users, conversations, and total users.
 *
 * @param {Environment} env - The environment variables and KV namespace bindings.
 * @returns {Promise<string>} - The HTML content for the home page.
 */
export const HomePageContent = async (env: Environment): Promise<string> => {
  // Get the stats, either from cache or by computing them
  const stats = await getStatsWithCache(env);

  // Convert the stats to Persian numbers for display
  const onlineUsersCount = convertToPersianNumbers(stats.onlineUsersCount);
  const conversationsCount = convertToPersianNumbers(stats.conversationsCount);
  const usersCount = convertToPersianNumbers(stats.usersCount);

  // Return the HTML content with dynamic data
  return html`
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-center mb-8">
        به ${env.BOT_NAME} خوش آمدید
      </h1>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-blue-100 p-6 rounded-lg shadow-lg text-center">
          <h2 class="text-xl font-bold text-blue-700 mb-2">کاربران آنلاین</h2>
          <p class="text-lg text-blue-600">${onlineUsersCount} نفر</p>
        </div>
        <div class="bg-green-100 p-6 rounded-lg shadow-lg text-center">
          <h2 class="text-xl font-bold text-green-700 mb-2">تعداد مکالمات</h2>
          <p class="text-lg text-green-600">${conversationsCount} مکالمه</p>
        </div>
        <div class="bg-purple-100 p-6 rounded-lg shadow-lg text-center">
          <h2 class="text-xl font-bold text-purple-700 mb-2">کاربران فعال</h2>
          <p class="text-lg text-purple-600">${usersCount} نفر</p>
        </div>
      </div>

      <p class="text-lg leading-relaxed mb-4">
        نِکونیموس ما به شما این امکان را می‌دهد که به صورت ناشناس و امن با دیگر
        کاربران چت کنید. این ربات با استفاده از تکنولوژی‌های پیشرفته و رمزنگاری
        مدرن توسعه داده شده است تا حریم خصوصی شما را به بهترین نحو ممکن حفظ کند.
      </p>
      <p class="text-lg leading-relaxed mb-4">
        برای شروع، کافی است روی دکمه زیر کلیک کنید تا به ربات وارد شوید. ربات به
        صورت خودکار یک لینک یکتا برای شما تولید می‌کند که می‌توانید آن را با
        دیگران به اشتراک بگذارید و مکالمات خود را آغاز کنید.
      </p>
      <div class="text-center">
        <a
          href="https://t.me/anonymous_gap_bot?start"
          class="inline-block bg-blue-600 text-white text-xl font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          شروع به استفاده از ربات
        </a>
      </div>
    </div>
  `;
};

export default HomePageContent;
