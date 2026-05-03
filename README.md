# 🌌 Nexus | Enterprise DSA & Interview Ecosystem

![Nexus Banner](https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1200&h=400)

**Nexus** is a production-ready, high-performance platform designed for software engineers to track their DSA journey, share interview experiences, and collaborate on technical notes. Built with a sleek Bento-style UI and powered by Appwrite.

---

## ✨ Key Features

- 🎯 **Advanced DSA Tracker**: Batch import problems from Excel, track progress, and see real-time analytics.
- ⚡ **Problem of the Day**: Integrated LeetCode Daily Challenge fetcher to keep you consistent.
- 📝 **Notes Vault**: Securely share and manage technical PDFs and links with the community.
- 🤝 **Interview Experiences**: A dedicated feed for sharing and learning from real-world interview loops.
- 🛡️ **Admin Command Center**: Complete oversight of user engagement, metrics, and content.
- 🔐 **Self-Healing Auth**: Robust authentication with automatic profile synchronization and recovery.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons
- **Styling**: Vanilla CSS (Custom Design System), Bento Grids, Glassmorphism
- **Backend**: Appwrite (Database, Auth, Storage)
- **Deployment**: Vercel / Netlify

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- An Appwrite Cloud account

### 2. Installation
```bash
git clone https://github.com/yourusername/nexus.git
cd nexus
npm install
```

### 3. Environment Setup
Create a `.env` file in the root:
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_secret_api_key
```

### 4. Provisioning
Initialize your database schema and permissions:
```bash
node setup-appwrite.js
node admin-setup.js
node sync-users.js
```

---

## 🌐 Production Deployment (Recommended: Vercel)

For the best security and performance, we recommend **Vercel**.

### Step 1: Push to GitHub
Initialize your repo and push your code.

### Step 2: Connect to Vercel
1. Import your repository in the [Vercel Dashboard](https://vercel.com).
2. **Environment Variables**: Add all `VITE_APPWRITE_*` variables from your `.env` to the Vercel Project Settings.
3. Click **Deploy**.

### Step 3: Secure Your Appwrite
1. Go to your **Appwrite Console**.
2. Navigate to **Settings -> Platforms**.
3. Add your production URL (e.g., `nexus-app.vercel.app`) to the **Web Platforms** list. This prevents unauthorized CORS errors.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Built with ❤️</p>
