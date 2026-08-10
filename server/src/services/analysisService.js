import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export const analyzeResume = async (extractedText) => {
  //get gemini model
  // const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

Analyze the resume deeply and comprehensively rather than giving a superficial overview.

For the "score", evaluate the resume across multiple dimensions including:
- ATS compatibility
- Resume structure and organization
- Formatting and readability
- Professional presentation
- Relevance to the candidate's apparent career/target role
- Technical and professional skills
- Work experience quality
- Education
- Projects
- Achievements and measurable results
- Use of action verbs
- Use of quantifiable metrics
- Keyword optimization
- Content clarity and conciseness
- Impact and effectiveness of bullet points
- Professional summary/profile
- Contact information
- Grammar, spelling, and language quality
- Overall competitiveness in a modern job market

For "skills":
- Extract as many relevant skills as are clearly present in the resume.
- Include technical skills, programming languages, frameworks, libraries, databases, tools, platforms, methodologies, soft skills, and domain-specific skills when explicitly supported by the resume.
- Do not invent skills that are not supported by the resume.
- Avoid unnecessary duplicates.

For "missingSkills":
- Identify important skills that are genuinely missing based on the candidate's apparent field, experience, projects, and target career direction.
- Consider common ATS keywords and industry expectations.
- Prioritize skills that would meaningfully improve the candidate's employability.
- Do not list random or unrelated skills.
- Distinguish between skills that are completely absent and skills that appear weakly demonstrated.

For "strengths":
- Provide multiple specific and meaningful strengths.
- Analyze the actual content rather than giving generic praise.
- Identify strong achievements, relevant experience, valuable projects, technical depth, measurable results, good structure, strong keywords, or other competitive advantages.
- Explain the practical value of each strength where possible.

For "weakness":
- Identify multiple concrete weaknesses or deficiencies.
- Look for missing information, vague descriptions, weak bullet points, lack of metrics, poor keyword usage, irrelevant content, formatting problems, weak summaries, skill gaps, unclear career direction, grammar issues, repetition, and ATS-related problems.
- Be critical and honest rather than overly positive.
- Only identify weaknesses that are reasonably supported by the resume.

For "suggestions":
- Provide detailed, specific, and actionable recommendations.
- Each suggestion should explain what should be changed or improved.
- Prioritize high-impact improvements first.
- Include recommendations for rewriting weak content, adding measurable achievements, improving keywords, strengthening projects or experience descriptions, improving ATS compatibility, and removing unnecessary information where applicable.
- Suggestions should be practical enough that the candidate could directly apply them to the resume.
- Avoid generic advice such as "make your resume better" or "add more skills."

Do not assume information that is not present in the resume. Base the analysis strictly on the provided resume text while using your knowledge of modern ATS systems and industry expectations to identify meaningful gaps.

Be thorough. Prefer detailed, specific analysis with multiple useful points in every array rather than only a few observations. The goal is to provide a professional-level resume audit that helps the candidate understand exactly what is strong, what is weak, what is missing, and what should be improved.

Resume text:
${trimmedText}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.choices[0].message.content;

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
