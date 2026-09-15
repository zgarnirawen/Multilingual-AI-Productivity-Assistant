# Multilingual AI Productivity Assistant

A full-stack AI productivity assistant developed during my **AI Summer Internship at 3LM Solutions**. The project explores how natural-language and voice interactions can be transformed into structured, validated productivity actions through an AI-powered backend and a React Native / Expo client.

> **Internship:** AI Summer Internship — 3LM Solutions  
> **Focus:** Natural Language Processing, LLM integration, voice interaction, backend engineering, automated validation, and Continuous Integration

---

## Overview

The Multilingual AI Productivity Assistant is a full-stack application designed to let users interact with productivity features using natural language instead of traditional forms and menus.

The assistant can interpret requests expressed in French or English, identify the user's intent, extract relevant entities, generate conversational responses, propose productivity actions, and execute an action only after explicit confirmation from the user.

The project combines:

- Natural Language Processing
- Large Language Models
- Structured intent detection
- Entity extraction
- Multilingual interaction
- Voice input
- Speech-to-text
- Text-to-speech
- REST APIs
- React Native mobile development
- Database persistence
- Automated testing
- Regression testing
- GitHub Actions Continuous Integration

The main engineering objective is to build a reliable bridge between unstructured natural-language input and structured application actions.

---

## Internship Context

This project was developed during my **AI Summer Internship at 3LM Solutions**.

The internship provided an opportunity to work on an AI-powered application combining software engineering and artificial intelligence.

The project focused particularly on:

- Integrating LLM-based services into a backend application
- Designing natural-language intent detection
- Extracting structured entities from user requests
- Handling ambiguous or incomplete requests
- Designing safe action confirmation flows
- Supporting multilingual interactions
- Integrating voice input
- Building automated validation and regression tests
- Setting up Continuous Integration with GitHub Actions

The project also provided practical experience in taking an AI feature from the interaction layer through backend processing, validation, persistence, and automated testing.

---

## Key Features

### AI-Powered Intent Detection

The backend uses an LLM to classify natural-language requests into structured application intents.

The intent detection service uses Groq with the **LLaMA 3.3 70B** model.

The assistant currently handles the following intents:

- `create_task`
- `modify_task`
- `delete_task`
- `create_event`
- `modify_event`
- `delete_event`
- `summarize_period`
- `greeting`
- `farewell`
- `thanks`
- `small_talk`
- `capabilities`
- `unrecognized`

The service also extracts relevant entities from the user's request.

Examples include:

- Task title
- Event title
- Date
- Duration
- Contact information
- Other action-specific parameters

The model is explicitly instructed not to invent missing information.

---

### Confidence-Based Recognition

Intent recognition uses a confidence threshold to avoid blindly executing uncertain interpretations.

The current implementation uses a **0.6 confidence threshold**.

This allows the system to distinguish between:

- Clear requests
- Ambiguous requests
- Unsupported requests
- Requests requiring clarification

When the assistant cannot reliably understand the request, it falls back to a controlled response instead of pretending that the request was understood.

---

### Conversational AI

The assistant also includes a dedicated conversational response service.

It uses the Groq SDK and LLaMA 3.3 70B to generate responses based on:

- User input
- Detected intent
- Application context
- Current interaction state
- Supported language

The service supports both French and English.

Responses are designed to remain concise and contextual, while deterministic fallback responses are available when the AI service cannot be reached.

---

## Architecture

The application follows a frontend-backend architecture where the React Native client communicates with an Express REST API.

Architecture:

    React Native / Expo
            |
            | REST API
            v
       Express Backend
            |
      +-----+-----+
      |           |
      v           v
   Groq / LLM  Prisma / SQLite
      |           |
      |           v
      |     Interaction History
      |
      v
 Intent Detection
 Entity Extraction
 Conversation Service
 Action Resolution
 Confirmation Handling
      |
      v
 Productivity Action Layer
      |
      v
 In-memory Task/Event Stubs

---

## End-to-End Processing Flow

The assistant follows a multi-step processing pipeline.

    User Request
          |
          +-------------------+
          |                   |
          v                   v
      Text Input          Voice Input
          |                   |
          |                   v
          |             Speech-to-Text
          |                   |
          +---------+---------+
                    |
                    v
            Intent Detection
                    |
                    v
            Entity Extraction
                    |
                    v
             Target Resolution
                    |
             +------+------+
             |      |      |
             v      v      v
           Valid  Missing  Ambiguous
             |      |      |
             +------+------+
                    |
                    v
             Action Proposal
                    |
                    v
            User Confirmation
                    |
               +----+----+
               |         |
               v         v
              YES        NO
               |         |
               v         v
            Execute    Cancel
             Action     Action
               |
               v
       Persist Interaction

This separation between understanding, proposal, confirmation, and execution is an important part of the application's design.

---

## AI Intent Detection

The intent detection logic is implemented in:

    backend/src/services/intentDetection.ts

The service uses structured LLM tool/function calling to obtain a predictable representation of the model's interpretation.

The process includes:

1. Receiving the user's natural-language request
2. Sending the request to the LLM
3. Selecting an intent
4. Extracting relevant entities
5. Assigning a confidence score
6. Normalizing extracted values
7. Checking whether required information is available
8. Returning a structured result to the application

A conceptual result can look like:

    {
      "intent": "create_task",
      "confidence": 0.92,
      "entities": {
        "title": "Prepare internship report",
        "duration": 30
      }
    }

The application then performs additional validation before proposing the action.

---

## Entity Extraction and Normalization

Intent recognition is combined with entity extraction so that natural-language requests can be converted into structured application data.

The system can extract information such as:

    Task:
        title
        duration

    Event:
        title
        date
        duration

    Contact-related requests:
        contact information

The backend also normalizes extracted values before they are used by the application.

For example, duration expressions can be interpreted from natural-language inputs such as:

    30 minutes
    one hour
    1h

The repository also contains regression checks specifically targeting action entities and duration normalization.

---

## Conversational Response Generation

Conversational responses are handled by:

    backend/src/services/conversationService.ts

The service:

- Uses the Groq SDK
- Uses LLaMA 3.3 70B by default
- Supports French and English
- Receives structured application context
- Uses a timeout for external AI requests
- Provides deterministic fallback responses

The goal is to separate conversation generation from action recognition, making the backend easier to reason about and test.

---

## Action Confirmation

A key feature of the application is the explicit confirmation step.

For action-oriented requests, the assistant can first propose what it believes the user wants to do.

The action is then executed only after the user confirms it.

Example:

    User:
    Create a task to prepare my report for 30 minutes.

    Assistant:
    I can create a 30-minute task called "Prepare my report".
    Would you like me to proceed?

    User:
    Yes.

    Assistant:
    Task created.

This design prevents the assistant from treating an uncertain LLM interpretation as an immediately executable command.

The frontend maintains state for:

- Pending actions
- Confirmation
- Cancellation
- Modification
- Clarification

---

## Target Resolution

Before an action is executed, the application can resolve the target associated with the requested operation.

The system distinguishes between situations such as:

    Target not found
    Target ambiguous
    Target successfully resolved

This is particularly important for modification and deletion requests.

The assistant should not silently select an arbitrary target when the user's request is ambiguous.

---

## Task and Event Layer

The backend currently contains a service layer for interacting with productivity entities.

However, the current implementation uses **in-memory stubs** for task and event operations.

The relevant implementation is:

    backend/src/services/stubModules.ts

These stubs simulate operations such as:

- Creating tasks
- Modifying tasks
- Deleting tasks
- Creating events
- Modifying events
- Deleting events

This allows the AI interaction and validation workflow to be developed and tested independently from the final external productivity modules.

The stub layer is intended to be replaced by real module or API integrations once their interfaces are stable.

---

## Voice Interaction

The application supports voice-based interaction.

The React Native frontend uses Expo audio capabilities to record user input.

The recorded audio is sent to the backend through:

    /assistant/transcribe

The backend integrates speech-to-text processing and returns the transcribed text to the application.

This allows the same intent-processing pipeline to handle both:

    Voice
      |
      v
    Speech-to-Text
      |
      v
    Intent Detection
      |
      v
    Entity Extraction
      |
      v
    Action Processing

and:

    Text
      |
      v
    Intent Detection
      |
      v
    Entity Extraction
      |
      v
    Action Processing

---

## Text-to-Speech

The mobile application also supports spoken responses through Expo speech capabilities.

This creates a conversational interaction where the assistant can provide responses through both text and audio.

The overall voice interaction is:

    User speaks
         |
         v
    Speech-to-Text
         |
         v
    AI Processing
         |
         v
    Assistant Response
         |
         v
    Text-to-Speech
         |
         v
    Spoken Response

---

## Multilingual Interaction

The assistant supports:

- French
- English

Language handling is integrated into the interaction and conversational layers.

The application also contains multilingual UI messages for:

- Confirmations
- Cancellations
- Clarifications
- Errors
- Quick actions
- General assistant responses

The objective is to allow users to interact naturally without requiring commands to follow a rigid language-specific syntax.

---

## Mobile Application

The frontend is implemented using:

- React Native
- Expo
- Expo Router
- TypeScript
- Axios
- Expo Audio
- Expo Speech

The main application interface is implemented in:

    frontend/src/app/index.tsx

The mobile interface provides:

- Chat-based interaction
- Text input
- Voice recording
- Assistant responses
- Action proposals
- Confirmation controls
- Cancellation
- Modification
- Clarification
- Quick actions
- French and English interface messages

The frontend communicates with the backend through HTTP requests using Axios.

---

## Backend

The backend is implemented using:

- Node.js
- TypeScript
- Express
- Prisma
- SQLite
- Groq SDK
- Multer
- Twilio dependency

The backend is responsible for:

- Receiving user messages
- Processing natural-language input
- Detecting intents
- Extracting entities
- Generating conversational responses
- Processing speech-to-text requests
- Managing action confirmation
- Persisting interaction history
- Running validation and regression checks

---

## Database and Interaction History

The application uses Prisma with SQLite for persistence.

The database stores assistant interaction history, including information such as:

- User input
- Input mode
- Detected intent
- Action taken
- Creation timestamp

The interaction history makes it possible to retain structured information about assistant usage and provides a foundation for future analytics and monitoring.

The Prisma schema is located at:

    backend/prisma/schema.prisma

---

## REST API

The backend exposes REST endpoints for assistant interactions and related operations.

The main interaction areas include:

    Assistant message processing
    Action confirmation
    Interaction history
    Speech-to-text

The frontend communicates with these backend endpoints using Axios.

The API layer provides the boundary between the mobile application and the AI/business logic implemented in the backend.

---

## Testing and Validation

The project includes several layers of automated validation.

The backend provides npm scripts for:

    test
    test:e2e
    test:all

The repository also contains dedicated validation services covering areas such as:

- Action entity regression
- Conversation fallback behavior
- General fallback behavior
- Intent fallback behavior
- Intent recognition regression
- Speech-to-text validation

Relevant files include:

    backend/src/services/actionEntityRegressionCheck.ts
    backend/src/services/conversationFallbackCheck.ts
    backend/src/services/fallbackRegressionCheck.ts
    backend/src/services/intentFallbackCheck.ts
    backend/src/services/intentRecognitionRegressionCheck.ts
    backend/src/services/speechToTextValidationCheck.ts

---

## Regression Testing

The regression tests focus on preventing changes to the AI logic from silently breaking previously supported behavior.

The validation includes cases involving:

- Informal French requests
- Typographical variations
- Unsupported requests
- Low-confidence intents
- Action entities
- Duration normalization
- Conversational fallbacks
- Speech-to-text integration contracts

This is particularly important for AI-powered applications because model behavior can be less deterministic than traditional application logic.

---

## End-to-End Testing

The backend also includes an end-to-end test suite:

    backend/tests/e2e.ts

The project provides configuration options for enabling E2E validation against a running backend.

The CI workflow can use environment variables such as:

    E2E_ENABLED
    E2E_BASE_URL
    E2E_TIMEOUT_MS

This allows the E2E layer to be enabled when an appropriate running environment is available.

---

## Continuous Integration

The project uses GitHub Actions for automated validation.

The workflow is located at:

    .github/workflows/assistant-validation.yml

The workflow can be triggered manually and through pull requests.

The CI pipeline performs tasks including:

1. Checking out the repository
2. Setting up Node.js
3. Installing dependencies
4. Generating the Prisma client
5. Building the backend
6. Running offline fallback regression tests
7. Running intent recognition regression tests
8. Validating the speech-to-text integration contract
9. Optionally running E2E tests
10. Uploading generated validation reports

The CI pipeline is primarily focused on **automated validation and regression testing**.

It should therefore be considered Continuous Integration rather than a complete production Continuous Delivery or Continuous Deployment system.

---

## Technology Stack

### Artificial Intelligence

- Groq API
- LLaMA 3.3 70B
- Structured LLM tool/function calling
- Intent classification
- Entity extraction
- Confidence scoring
- Natural-language processing

### Backend

- Node.js
- TypeScript
- Express
- Prisma
- SQLite
- Multer
- Groq SDK

### Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- Axios
- Expo Audio
- Expo Speech

### Testing and Automation

- Node.js test tooling
- End-to-end testing
- Regression testing
- Integration contract validation
- GitHub Actions

### Development Tools

- Git
- GitHub
- npm
- Prisma

---

## Project Structure

    Multilingual-AI-Productivity-Assistant/
    |
    +-- backend/
    |   |
    |   +-- prisma/
    |   |   +-- schema.prisma
    |   |
    |   +-- src/
    |   |   |
    |   |   +-- services/
    |   |   |   +-- intentDetection.ts
    |   |   |   +-- conversationService.ts
    |   |   |   +-- stubModules.ts
    |   |   |   +-- actionEntityRegressionCheck.ts
    |   |   |   +-- conversationFallbackCheck.ts
    |   |   |   +-- fallbackRegressionCheck.ts
    |   |   |   +-- intentFallbackCheck.ts
    |   |   |   +-- intentRecognitionRegressionCheck.ts
    |   |   |   +-- speechToTextValidationCheck.ts
    |   |   |
    |   |   +-- index.ts
    |   |
    |   +-- tests/
    |   |   +-- e2e.ts
    |   |
    |   +-- package.json
    |   +-- tsconfig.json
    |   +-- ...
    |
    +-- frontend/
    |   |
    |   +-- src/
    |   |   +-- app/
    |   |       +-- index.tsx
    |   |
    |   +-- package.json
    |   +-- ...
    |
    +-- .github/
    |   +-- workflows/
    |       +-- assistant-validation.yml
    |
    +-- README.md

---

# Installation

## Prerequisites

Make sure the following tools are installed:

- Node.js
- npm
- Git
- Expo development environment
- Android Studio or another supported mobile development environment if running the Android application

An API key for the Groq service is also required for the AI-powered functionality.

---

## Clone the Repository

    git clone https://github.com/zgarnirawen/Multilingual-AI-Productivity-Assistant.git
    cd Multilingual-AI-Productivity-Assistant

---

# Backend Setup

Navigate to the backend:

    cd backend

Install dependencies:

    npm install

Generate the Prisma client:

    npx prisma generate

Initialize or update the database according to the project's Prisma configuration:

    npx prisma migrate dev

Configure the required environment variables.

The AI functionality requires the appropriate Groq API credentials.

---

## Running the Backend

Start the development server:

    npm run dev

The backend will then be available according to the port configured by the application.

---

# Frontend Setup

Navigate to the frontend:

    cd frontend

Install dependencies:

    npm install

Start the Expo development server:

    npx expo start

The application can then be launched using a supported Expo development environment.

---

## Frontend API Configuration

The frontend currently contains environment-specific backend API addresses.

The API base URL is configured in the frontend application.

Before running the mobile application on another device, the backend address may need to be adjusted to match the machine running the backend.

---

# Running Tests

From the backend directory:

    npm test

Run end-to-end tests:

    npm run test:e2e

Run the complete test suite:

    npm run test:all

The repository also contains dedicated regression and validation services for AI behavior.

---

# GitHub Actions CI

The CI workflow is located at:

    .github/workflows/assistant-validation.yml

It validates the application automatically by running build and regression checks.

The workflow includes validation for:

- Backend compilation
- Prisma client generation
- Fallback behavior
- Intent recognition
- Speech-to-text integration contracts
- Optional end-to-end testing

Validation reports can also be uploaded as GitHub Actions artifacts.

---

# Current Scope and Limitations

The project currently represents an AI-powered productivity assistant prototype with a complete natural-language processing and validation workflow.

There are several areas that should be considered before treating the application as production-ready.

### Productivity Integrations

Task and event operations are currently implemented through in-memory stubs.

The next integration stage would connect these operations to the actual productivity modules or external APIs.

### WhatsApp Integration

Although the backend contains a Twilio dependency, the current implementation does not claim a complete production WhatsApp webhook and message-ingestion layer.

The current focus is the AI assistant and its mobile interaction workflow.

### Deployment

The GitHub Actions workflow currently focuses on Continuous Integration and automated validation.

It does not represent a complete production deployment pipeline.

### Frontend API Configuration

The frontend currently contains environment-specific API configuration and should be moved to a proper environment-based configuration system for production use.

### Production Hardening

Before production deployment, additional work would be required around:

- Authentication and authorization
- Secrets management
- API security
- Rate limiting
- Input validation
- Monitoring
- Logging
- Production database configuration
- External service resilience
- Deployment infrastructure
- Observability

---

# Security Considerations

AI-generated decisions should not be treated as inherently reliable.

The application therefore uses several mechanisms to reduce unintended behavior:

- Confidence-based intent recognition
- Structured outputs
- Entity validation
- Explicit action confirmation
- Clarification handling
- Controlled fallback responses
- Regression testing

API keys and other sensitive configuration values should be provided through environment variables rather than committed to the repository.

For a production deployment, additional security mechanisms should be implemented around authentication, authorization, rate limiting, secret management, and API protection.

---

# Future Improvements

Several improvements can extend the current implementation.

## Real Productivity Module Integration

Replace the in-memory stubs with real task and calendar APIs.

Possible integrations could include:

- Task management systems
- Calendar services
- Internal productivity APIs
- Enterprise modules

---

## Production Voice Pipeline

Further improve the speech interaction pipeline by adding:

- Better audio validation
- More robust error handling
- Streaming transcription
- Improved multilingual speech recognition
- Voice activity detection

---

## Improved AI Reliability

Future iterations could introduce:

- More comprehensive intent evaluation datasets
- Automated model evaluation
- Prompt versioning
- Model fallback strategies
- Structured output validation
- AI observability
- Latency monitoring
- Confidence calibration

---

## Production Infrastructure

A production-ready deployment could introduce:

- Containerization
- Environment-specific configurations
- CI/CD deployment stages
- Secrets management
- Monitoring
- Centralized logging
- Health checks
- Automated rollback mechanisms
- Production-grade database infrastructure

---

## Authentication and User Management

The current project can be extended with:

- User authentication
- User-specific productivity data
- Role-based authorization
- Secure session management
- Per-user interaction history

---

# Engineering Focus

The project was designed not only as an AI demonstration but also as a software engineering exercise.

The implementation focuses on the complete flow from user interaction to backend processing and validation.

The main engineering concerns include:

### Separation of Responsibilities

Different services handle different responsibilities:

- Intent detection
- Conversation generation
- Action processing
- Entity normalization
- Speech-to-text
- Persistence
- Regression validation

This reduces coupling between the different parts of the application.

### Controlled AI Execution

The LLM is responsible for interpreting natural-language input, but application logic remains responsible for validating and executing actions.

This creates a separation between:

    AI Interpretation

and:

    Application Execution

This is important when integrating generative AI into applications that can modify persistent state.

### Fallback Handling

The application includes deterministic fallback behavior for cases where:

- The AI service is unavailable
- The intent cannot be recognized
- The request is unsupported
- The request is ambiguous
- Required information is missing

This prevents the application from depending entirely on successful LLM responses.

### Automated Validation

Regression and validation checks are included to make AI-related behavior easier to verify over time.

This is particularly useful because changes to prompts, models, or processing logic can affect previously supported inputs.

---

# What This Project Demonstrates

This project demonstrates practical experience across several areas of modern software and AI engineering.

### Artificial Intelligence

- LLM integration
- Natural-language understanding
- Intent classification
- Entity extraction
- Structured model outputs
- Confidence-based decisions
- Multilingual interaction
- Conversational response generation

### Backend Engineering

- REST API development
- TypeScript
- Express
- Service-oriented backend structure
- Prisma
- SQLite
- External API integration
- Error and fallback handling

### Mobile Development

- React Native
- Expo
- Expo Router
- TypeScript
- Audio recording
- Speech synthesis
- REST API integration

### Software Quality

- Automated testing
- End-to-end testing
- Regression testing
- Integration validation
- Fallback validation

### DevOps and Automation

- Git
- GitHub
- GitHub Actions
- Automated CI workflows
- Build validation
- Test automation
- Artifact generation

---

# Internship Takeaway

Developing this project during my AI Summer Internship at 3LM Solutions provided practical experience in designing and implementing an AI-powered application from the user interaction layer to backend processing and automated validation.

The project allowed me to work on the intersection of:

- Artificial Intelligence
- Backend development
- Mobile development
- Natural Language Processing
- API integration
- Database persistence
- Automated testing
- Continuous Integration

A central lesson from the project was that integrating an LLM into an application is not only about generating responses. A reliable AI application also requires structured outputs, validation, confidence handling, explicit action boundaries, fallbacks, testing, and clear separation between AI interpretation and application execution.

---

# Repository

GitHub repository:

https://github.com/zgarnirawen/Multilingual-AI-Productivity-Assistant

---

# Author

Rawen Zgarni

Computer Engineering Student at ENICarthage

AI, MLOps, DevOps and Software Engineering

Developed during the AI Summer Internship at 3LM Solutions.
