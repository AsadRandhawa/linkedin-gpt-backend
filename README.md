# LinkedIn GPT Comment Suggester

An AI-powered Chrome extension that automatically generates 3 professional comment suggestions for LinkedIn posts using GPT-4.

## 🚀 Features

- **Smart Comment Generation**: Analyzes LinkedIn post content and generates 3 unique, professional comment suggestions
- **Interactive Selection**: Choose from 3 AI-generated suggestions via a beautiful modal interface
- **Seamless Integration**: Adds an "✨ AI Reply" button directly to LinkedIn comment boxes
- **Intelligent Post Detection**: Automatically reads post content from various LinkedIn layouts
- **Fallback Support**: Manual post text input if auto-detection fails

## 📁 Project Structure

```
linkedin-gpt-backend/
├── server.js                    # Express backend server
├── package.json                 # Node.js dependencies
├── .env.example                 # Environment variables template
└── linkedin-gpt-extension/      # Chrome extension files
    ├── manifest.json            # Extension configuration
    ├── background.js            # Service worker for API calls
    └── content.js               # LinkedIn page integration
```

## 🛠️ Setup Instructions

### Backend Setup (Railway)

1. **Deploy to Railway** (Already done ✅)
   - Your backend is deployed at: `https://linkedin-gpt-backend-production.up.railway.app`
   - OpenAI API key is configured in Railway environment variables

2. **Verify Backend is Running**
   ```bash
   curl https://linkedin-gpt-backend-production.up.railway.app/
   ```
   Expected response: `✅ Backend is successfully connected to the internet!`

3. **Test Comment Generation**
   ```bash
   curl -X POST https://linkedin-gpt-backend-production.up.railway.app/generate-comments \
     -H "Content-Type: application/json" \
     -d "{\"postContent\": \"Just launched my new product! Excited to share this with the community.\"}"
   ```

### Local Development (Optional)

1. **Clone and Install**
   ```bash
   cd C:\Users\U.C\.antigravity\linkedin-gpt-backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy the example file
   copy .env.example .env
   
   # Edit .env and add your OpenAI API key
   # OPENAI_API_KEY=sk-...
   ```

3. **Run Locally**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:8080`

### Chrome Extension Setup

1. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

2. **Load Extension**
   - Click "Load unpacked"
   - Select folder: `C:\Users\U.C\.antigravity\linkedin-gpt-backend\linkedin-gpt-extension`

3. **Verify Installation**
   - Extension should appear in your extensions list
   - Icon: "LinkedIn GPT Suggester"

## 📖 How to Use

1. **Navigate to LinkedIn**
   - Go to [linkedin.com](https://www.linkedin.com)
   - Browse your feed or any post

2. **Click on a Comment Box**
   - Click "Add a comment" on any post
   - You'll see an "✨ AI Reply" button appear

3. **Generate Suggestions**
   - Click the "✨ AI Reply" button
   - Wait 2-3 seconds for AI processing
   - A modal will appear with 3 comment suggestions

4. **Select Your Comment**
   - Click on any of the 3 suggestions
   - The comment will be automatically inserted into the comment box
   - Edit if needed, then post!

## 🔧 API Endpoints

### Health Check
```
GET /
Response: "✅ Backend is successfully connected to the internet!"
```

### Generate Comments
```
POST /generate-comments
Content-Type: application/json

Request Body:
{
  "postContent": "The LinkedIn post text here..."
}

Response:
{
  "suggestions": [
    "First comment suggestion...",
    "Second comment suggestion...",
    "Third comment suggestion..."
  ]
}
```

## 🐛 Troubleshooting

### Extension Not Working

1. **Check Backend Status**
   - Visit: https://linkedin-gpt-backend-production.up.railway.app/
   - Should show: "✅ Backend is successfully connected to the internet!"

2. **Check Console Logs**
   - Right-click on LinkedIn page → Inspect → Console
   - Look for errors starting with "LinkedIn GPT Extension"

3. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click the refresh icon on "LinkedIn GPT Suggester"
   - Refresh LinkedIn page

### Button Not Appearing

1. **Refresh LinkedIn Page**
   - Press `Ctrl+R` or `F5`

2. **Check Extension is Enabled**
   - Go to `chrome://extensions/`
   - Ensure "LinkedIn GPT Suggester" is enabled

### Empty Suggestions

1. **Check Railway Logs**
   - Login to Railway dashboard
   - Check server logs for errors

2. **Verify OpenAI API Key**
   - Check Railway environment variables
   - Ensure `OPENAI_API_KEY` is set correctly

### "Connection Error" Message

1. **Check Internet Connection**
2. **Verify Railway URL**
   - Ensure backend is deployed and running
3. **Check CORS Settings**
   - Backend should have `cors({ origin: '*' })`

## 🔐 Security Notes

- OpenAI API key is stored securely in Railway environment variables
- Never commit `.env` file to Git (already in `.gitignore`)
- Extension only runs on `linkedin.com` domain
- API calls are made through Chrome's background service worker

## 📝 Version History

- **v1.0** - Initial release
  - 3 AI-generated comment suggestions
  - Modal selection interface
  - Auto post content detection
  - Railway deployment

## 🤝 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Railway logs for backend errors
3. Check Chrome console for extension errors

## 📄 License

ISC
