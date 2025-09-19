import React from 'react';
import { useStateContext } from '../context/StateContext';

const DialogModal = () => {
  const { dialog, closeDialog } = useStateContext();
  const { title, message, buttons } = dialog;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-sm modal">
        <div className="modal-header"><h3 id="dialog-title">{title}</h3></div>
        <div className="p-6">
          <p id="dialog-message" className="mt-2 text-gray-600">{message}</p>
          <div id="dialog-buttons" className="flex justify-end gap-3 mt-6">
            {buttons.map((btn, i) => (
              <button key={i} onClick={() => { if(btn.onClick) btn.onClick(); closeDialog(); }} className={`btn ${btn.class}`}>
                {btn.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialogModal;
