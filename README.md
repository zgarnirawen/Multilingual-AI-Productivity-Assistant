# Multilingual AI Productivity Assistant

A full-stack AI productivity assistant developed during an **AI Summer Internship at 3LM Solutions**. The project combines natural-language understanding, conversational AI, voice interaction, productivity APIs, persistent interaction history, automated regression testing, and GitHub Actions validation.

## Project Overview

The assistant lets users interact with productivity features through natural language in **French or English**.

The application can:

- detect the user's intent
- extract and normalize action entities
- handle ambiguous or incomplete requests
- generate contextual conversational responses
- propose actions before execution
- require explicit confirmation before executing actions
- create, modify, delete, and search tasks
- create, modify, delete, and search agenda events
- interact with productivity services through typed connector abstractions
- process voice input through speech-to-text
- provide spoken responses through text-to-speech
- persist interaction history
- fall back safely when an AI provider is unavailable
- validate AI behavior and integrations through automated tests

The main engineering principle is to keep **AI interpretation separate from application execution**. The LLM interprets the request, while application logic validates the result, handles confirmation, and executes the selected productivity action.

---

## Architecture

```
                 React Native / Expo
                         |
                         | REST / Axios
                         v
                  Express Backend
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
     LLM Services     Prisma/SQLite   Speech Services
          |              |              |
          v              v              v
 Intent Detection   Interaction      Speech-to-Text
 Entity Extraction     History       Text-to-Speech
 Conversation
 Generation
          |
          v
    Action Validation
          |
          v
   Confirmation Flow
          |
          v
 Productivity Connector Layer
          |
       +--+--+
       |     |
       v     v
     Todo  Agenda
       |     |
       v     v
   HTTP API / Stub
```

### Processing flow

```
User text or voice
       |
       v
Speech-to-Text (voice input)
       |
       v
Intent Detection
       |
       v
Entity Extraction / Normalization
       |
       v
Validation and Target Resolution
       |
       +-----------------------------+
       |                             |
       v                             v
Complete request              Missing/Ambiguous
       |                             |
       v                             v
Action Proposal                Clarification
       |
       v
User Confirmation
       |
    +--+--+
    |     |
   YES    NO
    |     |
    v     v
Execute  Cancel
    |
    v
Todo / Agenda Connector
    |
    v
Persist Interaction
```

---

## AI Capabilities

### Intent Detection

The backend uses Groq and an LLM to classify natural-language requests into structured application intents.

Supported intents include:

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

The assistant also extracts action-specific entities such as:

- task/event titles
- dates
- durations
- contact-related information
- other parameters required by the requested action

The implementation uses structured LLM outputs and application-side validation rather than allowing raw model output to directly modify application state.

### Confidence and clarification

Intent recognition includes confidence handling and validation of required information.

The assistant can distinguish between:

- recognized requests
- low-confidence requests
- unsupported requests
- incomplete requests
- ambiguous targets

When information is insufficient, the application can ask for clarification instead of inventing missing values.

### Conversational responses

Conversational response generation is separated from intent recognition.

The conversation service uses the Groq SDK and supports French and English responses. Deterministic fallback responses are available when the AI service cannot be used.

---

## LLM Reliability and Fallback

The backend includes model fallback and bounded retry behavior.

The fallback logic is explicitly tested for:

- HTTP 429 rate limiting with model failover
- bounded retries for 5xx provider errors
- network errors such as timeouts
- non-retryable errors
- exhausted primary and fallback models

This prevents a single transient provider failure from immediately breaking the assistant while avoiding unbounded retries.

The project also includes deterministic title-routing checks to keep title-related action handling predictable.

---

## Action Confirmation

Action execution is protected by an explicit confirmation step.

For an action-oriented request, the assistant first proposes the interpreted action. The application executes it only after confirmation.

Example:

```
User:
Create a task to prepare my report for 30 minutes.

Assistant:
I can create a 30-minute task called "Prepare my report".
Would you like me to proceed?

User:
Yes.

Assistant:
Task created.
```

The frontend maintains state for pending actions, confirmation, cancellation, modification, and clarification.

This creates a clear boundary between:

**AI interpretation**

and

**application execution**.

---

## Productivity Connector Architecture

Productivity integrations are isolated behind typed connector contracts.

### Todo

The Todo connector includes:

```
backend/src/connectors/todo/
├── TodoConnector.ts
├── TodoApiConnector.ts
└── StubTodoConnector.ts
```

The HTTP implementation supports:

- listing tasks
- retrieving a task by ID
- searching by title
- creating tasks
- updating tasks
- deleting tasks
- Bearer-token authentication
- explicit 404 handling
- propagation of unexpected downstream errors

### Agenda

The Agenda connector includes:

```
backend/src/connectors/agenda/
├── AgendaConnector.ts
├── AgendaApiConnector.ts
└── StubAgendaConnector.ts
```

The HTTP implementation supports:

- listing events
- filtering by date range
- retrieving an event by ID
- searching by title
- creating events
- updating events
- deleting events
- Bearer-token authentication
- explicit 404 handling
- propagation of unexpected downstream errors

The connector entry point is:

```
backend/src/connectors/index.ts
```

Assistant actions are routed through these interfaces instead of being coupled directly to a concrete productivity implementation. Stubs remain available for deterministic local validation, while the HTTP connectors provide the integration boundary for real services.

---

## Voice Interaction

The mobile application supports voice interaction through Expo audio and speech capabilities.

### Voice input

```
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
```

The backend exposes the transcription flow through the assistant API.

### Spoken responses

The frontend also uses Expo Speech to provide spoken assistant responses.

This creates the complete interaction:

```
User speaks
    |
    v
Speech-to-Text
    |
    v
AI processing
    |
    v
Assistant response
    |
    v
Text-to-Speech
```

---

## Frontend

The frontend is built with:

- React Native
- Expo SDK 54
- Expo Router
- TypeScript
- Axios
- Expo Audio
- Expo Speech

It provides:

- chat interaction
- text input
- voice recording
- assistant responses
- action proposals
- confirmation and cancellation
- clarification flows
- quick actions
- French and English UI messages

### Frontend API configuration

The backend URL is configurable through an Expo environment variable:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

A template is provided in:

```
frontend/.env.example
```

If the variable is omitted, the frontend defaults to `http://localhost:3000`.

This removes the previous hard-coded machine-specific backend address.

---

## Backend

The backend is built with:

- Node.js
- TypeScript
- Express
- Prisma
- SQLite
- Groq SDK
- Multer
- Twilio dependency

Responsibilities include:

- natural-language processing
- intent detection
- entity extraction
- conversational response generation
- speech-to-text handling
- confirmation and action processing
- productivity connector routing
- interaction-history persistence
- automated AI and integration validation

### Database

Prisma with SQLite is used for local persistence.

The schema is located at:

```
backend/prisma/schema.prisma
```

Interaction history stores structured information about assistant usage, including user input, input mode, detected intent, action information, and timestamps.

Local SQLite database files are ignored by Git.

---

# Evaluation and Automated Validation

The project contains several layers of automated validation because LLM behavior and external API behavior need different forms of testing.

## Deterministic validation

The backend includes checks for:

- intent recognition regression
- action entity regression
- intent generalization
- entity extraction
- deterministic title routing
- model fallback behavior
- Todo/Agenda connector contracts
- HTTP productivity connector behavior
- speech-to-text integration contracts
- backend compilation

Key commands:

```bash
npm run build
npm run test:connectors
npm run test:api-connectors
npm run test:entities
npm run test:generalization
npm run test:model-fallback
npm run test:title-routing
```

## Frozen evaluation dataset

A dedicated 65-case evaluation dataset is available through:

```bash
npm run test:dataset-evaluation
```

It evaluates multiple intents and entity extraction behavior and produces:

```
evaluation-results/dataset-metrics.json
```

The dataset evaluation is kept separate from the regression gate so that provider/rate-limit problems do not get confused with model-quality regressions.

A partial provider run is reported as **DEGRADED** rather than being presented as a full quality benchmark.

### Latest observed CI dataset run

The latest live Groq CI run completed:

- 65 total cases
- 62 completed cases
- 3 provider/evaluation errors
- 95.4% coverage
- 93.5% intent accuracy on completed cases
- 88.2% entity accuracy/recall
- 51.7% entity precision
- 43.1% unexpected entity rate
- 6.66 s average latency
- 0.915 average confidence
- provider/evaluation errors: 2 rate-limit errors and 1 evaluation error

Because this was a partial provider run, the workflow correctly marked the dataset benchmark **DEGRADED** and did not treat those results as a full-dataset quality benchmark.

## Regression gate

The project has a separate LLM regression gate:

```
backend/evaluation-baseline.json
```

Current configured baseline:

```json
{
  "intentGeneralization": 100,
  "entityExtraction": 100,
  "minAccuracy": 95,
  "maxRegressionDrop": 5
}
```

The gate checks:

- intent generalization against its baseline
- entity extraction against its baseline
- minimum required accuracy
- maximum allowed regression

The latest CI gate reported:

```
Intent generalization: current=100.0%, baseline=100.0%, regression=0.0pp PASS
Entity extraction: current=100.0%, baseline=100.0%, regression=0.0pp PASS

Evaluation gate passed.
```

These gate metrics are distinct from the partial 65-case dataset metrics above.

---

# Continuous Integration

GitHub Actions workflow:

```
.github/workflows/assistant-validation.yml
```

The workflow contains three validation areas.

### Offline backend validation

The CI pipeline:

1. checks out the repository
2. installs backend dependencies with `npm ci`
3. generates the Prisma client
4. builds the backend
5. runs deterministic intent regression checks
6. runs deterministic title-routing checks
7. validates model fallback behavior
8. validates connector contracts
9. validates HTTP productivity connectors
10. validates the speech-to-text contract

### Live LLM evaluation

When `GROQ_API_KEY` is available, CI runs:

- intent generalization evaluation
- entity extraction evaluation
- the frozen 65-case dataset evaluation
- the LLM regression gate
- evaluation-result artifact upload

The live model evaluations are isolated from pull requests originating from forks so that repository secrets are not exposed.

Provider/rate-limit failures are recorded in the evaluation results rather than being incorrectly interpreted as application-quality regressions.

### Frontend validation

The frontend CI job runs:

```bash
npm ci
npx tsc --noEmit
npm run lint
```

This validates the Expo frontend's TypeScript compilation and lint configuration.

---

## Latest CI Status

The current feature branch completed the GitHub Actions validation successfully.

The latest workflow run included a successful live Groq evaluation job and a passing LLM regression gate.

The CI workflow also validates the frontend TypeScript and ESLint configuration.

Evaluation reports are uploaded as GitHub Actions artifacts when live LLM evaluation is enabled.

---

# Project Structure

```
Multilingual-AI-Productivity-Assistant/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── connectors/
│   │   │   ├── agenda/
│   │   │   ├── todo/
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   └── productivity.ts
│   │   └── services/
│   │       ├── intentDetection.ts
│   │       ├── conversationService.ts
│   │       ├── modelFallback.ts
│   │       ├── datasetEvaluationCheck.ts
│   │       ├── evaluationGateCheck.ts
│   │       ├── entityExtractionCheck.ts
│   │       ├── intentGeneralizationCheck.ts
│   │       ├── modelFallbackCheck.ts
│   │       ├── deterministicTitleRoutingCheck.ts
│   │       ├── connectorContractCheck.ts
│   │       └── apiConnectorCheck.ts
│   ├── evaluation-baseline.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── hooks/
│   ├── .env.example
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── assistant-validation.yml
│
└── README.md
```

---

# Installation

## Prerequisites

- Node.js 22 recommended for CI compatibility
- npm
- Git
- Expo development environment
- Android Studio or another supported Expo/mobile environment for native testing
- Groq API credentials for live AI functionality

## Clone

```bash
git clone https://github.com/zgarnirawen/Multilingual-AI-Productivity-Assistant.git
cd Multilingual-AI-Productivity-Assistant
```

## Backend

```bash
cd backend
npm install
npx prisma generate
```

Configure the required environment variables, including the Groq API credentials and any Todo/Agenda API configuration required by the concrete connector implementations.

Start the backend:

```bash
npm run dev
```

## Frontend

```bash
cd frontend
npm install
```

Create `.env` from the provided example when needed:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Start Expo:

```npm
npx expo start
```

For web:

```bash
npm run web
```

---

# Testing

From `backend/`:

```bash
npm test
npm run test:e2e
npm run test:all
npm run build
npm run test:connectors
npm run test:api-connectors
npm run test:entities
npm run test:generalization
npm run test:dataset-evaluation
npm run test:model-fallback
npm run test:title-routing
npm run test:evaluation-gate
```

From `frontend/`:

```bash
npx tsc --noEmit
npm run lint
```

---

# Scope and Limitations

The current project focuses on the AI assistant, mobile interaction workflow, productivity connector architecture, and automated validation.

### Productivity services

The Todo and Agenda HTTP connectors are integration-ready and support CRUD operations, search, Agenda date-range queries, optional Bearer authentication, 404 handling, and downstream error propagation.

The concrete external service endpoints and credentials remain environment-specific.

### Authentication

Authentication for the surrounding application is outside the AI assistant implementation scope.

### CI vs CD

The GitHub Actions workflow is a **Continuous Integration and automated validation pipeline**. It is not a production Continuous Delivery/Deployment pipeline.

### Production hardening

A production deployment would still require additional work around:

- authentication and authorization
- secrets management
- rate limiting
- API security
- monitoring and observability
- production database infrastructure
- logging
- deployment infrastructure
- external-service resilience

---

# Engineering Principles Demonstrated

## Separation of responsibilities

The project separates:

- intent detection
- entity extraction
- conversation generation
- action validation
- confirmation
- persistence
- productivity connector execution
- automated evaluation

## Controlled AI execution

The LLM interprets user requests, but application code validates and executes the resulting action.

## Pluggable integrations

Todo and Agenda connector interfaces allow the same assistant workflow to use deterministic stubs or HTTP implementations.

## Reliability

Fallback behavior, bounded retries, clarification flows, explicit confirmation, and validation reduce the risk of uncontrolled AI-driven actions.

## Automated AI evaluation

The project uses both deterministic regression checks and live LLM evaluation. The frozen dataset provides broader measurement, while the regression gate protects against measurable degradation in key evaluation suites.

---

# What the Project Demonstrates

### AI / NLP

- LLM integration
- natural-language understanding
- intent classification
- entity extraction
- structured model outputs
- confidence handling
- multilingual interaction
- conversational response generation
- model fallback and retry handling

### Backend Engineering

- TypeScript
- Node.js
- Express
- REST APIs
- Prisma
- SQLite
- external API integration
- typed connector abstractions
- HTTP authentication
- error handling

### Mobile Development

- React Native
- Expo
- Expo Router
- TypeScript
- audio recording
- speech-to-text integration
- text-to-speech
- REST API integration

### Software Quality

- automated testing
- regression testing
- evaluation datasets
- model reliability checks
- connector contract validation
- HTTP integration validation
- error-path testing

### DevOps / MLOps

- Git
- GitHub
- GitHub Actions
- automated CI
- build validation
- live LLM evaluation
- regression gates
- evaluation artifact generation

---

# Internship Context

This project was developed during an **AI Summer Internship at 3LM Solutions**.

The work provided practical experience across AI application engineering, backend development, mobile interaction, API integration, automated testing, and CI-based AI validation.

A central lesson from the project was that integrating an LLM into an application requires more than generating responses. Reliable AI features also need structured outputs, validation, confidence handling, explicit action boundaries, fallbacks, external-service error handling, automated evaluation, and regression protection.

---

# Author

**Rawen Zgarni**

Computer Engineering Student — ENICarthage

Focus areas: AI, MLOps, DevOps, and Software Engineering

Developed during the AI Summer Internship at 3LM Solutions.
