import { GoogleGenerativeAi } from "@google/generative-ai";

const genAI = new GoogleGenerativeAi(process.env.GOOGLE_API_KEY);

export const analyzeResume = async (extractedText) => {
  //get gemini model
  const model = await genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const trimmedText = extractedText.slice(0, 10000); // Limit to first 10,000 characters

  const prompt = `
  You are an expert resume analyzer and ATS (Applicant Tracking System) specialist.

Analyze the following resume and return a JSON object with exactly these fields:

{
  "score": a number from 0 to 100 representing overall resume quality,
  "skills": an array of strings listing skills found in the resume,
  "missingSkills": an array of strings listing important skills commonly expected but missing,
  "strengths": an array of strings describing what the resume does well,
  "weakness": an array of strings describing what the resume does poorly,
  "suggestions": an array of strings with specific actionable improvements
}

Rules:
- Return ONLY the JSON object, nothing else
- No markdown, no code blocks, no explanation
- All arrays must have at least one item
- score must be a number, not a string

Resume text:
${trimmedText}
  `;

  //send prompt to gemini model
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  //parse the cleaned text as JSON
  const parsed = JSON.parse(cleaned);

  //validate all fields
  const requiredFields = [
    "score",
    "skills",
    "missingSkills",
    "strengths",
    "weakness",
    "suggestions",
  ];
  for (const field of requiredFields) {
    if (parsed[field] === undefined) {
      throw new Error(`Missing field in response: ${field}`);
    }
  }
  if (typeof parsed.score !== "number") {
    throw new Error(`Score must be a number, got: ${typeof parsed.score}`);
  }

  //score betn 0 to 100
  if (parsed.score < 0) parsed.score = 0;
  if (parsed.score > 100) parsed.score = 100;

  return parsed;
};
