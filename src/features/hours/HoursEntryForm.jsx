import React from 'react';
import { AlertCircle, Clock, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export const HoursEntryForm = ({
  assignments = [],
  selectedAssignmentId = '',
  onSelectAssignment,
  workDate = '',
  onChangeWorkDate,
  hours = '',
  onChangeHours,
  workSummary = '',
  onChangeSummary,
  notes = '',
  onChangeNotes,
  onSubmit,
  isSubmitting = false,
  onCancel,
  getSupplierName = (id) => id,
  getPlantName = (id) => id
}) => {
  const activeAssignment = assignments.find(a => String(a.id) === String(selectedAssignmentId)) || (assignments.length === 1 ? assignments[0] : null);

  const authHours = parseFloat(activeAssignment?.authorized_regular_hours ?? activeAssignment?.authorized_hours ?? 0);
  const usedRegular = parseFloat(activeAssignment?.used_regular_hours ?? 0);
  const remainingAlloc = Math.max(0, authHours - usedRegular);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5 text-left">
      {/* Assignment Selection */}
      <div>
        <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
          Project Assignment *
        </label>
        {assignments.length === 0 ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
            <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              No active project assignment assigned.
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5 ml-5.5">
              Admin must create or configure a project assignment before hours can be logged.
            </p>
          </div>
        ) : assignments.length === 1 ? (
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-left flex flex-col gap-1">
            <span className="text-xs font-extrabold text-slate-900 block">{activeAssignment?.title || activeAssignment?.name}</span>
            <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5">
              <span><strong>Customer:</strong> {getSupplierName(activeAssignment?.billing_customer_id || activeAssignment?.customer_id)}</span>
              <span><strong>Plant:</strong> {getPlantName(activeAssignment?.plant_id)}</span>
            </div>
            <div className="text-[10.5px] font-bold text-emerald-700 mt-1 pt-1 border-t border-slate-200 flex justify-between">
              <span>Authorized Allocation: {authHours > 0 ? `${authHours.toFixed(1)}h` : 'Not Configured'}</span>
              <span>Remaining: {authHours > 0 ? `${remainingAlloc.toFixed(1)}h` : '0.0h'}</span>
            </div>
          </div>
        ) : (
          <select
            id="hours-entry-assignment-select"
            value={selectedAssignmentId}
            onChange={(e) => onSelectAssignment && onSelectAssignment(e.target.value)}
            required
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
          >
            <option value="">-- Select Active Assignment --</option>
            {assignments.map(asgn => {
              const pTitle = asgn.title || asgn.name || `Assignment ${asgn.id}`;
              const custName = getSupplierName(asgn.billing_customer_id || asgn.customer_id);
              const alloc = parseFloat(asgn.authorized_regular_hours ?? asgn.authorized_hours ?? asgn.po_hours ?? asgn.allotted_hours ?? 0);
              const allocText = alloc > 0 ? `${alloc}h authorized` : 'Open Allocation';
              return (
                <option key={asgn.id} value={asgn.id}>
                  {pTitle} — {custName} [{allocText}]
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Date & Reported Hours */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
            Work Date *
          </label>
          <input
            type="date"
            value={workDate}
            onChange={(e) => onChangeWorkDate && onChangeWorkDate(e.target.value)}
            required
            className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
            Reported Hours *
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            placeholder="e.g. 8.0"
            value={hours}
            onChange={(e) => onChangeHours && onChangeHours(e.target.value)}
            required
            className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
          />
        </div>
      </div>

      {/* Work Summary */}
      <div>
        <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
          Work Summary & Activity Description *
        </label>
        <textarea
          rows={2}
          placeholder="Describe quality activities, sorting, containment, or inspection performed..."
          value={workSummary}
          onChange={(e) => onChangeSummary && onChangeSummary(e.target.value)}
          required
          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || assignments.length === 0}
          className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl transition-colors shadow-md shadow-emerald-900/20 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isSubmitting ? 'Recording Hours...' : 'Submit & Record Hours'}
        </button>
      </div>
    </form>
  );
};
