import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const HoursSplitModal = ({ isOpen, onClose, onConfirm, splitData }) => {
  if (!isOpen || !splitData) return null;

  const {
    hoursEntered = 0,
    remainingAlloc = 0,
    regularPortion = 0,
    overtimePortion = 0,
    customerName = 'Client Customer',
    assignmentTitle = 'Project Assignment'
  } = splitData;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 flex flex-col gap-4 text-left animate-in fade-in zoom-in duration-150">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Overtime Approval Required</h3>
            <p className="text-[11px] text-slate-500">Part of these hours exceeds authorized allocation</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Hours Reported:</span>
            <span className="font-bold text-slate-900">{parseFloat(hoursEntered).toFixed(1)} hrs</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Remaining Allocation:</span>
            <span className="font-bold text-slate-900">{parseFloat(remainingAlloc).toFixed(1)} hrs</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200/60 pt-1 mt-1">
            <span>Regular Recorded (Auto):</span>
            <span>+{parseFloat(regularPortion).toFixed(1)} hrs</span>
          </div>
          <div className="flex justify-between text-amber-700 font-bold">
            <span>Overtime Sent to Client:</span>
            <span>+{parseFloat(overtimePortion).toFixed(1)} hrs</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 flex flex-col gap-1 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
          <p><strong className="text-slate-800">Customer:</strong> {customerName}</p>
          <p><strong className="text-slate-800">Assignment:</strong> {assignmentTitle}</p>
        </div>

        <div className="flex gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition-colors shadow-md shadow-emerald-900/20"
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  );
};
