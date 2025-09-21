import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

(async () => {
  try {
    const response = await notion.search({
      filter: { property: "object", value: "database" },
    });
    console.log(
      "Databases available:",
      response.results.map((db) => db.id)
    );
  } catch (err) {
    console.error("❌", err.body || err.message);
  }
})();
