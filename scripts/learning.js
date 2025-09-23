import "dotenv/config";
import fetch from "node-fetch";
import { Client as NotionClient } from "@notionhq/client";
import { Resend } from "resend";
import { marked } from "marked";

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });
const resend = new Resend(process.env.RESEND_API);

// --- Generate Learning Note ---
export async function generateNote() {
  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GOOGLE_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Test prompt" }] }],
        }),
      }
    );

    if (!geminiRes.ok) throw new Error("Gemini failed");
    const geminiData = await geminiRes.json();
    return {
      text: geminiData.candidates[0].content.parts[0].text,
      model: "Gemini 1.5 Flash",
    };
  } catch (err) {
    console.warn("⚠️ Gemini failed:", err.message);
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [{ role: "user", content: "Fallback note" }],
          max_tokens: 300,
        }),
      }
    );

    if (!groqRes.ok) throw new Error("Groq failed");
    const groqData = await groqRes.json();
    return {
      text: groqData.choices[0].message.content.trim(),
      model: "mixtral-8x7b-32768",
    };
  }
}

// --- Save to Notion ---
export async function saveToNotion(note, model) {
  const chunks = note.match(/[\s\S]{1,1900}/g);

  const children = chunks.map((chunk) => ({
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: chunk } }],
    },
  }));

  await notion.pages.create({
    parent: { database_id: process.env.NOTION_DB_ID },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: `Learning Note - ${new Date().toLocaleDateString()} (${model})`,
            },
          },
        ],
      },
    },
    children,
  });

  console.log("✅ Saved to Notion");
}

// --- Send Email ---
export async function sendEmail(note, model) {
  const htmlContent = marked(note);

  await resend.emails.send({
    from: "Leonard's Digest <onboarding@resend.dev>",
    to: process.env.EMAIL_TO,
    subject: `Daily Learning Note (${model})`,
    text: note,
    html: htmlContent,
  });

  console.log("✅ Email sent via Resend");
}


// --- Main ---
// --- Main ---
export async function main() {
  const { text, model } = await generateNote();
  console.log("🚀 TL;DR Summary:", text.slice(0, 120));

  await saveToNotion(text, model);
  await sendEmail(text, model);
  console.log("🎉 All done!");
}

// ✅ Only run main() if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

