
# Cognee Cloud Memory Skill

## Prerequisites

Set these env vars before use:

- COGNEE_BASE_URL=https://tenant-e49b36eb-62fb-48f3-a123-f5db20a69429.aws.cognee.ai

-COGNEE_API_KEY=b8476d076f41684f36689d6a5fb9c73d6879a3c629c31f326868e0bc46a48d57

## Ping first

curl -fsS "$env:COGNEE_BASE_URL/api/v1/datasets/" -H "X-Api-Key: $env:COGNEE_API_KEY"

## Remember

curl -X POST "$env:COGNEE_BASE_URL/api/v1/remember/entry" -H "X-Api-Key: $env:COGNEE_API_KEY" -H "Content-Type: application/json" -d "{\"entry\":{\"type\":\"qa\",\"question\":\"topic\",\"answer\":\"knowledge\"},\"dataset_name\":\"default_dataset\",\"session_id\":\"SESSION_ID\"}"

## Recall

curl -X POST "$env:COGNEE_BASE_URL/api/v1/recall" -H "X-Api-Key: $env:COGNEE_API_KEY" -H "Content-Type: application/json" -d "{\"query\":\"your question\",\"session_id\":\"SESSION_ID\"}"

