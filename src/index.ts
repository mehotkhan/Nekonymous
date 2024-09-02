import { webhookCallback } from "grammy";
import { createBot } from "./bot/bot";
import { InboxDurableObject } from "./bot/inboxDU";
import { AboutPageContent } from "./front/about";
import { HomePageContent } from "./front/home";
import pageLayout from "./front/layout";
import { Environment } from "./types";
import { KVModel } from "./utils/kv-storage";
import { Router } from "./utils/router";
import { convertToPersianNumbers } from "./utils/tools";

// INBOX DURABLE OBJECTS
export { InboxDurableObject };

// Initialize a Router instance for handling different routes
const router = new Router();

/**
 * Define the route for the home page.
 * This will serve the main page of the application.
 */
router.get(
  "/",
  async (request: Request, env: Environment, ctx: ExecutionContext) => {
    const content = await HomePageContent(env);
    const html = pageLayout("ارسال پیام تلگرام ناشناس", env.BOT_NAME, content);
    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  }
);

/**
 * Define the route for the about page.
 * This will serve a page with information about the application or service.
 */
router.get(
  "/about",
  async (request: Request, env: Environment, ctx: ExecutionContext) => {
    const content = AboutPageContent();
    const html = pageLayout("درباره", env.BOT_NAME, content);
    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });

    // return new HTMLResponse(
    //   pageLayout("درباره", env.BOT_NAME, AboutPageContent)
    // );
  }
);

/**
 * API endpoint to get chart data in JSON format.
 * This will be used to update the chart data on the home page every 5 seconds.
 */
router.get(
  "/api/stats",
  async (request: Request, env: Environment, ctx: ExecutionContext) => {
    const statsModel = new KVModel<number>("stats", env.NekonymousKV);

    const today = new Date().toISOString().split("T")[0];

    const conversationsCount =
      (await statsModel.get(`newConversation:${today}`)) || 0;
    const usersCount = (await statsModel.get(`newUser:${today}`)) || 0;

    return Response.json({
      conversationsCount: convertToPersianNumbers(conversationsCount),
      usersCount: convertToPersianNumbers(usersCount),
    });
  }
);

/**
 * Define the bot webhook route.
 * This handles incoming webhook requests from Telegram to the bot.
 */
router.post(
  "/bot",
  async (request: Request, env: Environment, ctx: ExecutionContext) => {
    try {
      // Validate the request method; it should be POST for webhooks
      if (request.method === "POST") {
        // Extract the secret token from the headers
        // const providedToken = request.headers.get(
        // "X-Telegram-Bot-Api-Secret-Token"
        // );

        // Check if the provided token matches your secret token
        // if (providedToken !== env.SECRET_TELEGRAM_API_TOKEN) {
        //   return new Response("Unauthorized", { status: 401 });
        // }

        // Initialize the bot with the provided environment configuration
        const bot = createBot(env);

        return webhookCallback(bot, "cloudflare-mod")(request);
      } else {
        return new Response("Invalid request method", { status: 405 });
      }
    } catch (error) {
      // Handle any errors that occur during bot initialization or webhook handling
      return new Response("Error initializing bot", { status: 500 });
    }
  }
);

/**
 * Export the fetch handler.
 * This is the entry point for handling all incoming requests to the worker.
 */
export default {
  fetch: async (request: Request, env: Environment, ctx: ExecutionContext) => {
    return router.handle(request, env, ctx);
  },
};
