import { FormEvent, useEffect, useState } from "react";
import { Plus, RefreshCw, Wallet } from "lucide-react";
import { getTreasuryAccounts, createTreasuryAccount } from "../../data/treasuryData";
import { useAuth } from "../../context/AuthContext";

type AccountType = "BANK" | "MOBILE_MONEY" | "CASH";

type AccountForm = {
  name: string;
  accountType: AccountType;
  accountNumber: string;
  bankName: string;
  currency: string;
  openingBalance: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
};

const emptyForm: AccountForm = {
  name: "",
  accountType: "BANK",
  accountNumber: "",
  bankName: "",
  currency: "XOF",
  openingBalance: "0",
  managerName: "",
  managerPhone: "",
  managerEmail: "",
};

export function TreasuryAccounts() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("daily_treasury:view");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      setAccounts(await getTreasuryAccounts());
    } catch (loadError: any) {
      setError(loadError?.message || "Impossible de charger les comptes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSaving(true);
      await createTreasuryAccount({
        name: form.name.trim(),
        account_type: form.accountType,
        account_number: form.accountNumber.trim(),
        bank_name: form.bankName.trim(),
        currency: form.currency,
        opening_balance: form.openingBalance || "0",
        is_active: true,
      });
      setForm(emptyForm);
      setShowForm(false);
      await loadAccounts();
    } catch (saveError: any) {
      setError(saveError?.message || "Impossible de créer le compte.");
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return <div className="p-6 text-gray-500">Accès réservé à la trésorerie.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Comptes de trésorerie</h1>
          <p className="text-gray-600 mt-1">Consultez et créez les comptes utilisés par la trésorerie.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAccounts} className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50" title="Actualiser">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm((visible) => !visible)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Créer un compte
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Nom du compte *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            <select value={form.accountType} onChange={(event) => setForm({ ...form, accountType: event.target.value as AccountType })} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="BANK">Banque</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CASH">Caisse</option>
            </select>
            <input placeholder="Numéro de compte" value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input placeholder="Banque" value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="number" min="0" placeholder="Solde d'ouverture" value={form.openingBalance} onChange={(event) => setForm({ ...form, openingBalance: event.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input placeholder="Devise" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Annuler</button>
            <button disabled={saving} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? "Création..." : "Créer"}</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? <p className="p-6 text-gray-500">Chargement...</p> : accounts.length === 0 ? (
          <div className="p-10 text-center text-gray-500"><Wallet className="w-8 h-8 mx-auto mb-2 text-gray-300" />Aucun compte configuré.</div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-5 py-3 text-left">Compte</th><th className="px-5 py-3 text-left">Type</th><th className="px-5 py-3 text-left">Numéro</th><th className="px-5 py-3 text-right">Solde</th><th className="px-5 py-3 text-left">Devise</th></tr></thead><tbody className="divide-y divide-gray-100">{accounts.map((account) => <tr key={account.id}><td className="px-5 py-4 font-medium text-gray-900">{account.name}</td><td className="px-5 py-4 text-gray-600">{account.type === "bank" ? "Banque" : account.type === "mobile_money" ? "Mobile Money" : "Caisse"}</td><td className="px-5 py-4 text-gray-600">{account.accountNumber || "—"}</td><td className="px-5 py-4 text-right text-gray-900">{account.balance.toLocaleString("fr-FR")}</td><td className="px-5 py-4 text-gray-600">{account.currency}</td></tr>)}</tbody></table></div>
        )}
      </div>
    </div>
  );
}
