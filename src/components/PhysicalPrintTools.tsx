/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Book, CirculationRecord, LibraryUser } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { 
  Printer, 
  Tag, 
  Receipt, 
  Check, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  X, 
  RotateCcw, 
  Calendar, 
  BookOpen, 
  User as UserIcon, 
  Building2, 
  Clock, 
  ShieldAlert, 
  FileText,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Helper to calculate Cutter code (first 3 letters of author's last name)
export function getCutterCode(authorName: string): string {
  if (!authorName) return 'GEN';
  const clean = authorName.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/);
  const lastName = parts[parts.length - 1];
  return (lastName || 'GEN').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'GEN';
}

interface PhysicalPrintToolsProps {
  initialTab?: 'spine' | 'slips';
  preselectedBookIds?: string[];
  preselectedUserId?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const PhysicalPrintTools: React.FC<PhysicalPrintToolsProps> = ({
  initialTab = 'spine',
  preselectedBookIds = [],
  preselectedUserId,
  onClose,
  isModal = false,
}) => {
  const { books, circulation, users, user: currentUser } = useApp();

  const [activeModule, setActiveModule] = useState<'spine' | 'slips'>(initialTab);

  // -------------------------------------------------------------
  // SPINE LABELS STATE
  // -------------------------------------------------------------
  const [labelTemplate, setLabelTemplate] = useState<'avery5160' | 'thermal_roll' | 'spine_pocket'>('avery5160');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Book ID -> quantity map
  const [selectedBooksMap, setSelectedBooksMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (preselectedBookIds.length > 0) {
      preselectedBookIds.forEach(id => {
        initial[id] = 1;
      });
    } else {
      // Default select the first 3 books so user immediately sees a live preview
      books.slice(0, 3).forEach(b => {
        initial[b.id] = 1;
      });
    }
    return initial;
  });

  // Label Customization Options
  const [showSchoolHeader, setShowSchoolHeader] = useState(true);
  const [schoolHeader, setSchoolHeader] = useState("PREMIER INT'L SCHOOL");
  const [showBarcode, setShowBarcode] = useState(true);
  const [barcodeType, setBarcodeType] = useState<'isbn' | 'id'>('isbn');
  const [showCutter, setShowCutter] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showCopyNumber, setShowCopyNumber] = useState(true);
  const [callNumberFontSize, setCallNumberFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [startingOffset, setStartingOffset] = useState<number>(0); // Skip first N labels on sheet

  // -------------------------------------------------------------
  // CHECKOUT SLIPS & RECEIPTS STATE
  // -------------------------------------------------------------
  const [slipTemplate, setSlipTemplate] = useState<'thermal_80mm' | 'pocket_slip' | 'compact_58mm'>('thermal_80mm');
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    if (preselectedUserId) return preselectedUserId;
    // Default to a user who has active loans, or the first user
    const userWithLoans = users.find(u => circulation.some(c => c.learnerName === u.name && c.status !== 'returned'));
    return userWithLoans?.id || users[0]?.id || '';
  });

  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
  const [includeBarcodesOnSlip, setIncludeBarcodesOnSlip] = useState(true);
  const [includePolicyNotes, setIncludePolicyNotes] = useState(true);
  const [includeStampBox, setIncludeStampBox] = useState(true);
  const [librarianName, setLibrarianName] = useState(currentUser?.name || 'Mrs. N. Okonjo');

  // Categories list for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    books.forEach(b => {
      if (b.category) cats.add(b.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchCat = selectedCategory === 'ALL' || b.category === selectedCategory;
      const q = bookSearch.toLowerCase();
      const matchQ = !q || 
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (b.deweyCode && b.deweyCode.includes(q)) ||
        (b.callNumber && b.callNumber.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [books, selectedCategory, bookSearch]);

  // Selected Books Array with repeats for quantity
  const flatLabelsToPrint = useMemo(() => {
    const list: Array<{ book: Book; copyIndex: number }> = [];
    Object.entries(selectedBooksMap).forEach(([bookId, rawCount]) => {
      const count = Number(rawCount) || 0;
      const book = books.find(b => b.id === bookId);
      if (book && count > 0) {
        for (let i = 1; i <= count; i++) {
          list.push({ book, copyIndex: i });
        }
      }
    });
    return list;
  }, [selectedBooksMap, books]);

  // Active user data for checkout slip
  const activeSlipUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  // Active loans for selected user
  const userLoans = useMemo(() => {
    if (!activeSlipUser) return [];
    return circulation.filter(c => c.learnerName.toLowerCase() === activeSlipUser.name.toLowerCase());
  }, [circulation, activeSlipUser]);

  // Automatically select all active loans when user changes
  React.useEffect(() => {
    if (userLoans.length > 0) {
      const unreturned = userLoans.filter(l => l.status !== 'returned').map(l => l.id);
      setSelectedLoanIds(unreturned.length > 0 ? unreturned : userLoans.map(l => l.id));
    } else {
      setSelectedLoanIds([]);
    }
  }, [userLoans]);

  // Loans included in slip
  const loansOnSlip = useMemo(() => {
    return userLoans.filter(l => selectedLoanIds.includes(l.id));
  }, [userLoans, selectedLoanIds]);

  // Trigger system print
  const handlePrint = () => {
    window.print();
  };

  // Helper to toggle book selection
  const toggleBook = (bookId: string) => {
    setSelectedBooksMap(prev => {
      const copy = { ...prev };
      if (copy[bookId]) {
        delete copy[bookId];
      } else {
        copy[bookId] = 1;
      }
      return copy;
    });
  };

  // Select all filtered books
  const selectAllFiltered = () => {
    const copy = { ...selectedBooksMap };
    filteredBooks.forEach(b => {
      copy[b.id] = copy[b.id] || 1;
    });
    setSelectedBooksMap(copy);
  };

  // Clear all book selections
  const clearAllSelected = () => {
    setSelectedBooksMap({});
  };

  return (
    <div className={`space-y-6 ${isModal ? 'p-2' : ''}`}>
      {/* Non-Printable Header & Studio Controls */}
      <div className="print:hidden space-y-5">
        {/* Module Title & Tab Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-500/20">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                  Physical Print Tools
                </h2>
                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold rounded-full">
                  300 DPI READY
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate professional Dewey spine call labels, pocket accession barcodes, and thermal date-due receipts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold py-2.5 px-5 rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print {activeModule === 'spine' ? `(${flatLabelsToPrint.length} Labels)` : 'Checkout Slip'}</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Primary Subtab Switcher */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl max-w-md border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveModule('spine')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeModule === 'spine'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 text-blue-600" />
            <span>Spine & Pocket Labels</span>
            {flatLabelsToPrint.length > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full font-mono font-bold">
                {flatLabelsToPrint.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('slips')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeModule === 'slips'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Date-Due Checkout Slips</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          MODULE 1: SPINE & POCKET LABELS
          ==================================================================== */}
      {activeModule === 'spine' && (
        <div className="space-y-6">
          {/* Controls & Configuration Grid (Hidden in Print) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
            {/* Left Column: Book Selector */}
            <div className="lg:col-span-5 space-y-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="font-display font-extrabold text-sm text-slate-900">
                    Select Catalog Titles
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer px-1.5 py-0.5"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllSelected}
                    className="text-slate-500 hover:text-rose-600 font-semibold cursor-pointer px-1.5 py-0.5"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by title, author, Dewey, or ISBN..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              {/* Category Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                {categories.slice(0, 6).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Scrollable Books List */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-50">
                {filteredBooks.map(book => {
                  const isSelected = !!selectedBooksMap[book.id];
                  const count = selectedBooksMap[book.id] || 0;
                  const cutter = getCutterCode(book.author);
                  const dewey = book.deweyCode || book.deweyClass || '800';

                  return (
                    <div
                      key={book.id}
                      className={`pt-2 pb-1.5 px-2 rounded-xl flex items-center justify-between gap-2 transition ${
                        isSelected ? 'bg-blue-50/70 border border-blue-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleBook(book.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">
                            {book.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                            <span>{book.author}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-100/60 px-1 rounded">
                              {dewey} {cutter}
                            </span>
                          </p>
                        </div>
                      </label>

                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium">Qty:</span>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={count}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setSelectedBooksMap(prev => ({ ...prev, [book.id]: val }));
                            }}
                            className="w-12 text-center py-0.5 px-1 bg-white border border-slate-300 rounded-md text-xs font-bold font-mono outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredBooks.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-400">
                    No books match "{bookSearch}".
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
                <span>{Object.keys(selectedBooksMap).length} titles selected</span>
                <span className="font-bold text-blue-700">{flatLabelsToPrint.length} total labels</span>
              </div>
            </div>

            {/* Right Column: Template & Layout Settings */}
            <div className="lg:col-span-7 space-y-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-display font-extrabold text-sm text-slate-900">
                    Label Sheet & Layout Settings
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Calibrated for standard A4 & Letter
                </span>
              </div>

              {/* Template Format Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setLabelTemplate('avery5160')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    labelTemplate === 'avery5160'
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 block">Avery 5160 Sheet</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    30 labels / sheet (1" x 2⅝")
                  </span>
                  <span className="text-[9px] font-mono text-blue-600 block mt-1">
                    Standard 3-column sheet
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelTemplate('thermal_roll')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    labelTemplate === 'thermal_roll'
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 block">Thermal Roll</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Continuous roll (1.5" x 1")
                  </span>
                  <span className="text-[9px] font-mono text-indigo-600 block mt-1">
                    Brother, Dymo, Zebra
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLabelTemplate('spine_pocket')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    labelTemplate === 'spine_pocket'
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 block">Spine + Pocket Pair</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Narrow spine tag & pocket
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 block mt-1">
                    Complete book prep set
                  </span>
                </button>
              </div>

              {/* Toggles & Options */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSchoolHeader}
                    onChange={(e) => setShowSchoolHeader(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">School Header</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBarcode}
                    onChange={(e) => setShowBarcode(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Scannable Barcode</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCutter}
                    onChange={(e) => setShowCutter(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Cutter 3-Letter</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showTitle}
                    onChange={(e) => setShowTitle(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Book Title</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCopyNumber}
                    onChange={(e) => setShowCopyNumber(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Copy # (c.1, c.2)</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Barcode:</span>
                  <select
                    value={barcodeType}
                    onChange={(e) => setBarcodeType(e.target.value as 'isbn' | 'id')}
                    className="bg-slate-100 border border-slate-200 rounded-lg p-1 text-[11px] font-semibold text-slate-800"
                  >
                    <option value="isbn">ISBN Code</option>
                    <option value="id">Accession ID</option>
                  </select>
                </div>
              </div>

              {/* Offset & School Name Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                {showSchoolHeader && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      School Header Label
                    </label>
                    <input
                      type="text"
                      value={schoolHeader}
                      onChange={(e) => setSchoolHeader(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                )}

                {labelTemplate === 'avery5160' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Skip Partially Used Labels (Offset)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={29}
                        value={startingOffset}
                        onChange={(e) => setStartingOffset(Math.max(0, Math.min(29, parseInt(e.target.value) || 0)))}
                        className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800"
                      />
                      <span className="text-[11px] text-slate-400">
                        Preserve partially peeled sticker sheets
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions banner */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Tip: In your browser print dialog, set <strong>Margins: None</strong> and check <strong>Background Graphics: ON</strong> for exact pixel-aligned sticker margins.
                </span>
              </div>
            </div>
          </div>

          {/* ==========================================================
              LIVE PRINTABLE PREVIEW CANVAS (Screen & Print)
              ========================================================== */}
          <div className="bg-slate-900/5 border border-slate-200 rounded-3xl p-4 sm:p-8">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Sheet Print Preview ({flatLabelsToPrint.length} labels ready)
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Now</span>
              </button>
            </div>

            {/* Empty State */}
            {flatLabelsToPrint.length === 0 && (
              <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300 print:hidden space-y-2">
                <Tag className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No books selected for printing</p>
                <p className="text-xs text-slate-500">
                  Select books from the list on the left to generate physical spine labels.
                </p>
              </div>
            )}

            {/* AVERY 5160 3-COLUMN SHEET LAYOUT */}
            {labelTemplate === 'avery5160' && flatLabelsToPrint.length > 0 && (
              <div className="max-w-[8.5in] mx-auto bg-white p-6 sm:p-8 shadow-xl rounded-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0">
                <div 
                  className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-3 print:grid-cols-3 print:gap-x-[0.14in] print:gap-y-[0.05in]"
                  style={{
                    // Standard Avery 5160 30-up specifications
                  }}
                >
                  {/* Offset empty blanks for partially used sheets */}
                  {Array.from({ length: startingOffset }).map((_, idx) => (
                    <div
                      key={`blank-${idx}`}
                      className="h-[1.1in] sm:h-[1in] border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-300 font-mono print:border-none print:opacity-0"
                    >
                      [Skipped Label #{idx + 1}]
                    </div>
                  ))}

                  {/* Real labels */}
                  {flatLabelsToPrint.map(({ book, copyIndex }, idx) => {
                    const cutter = getCutterCode(book.author);
                    const dewey = book.deweyCode || book.deweyClass || '823.9';
                    const barcodeVal = barcodeType === 'isbn' ? (book.isbn || book.id) : book.id;

                    return (
                      <div
                        key={`${book.id}-${copyIndex}-${idx}`}
                        className="h-[1.15in] sm:h-[1.05in] p-2 bg-white border border-slate-300 print:border-slate-300 rounded-lg flex flex-col justify-between overflow-hidden break-inside-avoid shadow-3xs print:shadow-none"
                      >
                        {/* Top: School Name and Copy # */}
                        <div className="flex items-center justify-between text-[8px] font-mono font-bold text-slate-500 border-b border-slate-100 pb-0.5">
                          {showSchoolHeader && (
                            <span className="truncate max-w-[120px] uppercase">{schoolHeader}</span>
                          )}
                          {showCopyNumber && (
                            <span className="text-slate-400 shrink-0">c.{copyIndex}</span>
                          )}
                        </div>

                        {/* Middle: Spine classification and Book Title */}
                        <div className="flex items-center gap-2 py-0.5">
                          {/* Call Tag Block */}
                          <div className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-center font-mono shrink-0 leading-tight">
                            <span className="font-extrabold text-[11px] text-slate-900 block">
                              {dewey}
                            </span>
                            {showCutter && (
                              <span className="font-bold text-[9px] text-slate-700 block tracking-widest">
                                {cutter}
                              </span>
                            )}
                          </div>

                          {/* Title info */}
                          <div className="min-w-0 flex-1 leading-tight">
                            {showTitle && (
                              <p className="font-bold text-[10px] text-slate-900 line-clamp-1">
                                {book.title}
                              </p>
                            )}
                            <p className="text-[9px] text-slate-500 line-clamp-1 italic">
                              {book.author}
                            </p>
                          </div>
                        </div>

                        {/* Bottom: Barcode */}
                        {showBarcode && (
                          <div className="flex flex-col items-center justify-center pt-0.5">
                            <BarcodeRenderer
                              value={barcodeVal}
                              height={16}
                              width={1.1}
                              displayValue={false}
                              margin={0}
                              className="max-h-5"
                            />
                            <span className="font-mono text-[7px] text-slate-600 tracking-wider">
                              {barcodeVal}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* THERMAL CONTINUOUS ROLL (1.5" x 1") */}
            {labelTemplate === 'thermal_roll' && flatLabelsToPrint.length > 0 && (
              <div className="max-w-md mx-auto space-y-3 print:space-y-0">
                {flatLabelsToPrint.map(({ book, copyIndex }, idx) => {
                  const cutter = getCutterCode(book.author);
                  const dewey = book.deweyCode || book.deweyClass || '823.9';
                  const barcodeVal = barcodeType === 'isbn' ? (book.isbn || book.id) : book.id;

                  return (
                    <div
                      key={`thermal-${book.id}-${copyIndex}-${idx}`}
                      className="w-full sm:w-[2.5in] mx-auto p-2 bg-white border border-slate-400 print:border-black rounded-lg flex flex-col justify-between break-inside-avoid mb-2"
                    >
                      <div className="flex justify-between items-center text-[8px] font-mono font-bold text-slate-600 border-b border-slate-200 pb-0.5">
                        <span>{schoolHeader}</span>
                        <span>c.{copyIndex}</span>
                      </div>

                      <div className="flex items-center gap-2 py-1">
                        <div className="bg-slate-100 p-1 rounded border border-slate-300 text-center font-mono leading-none">
                          <span className="font-black text-xs block text-slate-900">{dewey}</span>
                          <span className="font-bold text-[10px] block text-slate-700 tracking-wider">{cutter}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[10px] text-slate-900 truncate">{book.title}</p>
                          <p className="text-[8px] text-slate-500 truncate">{book.author}</p>
                        </div>
                      </div>

                      {showBarcode && (
                        <div className="text-center pt-0.5">
                          <BarcodeRenderer
                            value={barcodeVal}
                            height={18}
                            width={1.2}
                            displayValue={true}
                            fontSize={8}
                            margin={1}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* SPINE + POCKET DUAL LABELS */}
            {labelTemplate === 'spine_pocket' && flatLabelsToPrint.length > 0 && (
              <div className="max-w-xl mx-auto space-y-3 print:space-y-2">
                {flatLabelsToPrint.map(({ book, copyIndex }, idx) => {
                  const cutter = getCutterCode(book.author);
                  const dewey = book.deweyCode || book.deweyClass || '823.9';
                  const barcodeVal = barcodeType === 'isbn' ? (book.isbn || book.id) : book.id;

                  return (
                    <div
                      key={`pair-${book.id}-${copyIndex}-${idx}`}
                      className="flex flex-col sm:flex-row gap-2 bg-white p-3 border border-slate-300 rounded-xl break-inside-avoid print:border-black"
                    >
                      {/* Left: Narrow Spine Tag (0.9" width equivalent) */}
                      <div className="w-full sm:w-28 p-2 bg-slate-50 border border-slate-300 rounded-lg flex flex-col justify-center items-center text-center font-mono">
                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          SPINE
                        </span>
                        <span className="font-black text-sm text-slate-900">{dewey}</span>
                        <span className="font-bold text-xs text-slate-700 tracking-widest">{cutter}</span>
                        <span className="text-[8px] text-slate-500 mt-1">c.{copyIndex}</span>
                        <span className="text-[7px] text-slate-400 mt-0.5">PIS</span>
                      </div>

                      {/* Right: Book Pocket Accession Tag */}
                      <div className="flex-1 p-2 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 border-b border-slate-100 pb-0.5">
                            <span>PREMIER INTERNATIONAL SCHOOL LIBRARY</span>
                            <span>{book.category}</span>
                          </div>
                          <h4 className="font-display font-black text-xs text-slate-900 mt-1 line-clamp-1">
                            {book.title}
                          </h4>
                          <p className="text-[10px] text-slate-600 italic line-clamp-1">
                            By {book.author}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100">
                          <div className="text-[9px] font-mono text-slate-600">
                            <span className="font-bold text-slate-900">{dewey} {cutter}</span> • c.{copyIndex}
                          </div>
                          <BarcodeRenderer
                            value={barcodeVal}
                            height={18}
                            width={1.1}
                            displayValue={true}
                            fontSize={8}
                            margin={0}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ====================================================================
          MODULE 2: DATE-DUE CHECKOUT SLIPS & RECEIPTS
          ==================================================================== */}
      {activeModule === 'slips' && (
        <div className="space-y-6">
          {/* Slip Controls (Hidden in Print) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
            {/* Patron & Loan Selector */}
            <div className="lg:col-span-5 space-y-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-display font-extrabold text-sm text-slate-900">
                    Select Patron / Borrower
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  {userLoans.length} active loan{userLoans.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* User Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                  Library User / Card ID
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white"
                >
                  {users.map(u => {
                    const activeCount = circulation.filter(c => c.learnerName.toLowerCase() === u.name.toLowerCase() && c.status !== 'returned').length;
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.libraryCardId}) — {u.role === 'student' ? (u.gradeOrYear || 'Student') : (u.department || 'Staff')} {activeCount > 0 ? `[${activeCount} Active Loans]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected User Overview Card */}
              {activeSlipUser && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{activeSlipUser.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 block">
                      Card: {activeSlipUser.libraryCardId} • {activeSlipUser.email}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-700">
                    {activeSlipUser.role}
                  </span>
                </div>
              )}

              {/* Loans Checklist */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Include Books on Slip:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLoanIds.length === userLoans.length) {
                        setSelectedLoanIds([]);
                      } else {
                        setSelectedLoanIds(userLoans.map(l => l.id));
                      }
                    }}
                    className="text-emerald-600 hover:underline font-semibold text-[11px]"
                  >
                    {selectedLoanIds.length === userLoans.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100 pr-1">
                  {userLoans.map(loan => {
                    const isChecked = selectedLoanIds.includes(loan.id);
                    const isOverdue = loan.status === 'overdue';

                    return (
                      <label
                        key={loan.id}
                        className={`pt-2 flex items-start gap-2.5 cursor-pointer text-xs p-1.5 rounded-xl transition ${
                          isChecked ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedLoanIds(prev => prev.filter(id => id !== loan.id));
                            } else {
                              setSelectedLoanIds(prev => [...prev, loan.id]);
                            }
                          }}
                          className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate">{loan.bookTitle}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>Borrowed: {loan.borrowDate}</span>
                            <span>•</span>
                            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              Due: {loan.dueDate} {isOverdue ? '(OVERDUE)' : ''}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}

                  {userLoans.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                      <Clock className="w-5 h-5 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">No active loans for {activeSlipUser?.name}</p>
                      <p className="text-[10px]">
                        Assign loans via the Circulation or Desk Scanner tab to generate checkout slips.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Slip Customization Options */}
            <div className="lg:col-span-7 space-y-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-display font-extrabold text-sm text-slate-900">
                    Slip Format & Receipt Settings
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Thermal printer & pocket card formats
                </span>
              </div>

              {/* Template Style Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSlipTemplate('thermal_80mm')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    slipTemplate === 'thermal_80mm'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 block">80mm POS Thermal</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Standard POS receipt paper roll
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 block mt-1">
                    Epson, Star, MUNBYN
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSlipTemplate('pocket_slip')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    slipTemplate === 'pocket_slip'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 block">3" x 5" Pocket Card</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Traditional card for book pocket
                  </span>
                  <span className="text-[9px] font-mono text-blue-600 block mt-1">
                    Stamp grid table
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSlipTemplate('compact_58mm')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    slipTemplate === 'compact_58mm'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 block">58mm Mini Thermal</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Compact portable handhelds
                  </span>
                  <span className="text-[9px] font-mono text-slate-600 block mt-1">
                    Narrow 2-inch tape
                  </span>
                </button>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeBarcodesOnSlip}
                    onChange={(e) => setIncludeBarcodesOnSlip(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Patron Card Barcode</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePolicyNotes}
                    onChange={(e) => setIncludePolicyNotes(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Borrowing Rules Notice</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeStampBox}
                    onChange={(e) => setIncludeStampBox(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Librarian Stamp Box</span>
                </label>
              </div>

              {/* Attending Librarian Name */}
              <div className="pt-2 border-t border-slate-100 text-xs">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Attending Desk Librarian / Terminal
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={librarianName}
                    onChange={(e) => setLibrarianName(e.target.value)}
                    placeholder="Staff Name..."
                    className="w-full sm:w-64 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                  <span className="self-center text-[11px] text-slate-400 font-mono">
                    Terminal: CIRC-PORT-3000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================================
              LIVE CHECKOUT SLIP / RECEIPT PREVIEW (Screen & Print)
              ========================================================== */}
          <div className="bg-slate-900/5 border border-slate-200 rounded-3xl p-4 sm:p-8">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Receipt Output Preview ({loansOnSlip.length} items on slip)
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs transition active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>

            {/* 80mm THERMAL RECEIPT PREVIEW */}
            {slipTemplate === 'thermal_80mm' && (
              <div className="max-w-[3.15in] mx-auto bg-white p-6 shadow-2xl rounded-2xl border border-slate-300 font-mono text-xs text-slate-950 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
                {/* Header */}
                <div className="text-center space-y-1 border-b-2 border-dashed border-slate-400 pb-4">
                  <div className="inline-block p-2 rounded-full border border-slate-800 mb-1">
                    <Building2 className="w-5 h-5 mx-auto text-slate-900" />
                  </div>
                  <h3 className="font-extrabold text-sm tracking-wider uppercase">
                    PREMIER INTERNATIONAL SCHOOL
                  </h3>
                  <p className="text-[10px] text-slate-600 uppercase">
                    Library & Information Resource Centre
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Abuja, FCT, Nigeria • Tel: +234 9 291 4052
                  </p>
                  <div className="pt-2 font-bold text-[11px] uppercase tracking-widest text-slate-900">
                    *** CHECKOUT RECEIPT ***
                  </div>
                </div>

                {/* Meta details */}
                <div className="py-3 border-b border-dashed border-slate-300 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">DATE:</span>
                    <span className="font-bold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">TERMINAL:</span>
                    <span>CIRC-DESK-01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">LIBRARIAN:</span>
                    <span>{librarianName}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-600">PATRON:</span>
                    <span className="font-bold uppercase">{activeSlipUser?.name || 'STUDENT'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">CARD ID:</span>
                    <span className="font-bold">{activeSlipUser?.libraryCardId || 'LIB-0000'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">STATUS:</span>
                    <span className="uppercase">{activeSlipUser?.role} • {activeSlipUser?.gradeOrYear || activeSlipUser?.department || 'Member'}</span>
                  </div>
                </div>

                {/* Items Borrowed */}
                <div className="py-3 border-b-2 border-dashed border-slate-400 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    BORROWED ITEMS ({loansOnSlip.length})
                  </div>

                  {loansOnSlip.map((loan, idx) => {
                    const matchedBook = books.find(b => b.id === loan.bookId);
                    const dewey = matchedBook?.deweyCode || matchedBook?.deweyClass || '800';
                    const cutter = matchedBook ? getCutterCode(matchedBook.author) : 'GEN';

                    return (
                      <div key={loan.id} className="text-[10px] space-y-0.5 border-b border-slate-100 pb-2">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {idx + 1}. {loan.bookTitle}
                        </div>
                        {matchedBook && (
                          <div className="text-[9px] text-slate-600 flex justify-between">
                            <span>Author: {matchedBook.author}</span>
                            <span className="font-bold">Call: {dewey} {cutter}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] pt-0.5 font-bold">
                          <span>BORROWED: {loan.borrowDate}</span>
                          <span className="text-black bg-slate-100 px-1 rounded">
                            DUE: {loan.dueDate}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {loansOnSlip.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">
                      No active items selected for this slip.
                    </p>
                  )}
                </div>

                {/* Rules & Policy */}
                {includePolicyNotes && (
                  <div className="py-3 border-b border-dashed border-slate-300 text-[9px] text-slate-600 space-y-1 leading-tight">
                    <p className="font-bold text-slate-900 uppercase">NOTICE & RETURN POLICY:</p>
                    <p>• Please return all books on or before the due date shown above.</p>
                    <p>• Overdue accounts may incur a ₦50/day fee and temporarily pause borrowing privileges.</p>
                    <p>• Report lost or damaged titles immediately to the library helpdesk.</p>
                  </div>
                )}

                {/* Stamp & Barcode Footer */}
                <div className="pt-4 text-center space-y-3">
                  {includeStampBox && (
                    <div className="border border-slate-300 border-dashed rounded p-2 text-[8px] text-slate-400">
                      OFFICIAL LIBRARY CIRCULATION STAMP
                    </div>
                  )}

                  {includeBarcodesOnSlip && activeSlipUser && (
                    <div className="flex flex-col items-center">
                      <BarcodeRenderer
                        value={activeSlipUser.libraryCardId}
                        height={24}
                        width={1.2}
                        displayValue={true}
                        fontSize={8}
                        margin={0}
                      />
                    </div>
                  )}

                  <p className="text-[9px] font-bold tracking-widest text-slate-700">
                    HAPPY READING!
                  </p>
                </div>
              </div>
            )}

            {/* 3" x 5" POCKET SLIP (TRADITIONAL CARD) */}
            {slipTemplate === 'pocket_slip' && (
              <div className="max-w-md mx-auto bg-white p-6 shadow-xl rounded-2xl border-2 border-slate-400 font-mono text-xs text-slate-900 print:shadow-none print:border-black print:max-w-full">
                <div className="text-center border-b-2 border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm uppercase">PREMIER INTERNATIONAL SCHOOL</h3>
                  <p className="text-[10px] text-slate-600 uppercase">LIBRARY MEDIA RESOURCE CENTRE</p>
                  <p className="text-xs font-bold tracking-widest uppercase mt-1">DATE DUE CARD</p>
                </div>

                <div className="py-2 text-[10px] border-b border-slate-300 space-y-1">
                  <p><strong>BORROWER:</strong> {activeSlipUser?.name} ({activeSlipUser?.libraryCardId})</p>
                  <p><strong>CLASS / DEPT:</strong> {activeSlipUser?.gradeOrYear || activeSlipUser?.department || 'Student'}</p>
                </div>

                {/* Table of Due Dates */}
                <table className="w-full text-left text-[10px] mt-2 border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-[9px] uppercase">
                      <th className="py-1">TITLE / CALL NO.</th>
                      <th className="py-1">BORROWED</th>
                      <th className="py-1">DUE DATE</th>
                      <th className="py-1 text-center">STAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loansOnSlip.map((loan) => (
                      <tr key={loan.id}>
                        <td className="py-1.5 font-bold truncate max-w-[140px]">{loan.bookTitle}</td>
                        <td className="py-1.5">{loan.borrowDate}</td>
                        <td className="py-1.5 font-black text-black">{loan.dueDate}</td>
                        <td className="py-1.5 text-center text-slate-400">[ &nbsp;&nbsp;&nbsp;&nbsp; ]</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 5 - loansOnSlip.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="text-slate-300">
                        <td className="py-2">____________________</td>
                        <td className="py-2">________</td>
                        <td className="py-2">________</td>
                        <td className="py-2 text-center">[ &nbsp;&nbsp;&nbsp;&nbsp; ]</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 pt-2 border-t border-slate-300 text-[8px] text-slate-500 text-center">
                  Books must be returned on or before the latest date stamped above.
                </div>
              </div>
            )}

            {/* 58mm COMPACT RECEIPT */}
            {slipTemplate === 'compact_58mm' && (
              <div className="max-w-[2.25in] mx-auto bg-white p-4 shadow-xl rounded-xl border border-slate-400 font-mono text-[9px] text-slate-950 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
                <div className="text-center border-b border-dashed border-slate-400 pb-2">
                  <p className="font-extrabold text-[10px]">PREMIER INT'L SCHOOL</p>
                  <p className="text-[8px] text-slate-600">LIBRARY LOAN RECEIPT</p>
                </div>
                <div className="py-1 text-[8px] space-y-0.5 border-b border-slate-200">
                  <p>USER: {activeSlipUser?.name}</p>
                  <p>CARD: {activeSlipUser?.libraryCardId}</p>
                  <p>DATE: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
                <div className="py-2 space-y-1.5 border-b border-dashed border-slate-400">
                  {loansOnSlip.map(l => (
                    <div key={l.id} className="leading-tight">
                      <p className="font-bold truncate">{l.bookTitle}</p>
                      <p className="font-bold text-[10px] text-black">DUE: {l.dueDate}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 text-center">
                  {includeBarcodesOnSlip && activeSlipUser && (
                    <BarcodeRenderer
                      value={activeSlipUser.libraryCardId}
                      height={18}
                      width={1}
                      displayValue={false}
                      margin={0}
                    />
                  )}
                  <p className="text-[7px] text-slate-500 mt-1">PLEASE RETURN ON TIME</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
