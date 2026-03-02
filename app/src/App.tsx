import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_APiU6azAWX5w5qANpInI-6QWX-IDzeA",
  authDomain: "web-absen-13c0f.firebaseapp.com",
  projectId: "web-absen-13c0f",
  storageBucket: "web-absen-13c0f.firebasestorage.app",
  messagingSenderId: "1026553673394",
  appId: "1:1026553673394:web:3bda1f7adb88615e727bab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Types
type UserRole = 'Admin' | 'Anggota' | 'Dewan Pembimbing';
type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';

interface UserData {
  uid: string;
  email: string;
  nama: string;
  role: UserRole;
  jabatan?: string;
  regional?: number;
  asalSekolah?: string;
  pembimbing?: string;
  createdAt: Timestamp;
}

interface Event {
  id: string;
  namaKegiatan: string;
  tanggal: string;
  lokasi: string;
  kodeAbsensi: string;
  batasWaktu: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
}

interface Attendance {
  id: string;
  userId: string;
  eventId: string;
  nama: string;
  role: UserRole;
  jabatan?: string;
  regional?: number;
  pembimbing?: string;
  status: AttendanceStatus;
  waktuAbsen: Timestamp;
  eventName: string;
}

// Icons
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  CheckCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  FileText: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Logout: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Trash: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Edit: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:static md:translate-x-0 z-30 w-64 bg-red-600 text-white min-h-screen transition-transform duration-300`}>
        <div className="p-6 border-b border-red-500">
          <h1 className="text-xl font-bold">FORUM OSIS MPK</h1>
          <p className="text-sm text-red-200">Kab. Sukabumi</p>
        </div>
        <nav className="p-4 space-y-2">
          <SidebarItem icon={<Icons.Dashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} />
          {userData?.role === 'Admin' && (
            <>
              <SidebarItem icon={<Icons.Users />} label="Data Pengguna" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setSidebarOpen(false); }} />
              <SidebarItem icon={<Icons.Calendar />} label="Buat Kegiatan" active={activeTab === 'events'} onClick={() => { setActiveTab('events'); setSidebarOpen(false); }} />
            </>
          )}
          <SidebarItem icon={<Icons.CheckCircle />} label="Absensi" active={activeTab === 'attendance'} onClick={() => { setActiveTab('attendance'); setSidebarOpen(false); }} />
          <SidebarItem icon={<Icons.FileText />} label="Rekap" active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }} />
          {userData?.role === 'Admin' && (
            <SidebarItem icon={<Icons.Download />} label="Export" active={activeTab === 'export'} onClick={() => { setActiveTab('export'); setSidebarOpen(false); }} />
          )}
          <div className="pt-4 border-t border-red-500 mt-4">
            <SidebarItem icon={<Icons.Logout />} label="Logout" onClick={() => signOut(auth)} />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-gray-600">
            <Icons.Menu />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-800">{userData?.nama}</p>
              <p className="text-sm text-gray-500">{userData?.role}</p>
            </div>
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
              {userData?.nama?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {activeTab === 'dashboard' && <Dashboard userData={userData} />}
          {activeTab === 'users' && userData?.role === 'Admin' && <UserManagement />}
          {activeTab === 'events' && userData?.role === 'Admin' && <EventManagement />}
          {activeTab === 'attendance' && <AttendancePage userData={userData} />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'export' && userData?.role === 'Admin' && <ExportPage />}
        </main>
      </div>
    </div>
  );
}

// Sidebar Item Component
function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active ? 'bg-red-700 text-white' : 'text-red-100 hover:bg-red-500'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Auth Page
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState<UserRole>('Anggota');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          nama,
          role,
          createdAt: Timestamp.now()
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">FORUM OSIS MPK</h1>
          <p className="text-gray-500">Kabupaten Sukabumi</p>
          <div className="mt-4 w-16 h-1 bg-red-600 mx-auto rounded"></div>
        </div>

        <h2 className="text-xl font-semibold text-center mb-6">{isLogin ? 'Login' : 'Daftar Akun'}</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="Anggota">Anggota</option>
                <option value="Dewan Pembimbing">Dewan Pembimbing</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Daftar'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-red-600 font-medium hover:underline"
          >
            {isLogin ? 'Daftar' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

// Dashboard
function Dashboard({ userData }: { userData: UserData | null }) {
  const [stats, setStats] = useState({ totalUsers: 0, totalEvents: 0, totalAttendance: 0, myAttendance: 0 });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const eventsSnap = await getDocs(collection(db, 'events'));
      const attendanceSnap = await getDocs(collection(db, 'attendance'));
      
      const myAttendanceQuery = query(collection(db, 'attendance'), where('userId', '==', userData?.uid || ''));
      const myAttendanceSnap = await getDocs(myAttendanceQuery);

      setStats({
        totalUsers: usersSnap.size,
        totalEvents: eventsSnap.size,
        totalAttendance: attendanceSnap.size,
        myAttendance: myAttendanceSnap.size
      });

      const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      const eventsSnap2 = await getDocs(eventsQuery);
      setRecentEvents(eventsSnap2.docs.slice(0, 5).map(doc => ({ id: doc.id, ...doc.data() } as Event)));
    };
    fetchStats();
  }, [userData]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Pengguna" value={stats.totalUsers} color="bg-blue-500" />
        <StatCard title="Total Kegiatan" value={stats.totalEvents} color="bg-green-500" />
        <StatCard title="Total Absensi" value={stats.totalAttendance} color="bg-purple-500" />
        <StatCard title="Absensi Saya" value={stats.myAttendance} color="bg-red-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Kegiatan Terbaru</h3>
        {recentEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada kegiatan</p>
        ) : (
          <div className="space-y-3">
            {recentEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{event.namaKegiatan}</p>
                  <p className="text-sm text-gray-500">{event.tanggal} • {event.lokasi}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.batasWaktu.toMillis() > Date.now() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {event.batasWaktu.toMillis() > Date.now() ? 'Aktif' : 'Selesai'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white mb-4`}>
        <Icons.FileText />
      </div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

// User Management
function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterRegional, setFilterRegional] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    role: 'Anggota' as UserRole,
    jabatan: '',
    regional: '',
    asalSekolah: '',
    pembimbing: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    setUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserData)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userData: any = {
      nama: formData.nama,
      role: formData.role,
      updatedAt: Timestamp.now()
    };

    if (formData.role === 'Anggota') {
      userData.jabatan = formData.jabatan;
      userData.regional = parseInt(formData.regional);
      userData.asalSekolah = formData.asalSekolah;
    } else if (formData.role === 'Dewan Pembimbing') {
      userData.pembimbing = formData.pembimbing;
    }

    if (editingUser) {
      await updateDoc(doc(db, 'users', editingUser.uid), userData);
    }

    setShowModal(false);
    setEditingUser(null);
    setFormData({ nama: '', email: '', role: 'Anggota', jabatan: '', regional: '', asalSekolah: '', pembimbing: '' });
    fetchUsers();
  };

  const handleDelete = async (uid: string) => {
    if (confirm('Yakin ingin menghapus pengguna ini?')) {
      await deleteDoc(doc(db, 'users', uid));
      fetchUsers();
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      email: user.email,
      role: user.role,
      jabatan: user.jabatan || '',
      regional: user.regional?.toString() || '',
      asalSekolah: user.asalSekolah || '',
      pembimbing: user.pembimbing || ''
    });
    setShowModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchRole = !filterRole || user.role === filterRole;
    const matchRegional = !filterRegional || user.regional?.toString() === filterRegional;
    const matchSearch = !searchQuery || user.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchRegional && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Data Pengguna</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Icons.Search />
          <input
            type="text"
            placeholder="Cari nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">Semua Role</option>
          <option value="Admin">Admin</option>
          <option value="Anggota">Anggota</option>
          <option value="Dewan Pembimbing">Dewan Pembimbing</option>
        </select>
        <select value={filterRegional} onChange={(e) => setFilterRegional(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">Semua Regional</option>
          {[1, 2, 3, 4, 5, 6, 7].map(r => (
            <option key={r} value={r}>Regional {r}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nama</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Jabatan/Pembimbing</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Regional</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{user.nama}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'Admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'Anggota' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>{user.role}</span></td>
                  <td className="px-4 py-3 text-sm">{user.jabatan || user.pembimbing || '-'}</td>
                  <td className="px-4 py-3 text-sm">{user.regional || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Icons.Edit /></button>
                      <button onClick={() => handleDelete(user.uid)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Icons.Trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Edit Pengguna</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input type="text" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="Anggota">Anggota</option>
                  <option value="Dewan Pembimbing">Dewan Pembimbing</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              {formData.role === 'Anggota' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                    <input type="text" value={formData.jabatan} onChange={(e) => setFormData({...formData, jabatan: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Regional (1-7)</label>
                    <select value={formData.regional} onChange={(e) => setFormData({...formData, regional: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="">Pilih Regional</option>
                      {[1, 2, 3, 4, 5, 6, 7].map(r => (
                        <option key={r} value={r}>Regional {r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asal Sekolah</label>
                    <input type="text" value={formData.asalSekolah} onChange={(e) => setFormData({...formData, asalSekolah: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </>
              )}
              {formData.role === 'Dewan Pembimbing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pembimbing</label>
                  <input type="text" value={formData.pembimbing} onChange={(e) => setFormData({...formData, pembimbing: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Event Management
function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    namaKegiatan: '',
    tanggal: '',
    lokasi: '',
    kodeAbsensi: '',
    durasiMenit: '30'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
  };

  const generateKode = () => {
    const kode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, kodeAbsensi: kode });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const batasWaktu = new Date();
    batasWaktu.setMinutes(batasWaktu.getMinutes() + parseInt(formData.durasiMenit));

    await addDoc(collection(db, 'events'), {
      ...formData,
      batasWaktu: Timestamp.fromDate(batasWaktu),
      createdAt: Timestamp.now(),
      createdBy: auth.currentUser?.uid
    });

    setShowModal(false);
    setFormData({ namaKegiatan: '', tanggal: '', lokasi: '', kodeAbsensi: '', durasiMenit: '30' });
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus kegiatan ini?')) {
      await deleteDoc(doc(db, 'events', id));
      fetchEvents();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Buat Kegiatan</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <Icons.Plus /> Buat Kegiatan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nama Kegiatan</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Lokasi</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kode</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{event.namaKegiatan}</td>
                  <td className="px-4 py-3 text-sm">{event.tanggal}</td>
                  <td className="px-4 py-3 text-sm">{event.lokasi}</td>
                  <td className="px-4 py-3"><span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-mono font-bold">{event.kodeAbsensi}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.batasWaktu.toMillis() > Date.now() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>{event.batasWaktu.toMillis() > Date.now() ? 'Aktif' : 'Kadaluarsa'}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Icons.Trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Buat Kegiatan Baru</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan</label>
                <input type="text" value={formData.namaKegiatan} onChange={(e) => setFormData({...formData, namaKegiatan: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input type="date" value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <input type="text" value={formData.lokasi} onChange={(e) => setFormData({...formData, lokasi: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Kode Aktif (menit)</label>
                <input type="number" value={formData.durasiMenit} onChange={(e) => setFormData({...formData, durasiMenit: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" min="1" max="120" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Absensi</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.kodeAbsensi} onChange={(e) => setFormData({...formData, kodeAbsensi: e.target.value.toUpperCase()})} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono" maxLength={6} required />
                  <button type="button" onClick={generateKode} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Generate</button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Attendance Page
function AttendancePage({ userData }: { userData: UserData | null }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [kodeInput, setKodeInput] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('Hadir');
  const [message, setMessage] = useState('');
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);

  useEffect(() => {
    fetchEvents();
    fetchMyAttendance();
  }, []);

  const fetchEvents = async () => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
  };

  const fetchMyAttendance = async () => {
    const q = query(collection(db, 'attendance'), where('userId', '==', userData?.uid || ''), orderBy('waktuAbsen', 'desc'));
    const snapshot = await getDocs(q);
    setMyAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
  };

  const handleAbsen = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const event = events.find(e => e.kodeAbsensi === kodeInput.toUpperCase());
    if (!event) {
      setMessage('Kode absensi tidak valid!');
      return;
    }

    if (event.batasWaktu.toMillis() < Date.now()) {
      setMessage('Kode absensi sudah kadaluarsa!');
      return;
    }

    // Check if already attended
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('userId', '==', userData?.uid),
      where('eventId', '==', event.id)
    );
    const existing = await getDocs(attendanceQuery);
    if (!existing.empty) {
      setMessage('Anda sudah absen untuk kegiatan ini!');
      return;
    }

    await addDoc(collection(db, 'attendance'), {
      userId: userData?.uid,
      eventId: event.id,
      nama: userData?.nama,
      role: userData?.role,
      jabatan: userData?.jabatan,
      regional: userData?.regional,
      pembimbing: userData?.pembimbing,
      status,
      waktuAbsen: Timestamp.now(),
      eventName: event.namaKegiatan
    });

    setMessage('Absensi berhasil!');
    setKodeInput('');
    fetchMyAttendance();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Absensi</h2>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Input Kode Absensi</h3>
        <form onSubmit={handleAbsen} className="space-y-4">
          <div>
            <input
              type="text"
              value={kodeInput}
              onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
              placeholder="Masukkan kode absensi"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest uppercase"
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Kehadiran</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as AttendanceStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2 rounded-lg font-medium transition-colors ${
                    status === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
            Submit Absensi
          </button>
        </form>
        {message && (
          <div className={`mt-4 p-4 rounded-lg ${message.includes('berhasil') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Riwayat Absensi Saya</h3>
        {myAttendance.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada riwayat absensi</p>
        ) : (
          <div className="space-y-3">
            {myAttendance.map(att => (
              <div key={att.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{att.eventName}</p>
                  <p className="text-sm text-gray-500">{att.waktuAbsen.toDate().toLocaleString('id-ID')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  att.status === 'Hadir' ? 'bg-green-100 text-green-700' :
                  att.status === 'Izin' ? 'bg-yellow-100 text-yellow-700' :
                  att.status === 'Sakit' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {att.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Reports Page
function ReportsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [filterRegional, setFilterRegional] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchAttendance(selectedEvent);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
  };

  const fetchAttendance = async (eventId: string) => {
    let q = query(collection(db, 'attendance'), where('eventId', '==', eventId), orderBy('waktuAbsen', 'desc'));
    if (filterRegional) {
      q = query(collection(db, 'attendance'), where('eventId', '==', eventId), where('regional', '==', parseInt(filterRegional)), orderBy('waktuAbsen', 'desc'));
    }
    const snapshot = await getDocs(q);
    setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
  };

  const stats = {
    hadir: attendance.filter(a => a.status === 'Hadir').length,
    izin: attendance.filter(a => a.status === 'Izin').length,
    sakit: attendance.filter(a => a.status === 'Sakit').length,
    alpha: attendance.filter(a => a.status === 'Alpha').length,
    total: attendance.length
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Rekap Absensi</h2>

      <div className="flex flex-col md:flex-row gap-4">
        <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">Pilih Kegiatan</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.namaKegiatan} - {event.tanggal}</option>
          ))}
        </select>
        <select value={filterRegional} onChange={(e) => { setFilterRegional(e.target.value); selectedEvent && fetchAttendance(selectedEvent); }} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">Semua Regional</option>
          {[1, 2, 3, 4, 5, 6, 7].map(r => (
            <option key={r} value={r}>Regional {r}</option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Hadir" value={stats.hadir} color="bg-green-500" />
            <StatCard title="Izin" value={stats.izin} color="bg-yellow-500" />
            <StatCard title="Sakit" value={stats.sakit} color="bg-orange-500" />
            <StatCard title="Alpha" value={stats.alpha} color="bg-red-500" />
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nama</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Regional</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.map(att => (
                    <tr key={att.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{att.nama}</td>
                      <td className="px-4 py-3 text-sm">{att.role}</td>
                      <td className="px-4 py-3 text-sm">{att.regional || '-'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        att.status === 'Hadir' ? 'bg-green-100 text-green-700' :
                        att.status === 'Izin' ? 'bg-yellow-100 text-yellow-700' :
                        att.status === 'Sakit' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>{att.status}</span></td>
                      <td className="px-4 py-3 text-sm">{att.waktuAbsen.toDate().toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Export Page
function ExportPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const attendanceSnap = await getDocs(collection(db, 'attendance'));
    const eventsSnap = await getDocs(collection(db, 'events'));
    
    setUsers(usersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserData)));
    setAttendance(attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
    setEvents(eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
  };

  const exportUsers = () => {
    const data = users.map(u => ({
      Nama: u.nama,
      Email: u.email,
      Role: u.role,
      Jabatan: u.jabatan || '-',
      Regional: u.regional || '-',
      'Asal Sekolah': u.asalSekolah || '-',
      Pembimbing: u.pembimbing || '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pengguna');
    XLSX.writeFile(wb, 'Data_Pengguna.xlsx');
  };

  const exportAttendance = () => {
    const data = attendance.map(a => ({
      Nama: a.nama,
      Role: a.role,
      Jabatan: a.jabatan || a.pembimbing || '-',
      Regional: a.regional || '-',
      'Nama Kegiatan': a.eventName,
      Status: a.status,
      'Waktu Absen': a.waktuAbsen.toDate().toLocaleString('id-ID')
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
    XLSX.writeFile(wb, 'Rekap_Absensi.xlsx');
  };

  const exportByEvent = () => {
    const data = attendance.map(a => ({
      'Nama Kegiatan': a.eventName,
      Nama: a.nama,
      Role: a.role,
      Regional: a.regional || '-',
      Status: a.status,
      'Waktu Absen': a.waktuAbsen.toDate().toLocaleString('id-ID')
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi per Kegiatan');
    XLSX.writeFile(wb, 'Rekap_Absensi_per_Kegiatan.xlsx');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Export Data</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white mb-4">
            <Icons.Users />
          </div>
          <h3 className="text-lg font-semibold mb-2">Data Pengguna</h3>
          <p className="text-gray-500 text-sm mb-4">Export seluruh data pengguna termasuk role, jabatan, dan regional</p>
          <button onClick={exportUsers} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Icons.Download /> Export
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white mb-4">
            <Icons.FileText />
          </div>
          <h3 className="text-lg font-semibold mb-2">Rekap Absensi</h3>
          <p className="text-gray-500 text-sm mb-4">Export seluruh data absensi dengan detail lengkap</p>
          <button onClick={exportAttendance} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
            <Icons.Download /> Export
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white mb-4">
            <Icons.Calendar />
          </div>
          <h3 className="text-lg font-semibold mb-2">Absensi per Kegiatan</h3>
          <p className="text-gray-500 text-sm mb-4">Export data absensi yang dikelompokkan per kegiatan</p>
          <button onClick={exportByEvent} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
            <Icons.Download /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Ringkasan Data</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            <p className="text-sm text-gray-500">Total Pengguna</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">{events.length}</p>
            <p className="text-sm text-gray-500">Total Kegiatan</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">{attendance.length}</p>
            <p className="text-sm text-gray-500">Total Absensi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
