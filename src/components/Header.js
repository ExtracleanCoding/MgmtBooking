import React from 'react';

const Header = () => {
  return (
    <header className="mb-8 p-4 flex justify-between items-center">
      <div>
        <h1 className="retro-title">Ray Ryan Management System</h1>
        <p className="mt-2 text-lg text-gray-600">Unified Management Dashboard</p>
      </div>
      <div id="digital-clock" className="text-right"></div>
    </header>
  );
};

export default Header;
