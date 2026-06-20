import JSZip from "jszip";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import type { MarkdownParser } from "./ingestion";

export class SourceFileMarkdownParser implements MarkdownParser {
  async parseToMarkdown(input: { bytes: Uint8Array; filename: string; mimeType: string }) {
    if (input.mimeType === "application/pdf") {
      return parsePdf(input.bytes);
    }

    if (input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(input.bytes) });
      return result.value.trim();
    }

    if (input.mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      return parsePptx(input.bytes);
    }

    if (input.mimeType === "text/html" || input.mimeType === "application/xhtml+xml") {
      return htmlToMarkdown(new TextDecoder().decode(input.bytes));
    }

    throw new Error(`Unsupported parser for ${input.filename}.`);
  }
}

async function parsePdf(bytes: Uint8Array) {
  const parser = new PDFParse({ data: Buffer.from(bytes) });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

async function parsePptx(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

  const slides: string[] = [];
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile]?.async("text");
    if (!xml) {
      continue;
    }
    const text = Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g))
      .map((match) => decodeXml(match[1] ?? ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      slides.push(`## ${slideFile.split("/").pop()?.replace(".xml", "")}\n\n${text}`);
    }
  }

  return slides.join("\n\n").trim();
}

function htmlToMarkdown(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}
