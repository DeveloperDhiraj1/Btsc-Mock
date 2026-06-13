const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// Initialize Gemini API Client
let genAI;
const useMock = process.env.USE_GEMINI_MOCK === 'true' || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY');

if (!useMock) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (error) {
    logger.error('Failed to initialize Gemini API Client: %O', error);
  }
} else {
  logger.warn('Running Gemini AI in Simulation Mode (Rich Static Templates Fallback)');
}

/**
 * Robust JSON Parser to extract JSON from Gemini text response (handling markdown fences)
 * @param {string} rawText 
 * @returns {Object} parsed JSON
 */
const parseGeminiJSON = (rawText) => {
  try {
    let cleanText = rawText.trim();
    // Strip markdown code block wrappers if present (e.g. ```json ... ```)
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '');
    }
    return JSON.parse(cleanText.trim());
  } catch (error) {
    logger.error('Failed to parse Gemini JSON output. Raw text: %s', rawText);
    throw new Error('Invalid JSON structure returned by AI model');
  }
};

/**
 * AI Question Generator Service
 * Returns array of MCQs
 */
const generateQuestions = async (subject, topic, difficulty, questionCount, examType) => {
  const count = parseInt(questionCount) || 5;
  
  if (useMock) {
    logger.info(`[AI Question Generator Simulation] Subject: ${subject}, Topic: ${topic}, Difficulty: ${difficulty}`);
    return getMockQuestions(subject, topic, difficulty, count, examType);
  }

  const prompt = `You are a professional examiner preparing questions for the ${examType} competitive exam.
  Generate exactly ${count} Multiple Choice Questions (MCQs) for the subject "${subject}" and topic "${topic}".
  The questions must be of difficulty level "${difficulty}".
  
  You MUST return ONLY a valid JSON object matching the following structure. Do not include any other explanations, notes, or markdown formatting outside the JSON block.
  
  JSON Schema:
  {
    "questions": [
      {
        "question": "The question statement in English.",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0, // Integer index (0 to 3) representing the index of the correct option in the options array.
        "explanation": "Detailed explanation of why this option is correct.",
        "difficulty": "${difficulty}",
        "tags": ["${examType}", "${subject}", "${topic}"]
      }
    ]
  }
  
  Ensure questions are highly accurate, technical, exam-oriented, and free of duplicates.`;

  let attempts = 0;
  while (attempts < 3) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsedData = parseGeminiJSON(text);
      if (parsedData && Array.isArray(parsedData.questions)) {
        return parsedData.questions.map(q => ({
          ...q,
          subject,
          topic,
          examType
        }));
      }
      throw new Error('Mismatched response format');
    } catch (error) {
      attempts++;
      logger.warn(`Gemini Question Generation attempt ${attempts} failed. Error: ${error.message}`);
      if (attempts >= 3) {
        logger.error('Gemini Question Generation exhausted all retries. Falling back to mock templates.');
        return getMockQuestions(subject, topic, difficulty, count, examType);
      }
    }
  }
};

/**
 * AI Performance Analyzer Service
 */
const analyzeResult = async (score, accuracy, timeSpent, weakTopics, answers) => {
  if (useMock) {
    return {
      strengths: ['Good grasp of fundamental concepts', 'Fast response on simple questions'],
      weaknesses: weakTopics && weakTopics.length > 0 ? weakTopics : ['Numerical applications', 'Time management on complex problems'],
      timeManagement: `Average time per question was ${Math.round(timeSpent / (answers?.length || 1))} seconds. Speed is optimal, but accuracy can be improved in hard difficulty questions.`,
      studyPlanSuggestion: 'Focus on topic-wise quizzes daily. Revise weak formulas and attempt at least 2 full-length mocks per week.'
    };
  }

  const prompt = `Analyze a student's mock test results.
  Metrics:
  - Score: ${score}
  - Accuracy: ${accuracy}%
  - Total Time Spent: ${timeSpent} seconds
  - Weak Topics Identified: ${JSON.stringify(weakTopics)}
  - Detailed Answers (Question & Chosen Correctness): ${JSON.stringify(
    answers.map(a => ({ isCorrect: a.isCorrect, timeSpent: a.timeSpent }))
  )}

  Provide a structured performance review. You MUST return ONLY a valid JSON object matching the following structure:
  {
    "strengths": ["Strength point 1", "Strength point 2"],
    "weaknesses": ["Weak point 1", "Weak point 2"],
    "timeManagement": "Feedback about pacing and time spent per question.",
    "studyPlanSuggestion": "A custom 2-week step-by-step study plan to overcome mistakes."
  }`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseGeminiJSON(response.text());
  } catch (error) {
    logger.error('Gemini Result Analysis failed: %O. Using mock summary.', error);
    return {
      strengths: ['Conceptual clarity'],
      weaknesses: weakTopics,
      timeManagement: 'Good pacing, but spend less time on doubtful questions.',
      studyPlanSuggestion: 'Revise notes weekly and review solutions for all wrong answers.'
    };
  }
};

/**
 * AI Revision Notes Generator Service
 */
const generateNotes = async (subject, topic) => {
  if (useMock) {
    return `### Revision Sheet: ${topic} (${subject})
    
1. **Core Concept Overview**:
   - Fundamental theories and operational workflows.
   - Core equations and constant values necessary for competitive questions.

2. **Key Formulas**:
   - *Formula 1*: $F = m \\cdot a$ (Force equals Mass times Acceleration)
   - *Formula 2*: $\\eta = \\frac{W}{Q_{in}} \\cdot 100\\%$ (Efficiency of Thermodynamic Cycles)

3. **Short Tricks & Mnemonics**:
   - Use direct formulas for ratio problems to bypass heavy calculations.
   - Eliminate extreme options immediately.

4. **Common Pitfalls**:
   - Double check SI units conversion (e.g., cm to meters, hours to seconds).
   - Read the question for keyword modifiers like "NOT", "EXCEPT", or "INCORRECT".`;
  }

  const prompt = `You are a senior tutor writing exam-ready revision notes for competitive aspirants.
Topic: "${topic}"  |  Subject: "${subject}"

Produce well-structured Markdown notes that follow this exact skeleton:

# ${topic}

## Concept Overview
2–3 short paragraphs explaining the topic in plain English. Mention why it matters in the exam.

## Key Definitions
- **Term** — concise one-line meaning.
(4–6 entries)

## Important Formulas & Theorems
- **Name** — formula in inline code like \`F = m·a\`, followed by a short note on when to apply.
(3–6 entries; use inline code for every formula)

## Worked Example
A single solved numerical or conceptual example, step-by-step (use a numbered list).

## Memory Tricks & Shortcuts
- Crisp mnemonic or shortcut (3–4 bullets).

## Common Pitfalls
- One-line mistake students make + how to avoid it (3–4 bullets).

## Quick Recap
> One-sentence takeaway in a blockquote.

Rules:
- Use only headings (##, ###), bullet lists (-), numbered lists (1.), bold (**...**), inline code (\`...\`), and blockquotes (>). No tables, no HTML.
- Keep total length under ~450 words. Be dense, not fluffy.
- Do NOT wrap the whole response in a code fence. Output raw Markdown only.`;

  let attempts = 0;
  while (attempts < 3) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      attempts++;
      logger.warn(`Gemini Notes Generation attempt ${attempts} failed: ${error.message}`);
      if (attempts < 3) {
        await new Promise((r) => setTimeout(r, 500 * attempts));
      }
    }
  }

  logger.error('Gemini Notes Generation exhausted retries. Falling back to static template.');
  return `### Revision Sheet: ${topic} (${subject})

*AI service is temporarily unavailable. Showing a generic outline — please retry in a moment for topic-specific notes.*

1. **Core Concept Overview** — fundamental theories, common definitions, and operational workflows for ${topic}.
2. **Key Formulas / Theorems** — list the most-tested equations and standard values.
3. **Short Tricks & Mnemonics** — shortcut techniques that save time in competitive exams.
4. **Common Pitfalls** — frequent silly mistakes and unit-conversion traps to watch for.`;
};

/**
 * AI Explanation Generator Service
 */
const generateExplanation = async (questionText, options, correctAnswerIndex, selectedOptionIndex) => {
  if (useMock) {
    return `The correct answer is Option **${String.fromCharCode(65 + correctAnswerIndex)}**: "${options[correctAnswerIndex]}". 
    
**Explanation**:
- The question asks for the direct relationship in the given concept.
- Substituting the core values reveals that Option ${String.fromCharCode(65 + correctAnswerIndex)} matches the standard thermodynamic/physical equation.
- Option ${String.fromCharCode(65 + (selectedOptionIndex !== null ? selectedOptionIndex : 0))} is incorrect because it misses the coefficients or represents an inverse ratio.`;
  }

  const prompt = `Explain the following multiple-choice question clearly:
  Question: "${questionText}"
  Options:
  A. ${options[0]}
  B. ${options[1]}
  C. ${options[2]}
  D. ${options[3]}
  Correct Option Index: ${correctAnswerIndex} (where A=0, B=1, C=2, D=3)
  Student Selected Option Index: ${selectedOptionIndex}
  
  Provide a detailed explanation of:
  1. Why Option ${String.fromCharCode(65 + correctAnswerIndex)} is mathematically/logically correct.
  2. The flaw in the student's selected Option ${selectedOptionIndex !== null ? String.fromCharCode(65 + selectedOptionIndex) : 'None/Skipped'}.
  
  Format in clean, readable Markdown.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error('Gemini Explanation Generation failed: %O', error);
    return `Explanation failed to load. The correct answer is: ${options[correctAnswerIndex]}`;
  }
};

// Helper function to return realistic mock questions
function getMockQuestions(subject, topic, difficulty, count, examType) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const options = [
      `Standard Option A for question ${i}`,
      `Correct Option B for question ${i} (Answer)`,
      `Distractor Option C for question ${i}`,
      `Distractor Option D for question ${i}`
    ];
    list.push({
      question: `This is simulated mock question ${i} about "${topic}" in "${subject}" targeting ${examType} exams. Which of the following is correct?`,
      options: options,
      correctAnswer: 1, // Option B
      explanation: `Option B is correct because under standard ${examType} rules, the topic "${topic}" dictates that this is the scientifically verified relation.`,
      difficulty: difficulty,
      tags: [examType, subject, topic],
      generatedByAI: true
    });
  }
  return list;
}

module.exports = {
  generateQuestions,
  analyzeResult,
  generateNotes,
  generateExplanation
};
