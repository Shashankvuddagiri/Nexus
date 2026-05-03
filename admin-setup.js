import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const dbId = process.env.VITE_APPWRITE_DATABASE_ID;
const profileColId = process.env.VITE_APPWRITE_PROFILES_COLLECTION_ID;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function fixSchema() {
  console.log("🚀 Fixing Nexus Profile Schema...");

  try {
    console.log("👉 Attempting to add 'role' attribute to 'profiles' collection...");
    try {
      await databases.createStringAttribute(dbId, profileColId, 'role', 20, false, 'user');
      console.log("   ✅ SUCCESS: 'role' attribute created!");
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log("   ℹ️ 'role' attribute already exists.");
      } else {
        console.error("   ❌ FAILED to create attribute:", e.message);
      }
    }

    // 2. Ensure Permissions are correct
    console.log("👉 Updating collection permissions for visibility...");
    try {
        await databases.updateCollection(dbId, profileColId, 'profiles', [
            Permission.read(Role.any()),
            Permission.write(Role.users())
        ]);
        console.log("   ✅ Permissions updated successfully.");
    } catch (e) {
        console.error("   ❌ Failed to update permissions:", e.message);
    }

    console.log("\n--------------------------------------------------");
    console.log("👉 NEXT STEP:");
    console.log("Now try to Sign Up again with username: admin");
    console.log("--------------------------------------------------");

  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
}

fixSchema();
