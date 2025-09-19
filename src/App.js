import React from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import CalendarView from './components/CalendarView';
import SummaryView from './components/SummaryView';
import BillingView from './components/BillingView';
import ServicesView from './components/ServicesView';
import CustomersView from './components/CustomersView';
import StaffView from './components/StaffView';
import ResourcesView from './components/ResourcesView';
import ExpensesView from './components/ExpensesView';
import WaitingListView from './components/WaitingListView';
import SettingsView from './components/SettingsView';
import ReportsView from './components/ReportsView';
import DialogModal from './components/DialogModal';
import { useStateContext } from './context/StateContext';

function App() {
  const [currentView, setCurrentView] = React.useState('calendar'); // Default view
  const { dialog } = useStateContext();

  const renderView = () => {
    switch (currentView) {
      case 'calendar': return <CalendarView />;
      case 'summary': return <SummaryView />;
      case 'billing': return <BillingView />;
      case 'services': return <ServicesView />;
      case 'customers': return <CustomersView />;
      case 'staff': return <StaffView />;
      case 'resources': return <ResourcesView />;
      case 'expenses': return <ExpensesView />;
      case 'waiting-list': return <WaitingListView />;
      case 'settings': return <SettingsView />;
      case 'reports': return <ReportsView />;
      default: return <CalendarView />;
    }
  };

  return (
    <div id="app" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Header />

      {/* Dashboard-level notifications */}
      <div id="dashboard-notifications" className="mb-6 space-y-3"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Navigation setCurrentView={setCurrentView} />

        {/* Main Content Area */}
        <main id="main-content" className="lg:col-span-10">
          {renderView()}
        </main>
      </div>

      {/* Toast Notification Element */}
      <div id="toast-notification"></div>

      {dialog.isOpen && <DialogModal />}
    </div>
  );
}

export default App;
