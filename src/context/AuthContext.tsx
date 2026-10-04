import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, UserPermissions } from '../types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (emailOrUser: string, pass: string) => { success: boolean; error?: string };
  register: (name: string, email: string, pass: string, department: string) => { success: boolean; error?: string; assignedRole?: Role };
  requestPasswordReset: (email: string) => { success: boolean; otp?: string; error?: string };
  resetPassword: (email: string, otp: string, newPass: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: Role) => void;
  updateUserPermissions: (userId: string, perms: Partial<UserPermissions>) => void;
  updateUserRole: (userId: string, role: Role) => void;
  deleteUser: (userId: string) => void;
  createUser: (user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => void;
  activeOtpData: { email: string; otp: string; expiresAt: number } | null;
  isAdmin: boolean;
  isEngineer: boolean;
  isViewer: boolean;
  canAccessUsers: boolean;
  canAccessSettings: boolean;
}

const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  canEditDevices: true,
  canManageUsers: true,
  canEditTopology: true,
  canImportConfig: true,
  canAcknowledgeAlerts: true,
  canModifySettings: true,
  canRebootDevices: true,
};

const DEFAULT_ENGINEER_PERMISSIONS: UserPermissions = {
  canEditDevices: false,
  canManageUsers: false,
  canEditTopology: true,
  canImportConfig: true,
  canAcknowledgeAlerts: true,
  canModifySettings: true,
  canRebootDevices: true,
};

const DEFAULT_VIEWER_PERMISSIONS: UserPermissions = {
  canEditDevices: false,
  canManageUsers: false,
  canEditTopology: false,
  canImportConfig: false,
  canAcknowledgeAlerts: false,
  canModifySettings: false,
  canRebootDevices: false,
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-01',
    name: 'Somchai Prasert (Lead Admin)',
    email: 'admin@netmonitor.internal',
    password: 'admin123',
    role: 'Admin',
    department: 'NOC Enterprise Infrastructure',
    status: 'Active',
    createdAt: '2026-01-10 08:30:00',
    lastLogin: '2026-09-28 16:45:12',
    permissions: DEFAULT_ADMIN_PERMISSIONS,
  },
  {
    id: 'usr-eng-02',
    name: 'Kittisak Wongsuwan (Senior NOC Engineer)',
    email: 'engineer@netmonitor.internal',
    password: 'engineer123',
    role: 'Engineer',
    department: 'Network Operations & Wi-Fi Systems',
    status: 'Active',
    createdAt: '2026-02-15 11:20:00',
    lastLogin: '2026-09-28 15:10:04',
    permissions: DEFAULT_ENGINEER_PERMISSIONS,
  },
  {
    id: 'usr-view-03',
    name: 'Pimchanok Rattanaporn (Security Auditor)',
    email: 'viewer@netmonitor.internal',
    password: 'viewer123',
    role: 'Viewer',
    department: 'IT Compliance & Audit',
    status: 'Active',
    createdAt: '2026-03-01 09:00:00',
    lastLogin: '2026-09-27 18:22:30',
    permissions: DEFAULT_VIEWER_PERMISSIONS,
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('netmonitor_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedSession = localStorage.getItem('netmonitor_current_user');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch {
        return users[0];
      }
    }
    return users[0]; // Default start logged in as Admin for immediate inspection
  });

  const [activeOtpData, setActiveOtpData] = useState<{ email: string; otp: string; expiresAt: number } | null>(() => {
    const saved = localStorage.getItem('netmonitor_active_otp');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('netmonitor_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('netmonitor_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('netmonitor_current_user');
    }
  }, [currentUser]);

  const login = (emailOrUser: string, pass: string) => {
    const found = users.find(
      u => (u.email.toLowerCase() === emailOrUser.toLowerCase() || u.name.toLowerCase() === emailOrUser.toLowerCase()) &&
           u.password === pass
    );

    if (!found) {
      return { success: false, error: 'Invalid email/username or password' };
    }

    if (found.status === 'Suspended') {
      return { success: false, error: 'This account has been suspended by an administrator' };
    }

    const updatedUser = {
      ...found,
      lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    return { success: true };
  };

  const register = (name: string, email: string, pass: string, department: string) => {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, error: 'This email is already registered' };
    }

    // Policy: The very first registrant through the registration portal gets Root Admin!
    // A user is considered the first registrant if no user with prefix 'usr-reg-' exists yet,
    // or if the total user database is empty or has no active Admin.
    const hasPriorRegisteredUsers = users.some(u => u.id.startsWith('usr-reg-'));
    const isFirstUser = !hasPriorRegisteredUsers || users.length === 0 || !users.some(u => u.role === 'Admin');
    const assignedRole: Role = isFirstUser ? 'Admin' : 'Engineer';

    const newUser: User = {
      id: `usr-reg-${Date.now().toString(36)}`,
      name,
      email,
      password: pass,
      role: assignedRole,
      department: department || 'Operations',
      status: 'Active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 19),
      permissions: assignedRole === 'Admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_ENGINEER_PERMISSIONS,
    };

    const newUsersList = [...users, newUser];
    setUsers(newUsersList);
    setCurrentUser(newUser);

    return { success: true, assignedRole };
  };

  const requestPasswordReset = (email: string) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      return { success: false, error: 'No user registered with this email address' };
    }

    // Generate mock OTP with 15-minute expiration ceiling
    const otp = `NET-${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const otpPayload = { email, otp, expiresAt };
    setActiveOtpData(otpPayload);
    localStorage.setItem('netmonitor_active_otp', JSON.stringify(otpPayload));

    return { success: true, otp };
  };

  const resetPassword = (email: string, otp: string, newPass: string) => {
    if (!activeOtpData || activeOtpData.email.toLowerCase() !== email.toLowerCase()) {
      return { success: false, error: 'No active password reset request found for this email' };
    }

    // Verify expiration
    if (Date.now() > activeOtpData.expiresAt) {
      setActiveOtpData(null);
      localStorage.removeItem('netmonitor_active_otp');
      return { success: false, error: 'OTP code has expired (15-minute limit). Please request a new code.' };
    }

    if (activeOtpData.otp.trim().toUpperCase() !== otp.trim().toUpperCase()) {
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.email.toLowerCase() === email.toLowerCase()) {
          return { ...u, password: newPass };
        }
        return u;
      })
    );

    if (currentUser?.email.toLowerCase() === email.toLowerCase()) {
      setCurrentUser(prev => (prev ? { ...prev, password: newPass } : null));
    }

    setActiveOtpData(null);
    localStorage.removeItem('netmonitor_active_otp');
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('netmonitor_current_user');
  };

  const switchRole = (role: Role) => {
    // Quickly find a user with this role or mutate current
    const matching = users.find(u => u.role === role && u.status === 'Active');
    if (matching) {
      setCurrentUser(matching);
    } else if (currentUser) {
      const perms = role === 'Admin'
        ? DEFAULT_ADMIN_PERMISSIONS
        : role === 'Engineer'
        ? DEFAULT_ENGINEER_PERMISSIONS
        : DEFAULT_VIEWER_PERMISSIONS;

      const morphed: User = {
        ...currentUser,
        role,
        permissions: perms,
      };
      setCurrentUser(morphed);
    }
  };

  const updateUserPermissions = (userId: string, perms: Partial<UserPermissions>) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, permissions: { ...u.permissions, ...perms } };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const updateUserRole = (userId: string, role: Role) => {
    const perms = role === 'Admin'
      ? DEFAULT_ADMIN_PERMISSIONS
      : role === 'Engineer'
      ? DEFAULT_ENGINEER_PERMISSIONS
      : DEFAULT_VIEWER_PERMISSIONS;

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, role, permissions: perms };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (userId: string) => {
    if (currentUser?.id === userId) {
      alert('ไม่สามารถลบบัญชีที่กำลังใช้งานของตนเองได้');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      lastLogin: 'Never',
    };
    setUsers(prev => [...prev, newUser]);
  };

  const role = currentUser?.role || 'Viewer';
  const isAdmin = role === 'Admin';
  const isEngineer = role === 'Engineer';
  const isViewer = role === 'Viewer';
  const canAccessUsers = isAdmin;
  const canAccessSettings = isAdmin || isEngineer;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        register,
        requestPasswordReset,
        resetPassword,
        logout,
        switchRole,
        updateUserPermissions,
        updateUserRole,
        deleteUser,
        createUser,
        activeOtpData,
        isAdmin,
        isEngineer,
        isViewer,
        canAccessUsers,
        canAccessSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
