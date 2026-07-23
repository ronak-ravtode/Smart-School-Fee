import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';

export default function OCRUpload({ docType, onOCRComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [parsedData, setParsedData] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setOcrText('');
      setParsedData(null);
    }
  };

  // Helper to extract Name, DOB, and DocRef from raw text using regex
  const parseOCRText = (text) => {
    let name = null;
    let dob = null;
    let docRef = null;

    // Normalize text
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // 1. Try to find DOB (e.g. DOB: 15/08/2012, Date of Birth: 15-08-2012, 15/08/2012)
    const dobRegex = /(?:DOB|Date of Birth|Birth|DOB:)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;
    const dobMatch = text.match(dobRegex);
    if (dobMatch) {
      const dobStr = dobMatch[1].replace(/\-/g, '/'); // normalize separator
      const parts = dobStr.split('/');
      if (parts.length === 3) {
        // Assume format is DD/MM/YYYY
        dob = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }
    }

    // 2. Try to find Aadhaar number (12 digits, often formatted as xxxx xxxx xxxx)
    const aadhaarRegex = /(\d{4}\s\d{4}\s\d{4}|\d{12})/;
    const aadhaarMatch = text.match(aadhaarRegex);
    if (aadhaarMatch) {
      docRef = aadhaarMatch[1];
    }

    // 3. Try to guess name
    // On Aadhaar, the name is usually 1 or 2 lines above the gender line.
    // We search backwards from the gender line to find a line that looks like an English name.
    const genderIndex = lines.findIndex(line => /male|female|m\/f/i.test(line));
    if (genderIndex > 0) {
      for (let i = genderIndex - 1; i >= 0; i--) {
        const line = lines[i];
        // Clean line of non-alphanumeric chars except space
        const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim();
        // If it's a valid English name (letters and spaces, length > 3) and not containing header keywords
        if (
          cleanLine.length > 3 &&
          /^[a-zA-Z\s]+$/.test(cleanLine) &&
          !/father|yob|dob|government|india|unique|identity|birth|date|issue/i.test(line)
        ) {
          // Strip short garbage prefix/suffix words (length <= 2, e.g. "ot") from the parsed name
          name = cleanLine.split(/\s+/).filter(w => w.length > 2).join(' ');
          break;
        }
      }
    }

    // Birth Certificate guessing name
    if (!name && docType === 'birth_certificate') {
      const nameIndex = lines.findIndex(line => /name of child|child name|name/i.test(line));
      if (nameIndex >= 0 && nameIndex < lines.length - 1) {
        name = lines[nameIndex + 1].replace(/[^a-zA-Z\s]/g, '').trim();
      }
    }

    return { name, dob, docRef };
  };

  const processOCR = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Initializing Tesseract OCR worker...');
    
    try {
      const worker = await createWorker('eng');
      setStatus('Running character recognition (OCR) on document...');
      
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      setOcrText(text);
      const parsed = parseOCRText(text);
      setParsedData(parsed);

      onOCRComplete({
        rawText: text,
        ...parsed
      });
      setStatus('OCR extraction completed successfully!');
    } catch (error) {
      console.error('OCR processing error:', error);
      setStatus('OCR Engine initialization failed (Network CDN block or Timeout). Please use Dev Demo Data below to test the workflow.');
    } finally {
      setLoading(false);
    }
  };

  // Development Mock Helper to simulate OCR inputs
  const loadDemoData = (type) => {
    let mockText = '';
    let mockParsed = {};

    if (type === 'match') {
      if (docType === 'aadhaar') {
        mockText = "GOVERNMENT OF INDIA\nRonak Ravtode\nDOB: 15/08/2012\nMale\nVID: 9988 7766 5544";
        mockParsed = { name: "Ronak Ravtode", dob: "2012-08-15", docRef: "9988 7766 5544" };
      } else {
        mockText = "BIRTH CERTIFICATE\nState of Maharashtra\nChild Name: Timmy Doe\nDate of Birth: 01/01/2020\nFather: John Doe";
        mockParsed = { name: "Timmy Doe", dob: "2020-01-01", docRef: "BC-998822" };
      }
    } else {
      // Mismatch
      if (docType === 'aadhaar') {
        mockText = "GOVERNMENT OF INDIA\nRonak R.\nDOB: 10/08/2012\nMale\nVID: 9988 7766 5544";
        mockParsed = { name: "Ronak R.", dob: "2012-08-10", docRef: "9988 7766 5544" };
      } else {
        mockText = "BIRTH CERTIFICATE\nState of Maharashtra\nChild Name: Tommy Doe\nDate of Birth: 05/01/2020\nFather: John Doe";
        mockParsed = { name: "Tommy Doe", dob: "2020-01-05", docRef: "BC-998822" };
      }
    }

    setOcrText(mockText);
    setParsedData(mockParsed);
    onOCRComplete({
      rawText: mockText,
      ...mockParsed
    });
    setStatus('Dev Demo Data loaded successfully!');
  };

  return (
    <div className="bg-surface-container-lowest rounded-[20px] p-5 border border-outline-variant/40 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-nav-button text-nav-button text-on-surface-variant uppercase tracking-wider text-[13px]">
          Identity Document OCR ({docType.replace('_', ' ')})
        </span>
        {file && (
          <button
            type="button"
            onClick={processOCR}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-ink-black text-canvas-cream rounded-full px-4 h-9 font-nav-button text-nav-button text-[13px] hover:bg-inverse-surface transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-orange"
          >
            {loading ? 'Processing…' : 'Run OCR Scanner'}
          </button>
        )}
      </div>

      <div className={`grid items-center gap-4 ${preview ? 'grid-cols-[80px_1fr]' : 'grid-cols-1'}`}>
        {preview && (
          <img
            src={preview}
            alt="Document Preview"
            className="w-20 h-20 object-cover rounded-[12px] border border-outline-variant"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          aria-label="Upload identity document"
          className="w-full text-[14px] text-ink-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-surface-container-low file:text-ink-black file:font-nav-button file:cursor-pointer hover:file:bg-surface-container-high"
        />
      </div>

      {status && (
        <p className={`font-body text-[13px] ${loading ? 'text-secondary' : 'text-on-surface-variant'}`}>{status}</p>
      )}

      <div className="pt-3 border-t border-dashed border-outline-variant/50">
        <span className="font-footer-link text-footer-link text-on-surface-variant text-[12px] block mb-2">
          Development Mocking Actions
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => loadDemoData('match')}
            className="px-4 py-1.5 rounded-full border border-dashed border-success text-success font-nav-button text-nav-button text-[13px] hover:bg-success-container transition-colors"
          >
            Simulate Match
          </button>
          <button
            type="button"
            onClick={() => loadDemoData('mismatch')}
            className="px-4 py-1.5 rounded-full border border-dashed border-error text-error font-nav-button text-nav-button text-[13px] hover:bg-error-container transition-colors"
          >
            Simulate Mismatch
          </button>
        </div>
      </div>

      {parsedData && (
        <div className="bg-surface-container-low p-3 rounded-[12px] font-body text-[13px] text-ink-black">
          <span className="font-eyebrow text-[12px] uppercase tracking-wider text-on-surface-variant block mb-2">Extracted OCR Fields</span>
          <div className="grid grid-cols-2 gap-2">
            <div><strong>Parsed Name:</strong> {parsedData.name || 'Not detected'}</div>
            <div><strong>Parsed DOB:</strong> {parsedData.dob || 'Not detected'}</div>
            <div className="col-span-2">
              <strong>Doc Ref:</strong> {parsedData.docRef ? `**** **** ${parsedData.docRef.replace(/\s/g, '').slice(-4)}` : 'Not detected'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
