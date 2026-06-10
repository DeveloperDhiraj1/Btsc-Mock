const logger = require('../utils/logger');
const { parseAIJson, buildMockQuestions } = require('../utils/aiParser');

let OpenAI;
try {
  OpenAI = require('openai').OpenAI || require('openai');
} catch (e) {
  logger.warn('openai package not installed yet — install with: npm install openai');
}

const getClient = (apiKey) => {
  if (!OpenAI) throw new Error('openai SDK is not installed');
  if (!apiKey) throw new Error('OpenAI API key is not configured');
  return new OpenAI({ apiKey });
};

const chatComplete = async (apiKey, model, prompt, { json = false } = {}) => {
  const client = getClient(apiKey);
  const res = await client.chat.completions.create({
    model: model || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    ...(json ? { response_format: { type: 'json_object' } } : {})
  });
  return res.choices?.[0]?.message?.content || '';
};

const generateQuestions = async (subject, topic, difficulty, questionCount, examType, apiKey, model) => {
  const count = parseInt(questionCount) || 5;

  const prompt = `You are a professional examiner preparing questions for the ${examType} competitive exam.
Generate exactly ${count} Multiple Choice Questions (MCQs) for the subject "${subject}" and topic "${topic}".
The questions must be of difficulty level "${difficulty}".

Return ONLY a valid JSON object matching:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct",
      "difficulty": "${difficulty}",
      "tags": ["${examType}", "${subject}", "${topic}"]
    }
  ]
}

Ensure questions are accurate, exam-oriented, and free of duplicates.`;

  let attempts = 0;
  while (attempts < 3) {
    try {
      const text = await chatComplete(apiKey, model, prompt, { json: true });
      const parsed = parseAIJson(text);
      if (parsed && Array.isArray(parsed.questions)) {
        return parsed.questions.map((q) => ({ ...q, subject, topic, examType }));
      }
      throw new Error('Mismatched OpenAI response format');
    } catch (error) {
      attempts++;
      logger.warn(`OpenAI Question Generation attempt ${attempts} failed: ${error.message}`);
      if (attempts >= 3) {
        if (error.status === 429 || /rate|quota/i.test(error.message)) throw error;
        logger.error('OpenAI Question Generation exhausted retries. Returning mock questions.');
        return buildMockQuestions(subject, topic, difficulty, count, examType);
      }
    }
  }
};

const analyzeResult = async (score, accuracy, timeSpent, weakTopics, answers, apiKey, model) => {
  const prompt = `Analyze a student's mock test results.
Metrics:
- Score: ${score}
- Accuracy: ${accuracy}%
- Total Time Spent: ${timeSpent} seconds
- Weak Topics Identified: ${JSON.stringify(weakTopics)}
- Detailed Answers: ${JSON.stringify((answers || []).map((a) => ({ isCorrect: a.isCorrect, timeSpent: a.timeSpent })))}

Return ONLY valid JSON:
{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "timeManagement": "...",
  "studyPlanSuggestion": "..."
}`;

  try {
    const text = await chatComplete(apiKey, model, prompt, { json: true });
    return parseAIJson(text);
  } catch (error) {
    logger.error('OpenAI Result Analysis failed: %O', error);
    if (error.status === 429 || /rate|quota/i.test(error.message)) throw error;
    return {
      strengths: ['Conceptual clarity'],
      weaknesses: weakTopics,
      timeManagement: 'Good pacing, but spend less time on doubtful questions.',
      studyPlanSuggestion: 'Revise notes weekly and review solutions for all wrong answers.'
    };
  }
};

const generateNotes = async (subject, topic, apiKey, model) => {
  const prompt = `You are a professional tutor preparing rapid-revision notes for competitive exams.
Generate comprehensive revision study notes for subject "${subject}", topic "${topic}".
Include:
- A brief conceptual summary (2-3 paragraphs)
- Key formulas, theorems, definitions
- 3-4 memory tips / shortcut tricks
- Common pitfalls or silly mistakes.

Format cleanly in Markdown with headings and bullets.`;

  let attempts = 0;
  while (attempts < 3) {
    try {
      return await chatComplete(apiKey, model, prompt);
    } catch (error) {
      attempts++;
      logger.warn(`OpenAI Notes Generation attempt ${attempts} failed: ${error.message}`);
      if (error.status === 429 || /rate|quota/i.test(error.message)) throw error;
      if (attempts < 3) await new Promise((r) => setTimeout(r, 500 * attempts));
    }
  }

  logger.error('OpenAI Notes Generation exhausted retries. Falling back to static template.');
  return `### Revision Sheet: ${topic} (${subject})

*AI service is temporarily unavailable. Showing a generic outline — please retry in a moment for topic-specific notes.*

1. **Core Concept Overview** — fundamental theories and operational workflows for ${topic}.
2. **Key Formulas / Theorems** — list the most-tested equations and standard values.
3. **Short Tricks & Mnemonics** — shortcut techniques.
4. **Common Pitfalls** — frequent silly mistakes and unit-conversion traps.`;
};

const generateExplanation = async (questionText, options, correctAnswerIndex, selectedOptionIndex, apiKey, model) => {
  const prompt = `Explain the following multiple-choice question clearly:
Question: "${questionText}"
Options:
A. ${options[0]}
B. ${options[1]}
C. ${options[2]}
D. ${options[3]}
Correct Option Index: ${correctAnswerIndex} (A=0, B=1, C=2, D=3)
Student Selected: ${selectedOptionIndex}

Provide:
1. Why option ${String.fromCharCode(65 + correctAnswerIndex)} is correct.
2. The flaw in the student's selected option ${selectedOptionIndex !== null && selectedOptionIndex !== undefined ? String.fromCharCode(65 + selectedOptionIndex) : 'None/Skipped'}.

Format in clean Markdown.`;

  try {
    return await chatComplete(apiKey, model, prompt);
  } catch (error) {
    logger.error('OpenAI Explanation Generation failed: %O', error);
    if (error.status === 429 || /rate|quota/i.test(error.message)) throw error;
    return `Explanation failed to load. The correct answer is: ${options[correctAnswerIndex]}`;
  }
};

module.exports = {
  generateQuestions,
  analyzeResult,
  generateNotes,
  generateExplanation
};
