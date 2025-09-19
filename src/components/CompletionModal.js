import React from 'react';
import { useStateContext } from '../context/StateContext';

const CompletionModal = ({ booking, closeModal }) => {
  const { state, setState } = useStateContext();
  const { customers, services } = state;
  const customer = customers.find(c => c.id === booking.customerId);
  const service = services.find(s => s.id === booking.serviceId);
  const durationHours = (service.duration_minutes || 60) / 60;
  const currentCredits = customer.driving_school_details?.lesson_credits || 0;

  const handlePayment = (paymentStatus) => {
    let updatedBooking = { ...booking, status: 'Completed', paymentStatus };
    let updatedCustomers = [...customers];

    if (paymentStatus === 'Paid (Credit)') {
      const customerIndex = customers.findIndex(c => c.id === booking.customerId);
      const updatedCustomer = { ...customers[customerIndex] };
      updatedCustomer.driving_school_details.lesson_credits -= durationHours;
      updatedCustomers[customerIndex] = updatedCustomer;
    }

    const updatedBookings = state.bookings.map(b => b.id === booking.id ? updatedBooking : b);
    setState(prev => ({ ...prev, bookings: updatedBookings, customers: updatedCustomers }));
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-md modal">
        <div className="modal-header"><h3 id="completion-modal-title">Complete Lesson</h3></div>
        <div className="p-6 space-y-4">
          <p id="completion-message" className="text-gray-600">Mark lesson for {customer.name} as complete. How was it paid?</p>
          <div id="completion-credit-info" className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
            Customer has <strong>{currentCredits}</strong> hours of credit. This lesson is <strong>{durationHours.toFixed(1)}</strong> hours.
            {currentCredits < durationHours && <br />}
            {currentCredits < durationHours && <span className="text-red-600 font-semibold">Not enough credits for this lesson.</span>}
          </div>
          <div id="completion-buttons" className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <button onClick={() => handlePayment('Paid')} className="btn btn-green">Paid Now</button>
            <button onClick={() => handlePayment('Paid (Credit)')} className="btn btn-primary" disabled={currentCredits < durationHours}>Use Lesson Credits</button>
            <button onClick={() => handlePayment('Unpaid')} className="btn btn-secondary">Remains Unpaid</button>
            <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
