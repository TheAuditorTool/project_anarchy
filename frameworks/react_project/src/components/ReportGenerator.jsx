/**
 * ReportGenerator Component - Command Injection Taint Flow
 *
 * TAINT FLOW:
 * filename input → generateReport() → backend exec() → Command Injection
 */

import React, { useState } from 'react';
import { generateReport, downloadFile } from '../api/userApi';

export default function ReportGenerator() {
  const [filename, setFilename] = useState('');
  const [format, setFormat] = useState('pdf');
  const [fileId, setFileId] = useState('');
  const [status, setStatus] = useState('');

  // TAINT FLOW: filename → API → child_process.exec
  const handleGenerate = async () => {
    setStatus('Generating...');
    try {
      // User controlled filename flows to shell command
      const result = await generateReport({
        filename: filename,  // TAINT: Command injection payload like "; rm -rf /"
        format: format,
        filters: { dateRange: 'last30days' }
      });
      setStatus(`Report generated: ${result.path}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  // TAINT FLOW: fileId → API → fs.readFile (path traversal)
  const handleDownload = async () => {
    try {
      // User controlled file ID flows to file system read
      const blob = await downloadFile(fileId);  // TAINT: "../../../etc/passwd"
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      setStatus(`Download error: ${error.message}`);
    }
  };

  return (
    <div className="report-generator">
      <h2>Report Generator</h2>

      <div className="form-group">
        <label>Filename:</label>
        {/* TAINT SOURCE: Command injection */}
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="report_name"
        />
      </div>

      <div className="form-group">
        <label>Format:</label>
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="pdf">PDF</option>
          <option value="csv">CSV</option>
          <option value="xlsx">Excel</option>
        </select>
      </div>

      <button onClick={handleGenerate}>Generate Report</button>

      <hr />

      <h3>Download Existing Report</h3>
      <div className="form-group">
        <label>File ID:</label>
        {/* TAINT SOURCE: Path traversal */}
        <input
          type="text"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          placeholder="file-id or path"
        />
      </div>

      <button onClick={handleDownload}>Download</button>

      {status && <p className="status">{status}</p>}
    </div>
  );
}
