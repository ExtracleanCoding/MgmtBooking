import React, { useState } from 'react';
import { useStateContext } from '../context/StateContext';
import ExpenseModal from './ExpenseModal';

const ExpensesView = () => {
  const { state, setState } = useStateContext();
  const { expenses } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);

  const openExpenseModal = (expenseId = null) => {
    setSelectedExpenseId(expenseId);
    setIsModalOpen(true);
  };

  const closeExpenseModal = () => {
    setSelectedExpenseId(null);
    setIsModalOpen(false);
  };

  const deleteExpense = (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense entry?')) {
      const updatedExpenses = state.expenses.filter(e => e.id !== expenseId);
      setState(prev => ({ ...prev, expenses: updatedExpenses }));
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl">Expenses</h2>
          <button onClick={() => openExpenseModal()} className="btn btn-primary">
            Add Expense
          </button>
        </div>
        <div id="expenses-list-table" className="overflow-x-auto">
          {expenses.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No expenses found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="w-1/6">Date</th>
                  <th className="w-1/6">Category</th>
                  <th className="w-3/6">Description</th>
                  <th className="text-right w-1/6">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map(expense => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.date).toLocaleDateString('en-GB')}</td>
                    <td>{expense.category}</td>
                    <td>{expense.description}</td>
                    <td className="text-right">€{expense.amount.toFixed(2)}</td>
                    <td className="text-right">
                      <button onClick={() => openExpenseModal(expense.id)} className="font-medium text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                      <button onClick={() => deleteExpense(expense.id)} className="ml-4 font-medium text-red-600 hover:text-red-900">
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
      {isModalOpen && <ExpenseModal expenseId={selectedExpenseId} closeModal={closeExpenseModal} />}
    </>
  );
};

export default ExpensesView;
