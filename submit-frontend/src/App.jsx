import React, { useState } from 'react';
import './App.css';

function App() {
  const [submissions, setSubmissions] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const BACKEND_URL = 'https://nndl-backend.onrender.com/submit';

  const handleFileRead = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setUploadedFileName(droppedFile.name);
      handleFileRead(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setUploadedFileName(uploadedFile.name);
      handleFileRead(uploadedFile);
    }
  };

  const handleSubmit = async () => {
    if (!studentName && !file) {
      setErrorMessage('Please enter your name and select a code file.');
      return;
    }
    if (!studentName) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!file) {
      setErrorMessage('Please select a code file.');
      return;
    }

    const now = new Date();
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const pad = (n) => n.toString().padStart(2, '0');
    const formattedTime = `${pad(ist.getDate())}-${pad(ist.getMonth() + 1)}-${ist.getFullYear()} ${pad(ist.getHours())}:${pad(ist.getMinutes())}`;

    const submissionData = {
      name: studentName,
      code: fileContent,
      timestamp: formattedTime,
      status: 'Pending' // ✅ This line fixes the 400 error
    };

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit. Please try again later.');
      }

      const newSubmission = {
        id: Date.now(),
        name: studentName,
        fileName: file.name,
        time: formattedTime,
        content: fileContent.split('\n').slice(0, 3).join('\n'),
        more: fileContent.split('\n').length - 3,
        status: 'Pending'
      };

      setSubmissions([newSubmission, ...submissions]);
      setStudentName('');
      setFile(null);
      setFileContent('');
      setUploadedFileName('');
      setErrorMessage('');
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Something went wrong.');
    }
  };

  return (
    <div className="app">
      <div className="card submit">
        <h2>Submit Code</h2>
        <p>Enter your Name and Upload your Code File</p>
        <input
          type="text"
          placeholder="Enter your full name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
        <div
          className={`dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput').click()}
        >
          {uploadedFileName ? (
            <p><strong>Selected:</strong> {uploadedFileName}</p>
          ) : (
            <>
              <p>Drag & drop your file here</p>
              <p className="sub">or click to browse</p>
            </>
          )}
          <input
            id="fileInput"
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".js,.py,.java,.cpp,.html,.css,.ipynb"
          />
        </div>
        {errorMessage && <p className="error">{errorMessage}</p>}
        <button onClick={handleSubmit}>Submit</button>
      </div>

      <div className="card-submissions">
        <h2>Recent Submissions</h2>
        {submissions.length === 0 ? (
          <p className="empty">No submissions yet.</p>
        ) : (
          submissions.map(sub => (
            <div key={sub.id} className="submission">
              <div className="header">
                <span className="name">{sub.name}</span>
                <span className="time">{sub.time}</span>
              </div>
              <div className="details">
                <div className="file">
                  <strong>{sub.fileName}</strong>
                  {sub.content && (
                    <pre className="preview">
                      {sub.content}
                      {sub.more > 0 && `\n...and ${sub.more} more lines`}
                    </pre>
                  )}
                  <p className="status">Status: {sub.status}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
