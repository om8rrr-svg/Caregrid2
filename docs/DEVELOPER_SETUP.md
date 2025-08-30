# CareGrid Developer Setup (Mac)

This guide explains how to set up the CareGrid project locally on macOS using VS Code with GitHub Copilot + MCP.

---

## Prerequisites
- **Git**
  ```bash
  git --version
  ```
  If missing:
  ```bash
  xcode-select --install
  ```

- **Node.js**
  ```bash
  node -v
  ```
  If missing:
  ```bash
  brew install node
  ```

- **VS Code**
  Install from: https://code.visualstudio.com
  Required extensions:
  - GitHub Copilot
  - GitHub Copilot Chat
  - Live Server (for quick HTML previews)

---

## Clone the Repository

```bash
git clone https://github.com/om8rrr-svg/Caregrid2.git
cd Caregrid2
code .
```

---

## Running the Site

Option A: Live Server
- Right-click `index.html` → “Open with Live Server”

Option B: Node serve
```bash
npx serve -p 5173 .
```
Visit: http://localhost:5173

---

## Copilot & MCP
- `.github/copilot-instructions.md` → global rules
- `.vscode/mcp.json` → MCP config
- `js/AGENTS.md` → folder-specific rules

Verify MCP:
1. Open Copilot Chat in VS Code
2. Ask: “What rules guide CareGrid development?”
3. Copilot should quote from copilot-instructions.md

---

## Workflow
1. Create feature branch:
```bash
git checkout -b feature/your-branch
```
2. Make changes + test locally
3. Commit + push:
```bash
git add .
git commit -m "feat: description"
git push -u origin feature/your-branch
```
4. Open a Pull Request in GitHub
5. Vercel will build a preview for QA
6. Merge to main when approved

---

If you want, run the commands below from the repo root to create a branch, add this file, commit and push it to GitHub:

```bash
git checkout -b docs/add-developer-setup
git add docs/DEVELOPER_SETUP.md
git commit -m "docs: add DEVELOPER_SETUP (mac) checklist"
git push -u origin docs/add-developer-setup
```
