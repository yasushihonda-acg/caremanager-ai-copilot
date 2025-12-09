import React, { useState } from 'react';
import { User } from '../types';
import { Heart, Briefcase, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  user: User;
}

export const LifeHistoryCard: React.FC<Props> = ({ user }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden mb-6">
      <div 
        className="bg-stone-50 p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-full">
            <Heart className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-lg">利用者背景 (ライフヒストリー)</h3>
            <p className="text-xs text-stone-500">本人理解と信頼関係構築のために</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="text-stone-400" /> : <ChevronDown className="text-stone-400" />}
      </div>

      {/* Always visible key info */}
      <div className="p-4 border-t border-stone-100 flex flex-wrap gap-2">
         {user.lifeHistory.hobbies.map((hobby, idx) => (
           <span key={idx} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium border border-emerald-100">
             {hobby}
           </span>
         ))}
         {user.lifeHistory.topicsToAvoid.length > 0 && (
            <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-medium border border-red-100 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                <span>要注意話題: {user.lifeHistory.topicsToAvoid.join(', ')}</span>
            </div>
         )}
      </div>

      {isExpanded && (
        <div className="p-4 bg-white border-t border-stone-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex gap-3">
            <Briefcase className="w-5 h-5 text-stone-400 mt-1" />
            <div>
              <p className="text-sm font-bold text-stone-700">以前の職業</p>
              <p className="text-stone-600">{user.lifeHistory.previousOccupation}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Heart className="w-5 h-5 text-stone-400 mt-1" />
            <div>
              <p className="text-sm font-bold text-stone-700">大切にしている思い出</p>
              <p className="text-stone-600 leading-relaxed">{user.lifeHistory.importantMemories}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};