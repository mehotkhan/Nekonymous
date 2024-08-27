import { HTMLResponse } from "@worker-tools/html";
import { webhookCallback } from "grammy";
import { createBot } from "./bot/bot";
import HomePageContent from "./front";
import AboutPageContent from "./front/about";
import pageLayout from "./front/layout";
import { Router } from "./utils/router";

export interface Environment {
  SECRET_TELEGRAM_API_TOKEN: string;
  anonymous_kv: KVNamespace;
  r2_bucket: R2Bucket;
  BOT_INFO: string;
  BOT_NAME: string;
  APP_SECURE_KEY: string;
}

// Initialize a Router instance for handling different routes
const router = new Router();

/**
 * Define the route for the home page.
 * This will serve the main page of the application.
 */
router.get(
  "/",
  async (request: Request, env: Environment, ctx: ExecutionContext) => {
    return new HTMLResponse(
      pageLayout(env.BOT_NAME, env.BOT_NAME, HomePageContent(env))
    );
  }
);

/**
 * Define the route for the about page.
 * This will serve a page with information about the application or service.
 */
router.get(
  "/about",
  async (request: Request, env: Environment, ctx: ExecutionContext) => {
    return new HTMLResponse(
      pageLayout("درباره", env.BOT_NAME, AboutPageContent)
    );
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
        const providedToken = request.headers.get(
          "X-Telegram-Bot-Api-Secret-Token"
        );

        // Check if the provided token matches your secret token
        if (providedToken !== env.SECRET_TELEGRAM_API_TOKEN) {
          return new Response("Unauthorized", { status: 401 });
        }

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
