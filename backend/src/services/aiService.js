const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

// ─── Client initializers (lazy) ───────────────────────────────
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const getClaudeClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
};

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// ─── Credit costs per model ───────────────────────────────────
const MODEL_CREDIT_COSTS = {
  gemini: 0.5,
  claude: 1,
  openai: 1.5,
};

/**
 * Build a standardized verification prompt
 */
const buildVerificationPrompt = (submissionData, requirements) => `
You are an objective hackathon submission evaluator. Analyze the following submission against the provided requirements.

## Submission Details
- Repository URL: ${submissionData.repoUrl || 'N/A'}
- Project Description: ${submissionData.description || 'N/A'}
- Repository Analysis:
${JSON.stringify(submissionData.repoAnalysis || {}, null, 2)}

## Hackathon Requirements
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Evaluation Task
1. Check each requirement and determine if it is met (YES/PARTIAL/NO)
2. Assign an overall score from 0 to 100
3. List any red flags or concerns
4. Provide a brief summary

Respond ONLY in valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "requirementChecks": [
    { "requirement": "<text>", "status": "YES|PARTIAL|NO", "reason": "<brief reason>" }
  ],
  "redFlags": ["<flag1>", "<flag2>"],
  "summary": "<2-3 sentence summary>",
  "recommendation": "APPROVE|REVIEW|REJECT"
}
`;

/**
 * Verify submission using Gemini (0.5 credit)
 */
const verifyWithGemini = async (submissionData, requirements) => {
  const genai = getGeminiClient();
  const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = buildVerificationPrompt(submissionData, requirements);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned non-JSON response');

  return {
    model: 'gemini-1.5-flash',
    creditCost: MODEL_CREDIT_COSTS.gemini,
    result: JSON.parse(jsonMatch[0]),
    rawResponse: text,
  };
};

/**
 * Verify submission using Claude (1 credit)
 */
const verifyWithClaude = async (submissionData, requirements) => {
  const client = getClaudeClient();
  const prompt = buildVerificationPrompt(submissionData, requirements);

  const message = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude returned non-JSON response');

  return {
    model: 'claude-3-haiku-20240307',
    creditCost: MODEL_CREDIT_COSTS.claude,
    result: JSON.parse(jsonMatch[0]),
    rawResponse: text,
  };
};

/**
 * Verify submission using OpenAI (1.5 credits)
 */
const verifyWithOpenAI = async (submissionData, requirements) => {
  const client = getOpenAIClient();
  const prompt = buildVerificationPrompt(submissionData, requirements);

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a hackathon submission evaluator. Always respond with valid JSON only.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const text = completion.choices[0].message.content;
  return {
    model: 'gpt-4o-mini',
    creditCost: MODEL_CREDIT_COSTS.openai,
    result: JSON.parse(text),
    rawResponse: text,
    usage: completion.usage,
  };
};

/**
 * Dispatch verification to the selected AI model
 * @param {'gemini'|'claude'|'openai'} model
 * @param {object} submissionData
 * @param {string[]} requirements
 */
const verifySubmission = async (model, submissionData, requirements) => {
  switch (model) {
    case 'gemini':
      return verifyWithGemini(submissionData, requirements);
    case 'claude':
      return verifyWithClaude(submissionData, requirements);
    case 'openai':
      return verifyWithOpenAI(submissionData, requirements);
    default:
      throw new Error(`Unknown AI model: ${model}. Choose gemini, claude, or openai.`);
  }
};

/**
 * Analyze GitHub repo with AI to check if it meets requirements
 */
const analyzeRepoWithAI = async (repoAnalysis, requirements, model = 'gemini') => {
  return verifySubmission(model, { repoAnalysis }, requirements);
};

module.exports = {
  verifySubmission,
  verifyWithGemini,
  verifyWithClaude,
  verifyWithOpenAI,
  analyzeRepoWithAI,
  MODEL_CREDIT_COSTS,
};
