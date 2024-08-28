Nekonymous
==========

Nekonymous is a secure and anonymous messaging bot for Telegram that allows users to communicate without revealing their identity. Designed with privacy at its core, the bot employs modern encryption techniques to ensure that all messages remain secure and private. The bot is deployed on Cloudflare Workers, offering high performance and global distribution.

How It Works
------------

### 1\. User Interaction

-   **Starting a Conversation**: Users initiate interaction with the bot using the `/start` command.
-   **Unique Links**: The bot generates a unique UUID for each user and provides a personalized link that can be shared with others.
-   **Anonymous Messaging**: When someone uses this link, they can send anonymous messages to the original user without revealing their identity.

### 2\. Message Flow

-   **Encryption**: Messages are encrypted and stored securely using Cloudflare Workers KV (Key-Value storage).
-   **Notification**: The recipient is notified of new messages, which they can reply to anonymously.
-   **Reply Handling**: Replies are routed back to the sender, maintaining the anonymity of both parties.

### 3\. Blocking Users

-   **User Control**: Users can block or unblock senders using inline buttons within the conversation, allowing them to filter unwanted messages effectively.

### 4\. User Privacy

-   **Anonymity**: The bot ensures no identifying information is leaked. UUIDs are randomly generated and do not correlate with any real user data.

Bot's Security Overview
-----------------------

### 1\. Ticketing System

The bot uses a robust ticketing system to manage message encryption and decryption. Each conversation is secured using a unique ticket ID functioning as a private key. This key is generated for each new conversation and is never stored in plain text.

-   **Ticket ID (Private Key)**: Generated using the `@noble/curves` library, the private key is central to the encryption process.
-   **APP_SECURE_KEY**: Enhances security by combining the ticket ID with an APP_SECURE_KEY stored securely in Cloudflare environment variables.
-   **Public Key (Conversation ID)**: Derived from the ticket ID and APP_SECURE_KEY, it serves as the conversation identifier.

### 2\. Encryption and Decryption Process

Messages sent through the bot are encrypted using AES-GCM encryption, ensuring that only the intended recipient can read the messages, even if intercepted by unauthorized parties.

-   **Encryption**: A secure AES key is derived from the combined private key and APP_SECURE_KEY. This key encrypts the message payload, which includes the sender, recipient, and message content.
-   **Decryption**: The same AES key derivation process is used to decrypt messages for the recipient.

### 3\. Cloudflare Workers and KV Storage

The bot is hosted on Cloudflare Workers, providing a secure, scalable environment for processing requests. User data and conversations are stored in Cloudflare's KV storage, a globally distributed key-value store offering high availability and resilience.

### 4\. Data Integrity and Tamper Protection

Combining the ticket ID with the APP_SECURE_KEY ensures that encryption keys maintain integrity, protecting against tampering and unauthorized decryption attempts.

### 5\. Logging and Auditing

The bot logs significant actions, such as user registration, message sending, and system errors. Logs are stored securely in Cloudflare's R2 storage (if available) or the KV storage, providing an audit trail for security reviews.

### 6\. Request Authentication

The bot only accepts requests from the official Telegram API by validating the `X-Telegram-Bot-Api-Secret-Token` header, protecting against unauthorized requests.

Getting Started
---------------

Follow these steps to set up the development environment and get the bot running locally.

### Prerequisites

Ensure you have the following installed:

-   **Node.js** (v16.x or higher recommended)
-   **npm** (comes with Node.js)
-   **Git** (for version control)
-   **Cloudflare Account** (for deployment)
-   **Wrangler** (Cloudflare's CLI tool)

### Setup Instructions

1.  **Clone the Repository**

    Clone the repository to your local machine using Git:

    bash

    Copy code

    `git clone git@github.com:mehotkhan/Nekonymous.git
    cd Nekonymous`

2.  **Install Dependencies**

    Install the required Node.js packages:

    Copy code

    `npm install`

3.  **Configure Environment Variables**

    Set up your environment variables. You can use `.env` files for local development:

    bash

    Copy code

    `cp .env.example .env`

    Edit the `.env` file to include your Cloudflare API token, Telegram API token, and other necessary configurations.

4.  **Run the Bot Locally**

    Use Wrangler to run the bot locally:

    arduino

    Copy code

    `npm run dev`

    This will start the bot on a local Cloudflare Worker instance.

5.  **Lint and Format Your Code**

    To ensure your code meets the project's style guidelines, run the linter and formatter:

    arduino

    Copy code

    `npm run lint:fix`

6.  **Deploying to Cloudflare**

    When you're ready to deploy your bot to Cloudflare Workers, use:

    arduino

    Copy code

    `npm run deploy`

    Ensure your Cloudflare account and API token are correctly configured in your Wrangler settings.

7.  **Clean KV Store**

    If you need to clear the KV store during development, use:

    arduino

    Copy code

    `npm run clean:kv`
 
