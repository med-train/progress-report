import React from 'react';
import type { Candidate } from '../types';
import { Status } from '../types';
import { CheckCircleIcon, ClockIcon, XCircleIcon, PencilIcon } from './icons';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  ocsDates: { ocs1: string; ocs2: string; ocs3: string };
}

const StatusIndicator: React.FC<{ status: Status }> = ({ status }) => {
  const statusConfig = {
    [Status.Completed]: { bgColor: 'bg-green-100', textColor: 'text-green-800', icon: <CheckCircleIcon className="w-5 h-5" /> },
    [Status.InProgress]: { bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: <ClockIcon className="w-5 h-5" /> },
    [Status.NoProgress]: { bgColor: 'bg-red-100', textColor: 'text-red-800', icon: <XCircleIcon className="w-5 h-5" /> },
  };
  const config = statusConfig[status];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${config.bgColor} ${config.textColor}`}>
      {config.icon}
      <span>{status}</span>
    </div>
  );
};

const AttendanceIndicator: React.FC<{ status: string }> = ({ status }) => {
    const lowerCaseStatus = status.toLowerCase().trim();
    if (lowerCaseStatus === 'attended') {
        return <div className="inline-flex items-center gap-1.5 text-green-600"><CheckCircleIcon className="w-4 h-4" /><span>{status}</span></div>;
    }
    if (lowerCaseStatus === 'not attended') {
        return <div className="inline-flex items-center gap-1.5 text-red-600"><XCircleIcon className="w-4 h-4" /><span>{status}</span></div>;
    }
    return <span className="text-gray-700">{status}</span>;
};

const OCSValue: React.FC<{ status: string; date?: string }> = ({ status, date }) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return null;
        // Adjust date from YYYY-MM-DD to be timezone-safe for display
        const [year, month, day] = dateString.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        return utcDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
        });
    };

    return (
        <div className="flex flex-col items-end -my-1">
            <AttendanceIndicator status={status} />
            {date && <span className="text-xs text-gray-400 mt-0.5">{formatDate(date)}</span>}
        </div>
    );
};


const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="text-sm font-medium text-gray-900 text-right">{value}</div>
    </div>
);

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, isSelected, onSelect, onEdit, ocsDates }) => {
  return (
    <div className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-300">
      <div className="absolute top-4 left-4">
        <input 
            type="checkbox" 
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={isSelected}
            onChange={onSelect}
            aria-label={`Select ${candidate.name}`}
        />
      </div>
       <div className="absolute top-3 right-3 flex gap-2">
           <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors" aria-label={`Edit ${candidate.name}`}>
               <PencilIcon className="w-5 h-5" />
           </button>
       </div>
      <div className="p-5 pt-12">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 truncate">{candidate.name}</h2>
          <p className="text-sm text-gray-500 break-all">{candidate.email}</p>
          {candidate.phone && <p className="text-sm text-gray-500">{candidate.phone}</p>}
        </div>
        
        <div className="mb-5 flex justify-center">
            <StatusIndicator status={candidate.status} />
        </div>

        <div>
          <InfoRow label="Chapters" value={`${candidate.completedChapters} / ${candidate.totalChapters}`} />
          <InfoRow label="Assessment" value={`${candidate.marks} / ${candidate.maxMarks}`} />
          <InfoRow label="Skipped" value={candidate.skipped} />
          <InfoRow label="OCS 1" value={<OCSValue status={candidate.ocs1} date={ocsDates.ocs1} />} />
          <InfoRow label="OCS 2" value={<OCSValue status={candidate.ocs2} date={ocsDates.ocs2} />} />
          {candidate.ocs3 && <InfoRow label="OCS 3" value={<OCSValue status={candidate.ocs3} date={ocsDates.ocs3} />} />}
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;
