import React, { useState, useMemo } from 'react';
import { useStateContext } from '../context/StateContext';
import InvoiceModal from './InvoiceModal';

const BillingView = () => {
  const { state } = useStateContext();
  const { bookings, customers, transactions, services } = state;
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const customerSummaries = useMemo(() => {
    const sortedCustomers = [...customers].sort((a, b) => a.name.localeCompare(b.name));
    return sortedCustomers.map(customer => {
      const customerBookings = bookings.filter(b => b.customerId === customer.id && (b.status === 'Completed' || b.status === 'Scheduled'));
      const totalBilled = customerBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
      const paidTransactions = transactions.filter(t => t.customerId === customer.id && t.type === 'payment');
      const totalPaid = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        id: customer.id,
        name: customer.name,
        bookingCount: customerBookings.length,
        totalBilled,
        totalPaid,
        outstanding: totalBilled - totalPaid,
      };
    }).filter(s => s.bookingCount > 0 || s.totalPaid > 0);
  }, [customers, bookings, transactions]);

  const grandTotalRevenue = customerSummaries.reduce((sum, s) => sum + s.totalBilled, 0);
  const grandTotalPaid = customerSummaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const grandTotalOutstanding = grandTotalRevenue - grandTotalPaid;

  const selectedCustomerDetails = useMemo(() => {
    if (!selectedCustomerId) return null;
    const customer = customers.find(c => c.id === selectedCustomerId);
    const customerBookings = bookings.filter(b => b.customerId === selectedCustomerId && b.status !== 'Cancelled').sort((a, b) => new Date(b.date) - new Date(a.date));
    const customerTransactions = transactions.filter(t => t.customerId === selectedCustomerId).sort((a, b) => new Date(b.date) - new Date(a.date));
    const summary = customerSummaries.find(s => s.id === selectedCustomerId);
    return { customer, customerBookings, customerTransactions, summary };
  }, [selectedCustomerId, customers, bookings, transactions, customerSummaries]);

  const copyPaymentReminder = () => {
    if (!selectedCustomerDetails) return;
    const { customer, summary } = selectedCustomerDetails;
    const message = `Hi ${customer.name.split(' ')[0]}, just a friendly reminder that you have an outstanding balance of €${summary.outstanding.toFixed(2)}. Please let me know if you have any questions. Thanks, ${state.settings.instructorName}.`;
    navigator.clipboard.writeText(message).then(() => alert('Payment reminder copied to clipboard!'));
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="dashboard-card bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Total Billed</h3>
            <p className="text-4xl font-bold mt-1">€{grandTotalRevenue.toFixed(2)}</p>
          </div>
          <div className="dashboard-card bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Total Paid</h3>
            <p className="text-4xl font-bold mt-1">€{grandTotalPaid.toFixed(2)}</p>
          </div>
          <div className="dashboard-card bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold">Total Outstanding</h3>
            <p className="text-4xl font-bold mt-1">€{grandTotalOutstanding.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold p-4 border-b">Summary by Customer</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th className="text-center">Bookings</th>
                  <th className="text-right">Total Billed</th>
                  <th className="text-right">Total Paid</th>
                  <th className="text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customerSummaries.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCustomerId(s.id)}>
                    <td className="font-medium">{s.name}</td>
                    <td className="text-center">{s.bookingCount}</td>
                    <td className="text-right">€{s.totalBilled.toFixed(2)}</td>
                    <td className="text-right text-green-600">€{s.totalPaid.toFixed(2)}</td>
                    <td className={`text-right font-semibold ${s.outstanding > 0 ? 'text-red-600' : ''}`}>€{s.outstanding.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedCustomerDetails && (
          <div className="bg-white rounded-lg shadow p-4 mt-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Detailed Statement for {selectedCustomerDetails.customer.name}</h3>
              <button onClick={() => setSelectedCustomerId(null)} className="text-sm text-gray-500 hover:text-gray-800">&times; Close</button>
            </div>
            <div className="overflow-x-auto mt-4">
                <table className="min-w-full">
                    <thead><tr><th>Date</th><th>Description</th><th>Status</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {selectedCustomerDetails.customerBookings.map(item => (
                            <tr key={item.id}>
                                <td>{new Date(item.date).toLocaleDateString('en-GB')}</td>
                                <td>Booking: {services.find(s => s.id === item.serviceId)?.service_name || 'Unknown'}</td>
                                <td>{item.status}</td>
                                <td className="text-right">€{(item.fee || 0).toFixed(2)}</td>
                                <td className="text-right"></td>
                            </tr>
                        ))}
                        {selectedCustomerDetails.customerTransactions.map(item => (
                            <tr key={item.id} className="bg-green-50">
                                <td>{new Date(item.date).toLocaleDateString('en-GB')}</td>
                                <td>{item.description}</td>
                                <td>Payment</td>
                                <td className="text-right"></td>
                                <td className="text-right text-green-700">€{item.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold border-t-2"><td colSpan="3" className="text-right">Total Billed:</td><td className="text-right">€{selectedCustomerDetails.summary.totalBilled.toFixed(2)}</td><td></td></tr>
                        <tr className="font-bold"><td colSpan="4" className="text-right">Total Paid:</td><td className="text-right text-green-700">€{selectedCustomerDetails.summary.totalPaid.toFixed(2)}</td></tr>
                        <tr className="font-bold text-lg border-t-2"><td colSpan="4" className="text-right">Balance Outstanding:</td><td className={`text-right ${selectedCustomerDetails.summary.outstanding > 0 ? 'text-red-600' : ''}`}>€{selectedCustomerDetails.summary.outstanding.toFixed(2)}</td></tr>
                    </tfoot>
                </table>
            </div>
            <div className="mt-6 flex gap-2">
                <button onClick={() => setIsInvoiceModalOpen(true)} className="btn btn-purple">Generate Invoice</button>
                <button onClick={copyPaymentReminder} className="btn btn-secondary">Copy Payment Reminder</button>
            </div>
          </div>
        )}
      </div>
      {isInvoiceModalOpen && <InvoiceModal customerId={selectedCustomerId} closeModal={() => setIsInvoiceModalOpen(false)} />}
    </>
  );
};

export default BillingView;
