import React, { useState, useEffect } from 'react';
import type { Candidate } from '../types';
import { Status } from '../types';
import { XCircleIcon } from './icons';

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidate: Candidate) => void;
  candidateData: Candidate | null;
  statusThresholds: { noProgress: number; inProgress: number };
}

const CandidateModal: React.FC<CandidateModalProps> = ({ isOpen, onClose, onSave, candidateData, statusThresholds }) => {
  const [formData, setFormData] = useState<Omit<Candidate, 'id' | 'status'>>({
    name: '',
    email: '',
    phone: '',
    completedChapters: 0,
    totalChapters: 0,
    marks: 0,
    maxMarks: 0,
    skipped: 0,
    ocs1: 'N/A',
    ocs2: 'N/A',
    ocs3: '',
  });

  useEffect(() => {
    if (candidateData) {
      setFormData({
        ...candidateData,
        ocs3: candidateData.ocs3 || '',
      });
    } else {
      setFormData({
        name: '', email: '', phone: '', completedChapters: 0, totalChapters: 0,
        marks: 0, maxMarks: 0, skipped: 0, ocs1: 'N/A', ocs2: 'N/A', ocs3: '',
      });
    }
  }, [candidateData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const getModalStatus = (completed: number): Status => {
        if (completed < statusThresholds.noProgress) return Status.NoProgress;
        if (completed < statusThresholds.inProgress) return Status.InProgress;
        return Status.Completed;
    };

    const status = getModalStatus(formData.completedChapters);
    const id = candidateData ? candidateData.id : `${formData.email}-${Date.now()}`;
    
    const saveData: Candidate = { ...formData, id, status };
    
    // If ocs3 is an empty string, remove it so it's treated as undefined
    if (!saveData.ocs3?.trim()) {
        delete saveData.ocs3;
    }

    onSave(saveData);
  };
  
  const inputClass = "w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{candidateData ? 'Edit Candidate' : 'Add New Candidate'}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircleIcon className="w-8 h-8"/>
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} required /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} required /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Completed Chapters</label><input type="number" name="completedChapters" value={formData.completedChapters} onChange={handleChange} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Chapters</label><input type="number" name="totalChapters" value={formData.totalChapters} onChange={handleChange} className={inputClass} /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Marks</label><input type="number" name="marks" value={formData.marks} onChange={handleChange} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label><input type="number" name="maxMarks" value={formData.maxMarks} onChange={handleChange} className={inputClass} /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Skipped Questions</label><input type="number" name="skipped" value={formData.skipped} onChange={handleChange} className={inputClass} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">OCS 1 Status</label><input type="text" name="ocs1" value={formData.ocs1} onChange={handleChange} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">OCS 2 Status</label><input type="text" name="ocs2" value={formData.ocs2} onChange={handleChange} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">OCS 3 Status</label><input type="text" name="ocs3" value={formData.ocs3 || ''} onChange={handleChange} className={inputClass} /></div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateModal;