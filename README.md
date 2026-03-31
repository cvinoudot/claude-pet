# 🐾 Claude Pet

A pixel art tamagotchi that lives in the corner of your screen while you work in **Claude Code**. The pet reacts to what Claude is doing — gets excited when writing code, nervous during bash commands, curious while reading files, and sleeps when you're away.

![Pet preview](https://raw.githubusercontent.com/cvinoudot/claude-pet/main/preview.png)

---

## ✨ Features

- **Pixel art sprites** — orange tabby cat, black & white cat, white rabbit, grey rabbit
- **Reacts to Claude Code activity** via hooks:
  - ✏️ `Write` / `Edit` → excited (`WOW! Let's go!`)
  - 💻 `Bash` → nervous (`Uh oh... bash?!`)
  - 👀 `Read` / `Grep` → curious (`Hmm... Interesting!`)
  - ✅ Claude finishes → happy (`Yay! OwO!`) + XP
  - 😴 10 min idle → falls asleep (`Zzz...`)
  - 👋 Long absence → `Missed you!`
- **Grows over time** — 3 stages (Baby → Teen → Adult with bow accessory)
- **XP system** — earns XP with every Claude response, levels up with animation
- **Always-on-top transparent overlay** — sits in the bottom-right corner, never blocks clicks
- **System tray** — switch pets, feed, pet, show/hide
- **English speech bubbles** — random phrases based on mood
- **State persists** between sessions (XP, stage, chosen pet)

---

## 🖥️ Requirements

- **Windows** (tested on Windows 10/11)
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)
- [Claude Code](https://claude.ai/code) desktop app

---

## 🚀 Installation

### 1. Clone the repo

```bash
git clone https://github.com/cvinoudot/claude-pet.git
cd claude-pet
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Claude Code hooks

Add this to `C:\Users\YOUR_NAME\.claude\settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:27182/event -H \"Content-Type: application/json\" -d \"{\\\"type\\\":\\\"tool_use\\\",\\\"tool_name\\\":\\\"$CLAUDE_TOOL_NAME\\\"}\" || true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:27182/event -H \"Content-Type: application/json\" -d \"{\\\"type\\\":\\\"stop\\\"}\" || true"
          }
        ]
      }
    ]
  }
}
```

> If you already have other settings in the file, just merge the `hooks` section in.

### 4. Launch the pet

```bash
npm start
```

A transparent window with your pixel pet will appear in the **bottom-right corner** of your screen. An orange paw 🐾 icon will appear in the system tray.

---

## 🎮 Usage

### Interacting with the pet

| Action | Result |
|--------|--------|
| **Click** the pet | Wakes it up / makes it happy |
| **Right-click tray icon** | Opens the menu |

### Tray menu options

| Option | Description |
|--------|-------------|
| 🐱 Orange tabby cat | Switch to orange striped cat |
| 🐱 Black & white cat | Switch to black & white cat |
| 🐰 White rabbit | Switch to white rabbit |
| 🐰 Grey rabbit | Switch to grey rabbit |
| 🍖 Feed | Pet eats (`Nom nom!`) |
| 🤚 Pet | Pet gets happy |
| Show/Hide | Toggle visibility |
| Quit | Close the app |

> The tray icon is the orange paw 🐾 — find it by clicking the `^` arrow near the Windows clock.

### Pet moods

| Mood | Trigger | Animation |
|------|---------|-----------|
| `idle` | Default | Sits, blinks |
| `happy` | Claude finished / click | Bounces, sparkles |
| `excited` | Write/Edit tool used | Big bounce, gold sparkles |
| `nervous` | Bash command | Sweat drop |
| `curious` | Read/Grep/Glob | Wide eyes, think dots |
| `sleep` | 10 min no activity | Eyes closed, Zzz |
| `eat` | Fed from tray | `Nom nom!` |
| `walk` | Random every 30–90s | Walks left/right |
| `levelup` | XP milestone hit | Confetti sparkles |
| `missed` | Back after 2+ hours | `Missed you!` |

### Growth stages

| Stage | XP required | Visual change |
|-------|-------------|---------------|
| Baby | 0 XP | Small, simple |
| Teen | 100 XP | More detail |
| Adult | 500 XP | Bow accessory 🎀 |

XP is earned automatically — **+1 XP per Claude response**.

---

## 🔄 Auto-start with Windows

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a shortcut to `npm start` in that folder, or create a `start.bat`:

```bat
@echo off
cd /d C:\path\to\claude-pet
npm start
```

Place `start.bat` in the Startup folder.

---

## 🛠️ Tech stack

- **Electron** — transparent always-on-top overlay window
- **Canvas API** — pixel art sprites drawn programmatically (no image files)
- **Node.js HTTP server** — receives events from Claude Code hooks on `localhost:27182`
- **Rule-based agent** — pet decides its mood based on which Claude tool was used

---

## 📁 File structure

```
claude-pet/
├── main.js          # Electron main: window, HTTP server, tray
├── preload.js       # IPC bridge between main and renderer
├── renderer.html    # Canvas + XP bar + speech bubble
├── renderer.js      # Pixel sprites, animations, pet agent logic
├── package.json
└── README.md
```

---

## License

MIT
