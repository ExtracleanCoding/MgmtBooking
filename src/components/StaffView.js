import React, { useState } from 'react';
import { useStateContext } from '../context/StateContext';
import StaffModal from './StaffModal';

const StaffView = () => {
  const { state, setState } = useStateContext();
  const { staff } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const openStaffModal = (staffId = null) => {
    setSelectedStaffId(staffId);
    setIsModalOpen(true);
  };

  const closeStaffModal = () => {
    setSelectedStaffId(null);
    setIsModalOpen(false);
  };

  const deleteStaff = (staffId) => {
    if (window.confirm('Are you sure? This may affect existing bookings.')) {
      const updatedStaff = state.staff.filter(s => s.id !== staffId);
      // Invalidate staff in bookings
      const updatedBookings = state.bookings.map(b => {
        if (b.staffId === staffId) {
          return { ...b, staffId: null };
        }
        return b;
      });
      setState(prev => ({ ...prev, staff: updatedStaff, bookings: updatedBookings }));
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl">Staff</h2>
          <button onClick={() => openStaffModal()} className="btn btn-primary">
            Add Staff Member
          </button>
        </div>
        <div id="staff-list-table" className="overflow-x-auto">
          {staff.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No staff found.</p>
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
                {staff.map(staffMember => (
                  <tr key={staffMember.id}>
                    <td>{staffMember.name}</td>
                    <td className="hidden sm:table-cell">{staffMember.email || '-'}</td>
                    <td className="hidden md:table-cell">{staffMember.phone || '-'}</td>
                    <td className="text-right">
                      <button onClick={() => openStaffModal(staffMember.id)} className="font-medium text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                      <button onClick={() => deleteStaff(staffMember.id)} className="ml-4 font-medium text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isModalOpen && <StaffModal staffId={selectedStaffId} closeModal={closeStaffModal} />}
    </>
  );
};

export default StaffView;
