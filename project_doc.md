Product Requirement & Technical Specification: Enterprise Agentic RAG Platform

1. Executive Summary

This document outlines the architecture, data flow, and feature specifications for an enterprise-grade Agentic Retrieval-Augmented Generation (RAG) platform. The system is designed to allow users to securely upload documents, process them asynchronously into vector embeddings, and interact with an autonomous AI agent (powered by Gemini) that can dynamically route queries to the RAG database or external tools via the Model Context Protocol (MCP).

The platform prioritizes strict multi-tenancy, high-performance asynchronous document processing, and transparent AI reasoning (visible "thinking" and tool calls) to build trust and deliver business value.

2. Technology Stack

Frontend/UI: React / Next.js (TypeScript)

Backend API/Workers: Node.js (TypeScript)

Database, Auth, & Storage: Supabase (PostgreSQL)

Vector Database: Pinecone

LLM Provider: Google Gemini

AI Orchestration: LangChain.js / LangGraph.js

Background Jobs: BullMQ (backed by Redis)

Observability: LangSmith

3. Core Modules & Technical Specifications

3.1. Authentication & Multi-Tenancy (Supabase)

Mechanism: Standard Email and Password Sign Up / Sign In managed by Supabase Auth.

Multi-Tenancy Enforcement: Every backend API request extracts the user_id from the Supabase JWT.

Vector Isolation: Pinecone operations (upserting, querying) must use the user_id strictly as the namespace parameter. No data is ever written to a shared namespace.

3.2. Asynchronous Document Ingestion Pipeline

To prevent event loop blocking on large files, ingestion is decoupled from the main API.

Upload Flow: Frontend uploads the raw file (PDF, DOCX, PPTX, HTML) directly to Supabase Storage. The API creates a database record and queues a job in BullMQ, returning a job_id.

Parsing Strategy: The BullMQ worker uses @langchain/community/document_loaders to parse files into a single Markdown (.md) string. Complex layouts are intentionally flattened to Markdown to maintain system simplicity and robustness.

Chunking & Embedding: The Markdown is chunked (e.g., using RecursiveCharacterTextSplitter), embedded via the globally configured Embedding Model, and upserted into the user's Pinecone namespace.

Live Tracing (Supabase Realtime): The worker publishes granular status updates (e.g., PARSING_STARTED, CHUNKING_COMPLETE, EMBEDDING_IN_PROGRESS) to a document_jobs table. The frontend subscribes to this table via Supabase Realtime WebSockets to display a live progress/tracing UI to the user.

3.3. Document Management & Split-View

Storage: The fully parsed Markdown string and the raw chunks are saved in the Supabase PostgreSQL database for UI retrieval.

Document UI: A split-screen interface.

Left Pane: Renders the parsed Markdown file.

Right Pane: Displays the individual vector chunks.

Interaction: Users can perform a localized keyword search on the right pane to find specific chunks.

3.4. Agentic Chat Engine & Orchestration

Session Management: Users can create multiple distinct chat sessions. Sessions are persisted in the Supabase chat_sessions and messages tables, retaining full memory/context for ongoing conversations.

Session-Level Configuration: Within any given chat session, the user can dynamically select:

Model Name: Dropdown to select the Gemini model (e.g., Gemini 1.5 Flash, Gemini 1.5 Pro).

Thinking Level: Depending on the selected model, an option to configure the reasoning/thinking effort level.

Chat Interface: A ChatGPT/Claude-style UI supporting streaming text, persistent history, and an input text editor.

Transparency: The UI parses LangChain/Gemini streaming events to display the agent's "thinking" process (inner monologue) and explicit tool executions (e.g., "Searching Knowledge Base...", "Querying MCP...").

Tool 1 - RAG Retriever: A LangChain tool bound to the Pinecone vector store, strictly scoped to the user's namespace.

Tool 2 - MCP Integration: A Node.js backend MCP client utilizing @modelcontextprotocol/sdk. The backend establishes secure connections to user-configured MCP servers and maps them dynamically as LangChain tools available to the Gemini agent.

3.5. Configuration & Observability

Settings UI: Global user settings configured directly in the UI. Stored securely in the database:

Google API Key (for Gemini LLM and Embeddings).

Embedding Model Name (e.g., text-embedding-004).

Pinecone API Key, Environment, and Index Name.

LangSmith API Key (for observability).

MCP Server URLs/Credentials.

LangSmith: Configured globally via the settings to trace agent reasoning, token usage, and tool latency.

4. User Interface (UI) Architecture

4.1. Auth Pages

Sign In / Sign Up: Clean Email and Password form powered by Supabase.

4.2. Main Navigation

Sidebar or Topbar linking to: Chat, Documents, Settings.

4.3. Agentic Chat Page (/chat)

Layout:

Left Sidebar (Collapsible): Displays a history of previously created chat_sessions. Users can click to resume context-aware conversations or create a "New Chat".

Header/Top Bar: Contains the Model Name selector dropdown and the Thinking Level configuration specific to the active session.

Main Chat Area: Message stream supporting Markdown rendering, expandable/collapsible "Tool Call" logs, and distinct UI states for "Thinking". Bottom text editor for user input.

4.4. Documents Page (/documents)

List View: Data table showing uploaded documents, upload date, and status.

Upload Modal: Drag-and-drop zone. Shows the live Realtime tracing pipeline (Loading -> Chunking -> Embedding -> Stored) during active uploads.

Detail View (/documents/[id]): The Markdown (Left) / Chunks (Right) split-screen with keyword search.

4.5. Settings Page (/settings)

Form inputs to save global configuration keys: Google API Key, Embedding Model Name, Pinecone config, LangSmith Key, and MCP configurations.

5. High-Level Database Schema (Supabase PostgreSQL)

users (Managed by Supabase Auth - Email/Password)

user_settings: user_id, google_api_key (encrypted), embedding_model_name, pinecone_key (encrypted), langsmith_key (encrypted), mcp_config (JSONB).

documents: id, user_id, filename, status, markdown_content (TEXT), created_at.

document_chunks: id, document_id, chunk_text, chunk_index.

document_jobs (For live tracing): id, document_id, status (enum), progress_percentage, current_step_details.

chat_sessions: id, user_id, title, selected_model, thinking_level, created_at.

messages: id, session_id, role (user/assistant/tool), content, tool_calls (JSONB), created_at.

6. Implementation Roadmap for AI Agents

Phase 1: Infrastructure & Auth: Initialize Node.js/Next.js repo. Setup Supabase project, Email/Password Auth UI, and base database schemas with Row Level Security (RLS).

Phase 2: Asynchronous Pipeline: Implement Redis/BullMQ. Create the document upload endpoint, storage bucket wiring, LangChain document loaders, and Supabase Realtime broadcast for live tracing UI.

Phase 3: Vector & Data Management: Integrate Pinecone SDK (enforcing user_id namespaces). Implement the Markdown/Chunk split-view UI and keyword search functionality.

Phase 4: Agent Core & Tooling: Build the LangChain/LangGraph orchestration layer. Implement the Pinecone RAG tool. Build the Chat UI (Collapsible sidebar, Model/Thinking selectors, streaming chat interface).

Phase 5: MCP & Settings: Create the Settings UI. Integrate the dynamic instantiation of the Gemini model based on session settings and the Google API key from user settings. Integrate the backend MCP client.