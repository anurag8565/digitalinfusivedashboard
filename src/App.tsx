import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, LayoutDashboard, Briefcase, FileText,
  Search, Bell, CheckCircle, XCircle, Clock, Calendar,
  MessageCircle, DollarSign, Activity, Target, LogOut,
  MapPin, Globe, AlertCircle, FileSpreadsheet,
  Plus, Eye, Upload, Loader2, Trash2
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser as deleteFirebaseUser,
} from 'firebase/auth';
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, getDoc, getDocs, query, orderBy,
} from 'firebase/firestore';
import { auth, db, secondaryAuth } from './firebase';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const ROLES = {
  ADMIN:     'Super Admin',
  LEAD_TL:   'Lead TL',
  PRE_SALES: 'Pre-Sales',
  BDM:       'BDM',
};

const LEAD_SOURCES = [
  'LinkedIn Outreach', 'Email Marketing', 'Cold Email', 'Facebook Campaign',
  'Google Ads', 'Referral', 'WhatsApp Campaign', 'Instagram Outreach',
  'Upwork', 'Fiverr', 'Clutch', 'Manual Research', 'Cold Calling',
  'Website Inquiry', 'TradeIndia', 'IndiaMart', 'Other',
];

const SERVICES = ['Website Development', 'SEO', 'Social Media', 'Ads Management'];

const SALES_STAGES = [
  'Assigned', 'Contacted', 'Follow-Up', 'Meeting Scheduled', 'Meeting Done',
  'Requirement Gathering', 'Proposal Shared', 'Negotiation', 'Decision Pending',
  'Won', 'Lost', 'Not Interested',
];

/** Seed users — auto-registered in Firebase Auth on first login attempt */
const INITIAL_USERS = [
  { name: 'Super Admin', email: 'admin@digitalinfusive.com',  password: 'admin123', role: ROLES.ADMIN },
  { name: 'Lead TL',     email: 'tl@digitalinfusive.com',     password: 'tl123',    role: ROLES.LEAD_TL },
  { name: 'Pre-Sales',   email: 'sales@digitalinfusive.com',  password: 'sales123', role: ROLES.PRE_SALES },
  { name: 'BDM',         email: 'bdm@digitalinfusive.com',    password: 'bdm123',   role: ROLES.BDM },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// ─── LOADING SCREEN ──────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex bg-blue-600 text-white p-4 rounded-2xl mb-6 shadow-lg shadow-blue-500/20 animate-pulse">
        <Target size={32} />
      </div>
      <p className="text-white font-bold text-lg mb-2">Infusive CRM</p>
      <p className="text-slate-400 text-sm flex items-center justify-center space-x-2">
        <Loader2 size={15} className="animate-spin" />
        <span>Connecting to Firebase...</span>
      </p>
    </div>
  </div>
);

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

const LoginScreen = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex bg-blue-600 text-white p-3 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <Target size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Infusive CRM</h1>
          <p className="text-slate-400 text-sm mt-1">Login to access your dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm mb-6 flex items-center space-x-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <span>Sign In</span>
            }
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {

  // ── Auth State ──
  const [authLoading, setAuthLoading]   = useState(true);
  const [currentUser, setCurrentUser]   = useState<any>(null);

  // ── Firestore Data ──
  const [users,       setUsers]         = useState<any[]>([]);
  const [leads,       setLeads]         = useState<any[]>([]);
  const [projects,    setProjects]      = useState<any[]>([]);
  const [dataLoading, setDataLoading]   = useState(true);

  // ── UI State ──
  const [currentView,    setCurrentView]    = useState('dashboard');
  const [selectedLead,   setSelectedLead]   = useState<any>(null);
  const [isSidebarOpen,  setIsSidebarOpen]  = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');

  // ── Alias ──
  const Database = FileSpreadsheet;

  // ────────────────────────────────────────────────────────────────────────────
  // Firebase Auth — listen for auth state changes
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          setCurrentUser({ id: fbUser.uid, ...snap.data() });
        } else {
          const usersSnap = await getDocs(collection(db, 'users'));
          const isFirstUser = usersSnap.empty;
          const role = isFirstUser ? ROLES.ADMIN : ROLES.PRE_SALES;
          await setDoc(doc(db, 'users', fbUser.uid), {
            name: fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email,
            role,
            createdAt: new Date().toISOString(),
          });
          setCurrentUser({ id: fbUser.uid, name: fbUser.email?.split('@')[0] || 'User', email: fbUser.email, role });
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // Firestore — real-time listeners (only when logged in)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setDataLoading(false);
      return;
    }
    setDataLoading(true);

    const unsubLeads = onSnapshot(
      query(collection(db, 'leads'), orderBy('createdAt', 'desc')),
      snap => setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err  => console.error('Leads:', err),
    );

    const unsubProjects = onSnapshot(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc')),
      snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err  => console.error('Projects:', err),
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      snap => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setDataLoading(false);
      },
      err => console.error('Users:', err),
    );

    return () => { unsubLeads(); unsubProjects(); unsubUsers(); };
  }, [currentUser]);

  // Keep selectedLead in sync with live Firestore updates
  useEffect(() => {
    if (!selectedLead) return;
    const updated = leads.find(l => l.id === selectedLead.id);
    if (updated) setSelectedLead(updated);
    else setSelectedLead(null); // lead deleted
  }, [leads]); // eslint-disable-line

  // ────────────────────────────────────────────────────────────────────────────
  // AUTH ACTIONS
  // ────────────────────────────────────────────────────────────────────────────

  const handleLogin = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (fbErr: any) {
      const notFound = [
        'auth/user-not-found',
        'auth/invalid-credential',
        'auth/wrong-password',
        'auth/invalid-email',
      ].includes(fbErr.code);

      if (notFound) {
        const seed = INITIAL_USERS.find(
          u => u.email === normalizedEmail && u.password === password,
        );
        if (seed) {
          const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          await setDoc(doc(db, 'users', cred.user.uid), {
            name:      seed.name,
            email:     normalizedEmail,
            role:      seed.role,
            createdAt: new Date().toISOString(),
          });
          return;
        }
        throw new Error('Invalid email or password.');
      }
      throw new Error(fbErr.message || 'Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  // ────────────────────────────────────────────────────────────────────────────
  // USER ACTIONS (Firestore + Firebase Auth)
  // ────────────────────────────────────────────────────────────────────────────

  const addUser = async (userData: any) => {
    const email = userData.email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, userData.password);
      await signOut(secondaryAuth);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name:      userData.name,
        email,
        role:      userData.role,
        createdAt: new Date().toISOString(),
      });
      alert(`${userData.name} added successfully!`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        alert('Email already taken!');
      } else {
        alert(`Error creating user: ${err.message}`);
      }
    }
  };

  const deleteUser = async (userId: string, userEmail?: string) => {
    if (!confirm('Are you sure you want to remove this user? They will no longer be able to log in.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('User removed from app. Also delete from Firebase Console > Authentication if needed.');
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // LEAD ACTIONS
  // ────────────────────────────────────────────────────────────────────────────

  const addLead = async (leadData: any) => {
    await addDoc(collection(db, 'leads'), {
      ...leadData,
      status:        'NEW LEAD',
      stage:         null,
      assignedTo:    null,
      addedBy:       currentUser.id,
      expectedValue: 0,
      probability:   0,
      createdAt:     new Date().toISOString(),
      timeline:      [{ date: new Date().toISOString(), action: 'Lead added', user: currentUser.name }],
      communications:[],
    });
    setCurrentView('dashboard');
  };

  const addBulkLeads = async (bulkLeads: any[]) => {
    await Promise.all(bulkLeads.map(leadData => addDoc(collection(db, 'leads'), {
      ...leadData,
      status:        'NEW LEAD',
      stage:         null,
      assignedTo:    null,
      addedBy:       currentUser.id,
      expectedValue: 0,
      probability:   0,
      createdAt:     new Date().toISOString(),
      timeline:      [{ date: new Date().toISOString(), action: 'Bulk uploaded lead', user: currentUser.name }],
      communications:[],
    })));
    alert(`${bulkLeads.length} leads uploaded successfully!`);
    setCurrentView('dashboard');
  };

  const updateLeadTLStatus = async (leadId: string, newStatus: string, assignedTo: string | null = null) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const updates: any = { status: newStatus };
    let actionMsg = `Status changed to ${newStatus}`;

    if (newStatus === 'ASSIGNED' && assignedTo) {
      updates.assignedTo = assignedTo;
      updates.stage      = 'Assigned';
      const assignedUser = users.find(u => u.id === assignedTo);
      actionMsg = `Assigned to ${assignedUser?.name}`;
    }

    updates.timeline = [
      { date: new Date().toISOString(), action: actionMsg, user: currentUser.name },
      ...(lead.timeline || []),
    ];

    await updateDoc(doc(db, 'leads', leadId), updates);
    if (selectedLead?.id === leadId) setSelectedLead((p: any) => p ? { ...p, ...updates } : null);
  };

  const updateSalesStage = async (leadId: string, newStage: string, lostReason = '') => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const updates: any = { stage: newStage };
    let actionMsg = `Moved to ${newStage}`;

    if (newStage === 'Lost') actionMsg += ` (${lostReason})`;
    if (newStage === 'Won') {
      updates.status = 'WON';
      await createProject({ ...lead, stage: newStage, status: 'WON' });
    }

    updates.timeline = [
      { date: new Date().toISOString(), action: actionMsg, user: currentUser.name },
      ...(lead.timeline || []),
    ];

    await updateDoc(doc(db, 'leads', leadId), updates);
    if (selectedLead?.id === leadId) setSelectedLead((p: any) => p ? { ...p, ...updates } : null);
  };

  const addCommunication = async (leadId: string, commData: any) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newComm  = { date: new Date().toISOString(), ...commData };
    const newEvent = { date: new Date().toISOString(), action: `Logged ${commData.type}: ${commData.notes}`, user: currentUser.name };

    const updates: any = {
      communications: [newComm,  ...(lead.communications || [])],
      timeline:       [newEvent, ...(lead.timeline       || [])],
      nextFollowUp:   commData.nextFollowUp  || lead.nextFollowUp,
      expectedValue:  commData.expectedValue || lead.expectedValue,
      probability:    commData.probability   || lead.probability,
    };

    await updateDoc(doc(db, 'leads', leadId), updates);
    if (selectedLead?.id === leadId) setSelectedLead((p: any) => p ? { ...p, ...updates } : null);
  };

  const createProject = async (lead: any) => {
    await addDoc(collection(db, 'projects'), {
      leadId:     lead.id,
      clientName: lead.companyName,
      service:    lead.service,
      status:     'Onboarding',
      value:      lead.expectedValue,
      manager:    null,
      createdAt:  new Date().toISOString(),
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // DERIVED DATA
  // ────────────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!currentUser) return { totalLeads:0, newLeads:0, assigned:0, won:0, revenue:0, myActiveDeals:0, pipelineValue:0 };
    const myLeads = leads.filter(l => l.assignedTo === currentUser.id || currentUser.role === ROLES.ADMIN);
    return {
      totalLeads:    leads.length,
      newLeads:      leads.filter(l => l.status === 'NEW LEAD').length,
      assigned:      leads.filter(l => l.status === 'ASSIGNED').length,
      won:           leads.filter(l => l.stage === 'Won').length,
      revenue:       leads.filter(l => l.stage === 'Won').reduce((s,l) => s + Number(l.expectedValue||0), 0),
      myActiveDeals: myLeads.filter(l => !['Won','Lost','Not Interested'].includes(l.stage) && l.stage).length,
      pipelineValue: myLeads.filter(l => !['Won','Lost'].includes(l.stage)).reduce((s,l) => s + Number(l.expectedValue||0), 0),
    };
  }, [leads, currentUser]);

  const reminders = useMemo(() => {
    if (!currentUser) return [];
    return leads
      .filter(l =>
        (l.assignedTo === currentUser.id || currentUser.role === ROLES.ADMIN) &&
        l.nextFollowUp && l.stage &&
        !['Won','Lost','Not Interested'].includes(l.stage),
      )
      .sort((a,b) => new Date(a.nextFollowUp||0).getTime() - new Date(b.nextFollowUp||0).getTime());
  }, [leads, currentUser]);

  // ────────────────────────────────────────────────────────────────────────────
  // HELPER UI COMPONENTS
  // ────────────────────────────────────────────────────────────────────────────

  const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const cc: any = {
      blue:   'bg-blue-50   text-blue-600',
      amber:  'bg-amber-50  text-amber-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      green:  'bg-emerald-50 text-emerald-600',
      red:    'bg-red-50    text-red-600',
    };
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className={`p-4 rounded-full ${cc[color]}`}><Icon size={24} /></div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }: any) => {
    let s = 'bg-slate-100 text-slate-700';
    if (status === 'NEW LEAD') s = 'bg-blue-100 text-blue-800';
    if (status === 'ASSIGNED') s = 'bg-indigo-100 text-indigo-800';
    if (status === 'WON')      s = 'bg-emerald-100 text-emerald-800';
    if (['REJECTED','INVALID','DUPLICATE'].includes(status)) s = 'bg-red-100 text-red-800';
    return <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${s}`}>{status}</span>;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ────────────────────────────────────────────────────────────────────────────

  const Navigation = () => {
    const items = [
      { id: 'dashboard',  label: 'Dashboard',       icon: LayoutDashboard, roles: Object.values(ROLES) },
      { id: 'add_lead',   label: 'Add Lead',         icon: UserPlus,        roles: [ROLES.PRE_SALES, ROLES.ADMIN, ROLES.LEAD_TL] },
      { id: 'lead_review',label: 'Lead Review',      icon: Search,          roles: [ROLES.LEAD_TL, ROLES.ADMIN] },
      { id: 'pipeline',   label: 'Sales Pipeline',   icon: Activity,        roles: [ROLES.BDM, ROLES.ADMIN] },
      { id: 'projects',   label: 'Projects',         icon: Briefcase,       roles: [ROLES.ADMIN, ROLES.BDM] },
      { id: 'team',       label: 'Team Management',  icon: Users,           roles: [ROLES.ADMIN] },
    ];
    return (
      <nav className="space-y-1 p-4">
        {items.filter(i => i.roles.includes(currentUser.role)).map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <item.icon size={20} />
            {isSidebarOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // TOP BAR
  // ────────────────────────────────────────────────────────────────────────────

  const TopBar = () => {
    const [showResults, setShowResults] = useState(false);

    const searchResults = useMemo(() => {
      if (!searchQuery) return [];
      const q = searchQuery.toLowerCase();
      return leads.filter(l =>
        l.companyName?.toLowerCase().includes(q) ||
        l.contactPerson?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.website?.toLowerCase().includes(q) ||
        l.whatsapp?.includes(q),
      );
    }, [searchQuery]);

    return (
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center space-x-4 w-full md:w-1/2 lg:w-1/3 relative">
          <h2 className="text-xl font-bold text-slate-800 hidden md:block mr-4">
            {currentView.replace('_', ' ').toUpperCase()}
          </h2>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text" value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Search leads, phone, website..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {showResults && searchQuery && (
              <div className="absolute top-full left-0 w-[200%] mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-96 overflow-y-auto z-50">
                <div className="p-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100 uppercase tracking-wider">
                  Results ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 text-center">No leads found.</div>
                ) : searchResults.map(lead => (
                  <div key={lead.id}
                    onClick={() => { setSelectedLead(lead); setShowResults(false); setSearchQuery(''); }}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-sm">{lead.companyName}</span>
                      <StatusBadge status={lead.stage || lead.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{lead.contactPerson} • {lead.phone || 'No phone'}</span>
                      {lead.assignedTo && (
                        <span className="text-blue-600 font-medium">
                          {users.find(u => u.id === lead.assignedTo)?.name || 'Assigned'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <button className="text-slate-400 hover:text-slate-600 relative">
            <Bell size={20} />
            {reminders.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-sm hidden md:block">
              <p className="font-semibold text-slate-800">{currentUser?.name?.split(' ')[0]}</p>
              <p className="text-xs text-slate-500">{currentUser?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 ml-4 transition-colors p-1" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // DASHBOARD VIEW
  // ────────────────────────────────────────────────────────────────────────────

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentUser.role === ROLES.ADMIN && (<>
          <StatCard title="Total Leads"     value={stats.totalLeads}                            icon={Users}       color="blue" />
          <StatCard title="Active Deals"    value={stats.myActiveDeals}                         icon={Activity}    color="amber" />
          <StatCard title="Pipeline Value"  value={`$${stats.pipelineValue.toLocaleString()}`}  icon={DollarSign}  color="indigo" />
          <StatCard title="Total Revenue"   value={`$${stats.revenue.toLocaleString()}`}        icon={CheckCircle} color="green" />
        </>)}
        {currentUser.role === ROLES.LEAD_TL && (<>
          <StatCard title="Pending Review"  value={stats.newLeads}  icon={Clock}       color="amber" />
          <StatCard title="Assigned Today"  value={stats.assigned}  icon={UserPlus}    color="blue" />
          <StatCard title="Total Added"     value={stats.totalLeads} icon={Database}   color="indigo" />
          <StatCard title="Rejected/Spam"   value={leads.filter(l => ['REJECTED','INVALID','DUPLICATE'].includes(l.status)).length} icon={XCircle} color="red" />
        </>)}
        {currentUser.role === ROLES.PRE_SALES && (<>
          <StatCard title="My Added Leads"        value={leads.filter(l => l.addedBy === currentUser.id).length}              icon={Users}    color="blue" />
          <StatCard title="Converted to Pipeline" value={leads.filter(l => l.addedBy === currentUser.id && l.stage).length}   icon={Activity} color="green" />
          <StatCard title="Daily Target"          value="15"                                                                    icon={Target}   color="indigo" />
        </>)}
        {currentUser.role === ROLES.BDM && (<>
          <StatCard title="My Active Deals"     value={stats.myActiveDeals}                          icon={Briefcase}   color="blue" />
          <StatCard title="Follow-ups Due"      value={reminders.length}                             icon={Calendar}    color="amber" />
          <StatCard title="My Pipeline Value"   value={`$${stats.pipelineValue.toLocaleString()}`}   icon={DollarSign}  color="indigo" />
          <StatCard title="Closed Won Revenue"  value={`$${stats.revenue.toLocaleString()}`}         icon={CheckCircle} color="green" />
        </>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[ROLES.ADMIN, ROLES.BDM].includes(currentUser.role) && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <Bell size={20} className="mr-2 text-amber-500" /> Upcoming Reminders & Follow-ups
            </h3>
            {reminders.length === 0 ? (
              <p className="text-slate-500 text-sm p-4 bg-slate-50 rounded text-center">No upcoming follow-ups scheduled.</p>
            ) : (
              <div className="space-y-3">
                {reminders.map(lead => {
                  const isPast = new Date(lead.nextFollowUp) < new Date();
                  return (
                    <div key={lead.id} onClick={() => setSelectedLead(lead)}
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{lead.companyName}</span>
                        <span className="text-xs text-slate-500">{lead.contactPerson} • {lead.stage}</span>
                      </div>
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${isPast ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        <Clock size={12} />
                        <span>{new Date(lead.nextFollowUp).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent CRM Activity</h3>
          <div className="space-y-4">
            {leads.slice(0,5).map(lead => (
              <div key={lead.id} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-800 font-medium truncate w-40">{lead.companyName}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{lead.timeline[0]?.action} by {lead.timeline[0]?.user}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(lead.timeline[0]?.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
            {leads.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────────────────────
  // ADD LEAD VIEW
  // ────────────────────────────────────────────────────────────────────────────

  const AddLeadView = () => {
    const [activeTab, setActiveTab] = useState('single');
    const [formData, setFormData]   = useState({
      companyName:'', contactPerson:'', email:'', phone:'', whatsapp:'',
      country:'', website:'', businessType:'', taxId:'', linkedin:'',
      service: SERVICES[0], source: LEAD_SOURCES[0], notes:'',
    });
    const [error,       setError]       = useState('');
    const [submitting,  setSubmitting]  = useState(false);

    const handleSubmit = async (e: any) => {
      e.preventDefault();
      if (!formData.email && !formData.phone) {
        setError('At least one contact method (Email or Phone) is required.');
        return;
      }
      setSubmitting(true);
      try {
        await addLead(formData);
        alert('Lead added successfully!');
      } catch { setError('Failed to add lead. Please try again.'); }
      finally  { setSubmitting(false); }
    };

    const handleBulkUpload = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result;
        if (typeof text !== 'string') return;
        const lines = text.split('\n');
        const bulk: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/(^"|"$)/g,'').trim());
          if (cols.length >= 7) bulk.push({
            companyName: cols[0], contactPerson: cols[1], email: cols[2],
            phone: cols[3], country: cols[4], service: cols[5], source: cols[6],
            website:'', whatsapp:'', businessType:'', taxId:'', linkedin:'', notes:'Bulk uploaded from CSV',
          });
        }
        if (bulk.length > 0) await addBulkLeads(bulk);
        else setError('No valid leads found. Check your CSV format.');
      };
      reader.readAsText(file);
    };

    const inp = 'w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add New Lead</h2>
            <p className="text-sm text-slate-500 mt-1">Pre-Sales Lead Data Entry Form</p>
          </div>
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button onClick={() => setActiveTab('single')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab==='single'?'bg-blue-50 text-blue-700':'text-slate-500 hover:bg-slate-50'}`}>Single Entry</button>
            <button onClick={() => setActiveTab('bulk')}  className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center transition-colors ${activeTab==='bulk'?'bg-blue-50 text-blue-700':'text-slate-500 hover:bg-slate-50'}`}><Upload size={14} className="mr-1"/> Bulk Upload</button>
          </div>
        </div>

        {activeTab === 'single' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center space-x-2"><AlertCircle size={20}/><span>{error}</span></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-700 border-b pb-2">Mandatory Information</h3>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label><input required type="text" className={inp} onChange={e => setFormData({...formData,companyName:e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Person *</label><input required type="text" className={inp} onChange={e => setFormData({...formData,contactPerson:e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Country *</label><input required type="text" className={inp} onChange={e => setFormData({...formData,country:e.target.value})} /></div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-800 font-medium mb-3">Provide at least ONE contact method</p>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label><input type="email" className={inp} onChange={e => setFormData({...formData,email:e.target.value})} /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label><input type="tel" className={inp} onChange={e => setFormData({...formData,phone:e.target.value})} /></div>
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Service Interested *</label><select className={inp} onChange={e => setFormData({...formData,service:e.target.value})}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Lead Source *</label><select className={inp} onChange={e => setFormData({...formData,source:e.target.value})}>{LEAD_SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-700 border-b pb-2">Optional Information</h3>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label><input type="url" placeholder="https://" className={inp} onChange={e => setFormData({...formData,website:e.target.value})} /><p className="text-xs text-slate-400 mt-1">Leave blank if client has no site.</p></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number</label><input type="tel" className={inp} onChange={e => setFormData({...formData,whatsapp:e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn Profile</label><input type="url" className={inp} onChange={e => setFormData({...formData,linkedin:e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">GST/VAT/Tax ID</label><input type="text" className={inp} onChange={e => setFormData({...formData,taxId:e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Initial Notes/Response</label><textarea rows={4} className={inp} onChange={e => setFormData({...formData,notes:e.target.value})}></textarea></div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-200 flex justify-end">
              <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-60">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                <span>Submit Lead to TL</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center space-y-6">
            <div className="bg-blue-50 text-blue-800 p-6 rounded-xl border border-blue-100 inline-block max-w-2xl text-left shadow-sm">
              <h3 className="font-bold mb-2 flex items-center text-lg"><FileSpreadsheet size={20} className="mr-2"/> CSV Bulk Upload Instructions</h3>
              <p className="text-sm mb-4">Upload a CSV with these columns in order (first row = headers):</p>
              <code className="bg-white p-3 rounded-lg border border-blue-200 text-sm font-mono block mb-4 overflow-x-auto whitespace-nowrap shadow-sm text-slate-800">
                Company Name, Contact Person, Email, Phone, Country, Service, Source
              </code>
              <p className="text-xs text-blue-600 mb-2 font-medium">Example Row:</p>
              <code className="bg-white p-3 rounded-lg border border-blue-200 text-xs font-mono block overflow-x-auto whitespace-nowrap text-slate-600">
                "TechCorp","John Doe","john@tech.com","+1234567890","USA","Website Development","Google Ads"
              </code>
            </div>
            <div className="flex justify-center mt-6">
              <label className="cursor-pointer bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center">
                <Upload size={18} className="mr-2" /> Select & Upload CSV File
                <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
              </label>
            </div>
            {error && <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>}
          </div>
        )}
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // LEAD REVIEW VIEW
  // ────────────────────────────────────────────────────────────────────────────

  const LeadReviewView = () => {
    const bdms         = users.filter(u => u.role === ROLES.BDM);
    const pendingLeads = leads.filter(l => l.stage === null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelectAll = (e: any) =>
      setSelectedIds(e.target.checked ? pendingLeads.map(l => l.id) : []);

    const toggleSelect = (id: string) =>
      setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);

    const handleBulkAction = async (action: string, value: string) => {
      if (!selectedIds.length) return alert('Select leads first.');
      if (action === 'assign') {
        await Promise.all(selectedIds.map(id => updateLeadTLStatus(id, 'ASSIGNED', value)));
        alert(`${selectedIds.length} leads assigned to ${users.find(u=>u.id===value)?.name}`);
      } else {
        await Promise.all(selectedIds.map(id => updateLeadTLStatus(id, value)));
        alert(`${selectedIds.length} leads marked as ${value}`);
      }
      setSelectedIds([]);
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Lead Assignment Pool</h2>
            <p className="text-sm text-slate-500">Review quality and assign to Sales Pipeline</p>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 shadow-sm">
              <span className="text-sm font-bold text-blue-700 bg-white px-2 py-1 rounded shadow-sm">{selectedIds.length} Selected</span>
              <div className="h-5 w-px bg-blue-200" />
              <select className="text-xs font-medium rounded border-slate-300 py-1.5 pl-2 pr-6" onChange={e => handleBulkAction('status', e.target.value)} value="">
                <option value="" disabled>Bulk Mark As...</option>
                <option value="DUPLICATE">Duplicate</option>
                <option value="INVALID">Invalid</option>
                <option value="REJECTED">Reject</option>
              </select>
              <select className="text-xs font-bold rounded border-blue-400 bg-blue-600 text-white py-1.5 pl-2 pr-6" onChange={e => handleBulkAction('assign', e.target.value)} value="">
                <option value="" disabled>Bulk Assign To BDM...</option>
                {bdms.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input type="checkbox" onChange={toggleSelectAll} checked={pendingLeads.length > 0 && selectedIds.length === pendingLeads.length} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"/>
                </th>
                <th className="p-4 font-semibold">Date Added</th>
                <th className="p-4 font-semibold">Company / Contact</th>
                <th className="p-4 font-semibold">Source & Service</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">TL Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeads.map(lead => (
                <tr key={lead.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedIds.includes(lead.id)?'bg-blue-50/50':''}`}>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={selectedIds.includes(lead.id)} onChange={() => toggleSelect(lead.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"/>
                  </td>
                  <td className="p-4">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{lead.companyName}</div>
                    <div className="text-xs text-slate-500">{lead.contactPerson}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-600 mb-1 border border-slate-200 uppercase tracking-wider">{lead.source}</span>
                    <div className="text-xs text-blue-600 font-medium">{lead.service}</div>
                  </td>
                  <td className="p-4"><StatusBadge status={lead.status} /></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => setSelectedLead(lead)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View">
                        <Eye size={18} />
                      </button>
                      <select className="text-xs rounded border-slate-300 py-1 pl-2 pr-6"
                        onChange={e => { if(['INVALID','REJECTED','DUPLICATE'].includes(e.target.value)) updateLeadTLStatus(lead.id, e.target.value); }}
                        defaultValue=""
                      >
                        <option value="" disabled>Reject/Mark...</option>
                        <option value="DUPLICATE">Duplicate</option>
                        <option value="INVALID">Invalid</option>
                        <option value="REJECTED">Reject</option>
                      </select>
                      <select className="text-xs rounded border-blue-300 bg-blue-50 text-blue-700 font-medium py-1 pl-2 pr-6"
                        onChange={e => updateLeadTLStatus(lead.id, 'ASSIGNED', e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Assign BDM...</option>
                        {bdms.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingLeads.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No leads pending review.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // KANBAN BOARD
  // ────────────────────────────────────────────────────────────────────────────

  const KanbanBoardView = () => {
    const pipelineLeads = leads.filter(l =>
      l.stage !== null && (currentUser.role === ROLES.ADMIN || l.assignedTo === currentUser.id),
    );

    const onDragStart = (e: any, id: string) => e.dataTransfer.setData('leadId', id);
    const onDragOver  = (e: any) => e.preventDefault();
    const onDrop      = (e: any, stage: string) => {
      const leadId = e.dataTransfer.getData('leadId');
      if (stage === 'Lost') {
        const reason = prompt('Enter reason for lost deal:', 'Budget issue');
        if (reason) updateSalesStage(leadId, stage, reason);
      } else {
        updateSalesStage(leadId, stage);
      }
    };

    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">Sales Pipeline</h2>
          <p className="text-sm text-slate-500">Drag & drop leads, or click a card to view/edit details.</p>
        </div>
        <div className="flex-1 overflow-x-auto flex space-x-4 pb-4 snap-x">
          {SALES_STAGES.map(stage => (
            <div key={stage} className="flex-shrink-0 w-80 bg-slate-100 rounded-xl flex flex-col snap-start"
              onDragOver={onDragOver} onDrop={e => onDrop(e, stage)}
            >
              <div className="p-3 border-b border-slate-200 bg-slate-200/50 rounded-t-xl flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 text-sm">{stage}</h3>
                <span className="bg-slate-300 text-slate-700 text-xs py-0.5 px-2 rounded-full font-medium">
                  {pipelineLeads.filter(l => l.stage === stage).length}
                </span>
              </div>
              <div className="flex-1 p-2 space-y-3 overflow-y-auto min-h-[200px]">
                {pipelineLeads.filter(l => l.stage === stage).map(lead => (
                  <div key={lead.id}
                    draggable
                    onDragStart={e => onDragStart(e, lead.id)}
                    onClick={() => setSelectedLead(lead)}
                    className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all active:cursor-grabbing group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{lead.companyName}</h4>
                      {lead.probability > 0 && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1 rounded">{lead.probability}%</span>}
                    </div>
                    <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
                      <span className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">{lead.service}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase font-semibold tracking-wide">{lead.source}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                      <div className="flex items-center space-x-1">
                        <DollarSign size={12} /><span className="font-medium text-slate-600">{lead.expectedValue||0}</span>
                      </div>
                      {lead.nextFollowUp && (
                        <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded font-medium ${new Date(lead.nextFollowUp)<new Date()?'text-red-600 bg-red-50':'text-amber-600 bg-amber-50'}`}>
                          <Clock size={12}/><span>{new Date(lead.nextFollowUp).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // PROJECTS VIEW
  // ────────────────────────────────────────────────────────────────────────────

  const ProjectsView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Project Execution (Post-Won)</h2>
        <p className="text-sm text-slate-500">Auto-generated from closed won deals.</p>
      </div>
      <div className="p-6">
        {projects.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Briefcase size={48} className="mx-auto mb-4 text-slate-300" />
            <p>No projects yet. Close a deal to automatically generate a project here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(proj => (
              <div key={proj.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{proj.clientName}</h3>
                    <p className="text-sm text-blue-600 font-medium">{proj.service}</p>
                  </div>
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold uppercase">{proj.status}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Value:</span><span className="font-medium text-slate-800">${proj.value}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Start Date:</span><span className="font-medium text-slate-800">{new Date(proj.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEAM MANAGEMENT VIEW
  // ────────────────────────────────────────────────────────────────────────────

  const TeamManagementView = () => {
    const [name,     setName]     = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role,     setRole]     = useState(ROLES.BDM);
    const [customRole, setCustomRole] = useState('');
    const [adding,   setAdding]   = useState(false);

    const handleAdd = async (e: any) => {
      e.preventDefault();
      if (!name || !email || !password) return;
      if (password.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
      }
      const finalRole = role === 'Other' ? customRole.trim() : role;
      if (!finalRole) {
        alert('Please enter a custom role or select a predefined role.');
        return;
      }
      setAdding(true);
      await addUser({ name, email, password, role: finalRole });
      setName(''); setEmail(''); setPassword(''); setRole(ROLES.BDM); setCustomRole('');
      setAdding(false);
    };

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Team Management</h2>
          <p className="text-sm text-slate-500 mt-1">Add team members — each gets a Firebase Auth account.</p>
        </div>
        <div className="p-6 border-b border-slate-200">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border-slate-300 focus:border-blue-500 text-sm" placeholder="e.g. John Doe"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border-slate-300 focus:border-blue-500 text-sm" placeholder="e.g. john@example.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border-slate-300 focus:border-blue-500 text-sm" placeholder="min 6 chars"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full rounded-lg border-slate-300 focus:border-blue-500 text-sm">
                {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                <option value="Other">Other</option>
              </select>
              {role === 'Other' && (
                <input
                  type="text"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="Enter custom role"
                  className="w-full rounded-lg border-slate-300 focus:border-blue-500 text-sm mt-2"
                />
              )}
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button type="submit" disabled={adding} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center shadow-sm text-sm disabled:opacity-60">
                {adding ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
                Add User
              </button>
            </div>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold">Firebase UID</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{u.name}</td>
                  <td className="p-4 text-slate-600">{u.email || 'N/A'}</td>
                  <td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold">{u.role}</span></td>
                  <td className="p-4 text-slate-400 text-xs font-mono truncate max-w-[120px]">{u.id}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => deleteUser(u.id, u.email)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete user">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // LEAD DETAIL MODAL
  // ────────────────────────────────────────────────────────────────────────────

  const LeadDetailModal = ({ lead, onClose }: any) => {
    const [commType,      setCommType]      = useState('Call');
    const [commNotes,     setCommNotes]     = useState('');
    const [nextFollowUp,  setNextFollowUp]  = useState(lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().slice(0,16) : '');
    const [expectedValue, setExpectedValue] = useState(lead.expectedValue || 0);
    const [probability,   setProbability]   = useState(lead.probability   || 0);
    const [saving,        setSaving]        = useState(false);

    const canEdit = currentUser.role === ROLES.ADMIN || (currentUser.role === ROLES.BDM && lead.assignedTo === currentUser.id);

    const handleSaveComm = async () => {
      if (!commNotes && !nextFollowUp && expectedValue === lead.expectedValue && probability === lead.probability) return;
      setSaving(true);
      await addCommunication(lead.id, {
        type: commType,
        notes: commNotes || 'Updated lead details.',
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
        expectedValue, probability,
      });
      setCommNotes('');
      setSaving(false);
      alert('Lead updated successfully!');
    };

    const handleStageChange = (e: any) => {
      const stage = e.target.value;
      if (stage === 'Lost') {
        const reason = prompt('Enter reason for lost deal:', 'Budget issue');
        if (reason) updateSalesStage(lead.id, stage, reason);
      } else {
        updateSalesStage(lead.id, stage);
      }
    };

    return (
      <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <h2 className="text-2xl font-bold text-slate-900">{lead.companyName}</h2>
                {!lead.stage ? (
                  <StatusBadge status={lead.status} />
                ) : canEdit ? (
                  <select value={lead.stage} onChange={handleStageChange}
                    className="text-sm font-bold bg-blue-50 text-blue-700 border-blue-200 rounded-lg py-1 focus:ring-blue-500"
                  >
                    {SALES_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className="text-sm font-bold bg-slate-200 text-slate-700 px-3 py-1 rounded-lg">{lead.stage}</span>
                )}
              </div>
              <p className="text-slate-500 flex items-center space-x-4 text-sm">
                <span className="flex items-center"><UserPlus size={14} className="mr-1"/> {lead.contactPerson}</span>
                <span className="flex items-center"><MapPin size={14} className="mr-1"/> {lead.country}</span>
                {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline"><Globe size={14} className="mr-1"/> Website</a>}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <XCircle size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
            {/* Left — Info & Logging */}
            <div className="w-full md:w-2/3 p-6 border-r border-slate-200 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <div><span className="text-slate-500 block text-xs">Email</span><span className="font-medium truncate block">{lead.email||'N/A'}</span></div>
                <div><span className="text-slate-500 block text-xs">Phone</span><span className="font-medium">{lead.phone||'N/A'}</span></div>
                <div><span className="text-slate-500 block text-xs">Service Req.</span><span className="font-medium text-blue-700">{lead.service}</span></div>
                <div><span className="text-slate-500 block text-xs">Lead Source</span><span className="font-medium">{lead.source}</span></div>
              </div>

              {canEdit && lead.stage && (
                <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 flex items-center"><MessageCircle size={18} className="mr-2 text-blue-600"/> Log Activity & Update</h3>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {['Call','Email','Meeting','WhatsApp'].map(type => (
                      <button key={type} onClick={() => setCommType(type)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${commType===type?'bg-blue-50 border-blue-500 text-blue-700':'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >{type}</button>
                    ))}
                  </div>
                  <textarea value={commNotes} onChange={e => setCommNotes(e.target.value)}
                    placeholder={`Write notes from this ${commType.toLowerCase()}...`}
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" rows={3}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Set Next Follow-up</label>
                      <input type="datetime-local" value={nextFollowUp} onChange={e => setNextFollowUp(e.target.value)} className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Expected Value ($)</label>
                      <input type="number" value={expectedValue} onChange={e => setExpectedValue(e.target.value)} className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Probability (%)</label>
                      <input type="number" max="100" min="0" value={probability} onChange={e => setProbability(e.target.value)} className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500" />
                    </div>
                  </div>
                  <button onClick={handleSaveComm} disabled={saving}
                    className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 shadow-sm transition-colors mt-2 flex items-center justify-center space-x-2 disabled:opacity-60"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    <span>Save Record</span>
                  </button>
                </div>
              )}

              {lead.communications?.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="font-bold text-slate-800 flex items-center border-b pb-2"><FileText size={18} className="mr-2"/> Previous Notes & Logs</h3>
                  <div className="space-y-4">
                    {lead.communications.map((comm: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{comm.type}</span>
                          <span className="text-xs text-slate-500">{new Date(comm.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                        </div>
                        <p className="text-slate-700 text-sm whitespace-pre-wrap">{comm.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — Timeline */}
            <div className="w-full md:w-1/3 bg-slate-50 p-6 flex flex-col border-t md:border-t-0 border-slate-200">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center"><Activity size={18} className="mr-2"/> Activity Timeline</h3>
              <div className="flex-1 overflow-y-auto pr-2 relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-200" />
                <div className="space-y-6 relative">
                  {lead.timeline.map((event: any, i: number) => (
                    <div key={i} className="flex items-start pl-10 relative">
                      <div className="absolute left-2 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-slate-50 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{event.action}</p>
                        <p className="text-xs text-slate-500">{new Date(event.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} • {event.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':   return <DashboardView />;
      case 'add_lead':    return <AddLeadView />;
      case 'lead_review': return <LeadReviewView />;
      case 'pipeline':    return <KanbanBoardView />;
      case 'projects':    return <ProjectsView />;
      case 'team':        return <TeamManagementView />;
      default:            return <DashboardView />;
    }
  };

  // Auth loading — don't know yet if logged in
  if (authLoading) return <LoadingScreen />;

  // Not authenticated
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  // Authenticated but data still loading
  if (dataLoading) return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col z-30 shrink-0`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Target size={20} /></div>
              <span className="font-bold text-lg tracking-tight text-slate-800">Infusive CRM</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-100 rounded text-slate-500 mx-auto">
            <LayoutDashboard size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4"><Navigation /></div>
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-center text-xs text-slate-400">
            <span>v3.0 · Firebase</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderCurrentView()}
        </div>
      </main>

      {/* Modal */}
      {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}