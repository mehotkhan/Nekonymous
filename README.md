# Nekonymous

Nekonymous is a secure and anonymous messaging bot for Telegram, allowing users to communicate without revealing their identity. Designed with privacy and security at its core, the bot employs advanced encryption techniques to ensure that all messages remain secure and private. The bot is deployed on Cloudflare Workers, offering high performance and global distribution.

## How It Works

### 1. User Interaction

- **Starting a Conversation**: Users initiate interaction with the bot using the `/start` command.
- **Unique Links**: The bot generates a unique UUID for each user and provides a personalized link that can be shared with others.
- **Anonymous Messaging**: When someone uses this link, they can send anonymous messages to the original user without revealing their identity.
- **Rate Limiting**: The bot implements rate limiting to prevent users from sending too many messages in a short period.

### 2. Message Flow

- **Encryption**: Messages are encrypted and stored securely using AES-GCM encryption and are stored in a secure manner.
- **Durable Objects**: The bot uses Cloudflare Durable Objects to manage user inboxes, ensuring consistent and scalable storage.
- **Notification**: The recipient is notified of new messages and can reply anonymously.
- **Reply Handling**: Replies are routed back to the sender, maintaining the anonymity of both parties.
- **Self-Messaging Prevention**: Users cannot send anonymous messages to themselves.

### 3. Blocking Users

- **User Control**: Users can block or unblock senders using inline buttons within the conversation, effectively filtering unwanted messages.
- **Statistics**: The bot tracks blocking and unblocking actions, providing insights into user interactions.

### 4. User Privacy

- **Anonymity**: The bot ensures no identifying information is leaked. UUIDs are randomly generated and do not correlate with any real user data.
- **Key Management**: Each conversation is secured with a unique key, ensuring that only the intended participants can access the messages.

## Security Overview

### 1. Ticketing System

The bot uses a robust ticketing system to manage message encryption and decryption. Each conversation is secured using a unique ticket ID that functions as a private key. This key is generated for each new conversation and is never stored in plain text.

- **Ticket ID (Private Key)**: Generated using secure methods, the private key is central to the encryption process.
- **APP_SECURE_KEY**: Enhances security by combining the ticket ID with an APP_SECURE_KEY stored securely in Cloudflare environment variables.
- **Public Key (Conversation ID)**: Derived from the ticket ID and APP_SECURE_KEY, it serves as the conversation identifier.

### 2. Encryption and Decryption Process

Messages sent through the bot are encrypted using AES-GCM encryption, ensuring that only the intended recipient can read the messages, even if intercepted by unauthorized parties.

- **Encryption**: A secure AES key is derived from the combined private key and APP_SECURE_KEY. This key encrypts the message payload, which includes the sender, recipient, and message content.
- **Decryption**: The same AES key derivation process is used to decrypt messages for the recipient.

### 3. Cloudflare Workers and Durable Objects

The bot is hosted on Cloudflare Workers, providing a secure, scalable environment for processing requests. User data and conversations are stored using Cloudflare's Durable Objects, which provide consistent storage with automatic synchronization.

### 4. Data Integrity and Tamper Protection

Combining the ticket ID with the APP_SECURE_KEY ensures that encryption keys maintain integrity, protecting against tampering and unauthorized decryption attempts.

### 5. Request Authentication

The bot only accepts requests from the official Telegram API by validating the `X-Telegram-Bot-Api-Secret-Token` header, protecting against unauthorized requests.

## Getting Started

Follow these steps to set up the development environment and get the bot running locally.

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v16.x or higher recommended)
- **npm** (comes with Node.js)
- **Git** (for version control)
- **Cloudflare Account** (for deployment)
- **Wrangler** (Cloudflare's CLI tool)


