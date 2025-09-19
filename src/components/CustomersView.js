import React, { useState } from 'react';
import { useStateContext } from '../context/StateContext';
import CustomerModal from './CustomerModal';
import CustomerProgressModal from './CustomerProgressModal';
import SellPackageModal from './SellPackageModal';

const CustomersView = () => {
  const { state, setState } = useStateContext();
  const { customers } = state;
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isSellPackageModalOpen, setIsSellPackageModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const openCustomerModal = (customerId = null) => {
    setSelectedCustomerId(customerId);
    setIsCustomerModalOpen(true);
  };

  const closeCustomerModal = () => {
    setSelectedCustomerId(null);
    setIsCustomerModalOpen(false);
  };

  const openProgressModal = (customerId) => {
    setSelectedCustomerId(customerId);
    setIsProgressModalOpen(true);
  };

  const closeProgressModal = () => {
    setSelectedCustomerId(null);
    setIsProgressModalOpen(false);
  };

  const openSellPackageModal = (customerId) => {
    setSelectedCustomerId(customerId);
    setIsSellPackageModalOpen(true);
  };

  const closeSellPackageModal = () => {
    setSelectedCustomerId(null);
    setIsSellPackageModalOpen(false);
  };

  const deleteCustomer = (customerId) => {
    if (window.confirm('Are you sure? This will delete all associated bookings and records.')) {
      const updatedCustomers = state.customers.filter(c => c.id !== customerId);
      const updatedBookings = state.bookings.filter(b => b.customerId !== customerId);
      const updatedTransactions = state.transactions.filter(t => t.customerId !== customerId);
      const updatedWaitingList = state.waitingList.filter(item => item.customerId !== customerId);

      setState(prev => ({
        ...prev,
        customers: updatedCustomers,
        bookings: updatedBookings,
        transactions: updatedTransactions,
        waitingList: updatedWaitingList,
      }));
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl">Customers</h2>
          <button onClick={() => openCustomerModal()} className="btn btn-primary">
            Add Customer
          </button>
        </div>
        <div id="customers-list-table" className="overflow-x-auto">
          {customers.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No customers found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="">Name</th>
                  <th className="hidden sm:table-cell">Email</th>
                  <th className="hidden md:table-cell">Phone</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td className="hidden sm:table-cell">{customer.email || '-'}</td>
                    <td className="hidden md:table-cell">{customer.phone || '-'}</td>
                    <td className="text-right">
                        <button onClick={() => openProgressModal(customer.id)} className="font-medium text-green-600 hover:text-green-900">View Progress</button>
                        <button onClick={() => openSellPackageModal(customer.id)} className="ml-4 font-medium text-blue-600 hover:text-blue-900">Sell Package</button>
                        <button onClick={() => openCustomerModal(customer.id)} className="ml-4 font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                        <button onClick={() => deleteCustomer(customer.id)} className="ml-4 font-medium text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isCustomerModalOpen && <CustomerModal customerId={selectedCustomerId} closeModal={closeCustomerModal} />}
      {isProgressModalOpen && <CustomerProgressModal customerId={selectedCustomerId} closeModal={closeProgressModal} />}
      {isSellPackageModalOpen && <SellPackageModal customerId={selectedCustomerId} closeModal={closeSellPackageModal} />}
    </>
  );
};

export default CustomersView;
