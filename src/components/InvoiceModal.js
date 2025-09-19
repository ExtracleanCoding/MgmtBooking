import React from 'react';
import { useStateContext } from '../context/StateContext';

const InvoiceModal = ({ customerId, closeModal }) => {
  const { state } = useStateContext();
  const { customers, bookings, services, settings } = state;
  const customer = customers.find(c => c.id === customerId);
  const unpaidBookings = bookings.filter(b => b.customerId === customerId && b.paymentStatus === 'Unpaid' && (b.status === 'Completed' || b.status === 'Scheduled'));
  const totalDue = unpaidBookings.reduce((sum, b) => sum + (b.fee || 0), 0);

  const printInvoice = () => {
    window.print();
  }

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-4xl modal">
        <div id="invoice-content" className="p-8">
          <div className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{settings.instructorName}</h1>
              <p className="text-gray-600 whitespace-pre-line">{settings.instructorAddress}</p>
            </div>
            <h2 className="text-4xl font-bold text-gray-500 uppercase">Invoice</h2>
          </div>
          <div className="flex justify-between mt-6">
            <div>
              <h3 className="font-semibold text-gray-800">Bill To:</h3>
              <p>{customer.name}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Invoice #:</span> INV-{customer.id.slice(-4)}-{Date.now()}</p>
              <p><span className="font-semibold">Date Issued:</span> {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
          <div className="mt-8">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-600">Description</th>
                  <th className="py-2 px-4 text-right text-sm font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {unpaidBookings.map(booking => {
                  const service = services.find(s => s.id === booking.serviceId);
                  return (
                    <tr key={booking.id}>
                      <td className="py-2 px-4 border-b">{new Date(booking.date).toLocaleDateString('en-GB')}</td>
                      <td className="py-2 px-4 border-b">{service ? service.service_name : 'Lesson'}</td>
                      <td className="py-2 px-4 border-b text-right">€{(booking.fee || 0).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <div className="w-64">
              <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-800 mt-2 pt-2">
                <p>Total Due:</p>
                <p>€{totalDue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center rounded-b-lg">
          <button onClick={closeModal} className="btn btn-secondary">Close</button>
          <button onClick={printInvoice} className="btn btn-primary">Print Invoice</button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
