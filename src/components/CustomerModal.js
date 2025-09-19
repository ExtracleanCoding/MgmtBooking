import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context/StateContext';

const CustomerModal = ({ customerId, closeModal }) => {
  const { state, setState } = useStateContext();
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    driving_school_details: {
      license_number: '',
      lesson_credits: 0,
    },
  });

  useEffect(() => {
    if (customerId) {
      const existingCustomer = state.customers.find(c => c.id === customerId);
      if (existingCustomer) {
        setCustomer(existingCustomer);
      }
    }
  }, [customerId, state.customers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in customer.driving_school_details) {
      setCustomer(prev => ({
        ...prev,
        driving_school_details: {
          ...prev.driving_school_details,
          [name]: value,
        },
      }));
    } else {
      setCustomer(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveCustomer = (e) => {
    e.preventDefault();
    if (customerId) {
      // Update existing customer
      const updatedCustomers = state.customers.map(c =>
        c.id === customerId ? customer : c
      );
      setState(prev => ({ ...prev, customers: updatedCustomers }));
    } else {
      // Add new customer
      const newCustomer = { ...customer, id: `customer_${Date.now()}` };
      setState(prev => ({
        ...prev,
        customers: [...prev.customers, newCustomer],
      }));
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-4xl modal">
        <div className="modal-header">
          <h3 id="customer-modal-title">{customerId ? 'Edit Customer' : 'New Customer'}</h3>
        </div>
        <form onSubmit={saveCustomer} className="p-6 space-y-4">
          <input type="hidden" id="customer-id" value={customer.id || ''} />
          <div>
            <label htmlFor="customer-name" className="block mb-1 text-sm font-medium">Full Name</label>
            <input type="text" id="customer-name" name="name" value={customer.name} onChange={handleChange} required className="w-full" />
          </div>
          <div>
            <label htmlFor="customer-email" className="block mb-1 text-sm font-medium">Email</label>
            <input type="email" id="customer-email" name="email" value={customer.email} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label htmlFor="customer-phone" className="block mb-1 text-sm font-medium">Phone Number</label>
            <input type="tel" id="customer-phone" name="phone" value={customer.phone} onChange={handleChange} className="w-full" />
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div>
              <label htmlFor="customer-license" className="block mb-1 text-sm font-medium">License Number</label>
              <input type="text" id="customer-license" name="license_number" value={customer.driving_school_details.license_number} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <label htmlFor="customer-credits" className="block mb-1 text-sm font-medium">Lesson Credits (hours)</label>
              <input type="number" id="customer-credits" name="lesson_credits" value={customer.driving_school_details.lesson_credits} onChange={handleChange} className="w-full" step="0.5" placeholder="e.g., 10.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Customer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
