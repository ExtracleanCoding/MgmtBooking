import React, { useState } from 'react';
import { useStateContext } from '../context/StateContext';
import BookingModal from './BookingModal';

const WaitingListView = () => {
  const { state, setState } = useStateContext();
  const { waitingList, bookings, customers, staff } = state;
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const openBookingModal = (date, startTime, endTime) => {
    setBookingDetails({ date, startTime, endTime });
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setBookingDetails(null);
    setIsBookingModalOpen(false);
  };

  const isTimeOverlapping = (start1, end1, start2, end2) => {
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };
    return timeToMinutes(start1) < timeToMinutes(end2) && timeToMinutes(end1) > timeToMinutes(start2);
  }

  const isSlotAvailable = (item) => {
    const { date, startTime, endTime, customerId, staffId, resourceIds } = item;

    const customerConflict = bookings.some(b =>
        b.status !== 'Cancelled' && b.customerId === customerId && b.date === date &&
        isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
    );
    if (customerConflict) return false;

    if (staffId) {
        const staffBookingConflict = bookings.some(b =>
            b.status !== 'Cancelled' && b.staffId === staffId && b.date === date &&
            isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
        );
        if (staffBookingConflict) return false;
    }

    if (resourceIds && resourceIds.length > 0) {
        const resourceBookingConflict = bookings.some(b =>
            b.status !== 'Cancelled' && b.date === date &&
            isTimeOverlapping(startTime, endTime, b.startTime, b.endTime) &&
            b.resourceIds && b.resourceIds.some(r => resourceIds.includes(r))
        );
        if (resourceBookingConflict) return false;
    }

    return true;
  };

  const removeWaitingListItem = (id) => {
    if (window.confirm('Are you sure you want to remove this waiting list entry?')) {
      const updatedWaitingList = waitingList.filter(item => item.id !== id);
      setState(prev => ({ ...prev, waitingList: updatedWaitingList }));
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Waiting List</h2>
        </div>
        <div className="overflow-x-auto">
          {waitingList.length === 0 ? (
            <p className="text-center py-8 text-gray-500">The waiting list is currently empty.</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Staff</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {waitingList.map(item => {
                  const customer = customers.find(c => c.id === item.customerId);
                  const staffMember = staff.find(s => s.id === item.staffId);
                  const slotAvailable = isSlotAvailable(item);

                  return (
                    <tr key={item.id}>
                      <td>{customer ? customer.name : 'Unknown'}</td>
                      <td>{new Date(item.date).toLocaleDateString('en-GB')}</td>
                      <td>{item.startTime} - {item.endTime}</td>
                      <td>{staffMember ? staffMember.name : 'Any'}</td>
                      <td>
                        {slotAvailable ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Available</span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Booked</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => openBookingModal(item.date, item.startTime, item.endTime)}
                          className={`btn ${slotAvailable ? 'btn-green' : 'btn-secondary'} text-xs`}
                          disabled={!slotAvailable}
                        >
                          Book Now
                        </button>
                        <button onClick={() => removeWaitingListItem(item.id)} className="btn btn-danger text-xs ml-2">
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isBookingModalOpen && <BookingModal bookingDate={bookingDetails.date} startTime={bookingDetails.startTime} endTime={bookingDetails.endTime} closeModal={closeBookingModal} />}
    </>
  );
};

export default WaitingListView;
