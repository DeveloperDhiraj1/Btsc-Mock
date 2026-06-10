import React, { useEffect, useState, useRef } from 'react';
import { createSocket } from '../services/socket';
import { Trophy, Medal, Star, Compass, Loader2 } from 'lucide-react';

export default function Leaderboard() {
  const [examCategory, setExamCategory] = useState('BTSC');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  // Fallback mock top rankings if no database socket entries exist
  const getMockRankings = (cat) => {
    return [
      { name: 'Amit Kumar Dev', score: 96.50, rank: 1 },
      { name: 'Rohan Singh', score: 88.00, rank: 2 },
      { name: 'Vikram Sinha', score: 84.75, rank: 3 },
      { name: 'Saba Parveen', score: 81.50, rank: 4 },
      { name: 'Dhiraj Kumar (You)', score: 78.00, rank: 5 }
    ];
  };

  useEffect(() => {
    setLoading(true);
    // Connect to WebSocket server
    socketRef.current = createSocket();

    socketRef.current.emit('join_leaderboard', { examCategory });

    socketRef.current.on('leaderboard_update', ({ examCategory: updatedCategory, rankings: updatedRankings }) => {
      if (updatedCategory === examCategory) {
        setRankings(updatedRankings);
        setLoading(false);
      }
    });

    // Set fallback initially to prevent empty screen
    setTimeout(() => {
      setRankings(prev => prev.length > 0 ? prev : getMockRankings(examCategory));
      setLoading(false);
    }, 600);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [examCategory]);

  const categories = ['BTSC', 'SSC', 'Railway', 'BPSC', 'Polytechnic'];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Topper Rankings</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time leaderboard rankings computed across active students</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setExamCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              examCategory === cat
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                : 'bg-white dark:bg-dark-300 text-gray-600 dark:text-gray-400 hover:bg-gray-150'
            }`}
          >
            {cat} Exam Board
          </button>
        ))}
      </div>

      {/* Leaderboard content */}
      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 rounded-3xl shadow-sm overflow-hidden max-w-2xl w-full">
        
        {/* Table Head */}
        <div className="bg-gray-50 dark:bg-dark-200 px-6 py-4 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-150 dark:border-gray-800">
          <div className="flex items-center space-x-6">
            <span className="w-12 text-center">Rank</span>
            <span>Candidate Name</span>
          </div>
          <span>Percentile / Marks</span>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : rankings.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-850">
            {rankings.map((userRank, index) => {
              const isFirst = userRank.rank === 1;
              const isSecond = userRank.rank === 2;
              const isThird = userRank.rank === 3;

              let rankBadge = <span className="font-bold text-gray-550">{userRank.rank}</span>;
              if (isFirst) rankBadge = <Medal className="w-6 h-6 text-amber-500 fill-amber-500" />;
              else if (isSecond) rankBadge = <Medal className="w-6 h-6 text-slate-400 fill-slate-400" />;
              else if (isThird) rankBadge = <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;

              return (
                <div 
                  key={index}
                  className={`px-6 py-4.5 flex items-center justify-between transition-colors ${
                    userRank.name.includes('(You)') 
                      ? 'bg-primary-500/5 dark:bg-primary-500/5 font-semibold text-primary-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-dark-200'
                  }`}
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-12 flex items-center justify-center shrink-0">
                      {rankBadge}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-150">
                      {userRank.name}
                    </span>
                  </div>

                  <span className="text-sm font-extrabold font-mono text-gray-700 dark:text-white">
                    {userRank.score.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-20 text-center text-gray-450 text-sm">
            Attempt mocks to register the first board topper!
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-dark-300 border border-gray-200/50 dark:border-gray-800/50 p-6 rounded-3xl max-w-2xl w-full flex items-start space-x-4">
        <Star className="w-6 h-6 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm">Rank Calculation Rules</h4>
          <p className="text-gray-400 text-xs leading-relaxed">
            Leaderboard rankings are sorted dynamically by highest scores obtained. In case of identical score values, the candidate with the faster attempt time is ranked higher.
          </p>
        </div>
      </div>

    </div>
  );
}
