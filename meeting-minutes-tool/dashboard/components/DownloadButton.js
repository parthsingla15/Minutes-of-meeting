"use client";

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export default function DownloadButton({ meeting }) {
  const handleDownload = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: meeting.title || "Meeting Minutes",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            // Date
            new Paragraph({
              text: new Date(meeting.created_at).toLocaleString(),
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            // Summary Heading
            new Paragraph({
              text: "Summary",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 },
            }),
            // Summary Text
            new Paragraph({
              text: meeting.summary || "No summary available.",
              spacing: { after: 300 },
            }),

            // Key Points Heading
            new Paragraph({
              text: "Key Points",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 },
            }),
            // Key Points List
            ...(meeting.key_points || []).map(
              (point) =>
                new Paragraph({
                  text: point,
                  bullet: { level: 0 },
                })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }), // spacer

            // Decisions Heading
            new Paragraph({
              text: "Decisions",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 },
            }),
            // Decisions List
            ...(meeting.decisions || []).map(
              (decision) =>
                new Paragraph({
                  text: decision,
                  bullet: { level: 0 },
                })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }), // spacer

            // Action Items Heading
            new Paragraph({
              text: "Action Items",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 },
            }),
            // Action Items List
            ...(meeting.action_items || []).map(
              (item) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `${item.owner}: `, bold: true }),
                    new TextRun(item.task),
                    item.due ? new TextRun({ text: ` (Due: ${item.due})`, italics: true }) : new TextRun(""),
                  ],
                  bullet: { level: 0 },
                })
            ),
            new Paragraph({ text: "", spacing: { after: 400 } }), // spacer

            // Transcript Heading
            new Paragraph({
              text: "Transcript",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 },
            }),
            // Transcript Text
            ...(meeting.transcript || []).map(
              (seg) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `${seg.speaker} [${seg.start}s]: `, bold: true }),
                    new TextRun(seg.text),
                  ],
                  spacing: { after: 100 },
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const safeTitle = (meeting.title || "Meeting_Minutes").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveAs(blob, `${safeTitle}.docx`);
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        padding: "8px 16px",
        backgroundColor: "#4f8cff",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "500",
      }}
    >
      Download .docx
    </button>
  );
}
