const { exec } = require("child_process");
const fs = require("fs");

const NAMESPACE_ID = "414fb07aae8b4b5d9fac86a0cad1720e"; // replace with your namespace ID

// Step 1: List all keys
exec(
  `wrangler kv key list --namespace-id ${NAMESPACE_ID}`,
  (error, stdout) => {
    if (error) {
      console.error(`Error listing keys: ${error}`);
      return;
    }

    const keys = JSON.parse(stdout).map((keyObj) => keyObj.name);

    // Step 2: Write keys to a JSON file
    fs.writeFileSync("keys.json", JSON.stringify(keys), "utf8");

    // Step 3: Delete keys in bulk
    exec(
      `wrangler kv:bulk delete --namespace-id ${NAMESPACE_ID} keys.json`,
      (deleteError, deleteStdout) => {
        if (deleteError) {
          console.error(`Error deleting keys: ${deleteError}`);
          return;
        }

        console.log(`Deleted keys: ${deleteStdout}`);
        fs.unlinkSync("keys.json"); // Clean up the file
      }
    );
  }
);
