import { html } from "@worker-tools/html";
import Logger from "../utils/logs"; // Assuming logs.ts is in the same directory
import { Environment } from "../types";

export const HomePageContent = async (env: Environment) => {
  const { r2_bucket } = env; // Assuming r2_bucket is the binding name for R2 in the environment

  // Initialize the Logger with the R2 bucket
  const logger = new Logger(r2_bucket);

  // Get online users data for the past week
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // 7 days ago
  const endDate = new Date(); // Now

  // Generate chart data for online users per week
  const onlineUsersChartData = await logger.generateOnlineUsersChartData(
    startDate,
    endDate
  );

  // Retrieve total counts from logs
  const logs = await logger.getLogs(); // Get all logs
  const onlineUsersCount = logs.filter(
    (log) => log.action === "new_conversation"
  ).length;
  const conversationsCount = logs.filter(
    (log) => log.action === "new_conversation"
  ).length; // Assuming each "new_conversation" log represents a conversation
  const usersCount = logs.filter((log) => log.action === "new_user").length;

  // Prepare Chart.js data
  const chartData = JSON.stringify({
    labels: onlineUsersChartData.labels,
    datasets: [
      {
        label: "Online Users (Past Week)",
        data: onlineUsersChartData.data,
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.1,
      },
    ],
  });

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

      <canvas id="onlineUsersChart" class="mb-8"></canvas>

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

      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        const ctx = document
          .getElementById("onlineUsersChart")
          .getContext("2d");
        const chartData = ${chartData};
        const myChart = new Chart(ctx, {
          type: "line",
          data: chartData,
          options: {
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Date",
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Online Users",
                },
                beginAtZero: true,
              },
            },
          },
        });
      </script>
    </div>
  `;
};

export default HomePageContent;
