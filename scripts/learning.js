import "dotenv/config";
import fetch from "node-fetch";
import { Client as NotionClient } from "@notionhq/client";
import { Resend } from "resend";
import { marked } from "marked";


const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });
const resend = new Resend(process.env.RESEND_API);

// --- Generate Learning Note ---
async function generateNote() {
  // Try Gemini first
  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GOOGLE_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a tutor generating a short daily learning digest for a full-stack engineer.

                  Requirements:
                  - Pick 1 topic per day from all these categories:
                    - JavaScript / TypeScript fundamentals
                    - React / Next.js features
                    - Node.js backend techniques
                    - API design and integration
                    - DevOps (CI/CD, GitHub Actions, Docker, Kubernetes)
                    - Cloud services (AWS, Azure, GCP)
                    - Software architecture (monolith vs microservices, event-driven, serverless)
                    - Design patterns (Factory, Observer, Singleton, etc.)
                    - Modern front-end architecture (atomic design, state management, hooks)
                    - New or emerging features in web tech (Edge functions, Bun, Vite, server components)

                  Format:
                  - **TL;DR (1–2 sentences)**: the big idea in plain English but make simplle and memorable
                  - **Explanation (3–6 sentences)**: how it works and why it’s useful
                  - **Code Example**: a short, clear snippet

                  Use Markdown formatting (**bold**, \`code\`, \`\`\`fences\`\`\`).
                  Make it practical (something that could help in real projects as well as building to senioor developer providing huge value).
                  Do not repeat previous notes

                  Output only ONE daily note. Do not include multiple days.
                  do not max the 2000 word limit.
                  Keep the explanation to no more than 6 sentences and code example to ~20 lines.

.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error("Gemini failed: " + errBody);
    }
    const geminiData = await geminiRes.json();
    return {
      text: geminiData.candidates[0].content.parts[0].text,
      model: "Gemini 1.5 Flash",
    };
  } catch (err) {
    console.warn("⚠️ Gemini failed:", err.message);

    // Fallback: Groq
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
          messages: [
            {
              role: "system",
              content: "You are a concise tutor for modern web dev.",
            },
            {
              role: "user",
              content:
                "Summarise one modern web development concept concisely with a short code example.",
            },
          ],
          max_tokens: 300,
        }),
      }
    );

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      throw new Error("Groq failed: " + errBody);
    }
    const groqData = await groqRes.json();
    return {
      text: groqData.choices[0].message.content.trim(),
      model: "mixtral-8x7b-32768",
    };
  }
}

// --- Save to Notion ---
async function saveToNotion(note, model) {
  const chunks = note.match(/[\s\S]{1,1900}/g); // split into ~1900 char chunks

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






async function sendEmail(note, model) {
  try {
    const htmlContent = marked(note);

    await resend.emails.send({
      from: "Leonard's Digest <onboarding@resend.dev>", // change to a custom sender later
      to: process.env.EMAIL_TO,
      subject: `Daily Learning Note (${model})`,
      text: note, // plain text fallback
      html: htmlContent,
    });

    console.log("✅ Email sent via Resend");
  } catch (err) {
    console.error("❌ Email failed via Resend:", err);
  }
}


// --- Main ---
async function main() {
  const { text, model } = await generateNote();
  console.log("📝 Generated note:", text);

  await saveToNotion(text, model);
  await sendEmail(text, model);
  console.log("🎉 All done!");
}

main().catch(console.error);
