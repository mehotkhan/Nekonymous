import { html, HTMLContent } from "@worker-tools/html";
import style from "./styles";
import navMenu from "./nav";

const pageLayout = (
  title: string,
  BOT_NAME: string,
  content: HTMLContent
) => html`<!DOCTYPE html>
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
    </head>
    <body class="bg-gray-100  antialiased">
      <main class="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto mt-10">
        ${navMenu(BOT_NAME)}
        <div class="text-gray-700 leading-relaxed">${content}</div>
      </main>
    </body>
  </html>`;

export default pageLayout;
