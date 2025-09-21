import { jest } from "@jest/globals";

// --- Mocks ---
const mockFetch = jest.fn();
jest.unstable_mockModule("node-fetch", () => ({
  default: mockFetch,
}));

const mockNotionPagesCreate = jest.fn();
jest.unstable_mockModule("@notionhq/client", () => ({
  Client: jest.fn(() => ({
    pages: { create: mockNotionPagesCreate },
  })),
}));

const mockResendSend = jest.fn();
jest.unstable_mockModule("resend", () => ({
  Resend: jest.fn(() => ({
    emails: { send: mockResendSend },
  })),
}));

jest.unstable_mockModule("marked", () => ({
  marked: jest.fn((txt) => `<p>${txt}</p>`),
}));

// --- Import after mocks ---
const { generateNote, saveToNotion, sendEmail } = await import(
  "../scripts/learning.js"
);

describe("Learning Digest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("generateNote() calls Gemini and returns parsed text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Gemini mock note" }] } }],
      }),
    });

    const result = await generateNote();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("generativelanguage.googleapis.com"),
      expect.any(Object)
    );

    expect(result.text).toBe("Gemini mock note");
    expect(result.model).toBe("Gemini 1.5 Flash");
  });

  test("generateNote() falls back to Groq if Gemini fails", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, text: async () => "Gemini fail" }) // Gemini fails
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Groq mock note" } }],
        }),
      }); // Groq succeeds

    const result = await generateNote();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("api.groq.com"),
      expect.any(Object)
    );

    expect(result.text).toBe("Groq mock note");
    expect(result.model).toBe("mixtral-8x7b-32768");
  });

  test("saveToNotion() splits long notes", async () => {
    const longNote = "a".repeat(4000);
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
        html: "<p>Hello **world**</p>",
      })
    );
  });
});
