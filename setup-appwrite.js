import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || projectId === 'YOUR_PROJECT_ID') {
  console.error("❌ Error: VITE_APPWRITE_PROJECT_ID is missing or not set in .env");
  process.exit(1);
}

if (!apiKey || apiKey === 'YOUR_API_KEY') {
  console.error("❌ Error: APPWRITE_API_KEY is missing or not set in .env");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createAttributeWithRetry(dbId, colId, type, key, size, required, defaultValue, array) {
    try {
        if (type === 'string') await databases.createStringAttribute(dbId, colId, key, size, required, defaultValue, array);
        else if (type === 'url') await databases.createUrlAttribute(dbId, colId, key, required, defaultValue, array);
        else if (type === 'datetime') await databases.createDatetimeAttribute(dbId, colId, key, required, defaultValue, array);
        else if (type === 'boolean') await databases.createBooleanAttribute(dbId, colId, key, required, defaultValue, array);
        console.log(`   ✅ Attribute '${key}' created.`);
        await sleep(1500); // Give Appwrite a moment
    } catch (e) {
        console.warn(`   ⚠️ Warning creating attribute '${key}': ${e.message}`);
    }
}

async function runSetup() {
  console.log("🚀 Starting CodeVault Multi-User Provisioning...");
  let dbId = process.env.VITE_APPWRITE_DATABASE_ID;

  try {
    // 1. Database Setup
    if (!dbId || dbId === 'YOUR_DATABASE_ID' || dbId === '') {
        console.log("👉 Creating Database 'VaultDB'...");
        const db = await databases.create(ID.unique(), 'VaultDB');
        dbId = db.$id;
    }
    console.log(`✅ Using Database ID: ${dbId}`);

    // 2. Collection: problems
    console.log("👉 Setting up 'problems' collection...");
    const probColId = ID.unique();
    await databases.createCollection(dbId, probColId, 'problems', [Permission.read(Role.any()), Permission.write(Role.users())]);
    await createAttributeWithRetry(dbId, probColId, 'string', 'title', 255, true);
    await createAttributeWithRetry(dbId, probColId, 'string', 'link', 500, false);
    await createAttributeWithRetry(dbId, probColId, 'string', 'difficulty', 50, true);
    await createAttributeWithRetry(dbId, probColId, 'string', 'topic', 100, true);
    await createAttributeWithRetry(dbId, probColId, 'string', 'authorId', 100, true);
    await createAttributeWithRetry(dbId, probColId, 'string', 'authorName', 255, true);
    await createAttributeWithRetry(dbId, probColId, 'string', 'sources', 100, false, undefined, true);

    // 3. Collection: user_progress
    console.log("👉 Setting up 'user_progress' collection...");
    const progColId = ID.unique();
    await databases.createCollection(dbId, progColId, 'user_progress', [Permission.read(Role.users()), Permission.write(Role.users())]);
    await createAttributeWithRetry(dbId, progColId, 'string', 'userId', 100, true);
    await createAttributeWithRetry(dbId, progColId, 'string', 'problemId', 100, true);
    await createAttributeWithRetry(dbId, progColId, 'string', 'status', 50, true);

    // 4. Collection: notes
    console.log("👉 Setting up 'notes' collection...");
    const notesColId = ID.unique();
    await databases.createCollection(dbId, notesColId, 'notes', [Permission.read(Role.any()), Permission.write(Role.users())]);
    await createAttributeWithRetry(dbId, notesColId, 'string', 'title', 255, true);
    await createAttributeWithRetry(dbId, notesColId, 'string', 'category', 100, true);
    await createAttributeWithRetry(dbId, notesColId, 'string', 'type', 20, true); // 'file' or 'link'
    await createAttributeWithRetry(dbId, notesColId, 'string', 'authorId', 100, true);
    await createAttributeWithRetry(dbId, notesColId, 'string', 'authorName', 255, true);
    await createAttributeWithRetry(dbId, notesColId, 'string', 'fileId', 255, false);
    await createAttributeWithRetry(dbId, notesColId, 'string', 'url', 1000, false);
    await createAttributeWithRetry(dbId, notesColId, 'datetime', 'uploadedAt', null, true);

    // 5. Collection: experiences
    console.log("👉 Setting up 'experiences' collection...");
    const expColId = ID.unique();
    await databases.createCollection(dbId, expColId, 'experiences', [Permission.read(Role.any()), Permission.write(Role.users())]);
    await createAttributeWithRetry(dbId, expColId, 'string', 'company', 100, true);
    await createAttributeWithRetry(dbId, expColId, 'string', 'role', 100, true);
    await createAttributeWithRetry(dbId, expColId, 'string', 'content', 10000, true);
    await createAttributeWithRetry(dbId, expColId, 'string', 'authorId', 100, true);
    await createAttributeWithRetry(dbId, expColId, 'string', 'authorName', 255, true);
    await createAttributeWithRetry(dbId, expColId, 'datetime', 'createdAt', null, true);
    
    try {
        await databases.createIntegerAttribute(dbId, expColId, 'likes', false, 0, false);
        console.log("   ✅ Attribute 'likes' created.");
        await sleep(1000);
    } catch (e) { console.warn("   ⚠️ Likes attribute warning:", e.message); }

    // 5b. Collection: profiles (For Admin Panel)
    console.log("👉 Setting up 'profiles' collection...");
    const profileColId = ID.unique();
    await databases.createCollection(dbId, profileColId, 'profiles', [Permission.read(Role.any()), Permission.write(Role.users())]);
    await createAttributeWithRetry(dbId, profileColId, 'string', 'userId', 100, true);
    await createAttributeWithRetry(dbId, profileColId, 'string', 'name', 255, true);
    await createAttributeWithRetry(dbId, profileColId, 'string', 'username', 100, true);
    await createAttributeWithRetry(dbId, profileColId, 'string', 'role', 20, true, 'user');

    // 5c. Collection: youtube_links
    console.log("👉 Setting up 'youtube_links' collection...");
    const ytColId = ID.unique();
    await databases.createCollection(dbId, ytColId, 'youtube_links', [Permission.read(Role.any()), Permission.write(Role.users())]);
    await createAttributeWithRetry(dbId, ytColId, 'string', 'title', 255, true);
    await createAttributeWithRetry(dbId, ytColId, 'string', 'url', 1000, true);
    await createAttributeWithRetry(dbId, ytColId, 'string', 'authorId', 100, true);
    await createAttributeWithRetry(dbId, ytColId, 'string', 'authorName', 255, true);
    await createAttributeWithRetry(dbId, ytColId, 'datetime', 'createdAt', null, true);

    // 6. Storage Bucket
    console.log("👉 Setting up 'NotesFiles' bucket...");
    let bucketId = process.env.VITE_APPWRITE_BUCKET_ID;
    
    if (!bucketId || bucketId.startsWith('YOUR_') || bucketId === '') {
      try {
        const bucket = await storage.createBucket(ID.unique(), 'NotesFiles', [Permission.read(Role.any()), Permission.write(Role.users())]);
        bucketId = bucket.$id;
        console.log(`   ✅ New Bucket created: ${bucketId}`);
      } catch (e) {
        console.warn(`   ⚠️ Bucket creation failed: ${e.message}`);
        console.warn(`   👉 Using a placeholder bucket ID. Please fix manually in .env if needed.`);
        bucketId = bucketId || 'manual_bucket_id';
      }
    } else {
      console.log(`   ✅ Reusing existing Bucket ID: ${bucketId}`);
    }

    // 7. Update .env
    console.log("👉 Updating .env file...");
    const envPath = path.join(__dirname, '.env');
    let envData = fs.readFileSync(envPath, 'utf8');

    const updates = {
        VITE_APPWRITE_DATABASE_ID: dbId,
        VITE_APPWRITE_PROBLEMS_COLLECTION_ID: probColId,
        VITE_APPWRITE_PROGRESS_COLLECTION_ID: progColId,
        VITE_APPWRITE_NOTES_COLLECTION_ID: notesColId,
        VITE_APPWRITE_EXPERIENCES_COLLECTION_ID: expColId,
        VITE_APPWRITE_PROFILES_COLLECTION_ID: profileColId,
        VITE_APPWRITE_YOUTUBE_COLLECTION_ID: ytColId,
        VITE_APPWRITE_BUCKET_ID: bucketId
    };

    Object.entries(updates).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (envData.match(regex)) {
            envData = envData.replace(regex, `${key}=${value}`);
        } else {
            envData += `\n${key}=${value}`;
        }
    });

    fs.writeFileSync(envPath, envData);
    console.log("✅ .env file successfully updated!");
    console.log("\n🎉 Setup Complete! Multi-user CodeVault is ready.");

  } catch (error) {
    console.error("\n❌ Setup Failed:", error.message);
  }
}

runSetup();
