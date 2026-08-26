WhatsApp AI Assistant

An AI-powered conversational assistant designed to process natural-language requests, detect user intent, generate contextual responses, manage tasks and events, process voice messages, and persist interaction history.

The project combines an AI-powered backend, communication integrations, a mobile frontend, SQLite persistence, automated regression testing, End-to-End testing, and GitHub Actions CI.

Table of Contents

Project Overview

Key Features

Architecture

Technology Stack

Backend

AI and Intent Recognition

Task and Event Management

Speech-to-Text

Internationalization

Database

REST API

Automated Testing

Continuous Integration

Project Structure

Installation

Environment Variables

Running the Backend

Running the Frontend

Running Tests

CI/CD Workflow

Quality and Engineering Metrics

Future Improvements

Project Objectives

Author

Project Overview

The WhatsApp AI Assistant is a full-stack application that transforms natural-language user messages into structured responses and validated actions.

The backend receives a message, analyzes the user's intent, extracts relevant information, determines whether an action requires confirmation, and returns a structured response.

The application supports conversational interactions as well as task and event management operations.

The project was designed with a strong focus on:

Artificial Intelligence integration

Backend development

REST API design

Database persistence

Automated testing

Continuous Integration

End-to-End validation

Mobile application development

Key Features

Natural-language message processing

AI-powered intent recognition

LLM-based conversational responses

Task creation, modification, and deletion

Event creation, modification, and deletion

Task and event search

Ambiguous request handling

Action confirmation before state-changing operations

Voice message transcription

French-language speech recognition

Multilingual response support

Persistent interaction history

Automated regression testing

Automated validation testing

End-to-End testing

GitHub Actions Continuous Integration

Automated test reports

React Native / Expo frontend

Architecture

                         User / WhatsApp
                                |
                                v
                     Communication Integration
                                |
                                v
                    +-------------------------+
                    |     Node.js Backend     |
                    |        Express          |
                    +------------+------------+
                                 |
                +----------------+----------------+
                |                |                |
                v                v                v
        +---------------+ +---------------+ +---------------+
        | Intent        | | Conversation  | | Speech-to-   |
        | Detection     | | Service       | | Text         |
        +-------+-------+ +---------------+ +---------------+
                |
                v
        +-----------------------+
        | Action / Entity       |
        | Processing            |
        +-----------+-----------+
                    |
                    v
        +-----------------------+
        | Confirmation Layer    |
        +-----------+-----------+
                    |
                    v
        +-----------------------+
        | Task / Event Logic    |
        +-----------+-----------+
                    |
                    v
        +-----------------------+
        | Prisma ORM            |
        | SQLite                |
        +-----------------------+

CI Architecture

Pull Request
     |
     v
GitHub Actions
     |
     +-- Checkout repository
     |
     +-- Setup Node.js
     |
     +-- Install dependencies
     |
     +-- Generate Prisma Client
     |
     +-- Build backend
     |
     +-- Run regression tests
     |
     +-- Run intent validation
     |
     +-- Run speech-to-text validation
     |
     +-- Generate reports
     |
     +-- Upload CI artifacts

Technology Stack

Backend

Technology

Purpose

Node.js

Backend runtime

TypeScript

Type-safe development

Express 5

REST API framework

Groq SDK

AI and speech-to-text integration

Twilio

Communication / WhatsApp integration

Prisma 7

ORM and database access

SQLite

Relational database

better-sqlite3

SQLite database driver

Multer

Audio file upload handling

CORS

Cross-origin resource sharing

dotenv

Environment configuration

Frontend

Technology

Purpose

React Native

Mobile application

Expo 54

Mobile development platform

Expo Router

Application routing

TypeScript

Type-safe frontend development

Axios

HTTP client

React Navigation

Navigation

Expo AV

Audio functionality

Expo Speech

Text-to-speech

Testing and DevOps

Technology

Purpose

GitHub Actions

Continuous Integration

TypeScript validation scripts

Regression and validation testing

E2E test suite

End-to-End testing

JSON reports

Test result reporting

GitHub Actions Artifacts

CI report storage

Backend

The backend is implemented using Node.js, TypeScript, and Express.

The main application entry point is:

backend/src/index.ts

The backend is responsible for:

Receiving user messages

Detecting intent

Generating conversational responses

Processing task and event operations

Managing confirmation workflows

Transcribing audio

Persisting assistant interactions

Returning structured API responses

The backend exposes REST endpoints for application functionality and interaction history.

AI and Intent Recognition

The assistant analyzes natural-language input and determines the user's intent.

Supported intent categories include:

create_task

modify_task

delete_task

create_event

modify_event

delete_event

summarize_period

greeting

farewell

thanks

small_talk

capabilities

unrecognized

The intent detection logic is separated into:

backend/src/services/intentDetection.ts

This separation allows the AI processing logic to be independently validated through regression tests.

Conversational AI

Conversational intents are processed through a dedicated conversation service.

The system distinguishes between conversational responses and deterministic actions:

Conversational Intent
        |
        v
LLM-generated response

and:

Action Intent
        |
        v
Deterministic application logic
        |
        v
User confirmation
        |
        v
Action execution

This design reduces the risk of the assistant claiming that an action was executed before the application actually performs it.

Task and Event Management

The assistant supports natural-language task and event management.

Example task requests

Create a task to finish my internship report.

Delete the task called presentation.

Change my presentation task to final presentation.

Example event requests

Create an event called team meeting tomorrow.

Delete my meeting.

Move the meeting to Friday.

Supported operations include:

Create

Search

Modify

Delete

Retrieve

Date-range filtering

Ambiguity detection

Action Confirmation

State-changing operations use an explicit confirmation mechanism.

The workflow is:

User request
     |
     v
Intent detection
     |
     v
Extract entities and parameters
     |
     v
Find target
     |
     +---- No target ----> Not found response
     |
     +---- Multiple -----> Ambiguous response
     |
     +---- One target ---> Proposed action
                              |
                              v
                         Confirmation
                              |
                              v
                        Action execution

The backend creates a proposed action containing information such as:

Interaction ID

Intent

Extracted details

Target ID

Confirmation requirement

Speech-to-Text

The backend provides a dedicated speech-to-text endpoint:

POST /assistant/transcribe

Audio is received through multipart form data and processed using the Groq SDK.

The current implementation uses:

Whisper Large V3

Processing flow:

Audio file
    |
    v
Multer upload handling
    |
    v
Groq Speech-to-Text
    |
    v
Whisper Large V3
    |
    v
Transcribed text
    |
    v
Intent processing

The current transcription configuration targets French-language speech.

Internationalization

The backend contains an internationalization service:

backend/src/i18n.ts

Localized messages are used for:

Confirmation messages

Error messages

Task labels

Event labels

Summary messages

Conversational responses

The detected language is used to determine the appropriate response language.

Database

The project uses:

Prisma ORM
+
SQLite

The database schema is located at:

backend/prisma/schema.prisma

The main model is:

model AssistantInteraction {
  id             String   @id @default(uuid())
  inputText      String
  inputMode      String
  detectedIntent String?
  actionTaken    String?
  createdAt      DateTime @default(now())

  @@index([createdAt])
  @@index([detectedIntent])
}

The database stores:

User input

Input mode

Detected intent

Executed action

Interaction timestamp

Indexes are defined for:

createdAt
detectedIntent

to optimize common interaction-history queries.

REST API

Health Check

GET /

Returns the backend availability status.

Get Interaction History

GET /assistant/interactions

Returns recent assistant interactions.

Optional query parameter:

GET /assistant/interactions?limit=10

The endpoint limits results to a maximum of 30 records.

Create Interaction

POST /assistant/interactions

Example request:

{
  "inputText": "Create a task to finish my report",
  "inputMode": "text",
  "detectedIntent": "create_task"
}

Delete Interaction

DELETE /assistant/interactions/:id

Deletes a stored interaction.

Process AI Message

POST /assistant/message

Example:

{
  "inputText": "Create a task to finish my report",
  "inputMode": "text"
}

The endpoint returns structured information including:

Detected intent

Interaction data

Conversational response

Proposed action

Confirmation message

Task/event information

Summary information

Confirm Action

POST /assistant/confirm-action

Used to execute validated operations.

Supported actions include:

Create task

Create event

Modify task

Modify event

Delete task

Delete event

Speech-to-Text

POST /assistant/transcribe

Accepts an audio file and returns the generated transcription.

Automated Testing

Automated testing is integrated into the backend and CI workflow.

The backend provides three main test commands:

npm test
npm run test:e2e
npm run test:all

Regression and Validation Testing

npm test

Runs the configured regression and validation suites.

The repository contains dedicated validation logic for:

Fallback behavior

Conversation fallback

Intent recognition

Action/entity detection

Speech-to-text validation

End-to-End Testing

npm run test:e2e

The E2E implementation is located at:

backend/tests/e2e.ts

Complete Test Suite

npm run test:all

Runs:

Regression / validation tests
+
E2E tests

Testing Scope

The repository contains automated checks covering several parts of the application:

Test Area

Automated

Intent recognition

Yes

Fallback handling

Yes

Conversation fallback

Yes

Action/entity detection

Yes

Speech-to-text validation

Yes

Backend E2E

Yes

Build validation

Yes

CI execution

Yes

Test reports

Yes

The project currently has 6+ dedicated regression/validation checks in addition to the E2E test suite.

Continuous Integration

The project uses GitHub Actions for automated backend validation.

The workflow is located at:

.github/workflows/assistant-validation.yml

The CI workflow validates changes through automated build and testing stages.

CI Pipeline

Pull Request
     |
     v
Checkout repository
     |
     v
Setup Node.js
     |
     v
Install dependencies
     |
     v
Generate Prisma Client
     |
     v
Build backend
     |
     v
Fallback regression tests
     |
     v
Intent recognition tests
     |
     v
Speech-to-text validation
     |
     v
Generate reports
     |
     v
Upload CI artifacts

E2E CI Configuration

The E2E job supports configurable execution through environment variables.

E2E_ENABLED
E2E_BASE_URL
E2E_TIMEOUT_MS

Example:

E2E_ENABLED=true
E2E_BASE_URL=http://localhost:3000
E2E_TIMEOUT_MS=15000

The E2E test suite can therefore be executed against a running backend environment.

CI Test Reports

The CI workflow generates and uploads automated test reports.

Example report locations include:

backend/test-results/fallback-report.json
backend/test-results/intent-recognition-report.json
backend/test-results/e2e-report.json

These reports provide traceability for automated validation results and can be stored as GitHub Actions artifacts.

Project Structure

whatsapp-ai-assistant-stage-ia-/
|
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   |
│   ├── src/
│   │   ├── services/
│   │   │   ├── conversationService.ts
│   │   │   ├── intentDetection.ts
│   │   │   ├── intentFallbackCheck.ts
│   │   │   ├── conversationFallbackCheck.ts
│   │   │   ├── fallbackRegressionCheck.ts
│   │   │   ├── intentRecognitionRegressionCheck.ts
│   │   │   ├── actionEntityRegressionCheck.ts
│   │   │   ├── speechToTextValidationCheck.ts
│   │   │   └── ...
│   │   |
│   │   ├── i18n.ts
│   │   └── index.ts
│   |
│   ├── tests/
│   │   └── e2e.ts
│   |
│   ├── package.json
│   ├── package-lock.json
│   └── prisma.config.ts
|
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── ...
│   |
│   ├── package.json
│   └── ...
|
├── docs/
│   ├── e2e-test-plan-4180.md
│   └── speech-to-text-test-plan-4176.md
|
├── .github/
│   └── workflows/
│       └── assistant-validation.yml
|
└── README.md

Installation

Prerequisites

Install:

Node.js 22+

npm

Git

For frontend development:

Expo

Android Studio for Android development

Xcode for iOS development on macOS

Clone the Repository

git clone https://github.com/zgarnirawen/whatsapp-ai-assistant-stage-ia-.git
cd whatsapp-ai-assistant-stage-ia-

Backend Installation

Navigate to the backend:

cd backend

Install dependencies:

npm install

Generate the Prisma client:

npx prisma generate

Environment Variables

Create:

backend/.env

Example:

PORT=3000
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your_groq_api_key"

For E2E testing:

E2E_ENABLED=true
E2E_BASE_URL="http://localhost:3000"
E2E_TIMEOUT_MS="15000"

Do not commit real API keys, credentials, tokens, or production secrets to Git.

Running the Backend

Start the development server:

npm run dev

The backend runs on:

http://localhost:3000

Build the backend:

npm run build

Start the compiled application:

npm start

Running the Frontend

Navigate to:

cd frontend

Install dependencies:

npm install

Start Expo:

npm start

Run the web version:

npm run web

Run Android:

npm run android

Run iOS:

npm run ios

Run linting:

npm run lint

Running Tests

Run regression and validation tests:

npm test

Run E2E tests:

npm run test:e2e

Run the complete test suite:

npm run test:all

CI/CD Workflow

The current repository implements the Continuous Integration portion of a CI/CD workflow.

The automated pipeline performs:

Code change
    |
    v
Pull Request
    |
    v
GitHub Actions
    |
    +-- Dependency installation
    |
    +-- Prisma generation
    |
    +-- Application build
    |
    +-- Automated regression tests
    |
    +-- Intent validation
    |
    +-- Speech-to-text validation
    |
    +-- Test report generation
    |
    +-- Artifact upload

The E2E stage is configurable through E2E_ENABLED.

The repository can be extended with an automated deployment stage to complete the full:

Build
  ->
Test
  ->
Deploy

CI/CD lifecycle.

Quality and Engineering Metrics

Metric

Implementation

Backend language

TypeScript

Backend runtime

Node.js

Backend framework

Express 5

Database

SQLite

ORM

Prisma

AI integration

Groq SDK

Speech recognition

Whisper Large V3

Frontend

React Native / Expo

Automated test commands

3

Dedicated E2E test suite

Yes

CI workflow

1

Regression/validation checks

6+

CI report artifacts

Yes

Automated build validation

Yes

Pull-request validation

Yes

The current implementation represents approximately 85% completion of the automated-testing requirement for the associated project scope. The main remaining improvements are unconditional E2E execution in CI and broader conventional unit/integration test coverage.

Security Considerations

The application relies on environment variables for sensitive configuration such as API keys.

Recommended production improvements include:

Secret management through CI/CD secret stores

API authentication

Authorization

Rate limiting

Input validation

Request size limits

Structured security logging

Dependency vulnerability scanning

HTTPS

Production database security

Webhook signature verification where applicable

Future Improvements

Testing

Add Jest or Vitest

Increase unit-test coverage

Add API integration tests

Enable E2E tests by default in CI

Add code coverage reporting

Add coverage thresholds

Expand negative/error-path test cases

CI/CD

Add automated deployment after successful CI validation

Add a staging environment

Add production deployment

Add Docker-based builds

Add environment-specific configuration

Add dependency and security scanning

Backend

Replace development stub task/event storage with persistent domain models

Add authentication and authorization

Add request schema validation

Add centralized error handling

Add structured logging

Add rate limiting

Improve service modularity

AI

Improve intent classification accuracy

Add intent evaluation datasets

Track confidence scores

Add LLM response evaluation

Add conversation memory

Expand multilingual speech recognition

Production

Add application monitoring

Add readiness and health checks

Add metrics

Add database backups

Add secret management

Add observability and alerting

Project Objectives

This project demonstrates the integration of multiple software engineering disciplines.

Artificial Intelligence

Natural-language processing

Intent recognition

LLM-based conversational responses

Speech-to-text

Backend Engineering

REST API development

Service separation

Business logic

Database persistence

Error handling

Confirmation workflows

Mobile Development

React Native

Expo

API integration

Audio features

Software Quality

Regression testing

Validation testing

E2E testing

Automated test reporting

DevOps

GitHub Actions

Continuous Integration

Automated builds

Automated test execution

CI artifacts

Author

Rawen Zgarni
