
import express, { Request as ExpressRequest, Response as ExpressResponse } from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config({ path: ".env.local" });

const app = express();
app.use(cors()); // Allow requests from the frontend
// FIX: Replaced deprecated `body-parser` with `express.json()` and resolved type errors.
app.use(express.json());

// Plain object for Status
const Status = {
  Completed: "Completed",
  InProgress: "In Progress",
  NoProgress: "No Progress",
} as const;

type StatusType = typeof Status[keyof typeof Status];

interface CandidatePayload {
    name: string;
    email: string;
    phone?: string;
    status: StatusType;
    chapterCompletion: string;
    totalChapters: number;
    marksObtained: number;
    maxMarks: number;
    skippedQuestions: number;
    ocs1Status: string;
    ocs2Status: string;
    ocs1Date?: string;
    ocs2Date?: string;
}

// Status messages
const statusMessages: Record<string, string> = {
  [Status.Completed]: `Congratulations, we sincerely appreciate the dedication you have shown in completing the courses. We encourage you to continue with your efforts.`,
  [Status.InProgress]: `We appreciate the effort you are putting in, and we kindly request you to expedite the completion of the lectures within the allocated timeframe. We would like to hear about any difficulties or challenges you may be facing.`,
  [Status.NoProgress]: `We appreciate the effort you are putting in, and we kindly request you to expedite the completion of the lectures within the allocated timeframe. We would like to hear about any difficulties or challenges you may be facing.`,
};

// Configure transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // true for port 465, false for 587
  auth: {
    user: "contact@med-train.com", // e.g., contact@med-train.com
    pass: "zqsmqbzvxfcnghtz", // your Office365 app password
  },
  tls: {
    ciphers: "SSLv3",
  },
});


// ========== EMAIL ROUTE ==========
// FIX: Using aliased types `ExpressRequest` and `ExpressResponse` to avoid name collisions and fix property access errors.
app.post("/send-mails", async (req: ExpressRequest, res: ExpressResponse) => {
  const { candidates } = req.body as { candidates: CandidatePayload[] };

  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: "Candidates array is required" });
  }

  try {
    const promises = candidates.map(async (candidate) => {
      console.log(`Sending email to ${candidate.email} ...`);

      const statusMessage = statusMessages[candidate.status] || "";

      // Build OCS section
      let ocsSection = `
        <p><b>OCS 1 (${candidate.ocs1Date || "N/A"}):</b> ${candidate.ocs1Status}</p>
        <p><b>OCS 2 (${candidate.ocs2Date || "N/A"}):</b> ${candidate.ocs2Status}</p>
      `;
      
      if (
        candidate.ocs1Status?.toLowerCase().trim() === "not attended" ||
        candidate.ocs2Status?.toLowerCase().trim() === "not attended"
      ) {
        ocsSection += `
          <p>Kindly request you to attend all the Online-Contact-Sessions which is a mandatory and essential part of your course.</p>
        `;
      }

      await transporter.sendMail({
        from: `MedTrain Team <contact@med-train.com>`,
        to: candidate.email,
        subject: "Your Learners Report - AUGUST 2025",
        html: `
          <h3>Dear ${candidate.name},</h3>
          <br>
          <p>Greetings from MedTrain - Allergy Asthma Specialist Course.</p>
          <p>Please find the below-mentioned table of your progress for the month of August 2025.</p>
          <p><b>Chapter Completion:</b> ${candidate.chapterCompletion}</p>
          <p><b>Assessment:</b> ${candidate.marksObtained}/${candidate.maxMarks}</p>
          ${ocsSection}
          <p><b>Status:</b> ${candidate.status}</p>
          <p>${statusMessage}</p>
          <p>For Technical and Academic challenges please contact - 7975764489.</p>
          <p>Note: We request you to rename yourself to your registered name during online sessions to ensure your attendance is marked correctly.</p>
          <p><b>Note</b>:<li>Step 1️⃣ | Finish Viewing the Video on your Media Player.</li>
          <li>Step 2️⃣ | Click on the "Complete & Continue" button located at the Bottom Right of the media player. (On some devices, you might find this option under the 3 dots ⋮ Menu button at the Top Right of the media player).</li>
          <p>Kindly Ignore the above message if already done.</p>
          <br>
          <p>Thanks and Regards,</p>
          <p>MedTrain Team</p>
        `,
      });

      console.log(`Email sent to ${candidate.email}`);
    });

    await Promise.all(promises);
    res.json({ message: "Mail(s) sent successfully!" });
  } catch (err) {
    console.error("Error sending mail:", err);
    res.status(500).json({ error: "Failed to send mails" });
  }
});


// ========== WHATSAPP ROUTE ==========
// FIX: Using aliased types `ExpressRequest` and `ExpressResponse` to avoid name collisions and fix property access errors.
app.post("/send-whatsapp", async (req: ExpressRequest, res: ExpressResponse) => {
    const { candidates } = req.body as { candidates: CandidatePayload[] };

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
        console.error("No candidates provided in request body");
        return res.status(400).json({ error: "Candidates array is required" });
    }

    try {
        const promises = candidates.map(async (candidate) => {
            if (!candidate.phone) {
                console.warn(`Skipping WhatsApp for ${candidate.name} due to missing phone number.`);
                return; // Skip this candidate
            }

            console.log(`Preparing WhatsApp message for ${candidate.phone} (${candidate.name})`);

            const payload = {
                to: String(candidate.phone),
                name: "reportassist", // Template name
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: candidate.name },
                            { type: "text", text: String(candidate.chapterCompletion) },
                            
                            { type: "text", text: String(candidate.marksObtained) },
                            { type: "text", text: String(candidate.maxMarks) },
                            { type: "text", text: String(candidate.skippedQuestions) },
                            { type: "text", text: `OCS 1 (${candidate.ocs1Date || 'N/A'}) : ${candidate.ocs1Status}` },
                            { type: "text", text: `OCS 2 (${candidate.ocs2Date || 'N/A'}) : ${candidate.ocs2Status}` },
                            { type: "text", text: candidate.status },
                            { type: "text", text: "August 2025" },
                        ],
                    },
                ],
            };

            console.log("WhatsApp request payload:", JSON.stringify(payload, null, 2));

            const response = await fetch("https://aadyawhatsappmiddleware.onrender.com/send-template", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPd25lck5hbWUiOiJNZWRUcmFpbiIsInBob25lTnVtYmVySWQiOiIzMjUzODMwMTM5OTIxNTQiLCJ3aGF0c2FwcE1ldGFUb2tlbiI6IkVBQUdQaXBIZE10QUJQSXU5MDc2QWdBbXU5akh2d0JaQ3BLWEs2OERocEExWFpBUXc5UkNGbDlJMG9CR3V3Tkk5QVBKOWw1aUw5d3NscEJNQzhZU0xMWHRQeDJpaFdwUkI1c1N1Rmd4c0NVUHdmNTJhWkFCd0hWTmxnaVRjZ3J3aml4WkNFc3pNVVNYcmRwdmFKTGtHVFBqc1l2VTVaQmZjTXZSMXl5Tmpqb1RTVmo4eGlVZUNYVkhYazFYSTRuQVpEWkQiLCJpYXQiOjE3NTQwMzIxNjB9.k1DTVxel76DQGFbTYXpsJPA3yWjf6q3SqByNnkpays4", // IMPORTANT: Replace with actual token
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            console.log("WhatsApp API status:", response.status, response.statusText);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Failed to send WhatsApp to ${candidate.phone}. Status: ${response.status}. Body: ${errorBody}`);
            } else {
                 const data = await response.json();
                 console.log(`WhatsApp API response for ${candidate.phone}:`, data);
            }
        });

        await Promise.all(promises);
        res.json({ message: "WhatsApp message(s) sent successfully!" });
    } catch (err) {
        console.error("Error sending WhatsApp:", err);
        res.status(500).json({ error: "Failed to send WhatsApp message(s)" });
    }
});


// Root route for testing
// FIX: Using aliased types `ExpressRequest` and `ExpressResponse` to avoid name collisions and fix property access errors.
app.get("/", (req: ExpressRequest, res: ExpressResponse) => {
  res.send("Mail + WhatsApp API is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mail + WhatsApp server running on http://localhost:${PORT}`);
});
