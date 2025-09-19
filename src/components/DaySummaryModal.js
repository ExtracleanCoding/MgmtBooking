import React, { useState } from 'react';
import { useStateContext } from '../context/StateContext';
import BookingModal from './BookingModal';

const DaySummaryModal = ({ date, closeModal }) => {
  const { state } = useStateContext();
  const { bookings, customers, staff } = state;
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const dayBookings = bookings.filter(b => b.date === date && b.status !== 'Cancelled').sort((a,b) => a.startTime.localeCompare(b.startTime));

  const openBookingModal = (bookingId = null) => {
    setSelectedBookingId(bookingId);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setSelectedBookingId(null);
    setIsBookingModalOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
        <div className="w-full max-w-4xl modal">
          <div className="modal-header flex justify-between items-center">
            <h3 id="day-summary-modal-title">Bookings for {new Date(date).toLocaleDateString('en-GB')}</h3>
            <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-200">
              <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div id="day-summary-bookings-list" className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {dayBookings.length > 0 ? (
              dayBookings.map(booking => {
                const customer = customers.find(c => c.id === booking.customerId);
                const staffMember = staff.find(s => s.id === booking.staffId);
                return (
                  <div key={booking.id} className="p-3 bg-blue-50 rounded-lg flex items-center justify-between hover:bg-blue-100">
                    <div>
                      <p className="font-semibold text-gray-800">{booking.startTime} - {booking.endTime}</p>
                      <p className="text-sm text-gray-600">{customer ? customer.name : 'Unknown Customer'}</p>
                      <p className="text-xs text-gray-500">Staff: {staffMember ? staffMember.name : 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openBookingModal(booking.id)} title="Edit Booking" className="p-2 rounded-full hover:bg-blue-100 text-blue-600">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-4">No bookings scheduled for this day.</p>
            )}
          </div>
          <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-lg">
            <button onClick={closeModal} className="btn btn-secondary">Close</button>
            <button id="day-summary-add-new" onClick={() => openBookingModal()} className="btn btn-primary">Add New Booking</button>
          </div>
        </div>
      </div>
      {isBookingModalOpen && <BookingModal bookingId={selectedBookingId} bookingDate={date} closeModal={closeBookingModal} />}
    </>
  );
};

export default DaySummaryModal;
