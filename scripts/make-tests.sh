#!/bin/bash

echo "🧪 Creating Jest test file..."

# Ensure test folder exists
mkdir -p __tests__

# Create the test file
cat > __tests__/learning.test.js << 'EOF'
import { jest } from "@jest/globals";

// --- Mocks ---
global.fetch = jest.fn();

const mockNotionPagesCreate = jest.fn();
jest.unstable_mockModule("@notionhq/client", () => ({
  Client: jest.fn(() => ({
    pages: { create: mockNotionPagesCreate }
  }))
}));

const mockResendSend = jest.fn();
jest.unstable_mockModule("resend", () => ({
  Resend: jest.fn(() => ({
    emails: { send: mockResendSend }
  }))
}));

jest.unstable_mockModule("marked", () => ({
  marked: jest.fn((txt) => `<p>${txt}</p>`)
}));

// --- Import after mocks ---
const { generateNote, saveToNotion, sendEmail } = await import("../scripts/learning.js");

// --- Tests ---
describe("Learning Digest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("generateNote() returns Gemini result", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: "**TL;DR:** Test Gemini note" }] } }
        ]
      })
    });

    const result = await generateNote();
    expect(result.text).toContain("Test Gemini note");
    expect(result.model).toBe("Gemini 1.5 Flash");
  });

  test("generateNote() falls back to Groq", async () => {
    fetch
      .mockResolvedValueOnce({ ok: false, text: async () => "Gemini fail" }) // Gemini
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Groq fallback note" } }]
        })
      }); // Groq

    const result = await generateNote();
    expect(result.text).toContain("Groq fallback note");
    expect(result.model).toBe("mixtral-8x7b-32768");
  });

  test("saveToNotion() splits long notes", async () => {
    const longNote = "a".repeat(4000); // longer than 2000
    await saveToNotion(longNote, "TestModel");

    expect(mockNotionPagesCreate).toHaveBeenCalled();
    const args = mockNotionPagesCreate.mock.calls[0][0];
    expect(args.children.length).toBeGreaterThan(1);
  });

  test("sendEmail() calls Resend with HTML + text", async () => {
    await sendEmail("Hello **world**", "TestModel");
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: process.env.EMAIL_TO,
        text: "Hello **world**",
        html: "<p>Hello **world**</p>"
      })
    );
  });
});
EOF

echo "✅ Test file created at __tests__/learning.test.js"
