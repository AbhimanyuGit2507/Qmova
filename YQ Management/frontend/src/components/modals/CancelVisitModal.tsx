import React, { useState } from "react";
import { XCircle, ShieldAlert, UserX } from "lucide-react";

export interface CancellationReasonOption {
  id: string;
  label: string;
  icon: string;
}

export const DEFAULT_CANCELLATION_REASONS: CancellationReasonOption[] = [
  { id: "CUSTOMER_REQUEST", label: "Customer Requested Cancellation", icon: "person_cancel" },
  { id: "NO_SHOW", label: "Customer No-Show / Unresponsive", icon: "person_off" },
  { id: "STAFF_UNAVAILABLE", label: "Staff Member / Doctor Unavailable", icon: "badge" },
  { id: "SCHEDULE_CONFLICT", label: "Schedule Conflict / Overbooking", icon: "event_busy" },
  { id: "DUPLICATE_BOOKING", label: "Duplicate or Accidental Booking", icon: "content_copy" },
  { id: "EQUIPMENT_MAINTENANCE", label: "Equipment / Facility Offline", icon: "build" },
  { id: "EMERGENCY", label: "Location Emergency / Forced Closure", icon: "emergency" },
  { id: "OTHER", label: "Other / Administrative Decision", icon: "more_horiz" },
];

interface CancelVisitModalProps {
  visit: AnyFixMe | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (payload: {
    visitId: string;
    isToken: boolean;
    reasonCategory: string;
    customNotes: string;
    refundApplicable: boolean;
  }) => Promise<void>;
  isCancelling?: boolean;
}

export const CancelVisitModal: React.FC<CancelVisitModalProps> = ({
  visit,
  isOpen,
  onClose,
  onConfirmCancel,
  isCancelling = false,
}) => {
  const [reasonCategory, setReasonCategory] = useState<string>("CUSTOMER_REQUEST");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [confirmText, setConfirmText] = useState<string>("");
  const [refundApplicable, setRefundApplicable] = useState<boolean>(false);

  if (!isOpen || !visit) return null;

  const handleConfirm = async () => {
    if (!customNotes.trim() || confirmText.trim().toUpperCase() !== "CANCEL") return;
    await onConfirmCancel({
      visitId: visit.id,
      isToken: !!visit.isToken,
      reasonCategory,
      customNotes: customNotes.trim(),
      refundApplicable,
    });
    setCustomNotes("");
    setConfirmText("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high dark:bg-zinc-800 border border-border dark:border-zinc-700 text-on-surface dark:text-zinc-200 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-outline" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface dark:text-white leading-tight">
                Cancel Booking / Visit
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Customer:{" "}
                <span className="font-semibold text-on-surface dark:text-zinc-200">
                  {visit.customer?.name || "Walk-in"}
                </span>{" "}
                • Ticket:{" "}
                <span className="font-mono font-bold text-primary">
                  {visit.displayId || visit.ticketNumber || `#TKT-${visit.id.substring(0, 4)}`}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-outline hover:text-on-surface dark:hover:text-white rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Select Reason Category */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-on-surface dark:text-zinc-300 uppercase tracking-wider">
            Select Cancellation Reason *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_CANCELLATION_REASONS.map((reason) => {
              const isSelected = reasonCategory === reason.id;
              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setReasonCategory(reason.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary text-primary dark:text-sky-400 font-semibold shadow-xs"
                      : "bg-surface-container/50 dark:bg-zinc-800/50 border-border/70 text-outline hover:border-border hover:text-on-surface dark:hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    {reason.icon}
                  </span>
                  <span className="leading-tight">{reason.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Required Explanation Textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-on-surface dark:text-zinc-300 flex items-center justify-between">
            <span>Cancellation Reason & Explanation *</span>
            <span className="text-[10px] font-medium text-outline">Required</span>
          </label>
          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="Enter detailed explanation. This note is recorded in audit logs and sent directly to the customer in their cancellation message."
            rows={3}
            className="w-full bg-surface-container/40 dark:bg-zinc-800/40 border border-border dark:border-zinc-700 rounded-xl p-3 text-xs text-on-surface dark:text-white outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Refund Applicable Checkbox */}
        <label className="flex items-start gap-3 p-3 bg-surface-container/40 dark:bg-zinc-800/40 border border-border/70 dark:border-zinc-800 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={refundApplicable}
            onChange={(e) => setRefundApplicable(e.target.checked)}
            className="mt-0.5 rounded border-border dark:border-zinc-700 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
          />
          <div className="flex flex-col text-xs">
            <span className="font-bold text-on-surface dark:text-white">
              Payment Refund Applicable
            </span>
            <span className="text-outline text-[11px]">
              Flags this booking for financial refund. Customer will be notified that their refund is being processed.
            </span>
          </div>
        </label>

        {/* Confirm Type Section */}
        <div className="p-3 bg-surface-container-high/60 dark:bg-zinc-800/60 border border-border dark:border-zinc-700 rounded-xl flex flex-col gap-2">
          <div className="text-xs text-on-surface dark:text-zinc-200 font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-outline" />
            <span>
              Type <strong>CANCEL</strong> below to confirm cancellation:
            </span>
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type CANCEL"
            className="w-full bg-card dark:bg-zinc-900 border border-border dark:border-zinc-700 focus:border-primary rounded-lg p-2 text-xs font-mono font-bold text-on-surface dark:text-white outline-none uppercase"
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface dark:hover:text-white hover:bg-surface-container transition-colors cursor-pointer"
          >
            Keep Booking
          </button>
          <button
            type="button"
            disabled={
              isCancelling ||
              !customNotes.trim() ||
              confirmText.trim().toUpperCase() !== "CANCEL"
            }
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {isCancelling ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Confirm & Cancel Booking
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

