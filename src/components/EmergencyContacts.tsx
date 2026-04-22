import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Trash2, Edit2, Phone, User, Shield, Star, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isPrimary: boolean;
}

const STORAGE_KEY = "rakshasetu_emergency_contacts";

const getContacts = (): EmergencyContact[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveContacts = (contacts: EmergencyContact[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
};

const RELATION_KEYS = [
  "contacts.spouse",
  "contacts.parent",
  "contacts.sibling",
  "contacts.friend",
  "contacts.colleague",
  "contacts.neighbor",
  "contacts.other",
];

interface ContactFormProps {
  contact?: EmergencyContact;
  onSave: (contact: Omit<EmergencyContact, "id">) => void;
  onCancel: () => void;
}

const ContactForm = ({ contact, onSave, onCancel }: ContactFormProps) => {
  const { t } = useI18n();
  const [name, setName] = useState(contact?.name || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [relation, setRelation] = useState(contact?.relation || "contacts.friend");
  const [isPrimary, setIsPrimary] = useState(contact?.isPrimary || false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    const trimmedName = name.trim();
    if (!trimmedName) e.name = t("contacts.nameRequired");
    else if (trimmedName.length > 50) e.name = t("contacts.maxChars");

    const trimmedPhone = phone.trim().replace(/\s/g, "");
    if (!trimmedPhone) e.phone = t("contacts.phoneRequired");
    else if (!/^[\+]?[0-9]{7,15}$/.test(trimmedPhone)) e.phone = t("contacts.invalidPhone");

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ name: name.trim(), phone: phone.trim().replace(/\s/g, ""), relation, isPrimary });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-foreground mb-1 block">{t("contacts.fullName")}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder={t("contacts.enterName")}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {errors.name && <p className="text-[10px] text-crisis-critical mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="text-xs font-semibold text-foreground mb-1 block">{t("contacts.phoneNumber")}</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={16}
          type="tel"
          placeholder="+91 98765 43210"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {errors.phone && <p className="text-[10px] text-crisis-critical mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="text-xs font-semibold text-foreground mb-1 block">{t("contacts.relation")}</label>
        <div className="flex flex-wrap gap-1.5">
          {RELATION_KEYS.map((rKey) => (
            <button
              key={rKey}
              onClick={() => setRelation(rKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                relation === rKey
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {t(rKey)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsPrimary((p) => !p)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.98] ${
          isPrimary
            ? "border-primary bg-secondary text-primary"
            : "border-border text-muted-foreground hover:bg-muted"
        }`}
      >
        <Star className={`w-4 h-4 ${isPrimary ? "fill-primary" : ""}`} />
        {t("contacts.primaryContact")}
        <span className="text-[10px] font-normal ml-auto">{t("contacts.alertedFirst")}</span>
      </button>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors active:scale-[0.97]"
        >
          {t("contacts.cancel")}
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97]"
        >
          {contact ? t("contacts.update") : t("contacts.addContact")}
        </button>
      </div>
    </div>
  );
};

interface EmergencyContactsProps {
  onBack: () => void;
}

const EmergencyContacts = ({ onBack }: EmergencyContactsProps) => {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<EmergencyContact[]>(getContacts);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    saveContacts(contacts);
  }, [contacts]);

  const handleAdd = (data: Omit<EmergencyContact, "id">) => {
    if (contacts.length >= 10) {
      toast.error(t("contacts.maxContacts"));
      return;
    }
    const newContact: EmergencyContact = { ...data, id: crypto.randomUUID() };
    if (data.isPrimary) {
      setContacts((prev) => [...prev.map((c) => ({ ...c, isPrimary: false })), newContact]);
    } else {
      setContacts((prev) => [...prev, newContact]);
    }
    setAdding(false);
    toast.success(`${data.name} ${t("contacts.added")}`);
  };

  const handleUpdate = (data: Omit<EmergencyContact, "id">) => {
    if (!editing) return;
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === editing.id) return { ...data, id: c.id };
        if (data.isPrimary) return { ...c, isPrimary: false };
        return c;
      })
    );
    setEditing(null);
    toast.success(t("contacts.updated"));
  };

  const handleDelete = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
    toast.success(t("contacts.removed"));
  };

  const showForm = adding || editing;

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={showForm ? () => { setAdding(false); setEditing(null); } : onBack}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            {showForm ? (editing ? t("contacts.editContact") : t("contacts.addContact")) : t("contacts.title")}
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {showForm ? t("contacts.fillDetails") : `${contacts.length} contact${contacts.length !== 1 ? "s" : ""} • ${t("contacts.max")}`}
          </p>
        </div>
        {!showForm && contacts.length < 10 && (
          <button
            onClick={() => setAdding(true)}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {showForm ? (
          <div className="p-4">
            <ContactForm
              contact={editing || undefined}
              onSave={editing ? handleUpdate : handleAdd}
              onCancel={() => { setAdding(false); setEditing(null); }}
            />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground">{t("contacts.noContacts")}</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              {t("contacts.noContactsDesc")}
            </p>
            <button
              onClick={() => setAdding(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t("contacts.addFirst")}
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-2.5">
            {contacts
              .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
              .map((contact) => (
                <div
                  key={contact.id}
                  className={`relative p-3.5 rounded-xl border bg-card transition-all ${
                    contact.isPrimary ? "border-primary/30 bg-secondary/50" : "border-border"
                  }`}
                >
                  {deleteConfirm === contact.id ? (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-foreground font-semibold">{t("contacts.deleteConfirm")} {contact.name}?</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-1.5 rounded-lg bg-muted hover:bg-accent transition-colors active:scale-95"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="p-1.5 rounded-lg bg-crisis-critical/10 hover:bg-crisis-critical/20 transition-colors active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 text-crisis-critical" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        contact.isPrimary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-foreground truncate">{contact.name}</p>
                          {contact.isPrimary && <Star className="w-3 h-3 text-primary fill-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {t(contact.relation)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${encodeURIComponent(contact.phone)}`}
                          className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
                        >
                          <Phone className="w-4 h-4 text-crisis-safe" />
                        </a>
                        <button
                          onClick={() => setEditing(contact)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(contact.id)}
                          className="p-2 rounded-lg hover:bg-crisis-critical/10 transition-colors active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-crisis-critical" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyContacts;
