NOVA AI - MODIFIABLE TERMUX CHAT WEBSITE
========================================

INSTALL IN TERMUX
1) Install Termux from a trusted source.
2) Run:
   pkg update
   pkg install python unzip
3) Extract this zip, then enter the project folder:
   unzip my_chatgpt_v2.zip
   cd my_chatgpt_v2
4) Install dependencies:
   pip install -r requirements.txt
5) Start the website:
   python app.py
6) Open Chrome on the same phone:
   http://127.0.0.1:5000

ENABLE REAL AI
1) Copy .env.example to .env:
   cp .env.example .env
2) Edit it:
   nano .env
3) Put your own API key after OPENAI_API_KEY= and save (Ctrl+O, Enter, Ctrl+X).
4) Restart the server:
   python app.py

API usage may cost money and is separate from a ChatGPT subscription.
Never share your API key, screenshot of it, or your .env file.
If you do not have a key, the website still opens but AI answers will explain setup.

WHAT TO MODIFY
- config.py: website name and bot name
- ai.py: AI provider, model and response logic
- templates/index.html: page structure
- static/style.css: colors and design
- static/script.js: chat, local history, voice input, theme

FEATURES
- Responsive mobile UI
- Dark/light theme
- New chat
- Local chat history stored in this browser
- Voice-to-text input where supported
- OpenAI API connection (requires your own API key)
- No API key is included in this download

NOTE
This is a learning project, not the official ChatGPT website.
Run it on your own phone. It listens only on 127.0.0.1 by default.
