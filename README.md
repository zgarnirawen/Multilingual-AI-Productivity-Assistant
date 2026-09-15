Multilingual AI Productivity Assistant

A full-stack AI productivity assistant developed during my AI Summer Internship at 3LM Solutions. The project explores how natural-language and voice interactions can be transformed into structured, validated productivity actions through an AI-powered backend and a React Native / Expo client.

Internship: AI Summer Internship — 3LM Solutions
Focus: Natural Language Processing, LLM integration, voice interaction, backend engineering, automated validation, and Continuous Integration

Overview

The Multilingual AI Productivity Assistant processes user requests expressed in natural language or voice and routes them through an AI-assisted backend.

The application combines:

LLM-based intent recognition

Structured entity extraction

Conversational response generation

Task and event action workflows

Target resolution and ambiguity handling

Explicit confirmation before state-changing actions

Speech-to-text processing

French / English interaction support

Interaction-history persistence

Automated regression and validation checks

Backend End-to-End testing

GitHub Actions Continuous Integration

A key architectural principle is the separation between AI interpretation and application-side execution. The assistant can propose an action, but a state-changing operation is executed only after explicit user confirmation.

The current task and event layer is implemented through an in-memory development module. This keeps the assistant workflow testable while leaving a clear integration boundary for future connection to persistent task and calendar modules.

Internship Context

This project was developed during my AI Summer Internship at 3LM Solutions.

The internship work focused on integrating AI capabilities into a practical full-stack application rather than treating the LLM as an isolated chatbot. The project therefore combines AI components with application logic, validation, persistence, testing, and CI automation.

The main areas addressed were:

Natural-language understanding

LLM-based intent classification

Entity extraction and normalization

Conversational response generation

Action proposal and confirmation

Voice recording and speech-to-text

Multilingual interaction

REST API development

Interaction-history persistence

AI-specific regression testing

End-to-End testing

GitHub Actions CI

Key Features

Natural-Language Interaction

Users can interact with the assistant using natural-language requests rather than predefined commands.

The backend identifies the type of request and extracts the information required by the corresponding application workflow.

Task Management

Supported task-oriented actions include:

Create a task

Modify a task

Delete a task

Event Management

Supported event-oriented actions include:

Create an event

Modify an event

Delete an event

Ambiguity Handling

The assistant does not blindly execute an action when the requested target cannot be resolved.

The workflow distinguishes between:

No target found
      |
      v
Not-found response

and:

Multiple possible targets
      |
      v
Clarification request

Confirmation-Based Actions

State-changing operations are proposed before execution.

User request
     |
     v
AI interpretation
     |
     v
Proposed action
     |
     v
User confirmation
     |
     +---- Cancel
     |
     +---- Confirm
             |
             v
       Execute operation

Voice Interaction

The mobile application supports voice recording and sends audio to the backend for speech-to-text processing.

Multilingual Support

The application contains French / English interaction handling, including localized assistant messages and application responses.

Architecture

The system separates conversational AI, structured action recognition, and deterministic application logic.

                           User
                      Text / Voice
                           |
                           v
                  React Native / Expo
                           |
                           v
                    Express REST API
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
   Intent Detection   Conversation     Speech-to-Text
          |              Service              |
          |                |                  |
          +----------------+------------------+
                           |
                           v
                 Intent + Entity Processing
                           |
                           v
                    Target Resolution
                           |
              +------------+-------------+
              |            |              |
              v            v              v
        No target      Ambiguous       Valid target
              |            |              |
              v            v              v
        Not found     Clarification   Proposed action
                                         |
                                         v
                                  User Confirmation
                                     /       \
                                  Cancel     Confirm
                                     |          |
                                     v          v
                                  Response   Execute action
                                                |
                                                v
                                     In-memory task/event
                                           module
                                                |
                                                v
                                      Prisma / SQLite
                                     interaction history

Architectural Principle

The LLM is used for language understanding and conversational generation, while the application remains responsible for:

validating the interpreted request

resolving targets

handling ambiguity

requesting confirmation

executing the operation

recording the interaction

This creates a controlled boundary between probabilistic AI behavior and deterministic application behavior.

AI Intent Detection

The main intent-recognition service is:

backend/src/services/intentDetection.ts

The implementation uses the Groq SDK with the llama-3.3-70b-versatile model.

The model is used to produce structured intent information instead of unrestricted natural-language output.

Processing Flow

Natural-language request
          |
          v
      LLM analysis
          |
          +---- Intent
          |
          +---- Entities
          |
          +---- Confidence
          |
          v
 Normalization / validation
          |
          v
 Application decision

The implementation includes a confidence threshold and instructs the model not to invent missing entities.

Supported Intents

The current intent catalogue includes:

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

The intent-processing layer also performs normalization for extracted action information, including common natural-language duration representations.

Conversational Response Generation

Conversational responses are handled separately by:

backend/src/services/conversationService.ts

This service uses the Groq SDK and the llama-3.3-70b-versatile model to generate contextual responses.

The separation is intentional:

Conversational request
        |
        v
Conversation Service
        |
        v
Natural-language response

while an action-oriented request follows the structured intent/action pipeline.

The conversation service also contains deterministic fallback behavior for situations where the LLM request fails or times out.

Action Resolution and Confirmation

Action-oriented requests follow a controlled workflow.

User request
     |
     v
Intent detection
     |
     v
Entity extraction
     |
     v
Target resolution
     |
     +---- No target
     |        |
     |        v
     |   Not found response
     |
     +---- Multiple targets
     |        |
     |        v
     |   Clarification
     |
     +---- One valid target
              |
              v
        Proposed action
              |
              v
       User confirmation
          /         \
       Cancel      Confirm
         |            |
         v            v
      Response    Execute action

The backend can return a proposedAction, allowing the frontend to maintain the pending action state.

The frontend then provides confirmation, cancellation, and clarification flows.

This design prevents the assistant from treating an LLM-generated interpretation as an automatically authorized state change.

Task and Event Layer

The current implementation exposes task and event behavior through:

backend/src/services/stubModules.ts

This module provides in-memory development stubs for the task and agenda functionality.

The purpose of this layer is to validate the assistant's action workflow without coupling the AI layer directly to an external or unfinished domain API.

Current Status

AI Assistant
     |
     v
Action workflow
     |
     v
In-memory task/event module

This is an intentional development boundary.

The next integration step is to replace the in-memory implementation with the actual persistent task and agenda modules once stable interfaces are available.

Voice and Speech-to-Text

The mobile frontend supports audio recording.

The backend exposes:

POST /assistant/transcribe

Audio is received as multipart form data and processed through the Groq speech-to-text API.

The current implementation uses:

Whisper Large V3

Processing Flow

Voice recording
      |
      v
Mobile application
      |
      v
POST /assistant/transcribe
      |
      v
Multer multipart upload
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
Assistant processing

The current transcription configuration is oriented toward French-language speech.

The frontend also uses expo-speech for text-to-speech output.

Multilingual Interaction

The backend contains an internationalization service:

backend/src/i18n.ts

Localized handling is used for application messages such as:

confirmation messages

error messages

task labels

event labels

summary messages

conversational responses

The frontend also provides French / English interaction messaging.

The multilingual design is intended to allow the assistant's conversational layer and application responses to remain consistent with the user's interaction language.

Mobile Application

The frontend is implemented with:

React Native

Expo

Expo Router

TypeScript

Axios

React Navigation

Expo audio functionality

Expo Speech

The main assistant interface provides:

Chat interaction

Text input

Voice recording

Speech-to-text requests

Conversational responses

Proposed-action display

Confirmation

Cancellation

Modification / clarification flows

Quick actions

French / English UI messages

Text-to-speech output

Backend

The backend is implemented with:

Node.js

TypeScript

Express

Groq SDK

Prisma

SQLite

better-sqlite3

Multer

CORS

dotenv

The backend is responsible for:

Receiving assistant requests

Detecting intent

Extracting entities

Generating conversational responses

Resolving task/event targets

Creating proposed actions

Handling confirmation

Processing audio transcription

Persisting assistant interactions

Running validation and regression logic

Database and Interaction History

The application uses:

Prisma ORM
     +
SQLite

The schema is located at:

backend/prisma/schema.prisma

The main persistence model is:

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

The database records assistant interaction information including:

user input

input mode

detected intent

action information

interaction timestamp

Indexes are defined for:

createdAt
detectedIntent

Important distinction

The database currently persists assistant interaction history.

The task/event domain implementation remains in memory through stubModules.ts.

REST API

The backend exposes the assistant through REST endpoints.

Endpoint

Purpose

GET /

Backend availability / health response

GET /assistant/interactions

Retrieve interaction history

POST /assistant/interactions

Store an interaction

DELETE /assistant/interactions/:id

Delete an interaction

POST /assistant/message

Process an assistant message

POST /assistant/confirm-action

Confirm and execute a proposed action

POST /assistant/transcribe

Transcribe uploaded audio

Process Assistant Message

POST /assistant/message

Example:

{
  "inputText": "Create a task to finish my report",
  "inputMode": "text"
}

The response can contain structured information including:

detected intent

interaction data

conversational response

proposed action

confirmation information

task/event information

summary information

Confirm Action

POST /assistant/confirm-action

This endpoint is used to execute validated operations after the user confirms the proposed action.

Supported action types include:

create task

modify task

delete task

create event

modify event

delete event

Speech-to-Text

POST /assistant/transcribe

Accepts an uploaded audio file and returns the generated transcription.

Testing and Validation

Automated validation is an important part of the project.

The repository contains dedicated validation logic for AI-related behavior in addition to the backend E2E suite.

Validation Areas

The current validation layer covers:

Intent recognition

Intent fallback behavior

Conversation fallback behavior

General fallback behavior

Action/entity extraction

Entity normalization

Speech-to-text validation

Backend End-to-End behavior

Backend build validation

Validation Services

Relevant services include:

backend/src/services/intentFallbackCheck.ts
backend/src/services/conversationFallbackCheck.ts
backend/src/services/fallbackRegressionCheck.ts
backend/src/services/intentRecognitionRegressionCheck.ts
backend/src/services/actionEntityRegressionCheck.ts
backend/src/services/speechToTextValidationCheck.ts

Test Commands

From the backend/ directory:

npm test

Runs the configured regression and validation suites.

npm run test:e2e

Runs the backend End-to-End suite:

backend/tests/e2e.ts

npm run test:all

Runs the configured complete test sequence.

Continuous Integration

The repository uses GitHub Actions for Continuous Integration.

The workflow is:

.github/workflows/assistant-validation.yml

CI Pipeline

Pull Request / Manual execution
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
      +-------+-------+--------+
      |       |       |        |
      v       v       v        v
   Fallback Intent  STT       E2E
   checks   checks checks   optional
      |       |       |        |
      +-------+-------+--------+
              |
              v
       Generate reports
              |
              v
      Upload CI artifacts

The workflow performs automated backend validation and produces test reports.

E2E Configuration

The E2E stage supports:

E2E_ENABLED
E2E_BASE_URL
E2E_TIMEOUT_MS

Example:

E2E_ENABLED=true
E2E_BASE_URL=http://localhost:3000
E2E_TIMEOUT_MS=15000

CI Reports

The validation process can generate reports such as:

backend/test-results/fallback-report.json
backend/test-results/intent-recognition-report.json
backend/test-results/e2e-report.json

These reports can be uploaded as GitHub Actions artifacts.

Scope: the current workflow is a Continuous Integration pipeline. It validates and builds the backend and executes automated checks; it is not presented as a complete production deployment pipeline.

Technology Stack

AI

Technology

Purpose

Groq SDK

LLM and speech-to-text integration

LLaMA 3.3 70B

Intent recognition and conversational generation

Whisper Large V3

Speech-to-text

Backend

Technology

Purpose

Node.js

Runtime

TypeScript

Application language

Express

REST API

Prisma

ORM

SQLite

Interaction-history database

better-sqlite3

SQLite driver

Multer

Audio upload handling

CORS

Cross-origin request handling

dotenv

Environment configuration

Frontend

Technology

Purpose

React Native

Mobile application

Expo

Mobile development platform

Expo Router

Application routing

TypeScript

Application language

Axios

HTTP client

React Navigation

Navigation

Expo audio functionality

Voice recording

Expo Speech

Text-to-speech

Quality and CI

Technology

Purpose

GitHub Actions

Continuous Integration

Regression checks

AI behavior validation

E2E tests

Backend End-to-End validation

JSON reports

Test result reporting

GitHub Actions artifacts

CI result storage

Communication Dependency

The backend also includes the Twilio dependency for communication-related functionality. The current README intentionally does not claim a production WhatsApp webhook/message-ingestion layer unless such a layer is present in the implementation.

Project Structure

Multilingual-AI-Productivity-Assistant/
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
│   │   │   └── stubModules.ts
│   │   │
│   │   ├── i18n.ts
│   │   └── index.ts
│   │
│   ├── tests/
│   │   └── e2e.ts
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── prisma.config.ts
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   └── components/
│   │
│   ├── package.json
│   └── ...
│
├── docs/
│   ├── e2e-test-plan-4180.md
│   └── speech-to-text-test-plan-4176.md
│
├── .github/
│   └── workflows/
│       └── assistant-validation.yml
│
└── README.md

Installation

Prerequisites

For the backend:

Node.js

npm

Git

For frontend development:

Expo tooling

Android Studio for Android development

Xcode for iOS development on macOS

Clone the Repository

git clone https://github.com/zgarnirawen/Multilingual-AI-Productivity-Assistant.git
cd Multilingual-AI-Productivity-Assistant

Backend Setup

Navigate to the backend:

cd backend

Install dependencies:

npm install

Generate the Prisma client:

npx prisma generate

Create:

backend/.env

Example:

PORT=3000
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your_groq_api_key"

For E2E execution:

E2E_ENABLED=true
E2E_BASE_URL="http://localhost:3000"
E2E_TIMEOUT_MS="15000"

Do not commit real API keys, tokens, credentials, or other secrets.

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

From the project root:

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

The frontend's API address is configured in the application code and may need to be adjusted depending on whether the backend is running locally, on an emulator, or on another machine.

Running Tests

From backend/:

Regression and validation tests

npm test

End-to-End tests

npm run test:e2e

Complete test sequence

npm run test:all

Current Scope and Limitations

The project should be understood as an internship-stage AI assistant implementation, not as a fully integrated production productivity platform.

Currently implemented

LLM-based intent recognition

Structured entity extraction

Intent confidence handling

Entity normalization

Conversational response generation

Task action workflows

Event action workflows

Target resolution

Ambiguity handling

Explicit confirmation before state-changing actions

Voice recording

Speech-to-text

French / English interaction handling

Interaction-history persistence

Regression validation

Backend E2E testing

GitHub Actions CI

Current limitations

Task and agenda integration

The current task/event implementation uses:

backend/src/services/stubModules.ts

This is an in-memory development implementation rather than a production persistent task/calendar integration.

WhatsApp transport

Although the repository name originated from the WhatsApp-oriented project scope and Twilio is present as a dependency, the current README does not claim a production WhatsApp webhook/message-ingestion layer.

CI versus deployment

GitHub Actions currently provides Continuous Integration and automated validation.

It should not be described as a complete production CI/CD deployment pipeline.

Production hardening

Additional work would be required before considering the application production-ready, including areas such as:

authentication and authorization

stronger request validation

rate limiting

production secret management

structured logging

monitoring and observability

dependency/security scanning

production database strategy

backups

deployment hardening

Security Considerations

Sensitive configuration is provided through environment variables.

At minimum, production deployment should address:

Secret management

API authentication

Authorization

Request validation

Rate limiting

Request-size limits

HTTPS

Dependency vulnerability scanning

Structured logging

Production database security

Webhook signature verification where applicable

No real credentials or API keys should be committed to the repository.

Future Improvements

Application Integration

Replace stubModules.ts with real task and agenda integrations

Connect the assistant to persistent domain data

Define stable interfaces between the assistant and productivity modules

AI

Expand intent evaluation datasets

Improve recognition of informal and typo-prone requests

Expand multilingual evaluation

Improve entity extraction accuracy

Add systematic LLM response evaluation

Improve conversational context handling

Testing

Increase unit-test coverage

Add broader API integration tests

Expand negative and error-path scenarios

Add coverage reporting and thresholds

Strengthen E2E execution against a representative staging environment

Production Engineering

Add authentication and authorization

Introduce production secret management

Add structured logging

Add monitoring and observability

Add metrics and alerting

Introduce production database backups

Add security and dependency scanning

Add a deployment stage after successful CI validation

Engineering Focus

The project demonstrates how AI components can be integrated into a conventional software architecture while maintaining application-side control.

1. Structured AI output

Natural-language requests are converted into explicit intents and entities instead of passing unrestricted model output directly to application logic.

2. Validation before execution

AI-derived actions are processed through application logic before execution.

3. Explicit user confirmation

State-changing actions require explicit confirmation, creating a clear boundary between AI interpretation and state mutation.

4. Deterministic fallbacks

The backend provides controlled fallback behavior for intent and conversational failures.

5. AI-specific regression testing

The project contains dedicated validation services for intent recognition, fallback behavior, action/entity handling, and speech-to-text behavior.

6. Automated CI

GitHub Actions automates backend build and validation steps, making AI-related checks repeatable as part of the development workflow.

What This Project Demonstrates

Artificial Intelligence

Natural-language processing

LLM-based intent recognition

Structured entity extraction

Conversational generation

Speech-to-text

AI fallback strategies

AI regression validation

Backend Engineering

TypeScript

Express REST APIs

Service separation

Deterministic action workflows

Prisma ORM

SQLite persistence

Mobile Development

React Native

Expo

Voice interaction

REST API integration

Multilingual UI behavior

Text-to-speech

Software Quality

Regression testing

Validation suites

End-to-End testing

Test reporting

CI artifacts

DevOps / CI

GitHub Actions

Automated builds

Automated validation

Pull-request-oriented checks

Artifact generation

Internship Takeaway

The main objective of the project was not simply to integrate an LLM into an application, but to explore how AI capabilities can be combined with deterministic software-engineering controls.

The resulting architecture treats the language model as an intelligent interpretation and conversational component while keeping validation, confirmation, persistence, and action execution under application control.

This approach provides a clearer foundation for evolving an AI prototype into a maintainable, testable, and eventually production-integrated system.

Author

Rawen Zgarni

Computer Engineering Student — ENICarthage, Tunisia

GitHub: @zgarnirawen

Repository

Multilingual-AI-Productivity-Assistant
