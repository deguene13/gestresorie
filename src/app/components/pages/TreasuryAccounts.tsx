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
  manager_name: form.managerName.trim(),
  manager_phone: form.managerPhone.trim(),
  manager_email: form.managerEmail.trim(),
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
        
  <form
    onSubmit={handleSubmit}
    className="bg-white border border-gray-200 rounded-xl p-5 space-y-6"
  >
    <div>
    </div>

    {/* Informations du compte */}
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">
        Informations du compte
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du compte *
          </label>
          <input
            required
            placeholder="Ex. Compte bancaire principal"
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            required
            value={form.accountType}
            onChange={(event) =>
              setForm({
                ...form,
                accountType: event.target.value as AccountType,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="BANK">Banque</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CASH">Caisse</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de compte
          </label>
          <input
            placeholder="Numéro de compte"
            value={form.accountNumber}
            onChange={(event) =>
              setForm({
                ...form,
                accountNumber: event.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </div>

    {/* Gestionnaire du compte */}
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">
        Gestionnaire du compte
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du gestionnaire *
          </label>
          <input
            required
            placeholder="Nom du gestionnaire"
            value={form.managerName}
            onChange={(event) =>
              setForm({
                ...form,
                managerName: event.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone *
          </label>
          <input
            required
            type="tel"
            placeholder="Téléphone"
            value={form.managerPhone}
            onChange={(event) =>
              setForm({
                ...form,
                managerPhone: event.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mail du gestionnaire *
          </label>
          <input
            required
            type="email"
            placeholder="E-mail du gestionnaire"
            value={form.managerEmail}
            onChange={(event) =>
              setForm({
                ...form,
                managerEmail: event.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </div>

    {/* Solde */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Solde d'ouverture (FCFA)
      </label>
      <input
        type="number"
        min="0"
        placeholder="0"
        value={form.openingBalance}
        onChange={(event) =>
          setForm({
            ...form,
            openingBalance: event.target.value,
          })
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>

    {/* Actions */}
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={() => setShowForm(false)}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        Annuler
      </button>

      <button
        disabled={saving}
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {saving ? "Création..." : "Ajouter le compte"}
      </button>
    </div>
  </form>
)}
 <div>
          <h1 className="text-2xl font-semibold text-gray-900">Consultez la liste des comptes trésoreries</h1>
          <p className="text-gray-600 mt-1"> </p>
        </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? <p className="p-6 text-gray-500">Chargement...</p> : accounts.length === 0 ? (
          <div className="p-10 text-center text-gray-500"><Wallet className="w-8 h-8 mx-auto mb-2 text-gray-300" />Aucun compte configuré.</div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50">
  <tr>
    <th className="px-5 py-3 text-left">Compte</th>
    <th className="px-5 py-3 text-left">Type</th>
    <th className="px-5 py-3 text-left">Numéro</th>
    <th className="px-5 py-3 text-left">Gestionnaire</th>
    <th className="px-5 py-3 text-left">Téléphone</th>
     <th className="px-5 py-3 text-left">E-mail</th>
    <th className="px-5 py-3 text-right">Solde</th>
    <th className="px-5 py-3 text-left">Devise</th>
  </tr>
</thead>
<tbody 
className="divide-y divide-gray-100">{accounts.map((account) => 
<tr key={account.id}>
    <td className="px-5 py-4 font-medium text-gray-900">{account.name}
        </td>
        <td className="px-5 py-4 text-gray-600">{account.type === "bank" ? "Banque" : account.type === "mobile_money" ? "Mobile Money" : "Caisse"}
            </td>
            <td className="px-5 py-4 text-gray-600">{account.accountNumber || "—"}
                </td>
                <td className="px-5 py-4 text-gray-600">
                    {account.managerName || "—"}
                </td>
                <td className="px-5 py-4 text-gray-600">
                   {account.managerPhone || "—"}
                </td>
                <td className="px-5 py-4 text-gray-600">
                    {account.managerEmail || "—"}
              </td>
                <td className="px-5 py-4 text-right text-gray-900">{account.balance.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{account.currency} 
                        </td>
                        </tr>
                        )}
                        </tbody>
                        </table>
                        </div>
        )}
      </div>
    </div>
  );
}
