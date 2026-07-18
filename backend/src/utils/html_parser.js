import * as cheerio from "cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Walks the DOM tree preorder to find headings and structural content blocks.
 * Keeps headings and content blocks in document order while tracking section headers.
 * 
 * @param {string} htmlContent - Raw HTML input string.
 * @returns {Array<{header: string|null, text: string}>} - Extracted sections with headers.
 */
export function parseHTMLToSections(htmlContent) {
  const $ = cheerio.load(htmlContent);

  // Strip scripts, styles, nav, and footers entirely
  $("script, style, nav, footer").remove();

  // Strip system-added import header metadata (h1, p, hr)
  $("p").each((_i, el) => {
    const text = $(el).text().trim();
    if (/^Imported from (Word Document|PDF|Plain Text)$/i.test(text)) {
      // Remove preceding h1 (document title) if it exists
      const prevH1 = $(el).prev("h1");
      if (prevH1.length > 0) {
        prevH1.remove();
      }
      // Remove following hr if it exists
      const nextHr = $(el).next("hr");
      if (nextHr.length > 0) {
        nextHr.remove();
      }
      // Remove the metadata paragraph itself
      $(el).remove();
    }
  });

  const sections = [];
  let currentSectionHeader = "";
  let currentSectionText = "";

  const isHeading = (tagName) => ["h1", "h2", "h3", "h4"].includes(tagName);
  
  const blockTags = ["h1", "h2", "h3", "h4", "p", "ul", "ol", "tr", "table", "div", "section", "article", "header", "footer", "blockquote", "pre"];
  
  function hasBlockChildren(node) {
    if (!node.children) return false;
    return node.children.some(child => child.name && blockTags.includes(child.name.toLowerCase()));
  }

  const isContentBlock = (tagName, node) => {
    if (["p", "ul", "ol", "tr", "li", "td", "blockquote", "pre"].includes(tagName)) {
      return true;
    }
    if (tagName === "div" && !hasBlockChildren(node)) {
      return true;
    }
    return false;
  };

  // Custom depth-first tree traversal
  function walk(node) {
    if (!node) return;

    // Process text nodes directly if they contain text
    if (node.type === "text") {
      const text = $(node).text().trim();
      if (text) {
        if (currentSectionText) {
          currentSectionText += "\n\n" + text;
        } else {
          currentSectionText = text;
        }
      }
      return;
    }

    const tagName = node.name ? node.name.toLowerCase() : "";

    if (isHeading(tagName) || isContentBlock(tagName, node)) {
      const text = $(node).text().trim();
      if (text) {
        if (isHeading(tagName)) {
          // If we have accumulated text from the previous section, save it
          if (currentSectionText.trim()) {
            sections.push({
              header: currentSectionHeader || null,
              text: currentSectionText.trim(),
            });
            currentSectionText = "";
          }
          currentSectionHeader = text;
        } else {
          // Append block text to the current section
          if (currentSectionText) {
            currentSectionText += "\n\n" + text;
          } else {
            currentSectionText = text;
          }
        }
      }
      // Return early to avoid processing children of headings/blocks twice
      return;
    }

    if (node.children) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  // Walk the body (or root if body is not present)
  const rootNode = $("body")[0] || $.root()[0];
  walk(rootNode);

  // Don't forget the last section
  if (currentSectionText.trim()) {
    sections.push({
      header: currentSectionHeader || null,
      text: currentSectionText.trim(),
    });
  }

  return sections;
}

/**
 * Splits sections into semantically coherent chunks using RecursiveCharacterTextSplitter.
 * 
 * @param {Array<{header: string|null, text: string}>} sections - Extracted sections.
 * @param {number} chunkSize - Maximum chunk size in characters.
 * @param {number} chunkOverlap - Overlap size in characters.
 * @returns {Promise<Array<{content: string, section_header: string|null, chunk_index: number}>>}
 */
export async function chunkSections(sections, chunkSize = 1200, chunkOverlap = 200) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", " ", ""],
  });

  const chunks = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const splitTexts = await splitter.splitText(section.text);
    for (const content of splitTexts) {
      chunks.push({
        content,
        section_header: section.header,
        chunk_index: chunkIndex++,
      });
    }
  }

  return chunks;
}
