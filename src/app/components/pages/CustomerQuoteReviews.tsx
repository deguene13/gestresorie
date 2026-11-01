import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, ClipboardCheck, Loader2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import {
  getCustomerQuotes,
  reviewCustomerQuoteAvailability,
} from "../../data/quotesData";

type QuoteLine = {
  id: string;
  quantity: number | string;
  product_detail?: { name?: string };
  product_name?: string;
  product?: string;
};

type CustomerQuote = {
  id: string;
  reference?: string;
  quote_date?: string;
  created_at?: string;
  status: string;
  customer_detail?: { raison_sociale?: string; name?: string };
  customer_name?: string;
  customer?: string;
  total_amount_ttc?: number | string;
  total_amount?: number | string;
  items?: QuoteLine[];
};

type AvailabilityDecision = {
  available: boolean | null;
  note: string;
};

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getCustomerName(quote: CustomerQuote) {
  return quote.customer_detail?.raison_sociale ||
    quote.customer_detail?.name || quote.customer_name || quote.customer || "—";
}

export function CustomerQuoteReviews() {
  const { hasRole } = useAuth();
  const { addNotification } = useAppData();
  const canReview = hasRole(["admin", "gestionnaire_achats"]);
  const [quotes, setQuotes] = useState<CustomerQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedQuote, setSelectedQuote] = useState<CustomerQuote | null>(null);
  const [decisions, setDecisions] = useState<Record<string, AvailabilityDecision>>({});
  const [saving, setSaving] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const saveInProgress = useRef(false);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await getCustomerQuotes();
      setQuotes((Array.isArray(result) ? result : []).filter(
        (quote: CustomerQuote) => quote.status === "PURCHASING_REVIEW"
      ));
    } catch (error) {
      console.error("Erreur de chargement des devis clients à vérifier :", error);
      setLoadError("Impossible de charger les devis. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canReview) void loadQuotes();
    else setLoading(false);
  }, [canReview, loadQuotes, reloadKey]);

  const lines = Array.isArray(selectedQuote?.items) ? selectedQuote.items : [];
  const allLinesHaveDecisions = lines.length > 0 && lines.every((line) =>
    isUuid(line.id) && typeof decisions[line.id]?.available === "boolean"
  );

  const openReview = (quote: CustomerQuote) => {
    setSelectedQuote(quote);
    setReviewError("");
    setDecisions(Object.fromEntries(
      (quote.items ?? []).filter((line) => isUuid(line.id)).map((line) => [
        line.id,
        { available: null, note: "" },
      ])
    ));
  };

  const closeReview = () => {
    if (saving) return;
    setSelectedQuote(null);
    setDecisions({});
    setReviewError("");
  };

  const saveReview = async () => {
    if (!selectedQuote || !allLinesHaveDecisions || saveInProgress.current) return;
    saveInProgress.current = true;
    setSaving(true);
    setReviewError("");
    try {
      await reviewCustomerQuoteAvailability(
        selectedQuote.id,
        lines.map((line) => ({
          id: line.id,
          available: decisions[line.id].available as boolean,
          note: decisions[line.id].note,
        }))
      );
      setQuotes((current) => current.filter((quote) => quote.id !== selectedQuote.id));
      addNotification({
        type: "success",
        title: "Vérification enregistrée",
        message: "Les disponibilités ont été enregistrées et le devis a été transmis au client.",
        module: "devis",
        documentRef: selectedQuote.reference,
      });
      setSelectedQuote(null);
      setDecisions({});
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Erreur d'enregistrement des disponibilités :", error);
      setReviewError("La vérification n'a pas pu être enregistrée. Vos choix sont conservés, vous pouvez réessayer.");
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  };

  if (!canReview) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Cette rubrique est réservée au Responsable Achats.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Devis clients à vérifier</h1>
          <p className="mt-1 text-sm text-gray-600">
            Vérifiez la disponibilité de chaque article avant l’envoi du devis au client.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
          {quotes.length} en attente
        </span>
      </header>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 px-5 py-8 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des devis…
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-start gap-3 px-5 py-6 text-sm text-red-700">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="rounded-lg border border-red-200 px-3 py-2 font-medium hover:bg-red-50"
            >
              Réessayer
            </button>
          </div>
        ) : quotes.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-800">Aucun devis à vérifier</p>
            <p className="mt-1 text-sm text-gray-500">
              Les devis transmis par le Service Commercial apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {["Référence", "Client", "Date", "Montant TTC", "Statut", "Action"].map((label) => (
                    <th key={label} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map((quote) => {
                  const date = quote.quote_date || quote.created_at;
                  return (
                    <tr key={quote.id}>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">{quote.reference || quote.id}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{getCustomerName(quote)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {date ? new Date(date).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900">
                        {Number(quote.total_amount_ttc ?? quote.total_amount ?? 0).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          À vérifier
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openReview(quote)}
                          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          <ClipboardCheck className="h-4 w-4" /> Vérifier les articles
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedQuote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-review-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="quote-review-title" className="text-xl font-semibold text-gray-900">
                  Vérifier le devis {selectedQuote.reference || selectedQuote.id}
                </h2>
                <p className="mt-1 text-sm text-gray-600">Client : {getCustomerName(selectedQuote)}</p>
              </div>
              <button type="button" onClick={closeReview} disabled={saving} aria-label="Fermer" className="text-gray-400 hover:text-gray-700 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </header>

            {lines.length === 0 ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Ce devis ne contient aucune ligne à vérifier.
              </p>
            ) : (
              <div className="space-y-3">
                {lines.map((line, index) => {
                  const validId = isUuid(line.id);
                  const decision = validId ? decisions[line.id] : undefined;
                  return (
                    <article key={validId ? line.id : index} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {line.product_detail?.name || line.product_name || line.product || "Article"}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">Quantité demandée : {line.quantity}</p>
                          {!validId && <p className="mt-2 text-xs text-red-700">Identifiant de ligne invalide.</p>}
                        </div>
                        <label className="w-full text-xs text-gray-600 sm:w-56">
                          Disponibilité *
                          <select
                            value={decision?.available === null || !decision ? "" : decision.available ? "true" : "false"}
                            disabled={!validId || saving}
                            onChange={(event) => setDecisions((current) => ({
                              ...current,
                              [line.id]: {
                                ...current[line.id],
                                available: event.target.value === "" ? null : event.target.value === "true",
                              },
                            }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                          >
                            <option value="">Choisir une décision</option>
                            <option value="true">Disponible</option>
                            <option value="false">Indisponible</option>
                          </select>
                        </label>
                      </div>
                      <label className="mt-3 block text-xs text-gray-600">
                        Note facultative
                        <textarea
                          value={decision?.note ?? ""}
                          disabled={!validId || saving}
                          onChange={(event) => setDecisions((current) => ({
                            ...current,
                            [line.id]: { ...current[line.id], note: event.target.value },
                          }))}
                          rows={2}
                          placeholder="Ex. quantité partiellement disponible"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                        />
                      </label>
                    </article>
                  );
                })}
              </div>
            )}

            {reviewError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{reviewError}</p>}

            <footer className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button type="button" onClick={closeReview} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void saveReview()}
                disabled={!allLinesHaveDecisions || saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {saving ? "Enregistrement…" : "Enregistrer et transmettre au client"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
