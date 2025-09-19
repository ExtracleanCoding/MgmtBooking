import React, { useState, useMemo } from 'react';
import { useStateContext } from '../context/StateContext';

const SummaryView = () => {
  const { state } = useStateContext();
  const { bookings, customers, staff, resources, services } = state;
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerId: 'all',
    staffId: 'all',
    resourceId: 'all',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (filters.startDate && b.date < filters.startDate) return false;
      if (filters.endDate && b.date > filters.endDate) return false;
      if (filters.customerId !== 'all' && b.customerId !== filters.customerId) return false;
      if (filters.staffId !== 'all' && b.staffId !== filters.staffId) return false;
      if (filters.resourceId !== 'all' && !b.resourceIds.includes(filters.resourceId)) return false;
      return true;
    });
  }, [bookings, filters]);

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Booking Summary</h2>
      </div>
      <div id="summary-filters" className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label htmlFor="summary-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" id="summary-start-date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full" />
        </div>
        <div>
          <label htmlFor="summary-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" id="summary-end-date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full" />
        </div>
        <div>
          <label htmlFor="summary-customer" className="block text-sm font-medium text-gray-700">Customer</label>
          <select id="summary-customer" name="customerId" value={filters.customerId} onChange={handleFilterChange} className="mt-1 block w-full">
            <option value="all">-- All --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="summary-staff" className="block text-sm font-medium text-gray-700">Staff</label>
          <select id="summary-staff" name="staffId" value={filters.staffId} onChange={handleFilterChange} className="mt-1 block w-full">
            <option value="all">-- All --</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="summary-resource" className="block text-sm font-medium text-gray-700">Resource</label>
          <select id="summary-resource" name="resourceId" value={filters.resourceId} onChange={handleFilterChange} className="mt-1 block w-full">
            <option value="all">-- All --</option>
            {resources.map(r => <option key={r.id} value={r.id}>{r.resource_name}</option>)}
          </select>
        </div>
      </div>
      <div id="summary-list-container">
        {filteredBookings.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No bookings found for the selected filters.</p>
        ) : (
          <div className="border border-gray-200 rounded-b-lg">
            <div className="font-semibold text-sm text-gray-600 p-3 bg-gray-50 grid grid-cols-6 gap-4">
              <p>Date</p>
              <p>Time</p>
              <p>Customer</p>
              <p>Staff</p>
              <p>Resource</p>
              <p>Service</p>
            </div>
            {filteredBookings.map(booking => {
              const customer = customers.find(c => c.id === booking.customerId);
              const staffMember = staff.find(s => s.id === booking.staffId);
              const resource = resources.find(r => booking.resourceIds.includes(r.id));
              const service = services.find(s => s.id === booking.serviceId);
              return (
                <div key={booking.id} className="p-3 border-b border-gray-200 grid grid-cols-6 gap-4 items-center">
                  <p className="font-semibold">{new Date(booking.date).toLocaleDateString('en-GB')}</p>
                  <p>{booking.startTime} - {booking.endTime}</p>
                  <p>{customer ? customer.name : 'N/A'}</p>
                  <p>{staffMember ? staffMember.name : 'N/A'}</p>
                  <p>{resource ? resource.resource_name : 'N/A'}</p>
                  <p>{service ? service.service_name : 'N/A'}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryView;
