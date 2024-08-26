import { html } from "@worker-tools/html";

// Function to generate navigation menu
const navMenu = (title: String) => html`
  <nav
    class="bg-gray-200 p-4 rounded-md mb-4 flex justify-between items-center"
  >
    <div>
      <a
        href="/"
        class="text-xl font-bold nav-link text-blue-600 hover:text-blue-800"
        >${title}
      </a>
      <span
        class="text-sm font-normal nav-link text-blue-600 hover:text-blue-800"
      >
        ، ارسال پیام تلگرام ناشناس</span
      >
    </div>
    <div>
      <a href="/about" class="nav-link text-blue-600 hover:text-blue-800 mx-2"
        >درباره</a
      >
    </div>
  </nav>
`;
export default navMenu;
