import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context/StateContext';

const StaffModal = ({ staffId, closeModal }) => {
  const { state, setState } = useStateContext();
  const [staffMember, setStaffMember] = useState({
    name: '',
    email: '',
    phone: '',
    staff_type: 'INSTRUCTOR',
  });

  useEffect(() => {
    if (staffId) {
      const existingStaff = state.staff.find(s => s.id === staffId);
      if (existingStaff) {
        setStaffMember(existingStaff);
      }
    }
  }, [staffId, state.staff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStaffMember(prev => ({ ...prev, [name]: value }));
  };

  const saveStaff = (e) => {
    e.preventDefault();
    if (staffId) {
      // Update existing staff
      const updatedStaff = state.staff.map(s =>
        s.id === staffId ? staffMember : s
      );
      setState(prev => ({ ...prev, staff: updatedStaff }));
    } else {
      // Add new staff
      const newStaff = { ...staffMember, id: `staff_${Date.now()}` };
      setState(prev => ({
        ...prev,
        staff: [...prev.staff, newStaff],
      }));
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-4xl modal">
        <div className="modal-header">
          <h3 id="staff-modal-title">{staffId ? 'Edit Staff Member' : 'New Staff Member'}</h3>
        </div>
        <form onSubmit={saveStaff} className="p-6 space-y-4">
          <input type="hidden" id="staff-id" value={staffMember.id || ''} />
          <div>
            <label htmlFor="staff-name" className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="staff-name" name="name" value={staffMember.name} onChange={handleChange} required className="w-full" />
          </div>
          <div>
            <label htmlFor="staff-email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="staff-email" name="email" value={staffMember.email} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label htmlFor="staff-phone" className="block mb-1 text-sm font-medium text-gray-700">Phone Number</label>
            <input type="tel" id="staff-phone" name="phone" value={staffMember.phone} onChange={handleChange} className="w-full" />
          </div>
          <div>
            <label htmlFor="staff-type" className="block mb-1 text-sm font-medium text-gray-700">Staff Type</label>
            <select id="staff-type" name="staff_type" value={staffMember.staff_type} onChange={handleChange} required className="w-full">
              <option value="INSTRUCTOR">Instructor</option>
              <option value="GUIDE">Tour Guide</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Staff Member</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;
