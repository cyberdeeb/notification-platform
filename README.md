# Notification Platform

![CI](https://github.com/YOUR_USERNAME/notification-platform/actions/workflows/ci.yml/badge.svg)

A real-time, event-driven notification platform built with a microservices architecture. External services send webhook events to the platform, which routes them through a message broker and delivers notifications to users via email or SMS.

---

## Architecture

```
External Service
      │
      ▼
┌─────────────────┐
│ Webhook Service │  ← Receives & validates incoming webhook events
└────────┬────────┘
         │ publishes to
         ▼
┌─────────────────┐
│    RabbitMQ     │  ← Message broker (raw-events queue)
└────────┬────────┘
         │ consumed by
         ▼
┌─────────────────┐
│ Router Service  │  ← Routes events to the correct downstream queue
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ Email │ │  SMS  │  ← Workers look up user in Postgres, send notification
│Worker │ │Worker │
└───────┘ └───────┘
    │         │
    ▼         ▼
 Resend   Textbelt       On failure (nack)
(Email)    (SMS)               │
                               ▼
                    ┌──────────────────────┐
                    │ Dead Letter Service  │  ← Catches & logs failed messages
                    └──────────────────────┘
```

---

## Services

### Webhook Service

The public-facing entry point. Receives `POST /webhook` requests, validates and normalizes the payload, then publishes it to the `raw-events` queue in RabbitMQ. Rejects any request missing `provider`, `event`, or `userId`.

### Router Service

Subscribes to the `raw-events` queue. Reads the `event` field and routes the message to the appropriate downstream queue — `sms-notifications` for SMS events, `email-notifications` for everything else.

### Email Worker

Subscribes to `email-notifications`. Looks up the user by `userId` in Postgres, then sends a formatted email notification via the Resend API.

### SMS Worker

Subscribes to `sms-notifications`. Looks up the user by `userId` in Postgres, then sends an SMS notification via the Textbelt API.

### Dead Letter Service

Subscribes to `dead-letter-queue`. When a message is rejected by any worker — for example due to an unknown `userId` — RabbitMQ automatically routes it here. Logs the full message content and death headers including origin queue, failure reason, and timestamp.

---

## Tech Stack

| Technology              | Purpose                          |
| ----------------------- | -------------------------------- |
| TypeScript              | Language                         |
| Node.js                 | Runtime                          |
| Express                 | HTTP server (webhook service)    |
| RabbitMQ                | Message broker / Pub-Sub         |
| PostgreSQL              | User database                    |
| Docker & Docker Compose | Containerization & orchestration |
| Resend                  | Email delivery                   |
| Textbelt                | SMS delivery                     |
| GitHub Actions          | CI/CD pipeline                   |
| Dead Letter Queue       | Failed message recovery          |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Resend](https://resend.com) account and API key
- A [Textbelt](https://textbelt.com) API key (use `textbelt` for 1 free SMS/day)

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/notification-platform.git
cd notification-platform
```

### 2. Set up environment variables

Each service has a `.env.example` file. Copy it to `.env` and fill in your values:

```bash
cp .env.example .env
cp services/webhook-service/.env.example services/webhook-service/.env
cp services/router-service/.env.example services/router-service/.env
cp services/email-worker/.env.example services/email-worker/.env
cp services/sms-worker/.env.example services/sms-worker/.env
```

The following keys are required across the service `.env` files:

**Root `.env`**

```
RABBITMQ_USER=
RABBITMQ_PASS=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
```

**`services/webhook-service/.env`**

```
PORT=
RABBITMQ_URL=
```

**`services/router-service/.env`**

```
RABBITMQ_URL=
```

**`services/email-worker/.env`**

```
RABBITMQ_URL=
POSTGRES_URL=
RESEND_API_KEY=
FROM_EMAIL=
```

**`services/sms-worker/.env`**

```
RABBITMQ_URL=
POSTGRES_URL=
TEXTBELT_API_KEY=
```

### 3. Start the platform

> ⚠️ Make sure `.env` files are listed in your `.gitignore` and never committed to version control.

```bash
docker compose up --build
```

All seven containers will start — RabbitMQ, Postgres, webhook service, router service, email worker, SMS worker, and dead letter service.

---

## Testing

The database is seeded with the following dummy users on startup:

| userId   | Name          | Email               | Phone        |
| -------- | ------------- | ------------------- | ------------ |
| user_123 | Alice Johnson | alice@example.com   | +10000000001 |
| user_456 | Bob Smith     | bob@example.com     | +10000000002 |
| user_789 | Charlie Brown | charlie@example.com | +10000000003 |
| user_101 | David Wilson  | david@example.com   | +10000000004 |

### Test email notification

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"provider": "github", "event": "push", "userId": "user_123", "data": {"repo": "my-project"}}'
```

### Test SMS notification

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"provider": "twilio", "event": "sms", "userId": "user_123", "data": {"message": "test notification"}}'
```

### Test with your own contact info

To receive a real email or SMS, update a user's email/phone in `db/init.sql`, then reseed:

```bash
docker compose down -v
docker compose up --build
```

### RabbitMQ Dashboard

Visit [http://localhost:15672](http://localhost:15672) and log in with the `RABBITMQ_USER` and `RABBITMQ_PASS` values you set in your root `.env` file to monitor queues and messages in real time.

---

## Webhook Payload Schema

All incoming webhook requests must follow this structure:

```json
{
  "provider": "github",
  "event": "push",
  "userId": "user_123",
  "data": {}
}
```

| Field    | Type   | Required | Description                                  |
| -------- | ------ | -------- | -------------------------------------------- |
| provider | string | ✅       | Source of the event (e.g. github, stripe)    |
| event    | string | ✅       | Event type. Use `sms` to route to SMS worker |
| userId   | string | ✅       | Must match a user in the database            |
| data     | object | ❌       | Any additional event metadata                |

---

## Dead Letter Queue

Failed messages are automatically routed to a dead letter queue instead of being dropped. This ensures no message is silently lost.

### How it works

Every queue in the platform (`raw-events`, `email-notifications`, `sms-notifications`) is configured with a dead letter exchange. When a message is rejected — for example because a `userId` doesn't exist in the database — RabbitMQ automatically forwards it to the `dead-letter-queue` instead of discarding it.

A dedicated **dead-letter-service** subscribes to `dead-letter-queue` and logs each failed message along with its death headers, which include the origin queue, reason for failure, and timestamp.

### Test the dead letter queue

Send a webhook with a `userId` that doesn't exist in the database:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"provider": "github", "event": "push", "userId": "user_999", "data": {"repo": "my-project"}}'
```

You should see the email worker warn that the user was not found, and the dead letter service log the failed message with full death headers showing which queue it came from and why it was rejected.

---

## CI/CD

The GitHub Actions pipeline runs on every push to `main` and every pull request. It installs dependencies, compiles TypeScript, and builds all Docker images across every service to catch errors before they reach production.
