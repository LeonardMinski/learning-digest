# Learning Digest Automation

This repo automatically generates a daily learning note using OpenAI,
saves it to Notion, and emails it to you via GitHub Actions.

## Setup
1. Add secrets in **Settings > Secrets and variables > Actions**:
   - OPENAI_API_KEY
   - NOTION_TOKEN
   - NOTION_DB_ID
   - EMAIL_USER (Gmail/SMTP user)
   - EMAIL_PASS (Gmail app password)
   - EMAIL_TO (your address)

2. Adjust cron schedule in `.github/workflows/learning.yml` if needed.

3. Push changes to GitHub. Workflow will run daily.
