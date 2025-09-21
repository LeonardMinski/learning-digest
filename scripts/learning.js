import OpenAI from "openai";
import { Client as NotionClient } from "@notionhq/client";
import nodemailer from "nodemailer";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });

async function main() {
  const completion = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "Summarise one modern web dev concept concisely with a code example." }
    ]
  });

  const note = completion.choices[0].message.content.trim();

  await notion.pages.create({
    parent: { database_id: process.env.NOTION_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `Learning Note - ${new Date().toLocaleDateString()}` } }] }
    },
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: note } }]
        }
      }
    ]
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: "Daily Learning Note",
    text: note
  });

  console.log("✅ Learning note saved to Notion & emailed!");
}

main().catch(console.error);
