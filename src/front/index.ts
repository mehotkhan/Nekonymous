import { html } from "@worker-tools/html";
import { Environment } from "../types";

export const HomePageContent = async (env: Environment) => {
  // Return the HTML content with dynamic data and auto-refreshing chart
  return html`
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-center mb-8">
        به ${env.BOT_NAME} خوش آمدید
      </h1>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-blue-100 p-6 rounded-lg shadow-lg text-center">
          <h2 class="text-xl font-bold text-blue-700 mb-2">کاربران آنلاین</h2>
          <p id="onlineUsersCount" class="text-lg text-blue-600">
            در حال بارگذاری...
          </p>
        </div>
        <div class="bg-green-100 p-6 rounded-lg shadow-lg text-center">
          <h2 class="text-xl font-bold text-green-700 mb-2">تعداد مکالمات</h2>
          <p id="conversationsCount" class="text-lg text-green-600">
            در حال بارگذاری...
          </p>
        </div>
        <div class="bg-purple-100 p-6 rounded-lg shadow-lg text-center">
          <h2 class="text-xl font-bold text-purple-700 mb-2">کاربران فعال</h2>
          <p id="usersCount" class="text-lg text-purple-600">
            در حال بارگذاری...
          </p>
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
      <div class="text-center mb-10 py-10 border-b">
        <a
          href="https://t.me/anonymous_gap_bot?start"
          class="inline-block bg-blue-600 text-white text-xl font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          شروع به استفاده از ربات
        </a>
      </div>
      <canvas id="onlineUsersChart" class="mb-8"></canvas>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        const ctx = document
          .getElementById("onlineUsersChart")
          .getContext("2d");
        let myChart;

        async function fetchData() {
          try {
            const response = await fetch("/api/chart-data");
            const data = await response.json();

            document.getElementById("onlineUsersCount").textContent =
              data.onlineUsersCount + " نفر";
            document.getElementById("conversationsCount").textContent =
              data.conversationsCount + " مکالمه";
            document.getElementById("usersCount").textContent =
              data.usersCount + " نفر";

            const chartData = {
              labels: data.chartData.labels,
              datasets: [
                {
                  label: "کاربران آنلاین(هفت روز گذشته)",
                  data: data.chartData.data,
                  fill: false,
                  borderColor: "rgba(75, 192, 192, 1)",
                  tension: 0.1,
                },
              ],
            };

            if (!myChart) {
              myChart = new Chart(ctx, {
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
            } else {
              myChart.data.labels = chartData.labels;
              myChart.data.datasets[0].data = chartData.datasets[0].data;
              myChart.update();
            }
          } catch (error) {
            console.error("Error fetching chart data:", error);
          }
        }

        // Fetch initial data and set interval for periodic updates
        fetchData();
        setInterval(fetchData, 5000); // Update the chart and stats every 5 seconds
      </script>
    </div>
  `;
};

export default HomePageContent;
