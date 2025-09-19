import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context/StateContext';

const CustomerProgressModal = ({ customerId, closeModal }) => {
  const { state, setState } = useStateContext();
  const [customer, setCustomer] = useState(null);
  const [newNote, setNewNote] = useState({ date: '', notes: '', skillsCovered: [] });

  useEffect(() => {
    if (customerId) {
      const currentCustomer = state.customers.find(c => c.id === customerId);
      setCustomer(currentCustomer);
      if (currentCustomer?.driving_school_details?.progress_notes?.length > 0) {
        setNewNote(prev => ({...prev, date: currentCustomer.driving_school_details.progress_notes[0].date}))
      }
    }
  }, [customerId, state.customers]);

  const handleNoteChange = (e) => {
    const { name, value } = e.target;
    setNewNote(prev => ({ ...prev, [name]: value }));
  };

  const saveProgressNote = (e) => {
    e.preventDefault();
    const customerIndex = state.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return;

    const updatedCustomer = { ...state.customers[customerIndex] };
    if (!updatedCustomer.driving_school_details) {
      updatedCustomer.driving_school_details = { progress_notes: [] };
    }
    if (!updatedCustomer.driving_school_details.progress_notes) {
      updatedCustomer.driving_school_details.progress_notes = [];
    }

    const newNoteWithId = { ...newNote, id: `note_${Date.now()}` };
    updatedCustomer.driving_school_details.progress_notes.push(newNoteWithId);

    const updatedCustomers = [...state.customers];
    updatedCustomers[customerIndex] = updatedCustomer;

    setState(prev => ({ ...prev, customers: updatedCustomers }));
    setNewNote({ date: '', notes: '', skillsCovered: [] });
  };

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-4xl modal flex flex-col max-h-[90vh]">
        <div className="modal-header flex justify-between items-center">
          <h3 id="customer-progress-modal-title">Customer Progress for {customer.name}</h3>
          <button id="summarize-progress-btn" className="btn btn-purple text-sm">✨ Summarize Progress</button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Lesson History */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">Lesson History</h4>
            <div id="progress-log-list" className="space-y-3">
              {customer.driving_school_details?.progress_notes?.length > 0 ? (
                customer.driving_school_details.progress_notes.map(note => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="font-semibold text-gray-800">{new Date(note.date).toLocaleDateString('en-GB')}</h5>
                    <p className="mt-2 text-gray-700 whitespace-pre-wrap">{note.notes}</p>
                  </div>
                ))
              ) : (
                <p>No progress notes yet.</p>
              )}
            </div>
          </div>
          {/* Add New Note Form */}
          <form id="progress-log-form" onSubmit={saveProgressNote} className="border-t pt-6 space-y-4">
            <h4 id="progress-form-title" className="text-xl font-semibold text-gray-800">Add New Lesson Note</h4>
            <div>
                <label htmlFor="progress-notes" className="block mb-1 text-sm font-medium text-gray-700">Lesson Date</label>
                <input type="date" name="date" value={newNote.date} onChange={handleNoteChange} required className="w-full" />
            </div>
            <div>
              <label htmlFor="progress-notes" className="block mb-1 text-sm font-medium text-gray-700">General Notes</label>
              <textarea id="progress-notes" name="notes" value={newNote.notes} onChange={handleNoteChange} rows="3" className="w-full" placeholder="e.g., Customer did well with roundabouts..."></textarea>
            </div>
            <div id="progress-form-buttons" className="text-right space-x-2">
                <button type="submit" className="btn btn-primary">Save Note</button>
            </div>
          </form>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end items-center rounded-b-lg mt-auto">
          <button type="button" onClick={closeModal} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProgressModal;
