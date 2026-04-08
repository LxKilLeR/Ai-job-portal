# HireAI - Modern Job Portal

An end-to-end, massively scoped AI Job Portal demonstrating deeply integrated UX patterns, React Context auth, Node.js + Express backend infrastructure, and bleeding-edge MCP Tool integrations via Anthropic Claude.

## 🚀 Setup Instructions

This repository defines both a `/backend` Express REST API and a `/frontend` Vite + React 18 application in a single runnable architecture.

### Install & Run

1. Open a terminal in the root directory.
2. Install all dependencies across both systems:
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   npm install
   ```
3. Boot the application identically using the unified script (This spins up Vite on port `3000` and Node on `5000` concurrently on Max/Linux setups):
   ```bash
   npm start
   ```
4. Access the web interface at `http://localhost:3000`.

## ⚙️ Stitch MCP Configuration

The AI Career Assistant floating widget natively supports the Anthropic API alongside Stitch MCP configuration payloads.
To harness the tool in production:
1. Open `frontend/src/services/mcpService.js`
2. Update the `ANTHROPIC_API_KEY` mapping to your production `import.meta.env.VITE_ANTHROPIC_API_KEY`.
3. The prompt explicitly binds to `claude-sonnet-4-20250514` utilizing the Stitch pipeline hook `https://stitch.mcp.claude.com/mcp` for syncing job application data seamlessly.

## 🌟 Feature Overview

- **Auth System**: Login and Signup utilizing encrypted JWT context bindings in Memory.
- **Dynamic Glassmorphism**: Complete CSS Tailwind setup with `bg-mesh` layers.
- **Smart Recommendations Dashboard**: Ring-based percentage scoring extracting user data attributes to match mock job payloads.
- **Resume Builder Toolkit**: Multi-step React state bindings rendering into dual separate responsive HTML layouts. PDF downloads execute flawlessly utilizing local `html2pdf.js` canvas mapping.
- **AI Career Assistant**: Persistent overlay powered locally by Anthropic models processing recursive history alongside pipeline commands.
