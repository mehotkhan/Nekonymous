import { html, HTMLContent } from "@worker-tools/html";
import navMenu from "./nav";
import style from "./styles";

const pageLayout = (title: string, BOT_NAME: string, content: HTMLContent) =>
  html`<!doctype html>
    <html lang="fa">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
        ${style}
        <title>${title}</title>
        <meta name="description" content="ربات ${BOT_NAME} یک ابزار امن و خصوصی برای ارسال پیام‌های ناشناس است که حریم خصوصی شما را تضمین می‌کند." />
        <meta name="keywords" content="ربات ناشناس, امنیت, پیام ناشناس, حریم خصوصی, ${BOT_NAME}" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="ربات ${BOT_NAME}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="با استفاده از ربات ${BOT_NAME} می‌توانید به صورت کاملاً امن و بدون افشای هویت خود با دیگر کاربران ارتباط برقرار کنید." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://example.com" />
        <meta property="og:image" content="https://example.com/path-to-your-image.jpg" />
        <meta property="og:locale" content="fa_IR" />
        <meta property="og:site_name" content="${BOT_NAME}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="با استفاده از ربات ${BOT_NAME} می‌توانید به صورت کاملاً امن و بدون افشای هویت خود با دیگر کاربران ارتباط برقرار کنید." />
        <meta name="twitter:image" content="https://example.com/path-to-your-image.jpg" />
        <meta name="twitter:site" content="@YourTwitterHandle" />
        <link rel="canonical" href="https://example.com" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#317EFB"/>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "${BOT_NAME}",
            "url": "https://example.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://example.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        </script>
      </head>
      <body class="bg-gray-100 antialiased">
        <main class="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto mt-10">
          ${navMenu(BOT_NAME)}
          <div class="text-gray-700 leading-relaxed">${content}</div>
        </main>
      </body>
    </html>`;

export default pageLayout;
