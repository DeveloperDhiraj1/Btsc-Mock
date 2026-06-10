import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { BookOpen, Sparkles, FileText, Printer, Loader2, Bookmark, Trash2, HelpCircle } from 'lucide-react';

export default function Notes() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'bookmarks'

  // Notes state
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [expandedB, setExpandedB] = useState(null);

  const defaultNotes = [
    {
      title: 'Bernoulli Equation - Fluid Mechanics',
      subject: 'Civil Engineering',
      content: `### Bernoulli's Equation Overview\n\nBernoulli's equation states that for an incompressible, frictionless, and steady fluid flow, the sum of pressure energy, kinetic energy, and potential energy per unit volume remains constant along a streamline.\n\n#### Formula:\n$$P + \\frac{1}{2}\\rho v^2 + \\rho g h = \\text{Constant}$$\n\nWhere:\n- $P$ = Static Pressure\n- $\\rho$ = Fluid Density\n- $v$ = Flow Velocity\n- $g$ = Gravitational Acceleration\n- $h$ = Elevation Height\n\n#### Core Assumptions:\n1. Non-viscous flow (no friction forces)\n2. Steady flow\n3. Incompressible fluid\n4. Flow along a single streamline`
    },
    {
      title: 'Indian Constitution - Article Assemblies',
      subject: 'General Studies',
      content: `### Indian Constitution - Critical Articles Assembly\n\nKey articles frequently tested in SSC JE and BPSC state exams:\n\n- **Article 14**: Equality before law\n- **Article 21**: Protection of life and personal liberty\n- **Article 32**: Right to Constitutional Remedies (termed the heart and soul of constitution by Dr. B.R. Ambedkar)\n- **Article 44**: Uniform Civil Code (Directive Principles)\n- **Article 324**: Election Commission supervision powers`
    }
  ];

  const fetchBookmarks = async () => {
    setLoadingBookmarks(true);
    try {
      const res = await api.get('/auth/bookmarks');
      if (res.data.success) {
        setBookmarks(res.data.data);
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to retrieve bookmarks', type: 'error' }));
    } finally {
      setLoadingBookmarks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookmarks') {
      fetchBookmarks();
    }
  }, [activeTab]);

  const handleGenerateNotes = async (e) => {
    e.preventDefault();
    if (!subject || !topic) {
      dispatch(addToast({ message: 'Please specify both subject and topic', type: 'error' }));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/ai/generate-notes', { subject, topic });
      if (res.data.success) {
        setNotesContent(res.data.data);
        dispatch(addToast({ message: 'Revision notes generated successfully by AI', type: 'success' }));
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to generate AI notes', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (id) => {
    try {
      const res = await api.delete(`/auth/bookmarks/${id}`);
      if (res.data.success) {
        setBookmarks(prev => prev.filter(b => b._id !== id));
        dispatch(addToast({ message: 'Removed from bookmarks', type: 'success' }));
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to delete bookmark', type: 'error' }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Revision Library</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Review formula sheets or browse bookmarked questions</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'notes'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                : 'bg-white dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-gray-150'
            }`}
          >
            AI Study Notes
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'bookmarks'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                : 'bg-white dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-gray-150'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarked Qs ({activeTab === 'bookmarks' ? bookmarks.length : '*'})</span>
          </button>
        </div>
      </div>

      {activeTab === 'notes' ? (
        /* Notes Tab Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Left Side: Generator Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm">
              <h3 className="text-base font-extrabold mb-5 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>Notes Generator Form</span>
              </h3>

              <form onSubmit={handleGenerateNotes} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Exam Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Mechanical Engineering"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:text-white transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Target Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Thermodynamics Laws"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:text-white transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Notes</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Seeded Quick Templates list */}
            <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl shadow-sm space-y-4">
              <h4 className="font-extrabold text-sm text-gray-400 uppercase tracking-wider">Quick Study Notes</h4>
              <div className="space-y-3">
                {defaultNotes.map((dn, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNotesContent(dn.content)}
                    className="w-full text-left p-3.5 border border-gray-200 dark:border-gray-800 hover:border-primary-500 dark:hover:border-primary-500 rounded-2xl transition-all hover:bg-primary-50/10"
                  >
                    <span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">{dn.subject}</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-150 line-clamp-1">{dn.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Revision Notes Reader */}
          <div className="lg:col-span-2 bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col min-h-[500px]">
            
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-850 pb-4 mb-6 shrink-0">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary-500" />
                <span>Revision Worksheet Viewer</span>
              </h3>

              {notesContent && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 border border-gray-250 dark:border-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-200 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Print Notes"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px] pr-2">
              {notesContent ? (
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-650 dark:text-gray-300 whitespace-pre-line space-y-4">
                  {notesContent}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-gray-400 space-y-3">
                  <BookOpen className="w-12 h-12 text-gray-300" />
                  <p className="text-sm">No notes loaded. Select a quick study note from the left list or generate a new sheet via AI.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Bookmarks Tab List */
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm max-w-4xl w-full animate-fadeIn">
          <h3 className="text-base font-extrabold flex items-center space-x-2 border-b border-gray-100 dark:border-gray-850 pb-4 mb-6">
            <Bookmark className="w-5 h-5 text-amber-500 fill-current" />
            <span>Bookmarked Technical Questions Pool</span>
          </h3>

          {loadingBookmarks ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : bookmarks.length > 0 ? (
            <div className="space-y-4">
              {bookmarks.map((b, index) => {
                const isExpanded = expandedB === b._id;
                return (
                  <div 
                    key={b._id}
                    className="p-5 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="bg-primary-50 dark:bg-primary-950/20 text-primary-500 text-[10px] font-extrabold px-2.5 py-1 rounded-md">
                          {b.examType || 'Technical'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">{b.subject} &bull; {b.topic}</span>
                      </div>

                      <button
                        onClick={() => handleRemoveBookmark(b._id)}
                        className="text-rose-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p 
                      onClick={() => setExpandedB(isExpanded ? null : b._id)}
                      className="font-bold text-sm text-gray-800 dark:text-gray-100 cursor-pointer hover:text-primary-500 leading-relaxed"
                    >
                      {index + 1}. {b.question}
                    </p>

                    {isExpanded && (
                      <div className="pt-2 space-y-4 border-t border-gray-100 dark:border-gray-850 animate-slideDown">
                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {b.options.map((opt, oIdx) => {
                            const isCorrect = b.correctAnswer === oIdx;
                            return (
                              <div 
                                key={oIdx}
                                className={`p-3.5 border rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                                  isCorrect 
                                    ? 'bg-emerald-50 border-emerald-350 text-emerald-850 dark:bg-emerald-950/10 dark:border-emerald-800 dark:text-emerald-300'
                                    : 'bg-gray-50 border-gray-150 dark:bg-dark-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[10px] ${
                                  isCorrect ? 'bg-emerald-500 text-white border-transparent' : 'bg-transparent border-gray-300'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        <div className="bg-gray-50 dark:bg-dark-200 p-4 rounded-xl border border-gray-150 dark:border-gray-800 text-xs leading-relaxed">
                          <strong className="text-gray-700 dark:text-gray-300 flex items-center space-x-1.5 mb-1.5">
                            <HelpCircle className="w-4 h-4 text-emerald-500" />
                            <span>Solutions Walkthrough</span>
                          </strong>
                          <p className="text-gray-500 dark:text-gray-450">{b.explanation}</p>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400 space-y-2">
              <Bookmark className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm">You haven't bookmarked any questions yet.</p>
              <p className="text-xs text-gray-450">Review your Mock Test scorecards and click bookmark on tough questions.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
