import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context/StateContext';

const ExpenseModal = ({ expenseId, closeModal }) => {
  const { state, setState } = useStateContext();
  const [expense, setExpense] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Fuel',
    description: '',
    amount: 0,
  });

  useEffect(() => {
    if (expenseId) {
      const existingExpense = state.expenses.find(e => e.id === expenseId);
      if (existingExpense) {
        setExpense(existingExpense);
      }
    }
  }, [expenseId, state.expenses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExpense(prev => ({ ...prev, [name]: value }));
  };

  const saveExpense = (e) => {
    e.preventDefault();
    const expenseData = {
      ...expense,
      amount: parseFloat(expense.amount),
    };

    if (expenseId) {
      // Update existing expense
      const updatedExpenses = state.expenses.map(e =>
        e.id === expenseId ? expenseData : e
      );
      setState(prev => ({ ...prev, expenses: updatedExpenses }));
    } else {
      // Add new expense
      const newExpense = { ...expenseData, id: `expense_${Date.now()}` };
      setState(prev => ({
        ...prev,
        expenses: [...prev.expenses, newExpense],
      }));
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-4xl modal">
        <div className="modal-header">
          <h3 id="expense-modal-title">{expenseId ? 'Edit Expense' : 'New Expense'}</h3>
        </div>
        <form onSubmit={saveExpense} className="p-6 space-y-4">
          <input type="hidden" id="expense-id" value={expense.id || ''} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expense-date" className="block mb-1 text-sm font-medium">Date</label>
              <input type="date" id="expense-date" name="date" value={expense.date} onChange={handleChange} required className="w-full" />
            </div>
            <div>
              <label htmlFor="expense-category" className="block mb-1 text-sm font-medium">Category</label>
              <select id="expense-category" name="category" value={expense.category} onChange={handleChange} required className="w-full">
                <option>Fuel</option>
                <option>Insurance</option>
                <option>Maintenance</option>
                <option>Tax</option>
                <option>Office Supplies</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="expense-description" className="block mb-1 text-sm font-medium">Description</label>
            <input type="text" id="expense-description" name="description" value={expense.description} onChange={handleChange} required className="w-full" />
          </div>
          <div>
            <label htmlFor="expense-amount" className="block mb-1 text-sm font-medium">Amount (€)</label>
            <input type="number" id="expense-amount" name="amount" value={expense.amount} onChange={handleChange} required className="w-full" step="0.01" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
