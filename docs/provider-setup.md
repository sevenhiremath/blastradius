# Optional AI provider setup

The graph policy agent runs without an API key. The model tool agent needs a configured provider.

## Free-plan route: Groq

Create a key at https://console.groq.com/keys and keep the account on its Free plan. The Free plan has model-specific rate limits; paid Developer access is a separate upgrade. Availability and quotas depend on the account. See [Groq billing](https://console.groq.com/docs/billing-faqs) and [rate limits](https://console.groq.com/docs/rate-limits).

Put the key in the local `.env` file as `LLM_API_KEY=...`, then run:

```sh
node scripts/configure-provider.js groq
docker compose up -d --build --wait app
```

This sets the compatible endpoint and `qwen/qwen3.8-27b`, a model listed in Groq's tool-use documentation. Your actual account must have access. The script preserves the key and does not print it. If the free quota is exceeded, wait for the quota to reset rather than upgrading as part of the demo.

## OpenAI route

Create a key at https://platform.openai.com/api-keys. Creating a key does not itself provide API credits. API use can incur charges. Put it in `.env`, then run:

```sh
node scripts/configure-provider.js openai
docker compose up -d --build --wait app
```

## Run the model agent

Reload the app, run a graph investigation, open **Response desk**, and select **Run AI tool agent**. The actual model-requested tools, their inputs, query text, and results appear alongside the interpretation. No production changes or external messages are available to the agent.

Never paste keys into the chat, screenshots, README, or a source-code file. `.env` is excluded from Git and the Docker build context; its variables are passed only to the local app container. Do not run or publish expanded Docker configuration or container inspection output containing environment variables.

References: [Groq compatible endpoint](https://console.groq.com/docs/openai), [supported tool-use models](https://console.groq.com/docs/tool-use/overview), [OpenAI setup](https://developers.openai.com/api/docs/quickstart).
