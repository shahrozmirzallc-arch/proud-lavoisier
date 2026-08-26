import { CheckCircle2, Clock, AlertTriangle, XCircle, RotateCcw, WifiOff } from 'lucide-react';

export const HoursStatus = ({ status, hourType, clientReviewStatus }) => {
  if (status === 'recorded' || (hourType === 'regular' && !status)) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10.5px] font-bold uppercase rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Recorded (Auto-Approved)
      </span>
    );
  }

  if (status === 'client_approved' || clientReviewStatus === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold uppercase rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Client Approved
      </span>
    );
  }

  if (status === 'client_pending' || clientReviewStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10.5px] font-bold uppercase rounded-full">
        <Clock className="w-3 h-3" /> Client Review Pending
      </span>
    );
  }

  if (status === 'client_returned' || clientReviewStatus === 'returned') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10.5px] font-bold uppercase rounded-full">
        <RotateCcw className="w-3 h-3" /> Returned for Revision
      </span>
    );
  }

  if (status === 'client_rejected' || clientReviewStatus === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10.5px] font-bold uppercase rounded-full">
        <XCircle className="w-3 h-3" /> Overtime Rejected
      </span>
    );
  }

  if (status === 'needs_allocation_configuration' || status === 'needs_configuration') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10.5px] font-bold uppercase rounded-full">
        <AlertTriangle className="w-3 h-3" /> Needs Allocation Config
      </span>
    );
  }

  if (status === 'needs_rate_configuration') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10.5px] font-bold uppercase rounded-full">
        <AlertTriangle className="w-3 h-3" /> Needs Rate Config
      </span>
    );
  }

  if (status === 'staged_offline' || status === 'queued') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-500/20 text-slate-300 border border-slate-500/40 text-[10.5px] font-bold uppercase rounded-full">
        <WifiOff className="w-3 h-3" /> Staged Offline
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10.5px] font-bold uppercase rounded-full">
      {status || 'Recorded'}
    </span>
  );
};
