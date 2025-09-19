import React, { useState, useEffect, useMemo } from 'react';
import { useStateContext } from '../context/StateContext';
import CompletionModal from './CompletionModal';

const BookingModal = ({ bookingId, bookingDate, startTime, endTime, closeModal }) => {
  const { state, setState } = useStateContext();
  const { services, customers, staff, resources, bookings } = state;
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  const initialBookingState = useMemo(() => ({
    date: bookingDate || new Date().toISOString().slice(0, 10),
    startTime: startTime || '09:00',
    endTime: endTime || '10:00',
    serviceId: services[0]?.id || '',
    customerId: '',
    staffId: '',
    resourceIds: [],
    status: 'Scheduled',
    paymentStatus: 'Unpaid',
    fee: 0,
    pickup: '',
  }), [bookingDate, startTime, endTime, services]);

  const [booking, setBooking] = useState(initialBookingState);

  useEffect(() => {
    if (bookingId) {
      const existingBooking = bookings.find(b => b.id === bookingId);
      if (existingBooking) {
        setBooking(existingBooking);
      }
    } else {
        setBooking(initialBookingState);
    }
  }, [bookingId, bookings, initialBookingState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBooking(prev => ({ ...prev, [name]: value }));
  };

  const isTimeOverlapping = (start1, end1, start2, end2) => {
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };
    return timeToMinutes(start1) < timeToMinutes(end2) && timeToMinutes(end1) > timeToMinutes(start2);
  }

  const findBookingConflict = (bookingDetails) => {
    const { id, date, startTime, endTime, customerId, staffId, resourceIds } = bookingDetails;
    const staffConflict = bookings.find(b => b.id !== id && b.status !== 'Cancelled' && b.date === date && b.staffId === staffId && isTimeOverlapping(startTime, endTime, b.startTime, b.endTime));
    if (staffConflict) return `The selected staff member is already booked from ${staffConflict.startTime} to ${staffConflict.endTime}.`;
    const customerConflict = bookings.find(b => b.id !== id && b.status !== 'Cancelled' && b.date === date && b.customerId === customerId && isTimeOverlapping(startTime, endTime, b.startTime, b.endTime));
    if (customerConflict) return `This customer is already booked from ${customerConflict.startTime} to ${customerConflict.endTime}.`;
    if (resourceIds && resourceIds.length > 0) {
        const resourceConflict = bookings.find(b => b.id !== id && b.status !== 'Cancelled' && b.date === date && b.resourceIds && b.resourceIds.some(r => resourceIds.includes(r)) && isTimeOverlapping(startTime, endTime, b.startTime, b.endTime));
        if (resourceConflict) return `The resource is already booked from ${resourceConflict.startTime} to ${resourceConflict.endTime}.`;
    }
    return null;
  }

  const saveBooking = (e) => {
    e.preventDefault();
    const conflict = findBookingConflict(booking);
    if (conflict) {
      alert(conflict);
      return;
    }

    const originalBooking = bookingId ? bookings.find(b => b.id === bookingId) : null;
    if (booking.status === 'Completed' && originalBooking?.status !== 'Completed') {
        setIsCompletionModalOpen(true);
        return;
    }

    if (bookingId) {
      const updatedBookings = bookings.map(b => b.id === bookingId ? booking : b);
      setState(prev => ({ ...prev, bookings: updatedBookings }));
    } else {
      const newBooking = { ...booking, id: `booking_${Date.now()}` };
      setState(prev => ({ ...prev, bookings: [...prev.bookings, newBooking] }));
    }
    closeModal();
  };

  const deleteBooking = () => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
        const updatedBookings = bookings.filter(b => b.id !== bookingId);
        setState(prev => ({ ...prev, bookings: updatedBookings }));
        closeModal();
    }
  }

  useEffect(() => {
    if (booking.serviceId) {
        const service = services.find(s => s.id === booking.serviceId);
        if (service) {
            const timeToMinutes = (timeStr) => { const [h, m] = timeStr.split(':').map(Number); return h * 60 + m; };
            const minutesToTime = (totalMinutes) => { const h = Math.floor(totalMinutes / 60); const m = totalMinutes % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
            const newEndTime = minutesToTime(timeToMinutes(booking.startTime) + service.duration_minutes);
            setBooking(prev => ({...prev, endTime: newEndTime, fee: service.base_price || 0}));
        }
    }
  }, [booking.startTime, booking.serviceId, services]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
        <div className="w-full max-w-4xl modal">
          <div className="modal-header"><h3 id="booking-modal-title">{bookingId ? 'Edit Booking' : 'New Booking'}</h3></div>
          <form onSubmit={saveBooking} className="p-6 space-y-4">
            <div>
              <label htmlFor="booking-service" className="block mb-1 text-sm font-medium">Service</label>
              <select id="booking-service" name="serviceId" value={booking.serviceId} onChange={handleChange} required className="w-full">
                {services.map(s => <option key={s.id} value={s.id}>{s.service_name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="booking-customer" className="block mb-1 text-sm font-medium">Customer</label>
              <select id="booking-customer" name="customerId" value={booking.customerId} onChange={handleChange} required className="w-full">
                <option value="">-- Select --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="booking-staff" className="block mb-1 text-sm font-medium">Staff</label>
              <select id="booking-staff" name="staffId" value={booking.staffId} onChange={handleChange} required className="w-full">
                <option value="">-- Select --</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="booking-resource" className="block mb-1 text-sm font-medium">Resource</label>
              <select id="booking-resource" name="resourceIds" value={booking.resourceIds[0] || ''} onChange={(e) => setBooking(prev => ({...prev, resourceIds: [e.target.value]}))} required className="w-full">
                <option value="">-- Select --</option>
                {resources.map(r => <option key={r.id} value={r.id}>{r.resource_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="booking-start-time" className="block mb-1 text-sm font-medium">Start Time</label>
                <input type="time" id="booking-start-time" name="startTime" value={booking.startTime} onChange={handleChange} required className="w-full" />
              </div>
              <div>
                <label htmlFor="booking-end-time" className="block mb-1 text-sm font-medium">End Time</label>
                <input type="time" id="booking-end-time" name="endTime" value={booking.endTime} readOnly className="w-full bg-gray-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="booking-status" className="block mb-1 text-sm font-medium">Booking Status</label>
                    <select id="booking-status" name="status" value={booking.status} onChange={handleChange} className="w-full">
                        <option value="Pending">Pending</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="booking-payment-status" className="block mb-1 text-sm font-medium">Payment Status</label>
                    <select id="booking-payment-status" name="paymentStatus" value={booking.paymentStatus} onChange={handleChange} className="w-full">
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                        <option value="Paid (Credit)">Paid (Credit)</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t mt-6">
              <div>{bookingId && <button type="button" onClick={deleteBooking} className="btn btn-danger">Delete</button>}</div>
              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Booking</button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {isCompletionModalOpen && <CompletionModal booking={booking} closeModal={() => {setIsCompletionModalOpen(false); closeModal();}} />}
    </>
  );
};

export default BookingModal;
