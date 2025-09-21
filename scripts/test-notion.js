import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

(async function () {
  try {
    const db = await notion.databases.retrieve({
      database_id: process.env.NOTION_DB_ID,
    });
    console.log("✅ DB title:", db.title[0].plain_text);
  } catch (err) {
    console.error("❌ Error body:", err.body);
    console.error("❌ Error message:", err.message);
  }
})();
