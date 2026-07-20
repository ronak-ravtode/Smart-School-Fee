import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from './stores/authStore';
import TopNavBar from './components/layout/TopNavBar';
import Footer from './components/layout/Footer';
import { PageShell } from './components/layout/PageShell';
import WardsPanel from './components/guardian/WardsPanel';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/admin/Dashboard';
import FeeSetup from './pages/admin/FeeSetup';
import Approvals from './pages/admin/Approvals';
import CashierSetup from './pages/admin/CashierSetup';
import Reconciliation from './pages/admin/Reconciliation';
import Expenses from './pages/admin/Expenses';
import Collections from './pages/cashier/Collections';
import OfflineQueue from './pages/cashier/OfflineQueue';
import Deposits from './pages/cashier/Deposits';
import Payment from './pages/guardian/Payment';
import PaymentSuccess from './pages/guardian/PaymentSuccess';
import Receipts from './pages/guardian/Receipts';

export default function App() {
  const { user, token, logout, submitConsent } = useAuthStore();
  const [page, setPage] = useState('login');
  const [dashboardTab, setDashboardTab] = useState('Analytics');

  // Guardians manage students + DPDP consent
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (token && user) {
      if (window.location.pathname.includes('/payment/success')) {
        setPage('payment-success');
      } else {
        setPage('dashboard');
      }
      if (user.role === 'guardian') {
        fetchMyStudents();
      }
    } else {
      if (page === 'dashboard' || page === 'payment-success') {
        setPage('login');
      }
    }
  }, [token, user]);

  const handleLogout = () => {
    logout();
    setPage('login');
  };

  const fetchMyStudents = async () => {
    try {
      const response = await axios.get('/api/guardians/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const handleConsentToggle = async (studentId, checked) => {
    try {
      await submitConsent(studentId, checked);
      fetchMyStudents();
    } catch (err) {
      console.warn('API Consent submission failed:', err.message);
    }
  };

  // Map nav labels (TopNavBar) to page components
  const renderDashboard = () => {
    switch (dashboardTab) {
      case 'Analytics':
        return <Dashboard setAdminTab={setDashboardTab} />;
      case 'Cashier Setup':
        return <CashierSetup />;
      case 'Fee Engine':
        return <FeeSetup />;
      case 'Pending Approvals':
        return <Approvals />;
      case 'Bank Reconciliation':
        return <Reconciliation />;
      case 'Maintenance Expenses':
        return <Expenses />;
      case 'Collect Fees':
        return <Collections />;
      case 'Offline Queue':
        return <OfflineQueue />;
      case 'Cheque Deposits':
        return <Deposits />;
      case 'My Wards':
        return <WardsPanel students={students} onConsentToggle={handleConsentToggle} />;
      case 'Pay Fees':
        return <Payment />;
      case 'Receipt History':
        return <Receipts />;
      default:
        if (user?.role === 'admin') return <Dashboard setAdminTab={setDashboardTab} />;
        if (user?.role === 'cashier') return <Collections />;
        if (user?.role === 'guardian') return <WardsPanel students={students} onConsentToggle={handleConsentToggle} />;
        return <Dashboard setAdminTab={setDashboardTab} />;
    }
  };

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <Login onNavigate={setPage} />;
      case 'signup':
        return <Signup onNavigate={setPage} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={setPage} />;
      case 'payment-success':
        return <PaymentSuccess onNavigate={setPage} />;
      case 'dashboard':
        if (!user) return <Login onNavigate={setPage} />;
        return (
          <>
            <TopNavBar role={user.role} activeTab={dashboardTab} onNavigate={setDashboardTab} user={user} onLogout={handleLogout} />
            <PageShell>{renderDashboard()}</PageShell>
            <Footer />
          </>
        );
      default:
        return <Login onNavigate={setPage} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {renderPage()}
    </div>
  );
}
