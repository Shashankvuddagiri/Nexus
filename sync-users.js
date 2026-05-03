import { Client, Databases, Users, ID } from 'node-appwrite';
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
const users = new Users(client);

async function importExistingUsers() {
  console.log("🚀 Syncing existing users to Nexus Profiles...");
  
  try {
    const userList = await users.list();
    console.log(`Found ${userList.total} users in Auth.`);

    for (const user of userList.users) {
      const username = user.email.split('@')[0];
      console.log(`Checking profile for: ${username} (${user.$id})`);

      // Check if profile exists
      const existing = await databases.listDocuments(dbId, profileColId, [
        // Query.equal('userId', user.$id) // This might fail if indexes aren't ready
      ]);
      
      const profileExists = existing.documents.some(d => d.userId === user.$id);

      if (!profileExists) {
        console.log(`   ➕ Creating missing profile for ${username}...`);
        const role = username.toLowerCase().startsWith('admin') ? 'admin' : 'user';
        
        const data = {
          userId: user.$id,
          name: user.name || username,
          username: username
        };

        try {
            await databases.createDocument(dbId, profileColId, ID.unique(), { ...data, role });
            console.log(`   ✅ Success (with role)!`);
        } catch (err) {
            console.log(`   ⚠️ Database missing 'role' column, retrying without it...`);
            await databases.createDocument(dbId, profileColId, ID.unique(), data);
            console.log(`   ✅ Success (without role)!`);
        }
      } else {
        console.log(`   ℹ️ Profile already exists.`);
      }
    }

    console.log("\n✨ All users have been synced to the Admin Panel.");

  } catch (error) {
    console.error("❌ Sync failed:", error.message);
    if (error.message.includes("missing scopes")) {
        console.log("\n⚠️ PERMISSION ERROR: Your API Key needs 'users.read' scope.");
        console.log("👉 Alternative: Just ask your users to log in once, and they will show up automatically!");
    }
  }
}

importExistingUsers();
