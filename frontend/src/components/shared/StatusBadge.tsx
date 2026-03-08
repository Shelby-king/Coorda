import clsx from 'clsx';

type Status =
  | 'draft'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'open'
  | 'closed'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'unverified'
  | 'verified'
  | 'failed'
  | 'locked'
  | 'released'
  | 'disputed'
  | 'resolved';

const config: Record<Status, { label: string; classes: string; dot: string }> = {
  draft:     { label: 'Draft',     classes: 'bg-gray-800/80 text-gray-400 border-gray-700/50',   dot: 'bg-gray-500' },
  active:    { label: 'Active',    classes: 'bg-green-900/30 text-green-accent border-green-accent/30', dot: 'bg-green-accent animate-pulse' },
  completed: { label: 'Completed', classes: 'bg-blue-900/30 text-blue-400 border-blue-500/30',   dot: 'bg-blue-400' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-900/20 text-red-400 border-red-500/20',      dot: 'bg-red-400' },
  open:      { label: 'Open',      classes: 'bg-green-900/30 text-green-accent border-green-accent/30', dot: 'bg-green-accent animate-pulse' },
  closed:    { label: 'Closed',    classes: 'bg-gray-800/80 text-gray-400 border-gray-700/50',   dot: 'bg-gray-500' },
  pending:   { label: 'Pending',   classes: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400 animate-pulse' },
  approved:  { label: 'Approved',  classes: 'bg-green-900/30 text-green-accent border-green-accent/30', dot: 'bg-green-accent' },
  rejected:  { label: 'Rejected',  classes: 'bg-red-900/20 text-red-400 border-red-500/20',      dot: 'bg-red-400' },
  unverified:{ label: 'Unverified',classes: 'bg-gray-800/80 text-gray-400 border-gray-700/50',   dot: 'bg-gray-500' },
  verified:  { label: 'Verified',  classes: 'bg-cyan-900/30 text-cyan border-cyan/30',            dot: 'bg-cyan' },
  failed:    { label: 'Failed',    classes: 'bg-red-900/20 text-red-400 border-red-500/20',       dot: 'bg-red-400' },
  locked:    { label: 'Locked',    classes: 'bg-cyan-900/30 text-cyan border-cyan/30',            dot: 'bg-cyan' },
  released:  { label: 'Released',  classes: 'bg-green-900/30 text-green-accent border-green-accent/30', dot: 'bg-green-accent' },
  disputed:  { label: 'Disputed',  classes: 'bg-orange-900/20 text-orange-400 border-orange-500/20', dot: 'bg-orange-400 animate-pulse' },
  resolved:  { label: 'Resolved',  classes: 'bg-blue-900/30 text-blue-400 border-blue-500/30',   dot: 'bg-blue-400' },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = config[status] ?? { label: status, classes: 'bg-gray-800/80 text-gray-400 border-gray-700/50', dot: 'bg-gray-500' };
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border font-body', cfg.classes)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
