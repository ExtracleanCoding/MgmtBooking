import React, { useState } from 'react';
import { useStateContext } from '../context/StateContext';

const BlockDatesModal = ({ closeModal }) => {
  const { state, setState } = useStateContext();
  const { staff } = state;
  const [blockedPeriod, setBlockedPeriod] = useState({
    staffId: 'all',
    start: '',
    end: '',
    reason: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlockedPeriod(prev => ({ ...prev, [name]: value }));
  };

  const saveBlockedPeriod = (e) => {
    e.preventDefault();
    const newBlockedPeriod = { ...blockedPeriod, id: `block_${Date.now()}` };
    setState(prev => ({
      ...prev,
      blockedPeriods: [...prev.blockedPeriods, newBlockedPeriod],
    }));
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-4xl modal">
        <div className="modal-header"><h3>Block Dates</h3></div>
        <form onSubmit={saveBlockedPeriod} className="p-6 space-y-4">
          <div>
            <label htmlFor="block-staff" className="block mb-1 text-sm font-medium">Staff Member</label>
            <select id="block-staff" name="staffId" value={blockedPeriod.staffId} onChange={handleChange} required className="w-full">
              <option value="all">All Staff (School Holiday)</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="block-start-date" className="block mb-1 text-sm font-medium">Start Date</label>
              <input type="date" id="block-start-date" name="start" value={blockedPeriod.start} onChange={handleChange} required className="w-full" />
            </div>
            <div>
              <label htmlFor="block-end-date" className="block mb-1 text-sm font-medium">End Date</label>
              <input type="date" id="block-end-date" name="end" value={blockedPeriod.end} onChange={handleChange} required className="w-full" />
            </div>
          </div>
          <div>
            <label htmlFor="block-reason" className="block mb-1 text-sm font-medium">Reason</label>
            <input type="text" id="block-reason" name="reason" value={blockedPeriod.reason} onChange={handleChange} required className="w-full" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-danger">Block Dates</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlockDatesModal;
