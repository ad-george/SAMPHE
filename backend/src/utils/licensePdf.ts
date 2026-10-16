import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib-plus-encrypt";

interface LicensePdfData {
  institutionName: string | null;
  licenseType: string;
  generatedAt: Date;
  expiresAt: Date | null;
  code: string;
  password: string;
}

export async function buildLicensePdf(
  data: LicensePdfData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdf.embedFont(StandardFonts.CourierBold);

  const { width, height } = page.getSize();
  const margin = 60;
  const green = rgb(0.06, 0.72, 0.51);
  const ink = rgb(0.1, 0.1, 0.15);
  const muted = rgb(0.5, 0.5, 0.55);

  let y = height - margin;

  page.drawText("SAMPHE", {
    x: margin,
    y,
    size: 22,
    font: fontBold,
    color: ink,
  });
  y -= 18;
  page.drawText("Smart Attendance Management Platform for Higher Education", {
    x: margin,
    y,
    size: 10,
    font: fontRegular,
    color: muted,
  });
  y -= 25;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: muted,
  });
  y -= 40;

  page.drawText("OFFICIAL LICENSE CERTIFICATE", {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: ink,
  });
  y -= 40;

  const formatDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const writeField = (label: string, value: string) => {
    page.drawText(label, {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: muted,
    });
    page.drawText(value, {
      x: margin + 130,
      y,
      size: 11,
      font: fontRegular,
      color: ink,
    });
    y -= 22;
  };

  writeField("License Type:", data.licenseType);
  writeField("Institution:", data.institutionName || "Unassigned");
  writeField("Generated On:", formatDate(data.generatedAt));
  writeField("Expires On:", formatDate(data.expiresAt));

  y -= 25;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: muted,
  });
  y -= 30;

  page.drawText("LICENSE CODE", {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: muted,
  });
  y -= 35;

  const cleaned = data.code
    .toUpperCase()
    .replace(/^SUAMP-/, "")
    .replace(/-/g, "");
  const groups = cleaned.match(/.{1,4}/g) || [];
  const formatted = `SUAMP-${groups.join("-")}`;

  page.drawText(formatted, {
    x: margin,
    y,
    size: 20,
    font: fontMono,
    color: green,
  });
  y -= 40;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: muted,
  });
  y -= 30;

  page.drawText(
    "This PDF is password protected. The password is available from the SAMPHE platform admin.",
    { x: margin, y, size: 9, font: fontRegular, color: muted },
  );

  page.drawText(
    "samphé · SAMPHE · Smart University Attendance Management Platform",
    { x: margin, y: 60, size: 8, font: fontRegular, color: muted },
  );
  page.drawText(`© ${new Date().getFullYear()} SAMPHE`, {
    x: margin,
    y: 46,
    size: 8,
    font: fontRegular,
    color: muted,
  });

  pdf.encrypt({
    userPassword: data.password,
    ownerPassword: data.password + "_owner",
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });

  return await pdf.save();
}