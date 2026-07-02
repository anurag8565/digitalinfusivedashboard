import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, CheckSquare, BarChart, Calendar, 
  Settings, Bell, Search, Moon, Sun, Filter, Plus, 
  MessageSquare, Paperclip, ChevronRight, CheckCircle2, 
  Clock, AlertCircle, TrendingUp, DollarSign, Globe, 
  Target, Share2, Layers, MoreVertical, FileText, 
  Layout, Search as SearchIcon, MousePointerClick, 
  Smartphone, ArrowRight, XCircle, PlayCircle, Trash2, Shield,
  UploadCloud, Download, FileBarChart, LogOut, KeyRound, UserPlus, Eye, Megaphone, Printer, Building, Link, CalendarDays, CreditCard, Edit
} from 'lucide-react';

// --- REUSABLE UI COMPONENTS ---
const ProgressBar = ({ progress, color = 'bg-blue-600', height = 'h-2' }) => (
  <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full ${height} overflow-hidden`}>
    <div className={`${color} ${height} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }}></div>
  </div>
);

const Badge = ({ children, type = 'default', className = '' }) => {
  const types = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 w-max ${types[type] || types.default} ${className}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 print:shadow-none print:border-slate-300 print:break-inside-avoid ${className}`}>
    {children}
  </div>
);

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const appId = import.meta.env.VITE_FIREBASE_APP_NAMESPACE || 'digital-infusive-agency-id';
const localKey = (key) => `${appId}:${key}`;
const loadLocalData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(localKey(key));
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};
const saveLocalData = (key, value) => {
  localStorage.setItem(localKey(key), JSON.stringify(value));
};

// --- INITIAL DATA GENERATORS (V5: DYNAMIC TARGETS) ---
const getInitialMonthData = (client) => {
  const targets = client?.targets || { blogs: 4, backlinks: 50, reels: 10, posts: 4 };
  return {
    seo: {
      blogs: Array.from({ length: targets.blogs || 1 }, (_, i) => ({ id: Date.now()+i, title: `Blog Topic ${i + 1}`, assignee: '', status: 'pending', completedAt: null })),
      backlinks: [],
      onPage: [ { id: Date.now()+500, page: 'Homepage SEO Update', assignee: '', status: 'pending', completedAt: null } ],
      techChecklist: [
        { id: Date.now()+1000, task: 'Indexing & Crawl Errors', status: 'pending', assignee: '', completedAt: null },
        { id: Date.now()+1001, task: 'Core Web Vitals & Schema', status: 'pending', assignee: '', completedAt: null }
      ]
    },
    social: {
      reels: Array.from({ length: targets.reels || 1 }, (_, i) => ({ id: Date.now()+i, topic: `Reel Idea ${i + 1}`, assignee: '', status: 'pending', completedAt: null })),
      posts: Array.from({ length: targets.posts || 1 }, (_, i) => ({ id: Date.now()+i+100, topic: `Post Idea ${i + 1}`, assignee: '', status: 'pending', completedAt: null }))
    },
    ads: {
      google: { spent: 0, conversions: 0, roas: 0, cpa: 0, tasks: [ { id: Date.now()+1, task: 'Setup Conversion Tracking', assignee: '', status: 'pending' } ] },
      meta: { spent: 0, leads: 0, cpr: 0, reach: 0, tasks: [ { id: Date.now()+2, task: 'Meta Pixel Integration', assignee: '', status: 'pending' } ] }
    },
    reports: { ga4: false, gsc: false, social: false, ads: false, master: false },
    sharedAssets: []
  };
};

const getInitialProjectData = (client) => {
  const targetKw = client?.targets?.keywords || 10;
  return {
    website: {
      phases: [
        { id: 1, name: 'Phase 1: UI/UX Design', tasks: [ { id: Date.now()+11, name: 'Homepage Design', assignee: '', status: 'pending', due: '' } ] },
        { id: 2, name: 'Phase 2: Dev & Migration', tasks: [ { id: Date.now()+21, name: 'WordPress Setup', assignee: '', status: 'pending', due: '' } ] }
      ]
    },
    seoKeywords: Array.from({ length: targetKw }, (_, i) => ({ id: Date.now()+i, keyword: `Target Keyword ${i+1}`, volume: '-', initial: '-', m1: '-', m2: '-', m3: '-', m6: '-' })),
    months: {
      "Current Month": getInitialMonthData(client)
    }
  };
};

const INITIAL_CLIENTS_DATA = { list: [] };
const INITIAL_USERS_DATA = { userList: [] };

// --- MAIN APPLICATION ---
export default function App() {
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Database States
  const [appUsers, setAppUsers] = useState(INITIAL_USERS_DATA);
  const [appClients, setAppClients] = useState(INITIAL_CLIENTS_DATA);
  const [activeClientId, setActiveClientId] = useState(null);
  const [PROJECT_DATA, setProjectData] = useState(null);
  
  // UI States
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState("Current Month");
  const [user, setUser] = useState(null);
  const [isUsersLoaded, setIsUsersLoaded] = useState(false);
  const [isClientsLoaded, setIsClientsLoaded] = useState(false);
  const [teamMemberProfile, setTeamMemberProfile] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  const isReadOnly = teamMemberProfile?.role === 'Client View';

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState(''); 
  const [authError, setAuthError] = useState('');

  // User Management Form States
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('SEO Team');

  // Client Onboarding/Editing Form States
  const [clientFormId, setClientFormId] = useState('');
  const [clientFormName, setClientFormName] = useState('');
  const [clientFormOnboard, setClientFormOnboard] = useState('');
  const [clientFormBilling, setClientFormBilling] = useState('');
  
  const [clientServWeb, setClientServWeb] = useState(false);
  const [clientFeeWeb, setClientFeeWeb] = useState('');
  
  const [clientServSeo, setClientServSeo] = useState(false);
  const [clientFeeSeo, setClientFeeSeo] = useState('');
  const [clientTargetKw, setClientTargetKw] = useState('');
  const [clientTargetBlogs, setClientTargetBlogs] = useState('');
  const [clientTargetBacklinks, setClientTargetBacklinks] = useState('');
  
  const [clientServSocial, setClientServSocial] = useState(false);
  const [clientFeeSocial, setClientFeeSocial] = useState('');
  const [clientTargetReels, setClientTargetReels] = useState('');
  const [clientTargetPosts, setClientTargetPosts] = useState('');

  const [clientServAds, setClientServAds] = useState(false);
  const [clientFeeAds, setClientFeeAds] = useState('');
  const [clientAdBudget, setClientAdBudget] = useState('');

  // 1. Initialize Auth
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser({ uid: 'local-browser-session' } as any);
      return;
    }

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
        setUser({ uid: 'local-browser-session' } as any);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Fetch Users & Clients (v5 Schema)
  useEffect(() => {
    if (!user) return;

    if (!isFirebaseConfigured || !db) {
      setAppUsers(loadLocalData('users_db_v5', INITIAL_USERS_DATA));
      setAppClients(loadLocalData('clients_db_v5', INITIAL_CLIENTS_DATA));
      setIsUsersLoaded(true);
      setIsClientsLoaded(true);
      return;
    }
    
    const usersRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_state', 'users_db_v5');
    const unsubUsers = onSnapshot(usersRef, (snap) => {
      if (snap.exists()) setAppUsers(snap.data() as any);
      else { setDoc(usersRef, INITIAL_USERS_DATA).catch(console.error); setAppUsers(INITIAL_USERS_DATA); }
      setIsUsersLoaded(true);
    }, (error) => {
      console.error('Firebase users read error:', error);
      setAppUsers(loadLocalData('users_db_v5', INITIAL_USERS_DATA));
      setIsUsersLoaded(true);
    });

    const clientsRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_state', 'clients_db_v5');
    const unsubClients = onSnapshot(clientsRef, (snap) => {
      if (snap.exists()) {
        setAppClients(snap.data() as any);
      } else { 
        setDoc(clientsRef, INITIAL_CLIENTS_DATA).catch(console.error); 
        setAppClients(INITIAL_CLIENTS_DATA);
      }
      setIsClientsLoaded(true);
    }, (error) => {
      console.error('Firebase clients read error:', error);
      setAppClients(loadLocalData('clients_db_v5', INITIAL_CLIENTS_DATA));
      setIsClientsLoaded(true);
    });

    return () => { unsubUsers(); unsubClients(); };
  }, [user]);

  // 3. Fetch Project Data for Active Client
  useEffect(() => {
    if (!isClientsLoaded || !teamMemberProfile) return;
    
    let finalClientId = activeClientId;
    if (teamMemberProfile.role === 'Client View') {
      finalClientId = teamMemberProfile.assignedClientId;
      if(activeClientId !== finalClientId) setActiveClientId(finalClientId);
    } else if (!activeClientId && appClients.list.length > 0) {
      finalClientId = appClients.list[0].id;
      setActiveClientId(finalClientId);
    }

    if (!finalClientId) {
      setProjectData(null);
      return;
    }

    if (!isFirebaseConfigured || !db) {
      const cObj = appClients.list.find(c => c.id === finalClientId);
      const projectKey = `client_projects_v5:${finalClientId}`;
      const localProject = loadLocalData(projectKey, getInitialProjectData(cObj));
      setProjectData(localProject);
      if (!localProject.months[selectedMonth]) {
        const availableMonths = Object.keys(localProject.months);
        setSelectedMonth(availableMonths[availableMonths.length - 1] || "Current Month");
      }
      saveLocalData(projectKey, localProject);
      return;
    }

    const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'client_projects_v5', finalClientId);
    const unsubProject = onSnapshot(projectRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProjectData(data);
        if (!data.months[selectedMonth]) {
          const availableMonths = Object.keys(data.months);
          if(availableMonths.length > 0) setSelectedMonth(availableMonths[availableMonths.length - 1]);
        }
      } else {
        const cObj = appClients.list.find(c => c.id === finalClientId);
        const initialData = getInitialProjectData(cObj);
        setDoc(projectRef, initialData).catch(console.error);
        setProjectData(initialData);
        setSelectedMonth("Current Month");
      }
    }, (error) => {
      console.error('Firebase project read error:', error);
      const cObj = appClients.list.find(c => c.id === finalClientId);
      const projectKey = `client_projects_v5:${finalClientId}`;
      setProjectData(loadLocalData(projectKey, getInitialProjectData(cObj)));
    });
    return () => unsubProject();
  }, [user, activeClientId, isClientsLoaded, teamMemberProfile, appClients.list, selectedMonth]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Ensure tabs update correctly
  useEffect(() => {
    if (teamMemberProfile && activeClientId) {
      const allowed = getAllowedTabs();
      if (allowed.length > 0 && !allowed.find(t => t.id === activeTab)) {
        setActiveTab(allowed[0].id);
      }
    }
  }, [teamMemberProfile, activeClientId, activeTab]);

  // --- ACTIONS ---
  const handleLogout = async () => {
    setTeamMemberProfile(null); setShowLogin(true);
    setLoginUsername(''); setLoginPassword(''); setAuthError('');
    setActiveClientId(null); setProjectData(null);
  };

  const saveToCloud = async (newData) => {
    setProjectData({ ...newData });
    if (!activeClientId) return;
    if (!isFirebaseConfigured || !db) {
      saveLocalData(`client_projects_v5:${activeClientId}`, newData);
      return;
    }
    if (user) {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'client_projects_v5', activeClientId);
      await setDoc(docRef, newData).catch(console.error);
    }
  };

  const saveUsersToCloud = async (newUsers) => {
    setAppUsers(newUsers);
    if (!isFirebaseConfigured || !db) {
      saveLocalData('users_db_v5', newUsers);
      return;
    }
    if (user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_state', 'users_db_v5'), newUsers);
  };

  const saveClientsToCloud = async (newClients) => {
    setAppClients(newClients);
    if (!isFirebaseConfigured || !db) {
      saveLocalData('clients_db_v5', newClients);
      return;
    }
    if (user) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_state', 'clients_db_v5'), newClients);
  };

  const createNewMonth = () => {
    if(isReadOnly) return;
    const newMonth = prompt("Enter new month name (e.g., August 2026):");
    if (newMonth && newMonth.trim() !== '') {
      if(PROJECT_DATA.months[newMonth]) return alert("Month already exists!");
      const newData = { ...PROJECT_DATA };
      newData.months[newMonth] = getInitialMonthData(getActiveClientObj());
      saveToCloud(newData);
      setSelectedMonth(newMonth);
    }
  };

  // --- RBAC & PERMISSIONS ---
  const getActiveClientObj = () => appClients.list.find(c => c.id === activeClientId) || null;

  const getAllowedTabs = () => {
    const role = teamMemberProfile?.role;
    const client = getActiveClientObj();
    if(!client && role !== 'Super Admin' && role !== 'Sales Manager') return [];

    let tabs = [
      { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
      { id: 'website', label: 'Website Dev', icon: Globe, req: 'web' },
      { id: 'seo', label: 'SEO Management', icon: SearchIcon, req: 'seo' },
      { id: 'social', label: 'Social Media', icon: Share2, req: 'social' },
      { id: 'ads', label: 'Performance Ads', icon: Megaphone, req: 'ads' },
      { id: 'reports', label: 'Monthly Reports', icon: FileBarChart }
    ];

    if(client) tabs = tabs.filter(t => !t.req || client.services[t.req]);

    if (role === 'Super Admin') return [...tabs, { id: 'settings', label: 'Agency Settings', icon: Building, adminOnly: true }];
    if (role === 'Sales Manager') return [{ id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard }, { id: 'reports', label: 'Monthly Reports', icon: FileBarChart }, { id: 'settings', label: 'Client Onboarding', icon: Building }];
    if (role === 'Project Manager') return tabs;
    if (role === 'Client View') return tabs; 
    if (role === 'SEO Team') return tabs.filter(t => ['seo', 'website', 'reports', 'overview'].includes(t.id));
    if (role === 'Web Dev Team') return tabs.filter(t => ['website', 'seo', 'overview'].includes(t.id));
    if (role === 'Social Media Team') return tabs.filter(t => ['social', 'reports', 'overview'].includes(t.id));
    if (role === 'Performance Marketing Team') return tabs.filter(t => ['ads', 'reports', 'overview'].includes(t.id));
    return [];
  };

  const visibleClients = isReadOnly ? appClients.list.filter(c => c.id === teamMemberProfile.assignedClientId) : appClients.list;
  const currentMonthData = PROJECT_DATA?.months?.[selectedMonth] || null;
  
  // STRICT FINANCIAL ACCESS CONTROL
  const canViewFinancials = ['Super Admin', 'Sales Manager', 'Project Manager'].includes(teamMemberProfile?.role);

  // Render Helpers
  const inputClass = `bg-transparent w-full focus:outline-none dark:text-white ${isReadOnly ? 'pointer-events-none opacity-80' : 'hover:border-slate-300 border-b border-transparent px-1 py-1'}`;
  const selectClass = `text-xs font-bold uppercase rounded-full px-3 py-1.5 outline-none ${isReadOnly ? 'pointer-events-none opacity-80 bg-slate-100 dark:bg-slate-800 appearance-none' : 'cursor-pointer bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`;

  const renderStatusDropdown = (val, onChangeFn) => (
    <select value={val} onChange={e => onChangeFn(e.target.value)} className={`${selectClass} print:hidden`}>
      <option value="pending">Pending</option>
      <option value="in-progress">In Progress</option>
      <option value="client-approval">⏳ Waiting: Client Approval</option>
      <option value="done">✅ Done / Published</option>
      <option value="delayed">Delayed</option>
    </select>
  );

  const getStatusIcon = (status) => {
    switch(status) {
      case 'done':
      case 'published': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'writing':
      case 'editing':
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'client-approval': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'delayed': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default: return <Clock className="w-5 h-5 text-slate-300 dark:text-slate-600" />;
    }
  };

  // --- SUB-VIEWS ---

  const renderOverview = () => {
    if(!PROJECT_DATA || !currentMonthData) return <div className="p-8 text-center text-slate-500">Select or onboard a client...</div>;
    const client = getActiveClientObj();

    // Financial Calcs (Only displayed if canViewFinancials)
    const feeWeb = Number(client?.fees?.web) || 0;
    const feeSeo = Number(client?.fees?.seo) || 0;
    const feeSocial = Number(client?.fees?.social) || 0;
    const feeAds = Number(client?.fees?.ads) || 0;
    const totalRetainer = feeSeo + feeSocial + feeAds; 
    const adBudget = Number(client?.fees?.adBudget) || 0;

    // Progress Calcs
    const tBlogs = client?.targets?.blogs || 1;
    const publishedBlogs = currentMonthData.seo?.blogs?.filter(b => b.status === 'done').length || 0;
    
    const tBacklinks = client?.targets?.backlinks || 1;
    const completedBacklinks = currentMonthData.seo?.backlinks?.filter(b => b.status === 'done').length || 0;
    
    const tReels = client?.targets?.reels || 1;
    const publishedReels = currentMonthData.social?.reels?.filter(c => c.status === 'done').length || 0;
    
    let webTotal = 0; let webDone = 0;
    PROJECT_DATA.website?.phases?.forEach(p => p.tasks.forEach(t => { webTotal++; if(t.status === 'done') webDone++; }));
    const webProgress = webTotal === 0 ? 0 : Math.round((webDone / webTotal) * 100);

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden print:bg-white print:text-slate-900 print:shadow-none print:border-b-4 print:border-indigo-600 print:rounded-none print:p-0 print:pb-6">
          <div className="absolute top-0 right-0 p-8 opacity-10 print:hidden"><Globe className="w-48 h-48" /></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <Badge type={isReadOnly ? 'success' : 'info'} className="print:hidden">{isReadOnly ? 'Client Portal' : 'Agency Operations View'}</Badge>
              <h1 className="text-3xl font-bold mt-3 print:text-4xl">{client?.name}</h1>
              <p className="text-indigo-200 mt-1 text-lg print:text-slate-600">Monthly Progress ({selectedMonth})</p>
            </div>
            
            {/* Timeline & Financials Card */}
            <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10 w-full md:w-auto print:text-left print:bg-slate-50 print:border-slate-200 print:text-slate-800">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-indigo-200 print:text-slate-500">Onboarded:</span> <strong>{client?.onboardedAt || 'N/A'}</strong></div>
                <div><span className="text-indigo-200 print:text-slate-500">Next Bill:</span> <strong>{client?.nextBilling || 'N/A'}</strong></div>
                
                {canViewFinancials && (
                  <>
                    <div className="col-span-2 border-t border-white/10 my-1 pt-2"></div>
                    <div><span className="text-indigo-200 print:text-slate-500">Mo. Retainer:</span> <span className="font-bold text-emerald-400">₹{totalRetainer.toLocaleString('en-IN')}</span></div>
                    <div><span className="text-indigo-200 print:text-slate-500">Ad Budget:</span> <span className="font-bold text-blue-400">₹{adBudget.toLocaleString('en-IN')}</span></div>
                    {feeWeb > 0 && <div className="col-span-2"><span className="text-indigo-200 print:text-slate-500">Web Dev Fee (One-Time):</span> <span className="font-bold text-emerald-400">₹{feeWeb.toLocaleString('en-IN')}</span></div>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {client?.services.seo && (
            <>
              <Card className="p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">SEO Blogs</span>
                  <FileText className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{publishedBlogs}</span>
                  <span className="text-sm text-slate-500 font-medium">/ {tBlogs} Target</span>
                </div>
                <ProgressBar progress={(publishedBlogs / tBlogs) * 100} color="bg-emerald-500" />
              </Card>

              <Card className="p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Backlinks Live</span>
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{completedBacklinks}</span>
                  <span className="text-sm text-slate-500 font-medium">/ {tBacklinks} Target</span>
                </div>
                <ProgressBar progress={(completedBacklinks / tBacklinks) * 100} color="bg-blue-500" />
              </Card>
            </>
          )}

          {client?.services.social && (
            <Card className="p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Social Reels</span>
                <PlayCircle className="w-5 h-5 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{publishedReels}</span>
                <span className="text-sm text-slate-500 font-medium">/ {tReels} Target</span>
              </div>
              <ProgressBar progress={(publishedReels / tReels) * 100} color="bg-rose-500" />
            </Card>
          )}

          {client?.services.web && (
            <Card className="p-5 flex flex-col justify-between border-l-4 border-l-indigo-500 print:border-l-indigo-500">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Website Build</span>
                <Globe className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{webProgress}%</span>
                <span className="text-sm text-slate-500 font-medium">Completed</span>
              </div>
              <ProgressBar progress={webProgress} color="bg-indigo-500" />
            </Card>
          )}

          {client?.services.ads && (
            <Card className="p-5 flex flex-col justify-between border-l-4 border-l-blue-500 print:border-l-blue-500">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Google Ads ROAS</span>
                <Megaphone className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{currentMonthData.ads?.google?.roas || 0}x</span>
              </div>
              <ProgressBar progress={100} color="bg-blue-500" />
            </Card>
          )}
        </div>

        {/* CLIENT ASSETS & SHARED LINKS */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Link className="w-5 h-5 text-indigo-500" /> Client Deliverables & Shared Links ({selectedMonth})
            </h3>
            {!isReadOnly && (
              <button onClick={() => {
                const title = prompt("Enter Link Title (e.g. GA4 Live Report):");
                const url = prompt("Enter full URL (https://...):");
                if(title && url) {
                  const newData = {...PROJECT_DATA};
                  newData.months[selectedMonth].sharedAssets.push({ id: Date.now(), title, url, date: new Date().toLocaleDateString('en-GB') });
                  saveToCloud(newData);
                }
              }} className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 print:hidden">
                <Plus className="w-4 h-4" /> Add Asset Link
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentMonthData.sharedAssets?.map((asset) => (
              <div key={asset.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-start justify-between bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition-shadow">
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-800 dark:text-white mb-1 truncate">{asset.title}</p>
                  <p className="text-xs text-slate-500 mb-3">Added: {asset.date}</p>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 truncate">
                    Open Link <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
                {!isReadOnly && (
                  <button onClick={() => {
                    if(!window.confirm("Remove this link?")) return;
                    const newData = {...PROJECT_DATA};
                    newData.months[selectedMonth].sharedAssets = newData.months[selectedMonth].sharedAssets.filter(l => l.id !== asset.id);
                    saveToCloud(newData);
                  }} className="text-slate-400 hover:text-rose-500 p-1 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {(!currentMonthData.sharedAssets || currentMonthData.sharedAssets.length === 0) && (
              <div className="col-span-full p-4 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                No deliverables shared for {selectedMonth} yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderAdsTab = () => {
    if(!PROJECT_DATA || !currentMonthData) return null;
    
    const handleAdUpdate = (platform, field, value) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].ads[platform][field] = value;
      saveToCloud(newData);
    };

    const handleTaskUpdate = (platform, idx, field, value) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].ads[platform].tasks[idx][field] = value;
      saveToCloud(newData);
    };

    const addTask = (platform) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].ads[platform].tasks.push({ id: Date.now(), task: 'New Ad Task', assignee: '', status: 'pending' });
      saveToCloud(newData);
    };

    const removeTask = (platform, id) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].ads[platform].tasks = newData.months[selectedMonth].ads[platform].tasks.filter(t => t.id !== id);
      saveToCloud(newData);
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Performance Marketing ({selectedMonth})</h2>
        </div>

        {/* GOOGLE ADS */}
        <Card className="p-6 border-t-4 border-t-blue-500">
          <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <SearchIcon className="w-6 h-6 text-blue-500" /> Google Ads Tracking
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Ad Spend</p>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">₹</span>
                <input type="number" value={currentMonthData.ads.google.spent} onChange={e => handleAdUpdate('google', 'spent', e.target.value)} className={`${inputClass} font-bold text-lg text-rose-600`} />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Conversions</p>
              <input type="number" value={currentMonthData.ads.google.conversions} onChange={e => handleAdUpdate('google', 'conversions', e.target.value)} className={`${inputClass} font-bold text-lg text-emerald-600`} />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">CPA (Cost/Acq)</p>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">₹</span>
                <input type="number" value={currentMonthData.ads.google.cpa} onChange={e => handleAdUpdate('google', 'cpa', e.target.value)} className={`${inputClass} font-bold text-lg`} />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase mb-1">Target ROAS</p>
              <div className="flex items-center gap-1">
                <input type="number" value={currentMonthData.ads.google.roas} onChange={e => handleAdUpdate('google', 'roas', e.target.value)} className={`${inputClass} w-16 font-black text-xl text-blue-700 dark:text-blue-400`} />
                <span className="font-bold text-blue-700 dark:text-blue-400">x</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Campaign Execution Workflow</p>
              {!isReadOnly && <button onClick={() => addTask('google')} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">+ Add Task</button>}
            </div>
            {currentMonthData.ads.google.tasks.map((t, idx) => (
              <div key={t.id} className="flex items-center justify-between p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  {getStatusIcon(t.status)}
                  <input type="text" value={t.task} onChange={(e) => handleTaskUpdate('google', idx, 'task', e.target.value)} className={`${inputClass} text-sm font-medium`} />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <input type="text" value={t.assignee} onChange={(e) => handleTaskUpdate('google', idx, 'assignee', e.target.value)} placeholder="Assignee..." className={`${inputClass} text-sm w-28 border border-slate-200 rounded px-2 print:hidden`} />
                  {renderStatusDropdown(t.status, (val) => handleTaskUpdate('google', idx, 'status', val))}
                  <span className="hidden print:inline-block font-bold text-xs uppercase w-24 text-right">{t.status}</span>
                  {!isReadOnly && <button onClick={() => removeTask('google', t.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* META ADS */}
        <Card className="p-6 border-t-4 border-t-purple-500">
          <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-500" /> Meta Ads Management
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Ad Spend</p>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">₹</span>
                <input type="number" value={currentMonthData.ads.meta.spent} onChange={e => handleAdUpdate('meta', 'spent', e.target.value)} className={`${inputClass} font-bold text-lg text-rose-600`} />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Leads</p>
              <input type="number" value={currentMonthData.ads.meta.leads} onChange={e => handleAdUpdate('meta', 'leads', e.target.value)} className={`${inputClass} font-bold text-lg text-emerald-600`} />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">CPR (Cost/Lead)</p>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">₹</span>
                <input type="number" value={currentMonthData.ads.meta.cpr} onChange={e => handleAdUpdate('meta', 'cpr', e.target.value)} className={`${inputClass} font-bold text-lg`} />
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-700 dark:text-purple-400 font-bold uppercase mb-1">Ad Reach</p>
              <input type="number" value={currentMonthData.ads.meta.reach} onChange={e => handleAdUpdate('meta', 'reach', e.target.value)} className={`${inputClass} font-bold text-lg text-purple-700 dark:text-purple-400`} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Campaign Execution Workflow</p>
              {!isReadOnly && <button onClick={() => addTask('meta')} className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100">+ Add Task</button>}
            </div>
            {currentMonthData.ads.meta.tasks.map((t, idx) => (
              <div key={t.id} className="flex items-center justify-between p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  {getStatusIcon(t.status)}
                  <input type="text" value={t.task} onChange={(e) => handleTaskUpdate('meta', idx, 'task', e.target.value)} className={`${inputClass} text-sm font-medium`} />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <input type="text" value={t.assignee} onChange={(e) => handleTaskUpdate('meta', idx, 'assignee', e.target.value)} placeholder="Assignee..." className={`${inputClass} text-sm w-28 border border-slate-200 rounded px-2 print:hidden`} />
                  {renderStatusDropdown(t.status, (val) => handleTaskUpdate('meta', idx, 'status', val))}
                  <span className="hidden print:inline-block font-bold text-xs uppercase w-24 text-right">{t.status}</span>
                  {!isReadOnly && <button onClick={() => removeTask('meta', t.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderSEOTab = () => {
    if(!PROJECT_DATA || !currentMonthData) return null;
    const client = getActiveClientObj();
    const tKw = client?.targets?.keywords || 10;
    const tBlogs = client?.targets?.blogs || 4;
    const tBacklinks = client?.targets?.backlinks || 50;
    
    // Global Keywords Update
    const handleGlobalKwUpdate = (index, field, value) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.seoKeywords[index][field] = value;
      saveToCloud(newData);
    };

    // Monthly Arrays Update
    const handleMonthlyArrayUpdate = (arrayName, index, field, value) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].seo[arrayName][index][field] = value;
      if (field === 'status' && (value === 'published' || value === 'Live' || value === 'done')) {
        newData.months[selectedMonth].seo[arrayName][index].completedAt = new Date().toLocaleDateString('en-GB');
      } else if (field === 'status') {
        newData.months[selectedMonth].seo[arrayName][index].completedAt = null; 
      }
      saveToCloud(newData);
    };

    const addRow = (arrayName, defaultObj) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      if (!newData.months[selectedMonth].seo[arrayName]) newData.months[selectedMonth].seo[arrayName] = [];
      newData.months[selectedMonth].seo[arrayName].push({ id: Date.now(), ...defaultObj });
      saveToCloud(newData);
    };

    const removeRow = (arrayName, id) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].seo[arrayName] = newData.months[selectedMonth].seo[arrayName].filter(x => x.id !== id);
      saveToCloud(newData);
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">SEO Operations ({selectedMonth})</h2>
        </div>

        {/* KEYWORDS */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Long-Term Keyword Tracking ({PROJECT_DATA.seoKeywords.length}/{tKw} Monitored)
            </h3>
            {!isReadOnly && (
              <button onClick={() => {
                const newData = { ...PROJECT_DATA };
                newData.seoKeywords.push({ id: Date.now(), keyword: 'New Keyword', volume: '', initial: '-', m1: '-', m2: '-', m3: '-', m6: '-' });
                saveToCloud(newData);
              }} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 print:hidden">
                <Plus className="w-3 h-3" /> Add KW
              </button>
            )}
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 font-medium">Keyword</th>
                  <th className="p-3 font-medium">Vol</th>
                  <th className="p-3 font-medium border-l border-slate-200 dark:border-slate-700">Initial</th>
                  <th className="p-3 font-medium">Month 1</th>
                  <th className="p-3 font-medium">Month 2</th>
                  <th className="p-3 font-medium">Month 3</th>
                  <th className="p-3 font-medium bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700">Goal</th>
                  {!isReadOnly && <th className="p-3 print:hidden"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {PROJECT_DATA.seoKeywords?.map((kw, idx) => (
                  <tr key={kw.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3"><input type="text" value={kw.keyword} onChange={(e) => handleGlobalKwUpdate(idx, 'keyword', e.target.value)} className={`${inputClass} font-medium`} /></td>
                    <td className="p-3"><input type="text" value={kw.volume} onChange={(e) => handleGlobalKwUpdate(idx, 'volume', e.target.value)} className={`${inputClass} w-16 text-slate-500`} /></td>
                    <td className="p-3 border-l border-slate-200 dark:border-slate-700"><input type="text" value={kw.initial} onChange={(e) => handleGlobalKwUpdate(idx, 'initial', e.target.value)} className={`${inputClass} w-10 text-slate-500 text-center`} /></td>
                    <td className="p-3"><input type="text" value={kw.m1} onChange={(e) => handleGlobalKwUpdate(idx, 'm1', e.target.value)} className={`${inputClass} w-10 text-emerald-600 font-semibold text-center`} /></td>
                    <td className="p-3"><input type="text" value={kw.m2} onChange={(e) => handleGlobalKwUpdate(idx, 'm2', e.target.value)} className={`${inputClass} w-10 text-emerald-600 font-semibold text-center`} /></td>
                    <td className="p-3"><input type="text" value={kw.m3} onChange={(e) => handleGlobalKwUpdate(idx, 'm3', e.target.value)} className={`${inputClass} w-10 text-emerald-600 font-semibold text-center`} /></td>
                    <td className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10"><input type="text" value={kw.m6} onChange={(e) => handleGlobalKwUpdate(idx, 'm6', e.target.value)} className={`${inputClass} w-10 text-indigo-600 font-bold text-center`} /></td>
                    {!isReadOnly && (
                      <td className="p-3 text-right print:hidden">
                        <button onClick={() => {
                          const newData = {...PROJECT_DATA};
                          newData.seoKeywords = newData.seoKeywords.filter(x => x.id !== kw.id);
                          saveToCloud(newData);
                        }} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ON-PAGE SEO PIPELINE */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <SearchIcon className="w-5 h-5 text-indigo-500" /> On-Page SEO Activities
            </h3>
            {!isReadOnly && <button onClick={() => addRow('onPage', {page: 'New Page/Activity', assignee: '', status: 'pending'})} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 print:hidden"><Plus className="w-3 h-3" /> Add Activity</button>}
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg max-h-[300px] overflow-y-auto print:max-h-max print:overflow-visible">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                <tr>
                  <th className="p-3 font-medium w-2/5">Page / Activity</th>
                  <th className="p-3 font-medium print:hidden">Assignee</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Completion Date</th>
                  {!isReadOnly && <th className="p-3 print:hidden"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {currentMonthData.seo?.onPage?.map((op, idx) => (
                  <tr key={op.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 flex items-center gap-2">
                      {getStatusIcon(op.status)}
                      <input type="text" value={op.page || ''} onChange={(e) => handleMonthlyArrayUpdate('onPage', idx, 'page', e.target.value)} className={`${inputClass} font-medium`} />
                    </td>
                    <td className="p-3 print:hidden"><input type="text" value={op.assignee} onChange={(e) => handleMonthlyArrayUpdate('onPage', idx, 'assignee', e.target.value)} className={`${inputClass} border border-slate-200 rounded px-2 w-36`} /></td>
                    <td className="p-3">
                      {renderStatusDropdown(op.status, (val) => handleMonthlyArrayUpdate('onPage', idx, 'status', val))}
                      <span className="hidden print:inline-block font-bold text-xs uppercase">{op.status}</span>
                    </td>
                    <td className="p-3 text-right text-xs text-slate-500 font-medium">{op.completedAt ? <Badge type="success">{op.completedAt}</Badge> : '-'}</td>
                    {!isReadOnly && <td className="p-3 text-right print:hidden"><button onClick={() => removeRow('onPage', op.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* BLOGS */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> Monthly Content Production (Target: {tBlogs})
            </h3>
            {!isReadOnly && <button onClick={() => addRow('blogs', {title: 'New Blog Idea', assignee: '', status: 'pending'})} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 print:hidden"><Plus className="w-3 h-3" /> Add Blog</button>}
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg max-h-[300px] overflow-y-auto print:max-h-max print:overflow-visible">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                <tr>
                  <th className="p-3 font-medium w-2/5">Topic</th>
                  <th className="p-3 font-medium print:hidden">Writer/Editor</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Published Date</th>
                  {!isReadOnly && <th className="p-3 print:hidden"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {currentMonthData.seo?.blogs?.map((blog, idx) => (
                  <tr key={blog.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 flex items-center gap-2">
                      {getStatusIcon(blog.status)}
                      <input type="text" value={blog.title} onChange={(e) => handleMonthlyArrayUpdate('blogs', idx, 'title', e.target.value)} className={`${inputClass} font-medium`} />
                    </td>
                    <td className="p-3 print:hidden"><input type="text" value={blog.assignee} onChange={(e) => handleMonthlyArrayUpdate('blogs', idx, 'assignee', e.target.value)} className={`${inputClass} border border-slate-200 rounded px-2 w-36`} /></td>
                    <td className="p-3">
                      {renderStatusDropdown(blog.status, (val) => handleMonthlyArrayUpdate('blogs', idx, 'status', val))}
                      <span className="hidden print:inline-block font-bold text-xs uppercase">{blog.status}</span>
                    </td>
                    <td className="p-3 text-right text-xs text-slate-500 font-medium">{blog.completedAt ? <Badge type="success">{blog.completedAt}</Badge> : '-'}</td>
                    {!isReadOnly && <td className="p-3 text-right print:hidden"><button onClick={() => removeRow('blogs', blog.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* BACKLINKS */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" /> Off-Page SEO / Backlinks (Target: {tBacklinks})
            </h3>
            {!isReadOnly && <button onClick={() => addRow('backlinks', {website: 'example.com', url: '', status: 'pending'})} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 print:hidden"><Plus className="w-3 h-3" /> Add Link</button>}
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg max-h-[400px] overflow-y-auto print:max-h-max print:overflow-visible">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                <tr>
                  <th className="p-3 font-medium">Domain (DA)</th>
                  <th className="p-3 font-medium w-2/5">Target URL</th>
                  <th className="p-3 font-medium">Status</th>
                  {!isReadOnly && <th className="p-3 print:hidden"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {currentMonthData.seo?.backlinks?.map((bl, idx) => (
                  <tr key={bl.id}>
                    <td className="p-3"><input type="text" value={bl.website} onChange={(e) => handleMonthlyArrayUpdate('backlinks', idx, 'website', e.target.value)} className={`${inputClass} font-medium`} /></td>
                    <td className="p-3"><input type="text" value={bl.url} onChange={(e) => handleMonthlyArrayUpdate('backlinks', idx, 'url', e.target.value)} className={`${inputClass} text-slate-500 text-xs`} /></td>
                    <td className="p-3">
                      {renderStatusDropdown(bl.status, (val) => handleMonthlyArrayUpdate('backlinks', idx, 'status', val))}
                      <span className="hidden print:inline-block font-bold text-xs uppercase">{bl.status}</span>
                    </td>
                    {!isReadOnly && <td className="p-3 text-right print:hidden"><button onClick={() => removeRow('backlinks', bl.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* TECHNICAL SEO */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" /> Technical SEO Checklist
            </h3>
            {!isReadOnly && <button onClick={() => addRow('techChecklist', {task: 'New Tech Task', assignee: '', status: 'pending'})} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 print:hidden"><Plus className="w-3 h-3" /> Add Task</button>}
          </div>
          <div className="space-y-3">
            {currentMonthData.seo?.techChecklist?.map((tech, idx) => (
              <div key={tech.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2 flex-1">
                  {getStatusIcon(tech.status)}
                  <input type="text" value={tech.task || ''} onChange={(e) => handleMonthlyArrayUpdate('techChecklist', idx, 'task', e.target.value)} className={`${inputClass} text-sm font-medium`} />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <input type="text" value={tech.assignee} onChange={(e) => handleMonthlyArrayUpdate('techChecklist', idx, 'assignee', e.target.value)} placeholder="Assignee..." className={`${inputClass} text-sm w-28 border border-slate-200 rounded px-2 print:hidden`} />
                  {renderStatusDropdown(tech.status, (val) => handleMonthlyArrayUpdate('techChecklist', idx, 'status', val))}
                  <span className="hidden print:inline-block font-bold text-xs uppercase w-24 text-right">{tech.status}</span>
                  {!isReadOnly && <button onClick={() => removeRow('techChecklist', tech.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>}
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    );
  };

  const renderSocialTab = () => {
    if(!PROJECT_DATA || !currentMonthData) return null;
    const client = getActiveClientObj();
    const tReels = client?.targets?.reels || 10;
    const tPosts = client?.targets?.posts || 4;

    const handleArrayUpdate = (arrayName, index, field, value) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].social[arrayName][index][field] = value;
      if (field === 'status' && value === 'done') newData.months[selectedMonth].social[arrayName][index].completedAt = new Date().toLocaleDateString('en-GB');
      else if (field === 'status') newData.months[selectedMonth].social[arrayName][index].completedAt = null;
      saveToCloud(newData);
    };

    const addRow = (arrayName, defaultObj) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].social[arrayName].push({ id: Date.now(), ...defaultObj });
      saveToCloud(newData);
    };

    const removeRow = (arrayName, id) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].social[arrayName] = newData.months[selectedMonth].social[arrayName].filter(x => x.id !== id);
      saveToCloud(newData);
    };

    const renderTable = (arrayName, title, target, icon) => (
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
            {icon} {title} (Target: {target})
          </h3>
          {!isReadOnly && <button onClick={() => addRow(arrayName, {topic: 'New Content Idea', assignee: '', status: 'pending'})} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 print:hidden"><Plus className="w-3 h-3" /> Add Row</button>}
        </div>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg max-h-[400px] overflow-y-auto print:max-h-max print:overflow-visible">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-700 sticky top-0">
              <tr>
                <th className="p-3 font-medium w-2/5">Concept / Script</th>
                <th className="p-3 font-medium print:hidden">Creator/Editor</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Publish Date</th>
                {!isReadOnly && <th className="p-3 print:hidden"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {currentMonthData.social?.[arrayName]?.map((content, idx) => (
                <tr key={content.id}>
                  <td className="p-3 flex items-center gap-2">
                    {getStatusIcon(content.status)}
                    <input type="text" value={content.topic} onChange={(e) => handleArrayUpdate(arrayName, idx, 'topic', e.target.value)} className={`${inputClass} font-medium`} />
                  </td>
                  <td className="p-3 print:hidden"><input type="text" value={content.assignee} onChange={(e) => handleArrayUpdate(arrayName, idx, 'assignee', e.target.value)} className={`${inputClass} border border-slate-200 rounded px-2 w-36`} /></td>
                  <td className="p-3">
                    {renderStatusDropdown(content.status, (val) => handleArrayUpdate(arrayName, idx, 'status', val))}
                    <span className="hidden print:inline-block font-bold text-xs uppercase">{content.status}</span>
                  </td>
                  <td className="p-3 text-right text-xs text-slate-500 font-medium">{content.completedAt ? <Badge type="success">{content.completedAt}</Badge> : '-'}</td>
                  {!isReadOnly && <td className="p-3 text-right print:hidden"><button onClick={() => removeRow(arrayName, content.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Social Media Operations ({selectedMonth})</h2>
        </div>
        {renderTable('reels', 'Video Reels Calendar', tReels, <Share2 className="w-5 h-5 text-rose-500" />)}
        {renderTable('posts', 'Static Posts Calendar', tPosts, <Layout className="w-5 h-5 text-blue-500" />)}
      </div>
    );
  };

  const renderWebsiteTab = () => {
    if(!PROJECT_DATA) return null;
    const handleTaskUpdate = (pIdx, tIdx, field, value) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.website.phases[pIdx].tasks[tIdx][field] = value;
      if (field === 'status' && value === 'done') newData.website.phases[pIdx].tasks[tIdx].completedAt = new Date().toLocaleDateString('en-GB');
      else if (field === 'status') newData.website.phases[pIdx].tasks[tIdx].completedAt = null;
      saveToCloud(newData);
    };

    const addTask = (pIdx) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.website.phases[pIdx].tasks.push({ id: Date.now(), name: 'New Task', assignee: '', status: 'pending', due: '' });
      saveToCloud(newData);
    };

    const removeTask = (pIdx, tId) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.website.phases[pIdx].tasks = newData.website.phases[pIdx].tasks.filter(t => t.id !== tId);
      saveToCloud(newData);
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Website Project Tracking</h2>
        </div>
        
        {PROJECT_DATA.website?.phases?.map((phase, pIdx) => (
          <Card key={phase.id} className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{phase.name}</h3>
              {!isReadOnly && <button onClick={() => addTask(pIdx)} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 print:hidden">+ Add Task</button>}
            </div>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 font-medium w-1/3">Task</th>
                    <th className="p-3 font-medium print:hidden">Assignee</th>
                    <th className="p-3 font-medium">Due Date</th>
                    <th className="p-3 font-medium">Status</th>
                    {!isReadOnly && <th className="p-3 print:hidden"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {phase.tasks.map((task, tIdx) => (
                    <tr key={task.id}>
                      <td className="p-3 flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <input type="text" value={task.name} onChange={(e) => handleTaskUpdate(pIdx, tIdx, 'name', e.target.value)} className={`${inputClass} font-medium`} />
                      </td>
                      <td className="p-3 print:hidden">
                        <input type="text" value={task.assignee} onChange={(e) => handleTaskUpdate(pIdx, tIdx, 'assignee', e.target.value)} className={`${inputClass} border border-slate-200 rounded px-2 w-36`} />
                      </td>
                      <td className="p-3">
                        <input type="text" value={task.due} onChange={(e) => handleTaskUpdate(pIdx, tIdx, 'due', e.target.value)} placeholder="DD/MM/YYYY" className={`${inputClass} w-24 text-xs`} />
                      </td>
                      <td className="p-3">
                        {renderStatusDropdown(task.status, (val) => handleTaskUpdate(pIdx, tIdx, 'status', val))}
                        <span className="hidden print:inline-block font-bold text-xs uppercase">{task.status}</span>
                      </td>
                      {!isReadOnly && <td className="p-3 text-right print:hidden"><button onClick={() => removeTask(pIdx, task.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderReportsTab = () => {
    if(!PROJECT_DATA || !currentMonthData) return null;
    const handleReportUpload = (field) => {
      if(isReadOnly) return;
      const newData = { ...PROJECT_DATA };
      newData.months[selectedMonth].reports[field] = !newData.months[selectedMonth].reports[field];
      saveToCloud(newData);
    };

    const generatePDF = () => {
      setActiveTab('overview');
      setTimeout(() => { window.print(); }, 500); 
    };

    const rStatus = currentMonthData.reports;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reporting Engine ({selectedMonth})</h2>
          <button onClick={generatePDF} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95">
            <Printer className="w-5 h-5" /> Download PDF Overview
          </button>
        </div>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Delivery Checklist</h3>
            <Badge type={rStatus.master ? 'success' : 'warning'}>{rStatus.master ? 'Cycle Closed' : 'In Progress'}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`border rounded-xl p-4 flex flex-col items-center text-center transition-all ${rStatus.ga4 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <BarChart className={`w-6 h-6 mb-2 ${rStatus.ga4 ? 'text-emerald-500' : 'text-slate-400'}`} />
              <h4 className="font-bold text-slate-800 text-sm mb-2">GA4 Traffic</h4>
              <button onClick={() => handleReportUpload('ga4')} disabled={isReadOnly} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-full justify-center ${rStatus.ga4 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'} ${isReadOnly && 'opacity-50'}`}>
                {rStatus.ga4 ? <CheckCircle2 className="w-3 h-3"/> : <UploadCloud className="w-3 h-3"/>} {rStatus.ga4 ? 'Ready' : 'Pending'}
              </button>
            </div>
            <div className={`border rounded-xl p-4 flex flex-col items-center text-center transition-all ${rStatus.gsc ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <SearchIcon className={`w-6 h-6 mb-2 ${rStatus.gsc ? 'text-emerald-500' : 'text-slate-400'}`} />
              <h4 className="font-bold text-slate-800 text-sm mb-2">Search Console</h4>
              <button onClick={() => handleReportUpload('gsc')} disabled={isReadOnly} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-full justify-center ${rStatus.gsc ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'} ${isReadOnly && 'opacity-50'}`}>
                {rStatus.gsc ? <CheckCircle2 className="w-3 h-3"/> : <UploadCloud className="w-3 h-3"/>} {rStatus.gsc ? 'Ready' : 'Pending'}
              </button>
            </div>
            <div className={`border rounded-xl p-4 flex flex-col items-center text-center transition-all ${rStatus.social ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <Share2 className={`w-6 h-6 mb-2 ${rStatus.social ? 'text-emerald-500' : 'text-slate-400'}`} />
              <h4 className="font-bold text-slate-800 text-sm mb-2">Social Insights</h4>
              <button onClick={() => handleReportUpload('social')} disabled={isReadOnly} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-full justify-center ${rStatus.social ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'} ${isReadOnly && 'opacity-50'}`}>
                {rStatus.social ? <CheckCircle2 className="w-3 h-3"/> : <UploadCloud className="w-3 h-3"/>} {rStatus.social ? 'Ready' : 'Pending'}
              </button>
            </div>
            <div className={`border rounded-xl p-4 flex flex-col items-center text-center transition-all ${rStatus.ads ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <Megaphone className={`w-6 h-6 mb-2 ${rStatus.ads ? 'text-emerald-500' : 'text-slate-400'}`} />
              <h4 className="font-bold text-slate-800 text-sm mb-2">Ads Report</h4>
              <button onClick={() => handleReportUpload('ads')} disabled={isReadOnly} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-full justify-center ${rStatus.ads ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'} ${isReadOnly && 'opacity-50'}`}>
                {rStatus.ads ? <CheckCircle2 className="w-3 h-3"/> : <UploadCloud className="w-3 h-3"/>} {rStatus.ads ? 'Ready' : 'Pending'}
              </button>
            </div>
          </div>

          {!isReadOnly && (
            <div className="bg-indigo-50 p-4 rounded-xl flex items-center justify-between border border-indigo-100">
              <div>
                <h4 className="font-bold text-indigo-900">Final Client Delivery</h4>
                <p className="text-xs text-indigo-700">Lock the cycle once all reports are sent to the client.</p>
              </div>
              <button onClick={() => handleReportUpload('master')} className={`px-6 py-2 rounded-lg font-bold transition-all ${rStatus.master ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                {rStatus.master ? '✅ Locked & Delivered' : 'Mark as Delivered'}
              </button>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderAgencySettingsTab = () => {
    // Users Management
    const handleCreateUser = () => {
      if (!newUserUsername || !newUserPassword || !newUserName) return alert('Please fill all fields');
      const newUsersList = [...appUsers.userList];
      if (newUsersList.find(u => u.username === newUserUsername)) return alert('Username exists.');
      
      const userObj: any = { id: Date.now(), username: newUserUsername, password: newUserPassword, name: newUserName, role: newUserRole };
      if(newUserRole === 'Client View') userObj.assignedClientId = activeClientId;
      
      newUsersList.push(userObj);
      saveUsersToCloud({ userList: newUsersList });
      setNewUserUsername(''); setNewUserPassword(''); setNewUserName('');
    };

    // Client Management
    const handleSaveClient = () => {
      if (!clientFormName) return alert('Client name required');
      const newList = [...appClients.list];
      
      const clientObj = {
        id: clientFormId || `client_${Date.now()}`,
        name: clientFormName,
        onboardedAt: clientFormOnboard,
        nextBilling: clientFormBilling,
        services: { web: clientServWeb, seo: clientServSeo, social: clientServSocial, ads: clientServAds },
        fees: { web: Number(clientFeeWeb), seo: Number(clientFeeSeo), social: Number(clientFeeSocial), ads: Number(clientFeeAds), adBudget: Number(clientAdBudget) },
        targets: { keywords: Number(clientTargetKw), blogs: Number(clientTargetBlogs), backlinks: Number(clientTargetBacklinks), reels: Number(clientTargetReels), posts: Number(clientTargetPosts) }
      };

      if (clientFormId) {
        const index = newList.findIndex(c => c.id === clientFormId);
        if(index > -1) newList[index] = clientObj;
      } else {
        newList.push(clientObj);
      }

      saveClientsToCloud({ list: newList });
      resetClientForm();
      alert("Client Saved Successfully!");
    };

    const loadClientToForm = (c) => {
      setClientFormId(c.id); setClientFormName(c.name); setClientFormOnboard(c.onboardedAt || ''); setClientFormBilling(c.nextBilling || '');
      setClientServWeb(c.services.web); setClientFeeWeb(c.fees?.web || '');
      setClientServSeo(c.services.seo); setClientFeeSeo(c.fees?.seo || ''); setClientTargetKw(c.targets?.keywords || 10); setClientTargetBlogs(c.targets?.blogs || 4); setClientTargetBacklinks(c.targets?.backlinks || 50);
      setClientServSocial(c.services.social); setClientFeeSocial(c.fees?.social || ''); setClientTargetReels(c.targets?.reels || 10); setClientTargetPosts(c.targets?.posts || 4);
      setClientServAds(c.services.ads); setClientFeeAds(c.fees?.ads || ''); setClientAdBudget(c.fees?.adBudget || '');
    };

    const resetClientForm = () => {
      setClientFormId(''); setClientFormName(''); setClientFormOnboard(''); setClientFormBilling('');
      setClientServWeb(false); setClientFeeWeb('');
      setClientServSeo(false); setClientFeeSeo(''); setClientTargetKw(''); setClientTargetBlogs(''); setClientTargetBacklinks('');
      setClientServSocial(false); setClientFeeSocial(''); setClientTargetReels(''); setClientTargetPosts('');
      setClientServAds(false); setClientFeeAds(''); setClientAdBudget('');
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Agency Operations & Sales Engine</h2>
        
        {/* ADD/EDIT CLIENT SECTION (Sales/Admin) */}
        <Card className="p-6 border-t-4 border-t-emerald-500 bg-emerald-50/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building className="w-6 h-6 text-emerald-600" /> {clientFormId ? 'Edit Client Configuration' : 'Onboard New Client'}
            </h3>
            {clientFormId && <button onClick={resetClientForm} className="text-sm text-slate-500 hover:text-slate-700 underline">Cancel Edit</button>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-slate-200 pb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name</label>
              <input type="text" value={clientFormName} onChange={e=>setClientFormName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Onboarding Date</label>
              <input type="date" value={clientFormOnboard} onChange={e=>setClientFormOnboard(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Next Billing Date</label>
              <input type="date" value={clientFormBilling} onChange={e=>setClientFormBilling(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-slate-700 uppercase tracking-wide text-sm mb-4">Services, Billing & Monthly Targets</h4>
            
            {/* WEB SERVICE */}
            <div className={`p-4 rounded-xl border transition-colors ${clientServWeb ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" checked={clientServWeb} onChange={e=>setClientServWeb(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
                <span className="font-bold text-lg text-slate-800">Website Development</span>
              </div>
              {clientServWeb && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">One-Time Fee (₹)</label>
                    <input type="number" value={clientFeeWeb} onChange={e=>setClientFeeWeb(e.target.value)} className="w-full p-2 border border-indigo-200 rounded outline-none" />
                  </div>
                </div>
              )}
            </div>

            {/* SEO SERVICE */}
            <div className={`p-4 rounded-xl border transition-colors ${clientServSeo ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" checked={clientServSeo} onChange={e=>setClientServSeo(e.target.checked)} className="w-5 h-5 accent-emerald-600" />
                <span className="font-bold text-lg text-slate-800">SEO Management</span>
              </div>
              {clientServSeo && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Monthly Fee (₹)</label>
                    <input type="number" value={clientFeeSeo} onChange={e=>setClientFeeSeo(e.target.value)} className="w-full p-2 border border-emerald-200 rounded outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Target Keywords</label>
                    <input type="number" value={clientTargetKw} onChange={e=>setClientTargetKw(e.target.value)} className="w-full p-2 border border-emerald-200 rounded outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Target Blogs/Mo</label>
                    <input type="number" value={clientTargetBlogs} onChange={e=>setClientTargetBlogs(e.target.value)} className="w-full p-2 border border-emerald-200 rounded outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Target Backlinks/Mo</label>
                    <input type="number" value={clientTargetBacklinks} onChange={e=>setClientTargetBacklinks(e.target.value)} className="w-full p-2 border border-emerald-200 rounded outline-none" />
                  </div>
                </div>
              )}
            </div>

            {/* SOCIAL SERVICE */}
            <div className={`p-4 rounded-xl border transition-colors ${clientServSocial ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" checked={clientServSocial} onChange={e=>setClientServSocial(e.target.checked)} className="w-5 h-5 accent-rose-600" />
                <span className="font-bold text-lg text-slate-800">Social Media</span>
              </div>
              {clientServSocial && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Monthly Fee (₹)</label>
                    <input type="number" value={clientFeeSocial} onChange={e=>setClientFeeSocial(e.target.value)} className="w-full p-2 border border-rose-200 rounded outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Target Reels/Mo</label>
                    <input type="number" value={clientTargetReels} onChange={e=>setClientTargetReels(e.target.value)} className="w-full p-2 border border-rose-200 rounded outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Target Posts/Mo</label>
                    <input type="number" value={clientTargetPosts} onChange={e=>setClientTargetPosts(e.target.value)} className="w-full p-2 border border-rose-200 rounded outline-none" />
                  </div>
                </div>
              )}
            </div>

            {/* ADS SERVICE */}
            <div className={`p-4 rounded-xl border transition-colors ${clientServAds ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" checked={clientServAds} onChange={e=>setClientServAds(e.target.checked)} className="w-5 h-5 accent-blue-600" />
                <span className="font-bold text-lg text-slate-800">Performance Ads (Google/Meta)</span>
              </div>
              {clientServAds && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Management Fee (₹)</label>
                    <input type="number" value={clientFeeAds} onChange={e=>setClientFeeAds(e.target.value)} className="w-full p-2 border border-blue-200 rounded outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Total Ad Budget (₹)</label>
                    <input type="number" value={clientAdBudget} onChange={e=>setClientAdBudget(e.target.value)} className="w-full p-2 border border-blue-200 rounded outline-none font-bold text-blue-700" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
            <button onClick={handleSaveClient} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-md text-lg">
              {clientFormId ? 'Update Client Details' : 'Save & Onboard Client'}
            </button>
          </div>
        </Card>

        {/* CLIENT LIST (Sales/Admin) */}
        <Card className="p-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4">Manage Active Clients</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr><th className="p-3">Client Name</th><th className="p-3">Services</th><th className="p-3">Total Mgt Retainer</th><th className="p-3 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appClients.list.map(c => {
                  const retainer = (c.fees?.seo||0) + (c.fees?.social||0) + (c.fees?.ads||0);
                  return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold">{c.name}</td>
                    <td className="p-3 flex gap-1 flex-wrap">
                      {c.services.web && <Badge type="info">Web</Badge>}
                      {c.services.seo && <Badge type="success">SEO</Badge>}
                      {c.services.social && <Badge type="danger">Social</Badge>}
                      {c.services.ads && <Badge type="purple">Ads</Badge>}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">₹{retainer.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => loadClientToForm(c)} className="text-indigo-600 font-bold hover:underline flex items-center gap-1 ml-auto"><Edit className="w-4 h-4"/> Edit</button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </Card>

        {/* TEAM MEMBER SECTION (Super Admin Only) */}
        {teamMemberProfile?.role === 'Super Admin' && (
          <>
            <Card className="p-6 border-t-4 border-t-indigo-500 mt-12">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" /> Create System Access (Staff & Clients)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input type="text" placeholder="Full Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="text" placeholder="Username" value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} className="p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="text" placeholder="Password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="SEO Team">SEO Team</option>
                  <option value="Social Media Team">Social Media Team</option>
                  <option value="Performance Marketing Team">Performance Marketing Team</option>
                  <option value="Web Dev Team">Web Dev Team</option>
                  <option value="Client View">🤝 Client Portal Access</option>
                </select>
              </div>
              {newUserRole === 'Client View' && <p className="text-xs text-amber-600 font-bold mb-3">Note: This client will automatically be assigned to the currently active project in your sidebar ({getActiveClientObj()?.name}).</p>}
              <button onClick={handleCreateUser} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold">Create Account</button>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4">Authorized Logins</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                    <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Username</th><th className="p-3">Password</th><th className="p-3 text-right">Delete</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appUsers.userList.map(u => (
                      <tr key={u.id}>
                        <td className="p-3 font-bold">{u.name}</td>
                        <td className="p-3"><Badge type={u.role === 'Super Admin' ? 'info' : u.role === 'Client View' ? 'success' : 'default'}>{u.role}</Badge></td>
                        <td className="p-3 font-mono">{u.username}</td>
                        <td className="p-3 font-mono text-amber-600 font-bold">{u.password}</td>
                        <td className="p-3 text-right">
                          {u.role !== 'Super Admin' && (
                            <button onClick={() => saveUsersToCloud({ userList: appUsers.userList.filter(x => x.id !== u.id) })} className="text-rose-500 font-bold text-xs hover:underline">Remove</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    );
  };

  // --- SECURE LOGIN LOGIC ---
  const handleLoginSubmit = () => {
    setAuthError('');
    if (appUsers.userList.length === 0) {
      if (!loginUsername || !loginPassword || !loginName) return setAuthError('Fill all fields to setup Admin.');
      const superAdmin = { id: Date.now(), username: loginUsername, password: loginPassword, name: loginName, role: 'Super Admin' };
      saveUsersToCloud({ userList: [superAdmin] });
      setTeamMemberProfile(superAdmin);
      setActiveTab('settings');
      setShowLogin(false);
      return;
    }
    const foundUser = appUsers.userList.find(u => u.username === loginUsername && u.password === loginPassword);
    if (foundUser) {
      setTeamMemberProfile(foundUser);
      if ((foundUser.role === 'Super Admin' || foundUser.role === 'Sales Manager') && appClients.list.length === 0) {
        setActiveTab('settings');
      } else {
        setActiveTab('overview');
      }
      setShowLogin(false);
    } 
    else { setAuthError('Incorrect Login'); }
  };

  if (showLogin) {
    const isFirstTime = isUsersLoaded && appUsers.userList.length === 0;
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <Card className="w-full max-w-md p-8 shadow-xl border-t-8 border-t-indigo-600">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-2">Infusive<span className="text-slate-800 dark:text-white">PMS</span></h1>
            <p className="text-slate-500 text-sm font-medium">Secure Agency Portal</p>
          </div>
          <div className="space-y-4">
            {isFirstTime && <input type="text" placeholder="Full Name" value={loginName} onChange={e => setLoginName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none font-medium" />}
            <input type="text" placeholder="Username" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none font-medium" />
            <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none font-medium" />
            {authError && <p className="text-rose-500 text-sm font-bold text-center mt-2">{authError}</p>}
            <button onClick={handleLoginSubmit} disabled={!isUsersLoaded} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg">
              {!isUsersLoaded ? 'Loading Portal...' : isFirstTime ? 'Create Admin Account' : 'Login'}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const allowedTabs = getAllowedTabs();

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-50 bg-slate-50 print:bg-white'}`}>
      
      {/* Sidebar Navigation */}
      <aside className={`bg-white dark:bg-slate-800 border-r border-slate-200 flex flex-col transition-all duration-300 print:hidden ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {sidebarOpen && <span className="font-black text-xl text-indigo-600">Infusive<span className="text-slate-800 dark:text-white">PMS</span></span>}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarOpen && <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4 px-2">Assigned Projects</div>}
          
          {visibleClients.map(client => (
            <button key={client.id} onClick={() => !isReadOnly && setActiveClientId(client.id)} className={`flex items-center w-full text-left gap-3 px-3 py-2.5 rounded-lg font-bold border transition-colors ${activeClientId === client.id ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' : 'text-slate-600 border-transparent hover:bg-slate-50'}`}>
              <Building className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="truncate">{client.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-rose-600 hover:bg-rose-50 font-bold">
            <LogOut className="w-5 h-5" /> {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 print:hidden">
          <div className="flex items-center gap-4 text-sm font-bold text-slate-800">
            {getActiveClientObj()?.name || 'Loading...'}
            
            {/* MONTH SELECTOR */}
            {PROJECT_DATA && (
              <div className="ml-4 flex items-center gap-2 border-l border-slate-200 pl-4">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700">
                  {Object.keys(PROJECT_DATA.months).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {!isReadOnly && <button onClick={createNewMonth} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded font-bold transition-colors">+ New Month</button>}
              </div>
            )}

          </div>
          <div className="flex items-center gap-3 ml-4">
            <div className="text-right"><p className="text-sm font-bold">{teamMemberProfile?.name}</p><p className="text-xs text-indigo-500">{teamMemberProfile?.role}</p></div>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 print:p-0 print:overflow-visible">
          
          {/* Internal Tabs */}
          <div className="flex space-x-1 bg-white p-1.5 rounded-xl flex-wrap gap-y-1 mb-8 border border-slate-200 w-max shadow-sm print:hidden">
            {allowedTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-slate-100 text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Render Active Tab */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'website' && renderWebsiteTab()}
          {activeTab === 'seo' && renderSEOTab()}
          {activeTab === 'social' && renderSocialTab()}
          {activeTab === 'ads' && renderAdsTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'settings' && renderAgencySettingsTab()}

        </div>
      </main>
    </div>
  );
}
