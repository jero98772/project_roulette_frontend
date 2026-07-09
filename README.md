# 🎰 Project Jackpot — Ensemble Project Generator

A slot machine-inspired UI that generates random programming project ideas. Pull the lever and get a language, a stack, an addon, and a brief description of what to build.

![screenshot](./screenshot.png)

## Related Repositories

| Repo | Description |
|------|-------------|
| [jero98772/project_roulette_frontend](https://github.com/jero98772/project_roulette_frontend) | This repo — React + Vite frontend |
| [jero98772/project_roulette](https://github.com/jero98772/project_roulette) | Backend API (FastAPI / LLM-powered project generation) |

## Features

- **3 generation modes:**
  - 🎰 **Totally Random** — no constraints, pure chaos
  - 📊 **By Level** — pick difficulty (warm-up → boss fight)
  - 🛠 **By Value** — choose language, tech stack, addon, and difficulty yourself
- Retro arcade cabinet UI with spinning reels, a physical lever, and flickering glyphs
- 🎲 Random "peek" button to fill fields with a random catalog entry
- Bonus combo rows for multi-stack project generation
- Typed description output
- Win burst particle animation (p5.js background)
- Pull history — revisit past results
- API health indicator

## Prerequisites

- Node.js >= 18
- The backend must be running locally. See [project_roulette](https://github.com/jero98772/project_roulette) for setup.

## Getting Started

```bash
# Clone
git clone https://github.com/jero98772/project_roulette_frontend.git
cd project_roulette_frontend

# Install dependencies
npm install

# Start dev server (proxies /api to backend at 127.0.0.1:9600)
npm run dev
```

The dev server runs at `http://localhost:5173`. Make sure the backend is running on `127.0.0.1:9600`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 8](https://vitejs.dev/)
- [p5.js](https://p5js.org/) — background particle effects
- [ESLint](https://eslint.org/)

## Backend API

The frontend expects the backend at `/api/v1/` (proxied to `http://127.0.0.1:9600` during development). Required endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/catalog/programming-languages` | GET | Available languages |
| `/catalog/technologies` | GET | Available technologies |
| `/catalog/addons` | GET | Available addons |
| `/catalog/programming-languages/random` | GET | Random language |
| `/catalog/technologies/random` | GET | Random technology |
| `/catalog/addons/random` | GET | Random addon |
| `/ensemble_project/generate_project_totally_random` | POST | Generate random project |
| `/ensemble_project/generate_project_by_level` | POST | Generate by level |
| `/ensemble_project/generate_project_by_value` | POST | Generate from user picks |

## License

[MIT](LICENSE)
