import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Trophy, Clock, Sparkles, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

export default function ResultPage() {
  const { resultId } = useParams();
  const dispatch = useDispatch();

  // Track expanded question state and active AI explanations
  const [expandedQ, setExpandedQ] = useState(null);
  const [aiExplanations, setAiExplanations] = useState({}); // { questionId: explanationText }
  const [aiExplaining, setAiExplaining] = useState({}); // { questionId: boolean }

  return (
    <ResultPageContent 
      resultId={resultId} 
      dispatch={dispatch} 
      expandedQ={expandedQ} 
      setExpandedQ={setExpandedQ}
      aiExplanations={aiExplanations}
      setAiExplanations={setAiExplanations}
      aiExplaining={aiExplaining}
      setAiExplaining={setAiExplaining}
    />
  );
}

// Subcomponent to organize result loading
function ResultPageContent({ 
  resultId, dispatch, expandedQ, setExpandedQ, 
  aiExplanations, setAiExplanations, aiExplaining, setAiExplaining 
}) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedList, setBookmarkedList] = useState([]);

  useEffect(() => {
    const getResultDetails = async () => {
      try {
        const res = await api.get(`/tests/results/${resultId}`);
        if (res.data.success) {
          setResult(res.data.data);
        }
      } catch (err) {
        dispatch(addToast({
          message: err?.response?.data?.message || 'Error retrieving scorecard details',
          type: 'error'
        }));
      } finally {
        setLoading(false);
      }
    };
    
    const fetchBookmarks = async () => {
      try {
        const res = await api.get('/auth/bookmarks');
        if (res.data.success) {
          setBookmarkedList(res.data.data.map(b => b._id || b));
        }
      } catch (e) {}
    };

    getResultDetails();
    fetchBookmarks();
  }, [resultId, dispatch]);

  const handleToggleBookmark = async (questionId) => {
    const isBookmarked = bookmarkedList.includes(questionId);
    try {
      if (isBookmarked) {
        await api.delete(`/auth/bookmarks/${questionId}`);
        setBookmarkedList(prev => prev.filter(id => id !== questionId));
        dispatch(addToast({ message: 'Removed from bookmarks', type: 'success' }));
      } else {
        await api.post('/auth/bookmarks', { questionId });
        setBookmarkedList(prev => [...prev, questionId]);
        dispatch(addToast({ message: 'Question added to bookmarks!', type: 'success' }));
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to update bookmark', type: 'error' }));
    }
  };

  const handleFetchExplanation = async (question, options, correctIdx, selectedIdx, questionId) => {
    if (aiExplanations[questionId]) {
      setExpandedQ(expandedQ === questionId ? null : questionId);
      return;
    }

    setExpandedQ(questionId);
    setAiExplaining(prev => ({ ...prev, [questionId]: true }));

    try {
      const res = await api.post('/ai/generate-explanation', {
        questionText: question,
        options,
        correctAnswerIndex: correctIdx,
        selectedOptionIndex: selectedIdx
      });
      if (res.data.success) {
        setAiExplanations(prev => ({ ...prev, [questionId]: res.data.data }));
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to generate AI explanation', type: 'error' }));
    } finally {
      setAiExplaining(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-20 bg-white dark:bg-dark-300 rounded-3xl">
        <p className="text-gray-400 text-sm">Failed to load scorecard.</p>
      </div>
    );
  }

  // Count distribution
  const correct = result.answers?.filter(a => a.isCorrect).length || 0;
  const skipped = result.answers?.filter(a => a.selectedOption === null).length || 0;
  const incorrect = (result.answers?.length || 0) - correct - skipped;

  const chartData = [
    { name: 'Correct', value: correct, color: '#10b981' },
    { name: 'Incorrect', value: incorrect, color: '#f43f5e' },
    { name: 'Skipped', value: skipped, color: '#94a3b8' }
  ].filter(c => c.value > 0);

  return (
    <div className="space-y-8">
      
      {/* Visual Header Grid */}
      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black">Mock Test Scorecard</h2>
            <p className="text-gray-450 text-xs mt-1">Detailed response evaluation and performance trends</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <div className="text-center bg-gray-50 dark:bg-dark-200 border border-gray-150 dark:border-gray-800 px-5 py-3 rounded-2xl">
            <span className="text-xs text-gray-400 font-semibold block">Score Obtained</span>
            <span className="text-xl font-extrabold text-primary-500">{result.score}</span>
          </div>
          <div className="text-center bg-gray-50 dark:bg-dark-200 border border-gray-150 dark:border-gray-800 px-5 py-3 rounded-2xl">
            <span className="text-xs text-gray-400 font-semibold block">Accuracy</span>
            <span className="text-xl font-extrabold text-emerald-500">{result.accuracy}%</span>
          </div>
          <div className="text-center bg-gray-50 dark:bg-dark-200 border border-gray-150 dark:border-gray-800 px-5 py-3 rounded-2xl">
            <span className="text-xs text-gray-400 font-semibold block">Time Spent</span>
            <span className="text-xl font-extrabold text-gray-700 dark:text-white flex items-center justify-center space-x-1">
              <Clock className="w-4 h-4 text-gray-400 mr-1" />
              <span>{Math.round(result.timeSpent / 60)}m</span>
            </span>
          </div>
        </div>
      </div>

      {/* Answer Distribution Pie Chart and AI summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pie Chart */}
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <h3 className="text-lg font-bold mb-6">Response Distribution</h3>
          {chartData.length > 0 ? (
            <div className="h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend overlay details */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-10px]">
                <span className="text-2xl font-black text-gray-800 dark:text-white">
                  {result.answers?.length || 0}
                </span>
                <span className="text-xs text-gray-450 uppercase font-semibold">Total MCQs</span>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-450">No answers recorded.</div>
          )}

          <div className="flex justify-center space-x-6 border-t border-gray-100 dark:border-gray-800 pt-5 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-gray-500">Correct ({correct})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
              <span className="text-xs font-semibold text-gray-500">Incorrect ({incorrect})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 rounded-full bg-gray-400" />
              <span className="text-xs font-semibold text-gray-500">Skipped ({skipped})</span>
            </div>
          </div>
        </div>

        {/* AI Performance Breakdown */}
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5.5 h-5.5 text-indigo-500" />
            <h3 className="text-lg font-bold">AI Detailed Performance Audit</h3>
          </div>

          <div className="space-y-4 text-sm leading-relaxed">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider block mb-1">Key Strengths</span>
              <ul className="list-disc pl-5 text-gray-500 dark:text-gray-400 space-y-1">
                {result.AIAnalysis?.strengths?.map((s, idx) => <li key={idx}>{s}</li>) || <li>High accuracy on simple questions.</li>}
              </ul>
            </div>

            <div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-450 uppercase tracking-wider block mb-1">Identified Weaknesses</span>
              <ul className="list-disc pl-5 text-gray-500 dark:text-gray-400 space-y-1">
                {result.AIAnalysis?.weaknesses?.map((w, idx) => <li key={idx}>{w}</li>) || <li>Numeric equations.</li>}
              </ul>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-450 uppercase tracking-wider block mb-0.5">Pacing & Time Management</span>
              <p className="text-gray-500 dark:text-gray-400 text-xs">{result.AIAnalysis?.timeManagement}</p>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/50 p-4 rounded-2xl text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
            <strong>Remedial Study Tip:</strong> {result.AIAnalysis?.studyPlanSuggestion}
          </div>
        </div>

      </div>

      {/* Solutions / Questions review sheet */}
      {result.answers?.length > 0 && (
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold mb-6">Question Sheet Review</h3>

          <div className="space-y-6 divide-y divide-gray-100 dark:divide-gray-850">
            {result.answers.map((ans, idx) => {
              const qId = ans.questionId?._id || ans.questionId;
              const isCorrect = ans.isCorrect;
              const isSkipped = ans.selectedOption === null;

              return (
                <div key={idx} className={`pt-6 ${idx === 0 ? 'pt-0' : ''} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-gray-400">Question {idx + 1}</span>
                      <button
                        onClick={() => handleToggleBookmark(qId)}
                        className={`text-xs font-bold flex items-center space-x-1 ${
                          bookmarkedList.includes(qId) ? 'text-amber-500' : 'text-gray-400 hover:text-gray-500'
                        }`}
                      >
                        ★ {bookmarkedList.includes(qId) ? 'Bookmarked' : 'Bookmark'}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      {isSkipped ? (
                        <span className="text-gray-450 bg-gray-100 dark:bg-dark-200 px-2 py-1 rounded-md font-semibold">Skipped</span>
                      ) : isCorrect ? (
                        <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md font-semibold">Correct</span>
                      ) : (
                        <span className="text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-md font-semibold">Incorrect</span>
                      )}
                      <span className="text-gray-400">Time spent: {ans.timeSpent}s</span>
                    </div>
                  </div>

                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                    {ans.questionId?.question || `Simulated technical physics MCQ ${idx + 1}. What is the density coefficient?`}
                  </p>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(ans.questionId?.options || ['Option A text', 'Option B (Correct)', 'Option C text', 'Option D text']).map((opt, oIdx) => {
                      const isSelected = ans.selectedOption === oIdx;
                      const isCorrectOpt = (ans.questionId?.correctAnswer ?? 1) === oIdx;
                      
                      let bgClass = 'bg-gray-50 border-gray-150 dark:bg-dark-200 dark:border-gray-800';
                      if (isSelected) {
                        bgClass = isCorrect ? 'bg-emerald-50 border-emerald-350 text-emerald-950 dark:bg-emerald-950/10 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50 border-rose-350 text-rose-950 dark:bg-rose-950/10 dark:border-rose-800 dark:text-rose-300';
                      } else if (isCorrectOpt) {
                        bgClass = 'bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/5 dark:border-emerald-900/50 dark:text-emerald-450';
                      }

                      return (
                        <div key={oIdx} className={`p-3 border rounded-xl text-xs font-semibold flex items-center space-x-2 ${bgClass}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[10px] ${
                            isSelected ? 'bg-white border-transparent' : 'bg-transparent border-gray-300'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Explanation Drawer Trigger */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleFetchExplanation(
                        ans.questionId?.question || 'Density Coefficient question',
                        ans.questionId?.options || ['A', 'B', 'C', 'D'],
                        ans.questionId?.correctAnswer ?? 1,
                        ans.selectedOption,
                        qId
                      )}
                      className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center space-x-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{expandedQ === qId ? 'Close AI Explanation' : 'Ask AI for Explanation'}</span>
                      {expandedQ === qId ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {expandedQ === qId && (
                      <div className="mt-3 bg-gray-50 dark:bg-dark-200 border border-gray-150 dark:border-gray-800 p-5 rounded-2xl text-xs leading-relaxed text-gray-650 dark:text-gray-350">
                        {aiExplaining[qId] ? (
                          <div className="flex items-center space-x-2 text-indigo-500">
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            <span>Gemini is compiling solution walkthrough...</span>
                          </div>
                        ) : (
                          <div className="prose dark:prose-invert max-w-none whitespace-pre-line">
                            {aiExplanations[qId] || 'No explanation available.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center space-x-4">
        <Link
          to="/dashboard"
          className="bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-md"
        >
          Back to Dashboard
        </Link>
        <Link
          to="/leaderboard"
          className="bg-white dark:bg-dark-300 border border-gray-250 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold px-6 py-3 rounded-2xl text-sm"
        >
          Check Rankings
        </Link>
      </div>

    </div>
  );
}
