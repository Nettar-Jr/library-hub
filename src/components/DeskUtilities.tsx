/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LibraryUser } from '../types';
import { 
  User, 
  UserPlus, 
  Printer, 
  CheckSquare, 
  Square, 
  Plus, 
  Mail, 
  Smartphone, 
  GraduationCap, 
  BookOpen, 
  Laptop, 
  Search, 
  ScanLine, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DeskUtilities: React.FC = () => {
  const { 
    users, 
    createUser, 
    circulation, 
    checkoutBook, 
    returnBook, 
    books, 
    emailLogs, 
    triggerOverdueEmail, 
    sendLostEmail,
    markBookAsReplaced,
    flagBookAsLostOrMisplaced,
    renewLoan,
    updateBookUsageType
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'scanner' | 'emails'>('users');
  
  // Create User Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [gradeOrYear, setGradeOrYear] = useState('Year 9');
  const [department, setDepartment] = useState('English Department');
  const [userEmail, setUserEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Card Selection for Printing
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [printBadgeList, setPrintBadgeList] = useState<LibraryUser[]>([]);

  // Simulated Scanner State
  const [scannedUserId, setScannedUserId] = useState<string>('');
  const [scanAnimation, setScanAnimation] = useState(false);
  const [checkoutBookId, setCheckoutBookId] = useState('');
  const [checkoutDays, setCheckoutDays] = useState(14);
  const [scannerMessage, setScannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Physical/Hardware Scanner State
  const [physicalScanText, setPhysicalScanText] = useState('');
  const [scannedBookId, setScannedBookId] = useState<string>('');

  // Search filter for user table
  const [userSearch, setUserSearch] = useState('');

  // Handle physical barcode submit
  const handlePhysicalBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = physicalScanText.trim();
    if (!cleanInput) return;

    // 1. Try to match a Library User's Card ID
    const matchedUserByCard = users.find(u => u.libraryCardId.toLowerCase() === cleanInput.toLowerCase());
    if (matchedUserByCard) {
      setScanAnimation(true);
      setScannerMessage(null);
      setTimeout(() => {
        setScannedUserId(matchedUserByCard.id);
        // Automatically default checkout days: 7 for students, 14 for teachers
        setCheckoutDays(matchedUserByCard.role === 'student' ? 7 : 14);
        setScannerMessage({
          type: 'success',
          text: `Scan Success! Loaded account for ${matchedUserByCard.name} (${matchedUserByCard.role === 'student' ? 'Student: ' + matchedUserByCard.gradeOrYear : 'Teacher'}). Default loan duration set to ${matchedUserByCard.role === 'student' ? '7' : '14'} days.`
        });
        setScanAnimation(false);
      }, 300);
      setPhysicalScanText('');
      return;
    }

    // 2. Try to match a Book by barcode (ISBN, ID, deweyCode)
    const matchedBook = books.find(b => 
      b.isbn.toLowerCase() === cleanInput.toLowerCase() || 
      b.id.toLowerCase() === cleanInput.toLowerCase() ||
      b.isbn.replace(/-/g, '').toLowerCase() === cleanInput.replace(/-/g, '').toLowerCase()
    );

    if (matchedBook) {
      setScanAnimation(true);
      setScannerMessage(null);
      setTimeout(() => {
        setScannedBookId(matchedBook.id);
        
        // If a user profile is currently loaded
        if (scannedUserId) {
          const loadedUser = users.find(u => u.id === scannedUserId);
          if (loadedUser) {
            // Check if this user currently has an active borrowed record for this book to RENEW it!
            const activeLoan = circulation.find(r => 
              r.learnerName.includes(loadedUser.name) && 
              r.bookId === matchedBook.id && 
              r.status !== 'returned'
            );

            if (activeLoan) {
              // Renew!
              const days = loadedUser.role === 'student' ? 7 : 14;
              const res = renewLoan(activeLoan.id, days);
              if (res.success) {
                setScannerMessage({
                  type: 'success',
                  text: `Physical Scan Verified! Automatically RENEWED loan of "${matchedBook.title}" for ${loadedUser.name} for another ${days} days.`
                });
              } else {
                setScannerMessage({ type: 'error', text: res.message });
              }
            } else {
              // Otherwise, set it as the checkout book id!
              setCheckoutBookId(matchedBook.id);
              setScannerMessage({
                type: 'success',
                text: `Book Barcode Matched: "${matchedBook.title}". Ready to checkout to ${loadedUser.name}! Set loan period and click "Approve Borrow Request" below.`
              });
            }
          }
        } else {
          // No user profile loaded, load book for direct status changes
          setScannerMessage({
            type: 'success',
            text: `Book Barcode Matched: "${matchedBook.title}". Toggle status to Circulation or Reserve in the Book Inventory Status panel below.`
          });
        }
        setScanAnimation(false);
      }, 300);
      setPhysicalScanText('');
      return;
    }

    // 3. Fallback: Search user by name or book by title
    const matchedUserByName = users.find(u => u.name.toLowerCase().includes(cleanInput.toLowerCase()));
    if (matchedUserByName) {
      setScannedUserId(matchedUserByName.id);
      setCheckoutDays(matchedUserByName.role === 'student' ? 7 : 14);
      setScannerMessage({
        type: 'success',
        text: `Name Search Match: Loaded profile for ${matchedUserByName.name} (${matchedUserByName.role === 'student' ? 'Student' : 'Teacher'}).`
      });
      setPhysicalScanText('');
      return;
    }

    const matchedBookByTitle = books.find(b => b.title.toLowerCase().includes(cleanInput.toLowerCase()) || b.author.toLowerCase().includes(cleanInput.toLowerCase()));
    if (matchedBookByTitle) {
      setScannedBookId(matchedBookByTitle.id);
      if (scannedUserId) {
        setCheckoutBookId(matchedBookByTitle.id);
        setScannerMessage({
          type: 'success',
          text: `Title Search Match: Selected "${matchedBookByTitle.title}" for checkout.`
        });
      } else {
        setScannerMessage({
          type: 'success',
          text: `Title Search Match: Loaded "${matchedBookByTitle.title}".`
        });
      }
      setPhysicalScanText('');
      return;
    }

    // No match
    setScannerMessage({
      type: 'error',
      text: `No exact matches found for barcode input: "${cleanInput}". Scan a valid user card ID (e.g. LIB-xxxx) or book ISBN.`
    });
    setPhysicalScanText('');
  };

  // Handle user creation
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!userEmail.trim() || !userEmail.includes('@')) {
      setFormError('Please enter a valid school email address.');
      return;
    }

    const userData = {
      name: userName,
      role: userRole,
      email: userEmail,
      gradeOrYear: userRole === 'student' ? gradeOrYear : undefined,
      department: userRole === 'teacher' ? department : undefined,
    };

    const newUser = createUser(userData);
    
    // Clear & Toast
    setUserName('');
    setUserEmail('');
    setFormError('');
    setShowCreateModal(false);
    triggerToast(`Successfully created ${newUser.role} account for ${newUser.name}!`);
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast('');
    }, 4000);
  };

  // Toggle selection for bulk print
  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedUserIds(prev => [...prev, id]);
    }
  };

  const selectAllUsers = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handlePrintSelected = () => {
    const list = users.filter(u => selectedUserIds.includes(u.id));
    if (list.length === 0) {
      triggerToast('Please select at least one user to print.');
      return;
    }
    setPrintBadgeList(list);
  };

  const handlePrintIndividual = (user: LibraryUser) => {
    setPrintBadgeList([user]);
  };

  // Filtered users for table
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.libraryCardId.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Simulated scan triggers scanner profile loading
  const handleSimulateScan = (userId: string) => {
    setScanAnimation(true);
    setScannerMessage(null);
    setTimeout(() => {
      setScannedUserId(userId);
      setScanAnimation(false);
    }, 700);
  };

  // Retrieve scanned user profile
  const scannedUser = users.find(u => u.id === scannedUserId);
  const scannedUserFullName = scannedUser 
    ? `${scannedUser.name} (${scannedUser.role === 'student' ? scannedUser.gradeOrYear : 'Teacher'})` 
    : '';

  // Filter circulation records for scanned user
  const scannedUserCirculations = scannedUserFullName 
    ? circulation.filter(r => r.learnerName.includes(scannedUser.name))
    : [];

  // Approve checkout via scanner
  const handleScannerCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedUser || !checkoutBookId) return;

    const res = checkoutBook(checkoutBookId, scannedUserFullName, checkoutDays);
    if (res.success) {
      setScannerMessage({ type: 'success', text: res.message });
      setCheckoutBookId('');
    } else {
      setScannerMessage({ type: 'error', text: res.message });
    }
  };

  const handleScannerReturn = (recordId: string) => {
    returnBook(recordId);
    setScannerMessage({ type: 'success', text: 'Book returned successfully via Desk Scanner check-in!' });
  };

  // Format Barcode with SVG bars matching Card ID
  const renderBarcodeSVG = (cardId: string) => {
    // Generate deterministic width sequence from characters
    const bars: React.ReactNode[] = [];
    let xOffset = 10;
    for (let i = 0; i < cardId.length; i++) {
      const code = cardId.charCodeAt(i);
      const width1 = (code % 3) + 1.5;
      const width2 = ((code + 2) % 3) + 1;
      
      bars.push(<rect key={`b1-${i}`} x={xOffset} y="5" width={width1} height="35" fill="black" />);
      xOffset += width1 + 2;
      bars.push(<rect key={`b2-${i}`} x={xOffset} y="5" width={width2} height="35" fill="black" />);
      xOffset += width2 + 1.5;
    }
    return (
      <svg className="w-full h-11" viewBox={`0 0 ${xOffset + 10} 45`}>
        <rect x="0" y="0" width={xOffset + 10} height="45" fill="white" />
        {bars}
        <text x="50%" y="43" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#334155" fontWeight="bold">
          {cardId}
        </text>
      </svg>
    );
  };

  const handlePrintSystemDialog = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:bg-white print:p-0">
      
      {/* Printable Badges Area Overlay - Only visible when printing list exists */}
      <AnimatePresence>
        {printBadgeList.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 z-50 overflow-y-auto flex items-center justify-center p-4 print:absolute print:inset-0 print:bg-white print:p-0"
          >
            <div className="bg-slate-900 border border-slate-700/60 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 print:bg-white print:border-none print:shadow-none print:p-0">
              
              {/* Header inside Modal */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 print:hidden">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Printer className="w-5 h-5 animate-pulse" />
                  <h3 className="font-display font-extrabold text-lg text-slate-100">
                    Ready to Print: {printBadgeList.length} Library Card Badges
                  </h3>
                </div>
                <button 
                  onClick={() => setPrintBadgeList([])}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Close Preview
                </button>
              </div>

              {/* Badges Grid for system printing */}
              <div id="printable-badges-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/50 print:grid print:grid-cols-2 print:gap-4 print:p-0 print:bg-transparent print:border-none">
                {printBadgeList.map((user) => (
                  <div 
                    key={user.id} 
                    className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-500/30 rounded-2xl p-5 text-white flex flex-col justify-between h-56 shadow-lg overflow-hidden font-sans print:border-slate-400 print:text-black print:bg-white print:shadow-none"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    {/* Watermark Logo */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-indigo-400/5 rounded-full pointer-events-none print:hidden"></div>
                    
                    <div className="flex justify-between items-start border-b border-indigo-500/20 pb-2.5 print:border-slate-300">
                      <div>
                        <span className="text-[8px] uppercase tracking-widest font-bold text-indigo-300 font-mono print:text-slate-500">
                          Library Access Pass
                        </span>
                        <h4 className="font-display font-black text-xs text-white leading-none tracking-wide print:text-indigo-950">
                          PREMIER INTERNATIONAL
                        </h4>
                      </div>
                      <div className="p-1 bg-amber-400 text-slate-950 rounded-md print:bg-amber-100 print:text-amber-900">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="flex gap-3 my-3">
                      {/* Avatar Mock */}
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-indigo-400/20 flex items-center justify-center flex-shrink-0 text-indigo-300 print:bg-slate-100 print:border-slate-300 print:text-slate-600">
                        {user.role === 'student' ? (
                          <GraduationCap className="w-6 h-6 text-cyan-400 print:text-indigo-950" />
                        ) : (
                          <User className="w-6 h-6 text-emerald-400 print:text-emerald-800" />
                        )}
                      </div>

                      {/* Info Block */}
                      <div className="min-w-0 flex-1">
                        <h5 className="font-display font-extrabold text-sm text-slate-100 truncate line-clamp-1 print:text-slate-950">
                          {user.name}
                        </h5>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                            user.role === 'student' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 print:bg-slate-100 print:text-slate-900' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 print:bg-slate-100 print:text-slate-900'
                          }`}>
                            {user.role}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium print:text-slate-700">
                            {user.role === 'student' ? user.gradeOrYear : user.department}
                          </span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-mono mt-1 print:text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Barcode area */}
                    <div className="bg-white rounded p-1 border border-indigo-500/10">
                      {renderBarcodeSVG(user.libraryCardId)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons inside Modal */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-800 pt-5 print:hidden">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Pro-Tip: Set background graphics to ON in the print setup for the best badge visual!</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPrintBadgeList([])}
                    className="border border-slate-700 hover:bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePrintSystemDialog}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 hover:text-white font-sans font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer shadow-lg transition"
                  >
                    <Printer className="w-4 h-4" />
                    Launch System Print Panel
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div>
          <span className="text-xs font-bold text-cyan-600 tracking-widest uppercase font-mono">
            STAFF EXCLUSIVE SERVICES
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-slate-900">
            Desk Utilities & Card System
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Laptop className="w-3.5 h-3.5 text-cyan-500" />
          <span>PORT 3000 • ONLINE</span>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-px print:hidden">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-5 py-3 font-sans text-xs sm:text-sm font-bold tracking-wide border-b-2 cursor-pointer transition-all ${
            activeSubTab === 'users'
              ? 'border-cyan-500 text-cyan-700 bg-cyan-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          User Account Registry
        </button>
        <button
          onClick={() => setActiveSubTab('scanner')}
          className={`flex items-center gap-2 px-5 py-3 font-sans text-xs sm:text-sm font-bold tracking-wide border-b-2 cursor-pointer transition-all ${
            activeSubTab === 'scanner'
              ? 'border-cyan-500 text-cyan-700 bg-cyan-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          Desk Scanner Simulator
        </button>
        <button
          onClick={() => setActiveSubTab('emails')}
          className={`flex items-center gap-2 px-5 py-3 font-sans text-xs sm:text-sm font-bold tracking-wide border-b-2 cursor-pointer transition-all ${
            activeSubTab === 'emails'
              ? 'border-cyan-500 text-cyan-700 bg-cyan-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email Outbox Logs
        </button>
      </div>

      {/* SUBTAB CONTENT: USER ACCOUNTS */}
      {activeSubTab === 'users' && (
        <div className="space-y-6 print:hidden">
          
          {/* Quick info and search panel */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search by name, ID, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={handlePrintSelected}
                disabled={selectedUserIds.length === 0}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Badges ({selectedUserIds.length} Selected)
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register New User
              </button>
            </div>
          </div>

          {/* Success Alerts */}
          {successToast && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Table of user accounts */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-4 px-5 w-12 text-center">
                      <button onClick={selectAllUsers} className="text-slate-600 focus:outline-none">
                        {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-cyan-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-4 font-bold">Full Name</th>
                    <th className="py-4 px-4 font-bold">Role Status</th>
                    <th className="py-4 px-4 font-bold">Class / Department</th>
                    <th className="py-4 px-4 font-bold">Card Identifier</th>
                    <th className="py-4 px-4 font-bold">Email</th>
                    <th className="py-4 px-4 text-right pr-6 font-bold">Individual Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/60 transition-all">
                        <td className="py-3 px-5 text-center">
                          <button onClick={() => toggleSelectUser(user.id)} className="text-slate-600 focus:outline-none">
                            {isSelected ? (
                              <CheckSquare className="w-4.5 h-4.5 text-cyan-600" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-slate-300 hover:text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">{user.name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            user.role === 'student' ? 'bg-cyan-100 text-cyan-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {user.role === 'student' ? user.gradeOrYear : user.department}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded font-bold text-[10px]">
                            {user.libraryCardId}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">{user.email}</td>
                        <td className="py-3 px-4 text-right pr-6">
                          <button
                            onClick={() => handlePrintIndividual(user)}
                            className="flex items-center gap-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer ml-auto"
                          >
                            <Printer className="w-3 h-3" />
                            Badge Card
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-slate-400 py-12 italic">
                        No matches found for "{userSearch}". Register them as a new student or teacher!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal to register new Student or Teacher */}
          <AnimatePresence>
            {showCreateModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-6"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h4 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-cyan-600" />
                      Register New User Account
                    </h4>
                    <button 
                      onClick={() => setShowCreateModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    {formError && (
                      <p className="text-rose-600 text-xs font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        {formError}
                      </p>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Samuel Adekunle" 
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Role</label>
                        <select 
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value as 'student' | 'teacher')}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-cyan-500"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      </div>

                      {userRole === 'student' ? (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grade/Year</label>
                          <select 
                            value={gradeOrYear}
                            onChange={(e) => setGradeOrYear(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-cyan-500"
                          >
                            <option value="Primary 4">Primary 4</option>
                            <option value="Primary 5">Primary 5</option>
                            <option value="Primary 6">Primary 6</option>
                            <option value="Year 7">Year 7</option>
                            <option value="Year 8">Year 8</option>
                            <option value="Year 9">Year 9</option>
                            <option value="Year 10">Year 10</option>
                            <option value="Year 11">Year 11</option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
                          <select 
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-cyan-500"
                          >
                            <option value="English Department">English Department</option>
                            <option value="Science Department">Science Department</option>
                            <option value="Mathematics Department">Mathematics Department</option>
                            <option value="Arts & Humanities">Arts & Humanities</option>
                            <option value="Physical Education">Physical Education</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">School Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="samuel.a@school.edu" 
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowCreateModal(false)}
                        className="w-1/2 border border-slate-200 text-slate-600 font-bold p-2.5 rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="w-1/2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold p-2.5 rounded-xl text-xs cursor-pointer"
                      >
                        Save Account
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* SUBTAB CONTENT: SIMULATED & PHYSICAL SCANNER */}
      {activeSubTab === 'scanner' && (
        <div className="space-y-6">
          
          {/* Physical Barcode Scanner Entry Port */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border-2 border-cyan-500/30 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest">
                  PHYSICAL HARDWARE SCANNER PORT (ACTIVE)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono italic">
                Pull trigger on your barcode gun to automatically parse and load!
              </span>
            </div>

            <form onSubmit={handlePhysicalBarcodeSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <ScanLine className="absolute left-4 top-3.5 text-cyan-400 w-5 h-5 animate-pulse" />
                <input
                  id="physical-scanner-input"
                  type="text"
                  autoFocus
                  placeholder="Scan physical Library Card (LIB-xxxx) or Book Barcode (ISBN-xxxx)..."
                  value={physicalScanText}
                  onChange={(e) => setPhysicalScanText(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border-2 border-slate-800 rounded-2xl text-xs text-white font-mono placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 hover:text-white font-mono font-black text-xs px-8 py-3.5 rounded-2xl cursor-pointer shadow-lg transition-all"
              >
                PARSE BARCODE
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
            
            {/* Interactive Scanning visual panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-inner space-y-4 relative overflow-hidden">
                <span className="inline-block text-[9px] font-mono text-cyan-400 border border-cyan-800/60 rounded px-2 py-0.5">
                  DESK BARCODE FEED
                </span>

                {/* Simulated Camera Window */}
                <div className="relative h-44 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
                  
                  {/* Simulated Grid overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>

                  {/* Laser scan line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-bounce top-1/4"></div>

                  <AnimatePresence>
                    {scanAnimation ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center z-10 text-cyan-400 font-mono text-xs space-y-2"
                      >
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
                        <p className="animate-pulse">DECODING BARCODE INBOUNDS...</p>
                      </motion.div>
                    ) : scannedUser ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center z-10 text-emerald-400 font-mono text-xs space-y-2 p-3"
                      >
                        <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full inline-block">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{scannedUser.name}</p>
                          <p className="text-[10px] text-slate-400">{scannedUser.libraryCardId}</p>
                          <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold font-sans mt-0.5">
                            User Card Connected
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center text-slate-500 font-mono text-xs p-6 space-y-2 z-10">
                        <ScanLine className="w-8 h-8 text-slate-600 mx-auto" />
                        <p>Awaiting Scanner Scan...</p>
                        <p className="text-[9px] text-slate-600">Scan any card or click simulator sweep below</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Laser Sweep Triggers */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wide">
                    Simulate Card Sweeps:
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleSimulateScan(u.id)}
                        className={`flex flex-col items-start p-2 bg-slate-900 border hover:bg-slate-800 rounded-xl text-[10px] text-left transition-all font-mono cursor-pointer ${
                          scannedUserId === u.id ? 'border-cyan-500 text-cyan-300 bg-slate-800/80' : 'border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="font-bold text-slate-200 leading-tight truncate w-full">{u.name}</span>
                        <span className="text-[8px] text-slate-500 mt-0.5">{u.libraryCardId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Book Status Uploader Section */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-900">
                  <BookOpen className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <h4 className="font-display font-extrabold text-sm text-slate-900">
                    Book Status & Usage Uploader
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Scan a book barcode to pull it up here, then upload it directly to <span className="font-semibold text-emerald-600">Circulation</span> (borrowable) or <span className="font-semibold text-rose-600">Reserve</span> (for library-use only).
                </p>

                {(() => {
                  const matchedBook = books.find(b => b.id === scannedBookId);
                  if (matchedBook) {
                    return (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-800 truncate">{matchedBook.title}</h5>
                            <p className="text-[10px] text-slate-500 truncate">{matchedBook.author}</p>
                            <span className="inline-block font-mono text-[9px] text-slate-400 mt-0.5">ISBN: {matchedBook.isbn}</span>
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            matchedBook.usageType === 'reserve' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {matchedBook.usageType || 'circulation'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              updateBookUsageType(matchedBook.id, 'circulation');
                              setScannerMessage({
                                type: 'success',
                                text: `Successfully UPLOADED "${matchedBook.title}" to CIRCULATION status. It can now be loaned out.`
                              });
                            }}
                            className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase text-center transition cursor-pointer border ${
                              matchedBook.usageType !== 'reserve' 
                                ? 'bg-emerald-600 text-white border-emerald-700' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Circulation (Loan)
                          </button>
                          <button
                            onClick={() => {
                              updateBookUsageType(matchedBook.id, 'reserve');
                              setScannerMessage({
                                type: 'success',
                                text: `Successfully UPLOADED "${matchedBook.title}" to RESERVE status. Restricted to library reference only.`
                              });
                            }}
                            className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase text-center transition cursor-pointer border ${
                              matchedBook.usageType === 'reserve' 
                                ? 'bg-rose-600 text-white border-rose-700' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Reserve (Library)
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="p-4 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 italic">No book currently loaded. Scan any book barcode above to change its status.</p>
                      
                      {/* Book Simulation helper list */}
                      <div className="mt-3 space-y-1.5 text-left">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Simulate book scan:</span>
                        <div className="flex flex-wrap gap-1">
                          {books.slice(0, 3).map(b => (
                            <button
                              key={b.id}
                              onClick={() => {
                                setScannedBookId(b.id);
                                setScannerMessage({
                                  type: 'success',
                                  text: `Simulated scan for book: "${b.title}" (ISBN: ${b.isbn})`
                                });
                              }}
                              className="text-[9px] bg-slate-200 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 font-mono font-bold py-1 px-2 rounded transition cursor-pointer"
                            >
                              {b.title.split(' ')[0]} ({b.isbn})
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Active scanned profile controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 min-h-[400px]">
                {scannedUser ? (
                <div className="space-y-6">
                  
                  {/* Scanned Card Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Scanned Access Profile
                      </span>
                      <h3 className="font-display font-extrabold text-xl text-slate-900">
                        {scannedUser.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        Card ID: {scannedUser.libraryCardId} • Role: {scannedUser.role.toUpperCase()}
                      </p>
                    </div>

                    <button 
                      onClick={() => setScannedUserId('')}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold underline"
                    >
                      Clear Scan
                    </button>
                  </div>

                  {/* Dynamic Alert message */}
                  {scannerMessage && (
                    <div className={`p-4 rounded-2xl text-xs border flex items-start gap-2.5 ${
                      scannerMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      <Info className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                      <span>{scannerMessage.text}</span>
                    </div>
                  )}

                  {/* active borrowings */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                      Current Borrows Registered to This Badge
                    </h4>

                    <div className="space-y-2">
                      {scannedUserCirculations.map(record => {
                        const isOverdue = record.status === 'overdue';
                        const isLost = record.status === 'lost' || record.status === 'misplaced';
                        return (
                          <div 
                            key={record.id}
                            className={`p-3.5 border rounded-xl flex justify-between items-center text-xs shadow-3xs transition-all bg-white hover:border-slate-300 ${
                              isOverdue ? 'border-rose-200 bg-rose-50/20' : isLost ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100'
                            }`}
                          >
                            <div className="space-y-1">
                              <h5 className="font-bold text-slate-800 italic">{record.bookTitle}</h5>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Due: {record.dueDate}
                                </span>
                                <span>•</span>
                                <span className={`uppercase font-black text-[9px] ${
                                  record.status === 'returned' ? 'text-emerald-600' : isOverdue ? 'text-rose-600' : isLost ? 'text-red-600' : 'text-cyan-600'
                                }`}>
                                  {record.status}
                                </span>
                              </div>
                            </div>

                            {record.status !== 'returned' && (
                              <div className="flex items-center gap-2">
                                {isOverdue && (
                                  <button
                                    onClick={() => {
                                      triggerOverdueEmail(record.id);
                                      setScannerMessage({ type: 'success', text: `Dispatched automated overdue notice to ${scannedUser.email}!` });
                                    }}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-rose-200/50"
                                    title="Send simulated warning email"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    Mail Alert
                                  </button>
                                )}

                                {isLost && (
                                  <button
                                    onClick={() => {
                                      markBookAsReplaced(record.id);
                                      setScannerMessage({ type: 'success', text: `Marked "${record.bookTitle}" as physically replaced. Restored 1 copy to catalog!` });
                                    }}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-emerald-200/50"
                                  >
                                    Mark Replaced
                                  </button>
                                )}

                                {!isLost && (
                                  <button
                                    onClick={() => {
                                      flagBookAsLostOrMisplaced(record.id, 'lost');
                                      sendLostEmail(record.id);
                                      setScannerMessage({ type: 'error', text: `Book has been flagged as LOST. Dispatched missing warning email to ${scannedUser.email}!` });
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer border border-slate-200"
                                    title="Flag as lost & warn student"
                                  >
                                    Flag Lost
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    const days = scannedUser.role === 'student' ? 7 : 14;
                                    const res = renewLoan(record.id, days);
                                    if (res.success) {
                                      setScannerMessage({ type: 'success', text: `${res.message} (Physical presence verified by librarian).` });
                                    } else {
                                      setScannerMessage({ type: 'error', text: res.message });
                                    }
                                  }}
                                  className="p-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-cyan-200/50"
                                  title="Renew loan (Requires book to be physically present at desk)"
                                >
                                  Renew ({scannedUser.role === 'student' ? '7' : '14'}d)
                                </button>

                                <button
                                  onClick={() => handleScannerReturn(record.id)}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  Return & Approve
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {scannedUserCirculations.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50 rounded-xl border border-slate-100">
                          No active loan records currently mapped to this library card.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick checkout form */}
                  <form onSubmit={handleScannerCheckout} className="border-t border-slate-100 pt-5 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Approve Direct Catalog borrowing
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold font-mono">Select book</label>
                        <select
                          value={checkoutBookId}
                          onChange={(e) => setCheckoutBookId(e.target.value)}
                          required
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-cyan-500 font-medium"
                        >
                          <option value="">-- Choose a Catalog Book --</option>
                          {books.map(b => (
                            <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                              {b.title} ({b.availableCopies} left) {b.availableCopies <= 0 ? '[OUT OF STOCK]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold font-mono">Loan Period (days)</label>
                        <select
                          value={checkoutDays}
                          onChange={(e) => setCheckoutDays(Number(e.target.value))}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-cyan-500 font-medium"
                        >
                          <option value={7}>7 Days</option>
                          <option value={14}>14 Days (Default)</option>
                          <option value={21}>21 Days</option>
                          <option value={30}>30 Days</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!checkoutBookId}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-sans font-bold py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      Approve Borrow Request
                    </button>
                  </form>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-16">
                  <ScanLine className="w-12 h-12 text-slate-300 animate-pulse" />
                  <div>
                    <h5 className="font-display font-extrabold text-slate-800 text-sm">
                      Awaiting Laser Scan Feed
                    </h5>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                      Click any registered user barcode sweep simulator in the left panel. The computer will parse the card, load historical borrows, overdue flags, and provide direct action gates!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      )}

      {/* SUBTAB CONTENT: EMAIL AUTOMATION LOGS */}
      {activeSubTab === 'emails' && (
        <div className="space-y-6 print:hidden">
          
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-cyan-600">
              <Mail className="w-5 h-5" />
              <h3 className="font-display font-extrabold text-base text-slate-900">
                Automated Library Outbox Log
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Whenever a book is overdue or flagged as misplaced, our integrated mailing engine dispatches notice automation alerts. Review all generated and sent school warning notices here.
            </p>
          </div>

          <div className="space-y-4">
            {emailLogs.map((log) => {
              const isLost = log.type === 'lost';
              return (
                <div 
                  key={log.id} 
                  className={`bg-white border rounded-3xl p-5 shadow-3xs space-y-3 transition-all hover:border-slate-300 ${
                    isLost ? 'border-amber-200/60 bg-amber-50/5' : 'border-rose-200/60 bg-rose-50/5'
                  }`}
                >
                  <div className="flex justify-between items-start flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isLost ? 'bg-amber-100 text-amber-950' : 'bg-rose-100 text-rose-950'}`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">To: {log.recipient}</span>
                        <span className="font-mono text-[10px] text-slate-400 block">{log.recipientEmail}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-400">
                      <span>Sent Date: {log.date}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <h5 className="font-bold text-xs text-slate-900 font-sans tracking-tight mb-2 flex items-center gap-1.5">
                      {isLost ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-rose-500" />
                      )}
                      {log.subject}
                    </h5>
                    <pre className="text-[11px] text-slate-600 font-mono bg-slate-50 p-4 rounded-xl border border-slate-100/80 leading-relaxed whitespace-pre-wrap">
                      {log.body}
                    </pre>
                  </div>
                </div>
              );
            })}

            {emailLogs.length === 0 && (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl text-slate-400 italic space-y-2">
                <Mail className="w-10 h-10 text-slate-300 mx-auto" />
                <p>No automated alerts sent yet in this session.</p>
                <p className="text-[10px] text-slate-500 not-italic">
                  Try triggering overdue alerts or missing warnings via the scanner panel or the reports tab!
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
