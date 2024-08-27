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

## Bot's Security Overview.

### Overview

The bot employs a secure and efficient data encryption algorithm to ensure the confidentiality and integrity of conversations between users. The core of this encryption system is based on elliptic curve cryptography (ECC) using the `schnorr` signature scheme from the `@noble/curves/secp256k1` library. The bot leverages this cryptographic foundation to generate unique identifiers for conversations and securely encrypts and decrypts messages.

### Key Components

1. **Ticket ID Generation**:

   - The ticket ID, which serves as a private key, is generated using the `schnorr.utils.randomPrivateKey()` method. This method provides a secure, random 32-byte private key in the form of a `Uint8Array`.
   - The private key is then converted to a Base64-encoded string to be used within the bot's operations.

2. **Public Key Derivation**:

   - The public key, which acts as the conversation ID, is derived from the ticket ID (private key) using the `schnorr.getPublicKey()` method.
   - The derived public key is also Base64-encoded, making it easy to store and reference within the bot's system.

3. **AES Key Derivation**:

   - An AES key is derived from the private key to be used for symmetric encryption and decryption of the conversation payload.
   - The first 32 bytes of the private key are used to derive a raw key, which is then imported as a `CryptoKey` object with the `AES-GCM` algorithm, providing both confidentiality and integrity for the encrypted data.

4. **Message Encryption**:

   - Messages are encrypted using the `AES-GCM` mode, which is known for its security and efficiency.
   - The encryption process generates a random initialization vector (IV) for each encryption operation, ensuring that even identical messages produce different ciphertexts.
   - The resulting encrypted data is then concatenated with the IV and Base64-encoded, forming the final encrypted payload.

5. **Message Decryption**:
   - Decryption is performed by reversing the encryption process. The IV is extracted from the Base64-encoded payload, and the AES key is used to decrypt the message.
   - The decrypted data is then converted back into its original string format, allowing the bot to process the user's message securely.

### Security Considerations

- **Elliptic Curve Cryptography (ECC)**: The use of ECC with the secp256k1 curve provides a high level of security with relatively small key sizes, making it efficient for the bot's operations within a resource-constrained environment like Cloudflare Workers.
- **AES-GCM**: This mode of AES provides both encryption (confidentiality) and authentication (integrity), ensuring that any tampering with the encrypted messages can be detected during decryption.

- **Unique Initialization Vectors (IVs)**: Each message encryption uses a unique IV, which prevents attackers from gaining insights through patterns in the encrypted data.

- **Secure Key Management**: The private keys (ticket IDs) are never stored in plaintext; they are used temporarily during encryption and decryption operations and are immediately discarded afterward.

### Conclusion

The bot's encryption algorithm is designed with a strong emphasis on security and efficiency. By combining elliptic curve cryptography with AES-GCM, the bot ensures that all user communications remain confidential and tamper-proof. This robust encryption scheme, when combined with secure key management practices, provides a reliable foundation for protecting user data in an anonymous messaging environment.

## Getting Started

Welcome to the Nekonymous bot project! This guide will help you set up the development environment and get the bot running locally.

### Prerequisites

Before you start, ensure you have the following installed:

- **Node.js** (v16.x or higher recommended)
- **npm** (comes with Node.js)
- **Git** (for version control)
- **Cloudflare Account** (for deployment)
- **Wrangler** (Cloudflare's CLI tool)

### Setup Instructions

1. **Clone the Repository**

   Clone the repository to your local machine using Git:

   git clone git@github.com:mehotkhan/Nekonymous.git
   cd Nekonymous

2. **Install Dependencies**

   Install the required Node.js packages:

   npm install

3. **Configure Environment Variables**

   Set up your environment variables. These include sensitive data such as API tokens. You can use `.env` files for local development:

   cp .env.example .env

   Edit the `.env` file to include your Cloudflare API token, Telegram API token, and other necessary configurations.

4. **Run the Bot Locally**

   Use Wrangler to run the bot locally:

   npm run dev

   This will start the bot on a local Cloudflare Worker instance.

5. **Lint and Format Your Code**

   To ensure your code meets the project's style guidelines, you can run the linter and formatter:

   npm run lint:fix

6. **Deploying to Cloudflare**

   When you're ready to deploy your bot to Cloudflare Workers, use the following command:

   npm run deploy

   Ensure your Cloudflare account and API token are correctly configured in your Wrangler settings.

7. **Clean KV Store**

   If you need to clear the KV store during development, use the following command:

   npm run clean:kv
