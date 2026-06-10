import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTests } from '../store/slices/testSlice';
import { addToast } from '../store/slices/uiSlice';
import { Play, Clock, AlertTriangle, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';

export default function MockTests() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTest, setSelectedTest] = useState(null); // active selected test for instructions modal
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { tests, loading } = useSelector((state) => state.test);

  const categories = ['BTSC', 'SSC', 'Railway', 'BPSC', 'Polytechnic'];

  useEffect(() => {
    dispatch(fetchTests(selectedCategory));
  }, [dispatch, selectedCategory]);

  const handleStartExamClick = (test) => {
    setSelectedTest(test);
  };

  const handleConfirmStart = () => {
    if (selectedTest) {
      const testId = selectedTest._id;
      setSelectedTest(null);
      dispatch(addToast({ message: 'Initializing secure proctored environment...', type: 'info' }));
      navigate(`/test/attempt/${testId}`);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Exam Series Hub</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Select your exam stream and practice with state-level mocks</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2.5 border-b border-gray-200 dark:border-gray-800 pb-4">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            selectedCategory === ''
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
              : 'bg-white dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-gray-150'
          }`}
        >
          All Exams
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                : 'bg-white dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-gray-150'
            }`}
          >
            {cat} Exam
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-white dark:bg-dark-300 rounded-3xl border border-gray-200/50 dark:border-gray-800/50" />
          ))}
        </div>
      ) : tests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div 
              key={test._id}
              className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <span className="bg-primary-50 dark:bg-primary-950/20 text-primary-500 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                  {test.examCategory} Exam
                </span>
                
                <h3 className="font-extrabold text-lg mt-4 text-gray-800 dark:text-gray-100 line-clamp-2">{test.title}</h3>
                
                {/* Stats */}
                <div className="flex items-center space-x-4 mt-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{test.duration} mins</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>{test.questions?.length || 0} MCQs</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-850 pt-5 mt-6 flex items-center justify-between">
                <div className="text-xs text-gray-400 font-medium">
                  Negative Mark: <span className="text-rose-500 font-bold">-{test.negativeMarking}x</span>
                </div>
                <button
                  onClick={() => handleStartExamClick(test)}
                  className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white hover:opacity-90 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Test</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl">
          <p className="text-gray-400 text-sm">No mock tests available in this category yet.</p>
        </div>
      )}

      {/* Instructions Proctoring Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-300 border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
            
            <div className="flex items-center space-x-3 text-amber-500">
              <ShieldAlert className="w-7 h-7" />
              <h3 className="text-xl font-black">Proctored Exam Instructions</h3>
            </div>

            <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              <p>You are about to start a monitored mock test. Please read the guidelines carefully before beginning:</p>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span><strong>Fullscreen Enforcement:</strong> The test will request full-screen mode on launch. Do not escape.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span><strong>Tab Switch Detection:</strong> Tab switching is logged. Focus shifts exceeding <strong>3 events</strong> will auto-submit the exam scorecard.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span><strong>Input Locking:</strong> Right click context menu, copy, paste, and text selections are locked to protect exam integrity.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span><strong>Pacing Timer:</strong> Ensure you keep track of the remaining clock. The system submits answers automatically when duration lapses.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setSelectedTest(null)}
                className="flex-1 bg-gray-100 dark:bg-dark-200 text-gray-700 dark:text-gray-300 hover:opacity-90 font-bold py-3.5 rounded-2xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStart}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-primary-500/20 transition-all"
              >
                Accept & Begin
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
