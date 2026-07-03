import { parsePdfToHtml } from "./pdf_service.js";
import { parseDocxToHtml } from "./docx_service.js";

export const parseFileToHtml = async (buffer, originalName, mimeType) => {
  console.log(`DEBUG: Parser coordinating logic for: ${originalName}`);
  const extension = originalName.split(".").pop().toLowerCase();

  if (extension === "pdf" || mimeType === "application/pdf") {
    return await parsePdfToHtml(buffer, originalName);
  } else if (
    extension === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await parseDocxToHtml(buffer, originalName);
  } else {
    throw new Error("Unsupported file type. Only PDF and Word (.docx) documents are supported.");
  }
};
