# DomainScout 🔍

DomainScout is an AI-powered domain analysis and research tool that provides comprehensive domain information, security analysis, and actionable recommendations in Japanese.

## Features

- **Domain Analysis**: Complete WHOIS, DNS, SSL, and security analysis
- **Japanese UI**: Fully localized Japanese interface and responses
- **Real-time Chat**: Interactive chat interface with follow-up suggestions
- **Search History**: Persistent chat history using DuckDB WASM
- **Security Scanning**: Malware, phishing, and blacklist checks
- **Actionable Recommendations**: Step-by-step guidance for domain registration and management

## Tech Stack

- **Backend**: Python, LangGraph, Google Gemini API
- **Frontend**: React, TypeScript, DuckDB WASM
- **Domain Tools**: python-whois-extended, dnspython
- **AI**: Google Gemini with LangGraph state management

## Quick Start

1. Clone the repository
2. Set up environment variables (see Environment Variables section)
3. Start development servers:
   ```bash
   make dev
   ```

## Environment Variables

Backend requires:
- `GEMINI_API_KEY` - Google Gemini API key

Optional:
- `LANGSMITH_API_KEY` - For LangSmith monitoring

## License

This project is based on the Google Gemini LangGraph quickstart template.