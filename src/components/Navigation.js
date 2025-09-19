import React from 'react';

const Navigation = ({ setCurrentView }) => {
  const navItems = [
    { id: 'calendar', name: 'Calendar', view: 'calendar' },
    { id: 'summary', name: 'Summary', view: 'summary' },
    { id: 'services', name: 'Services', view: 'services' },
    { id: 'customers', name: 'Customers', view: 'customers' },
    { id: 'staff', name: 'Staff', view: 'staff' },
    { id: 'resources', name: 'Resources', view: 'resources' },
    { id: 'expenses', name: 'Expenses', view: 'expenses' },
    { id: 'waiting-list', name: 'Waiting List', view: 'waiting-list' },
    { id: 'billing', name: 'Billing', view: 'billing' },
    { id: 'reports', name: 'Reports', view: 'reports' },
    { id: 'settings', name: 'Settings', view: 'settings' },
  ];

  return (
    <nav id="main-nav" className="lg:col-span-2 flex flex-col gap-3">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setCurrentView(item.view)}
          id={`nav-${item.id}`}
          className="nav-btn"
        >
          {item.name}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
