import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const dbId = process.env.VITE_APPWRITE_DATABASE_ID;

// IDs currently used by the app
const activeIds = {
    problems: process.env.VITE_APPWRITE_PROBLEMS_COLLECTION_ID,
    progress: process.env.VITE_APPWRITE_PROGRESS_COLLECTION_ID,
    notes: process.env.VITE_APPWRITE_NOTES_COLLECTION_ID,
    experiences: process.env.VITE_APPWRITE_EXPERIENCES_COLLECTION_ID,
    profiles: process.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
    youtube: process.env.VITE_APPWRITE_YOUTUBE_COLLECTION_ID
};

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function cleanupDuplicates() {
  console.log("🧹 Starting Nexus Database Cleanup...");
  
  try {
    const response = await databases.listCollections(dbId);
    const collections = response.collections;
    const activeIdValues = Object.values(activeIds);

    console.log(`Found ${collections.length} total collections.`);
    
    let deletedCount = 0;

    for (const col of collections) {
      if (!activeIdValues.includes(col.$id)) {
        console.log(`🗑️ Deleting duplicate/unused collection: ${col.name} (${col.$id})`);
        try {
            await databases.deleteCollection(dbId, col.$id);
            deletedCount++;
        } catch (e) {
            console.error(`   ❌ Failed to delete ${col.$id}:`, e.message);
        }
      } else {
        console.log(`✅ Keeping active collection: ${col.name} (${col.$id})`);
      }
    }

    console.log(`\n✨ Cleanup complete! Removed ${deletedCount} duplicate tables.`);
    console.log("🚀 Your database is now clean and optimized.");

  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
  }
}

cleanupDuplicates();
