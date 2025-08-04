import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthPage } from '@/components/auth/AuthPage';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { CustomersList } from '@/components/customers/CustomersList';
import { FruitManagement } from '@/components/fruits/FruitManagement';
import { TrayManagement } from '@/components/trays/TrayManagement';
import { Reports } from '@/components/reports/Reports';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'customers' | 'fruits' | 'trays' | 'reports'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <TransactionsList />;
      case 'customers':
        return <CustomersList />;
      case 'fruits':
        return <FruitManagement />;
      case 'trays':
        return <TrayManagement />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
