import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, KeyRound, X } from 'lucide-react';
import { PAYHIP_CHECKOUT_URL, validateLicenseKey } from '../config/licenses';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: (licenseKey: string) => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  onActivated,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setSuccessMsg('');
    const timer = setTimeout(() => inputRef.current?.focus(), 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateLicenseKey(keyInput);
    if (!result.valid) {
      setSuccessMsg('');
      setErrorMsg(result.message);
      return;
    }

    setErrorMsg('');
    setSuccessMsg(result.message);
    onActivated(result.normalizedKey || keyInput.trim().toUpperCase());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-modal-title"
        data-testid="license-modal"
        className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="license-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Activer mon Premium
              </h2>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Colle la clé reçue par email après ton paiement sur Payhip
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre d'activation"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="license-key-input"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Clé de licence Payhip
            </label>
            <input
              ref={inputRef}
              id="license-key-input"
              type="text"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Ex: MAHFOUD-ABCD-1234"
              className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 font-mono text-sm uppercase text-slate-900 dark:text-slate-100 placeholder:normal-case placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              data-testid="license-error"
              className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-sm font-medium text-rose-800 dark:text-rose-200"
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              data-testid="license-success"
              className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 dark:text-emerald-200"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            {successMsg ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Continuer
              </button>
            ) : (
              <button
                type="submit"
                className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
              >
                Activer
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3.5 text-center">
          <a
            href={PAYHIP_CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
          >
            Pas encore de clé ? Acheter sur Payhip -&gt;
          </a>
        </div>
      </div>
    </div>
  );
};
