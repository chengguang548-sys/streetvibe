<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8d63afe8-18c8-4fae-8f29-6d2d120ebb30

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## MongoDB Atlas Setup

1. Create a free MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas.
2. Create a database user with a strong password.
3. Add your IP address to the Atlas network access list, or use 0.0.0.0/0 for development.
4. Create a database named `streetvibe` or set a custom database name.
5. Copy the connection string and set it in `.env` or your deployment environment:
   - `MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"`
   - `MONGODB_DB_NAME="streetvibe"`
6. Set your backend port if needed:
   - `PORT=3000`
7. Set your frontend API base URL for deployment:
   - `VITE_API_URL="https://streetvibe.onrender.com"`

## Deployment Notes

The app now uses MongoDB Atlas for all persistent backend data and stores uploaded product images in MongoDB GridFS.
Ensure your deployment provider has the same `MONGODB_URI`, `MONGODB_DB_NAME`, and `VITE_API_URL` values configured.

### Recommended deployment environment variables
```
MONGODB_URI=your_atlas_connection_string
MONGODB_DB_NAME=streetvibe
PORT=3000
VITE_API_URL=https://streetvibe.onrender.com
GEMINI_API_KEY=your_gemini_api_key
APP_URL=your_app_url
```
