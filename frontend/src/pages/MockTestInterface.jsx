import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { startTestAttempt, submitTestAttempt, saveAnswer, selectQuestion, clearActiveTest } from '../store/slices/testSlice';
import { addToast } from '../store/slices/uiSlice';
import { createSocket } from '../services/socket';
import { Loader2, AlertOctagon, HelpCircle, Check, ArrowRight, ArrowLeft, Bookmark } from 'lucide-react';
import logo from '../assets/logo.png';

export default function MockTestInterface() {
  const { testId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeTest, activeAttemptAnswers, currentQuestionIndex, submitting } = useSelector((state) => state.test);
  const { user } = useSelector((state) => state.auth);

  const [remainingTime, setRemainingTime] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  
  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const questionStartTimeRef = useRef(Date.now());

  // 1. Load test questions template
  useEffect(() => {
    dispatch(startTestAttempt(testId));
    return () => {
      dispatch(clearActiveTest());
      if (socketRef.current) {
        socketRef.current.emit('leave_exam', { userId: user?.id, testId });
        socketRef.current.disconnect();
      }
    };
  }, [dispatch, testId, user?.id]);

  // 2. Setup Fullscreen, clipboard, and tab-switch monitors
  useEffect(() => {
    if (!activeTest) return;

    // Enforce Fullscreen request
    const enterFullscreen = async () => {
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } catch (err) {
        dispatch(addToast({ message: 'Please allow fullscreen mode to attempt this exam.', type: 'info' }));
      }
    };
    enterFullscreen();

    // Block right-clicks and copy/paste
    const preventCheatingKeys = (e) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', preventCheatingKeys);
    document.addEventListener('copy', preventCheatingKeys);
    document.addEventListener('paste', preventCheatingKeys);

    // Monitor focus/tab switching (Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationCount((prev) => {
          const nextCount = prev + 1;
          
          if (socketRef.current) {
            socketRef.current.emit('proctor_violation', {
              userId: user?.id,
              testId,
              violationType: 'tab_switch',
              count: nextCount
            });
          }

          return nextCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', preventCheatingKeys);
      document.removeEventListener('copy', preventCheatingKeys);
      document.removeEventListener('paste', preventCheatingKeys);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [activeTest, testId, user?.id, dispatch]);

  // 3. Connect Socket.io synchronizer
  useEffect(() => {
    if (!activeTest) return;

    setRemainingTime(activeTest.duration * 60);

    socketRef.current = createSocket();

    socketRef.current.emit('join_exam', {
      userId: user?.id,
      testId,
      duration: activeTest.duration
    });

    socketRef.current.on('timer_tick', ({ remaining }) => {
      setRemainingTime(remaining);
    });

    // Forced Submit by proctor rules
    socketRef.current.on('force_submit_exam', ({ reason }) => {
      dispatch(addToast({ message: 'Exam auto-submitted due to proctor violations.', type: 'error' }));
      triggerSubmit();
    });

    socketRef.current.on('timer_expired', () => {
      dispatch(addToast({ message: 'Time expired! Submitting answers...', type: 'info' }));
      triggerSubmit();
    });

    socketRef.current.on('violation_alert', ({ message, count }) => {
      dispatch(addToast({ message, type: count >= 3 ? 'error' : 'info' }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [activeTest, testId, user?.id]);

  // Sync selected radio option when loading a question index
  useEffect(() => {
    if (activeTest && activeAttemptAnswers.length > 0) {
      const q = activeTest.questions[currentQuestionIndex];
      const saved = activeAttemptAnswers.find(a => a.questionId === q._id);
      setSelectedOpt(saved?.selectedOption !== null ? saved.selectedOption : null);
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestionIndex, activeTest, activeAttemptAnswers]);

  const handleOptionSelect = (index) => {
    setSelectedOpt(index);
  };

  const handleSaveAndNext = () => {
    const q = activeTest.questions[currentQuestionIndex];
    const timeSpent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

    // Save answer in Redux
    dispatch(saveAnswer({
      questionId: q._id,
      selectedOption: selectedOpt,
      timeSpent
    }));

    if (currentQuestionIndex < activeTest.questions.length - 1) {
      dispatch(selectQuestion(currentQuestionIndex + 1));
    }
  };

  const handleMarkForReview = () => {
    const q = activeTest.questions[currentQuestionIndex];
    const timeSpent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);

    // If option is selected, save it, otherwise skip but tag as review
    dispatch(saveAnswer({
      questionId: q._id,
      selectedOption: selectedOpt !== null ? selectedOpt : -1, // -1 represents mark review with no selection
      timeSpent
    }));

    if (currentQuestionIndex < activeTest.questions.length - 1) {
      dispatch(selectQuestion(currentQuestionIndex + 1));
    }
  };

  const handleClearResponse = () => {
    setSelectedOpt(null);
    const q = activeTest.questions[currentQuestionIndex];
    dispatch(saveAnswer({
      questionId: q._id,
      selectedOption: null,
      timeSpent: 0
    }));
  };

  const triggerSubmit = async () => {
    // 1. Exit fullscreen
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (e) {}
    }

    // 2. Submit answers to backend
    const totalTimeSpent = (activeTest.duration * 60) - remainingTime;
    const action = await dispatch(submitTestAttempt({
      testId: activeTest._id,
      answers: activeAttemptAnswers,
      timeSpent: Math.max(1, totalTimeSpent)
    }));

    if (submitTestAttempt.fulfilled.match(action)) {
      dispatch(addToast({ message: 'Exam submitted successfully.', type: 'success' }));
      
      // Update Live WebSocket Leaderboard
      if (socketRef.current) {
        socketRef.current.emit('submit_score', {
          name: user?.name,
          score: action.payload.score,
          examCategory: activeTest.examCategory
        });
      }

      navigate(`/results/${action.payload._id}`);
    }
  };

  if (!activeTest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-400 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const currentQ = activeTest.questions[currentQuestionIndex];

  // Helper format remaining timer (HH:MM:SS)
  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="exam-fullscreen flex flex-col min-h-screen bg-gray-50 dark:bg-dark-450 text-gray-900 dark:text-gray-100 select-none"
    >
      
      {/* Header bar */}
      <header className="h-16 px-6 bg-white dark:bg-dark-300 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="StudyNexus logo" className="h-7 w-7 rounded-md object-cover" />
          <h2 className="font-extrabold text-sm md:text-base">{activeTest.title}</h2>
        </div>

        {/* Timer countdown clock */}
        <div className="bg-gray-100 dark:bg-dark-200 border border-gray-250 dark:border-gray-800 px-4 py-2 rounded-xl flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-400 uppercase">Time Left:</span>
          <span className={`font-mono font-bold text-sm ${remainingTime < 300 ? 'text-rose-500 animate-pulse' : 'text-gray-700 dark:text-white'}`}>
            {formatTimer(remainingTime)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={triggerSubmit}
            disabled={submitting}
            className="bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Submit Exam</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Proctoring Warnings Header Warning */}
      {violationCount > 0 && (
        <div className="bg-rose-500 text-white py-2 px-6 flex items-center space-x-3 text-xs md:text-sm font-bold shadow-md shrink-0">
          <AlertOctagon className="w-4.5 h-4.5 shrink-0" />
          <span>Warning: Proctor violation detected! Focus changes registered: {violationCount} / 3. Exam will submit automatically at 3 violations.</span>
        </div>
      )}

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Question Sheet */}
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-between overflow-y-auto bg-gray-50 dark:bg-dark-400">
          
          <div className="max-w-3xl w-full mx-auto space-y-8">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-850 pb-4">
              <span className="text-xs font-extrabold uppercase text-primary-500 bg-primary-50 dark:bg-primary-950/20 px-3 py-1.5 rounded-lg">
                Question {currentQuestionIndex + 1} of {activeTest.questions.length}
              </span>
              <span className="text-xs text-gray-400 font-semibold capitalize">
                Subject: {currentQ.subject} | Topic: {currentQ.topic}
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-150 leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Option Radio List */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full flex items-center space-x-4 p-4 border rounded-2xl text-left transition-all ${
                      isSelected 
                        ? 'bg-primary-50 border-primary-500 text-primary-950 dark:bg-primary-950/10 dark:border-primary-500 dark:text-white ring-2 ring-primary-500/10'
                        : 'bg-white border-gray-200 dark:bg-dark-300 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-primary-500 text-primary-500 bg-white dark:bg-dark-300' : 'border-gray-350 dark:border-gray-600 text-transparent'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm font-semibold">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="max-w-3xl w-full mx-auto flex items-center justify-between border-t border-gray-200 dark:border-gray-850 pt-6 mt-8">
            <div className="flex items-center space-x-2">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => dispatch(selectQuestion(currentQuestionIndex - 1))}
                className="bg-white dark:bg-dark-300 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 p-3 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleClearResponse}
                className="bg-white dark:bg-dark-300 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-bold px-4 py-2.5 rounded-xl text-xs hover:border-gray-350 transition-all"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleMarkForReview}
                className="bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all"
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span>Mark for Review</span>
              </button>
              
              <button
                onClick={handleSaveAndNext}
                className="bg-primary-500 hover:bg-primary-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all"
              >
                <span>Save & Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Question Navigation Palette */}
        <div className="w-full md:w-80 bg-white dark:bg-dark-300 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-850 p-6 flex flex-col overflow-y-auto shrink-0 shadow-lg">
          
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-gray-400 mb-6 flex items-center space-x-2">
            <HelpCircle className="w-4.5 h-4.5" />
            <span>Question Palette</span>
          </h4>

          {/* Palette circles */}
          <div className="grid grid-cols-5 gap-3.5 flex-1">
            {activeTest.questions.map((q, idx) => {
              const answerState = activeAttemptAnswers.find(a => a.questionId === q._id);
              const isSelected = currentQuestionIndex === idx;

              let colorClass = 'bg-gray-100 text-gray-400 border-transparent dark:bg-dark-200 dark:text-gray-500';
              if (answerState?.selectedOption !== null && answerState?.selectedOption !== -1) {
                // Answered
                colorClass = 'bg-emerald-500 text-white border-transparent';
              } else if (answerState?.selectedOption === -1) {
                // Marked for Review
                colorClass = 'bg-indigo-500 text-white border-transparent';
              }

              return (
                <button
                  key={idx}
                  onClick={() => dispatch(selectQuestion(idx))}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${colorClass} ${
                    isSelected ? 'ring-4 ring-primary-500/20 border-primary-500 dark:border-primary-400' : 'border-transparent'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Color Key Indicators */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-8 space-y-3.5">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="w-4.5 h-4.5 rounded-full bg-emerald-500" />
              <span>Answered & Saved</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="w-4.5 h-4.5 rounded-full bg-indigo-500" />
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="w-4.5 h-4.5 rounded-full bg-gray-100 dark:bg-dark-200" />
              <span>Unvisited / Skipped</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
