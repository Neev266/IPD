import { parsePdfToHtml } from "./pdf_service.js";
import { parseDocxToHtml } from "./docx_service.js";

export const parseFileToHtml = async (buffer, originalName, mimeType, cloudinaryUrl) => {
  console.log(`DEBUG: Parser coordinating logic for: ${originalName}`);
  const extension = originalName.split(".").pop().toLowerCase();

  if (extension === "pdf" || mimeType === "application/pdf") {
    return await parsePdfToHtml(buffer, originalName);
  } else if (
    extension === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await parseDocxToHtml(buffer, originalName);
  } else if (
    ["txt", "md", "csv", "json", "html", "xml", "js", "ts", "css"].includes(extension) ||
    (mimeType && (mimeType.startsWith("text/") || mimeType === "application/json"))
  ) {
    console.log(`DEBUG: Parsing text file: ${originalName}`);
    const textContent = buffer.toString("utf-8");
    // Convert basic plain text lines to HTML paragraphs
    const paragraphs = textContent
      .split(/\r?\n/)
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return "<br/>";
        // Simple escape html
        const escaped = trimmed
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:8px;text-align:justify">${escaped}</p>`;
      })
      .join("\n");

    let html = `<h1 style="font-size:32px;font-weight:600;color:#111;margin-bottom:8px;line-height:1.3">${originalName.replace(/\.[^/.]+$/, "")}</h1>`;
    html += `<p style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;color:#999;text-transform:uppercase;margin-bottom:0">Imported from Plain Text</p>`;
    html += `<hr style="border:none;border-top:1px solid #d8d3c7;margin:24px 0" />`;
    html += paragraphs;
    return html;
  } else {
    // Fallback card for unsupported/binary files (images, zip, xlsx, etc.)
    console.log(`DEBUG: Using fallback preview for binary/unsupported file: ${originalName}`);
    const fileUrl = cloudinaryUrl || "#";
    
    // We render a beautiful visual card in the editor so the user has the download link and info
    let html = `<div style="font-family:'Inter', sans-serif; padding: 32px; text-align: center; border: 2px dashed #d3ccbf; border-radius: 16px; background: #faf9f6; max-width: 500px; margin: 40px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">`;
    html += `  <div style="font-size: 48px; margin-bottom: 16px;">📁</div>`;
    html += `  <h3 style="font-size: 20px; font-weight: 600; color: #222; margin: 0 0 8px 0;">${originalName}</h3>`;
    html += `  <p style="font-size: 13px; color: #666; margin: 0 0 24px 0; line-height: 1.5;">This file format is not directly editable, but it has been securely stored on Cloudinary.</p>`;
    if (fileUrl !== "#") {
      html += `  <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; background: #353b49; color: #ffffff; font-weight: 500; font-size: 14px; text-decoration: none; border-radius: 8px; transition: background 0.2s;">View / Download Original File</a>`;
    } else {
      html += `  <span style="font-size: 13px; color: #999; font-style: italic;">Local mock upload - file link unavailable</span>`;
    }
    html += `</div>`;
    return html;
  }
};
