import Dexie from 'dexie';

export const db = new Dexie('CodeVaultDatabase');

db.version(1).stores({
  problems: '++id, link, title, difficulty, topic, status', // unique identifier can be link or title+link. Using auto-increment id, and querying by link.
  notes: '++id, title, category, fileType, uploadedAt',
});

// Helper for problems
export const getUniqueProblemKey = (problem) => {
  if (problem.link) return problem.link;
  return problem.title;
};
