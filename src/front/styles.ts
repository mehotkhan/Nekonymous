import { html } from "@worker-tools/html";

const style = html`
  <style>
    body {
      direction: rtl;
      font-family:
        Vazirmatn,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        "Roboto",
        "Oxygen",
        "Ubuntu",
        "Cantarell",
        "Fira Sans",
        "Droid Sans",
        "Helvetica Neue",
        Arial,
        sans-serif;
      background-color: #f0f4f8;
    }

    a {
      color: #3182ce;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  </style>
`;

export default style;
