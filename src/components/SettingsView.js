import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context/StateContext';

const SettingsView = () => {
  const { state, setState } = useStateContext();
  const [settings, setSettings] = useState(state.settings);
  const [newPackage, setNewPackage] = useState({ name: '', hours: '', price: '' });

  useEffect(() => {
    setSettings(state.settings);
  }, [state.settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const [section, key] = name.split('.');

    if (key) {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: type === 'checkbox' ? checked : value,
            },
        }));
    } else {
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }
  };

  const handlePackageChange = (e) => {
    const { name, value } = e.target;
    setNewPackage(prev => ({ ...prev, [name]: value }));
  }

  const savePackage = (e) => {
    e.preventDefault();
    const updatedPackages = [...(settings.packages || []), { ...newPackage, id: `pkg_${Date.now()}` }];
    setSettings(prev => ({ ...prev, packages: updatedPackages }));
    setNewPackage({ name: '', hours: '', price: '' });
  };

  const deletePackage = (packageId) => {
    const updatedPackages = settings.packages.filter(p => p.id !== packageId);
    setSettings(prev => ({ ...prev, packages: updatedPackages }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setState(prev => ({ ...prev, settings }));
    alert('Settings saved!');
  };

  const handleBackup = () => {
    const dataStr = JSON.stringify(state);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'ray-ryan-management-backup.json';
    link.href = url;
    link.click();
  }

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        setState(data);
        alert('Data restored successfully!');
    };
    reader.readAsText(file);
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Settings</h2>
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Lesson Rates */}
          <div>
            <h3 className="text-lg font-medium mb-2">Lesson Rates (€)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="rate-standard" className="block mb-1 text-sm font-medium text-gray-700">Standard</label>
                <input type="number" id="rate-standard" name="rates.standard" value={settings.rates.standard} onChange={handleChange} step="0.01" required className="w-full" />
              </div>
              <div>
                <label htmlFor="rate-intermediate" className="block mb-1 text-sm font-medium text-gray-700">Intermediate</label>
                <input type="number" id="rate-intermediate" name="rates.intermediate" value={settings.rates.intermediate} onChange={handleChange} step="0.01" required className="w-full" />
              </div>
              <div>
                <label htmlFor="rate-advanced" className="block mb-1 text-sm font-medium text-gray-700">Advanced</label>
                <input type="number" id="rate-advanced" name="rates.advanced" value={settings.rates.advanced} onChange={handleChange} step="0.01" required className="w-full" />
              </div>
            </div>
          </div>

          {/* Mock Test Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-2">Mock Test Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label htmlFor="mock-test-rate" className="block mb-1 text-sm font-medium text-gray-700">Mock Test Rate (€)</label><input type="number" id="mock-test-rate" name="mockTestRate" value={settings.mockTestRate} onChange={handleChange} step="0.01" required className="w-full" /></div>
              <div><label htmlFor="mock-test-duration" className="block mb-1 text-sm font-medium text-gray-700">Mock Test Duration (hours)</label><input type="number" id="mock-test-duration" name="mockTestDuration" value={settings.mockTestDuration} onChange={handleChange} step="0.5" required className="w-full" /></div>
            </div>
          </div>

          {/* Lesson Packages */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-2">Lesson Packages</h3>
            <div id="package-list-container" className="space-y-2 mb-4">
              {(settings.packages || []).map(pkg => (
                <div key={pkg.id} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                  <div>
                    <p className="font-semibold">{pkg.name}</p>
                    <p className="text-sm text-gray-600">{pkg.hours} hours for €{pkg.price}</p>
                  </div>
                  <button type="button" onClick={() => deletePackage(pkg.id)} className="font-medium text-red-600 hover:text-red-900">Delete</button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50">
              <div>
                <label htmlFor="package-name" className="block text-sm font-medium text-gray-700">Package Name</label>
                <input type="text" id="package-name" name="name" value={newPackage.name} onChange={handlePackageChange} className="w-full mt-1" placeholder="e.g., 10 Hour Block" />
              </div>
              <div>
                <label htmlFor="package-hours" className="block text-sm font-medium text-gray-700">Hours</label>
                <input type="number" id="package-hours" name="hours" value={newPackage.hours} onChange={handlePackageChange} className="w-full mt-1" step="0.5" />
              </div>
              <div>
                <label htmlFor="package-price" className="block text-sm font-medium text-gray-700">Price (€)</label>
                <input type="number" id="package-price" name="price" value={newPackage.price} onChange={handlePackageChange} className="w-full mt-1" step="0.01" />
              </div>
              <button type="button" onClick={savePackage} className="btn btn-primary w-full">Add</button>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-2">Invoice Details</h3>
            <div><label htmlFor="instructor-name" className="block mb-1 text-sm font-medium text-gray-700">Your Name / Company Name</label><input type="text" id="instructor-name" name="instructorName" value={settings.instructorName} onChange={handleChange} required className="w-full" /></div>
            <div className="mt-4"><label htmlFor="instructor-address" className="block mb-1 text-sm font-medium text-gray-700">Your Address</label><textarea id="instructor-address" name="instructorAddress" value={settings.instructorAddress} onChange={handleChange} rows="3" required className="w-full"></textarea></div>
            <div className="mt-4"><label htmlFor="payment-details" className="block mb-1 text-sm font-medium text-gray-700">Payment Details (for Invoices)</label><textarea id="payment-details" name="paymentDetails" value={settings.paymentDetails} onChange={handleChange} rows="4" className="w-full"></textarea></div>
          </div>

          <div className="mt-4 text-right">
            <button type="submit" className="btn btn-primary">Save Settings</button>
          </div>
        </form>

        {/* Data & Backup */}
        <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Data & Backup</h2>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <button type="button" onClick={handleBackup} className="btn btn-green w-full">Backup Now</button>
                    <label className="btn btn-secondary w-full cursor-pointer text-center">
                        Import Backup
                        <input type="file" id="import-backup" className="hidden" onChange={handleRestore} accept=".json" />
                    </label>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
