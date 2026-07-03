import mammoth from "mammoth";

export const parseDocxToHtml = async (buffer, fileName) => {
  console.log(`DEBUG: DOCX service parsing buffer for: ${fileName}`);
  const result = await mammoth.convertToHtml({ buffer });
  let htmlContent = result.value;

  if (!htmlContent || htmlContent.trim() === "") {
    htmlContent = `<p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px">Empty document content.</p>`;
  }

  let html = `<h1 style="font-size:32px;font-weight:600;color:#111;margin-bottom:8px;line-height:1.3">${fileName.replace(/\.[^/.]+$/, "")}</h1>`;
  html += `<p style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;color:#999;text-transform:uppercase;margin-bottom:0">Imported from Word Document</p>`;
  html += `<hr style="border:none;border-top:1px solid #d8d3c7;margin:24px 0" />`;

  htmlContent = htmlContent.replace(/<p>/g, `<p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px;text-align:justify">`);
  htmlContent = htmlContent.replace(/<h2>/g, `<h2 style="font-size:18px;font-weight:700;color:#111;margin-top:24px;margin-bottom:8px">`);
  htmlContent = htmlContent.replace(/<h1>/g, `<h1 style="font-size:24px;font-weight:700;color:#111;margin-top:28px;margin-bottom:12px">`);

  html += htmlContent;
  return html;
};
