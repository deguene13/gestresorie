import { useState } from "react";
import { XCircle, X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motif: string) => void;
  documentRef?: string;
  documentType?: string;
};

export function RejectModal({ isOpen, onClose, onConfirm, documentRef, documentType = "document" }: Props) {
  const [motif, setMotif] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!motif.trim()) { setError(true); return; }
    onConfirm(motif.trim());
    setMotif("");
    setError(false);
  };

  const handleClose = () => {
    setMotif("");
    setError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Rejeter le {documentType}</h3>
              {documentRef && <p className="text-xs text-gray-500">{documentRef}</p>}
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif du rejet <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motif}
              onChange={(e) => { setMotif(e.target.value); setError(false); }}
              rows={4}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none resize-none transition ${
                error ? "border-red-400 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-400"
              }`}
              placeholder="Décrivez la raison du rejet (erreur de montant, document manquant, non-conformité...)"
            />
            {error && (
              <p className="text-xs text-red-600 mt-1">Le motif du rejet est obligatoire.</p>
            )}
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-700">
              Une notification sera envoyée au créateur du document avec le motif saisi.
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  );
}
