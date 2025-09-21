
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Candidate, RawCandidateData } from './types';
import { processSheetData, parseExcelFile, getStatus } from './services/dataProcessor';
import FileUpload from './components/FileUpload';
import CandidateCard from './components/CandidateCard';
import CandidateModal from './components/CandidateModal';
import SendModal from './components/SendModal';
import { ProcessorIcon, PlusIcon, SendIcon, CalendarIcon, CogIcon } from './components/icons';

const App: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  
  const [ocsDates, setOcsDates] = useState<{ ocs1: string; ocs2: string; ocs3: string }>({
    ocs1: '',
    ocs2: '',
    ocs3: '',
  });

  const [statusThresholds, setStatusThresholds] = useState({
    noProgress: 4,
    inProgress: 10,
  });

  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendFeedback, setSendFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);


  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseExcelFile<RawCandidateData>(file);
      const processedData = processSheetData(data, statusThresholds);
      setCandidates(processedData);
      setFileName(file.name);
      setSelectedIds(new Set()); // Reset selection
    } catch (err)
 {
      setError('Failed to parse the file. Please check the format and column names.');
      setCandidates([]);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }, [statusThresholds]);

  useEffect(() => {
    if (candidates.length > 0) {
      setCandidates(prevCandidates =>
        prevCandidates.map(c => ({
          ...c,
          status: getStatus(c.completedChapters, statusThresholds),
        }))
      );
    }
  }, [statusThresholds]);

  const handleReset = () => {
    setCandidates([]);
    setFileName(null);
    setError(null);
    setIsLoading(false);
    setSelectedIds(new Set());
    setOcsDates({ ocs1: '', ocs2: '', ocs3: '' });
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(c => c.id)));
    }
  };

  const handleOpenModal = (candidate: Candidate | null) => {
    setEditingCandidate(candidate);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCandidate(null);
  };

  const handleSaveCandidate = (candidate: Candidate) => {
    if (editingCandidate) {
      setCandidates(prev => prev.map(c => c.id === candidate.id ? candidate : c));
    } else {
      setCandidates(prev => [...prev, candidate]);
    }
    handleCloseModal();
  };
  
  const handleOpenSendModal = () => {
    if (selectedIds.size === 0) {
      alert("No candidates selected to send.");
      return;
    }
    setSendFeedback(null); // Clear previous feedback
    setIsSendModalOpen(true);
  };

  const handleConfirmSend = async (type: 'email' | 'whatsapp') => {
    setIsSending(true);
    setSendFeedback(null);

    let selectedCandidates = candidates.filter(c => selectedIds.has(c.id));

    if (type === 'whatsapp') {
      selectedCandidates = selectedCandidates.filter(c => c.phone && c.phone.trim() !== '');
    }

    if (selectedCandidates.length === 0) {
      setIsSending(false);
      setIsSendModalOpen(false);
      setSendFeedback({ type: 'error', message: `No valid candidates to send to. Check for missing phone numbers for WhatsApp.` });
      return;
    }

    const payload = selectedCandidates.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        chapterCompletion: `${c.completedChapters}/${c.totalChapters}`,
        totalChapters: c.totalChapters,
        marksObtained: c.marks,
        maxMarks: c.maxMarks,
        skippedQuestions: c.skipped,
        ocs1Status: c.ocs1,
        ocs2Status: c.ocs2,
        ocs1Date: ocsDates.ocs1,
        ocs2Date: ocsDates.ocs2,
    }));
    
    const endpoint = type === 'email' ? 'send-mails' : 'send-whatsapp';
    const backendUrl = 'http://localhost:5000';

    try {
        const response = await fetch(`${backendUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ candidates: payload }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Failed to send ${type} notifications.`);
        }

        setSendFeedback({ type: 'success', message: result.message });

    } catch (error: any) {
        console.error(`Error sending ${type}:`, error);
        setSendFeedback({ type: 'error', message: error.message || `An unknown error occurred.` });
    } finally {
        setIsSending(false);
        setIsSendModalOpen(false);
    }
  };

  const handleOcsDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOcsDates(prev => ({ ...prev, [name]: value }));
  };
  
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStatusThresholds(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const isAllSelected = useMemo(() => candidates.length > 0 && selectedIds.size === candidates.length, [candidates, selectedIds]);
  const hasOcs3 = useMemo(() => candidates.some(c => c.ocs3), [candidates]);

  return (
    <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <div className="flex justify-center items-center gap-3">
            <ProcessorIcon className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Student Progress Tracker
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-600">
            Upload a single Excel sheet to generate, manage, and track student reports.
          </p>
        </header>

        <main>
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <FileUpload
                    id="file-upload"
                    label="Upload Student Data"
                    onFileUpload={handleFileUpload}
                    fileName={fileName}
                    description="Upload a single sheet with all student information."
                />
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-8">
                     <button
                        onClick={() => handleOpenModal(null)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Candidate
                    </button>
                    {fileName && (
                        <button
                            onClick={handleReset}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
          </div>
          
          {isLoading && <div className="text-center text-blue-600"><p className="text-lg">Processing data...</p></div>}
          {error && <div className="text-center bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg"><p>{error}</p></div>}

          {candidates.length > 0 && (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-blue-600" />
                            Set OCS Dates
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="ocs1" className="block text-sm font-medium text-gray-700 mb-1">OCS 1 Date</label>
                                <input type="date" name="ocs1" id="ocs1" value={ocsDates.ocs1} onChange={handleOcsDateChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                            <div>
                                <label htmlFor="ocs2" className="block text-sm font-medium text-gray-700 mb-1">OCS 2 Date</label>
                                <input type="date" name="ocs2" id="ocs2" value={ocsDates.ocs2} onChange={handleOcsDateChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                            {hasOcs3 && (
                                <div>
                                    <label htmlFor="ocs3" className="block text-sm font-medium text-gray-700 mb-1">OCS 3 Date</label>
                                    <input type="date" name="ocs3" id="ocs3" value={ocsDates.ocs3} onChange={handleOcsDateChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                         <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <CogIcon className="w-6 h-6 text-blue-600" />
                            Set Status Thresholds
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="noProgress" className="block text-sm font-medium text-gray-700 mb-1">"No Progress" if chapters &lt;</label>
                                <input type="number" name="noProgress" id="noProgress" value={statusThresholds.noProgress} onChange={handleThresholdChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                            <div>
                                <label htmlFor="inProgress" className="block text-sm font-medium text-gray-700 mb-1">"In Progress" if chapters &lt;</label>
                                <input type="number" name="inProgress" id="inProgress" value={statusThresholds.inProgress} onChange={handleThresholdChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Chapters &ge; "In Progress" threshold will be "Completed".</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={handleSelectAll} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            {isAllSelected ? 'Deselect All' : 'Select All'}
                        </button>
                        <p className="text-sm text-gray-500">{selectedIds.size} selected</p>
                    </div>
                     {selectedIds.size > 0 && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleOpenSendModal}
                                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                                <SendIcon className="w-4 h-4" />
                                Send Notification
                            </button>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {candidates.map((candidate) => (
                    <CandidateCard 
                        key={candidate.id} 
                        candidate={candidate} 
                        isSelected={selectedIds.has(candidate.id)}
                        onSelect={() => handleSelect(candidate.id)}
                        onEdit={() => handleOpenModal(candidate)}
                        ocsDates={ocsDates}
                    />
                  ))}
                </div>
            </>
          )}

            {sendFeedback && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white ${sendFeedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <div className="flex justify-between items-center">
                        <p>{sendFeedback.message}</p>
                        <button onClick={() => setSendFeedback(null)} className="ml-4 font-bold">X</button>
                    </div>
                </div>
            )}
        </main>
      </div>
      {isModalOpen && (
        <CandidateModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveCandidate}
            candidateData={editingCandidate}
            statusThresholds={statusThresholds}
        />
      )}
      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onConfirmSend={handleConfirmSend}
        candidateCount={selectedIds.size}
        isSending={isSending}
      />
    </div>
  );
};

export default App;
