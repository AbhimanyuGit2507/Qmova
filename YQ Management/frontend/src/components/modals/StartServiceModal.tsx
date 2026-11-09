import React from "react";
import { Play, X, ScanLine } from "lucide-react";

interface StartServiceModalProps {
  visit: AnyFixMe | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner: () => void;
  onStartManual: (visit: AnyFixMe, e: React.MouseEvent) => Promise<void>;
  isLoading?: boolean;
  formatAppointmentTime: (date: string | Date) => string;
}

export const StartServiceModal: React.FC<StartServiceModalProps> = ({
  visit,
  isOpen,
  onClose,
  onOpenScanner,
  onStartManual,
  isLoading = false,
  formatAppointmentTime,
}) => {
  if (!isOpen || !visit) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-primary/20" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface dark:text-white leading-tight">
                Start Service
              </h3>
              <p className="text-xs text-outline mt-0.5">
                Ticket{" "}
                <span className="font-mono font-bold text-primary">
                  {visit.displayId || visit.ticketNumber || `#TKT-${visit.id.substring(0, 4)}`}
                </span>{" "}
                • {visit.customer?.name || "Walk-in"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-outline hover:text-on-surface dark:hover:text-white rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Service & Details Info */}
        <div className="bg-surface-container/50 dark:bg-zinc-800/40 rounded-xl p-3 border border-border/70 dark:border-zinc-800 flex flex-col gap-1 text-xs">
          <div className="flex justify-between text-on-surface dark:text-zinc-200">
            <span className="text-outline">Service:</span>
            <span className="font-semibold">
              {visit.service?.name || "Standard Service"}
            </span>
          </div>
          {visit.scheduledTime && (
            <div className="flex justify-between text-on-surface dark:text-zinc-200">
              <span className="text-outline">Slot:</span>
              <span className="font-semibold">
                {formatAppointmentTime(visit.scheduledTime)}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-on-surface/80 dark:text-zinc-300 leading-relaxed">
          Choose how you would like to begin service for this customer.
          Scanning the customer ticket QR verifies physical presence.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="w-full py-3 px-4 rounded-xl text-xs md:text-sm font-bold text-white bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            Scan QR to Verify & Start
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => onStartManual(visit, e)}
            className="w-full py-3 px-4 rounded-xl text-xs md:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting Service...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Without Scan (Manual Override)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-outline hover:text-on-surface dark:hover:text-white transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

