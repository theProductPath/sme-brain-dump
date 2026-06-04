import JSZip from "jszip";
import { saveAs } from "file-saver";

export const downloadArtifactsZip = async (roleName: string, documents: { brief: string; faq: string; decisions: string; runbook: string }) => {
  const zip = new JSZip();

  const wrapHTML = (title: string, body: string) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.6; }
  h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  h2 { font-size: 14px; font-weight: 700; color: #475569; margin: 32px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.05em; }
  p { font-size: 15px; margin-bottom: 16px; }
  ul, ol { margin-bottom: 20px; }
  li { margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
  td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
</style>
</head>
<body>
${body}
</body>
</html>`;

  zip.file("Successor_Brief.html", wrapHTML("Successor Brief", documents.brief));
  zip.file("FAQ.html", wrapHTML("FAQ", documents.faq));
  zip.file("Decision_Log.html", wrapHTML("Decision Log", documents.decisions));
  zip.file("Runbook.html", wrapHTML("Runbook", documents.runbook));

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${roleName.replace(/[^a-zA-Z0-9]/g, '_')}_Transition_Package.zip`);
};
