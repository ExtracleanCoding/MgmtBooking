import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context/StateContext';

const SellPackageModal = ({ customerId, closeModal }) => {
  const { state, setState } = useStateContext();
  const { settings, customers } = state;
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    if (customerId) {
      setCustomer(customers.find(c => c.id === customerId));
    }
    if (settings.packages?.length > 0) {
      setSelectedPackageId(settings.packages[0].id);
    }
  }, [customerId, customers, settings.packages]);

  const confirmSale = (e) => {
    e.preventDefault();
    const pkg = settings.packages.find(p => p.id === selectedPackageId);
    if (!pkg || !customer) return;

    const customerIndex = state.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return;

    const updatedCustomer = { ...state.customers[customerIndex] };
    if (!updatedCustomer.driving_school_details) {
        updatedCustomer.driving_school_details = { lesson_credits: 0 };
    }
    updatedCustomer.driving_school_details.lesson_credits = (updatedCustomer.driving_school_details.lesson_credits || 0) + pkg.hours;

    const transaction = {
        id: `txn_${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'package_sale',
        description: `Sale of '${pkg.name}' to ${customer.name}`,
        amount: pkg.price,
        customerId: customerId,
        packageId: pkg.id
    };

    const updatedCustomers = [...state.customers];
    updatedCustomers[customerIndex] = updatedCustomer;

    setState(prev => ({
        ...prev,
        customers: updatedCustomers,
        transactions: [...prev.transactions, transaction],
    }));

    closeModal();
  };

  if (!customer) return null;

  const selectedPackage = settings.packages.find(p => p.id === selectedPackageId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-4xl modal">
        <div className="modal-header">
          <h3 id="sell-package-modal-title">Sell Package to {customer.name}</h3>
        </div>
        <form onSubmit={confirmSale} className="p-6 space-y-4">
          <div>
            <label htmlFor="sell-package-select" className="block mb-1 text-sm font-medium">Select Package</label>
            <select id="sell-package-select" value={selectedPackageId} onChange={(e) => setSelectedPackageId(e.target.value)} required className="w-full">
              {settings.packages.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.hours} hrs for €{p.price.toFixed(2)})</option>
              ))}
            </select>
          </div>
          {selectedPackage && (
            <div id="sell-package-summary" className="p-3 bg-gray-50 rounded-md text-sm">
              This will add <strong>{selectedPackage.hours} hours</strong> of lesson credit and record an income of <strong>€{selectedPackage.price.toFixed(2)}</strong>.
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-green">Confirm Sale</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellPackageModal;
