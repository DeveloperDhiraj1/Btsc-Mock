import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { addToast } from '../store/slices/uiSlice';
import { useDispatch } from 'react-redux';
import {
  Sparkles, FileSpreadsheet, ListPlus, Loader2,
  Trash2, HelpCircle, ChevronLeft, ChevronRight, CheckCircle2,
  Pencil, X, Save
} from 'lucide-react';

export default function AdminQuestions() {
  const dispatch = useDispatch();

  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // CSV State
  const [csvFile, setCsvFile] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  // AI Generation State
  const [aiSubject, setAiSubject] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiCount, setAiCount] = useState('5');
  const [aiExamType, setAiExamType] = useState('BTSC');
  const [generatingAI, setGeneratingAI] = useState(false);

  // Edit modal state
  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/questions?page=${page}&limit=10`);
      if (res.data.success) {
        setQuestions(res.data.data);
        setTotal(res.data.total);
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to fetch question pool', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page]);

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      dispatch(addToast({ message: 'Please select a CSV file first', type: 'error' }));
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);
    setUploadingCsv(true);

    try {
      const res = await api.post('/questions/upload-csv', formData);
      if (res.data.success) {
        dispatch(addToast({ message: res.data.message || 'CSV questions queued for bulk import!', type: 'success' }));
        setCsvFile(null);
        setTimeout(fetchQuestions, 1000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'CSV file upload failed';
      dispatch(addToast({ message: errorMessage, type: 'error' }));
      console.error('CSV upload error response:', err.response?.data || err.message);
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if (!aiSubject || !aiTopic) {
      dispatch(addToast({ message: 'Please specify subject and topic', type: 'error' }));
      return;
    }

    setGeneratingAI(true);
    try {
      const res = await api.post('/ai/generate-questions', {
        subject: aiSubject,
        topic: aiTopic,
        difficulty: aiDifficulty,
        questionCount: parseInt(aiCount),
        examType: aiExamType,
        saveToDb: true
      });
      if (res.data.success) {
        dispatch(addToast({ message: `Gemini successfully generated and saved ${aiCount} questions to pool!`, type: 'success' }));
        setAiSubject('');
        setAiTopic('');
        fetchQuestions();
      }
    } catch (err) {
      dispatch(addToast({ message: 'Gemini question generation failed', type: 'error' }));
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;

    try {
      const res = await api.delete(`/questions/${id}`);
      if (res.data.success) {
        dispatch(addToast({ message: 'Question deleted successfully', type: 'success' }));
        fetchQuestions();
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to delete question', type: 'error' }));
    }
  };

  const openEdit = (q) => {
    setEditing({
      _id: q._id,
      subject: q.subject || '',
      topic: q.topic || '',
      examType: q.examType || 'BTSC',
      difficulty: q.difficulty || 'medium',
      question: q.question || '',
      options: q.options && q.options.length === 4 ? [...q.options] : ['', '', '', ''],
      correctAnswer: q.correctAnswer ?? 0,
      explanation: q.explanation || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    try {
      const res = await api.put(`/questions/${editing._id}`, {
        subject: editing.subject,
        topic: editing.topic,
        examType: editing.examType,
        difficulty: editing.difficulty,
        question: editing.question,
        options: editing.options,
        correctAnswer: parseInt(editing.correctAnswer),
        explanation: editing.explanation,
        editedByAdmin: true
      });
      if (res.data.success) {
        dispatch(addToast({ message: 'Question updated', type: 'success' }));
        setEditing(null);
        fetchQuestions();
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to update question', type: 'error' }));
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Question Bank</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage platform-wide questions, import Excel/CSV files, or trigger AI generator flows</p>
      </div>

      {/* Grid forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CSV Upload card */}
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-5">
          <h3 className="text-base font-extrabold flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <span>Bulk CSV Import</span>
          </h3>
          <p className="text-gray-450 text-xs leading-relaxed">
            Format spreadsheet with columns: <strong>subject, topic, question, option1, option2, option3, option4, correctAnswer (0-3), explanation, difficulty, examType</strong>
          </p>

          <form onSubmit={handleCsvUpload} className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 dark:file:bg-dark-200 file:text-gray-700 dark:file:text-gray-300 hover:file:opacity-90 cursor-pointer"
              required
            />
            <button
              type="submit"
              disabled={uploadingCsv}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
            >
              {uploadingCsv ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Upload spreadsheet</span>}
            </button>
          </form>
        </div>

        {/* AI Bulk generator card */}
        <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 md:p-8 rounded-3xl shadow-sm space-y-5">
          <h3 className="text-base font-extrabold flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>AI Question Builder</span>
          </h3>

          <form onSubmit={handleAIGenerate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Physics"
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  required
                  className="w-full px-4.5 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Gravity"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  required
                  className="w-full px-4.5 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Exam Type</label>
                <select
                  value={aiExamType}
                  onChange={(e) => setAiExamType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white text-xs"
                >
                  <option value="BTSC">BTSC JE</option>
                  <option value="SSC">SSC JE</option>
                  <option value="BPSC">BPSC AE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Difficulty</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white text-xs"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Count</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white text-xs"
                >
                  <option value="5">5 Qs</option>
                  <option value="10">10 Qs</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={generatingAI}
              className="w-full bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-500/50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              {generatingAI ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Compile AI Questions</span>}
            </button>
          </form>
        </div>

      </div>

      {/* Table view list */}
      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-850 flex items-center justify-between">
          <h3 className="font-extrabold text-base flex items-center space-x-2">
            <ListPlus className="w-5 h-5 text-primary-500" />
            <span>Active Question Repository</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : questions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-200 border-b border-gray-150 dark:border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4.5">Q. Text</th>
                  <th className="px-6 py-4.5">Exam</th>
                  <th className="px-6 py-4.5">Subject</th>
                  <th className="px-6 py-4.5">Topic</th>
                  <th className="px-6 py-4.5">Difficulty</th>
                  <th className="px-6 py-4.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850 text-xs">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50 dark:hover:bg-dark-200">
                    <td className="px-6 py-4.5 font-medium text-gray-800 dark:text-gray-150 max-w-xs truncate">{q.question}</td>
                    <td className="px-6 py-4.5">{q.examType}</td>
                    <td className="px-6 py-4.5 font-semibold">{q.subject}</td>
                    <td className="px-6 py-4.5">{q.topic}</td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold capitalize text-[10px] ${
                        q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : q.difficulty === 'hard' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <button
                        onClick={() => openEdit(q)}
                        className="text-indigo-500 hover:text-indigo-600 p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all mr-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="text-rose-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-gray-400 text-sm">
            Question bank is empty. Upload a CSV spreadsheet or build using Gemini above.
          </div>
        )}

        {/* Pagination footer */}
        {total > 10 && (
          <div className="p-5 bg-gray-50 dark:bg-dark-200 border-t border-gray-100 dark:border-gray-850 flex items-center justify-between">
            <span className="text-[11px] text-gray-450 font-bold">Showing {questions.length} of {total} questions</span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 bg-white dark:bg-dark-300 border border-gray-250 dark:border-gray-800 disabled:opacity-50 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page * 10 >= total}
                onClick={() => setPage(page + 1)}
                className="p-2 bg-white dark:bg-dark-300 border border-gray-250 dark:border-gray-800 disabled:opacity-50 rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Question Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <form
            onSubmit={handleSaveEdit}
            className="bg-white dark:bg-dark-300 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-dark-300">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                <Pencil className="w-5 h-5 text-indigo-500" />
                <span>Edit Question</span>
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Subject</label>
                  <input
                    type="text"
                    value={editing.subject}
                    onChange={e => setEditing({ ...editing, subject: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Topic</label>
                  <input
                    type="text"
                    value={editing.topic}
                    onChange={e => setEditing({ ...editing, topic: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Exam Type</label>
                  <select
                    value={editing.examType}
                    onChange={e => setEditing({ ...editing, examType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl dark:text-white text-sm"
                  >
                    <option value="BTSC">BTSC JE</option>
                    <option value="SSC">SSC JE</option>
                    <option value="BPSC">BPSC AE</option>
                    <option value="Railway">Railway RRB</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Difficulty</label>
                  <select
                    value={editing.difficulty}
                    onChange={e => setEditing({ ...editing, difficulty: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl dark:text-white text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Question</label>
                <textarea
                  value={editing.question}
                  onChange={e => setEditing({ ...editing, question: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Options (pick the correct one)</label>
                {editing.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={parseInt(editing.correctAnswer) === idx}
                      onChange={() => setEditing({ ...editing, correctAnswer: idx })}
                      className="accent-emerald-500 w-4 h-4 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={e => {
                        const next = [...editing.options];
                        next[idx] = e.target.value;
                        setEditing({ ...editing, options: next });
                      }}
                      required
                      placeholder={`Option ${idx + 1}`}
                      className={`flex-1 px-4 py-2 bg-gray-50 dark:bg-dark-200 border rounded-xl text-sm dark:text-white ${
                        parseInt(editing.correctAnswer) === idx
                          ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'border-gray-250 dark:border-gray-800'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Explanation</label>
                <textarea
                  value={editing.explanation}
                  onChange={e => setEditing({ ...editing, explanation: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-dark-300">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
