const FUNNEL_TONE: Record<string, string> = {
  TOFU: "bg-sky-50 text-sky-600",
  MOFU: "bg-amber-50 text-amber-600",
  BOFU: "bg-emerald-50 text-emerald-600",
};

export function FunnelBadge({ funnel }: { funnel: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${FUNNEL_TONE[funnel] ?? "bg-slate-100"}`}>
      {funnel}
    </span>
  );
}

const APPROVAL_TONE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  APPROVED: "bg-emerald-50 text-emerald-600",
  REVISION: "bg-red-50 text-red-600",
};
const APPROVAL_LABEL: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REVISION: "Revisi",
};

export function ApprovalBadge({ approval }: { approval: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${APPROVAL_TONE[approval] ?? "bg-slate-100"}`}>
      {APPROVAL_LABEL[approval] ?? approval}
    </span>
  );
}

export const STATUS_LABEL: Record<string, string> = {
  IDEATION: "Ideation",
  SCRIPTING: "Scripting",
  TAKE_KONTEN: "Take Konten",
  EDITING: "Editing",
  REVIEW: "Review",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
};
