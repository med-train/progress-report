
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  id: string;
  label: string;
  description: string;
  onFileUpload: (file: File) => void;
  fileName: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ id, label, description, onFileUpload, fileName }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFileUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const borderColor = isDragging ? 'border-blue-500' : 'border-gray-300';
  const bgColor = isDragging ? 'bg-blue-50' : 'bg-white';

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{label}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <label
        htmlFor={id}
        className={`relative flex flex-col items-center justify-center w-full h-32 border-2 ${borderColor} border-dashed rounded-lg cursor-pointer ${bgColor} hover:bg-gray-100 transition-colors duration-200`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadIcon className="w-8 h-8 mb-2 text-gray-500" />
          {fileName ? (
            <>
              <p className="font-semibold text-green-600">{fileName}</p>
              <p className="text-xs text-gray-500">Click or drag to replace</p>
            </>
          ) : (
            <>
              <p className="mb-1 text-sm text-gray-500">
                <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">XLSX, XLS, or CSV</p>
            </>
          )}
        </div>
        <input id={id} type="file" className="hidden" onChange={handleChange} accept=".xlsx, .xls, .csv" />
      </label>
    </div>
  );
};

export default FileUpload;
