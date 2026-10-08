const form = document.getElementById("chatForm");
const input = document.getElementById("message");
const chat = document.getElementById("chat");
const sendBtn = document.getElementById("send");
const historyList = document.getElementById("historyList");
const HISTORY_KEY = "nova_ai_chats_v1";

let conversations = loadConversations();
let activeId = null;
let messages = [];
let toastTimer;

function loadConversations() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveConversations() {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(conversations.slice(0, 30))
  );
  renderHistory();
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function showToast(text) {
  const el = document.getElementById("toast");
  el.textContent = text;
  el.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2400);
}

function renderHistory() {
  historyList.innerHTML = "";

  conversations.forEach(c => {
    const b = document.createElement("button");
    b.className = "history-item";
    b.textContent = c.title || "New chat";
    b.onclick = () => openConversation(c.id);
    historyList.appendChild(b);
  });
}

function saveActiveConversation() {
  if (!messages.length) return;

  if (!activeId) activeId = makeId();

  let item = conversations.find(c => c.id === activeId);
  const firstUser = messages.find(m => m.role === "user");

  const title = firstUser
    ? firstUser.content.slice(0, 38)
    : "New chat";

  if (!item) {
    item = {
      id: activeId,
      title,
      messages: []
    };

    conversations.unshift(item);
  }

  item.title = title;
  item.messages = messages;

  conversations = [
    item,
    ...conversations.filter(c => c.id !== activeId)
  ];

  saveConversations();
}

function renderMessages() {
  chat.innerHTML = "";

  if (!messages.length) {
    chat.innerHTML = `
      <div class="welcome" id="welcome">
        <div class="welcome-logo">✦</div>
        <h1>What can I help with?</h1>
        <p>Ask a question, learn something, or build an idea.</p>

        <div class="suggestions">
          <button onclick="useSuggestion('Teach me Python step by step')">
            <span>⌘</span> Learn Python
          </button>

          <button onclick="useSuggestion('Help me brainstorm a small business idea')">
            <span>↗</span> Brainstorm ideas
          </button>

          <button onclick="useSuggestion('Explain a difficult topic in simple words')">
            <span>✧</span> Explain a topic
          </button>

          <button onclick="useSuggestion('Help me make a study plan')">
            <span>▤</span> Make a study plan
          </button>
        </div>
      </div>
    `;

    return;
  }

  messages.forEach(m => addMessage(m.content, m.role, false));
  chat.scrollTop = chat.scrollHeight;
}

function addMessage(text, role, scroll = true) {
  const row = document.createElement("div");

  row.className =
    "message-row " + (role === "user" ? "user" : "assistant");

  if (role !== "user") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "✦";
    row.appendChild(avatar);
  }

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = text;

  row.appendChild(content);
  chat.appendChild(row);

  if (scroll) {
    chat.scrollTop = chat.scrollHeight;
  }

  return content;
}

async function sendMessage(text) {
  text = text.trim();

  if (!text || sendBtn.disabled) return;

  if (!messages.length) {
    chat.innerHTML = "";
  }

  messages.push({
    role: "user",
    content: text
  });

  addMessage(text, "user");

  input.value = "";
  input.style.height = "auto";

  sendBtn.disabled = true;

  const thinking = addMessage("", "assistant");

  let fullReply = "";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages.slice(-20)
      })
    });

    if (!response.ok) {
      throw new Error("AI request failed.");
    }

    if (!response.body) {
      throw new Error("Streaming is not supported by this browser.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true
      });

      const events = buffer.split("\n\n");
      buffer = events.pop();

      for (const event of events) {
        const line = event
          .split("\n")
          .find(line => line.startsWith("data: "));

        if (!line) continue;

        const chunk = line.slice(6);

        if (!chunk) continue;

        fullReply += chunk;
        thinking.textContent = fullReply;

        chat.scrollTop = chat.scrollHeight;
      }
    }

    if (!fullReply.trim()) {
      thinking.textContent = "No response received.";
      fullReply = thinking.textContent;
    }

    messages.push({
      role: "assistant",
      content: fullReply
    });

    saveActiveConversation();

  } catch (err) {
    thinking.textContent =
      err.message ||
      "Could not connect. Is the Python server running?";

    showToast("Message wasn't answered. Check connection/settings.");

  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", e => {
  e.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height =
    Math.min(input.scrollHeight, 160) + "px";
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

function useSuggestion(text) {
  input.value = text;
  input.focus();
  form.requestSubmit();
}

function newChat() {
  activeId = null;
  messages = [];
  renderMessages();

  document
    .getElementById("sidebar")
    .classList.remove("open");

  input.focus();
}

function openConversation(id) {
  const item = conversations.find(c => c.id === id);

  if (!item) return;

  activeId = item.id;
  messages = [...item.messages];

  renderMessages();

  document
    .getElementById("sidebar")
    .classList.remove("open");
}

function toggleSidebar() {
  document
    .getElementById("sidebar")
    .classList.toggle("open");
}

function toggleTheme() {
  document.body.classList.toggle("light");

  localStorage.setItem(
    "nova_ai_theme",
    document.body.classList.contains("light")
      ? "light"
      : "dark"
  );
}

function startVoice() {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast(
      "Voice input isn't supported in this browser. Try Chrome."
    );
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.interimResults = false;

  document.getElementById("voiceStatus").textContent =
    "Listening…";

  recognition.onresult = event => {
    input.value =
      (
        input.value +
        " " +
        event.results[0][0].transcript
      ).trim();

    input.dispatchEvent(new Event("input"));
    input.focus();
  };

  recognition.onerror = () => {
    showToast("Couldn't hear you. Try again.");
  };

  recognition.onend = () => {
    document.getElementById("voiceStatus").textContent = "";
  };

  recognition.start();
}

if (
  localStorage.getItem("nova_ai_theme") === "light"
) {
  document.body.classList.add("light");
}

renderHistory();

