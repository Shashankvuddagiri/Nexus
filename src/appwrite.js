import { Client, Databases, Storage, Account, ID, Query } from 'appwrite';

export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  problemsCollectionId: import.meta.env.VITE_APPWRITE_PROBLEMS_COLLECTION_ID,
  progressCollectionId: import.meta.env.VITE_APPWRITE_PROGRESS_COLLECTION_ID,
  notesCollectionId: import.meta.env.VITE_APPWRITE_NOTES_COLLECTION_ID,
  experiencesCollectionId: import.meta.env.VITE_APPWRITE_EXPERIENCES_COLLECTION_ID,
  profilesCollectionId: import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
  youtubeCollectionId: import.meta.env.VITE_APPWRITE_YOUTUBE_COLLECTION_ID,
  bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID,
};

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const appwriteApi = {
  // --- Auth ---
  login: async (username, password) => {
    const email = `${username.toLowerCase()}@nexus.com`;
    const session = await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    
    // Auto-fix missing profile
    try {
      const profiles = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.profilesCollectionId,
        [Query.equal('userId', user.$id)]
      );
      if (profiles.total === 0) {
        const role = username.toLowerCase().startsWith('admin') ? 'admin' : 'user';
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.profilesCollectionId,
          ID.unique(),
          { userId: user.$id, name: user.name, username: username.toLowerCase(), role }
        );
      }
    } catch (e) { console.warn("Profile repair skipped."); }
    
    return session;
  },

  ensureProfile: async (user) => {
    try {
      const profiles = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.profilesCollectionId,
        [Query.equal('userId', user.$id)]
      );
      if (profiles.total === 0) {
        const username = user.email.split('@')[0];
        const role = username.toLowerCase().startsWith('admin') ? 'admin' : 'user';
        
        const data = { userId: user.$id, name: user.name, username };
        // Try to add role, but don't crash if the attribute is missing in DB
        try {
            data.role = role;
            return await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.profilesCollectionId,
                ID.unique(),
                data
            );
        } catch (roleErr) {
            console.warn("Retrying without 'role' attribute...");
            delete data.role;
            return await databases.createDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.profilesCollectionId,
                ID.unique(),
                data
            );
        }
      }
    } catch (e) {
      throw new Error("Failed to ensure profile: " + e.message);
    }
  },

  signup: async (username, password, name) => {
    const email = `${username.toLowerCase()}@nexus.com`;
    const user = await account.create(ID.unique(), email, password, name || username);
    const session = await account.createEmailPasswordSession(email, password);
    
    const role = username.toLowerCase().startsWith('admin') ? 'admin' : 'user';
    try {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.profilesCollectionId,
        ID.unique(),
        {
          userId: user.$id,
          name: name || username,
          username: username.toLowerCase(),
          role: role
        }
      );
    } catch (e) {
      console.error("Profile creation failed, but account is created:", e.message);
      // Fallback: Try creating without role if it's the role attribute causing issues
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.profilesCollectionId,
          ID.unique(),
          {
            userId: user.$id,
            name: name || username,
            username: username.toLowerCase()
          }
        );
      } catch (e2) {
        console.error("Critical: Profile fallback also failed.");
      }
    }
    return session;
  },
  logout: async () => {
    try {
      return await account.deleteSession('current');
    } catch (e) {
      console.warn("No active session to logout.");
      return null;
    }
  },
  getCurrentUser: async () => {
    try {
      return await account.get();
    } catch (e) {
      return null;
    }
  },

  // --- DSA Tracker ---
  getProblems: async () => {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.problemsCollectionId,
      [Query.limit(1000)]
    );
    return response.documents;
  },
  
  createProblem: async (problem, user) => {
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.problemsCollectionId,
      ID.unique(),
      { ...problem, authorId: user.$id, authorName: user.name }
    );
  },

  deleteProblem: async (problemId) => {
    return await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.problemsCollectionId,
      problemId
    );
  },

  deleteProblemBatch: async (sourceName) => {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.problemsCollectionId,
      [Query.limit(1000)]
    );
    const toDelete = response.documents.filter(p => p.sources.includes(sourceName));
    for (const doc of toDelete) {
      await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.problemsCollectionId, doc.$id);
    }
  },

  // --- Personal Progress ---
  getUserProgress: async (userId) => {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.progressCollectionId,
      [Query.equal('userId', userId)]
    );
    return response.documents;
  },

  updateProgress: async (userId, problemId, status) => {
    // Check if progress already exists
    const existing = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.progressCollectionId,
      [Query.equal('userId', userId), Query.equal('problemId', problemId)]
    );

    if (existing.documents.length > 0) {
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.progressCollectionId,
        existing.documents[0].$id,
        { status }
      );
    } else {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.progressCollectionId,
        ID.unique(),
        { userId, problemId, status }
      );
    }
  },

  // --- Notes Vault ---
  getNotes: async () => {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.notesCollectionId,
      [Query.limit(100)]
    );
    return response.documents;
  },

  uploadNote: async (file, title, category, user) => {
    const uploadResult = await storage.createFile(APPWRITE_CONFIG.bucketId, ID.unique(), file);
    const fileUrl = storage.getFileView(APPWRITE_CONFIG.bucketId, uploadResult.$id).toString();
    
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.notesCollectionId,
      ID.unique(),
      {
        title,
        category,
        type: 'file',
        fileId: uploadResult.$id,
        url: fileUrl,
        authorId: user.$id,
        authorName: user.name,
        uploadedAt: new Date().toISOString()
      }
    );
  },

  addNoteLink: async (title, category, url, user) => {
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.notesCollectionId,
      ID.unique(),
      {
        title,
        category,
        type: 'link',
        url,
        authorId: user.$id,
        authorName: user.name,
        uploadedAt: new Date().toISOString()
      }
    );
  },

  deleteNote: async (noteId, fileId) => {
    if (fileId) {
      await storage.deleteFile(APPWRITE_CONFIG.bucketId, fileId);
    }
    return await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.notesCollectionId,
      noteId
    );
  },

  // --- Interview Experiences ---
  getExperiences: async () => {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.experiencesCollectionId,
      [Query.orderDesc('createdAt'), Query.limit(100)]
    );
    return response.documents;
  },

  likeExperience: async (id, currentLikes) => {
    return await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.experiencesCollectionId,
      id,
      { likes: (currentLikes || 0) + 1 }
    );
  },

  deleteExperience: async (id) => {
    return await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.experiencesCollectionId,
      id
    );
  },

  createExperience: async (company, role, content, user) => {
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.experiencesCollectionId,
      ID.unique(),
      {
        company,
        role,
        content,
        authorId: user.$id,
        authorName: user.name,
        createdAt: new Date().toISOString()
      }
    );
  },

  // --- Admin Logic ---
  getProfiles: async () => {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.profilesCollectionId,
      [Query.limit(5000)]
    );
    return response.documents;
  },

  getAllProgress: async () => {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.progressCollectionId,
      [Query.limit(5000)]
    );
    return response.documents;
  },

  // --- YouTube Vault ---
  getYouTubeLinks: async () => {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.youtubeCollectionId,
      [Query.orderDesc('createdAt')]
    );
    return response.documents;
  },

  addYouTubeLink: async (title, url, user) => {
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.youtubeCollectionId,
      ID.unique(),
      {
        title,
        url,
        authorId: user.$id,
        authorName: user.name,
        createdAt: new Date().toISOString()
      }
    );
  },

  // --- External APIs ---
  getDailyProblem: async () => {
    try {
      const response = await fetch('https://alfa-leetcode-api.onrender.com/daily');
      const data = await response.json();
      return {
        title: data.questionTitle,
        link: data.questionLink, // It's already the full URL in this API
        difficulty: data.difficulty,
        topic: data.topicTags?.map(t => t.name).join(', ') || 'General'
      };
    } catch (e) {
      console.error("LeetCode Daily fetch failed", e);
      return null;
    }
  },

  deleteYouTubeLink: async (id) => {
    return await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.youtubeCollectionId,
      id
    );
  }
};
