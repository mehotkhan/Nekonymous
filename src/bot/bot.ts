import { Bot } from "grammy";
import { Environment, User } from "../types";
import { KVModel } from "../utils/kv-storage";
import Logger from "../utils/logs";
import {
  handleBlockAction,
  handleReplyAction,
  handleUnblockAction,
} from "./actions";
import {
  handleMessage,
  handleStartCommand,
  handleInboxCommand,
} from "./commands";

/**
 * Initializes and configures a new instance of the Telegram bot.
 *
 * This function sets up the bot with necessary environment configurations and
 * attaches event handlers for commands, messages, and callback queries.
 *
 * @param env The environment configuration for the bot, including API SECRET_TELEGRAM_API_TOKEN and KV storage.
 * @returns An instance of the Bot configured with commands and event handlers.
 */
export const createBot = (env: Environment) => {
  const {
    SECRET_TELEGRAM_API_TOKEN,
    NekonymousKV,
    BOT_INFO,
    nekonymousr2,
    APP_SECURE_KEY,
  } = env;

  // Initialize the bot with the provided API SECRET_TELEGRAM_API_TOKEN and bot information
  const bot = new Bot(SECRET_TELEGRAM_API_TOKEN, {
    botInfo: JSON.parse(BOT_INFO),
  });

  // Initialize KV models for different data types
  const userModel = new KVModel<User>("user", NekonymousKV);
  const conversationModel = new KVModel<string>("conversation", NekonymousKV);
  const userUUIDtoId = new KVModel<string>("userUUIDtoId", NekonymousKV);

  // Initialize Logger
  const logger = new Logger(nekonymousr2);

  /**
   * Handles the /start command.
   *
   * When a user sends the /start command, this handler will initialize or
   * continue their interaction with the bot, creating necessary user records
   * in the KV storage.
   */
  bot.command("start", (ctx) =>
    handleStartCommand(ctx, userModel, userUUIDtoId, logger)
  );

  /**
   * Handles the /inbpx command.
   *
  
   */
  bot.command("inbox", (ctx) =>
    handleInboxCommand(
      ctx,
      userModel,
      conversationModel,
      logger,
      APP_SECURE_KEY
    )
  );

  /**
   * Handles incoming messages.
   *
   * This handler processes any text or media message sent by users, manages
   * ongoing conversations, and routes the message appropriately depending on
   * the current context.
   */
  bot.on("message", (ctx) =>
    handleMessage(ctx, userModel, conversationModel, logger, APP_SECURE_KEY)
  );

  /**
   * Handles reply actions from inline keyboard buttons.
   *
   * When a user interacts with a "reply" button in a conversation, this handler
   * manages the process of linking the reply to the correct conversation and
   * preparing the bot to receive the reply.
   */
  bot.callbackQuery(/^reply_(.+)$/, (ctx) =>
    handleReplyAction(ctx, userModel, conversationModel, logger, APP_SECURE_KEY)
  );

  /**
   * Handles block actions from inline keyboard buttons.
   *
   * When a user clicks a "block" button, this handler adds the other user to
   * their block list, preventing further communication until the block is removed.
   */
  bot.callbackQuery(/^block_(.+)$/, (ctx) =>
    handleBlockAction(ctx, userModel, conversationModel, logger, APP_SECURE_KEY)
  );

  /**
   * Handles unblock actions from inline keyboard buttons.
   *
   * This handler removes a previously set block, allowing communication to
   * resume with the unblocked user.
   */
  bot.callbackQuery(/^unblock_(.+)$/, (ctx) =>
    handleUnblockAction(
      ctx,
      userModel,
      conversationModel,
      logger,
      APP_SECURE_KEY
    )
  );

  return bot;
};
