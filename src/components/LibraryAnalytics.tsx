/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Image as ImageIcon, 
  Printer, 
  Eye, 
  FileDown, 
  X,
  BookOpen,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReportData, downloadPdfReport } from '../utils/reportPdfGenerator';
import { downloadPictorialReportPng, getPictorialReportDataUrl } from '../utils/pictorialReportGenerator';

interface DDCClassInfo {
  id: string;
  name: string;
  range: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DDC_CLASSES: DDCClassInfo[] = [
  { id: '000', name: 'Computer Science & Technology', range: '000 - 099', description: 'Systems, algorithms, data structures, and computer architectures.', color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-100' },
  { id: '100', name: 'Philosophy & Ethics', range: '100 - 199', description: 'Metaphysics, classical philosophy, Socratic ethics, and human psychology.', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-100' },
  { id: '200', name: 'Religion & Mythology', range: '200 - 299', description: 'Comparative religions, ancient mythologies, and spiritual histories.', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-100' },
  { id: '300', name: 'Social Sciences & Society', range: '300 - 399', description: 'Sociology, economics, political systems, government policy, and folktales.', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100' },
  { id: '400', name: 'Language & Linguistics', range: '400 - 499', description: 'English grammar rules, linguistics research, and foreign languages.', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-100' },
  { id: '500', name: 'Pure Science & Nature', range: '500 - 599', description: 'Astrophysics, advanced mathematics, physics formulas, chemistry, and biology.', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' },
  { id: '600', name: 'Technology & Applied Science', range: '600 - 699', description: 'Applied engineering, computer networks, architecture, and tech innovations.', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-100' },
  { id: '700', name: 'Arts & Recreation', range: '700 - 799', description: 'Art history, painting guides, architectural aesthetics, and sports history.', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-100' },
  { id: '800', name: 'Literature & Fiction', range: '800 - 899', description: 'Original stories, African poetry, literary classics, and modern novels.', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' },
  { id: '900', name: 'History & Culture', range: '900 - 999', description: 'World history, West African empires, geography maps, and explorer biographies.', color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100' }
];

export const LibraryAnalytics: React.FC = () => {
  const { 
    books, 
    allBooks, 
    circulation, 
    allCirculation, 
    activeSection, 
    setActiveSection,
  } = useApp();
  
  // Section scoping state:
  // 'all' = Consolidated school view, 'college' = Secondary College, 'primary' = Primary School
  const [adminSection, setAdminSection] = useState<'all' | 'primary' | 'college'>(
    activeSection === 'primary' ? 'primary' : activeSection === 'college' ? 'college' : 'all'
  );

  // Grouping mode: by real catalog category or by active Dewey Decimal range
  const [groupingMode, setGroupingMode] = useState<'category' | 'dewey'>('category');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Modal for Pictorial Report Preview
  const [previewReportData, setPreviewReportData] = useState<ReportData | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState<'fit' | 'medium' | 'large'>('fit');

  // Sync with global activeSection if it changes
  React.useEffect(() => {
    if (activeSection === 'college' || activeSection === 'primary' || activeSection === 'all') {
      setAdminSection(activeSection);
    }
  }, [activeSection]);

  const handleSectionSwitch = (sec: 'all' | 'primary' | 'college') => {
    setAdminSection(sec);
    if (sec === 'college' || sec === 'primary' || sec === 'all') {
      setActiveSection(sec);
    }
  };

  // Filter books based on active Section (strictly from real database)
  const adminBooks = useMemo(() => {
    const source = allBooks && allBooks.length > 0 ? allBooks : books;
    if (adminSection === 'all') return source;
    return source.filter(b => (b.section || 'college') === adminSection);
  }, [allBooks, books, adminSection]);

  // Filter circulation records strictly from database
  const effectiveCirculation = useMemo(() => {
    const source = allCirculation && allCirculation.length > 0 ? allCirculation : circulation;
    if (adminSection === 'all') return source;
    return source.filter(c => (c.section || 'college') === adminSection);
  }, [allCirculation, circulation, adminSection]);

  const allSourceBooks = useMemo(() => {
    return allBooks && allBooks.length > 0 ? allBooks : books;
  }, [allBooks, books]);

  // Real Database Numbers: Loan counts strictly derived from circulation records
  const activeLoansCount = effectiveCirculation.filter(c => c.status === 'borrowed').length;
  const returnedLoansCount = effectiveCirculation.filter(c => c.status === 'returned').length;
  const totalCirculationEvents = effectiveCirculation.length;

  const totalTitles = adminBooks.length;
  const totalHoldings = adminBooks.reduce((acc, curr) => acc + curr.totalCopies, 0);
  const totalBorrowed = activeLoansCount;
  const totalAvailable = Math.max(0, totalHoldings - totalBorrowed);
  const totalBorrowingsAcrossHistory = totalCirculationEvents;
  const averageReadsRate = totalTitles > 0 ? (totalBorrowingsAcrossHistory / totalTitles).toFixed(1) : '0.0';
  const stockUtilizationRate = totalHoldings > 0 && totalBorrowed > 0 ? Math.round((totalBorrowed / totalHoldings) * 100) : 0;
  
  const overdueRecords = useMemo(() => {
    const now = Date.now();
    return effectiveCirculation.filter(c => {
      if (c.status === 'overdue') return true;
      if (c.status === 'borrowed' && c.dueDate) {
        return new Date(c.dueDate).getTime() < now;
      }
      return false;
    });
  }, [effectiveCirculation]);

  const overdueLoansCount = overdueRecords.length;
  
  const returnComplianceRate = totalCirculationEvents > 0 
    ? Math.round((returnedLoansCount / totalCirculationEvents) * 100)
    : 0;

  // ---------------------------------------------------------------------------
  // ACTUAL DATABASE BOOK CATEGORIES - 100% DERIVED FROM REAL DATABASE RECORDS
  // ---------------------------------------------------------------------------
  const databaseCategories = useMemo(() => {
    const map = new Map<string, {
      category: string;
      titlesCount: number;
      totalStock: number;
      availableStock: number;
      borrowedStock: number;
      totalReads: number;
      deweyCode: string;
      bookTitles: string[];
    }>();

    adminBooks.forEach((b) => {
      const cat = b.category || 'General Fiction';
      const existing = map.get(cat) || {
        category: cat,
        titlesCount: 0,
        totalStock: 0,
        availableStock: 0,
        borrowedStock: 0,
        totalReads: 0,
        deweyCode: b.deweyCode || `DDC ${b.deweyClass}` || 'General',
        bookTitles: []
      };

      const bookLoansCount = effectiveCirculation.filter(c => c.bookId === b.id).length;
      const activeBookLoans = effectiveCirculation.filter(c => c.bookId === b.id && c.status === 'borrowed').length;
      const actualAvail = Math.max(0, b.totalCopies - activeBookLoans);

      existing.titlesCount += 1;
      existing.totalStock += b.totalCopies;
      existing.availableStock += actualAvail;
      existing.borrowedStock += activeBookLoans;
      existing.totalReads += bookLoansCount;
      if (!existing.bookTitles.includes(b.title)) {
        existing.bookTitles.push(b.title);
      }
      map.set(cat, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalReads - a.totalReads || b.totalStock - a.totalStock);
  }, [adminBooks, effectiveCirculation]);

  // Actual Dewey Decimal groups present in database (excludes empty 0-book classes)
  const actualDdcClasses = useMemo(() => {
    return DDC_CLASSES
      .map((ddc) => {
        const classBooks = adminBooks.filter((b) => b.deweyClass === ddc.id);
        const uniqueTitles = classBooks.length;
        const totalStock = classBooks.reduce((acc, curr) => acc + curr.totalCopies, 0);
        const classActiveLoans = classBooks.reduce((acc, curr) => acc + effectiveCirculation.filter(c => c.bookId === curr.id && c.status === 'borrowed').length, 0);
        const availStock = Math.max(0, totalStock - classActiveLoans);
        const borrowedStock = classActiveLoans;
        const totalReads = classBooks.reduce((acc, curr) => acc + effectiveCirculation.filter(c => c.bookId === curr.id).length, 0);
        const bookTitles = classBooks.map(b => b.title);

        return {
          ...ddc,
          uniqueTitles,
          totalStock,
          availStock,
          borrowedStock,
          totalReads,
          bookTitles
        };
      })
      .filter(item => item.uniqueTitles > 0)
      .sort((a, b) => b.totalReads - a.totalReads || b.totalStock - a.totalStock);
  }, [adminBooks, effectiveCirculation]);

  // Peak Category from database records
  const mostPopularCategory = useMemo(() => {
    return databaseCategories.length > 0 && databaseCategories[0].totalReads > 0 
      ? databaseCategories[0] 
      : null;
  }, [databaseCategories]);

  const avgCategoryReads = databaseCategories.length > 0 && totalBorrowingsAcrossHistory > 0 
    ? totalBorrowingsAcrossHistory / databaseCategories.length 
    : 0;

  const lowStockBooks = useMemo(() => {
    return adminBooks.filter((b) => {
      const activeBookLoans = effectiveCirculation.filter(c => c.bookId === b.id && c.status === 'borrowed').length;
      const actualAvail = Math.max(0, b.totalCopies - activeBookLoans);
      return b.totalCopies > 0 && actualAvail === 0;
    });
  }, [adminBooks, effectiveCirculation]);

  const replacementCopiesNeeded = useMemo(() => {
    return lowStockBooks.reduce((acc, b) => {
      const activeBookLoans = effectiveCirculation.filter(c => c.bookId === b.id && c.status === 'borrowed').length;
      return acc + activeBookLoans;
    }, 0);
  }, [lowStockBooks, effectiveCirculation]);

  const collegeTitlesCount = useMemo(() => {
    return allSourceBooks.filter(b => (b.section || 'college') === 'college').length;
  }, [allSourceBooks]);

  const primaryTitlesCount = useMemo(() => {
    return allSourceBooks.filter(b => b.section === 'primary').length;
  }, [allSourceBooks]);

  const triggerNotification = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  // Certified Pictorial Report Data Structure for PDF & PNG Exports (100% Real Database Records)
  const activeReportData: ReportData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const hasCirculation = totalCirculationEvents > 0;

    return {
      reportId: `PIS-PICTORIAL-${adminSection.toUpperCase()}-2026`,
      title: 'Library Strategic Analytics & Pictorial Decision Board',
      subtitle: `Visual utilization, catalog categories circulation velocity, and inventory decisions (${adminSection === 'all' ? 'All Campuses' : adminSection === 'college' ? 'Secondary College' : 'Primary School'})`,
      campusSection: adminSection,
      generatedBy: adminSection === 'primary' ? 'Adeleke Veronica (Primary Librarian)' : 'Alabi Abdulmumuni (College Librarian)',
      generatedDate: today,
      executiveSummary: hasCirculation
        ? `This certified pictorial audit records ${totalTitles} catalog titles with ${totalHoldings} total physical copies across ${databaseCategories.length} active database categories. Stock utilization is at ${stockUtilizationRate}% (${totalBorrowed} borrowed) with ${totalCirculationEvents} total checkouts recorded in database.`
        : `This certified pictorial audit records ${totalTitles} catalog titles with ${totalHoldings} total physical copies across ${databaseCategories.length} database categories. All ${totalHoldings} copies are on shelves with 0 active loans recorded. Ready for student circulation registration.`,
      kpis: hasCirculation ? [
        { label: 'Stock Utilization', value: `${stockUtilizationRate}%`, sublabel: `${totalBorrowed} / ${totalHoldings} lent` },
        { label: 'Return Compliance', value: `${returnComplianceRate}%`, sublabel: `${overdueLoansCount} overdue items` },
        { label: 'Catalog Titles', value: totalTitles, sublabel: 'Registered in database' },
        { label: 'Circulation Velocity', value: `${averageReadsRate}x`, sublabel: 'Avg reads per title' },
      ] : [
        { label: 'Total Titles', value: totalTitles, sublabel: 'Registered in database' },
        { label: 'Total Holdings', value: totalHoldings, sublabel: 'Physical copies on shelf' },
        { label: 'Active Loans', value: '0', sublabel: 'No active loans' },
        { label: 'Circulation Velocity', value: '0.0x', sublabel: 'Awaiting student checkouts' },
      ],
      subjectBreakdown: databaseCategories.map(cat => ({
        code: cat.deweyCode.startsWith('DDC') ? cat.deweyCode : `DDC ${cat.deweyCode}`,
        name: cat.category,
        titles: cat.titlesCount,
        stock: cat.totalStock,
        reads: cat.totalReads,
        status: cat.availableStock === 0 && cat.totalStock > 0 
          ? 'Critical Stock' as const
          : cat.totalReads <= Math.floor(avgCategoryReads / 2) 
            ? 'Underutilized' as const
            : 'Optimal' as const
      })),
      criticalItems: lowStockBooks.slice(0, 6).map(b => ({
        title: b.title,
        author: b.author,
        code: b.deweyCode || `DDC ${b.deweyClass}`,
        available: Math.max(0, b.totalCopies - effectiveCirculation.filter(c => c.bookId === b.id && c.status === 'borrowed').length),
        total: b.totalCopies,
        priority: 'Immediate Restock'
      })),
      decisions: [
        {
          decisionNumber: 1,
          actionTitle: totalCirculationEvents > 0 
            ? `Review Circulation for ${totalCirculationEvents} Registered Loans`
            : 'Initialize Learner Registration & Circulation Desk Issuance',
          targetDepartment: 'Library Operational Services',
          rationale: totalCirculationEvents > 0
            ? `Track lending patterns across ${databaseCategories.length} categories to ensure balanced circulation.`
            : `All ${totalHoldings} holdings are on library shelves. Onboard students to issue library cards and begin tracking lending velocity.`,
          urgency: 'Immediate'
        },
        {
          decisionNumber: 2,
          actionTitle: mostPopularCategory 
            ? `Expand Collection in "${mostPopularCategory.category}" (${mostPopularCategory.totalReads} Reads Recorded)`
            : `Curate Balanced Collection Development Across ${databaseCategories.length} Categories`,
          targetDepartment: 'Academic Department Heads',
          rationale: mostPopularCategory
            ? `Student inquiry is highest in ${mostPopularCategory.category} (${mostPopularCategory.totalStock} copies registered).`
            : `Maintain balanced acquisitions across all disciplines for ${adminSection === 'all' ? 'Primary and Secondary' : adminSection} curriculum.`,
          urgency: 'Upcoming Term'
        },
        {
          decisionNumber: 3,
          actionTitle: overdueLoansCount > 0
            ? `Direct Recovery for ${overdueLoansCount} Overdue Books`
            : 'Establish Proactive Return Due-Date Policies',
          targetDepartment: 'Circulation Desk Staff',
          rationale: overdueLoansCount > 0
            ? `Issue notifications to patrons with overdue loans to sustain return compliance.`
            : 'Enforce standard 14-day borrowing windows with automated overdue notifications.',
          urgency: 'Policy Review'
        }
      ]
    };
  }, [
    adminSection,
    totalTitles,
    totalHoldings,
    totalBorrowed,
    totalCirculationEvents,
    stockUtilizationRate,
    returnComplianceRate,
    lowStockBooks,
    overdueLoansCount,
    averageReadsRate,
    databaseCategories,
    avgCategoryReads,
    mostPopularCategory,
    effectiveCirculation
  ]);

  const handleDownloadPdf = () => {
    try {
      const chartUri = getPictorialReportDataUrl(activeReportData);
      downloadPdfReport(activeReportData, chartUri);
      triggerNotification('success', `PDF Decision Report downloaded successfully!`);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadPictorial = () => {
    try {
      downloadPictorialReportPng(activeReportData);
      triggerNotification('success', `Pictorial Infographic downloaded as high-res PNG!`);
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Failed to generate image. Please try again.');
    }
  };

  const handleOpenPreview = () => {
    try {
      const uri = getPictorialReportDataUrl(activeReportData);
      setPreviewImageUri(uri);
      setPreviewReportData(activeReportData);
    } catch (err) {
      console.error(err);
    }
  };

  // Active items for the visualizer (either database categories or real DDC classes)
  const visualizerItems = groupingMode === 'category' ? databaseCategories : actualDdcClasses;
  const maxCategoryReads = Math.max(...visualizerItems.map(s => s.totalReads), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. MINIMALIST PAGE HEADER & CAMPUS SELECTOR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Pictorial Infographics Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time visual metrics, stock health indicators, and Dewey Decimal circulation velocity based on actual database records.
          </p>
        </div>

        {/* Minimalist Campus Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => handleSectionSwitch('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminSection === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All School ({allSourceBooks.length})
          </button>
          <button
            type="button"
            onClick={() => handleSectionSwitch('college')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminSection === 'college'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Secondary ({collegeTitlesCount})
          </button>
          <button
            type="button"
            onClick={() => handleSectionSwitch('primary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminSection === 'primary'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Primary ({primaryTitlesCount})
          </button>
        </div>
      </div>

      {/* Toast notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <p>{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">✕</button>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <p>{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 text-xs">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. MINIMALIST ACTION TOOLBAR */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-end gap-2 bg-transparent border-0 shadow-none">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPreview}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            Preview
          </button>

          <button
            type="button"
            onClick={handleDownloadPictorial}
            className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-3xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-200" />
            Download Pictorial (PNG)
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-400" />
            Download PDF
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Print View"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTUAL DATABASE COLLECTIONS CIRCULATION VISUALIZER (PICTORIAL BOARD) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        
        {/* Visualizer Header with Real DB Context & Grouping Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h2 className="font-display font-black text-lg text-slate-900">
                Catalog Collections & Subject Circulation Visualizer
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Live circulation velocity, physical stock holdings, and reads distribution strictly based on actual records in the database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Real Catalog Categories vs. Active Dewey Classes */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setGroupingMode('category')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  groupingMode === 'category' 
                    ? 'bg-white text-slate-900 shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                By Category ({databaseCategories.length})
              </button>
              <button
                type="button"
                onClick={() => setGroupingMode('dewey')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  groupingMode === 'dewey' 
                    ? 'bg-white text-slate-900 shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                By Dewey ({actualDdcClasses.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span>
                <span className="text-slate-600">Circulation Recorded</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span>
                <span className="text-slate-400">0 Loans</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Database Categories / Dewey Classes List */}
        {visualizerItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs font-medium">No book catalog records found in database for the selected campus filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupingMode === 'category' ? (
              // 1. Grouped by Actual Database Categories
              databaseCategories.map((item) => {
                const percent = maxCategoryReads > 0 && item.totalReads > 0 
                  ? Math.max(8, Math.round((item.totalReads / maxCategoryReads) * 100)) 
                  : 0;

                return (
                  <div key={item.category} className="space-y-1.5 bg-slate-50/60 p-3 rounded-2xl border border-slate-100/80 hover:bg-slate-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.deweyCode.startsWith('DDC') ? item.deweyCode : `DDC ${item.deweyCode}`}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{item.category}</span>
                        
                        {/* Sample book titles from database */}
                        <span className="text-[11px] text-slate-400 italic hidden md:inline truncate max-w-xs">
                          ({item.bookTitles.slice(0, 2).join(', ')}{item.bookTitles.length > 2 ? '...' : ''})
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                        <span>{item.titlesCount} title{item.titlesCount === 1 ? '' : 's'} ({item.availableStock} / {item.totalStock} copies)</span>
                        <strong className={item.totalReads > 0 ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
                          {item.totalReads > 0 ? `${item.totalReads} reads` : '0 reads'}
                        </strong>
                      </div>
                    </div>

                    {/* Accurate Progress Bar Strictly Derived From Database Reads */}
                    <div className="w-full bg-slate-200/70 h-3.5 rounded-full overflow-hidden flex items-center p-0.5">
                      {item.totalReads > 0 ? (
                        <div 
                          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[9px] font-bold text-white font-mono bg-gradient-to-r from-indigo-500 to-indigo-700"
                          style={{ width: `${percent}%` }}
                        >
                          {item.totalReads}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center px-2">
                          <span className="text-[9px] text-slate-400 font-mono">0 checkouts in database</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              // 2. Grouped by Active Dewey Decimal Classes present in database
              actualDdcClasses.map((item) => {
                const maxReads = Math.max(...actualDdcClasses.map(s => s.totalReads), 0);
                const percent = maxReads > 0 && item.totalReads > 0 
                  ? Math.max(8, Math.round((item.totalReads / maxReads) * 100)) 
                  : 0;

                return (
                  <div key={item.id} className="space-y-1.5 bg-slate-50/60 p-3 rounded-2xl border border-slate-100/80 hover:bg-slate-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${item.bgColor} ${item.color} border ${item.borderColor}`}>
                          Class {item.range}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                        
                        {/* Sample book titles from database */}
                        <span className="text-[11px] text-slate-400 italic hidden md:inline truncate max-w-xs">
                          ({item.bookTitles.slice(0, 2).join(', ')}{item.bookTitles.length > 2 ? '...' : ''})
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                        <span>{item.uniqueTitles} title{item.uniqueTitles === 1 ? '' : 's'} ({item.availStock} / {item.totalStock} copies)</span>
                        <strong className={item.totalReads > 0 ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
                          {item.totalReads > 0 ? `${item.totalReads} reads` : '0 reads'}
                        </strong>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200/70 h-3.5 rounded-full overflow-hidden flex items-center p-0.5">
                      {item.totalReads > 0 ? (
                        <div 
                          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[9px] font-bold text-white font-mono bg-gradient-to-r from-indigo-500 to-indigo-700"
                          style={{ width: `${percent}%` }}
                        >
                          {item.totalReads}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center px-2">
                          <span className="text-[9px] text-slate-400 font-mono">0 checkouts in database</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4. PICTORIAL INFOGRAPHIC PREVIEW MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewReportData && previewImageUri && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 transition-all duration-200 ${
                previewScale === 'fit' ? 'max-w-xl' : previewScale === 'medium' ? 'max-w-2xl' : 'max-w-3xl'
              }`}
            >
              {/* Modal Header */}
              <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      {previewReportData.reportId}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      • 4:5 Portrait
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-white truncate max-w-sm sm:max-w-md">
                    {previewReportData.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Scale / Dimension Toggle */}
                  <div className="bg-slate-800 p-0.5 rounded-lg flex items-center text-[11px] font-semibold text-slate-300">
                    <button
                      type="button"
                      onClick={() => setPreviewScale('fit')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        previewScale === 'fit' ? 'bg-indigo-600 text-white shadow-2xs' : 'hover:text-white'
                      }`}
                      title="Fit to screen without vertical scrolling"
                    >
                      Fit Screen
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewScale('medium')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        previewScale === 'medium' ? 'bg-indigo-600 text-white shadow-2xs' : 'hover:text-white'
                      }`}
                      title="Balanced reading size"
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewScale('large')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        previewScale === 'large' ? 'bg-indigo-600 text-white shadow-2xs' : 'hover:text-white'
                      }`}
                      title="High resolution view"
                    >
                      Expanded
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPictorial}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Download PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Download PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-950" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewReportData(null);
                      setPreviewImageUri(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Un-stretched, crisp document presentation */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/90 flex flex-col items-center justify-start min-h-[300px]">
                <div className="w-full flex items-center justify-center my-auto">
                  <img 
                    src={previewImageUri} 
                    alt={previewReportData.title}
                    className={`rounded-xl shadow-xl border border-slate-300 object-contain w-auto block select-none transition-all duration-200 ${
                      previewScale === 'fit' 
                        ? 'max-h-[58vh] max-w-[440px]' 
                        : previewScale === 'medium' 
                          ? 'max-h-[66vh] max-w-[540px]' 
                          : 'max-h-[76vh] max-w-[640px]'
                    }`}
                    style={{ 
                      aspectRatio: '1200 / 1500',
                      height: 'auto'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="truncate pr-2">
                  Proportion: 4:5 Portrait (1200 × 1500) • Fixed Aspect Ratio
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewReportData(null);
                    setPreviewImageUri(null);
                  }}
                  className="px-3.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold font-sans cursor-pointer text-xs shrink-0"
                >
                  Close Preview
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
