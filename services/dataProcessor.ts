import type { RawCandidateData, Candidate } from '../types';
import { Status } from '../types';

declare const XLSX: any; // Using SheetJS from a CDN

export const parseExcelFile = <T,>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: true }) as any[];

        const normalizedJson = json.map(row => {
          const newRow: {[key: string]: any} = {};
          for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
              newRow[key.trim()] = row[key];
            }
          }
          return newRow;
        });

        resolve(normalizedJson as T[]);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsBinaryString(file);
  });
};

export const getStatus = (completed: number, thresholds: { noProgress: number; inProgress: number }): Status => {
    if (completed < thresholds.noProgress) {
        return Status.NoProgress;
    }
    if (completed < thresholds.inProgress) {
        return Status.InProgress;
    }
    return Status.Completed;
};

const getValue = (obj: any, targetKey: string): any => {
    const normalizedTargetKey = targetKey.toLowerCase().replace(/[\s_]/g, '');
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
            if (normalizedKey === normalizedTargetKey) {
                return obj[key];
            }
        }
    }
    return undefined;
};

export const processSheetData = (data: RawCandidateData[], thresholds: { noProgress: number; inProgress: number }): Candidate[] => {
    return data
      // FIX: Add explicit return type to the map callback to resolve type predicate error in the filter below.
      // The inferred type of the returned object was more specific than `Candidate` (making `phone` required),
      // which is not compatible with the type predicate `c is Candidate`.
      .map((row, index): Candidate | null => {
        const name = getValue(row, "Name");
        const email = getValue(row, "Email");

        // Skip rows that don't have a name or email
        if (!name && !email) {
            return null;
        }

        const completedChapters = Number(getValue(row, "CompletedChapters") || 0);
        const totalChapters = Number(getValue(row, "TotalChapers") || 0); // Corrected typo from image 'TotalChapers'
        if (totalChapters === 0) { // If TotalChapters is 0 or not present, try "Total Chapters"
             const altTotal = Number(getValue(row, "Total Chapters") || 1);
             Object.assign(row, { totalChapters: altTotal });
        }
        
        const status = getStatus(completedChapters, thresholds);
        const ocs3Value = getValue(row, "OCS3");

        return {
            id: `${email || name}-${Date.now()}-${index}`, // More robust unique ID
            name: String(name || 'N/A'),
            email: String(email || 'N/A'),
            phone: String(getValue(row, "phone") || ''),
            completedChapters,
            totalChapters,
            marks: Number(getValue(row, "Marks") || 0),
            maxMarks: Number(getValue(row, "MaxMarks") || 0),
            skipped: Number(getValue(row, "Skipped") || 0),
            ocs1: String(getValue(row, "OCS1") || 'N/A'),
            ocs2: String(getValue(row, "OCS2") || 'N/A'),
            ocs3: ocs3Value ? String(ocs3Value) : undefined,
            status,
        };
      })
      .filter((c): c is Candidate => c !== null); // Filter out null entries
};