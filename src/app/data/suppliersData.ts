export interface Supplier {
  id: string;
  raison_sociale: string;
  ninea: string;
  rccm: string;
  email: string;
  phone: string;
  address: string;
  contact_principal_nom: string;
  contact_principal_email: string;
  contact_principal_phone: string;
  payment_terms: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type FournisseurView = Supplier & {
  name: string;
  contact: string;
  adresse: string;
  status: "Actif" | "Inactif";
  category: string;
  solde: number;
};