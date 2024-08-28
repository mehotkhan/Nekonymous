import { Bot } from "grammy";
import { BlockList, CurrentConversation, Environment, User } from "../types";
import { KVModel } from "../utils/kv-storage";
import Logger from "../utils/logs"; // Import Logger class
import {
  handleBlockAction,
  handleReplyAction,
  handleUnblockAction,
} from "./actions";
import {
  handleDeleteUserCommand,
  handleMessage,
  handleStartCommand,
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
  const userBlockListModel = new KVModel<BlockList>("blockList", NekonymousKV);
  const conversationModel = new KVModel<string>("conversation", NekonymousKV);
  const currentConversationModel = new KVModel<CurrentConversation>(
    "currentConversation",
    NekonymousKV
  );
  const userIdToUUID = new KVModel<string>("userIdToUUID", NekonymousKV);

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
    handleStartCommand(
      ctx,
      userModel,
      userIdToUUID,
      userBlockListModel,
      currentConversationModel,
      logger
    )
  );

  /**
   * Handles the /deleteAccount command.
   *
   * When a user sends the /deleteAccount command, this handler will delete their user records
   * from the KV storage, effectively removing their presence from the system.
   */
  bot.command("deleteAccount", (ctx) =>
    handleDeleteUserCommand(ctx, userModel, userIdToUUID, logger)
  );

  /**
   * Handles incoming messages.
   *
   * This handler processes any text or media message sent by users, manages
   * ongoing conversations, and routes the message appropriately depending on
   * the current context.
   */
  bot.on("message", (ctx) =>
    handleMessage(
      ctx,
      userIdToUUID,
      userBlockListModel,
      currentConversationModel,
      conversationModel,
      logger,
      APP_SECURE_KEY
    )
  );

  /**
   * Handles reply actions from inline keyboard buttons.
   *
   * When a user interacts with a "reply" button in a conversation, this handler
   * manages the process of linking the reply to the correct conversation and
   * preparing the bot to receive the reply.
   */
  bot.callbackQuery(/^reply_(.+)$/, (ctx) =>
    handleReplyAction(
      ctx,
      currentConversationModel,
      userBlockListModel,
      conversationModel,
      logger,
      APP_SECURE_KEY
    )
  );

  /**
   * Handles block actions from inline keyboard buttons.
   *
   * When a user clicks a "block" button, this handler adds the other user to
   * their block list, preventing further communication until the block is removed.
   */
  bot.callbackQuery(/^block_(.+)$/, (ctx) =>
    handleBlockAction(
      ctx,
      userBlockListModel,
      conversationModel,
      logger,
      APP_SECURE_KEY
    )
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
      userBlockListModel,
      conversationModel,
      logger,
      APP_SECURE_KEY
    )
  );

  return bot;
};
