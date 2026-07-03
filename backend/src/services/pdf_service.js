import pdfParse from "pdf-parse";

export const parsePdfToHtml = async (buffer, fileName) => {
  console.log(`DEBUG: PDF service parsing buffer for: ${fileName}`);
  const data = await pdfParse(buffer);
  const text = data.text;

  const cleanedText = text.replace(/\r\n/g, "\n").replace(/ +/g, " ");
  const sections = cleanedText.split(/\n\n+/);

  let html = `<h1 style="font-size:32px;font-weight:600;color:#111;margin-bottom:8px;line-height:1.3">${fileName.replace(/\.[^/.]+$/, "")}</h1>`;
  html += `<p style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;color:#999;text-transform:uppercase;margin-bottom:0">Imported from PDF</p>`;
  html += `<hr style="border:none;border-top:1px solid #d8d3c7;margin:24px 0" />`;

  sections.forEach((section) => {
    const trimmed = section.trim();
    if (!trimmed) return;

    const isHeading = trimmed.length < 120 && (
      /^(clause|section|article|part|sched|annex)/i.test(trimmed) || 
      /^\d+\.\s+[A-Z]/.test(trimmed) ||
      /^[A-Z\s]{4,60}$/.test(trimmed)
    );

    if (isHeading) {
      html += `<h2 style="font-size:18px;font-weight:700;color:#111;margin-top:24px;margin-bottom:8px">${trimmed}</h2>`;
    } else {
      const paragraphText = trimmed.replace(/\n/g, " ");
      html += `<p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px;text-align:justify">${paragraphText}</p>`;
    }
  });

  return html;
};
