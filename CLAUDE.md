# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **DomainScout**, a fullstack application that transforms the Google Gemini LangGraph quickstart into a specialized domain research and analysis tool. The system analyzes domain availability, security, performance, and provides comprehensive recommendations in Japanese.

## Commands

### Development
```bash
# Start both frontend and backend servers
make dev

# Start individually
make dev-frontend  # Frontend on http://localhost:5173/app or next available port
make dev-backend   # Backend on http://127.0.0.1:2024

# Backend Python environment
cd backend
pip install .
pip install -e ".[dev]"  # Include dev dependencies

# Frontend
cd frontend
npm install
npm run dev
npm run build
npm run lint

# Run backend tests
cd backend
pytest

# Test domain extraction specifically
cd backend && source venv/bin/activate && python test_domain_extraction.py

# Test WHOIS functionality
cd backend && source venv/bin/activate && python test_whois.py

# Debug DuckDB in browser console
debugDuckDB()
```

### Docker Deployment
```bash
# Build production image
docker build -t gemini-fullstack-langgraph -f Dockerfile .

# Run with docker-compose
GEMINI_API_KEY=<key> LANGSMITH_API_KEY=<key> docker-compose up
```

## Architecture

### Backend (LangGraph Agent)
The backend uses a state machine graph pattern with specialized nodes:

1. **Domain Detection Flow**: 
   - `extract_domains` → Parses user query for domain names using regex + LLM
   - Routes to domain analysis or general research based on detection

2. **Domain Analysis Branch**:
   - `domain_analysis` → Technical checks (DNS, SSL, HTTP status, WHOIS via python-whois-extended)
   - `finalize_domain_answer` → Formats Japanese report with actionable steps

3. **General Research Branch**:
   - `generate_query` → Creates search queries
   - `web_research` → Google Search API integration
   - `reflection` → Knowledge gap analysis
   - `finalize_answer` → Synthesizes final answer

Key files:
- `backend/src/agent/graph.py` - Main graph definition and node implementations
- `backend/src/agent/domain_tools.py` - Domain-specific analysis tools (WHOIS, DNS, SSL, HTTP checks)
- `backend/src/agent/prompts.py` - All prompts localized to Japanese

### Frontend (React + DuckDB WASM)

**Search History Persistence**:
- Uses DuckDB WASM for SQL-based history management
- Implements hybrid persistence: in-memory DuckDB + IndexedDB backup
- OPFS support code present but disabled for stability

Key components:
- `frontend/src/lib/duckdb.ts` - DuckDB manager with persistence logic
- `frontend/src/components/Sidebar.tsx` - History sidebar UI
- `frontend/src/hooks/useSearchHistory.ts` - History management hook

### Critical Implementation Details

1. **Domain Extraction**: Uses strict regex patterns for Japanese domain support
   ```python
   jp_pattern = r'([a-zA-Z0-9][a-zA-Z0-9\-]*\.(?:co\.jp|ne\.jp|or\.jp|jp))'
   other_pattern = r'([a-zA-Z0-9][a-zA-Z0-9\-]*\.(?:com|org|net|io|ai|app|edu|gov))'
   ```

2. **WHOIS Integration**: Real WHOIS lookups using python-whois-extended library
   - Requires system `whois` command installed (`sudo apt-get install whois`)
   - Provides creation date, expiration, registrar, nameservers

3. **Japanese Localization**: All backend responses and prompts are in Japanese

4. **DuckDB Persistence**: 
   - Saves to IndexedDB after each operation
   - Restores on initialization
   - OPFS code exists but disabled with `if (false && ...)` due to compatibility issues

5. **Domain Analysis Output**: 
   - WHOIS information displayed in detail section
   - DNS records (A, NS, MX) shown for registered domains
   - Actionable next steps and Japanese service recommendations (お名前.com, ムームードメイン)

6. **Google Search API Integration**: 
   - Domain analysis uses Google Search for additional context
   - Config must use simple format to avoid validation errors

## Environment Variables

Backend requires:
- `GEMINI_API_KEY` - Google Gemini API key

Production also needs:
- `LANGSMITH_API_KEY` - For LangSmith monitoring

## Known Issues

1. **OPFS Persistence**: Official DuckDB WASM OPFS support exists but implementation incomplete. Current hybrid approach (in-memory + IndexedDB) works reliably.

2. **Google Search API Config**: Ensure config uses simple format without extra parameters:
   ```python
   config={
       "tools": [{"google_search": {}}],
       "temperature": 0,
   }
   ```

3. **Vite Configuration**: Has specific headers for CORS and worker support needed for DuckDB WASM.

4. **LangGraph Server Restart**: After modifying domain extraction logic, the LangGraph server must be restarted for changes to take effect.

## Recent Features

1. **Real WHOIS Integration**: Actual WHOIS lookups via python-whois-extended library
2. **Follow-up Questions**: After each AI response, clickable suggestion buttons appear for deep-dive queries
3. **History Viewing Mode**: Click history items to view past conversations without re-running searches
4. **Welcome Screen Quick Actions**: Example queries are clickable buttons for instant analysis
5. **Enhanced Domain Reports**: Detailed WHOIS data, DNS records, SSL status in Japanese