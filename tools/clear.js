const { exec } = require("child_process");
const fs = require("fs");

const NAMESPACE_ID = "de26a1b398614383a2b9702fafaa8824"; // replace with your namespace ID
// const CONVERSATION_PREFIX = "conversation:"; // Prefix for conversation keys

// Step 1: List all keys
exec(
  `wrangler kv:key list --namespace-id ${NAMESPACE_ID}`,
  (error, stdout) => {
    if (error) {
      console.error(`Error listing keys: ${error}`);
      return;
    }

    // Step 2: Filter keys that start with the conversation prefix
    const keys = JSON.parse(stdout)
      .map((keyObj) => keyObj.name);

    if (keys.length === 0) {
      console.log("No conversation keys found to delete.");
      return;
    }

    // Step 3: Write filtered keys to a JSON file
    fs.writeFileSync("keys.json", JSON.stringify(keys), "utf8");

    // Step 4: Delete filtered keys in bulk
    exec(
      `wrangler kv:bulk delete --namespace-id ${NAMESPACE_ID} keys.json`,
      (deleteError, deleteStdout) => {
        if (deleteError) {
          console.error(`Error deleting keys: ${deleteError}`);
          return;
        }

        console.log(`Deleted conversation keys: ${deleteStdout}`);
        fs.unlinkSync("keys.json"); // Clean up the file
      }
    );
  }
);
