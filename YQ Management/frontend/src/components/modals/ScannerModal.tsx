import React from 'react';
import { ScannerInterface } from '../ScannerInterface';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: any) => void;
}

/**
 * Universal Scanner Modal — opens the unified ScannerInterface in modal mode.
 * Provides camera stream scanning, high-speed manual code/phone lookup,
 * full ordered items breakdown cards, real-time payment status (PAID vs PAY AT COUNTER),
 * and entitlement tracking.
 */
export function ScannerModal({ isOpen, onClose, onScanSuccess }: ScannerModalProps) {
  if (!isOpen) return null;

  return (
    <ScannerInterface
      mode="modal"
      onClose={onClose}
      onScanSuccess={onScanSuccess}
    />
  );
}
