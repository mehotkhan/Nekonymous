# Nekonymous

Nekonymous is a secure, anonymous messaging bot for Telegram that allows users to communicate without revealing their identity. Built with privacy in mind, it uses modern encryption techniques to ensure that all messages are secure and private. The bot is deployed on Cloudflare Workers, which provides high performance and global distribution.

## How It Works

1. **User Interaction**:

   - Users start a conversation with the bot by sending the `/start` command.
   - The bot generates a unique UUID for the user and provides a personalized link that can be shared with others.
   - When someone uses this link, they can send anonymous messages to the original user without revealing their identity.

2. **Message Flow**:

   - Messages sent via the bot are encrypted and stored securely using Cloudflare Workers KV (Key-Value storage).
   - The recipient is notified of new messages, which they can reply to anonymously.
   - Replies are routed back to the sender, maintaining the anonymity of both parties.

3. **Blocking Users**:

   - Users can block or unblock senders using inline buttons provided in the conversation.
   - This ensures that unwanted messages can be filtered out effectively.

4. **User Privacy**:
   - The bot ensures that no identifying information is leaked. UUIDs are randomly generated and do not correlate with any real user data.

## Getting Started

### Prerequisites

Before running the bot, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14.x or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update) (for deploying to Cloudflare Workers)
