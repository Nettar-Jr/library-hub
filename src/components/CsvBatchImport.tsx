/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useId } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Users, 
  BookOpen, 
  Sparkles, 
  Trash2, 
  Check, 
  Search, 
  FileSpreadsheet, 
  Layers, 
  Settings2,
  FileDown,
  TableProperties,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  parseCSV, 
  generateCSV, 
  downloadCSVFile, 
  ROSTER_FIELD_ALIASES, 
  CATALOG_FIELD_ALIASES, 
  autoMapColumns, 
  normalizeRosterRows, 
  normalizeCatalogRows, 
  ParsedRosterRow, 
  ParsedCatalogRow, 
  SAMPLE_ROSTER_CSV, 
  SAMPLE_CATALOG_CSV 
} from '../utils/csvParser';
import { triggerConfetti } from '../utils/confetti';
import { Book, LibraryUser } from '../types';

interface CsvBatchImportProps {
  isModal?: boolean;
  initialTab?: 'roster' | 'catalog';
  onClose?: () => void;
  onImportComplete?: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'completed';

export const CsvBatchImport: React.FC<CsvBatchImportProps> = ({
  isModal = false,
  initialTab = 'roster',
  onClose,
  onImportComplete
}) => {
  const { 
    users, 
    books, 
    addUsersBatch, 
    addBooksBatch, 
    setActiveView 
  } = useApp();

  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active module: Roster vs Catalog
  const [activeTab, setActiveTab] = useState<'roster' | 'catalog'>(initialTab);
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');

  // File state
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Column mapping
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Processed & Normalized rows
  const [rosterRows, setRosterRows] = useState<ParsedRosterRow[]>([]);
  const [catalogRows, setCatalogRows] = useState<ParsedCatalogRow[]>([]);

  // Preview filtering & options
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR'>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [updateDuplicates, setUpdateDuplicates] = useState<boolean>(true);

  // Execution result
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    added: number;
    updated: number;
    skipped: number;
    total: number;
  } | null>(null);

  // -------------------------------------------------------------
  // File Upload Handlers
  // -------------------------------------------------------------
  const handleFileSelect = (file: File) => {
    setParseError(null);
    if (!file.name.match(/\.(csv|txt|tsv)$/i)) {
      setParseError('Please upload a standard .csv, .tsv, or .txt file.');
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || !content.trim()) {
        setParseError('The selected file appears to be completely empty.');
        return;
      }
      processRawCSV(content, file.name);
    };
    reader.onerror = () => {
      setParseError('Failed to read file from local disk.');
    };
    reader.readAsText(file);
  };

  const processRawCSV = (content: string, name: string) => {
    setRawText(content);
    setFileName(name);
    try {
      const parsed = parseCSV(content);
      if (parsed.length < 2) {
        setParseError('The file must contain at least one header row and one data row.');
        return;
      }

      setRawRows(parsed);
      const headers = parsed[0];

      // Auto map columns
      const aliasMap = activeTab === 'roster' ? ROSTER_FIELD_ALIASES : CATALOG_FIELD_ALIASES;
      const initialMap = autoMapColumns(headers, aliasMap);
      setColumnMapping(initialMap);

      setCurrentStep('mapping');
    } catch (err: any) {
      setParseError(`Error parsing CSV formatting: ${err.message}`);
    }
  };

  // Load sample dataset
  const handleLoadSample = () => {
    const sample = activeTab === 'roster' ? SAMPLE_ROSTER_CSV : SAMPLE_CATALOG_CSV;
    const name = activeTab === 'roster' ? 'sample_school_roster.csv' : 'sample_book_catalog.csv';
    processRawCSV(sample, name);
  };

  // Download sample template
  const handleDownloadTemplate = () => {
    if (activeTab === 'roster') {
      downloadCSVFile('school_roster_template.csv', SAMPLE_ROSTER_CSV);
    } else {
      downloadCSVFile('library_catalog_template.csv', SAMPLE_CATALOG_CSV);
    }
  };

  // Export current data
  const handleExportCurrentData = () => {
    if (activeTab === 'roster') {
      const csv = generateCSV(users, [
        { key: 'name', header: 'Full Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role', format: (val) => val === 'learner' || val === 'student' ? 'Student' : 'Teacher' },
        { key: 'gradeOrYear', header: 'Grade/Year' },
        { key: 'department', header: 'Department' },
        { key: 'libraryCardId', header: 'Library Card ID' },
        { key: 'assignedTeacherName', header: 'Assigned Teacher' },
      ]);
      downloadCSVFile(`school_patron_roster_${new Date().toISOString().split('T')[0]}.csv`, csv);
    } else {
      const csv = generateCSV(books, [
        { key: 'title', header: 'Title' },
        { key: 'author', header: 'Author' },
        { key: 'isbn', header: 'ISBN' },
        { key: 'category', header: 'Category' },
        { key: 'totalCopies', header: 'Total Copies' },
        { key: 'availableCopies', header: 'Available Copies' },
        { key: 'deweyCode', header: 'Dewey Code' },
        { key: 'readingLevel', header: 'Reading Level' },
        { key: 'ageRange', header: 'Age Range' },
        { key: 'hasAudio', header: 'Audio Available' },
        { key: 'usageType', header: 'Usage Type' },
        { key: 'description', header: 'Description' },
      ]);
      downloadCSVFile(`library_book_catalog_${new Date().toISOString().split('T')[0]}.csv`, csv);
    }
  };

  // -------------------------------------------------------------
  // Mapping to Validation
  // -------------------------------------------------------------
  const handleProceedToPreview = () => {
    if (rawRows.length < 2) return;

    if (activeTab === 'roster') {
      const normalized = normalizeRosterRows(rawRows, columnMapping, users);
      setRosterRows(normalized);
    } else {
      const normalized = normalizeCatalogRows(rawRows, columnMapping, books);
      setCatalogRows(normalized);
    }

    setCurrentStep('preview');
  };

  // -------------------------------------------------------------
  // Delete / Exclude row in preview
  // -------------------------------------------------------------
  const handleDeletePreviewRow = (rowNumber: number) => {
    if (activeTab === 'roster') {
      setRosterRows(prev => prev.filter(r => r.rowNumber !== rowNumber));
    } else {
      setCatalogRows(prev => prev.filter(r => r.rowNumber !== rowNumber));
    }
  };

  // -------------------------------------------------------------
  // Execute Commit
  // -------------------------------------------------------------
  const handleCommitImport = async () => {
    setIsProcessing(true);

    try {
      if (activeTab === 'roster') {
        const validRows = rosterRows.filter(r => r.status !== 'error');
        const userBatch = validRows.map(r => ({
          name: r.name,
          email: r.email,
          role: r.role,
          gradeOrYear: r.gradeOrYear,
          department: r.department,
          libraryCardId: r.libraryCardId,
          assignedTeacherName: r.assignedTeacherName,
        }));

        const res = addUsersBatch(userBatch, { updateDuplicates });
        setImportResult({
          added: res.addedCount,
          updated: res.updatedCount,
          skipped: res.skippedCount,
          total: validRows.length
        });
      } else {
        const validRows = catalogRows.filter(r => r.status !== 'error');
        const bookBatch = validRows.map(r => ({
          title: r.title,
          author: r.author,
          isbn: r.isbn,
          category: r.category,
          totalCopies: r.totalCopies,
          availableCopies: r.availableCopies,
          deweyCode: r.deweyCode,
          deweyClass: r.deweyClass,
          description: r.description,
          readingLevel: r.readingLevel,
          ageRange: r.ageRange,
          hasAudio: r.hasAudio,
          usageType: r.usageType,
          coverImage: r.coverImage,
        }));

        const res = await addBooksBatch(bookBatch, { updateDuplicates });
        setImportResult({
          added: res.addedCount,
          updated: res.updatedCount,
          skipped: res.skippedCount,
          total: validRows.length
        });
      }

      triggerConfetti();
      setCurrentStep('completed');
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: any) {
      setParseError(`Failed during batch commit: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to initial
  const handleReset = () => {
    setCurrentStep('upload');
    setFileName('');
    setFileSize('');
    setRawText('');
    setRawRows([]);
    setColumnMapping({});
    setRosterRows([]);
    setCatalogRows([]);
    setImportResult(null);
    setParseError(null);
  };

  // -------------------------------------------------------------
  // Render Helpers
  // -------------------------------------------------------------
  const headers = rawRows[0] || [];
  const previewSampleRow1 = rawRows[1] || [];
  const previewSampleRow2 = rawRows[2] || [];

  const rosterFields = [
    { key: 'name', label: 'Full Name', required: true, desc: 'Patron or student full legal name' },
    { key: 'email', label: 'Email Address', required: true, desc: 'School email address for notices' },
    { key: 'role', label: 'Role / Type', required: false, desc: 'Student, Teacher, or Staff' },
    { key: 'gradeOrYear', label: 'Grade / Year', required: false, desc: 'e.g. Year 9, Grade 10, Form 4' },
    { key: 'department', label: 'Faculty / Dept', required: false, desc: 'For teachers (e.g. Science Dept)' },
    { key: 'libraryCardId', label: 'Library Card ID', required: false, desc: 'Barcode / Card ID (auto-generated if empty)' },
    { key: 'assignedTeacherName', label: 'Assigned Advisor', required: false, desc: 'Form tutor or advisor name' },
  ];

  const catalogFields = [
    { key: 'title', label: 'Book Title', required: true, desc: 'Accession title' },
    { key: 'author', label: 'Author', required: true, desc: 'Primary author or creator' },
    { key: 'isbn', label: 'ISBN / Barcode', required: false, desc: '10 or 13 digit ISBN (auto-generated if empty)' },
    { key: 'category', label: 'Category / Genre', required: false, desc: 'e.g. African Literature, STEM' },
    { key: 'totalCopies', label: 'Copies in Stock', required: false, desc: 'Physical quantity (defaults to 1)' },
    { key: 'deweyCode', label: 'Dewey Call Number', required: false, desc: 'Classification code (e.g. 896.3)' },
    { key: 'readingLevel', label: 'Reading Level', required: false, desc: 'Lexile level (e.g. Lexile 890L)' },
    { key: 'ageRange', label: 'Age Recommendation', required: false, desc: 'Target audience (e.g. Ages 12-18)' },
    { key: 'hasAudio', label: 'Audio Narration', required: false, desc: 'Yes/No if audio media exists' },
    { key: 'usageType', label: 'Circulation Type', required: false, desc: 'Circulation (borrowable) or Reserve' },
    { key: 'description', label: 'Description / Blurb', required: false, desc: 'Summary of the book' },
  ];

  const activeFields = activeTab === 'roster' ? rosterFields : catalogFields;

  // Filtered preview rows
  const filteredRosterRows = rosterRows.filter(row => {
    if (previewFilter === 'VALID' && row.status !== 'valid') return false;
    if (previewFilter === 'WARNING' && row.status !== 'warning') return false;
    if (previewFilter === 'ERROR' && row.status !== 'error') return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (row.libraryCardId && row.libraryCardId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredCatalogRows = catalogRows.filter(row => {
    if (previewFilter === 'VALID' && row.status !== 'valid') return false;
    if (previewFilter === 'WARNING' && row.status !== 'warning') return false;
    if (previewFilter === 'ERROR' && row.status !== 'error') return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        row.title.toLowerCase().includes(q) ||
        row.author.toLowerCase().includes(q) ||
        (row.isbn && row.isbn.toLowerCase().includes(q)) ||
        row.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalRowsCount = activeTab === 'roster' ? rosterRows.length : catalogRows.length;
  const validCount = activeTab === 'roster' 
    ? rosterRows.filter(r => r.status === 'valid').length 
    : catalogRows.filter(r => r.status === 'valid').length;
  const warningCount = activeTab === 'roster' 
    ? rosterRows.filter(r => r.status === 'warning').length 
    : catalogRows.filter(r => r.status === 'warning').length;
  const errorCount = activeTab === 'roster' 
    ? rosterRows.filter(r => r.status === 'error').length 
    : catalogRows.filter(r => r.status === 'error').length;

  const content = (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
              CSV Data Pipeline
            </span>
            <span className="text-xs text-slate-500 font-medium">
              School SIS & Inventory Sync
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
            CSV Roster & Catalog Batch Import
          </h2>
          <p className="text-xs text-slate-600 max-w-xl">
            Import hundreds of student/staff records or library book accessions at once using any standard CSV, Excel export, or Google Sheet.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-slate-200"
            title="Download an example CSV file formatted for this system"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download {activeTab === 'roster' ? 'Roster' : 'Catalog'} Template</span>
          </button>

          <button
            type="button"
            onClick={handleExportCurrentData}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-slate-200 shadow-2xs"
            title="Export existing system database to CSV"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Current {activeTab === 'roster' ? 'Roster' : 'Catalog'}</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs: Roster vs Catalog */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (currentStep !== 'upload') {
                if (window.confirm('Switching import types will reset your current progress. Continue?')) {
                  setActiveTab('roster');
                  handleReset();
                }
              } else {
                setActiveTab('roster');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Patron & Student Roster</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">
              {users.length} enrolled
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (currentStep !== 'upload') {
                if (window.confirm('Switching import types will reset your current progress. Continue?')) {
                  setActiveTab('catalog');
                  handleReset();
                }
              } else {
                setActiveTab('catalog');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Book Catalog & Inventory</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">
              {books.length} titles
            </span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className={currentStep === 'upload' ? 'text-cyan-700 font-bold' : ''}>1. Upload</span>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <span className={currentStep === 'mapping' ? 'text-cyan-700 font-bold' : ''}>2. Map Columns</span>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <span className={currentStep === 'preview' ? 'text-cyan-700 font-bold' : ''}>3. Validate & Review</span>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <span className={currentStep === 'completed' ? 'text-cyan-700 font-bold' : ''}>4. Complete</span>
        </div>
      </div>

      {/* Parse Error Notification */}
      {parseError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">CSV Import Error</h4>
            <p>{parseError}</p>
          </div>
          <button
            type="button"
            onClick={() => setParseError(null)}
            className="ml-auto text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: UPLOAD & DROPZONE */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition ${
              isDragging 
                ? 'border-cyan-500 bg-cyan-50/50' 
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center mb-4 shadow-xs">
              <Upload className="w-8 h-8 text-cyan-700" />
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
              Upload your {activeTab === 'roster' ? 'School Roster' : 'Library Catalog'} CSV
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
              Drag and drop your spreadsheet export here, or browse your files. Works with PowerSchool, Google Sheets, Excel (.csv), and standard library SIS formats.
            </p>

            <input
              id={fileInputId}
              type="file"
              ref={fileInputRef}
              accept=".csv,.tsv,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Select CSV File</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Load Sample Dataset (1-Click)</span>
              </button>
            </div>
          </div>

          {/* Direct Text Paste Option */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h4 className="font-display font-bold text-sm text-slate-900">
                  Or Paste Raw CSV Data Directly
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Comma, tab, or semicolon separated</span>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={activeTab === 'roster' ? SAMPLE_ROSTER_CSV : SAMPLE_CATALOG_CSV}
              rows={5}
              className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!rawText.trim()}
                onClick={() => processRawCSV(rawText, 'pasted_data.csv')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold text-xs rounded-xl cursor-pointer transition flex items-center gap-2"
              >
                <span>Parse Pasted Content</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {currentStep === 'mapping' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Step 2: Map CSV Columns to System Fields
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                We've automatically detected matches for {fileName} ({rawRows.length - 1} data rows, {headers.length} columns). Verify or adjust each mapping below.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Change File</span>
            </button>
          </div>

          {/* Field mapping grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeFields.map((field) => {
              const mappedCol = columnMapping[field.key] || '';
              const sampleVal1 = mappedCol ? previewSampleRow1[headers.indexOf(mappedCol)] : '';
              const sampleVal2 = mappedCol ? previewSampleRow2[headers.indexOf(mappedCol)] : '';

              return (
                <div 
                  key={field.key}
                  className={`p-4 rounded-2xl border transition ${
                    field.required && !mappedCol
                      ? 'border-rose-300 bg-rose-50/30'
                      : mappedCol 
                      ? 'border-slate-200 bg-slate-50/50' 
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor={`map-select-${field.key}`}
                      className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                    >
                      <span>{field.label}</span>
                      {field.required ? (
                        <span className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider bg-rose-50 px-1.5 py-0.2 rounded">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                      )}
                    </label>

                    {mappedCol && (
                      <span className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Mapped
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mb-2.5">
                    {field.desc}
                  </p>

                  <select
                    id={`map-select-${field.key}`}
                    value={mappedCol}
                    onChange={(e) => {
                      setColumnMapping(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }));
                    }}
                    className={`w-full p-2 text-xs rounded-xl border bg-white outline-none font-medium text-slate-800 ${
                      field.required && !mappedCol
                        ? 'border-rose-400 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-1 focus:ring-cyan-500'
                    }`}
                  >
                    <option value="">-- Do Not Import / Auto-Generate --</option>
                    {headers.map((h, i) => (
                      <option key={i} value={h}>
                        {h} {previewSampleRow1[i] ? `(e.g. "${previewSampleRow1[i].slice(0, 24)}")` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Sample Values Preview */}
                  {mappedCol && (sampleVal1 || sampleVal2) && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-mono truncate">
                      <span className="text-slate-400">Sample: </span>
                      <span className="font-semibold text-slate-700">"{sampleVal1 || '-'}"</span>
                      {sampleVal2 && <span>, "{sampleVal2}"</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToPreview}
              className="px-6 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition flex items-center gap-2 active:scale-95"
            >
              <span>Validate & Preview Rows</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & VALIDATE */}
      {currentStep === 'preview' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                Total Rows
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                {totalRowsCount}
              </div>
              <p className="text-[10px] text-slate-500">From {fileName}</p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-2xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Valid Clean
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-900 font-display">
                {validCount}
              </div>
              <p className="text-[10px] text-emerald-700">Ready for direct import</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-2xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Warnings
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-900 font-display">
                {warningCount}
              </div>
              <p className="text-[10px] text-amber-700">Auto-filled or duplicates</p>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl shadow-2xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-rose-700 font-mono flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                Blocking Errors
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-900 font-display">
                {errorCount}
              </div>
              <p className="text-[10px] text-rose-700">Excluded automatically</p>
            </div>
          </div>

          {/* Table Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter View:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    previewFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({totalRowsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('VALID')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    previewFilter === 'VALID' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Valid ({validCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('WARNING')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    previewFilter === 'WARNING' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Warnings ({warningCount})
                </button>
                {errorCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('ERROR')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      previewFilter === 'ERROR' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Errors ({errorCount})
                  </button>
                )}
              </div>
            </div>

            {/* Search & Duplicate Resolution */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search in parsed rows..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={updateDuplicates}
                  onChange={(e) => setUpdateDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Update Existing Records</span>
              </label>
            </div>
          </div>

          {/* Validation Data Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Row</th>
                    <th className="py-3 px-4">Status</th>
                    {activeTab === 'roster' ? (
                      <>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Grade / Dept</th>
                        <th className="py-3 px-4">Card ID</th>
                        <th className="py-3 px-4">Assigned Advisor</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Author</th>
                        <th className="py-3 px-4">ISBN</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-center">Copies</th>
                        <th className="py-3 px-4">Dewey</th>
                        <th className="py-3 px-4">Type</th>
                      </>
                    )}
                    <th className="py-3 px-4 text-right w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {activeTab === 'roster' ? (
                    filteredRosterRows.map((row) => (
                      <tr key={row.rowNumber} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 text-center">
                          #{row.rowNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          {row.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> Valid
                            </span>
                          )}
                          {row.status === 'warning' && (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full cursor-help"
                              title={row.messages.join(' • ')}
                            >
                              <AlertTriangle className="w-3 h-3" /> Notice
                            </span>
                          )}
                          {row.status === 'error' && (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full cursor-help"
                              title={row.messages.join(' • ')}
                            >
                              <AlertCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {row.name || <span className="text-rose-500 italic">Empty</span>}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                          {row.email}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            row.role === 'teacher' || row.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-cyan-100 text-cyan-800'
                          }`}>
                            {row.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[11px]">
                          {row.gradeOrYear || row.department || '-'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                          {row.libraryCardId}
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-slate-500">
                          {row.assignedTeacherName || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePreviewRow(row.rowNumber)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Exclude this record from import"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredCatalogRows.map((row) => (
                      <tr key={row.rowNumber} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 text-center">
                          #{row.rowNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          {row.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> Valid
                            </span>
                          )}
                          {row.status === 'warning' && (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full cursor-help"
                              title={row.messages.join(' • ')}
                            >
                              <AlertTriangle className="w-3 h-3" /> Notice
                            </span>
                          )}
                          {row.status === 'error' && (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full cursor-help"
                              title={row.messages.join(' • ')}
                            >
                              <AlertCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {row.title || <span className="text-rose-500 italic">Empty</span>}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {row.author}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                          {row.isbn}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {row.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          {row.totalCopies}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                          {row.deweyCode}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            row.usageType === 'reserve' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {row.usageType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePreviewRow(row.rowNumber)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Exclude this book from import"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Empty filter message */}
            {((activeTab === 'roster' && filteredRosterRows.length === 0) ||
              (activeTab === 'catalog' && filteredCatalogRows.length === 0)) && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No rows match the selected filter criteria.
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep('mapping')}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Adjust Column Mapping</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Ready to commit: <strong className="text-slate-900">{validCount + warningCount}</strong> of {totalRowsCount} records
              </span>

              <button
                type="button"
                disabled={isProcessing || (validCount + warningCount === 0)}
                onClick={handleCommitImport}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition flex items-center gap-2 active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import {validCount + warningCount} {activeTab === 'roster' ? 'Patrons' : 'Titles'} Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: COMPLETED SUMMARY */}
      {currentStep === 'completed' && importResult && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Batch Synchronization Successful
            </span>
            <h3 className="font-display font-black text-2xl text-slate-900 mt-2">
              Import Completed Successfully!
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your {activeTab === 'roster' ? 'school roster' : 'book catalog'} has been updated and securely stored in local and cloud state.
            </p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Newly Added</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-display">
                {importResult.added}
              </div>
            </div>

            <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-200">
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-700">Updated / Merged</span>
              <div className="text-2xl font-black text-cyan-900 mt-1 font-display">
                {importResult.updated}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Skipped</span>
              <div className="text-2xl font-black text-slate-600 mt-1 font-display">
                {importResult.skipped}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Another File</span>
            </button>

            {activeTab === 'roster' ? (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  setActiveView('DESK_UTILITIES');
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition flex items-center gap-2"
              >
                <Users className="w-3.5 h-3.5" />
                <span>View User Account Registry</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  setActiveView('BOOKSHELF');
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>View Catalog Inventory</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="CSV Batch Import Modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-slate-50 border border-slate-200 rounded-3xl p-6 max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4"
        >
          {content}
        </motion.div>
      </div>
    );
  }

  return content;
};
