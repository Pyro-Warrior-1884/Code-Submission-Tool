import React, { useState, useEffect } from 'react';
import { Search, GitBranch, CheckCircle, XCircle, Users, Activity, TrendingUp, Moon, Sun, FileDown, Clock} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import db from '../firebase.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const StudentSubmissions = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortBy, setSortBy] = useState('name');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'submissions'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const raw = doc.data();
        return {
          id: doc.id,
          name: raw.name || 'Unknown',
          status: raw.status?.toLowerCase() || 'failure',
          accuracy: typeof raw.accuracy === 'number' ? raw.accuracy : 0,
          timestamp: raw.timestamp || 'N/A',
          avatar: raw.name?.[0]?.toUpperCase() || '?'
        };
      });
      setRecords(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredRecords = records
    .filter(record =>
      (record.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) &&
      (filterStatus === 'all' || (record.status || '').toLowerCase() === filterStatus)
    )
    .sort((a, b) => {
      const parseDate = (str) => {
        const [datePart, timePart] = str.split(' ');
        const [day, month, year] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes);
      };

      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'accuracy':
          comparison = a.accuracy - b.accuracy;
          break;
        case 'timestamp':
          comparison = parseDate(a.timestamp) - parseDate(b.timestamp);
          break;
      
        default:
          return 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });


  const stats = {
    total: records.length,
    successful: records.filter(r => r.status === 'success').length,
    failed: records.filter(r => r.status === 'failure').length
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const exportToExcel = () => {
      const exportData = records.map(record => ({
        Name: record.name,
        Status: record.status,
        Accuracy: record.accuracy,
        Timestamp: record.timestamp
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(dataBlob, 'student_submissions.xlsx');
  };

  
  const StatusBadge = ({ status }) => {
    const normalizedStatus = (status || '').toLowerCase();
    return (
      <div className={`status-badge ${normalizedStatus}`}>
        {normalizedStatus === 'success' ? (
          <CheckCircle size={12} />
        ) : normalizedStatus === 'pending' ? (
          <Clock size={12} />
        ) : (
          <XCircle size={12} />
        )}
        <span>
          {normalizedStatus === 'success'
            ? 'Passed'
            : normalizedStatus === 'pending'
            ? 'Pending'
            : 'Failed'}
        </span>
      </div>
    );
  };

  const LoadingCard = () => (
    <div className="loading-card">
      <div className="loading-avatar"></div>
      <div className="loading-content">
        <div className="loading-line"></div>
        <div className="loading-line short"></div>
      </div>
    </div>
  );

  return (
    <div className="scaled-wrapper">
    <div className={`dashboard ${isDarkMode ? 'dark' : 'light'}`}>
      <style>{`
      /* CSS Variables for theme management */
        .scaled-wrapper {
            transform: scale(0.8);
            transform-origin: top left;
            width: 125%; 
            height: 125%;
        }
        .dashboard {
          --primary-color: #3b82f6;
          --primary-hover: #2563eb;
          --success-color: #10b981;
          --pending-color: #fdae02ff;
          --error-color: #ef4444;
          --warning-color: #f59e0b;
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --text-muted: #9ca3af;
          --bg-primary: #ffffff;
          --bg-secondary: #f9fafb;
          --bg-tertiary: #f3f4f6;
          --border-color: #e5e7eb;
          --shadow-light: 0 1px 3px rgba(0, 0, 0, 0.1);
          --shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.1);
          --shadow-heavy: 0 10px 25px rgba(0, 0, 0, 0.15);
          --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --gradient-success: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
          --gradient-pending: linear-gradient(135deg, #ffdb59ff 0%, #ffec20ff 100%);
          --gradient-error: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          --gradient-card: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          transition: all 0.3s ease;
        }

        .dashboard.dark {
          --text-primary: #f9fafb;
          --text-secondary: #d1d5db;
          --text-muted: #9ca3af;
          --bg-primary: #111827;
          --bg-secondary: #1f2937;
          --bg-tertiary: #374151;
          --border-color: #374151;
          --shadow-light: 0 1px 3px rgba(0, 0, 0, 0.3);
          --shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.3);
          --shadow-heavy: 0 10px 25px rgba(0, 0, 0, 0.4);
          --gradient-card: linear-gradient(145deg, #1f2937 0%, #111827 100%);
        }

        .dashboard {
          min-height: 667px;
          width: 100%;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding-bottom: 5%;
        }

        .header {
          background: var(--gradient-primary);
          color: white;
          box-shadow: var(--shadow-heavy);
          position: relative;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
          pointer-events: none;
        }

        .header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 0;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.75rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-text h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(45deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-text p {
          margin: 0.25rem 0 0 0;
          opacity: 0.9;
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .theme-toggle {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        /* Main content */
        .main-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
          padding-bottom: 0rem;
        }

        /* Stats cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--gradient-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s ease;
        }

        .stat-card:hover::before {
          left: 100%;
        }

        .stat-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: var(--shadow-heavy);
          border-color: var(--primary-color);
        }

        .stat-card-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 0;
        }

        .stat-info h3 {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-info p {
          margin: 0.5rem 0 0 0;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-icon {
          padding: 1rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon {
          transform: rotate(15deg) scale(1.1);
        }

        .stat-card.total .stat-icon { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .stat-card.success .stat-icon { background: linear-gradient(135deg, #10b981, #047857); }
        .stat-card.error .stat-icon { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .stat-card.info .stat-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

        /* Controls section */
        .controls-section {
          background: var(--gradient-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          margin-bottom: 2rem;
          overflow: hidden;
          box-shadow: var(--shadow-medium);
        }

        .controls-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background: linear-gradient(90deg, var(--bg-primary), var(--bg-secondary));
        }

        .sort-controls {
          display: flex;
          gap: 0.7rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .controls-content {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
        }

        .search-container {
          position: relative;
          flex: 1;
          min-width: 300px;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          transform: translateY(-1px);
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .filter-controls {
          display: flex;
          gap: 0.75rem;
        }

        .select-input {
          padding: 0.75rem 1rem;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 160px;
        }

        .select-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Table styles */
        .table-container {
          background: var(--gradient-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--shadow-medium);
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-header {
          background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
          border-bottom: 2px solid var(--border-color);
        }

        .table-header th {
          padding: 1rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table-row {
          border-bottom: 1px solid var(--border-color);
          transition: all 0.3s ease;
          position: relative;
        }

        .table-row:hover {
          background: linear-gradient(90deg, 
            rgba(59, 130, 246, 0.05), 
            rgba(139, 92, 246, 0.05)
          );
          transform: scale(1.01);
          z-index: 0;
        }

        .table-cell {
          padding: 1.25rem 1.5rem;
          vertical-align: middle;
        }

        .student-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .student-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.875rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .student-avatar::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: rotate(45deg);
          transition: all 0.3s ease;
          opacity: 0;
        }

        .table-row:hover .student-avatar::before {
          opacity: 1;
          animation: shimmer 0.6s ease;
        }

        .student-details h4 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .student-details p {
          margin: 0.25rem 0 0 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .status-badge.success {
            background: linear-gradient(135deg, #d1fae5, #a7f3d0); /* green */
            color: #065f46;
            border: 1px solid #6ee7b7;
        }

        .status-badge.failure {
            background: linear-gradient(135deg, #fee2e2, #fecaca); /* red */
            color: #991b1b;
            border: 1px solid #f87171;
        }
        .status-badge.pending {
          background-color: #fff7ed;
          color: #b45309;
          border: 1px solid #fdfb8aff;
        }

        .normal-number {
          color: var(--text-primary);
        }
    
        /* Empty state */
        .empty-state {
          text-align: center;
          color: var(--text-muted);
        }

        .empty-state-icon {
          margin: 0 auto 1rem auto;
          opacity: 0.5;
        }

        /* Loading states */
        .loading-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .loading-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(90deg, var(--bg-tertiary), var(--bg-secondary), var(--bg-tertiary));
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        .loading-content {
          flex: 1;
        }

        .loading-line {
          height: 16px;
          border-radius: 8px;
          background: linear-gradient(90deg, var(--bg-tertiary), var(--bg-secondary), var(--bg-tertiary));
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          margin-bottom: 0.5rem;
        }

        .loading-line.short {
          width: 60%;
        }

        /* Animations */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeInUp 0.6s ease forwards;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .main-content {
            padding: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .controls-content {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            min-width: unset;
            max-width: unset;
          }

          .filter-controls {
            flex-wrap: wrap;
          }

          .table-container {
            overflow-x: auto;
          }

          .table {
            min-width: 600px;
          }


          /* Stats Cards */
          .stats-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .card {
            padding: 1.5rem;
            border: 1px solid;
            border-radius: 0.5rem;
            background-color: #ffffff;
          }

          .card-icon {
            float: right;
            color: #3b82f6;
          }

          .card-value {
            font-size: 1.5rem;
            font-weight: 600;
          }

          .card-title {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
          }

          .card.success .card-icon {
            color: #10b981;
          }

          .card.failure .card-icon {
            color: #ef4444;
          }

          .student-submissions-wrapper.dark .card {
            background-color: #1f2937;
            border-color: #374151;
          }

          .student-submissions-wrapper.dark .card-title {
            color: #9ca3af;
          }

          .student-submissions-wrapper.dark .card-value {
            color: #ffffff;
          }

          /* Filters */
          .filter-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
            margin-bottom: 1rem;
          }

          .search-input {
            position: relative;
            flex-grow: 1;
            max-width: 300px;
          }

          .search-input input {
            width: 100%;
            padding: 0.5rem 1rem 0.5rem 2.5rem;
            border-radius: 0.5rem;
            border: 1px solid #d1d5db;
            outline: none;
          }

          .search-input .search-icon {
            position: absolute;
            top: 50%;
            left: 0.75rem;
            transform: translateY(-50%);
            color: #9ca3af;
          }

          .filter-options select {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            border: 1px solid #d1d5db;
            outline: none;
          }

          /* Table */
          .table-container {
            overflow-x: auto;
            background-color: #ffffff;
            border-radius: 0.5rem;
          }

          .student-submissions-wrapper.dark .table-container {
            background-color: #1f2937;
          }

          .submission-table {
            width: 100%;
            border-collapse: collapse;
          }

          .submission-table th,
          .submission-table td {
            text-align: left;
            padding: 1rem;
            font-size: 0.875rem;
          }

          .submission-table th {
            background-color: #f3f4f6;
            color: #6b7280;
          }

          .student-submissions-wrapper.dark .submission-table th {
            background-color: #374151;
            color: #9ca3af;
          }

          .submission-table tr:hover {
            background-color: #f9fafb;
          }

          .student-submissions-wrapper.dark .submission-table tr:hover {
            background-color: #4b5563;
          }

          .student-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(to right, #3b82f6, #8b5cf6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-weight: 600;
          }

          .student-name {
            font-weight: 500;
          }

          .student-role {
            font-size: 0.75rem;
            color: #6b7280;
          }

          .student-submissions-wrapper.dark .student-role {
            color: #9ca3af;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid;
          }

          .badge.success.light {
            background-color: #ecfdf5;
            color: #065f46;
            border-color: #d1fae5;
          }

          .badge.failure.light {
            background-color: #fef2f2;
            color: #991b1b;
            border-color: #fecaca;
          }

          .badge.success.dark {
            background-color: #064e3b;
            color: #34d399;
            border-color: #065f46;
          }

          .badge.failure.dark {
            background-color: #7f1d1d;
            color: #f87171;
            border-color: #991b1b;
          }

          .badge.pending.light {
            background-color: #fff7ed;
            color: #b45309;
            border-color: #fde68a;
          }

          .badge.pending.dark {
            background-color: #78350f;
            color: #fbbf24;
            border-color: #b45309;
          }

          .no-results {
            text-align: center;
            padding: 3rem 0;
          }

          .no-results-icon {
            color: #9ca3af;
            margin-bottom: 1rem;
          }

        }
      `}</style>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <div className="header-icon">
              <GitBranch size={24} />
            </div>
            <div className="header-text">
              <h1>Student Submissions</h1>
              <p>Advanced tracking and analytics dashboard</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <Activity size={16} />
              <span>Live Updates</span>
            </div>
            <button className="theme-toggle" onClick={exportToExcel} title="Download Excel">
              <FileDown size={18} />
            </button>
            <button className="theme-toggle" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total fade-in">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Total Students</h3>
                <p>{stats.total}</p>
              </div>
              <div className="stat-icon">
                <Users size={24} color="white" />
              </div>
            </div>
          </div>
          <div className="stat-card success fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Passed</h3>
                <p>{stats.successful}</p>
              </div>
              <div className="stat-icon">
                <CheckCircle size={24} color="white" />
              </div>
            </div>
          </div>
          <div className="stat-card error fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Failed</h3>
                <p>{stats.failed}</p>
              </div>
              <div className="stat-icon">
                <XCircle size={24} color="white" />
              </div>
            </div>
          </div>
        </div>

        <div className="controls-section fade-in">
            <div className="controls-header">
              <div className="controls-content">
                <div className="search-container">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search students by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="filter-controls">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="select-input"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Passed Only</option>
                    <option value="failure">Failed Only</option>
                    <option value="pending">Pending Only</option>
                  </select>

                  <div className="sort-controls">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="select-input"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="accuracy">Sort by Accuracy</option>
                      <option value="timestamp">Sort by Time</option>
                    </select>

                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="select-input sort-order"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="table-container fade-in">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Accuracy</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={4}><LoadingCard /></td></tr>
                  ))
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr key={record.id} className="table-row fade-in" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                      <td className="table-cell">
                        <div className="student-info">
                          <div className="student-avatar">{record.avatar}</div>
                          <div className="student-details"><h4>{record.name}</h4></div>
                        </div>
                      </td>
                      <td className="table-cell"><StatusBadge status={record.status} /></td>
                      <td className="table-cell">{record.accuracy.toFixed(2)}%</td>
                      <td className="table-cell">{record.timestamp}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">
                        <Search size={48} className="empty-state-icon" />
                        <h3>No students found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
        
export default StudentSubmissions;