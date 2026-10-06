"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

type ReceiptSummary = {
  id: string;
  fileName: string;
  mimeType: string;
};

export type PurchaseRecord = {
  id: string;
  merchant: string;
  note: string | null;
  amount: number;
  category: string;
  purchasedAt: string;
  paymentMethod: string | null;
  source: string;
  receipt: ReceiptSummary | null;
};

export type EmailConnectionRecord = {
  id: string;
  provider: string;
  email: string;
  status: string;
  previewMode: boolean;
  connectedAt: string;
  lastSyncedAt: string | null;
};

export type BudgetRecord = {
  id: string;
  category: string;
  monthlyLimit: number;
};

type WorkspaceProps = {
  initialTransactions: PurchaseRecord[];
  initialConnections: EmailConnectionRecord[];
  initialBudgets: BudgetRecord[];
};

type TabKey = "overview" | "activity" | "receipts" | "budgets" | "connections";
type IconName =
  | "overview"
  | "activity"
  | "receipt"
  | "budget"
  | "inbox"
  | "search"
  | "bell"
  | "plus"
  | "arrow"
  | "clock"
  | "mail"
  | "check"
  | "trash"
  | "close"
  | "upload"
  | "file"
  | "refresh"
  | "chevron"
  | "shield"
  | "sparkle"
  | "calendar"
  | "wallet"
  | "download"
  | "link"
  | "info"
  | "external"
  | "leaf";

type CategorySummary = {
  category: string;
  spent: number;
  limit: number;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const categoryPresentation: Record<string, { emoji: string; color: string; tint: string }> = {
  Groceries: { emoji: "🥑", color: "#64875a", tint: "#eef4e9" },
  Dining: { emoji: "☕", color: "#c9874a", tint: "#fbf0e4" },
  Subscriptions: { emoji: "✳", color: "#8e7aad", tint: "#f2eef8" },
  Transport: { emoji: "↗", color: "#5c8392", tint: "#eaf2f4" },
  Home: { emoji: "⌂", color: "#b4775e", tint: "#f8eeea" },
  Shopping: { emoji: "✦", color: "#b0798a", tint: "#f7edf1" },
  Health: { emoji: "♡", color: "#669b88", tint: "#eaf4f0" },
  Entertainment: { emoji: "♫", color: "#8c83b5", tint: "#f0eef8" },
  Other: { emoji: "·", color: "#78847d", tint: "#eff1ef" },
};

const navItems: { key: TabKey; label: string; icon: IconName }[] = [
  { key: "overview", label: "Overview", icon: "overview" },
  { key: "activity", label: "Transactions", icon: "activity" },
  { key: "receipts", label: "Receipts", icon: "receipt" },
  { key: "budgets", label: "Budgets", icon: "budget" },
  { key: "connections", label: "Connections & plan", icon: "inbox" },
];

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<IconName, ReactNode> = {
    overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>,
    activity: <><path d="M4 18.5h16M5.5 15V9m6.5 6V4.5m6.5 10.5v-4" /><path d="m4.5 7 5-3 5.5 4 4.5-3" /></>,
    receipt: <><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z" /><path d="M9 8h6m-6 4h6m-6 4h3" /></>,
    budget: <><path d="M4 19.5h16" /><path d="M6.5 16v-5m5 5V5m5 11v-8" /><path d="M4.5 5.5h4" /></>,
    inbox: <><path d="M4 5.5h16l1 10v3H3v-3z" /><path d="M3.5 14h5l1.5 2h4l1.5-2h5" /><path d="M12 4v6m-2.5-2.5L12 10l2.5-2.5" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M7 17 17 7M7.5 7H17v9.5" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
    mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" /></>,
    check: <><path d="m5 12.5 4.2 4L19 7" /></>,
    trash: <><path d="M4.5 7h15M9 7V4.5h6V7m3 0-.8 13H6.8L6 7m3.5 3v6m5-6v6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    upload: <><path d="M12 15V4m-4 4 4-4 4 4" /><path d="M5 14v5h14v-5" /></>,
    file: <><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v5h4M9 13h6m-6 3.5h6" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M18.5 11A7 7 0 0 0 6 7L4 9m0 8v-5h5" /><path d="M5.5 13A7 7 0 0 0 18 17l2-2" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    shield: <><path d="M12 3.5 19 6v5.5c0 4.2-2.7 7.4-7 9-4.3-1.6-7-4.8-7-9V6z" /><path d="m9 12 2 2 4-4" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
    calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3.5v4m8-4v4M4 10h16" /></>,
    wallet: <><path d="M4 6.5h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h13" /><path d="M21 11h-5a2 2 0 0 0 0 4h5zm-5 2h.01" /></>,
    download: <><path d="M12 4v11m-4-4 4 4 4-4" /><path d="M5 17v3h14v-3" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" /></>,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5m0-8h.01" /></>,
    external: <><path d="M13 5h6v6m0-6-9 9" /><path d="M17 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" /></>,
    leaf: <><path d="M19.5 4.5c-8.7 0-14 3.2-14 9 0 3.4 2.4 5.8 5.7 5.8 5.8 0 8.3-6.2 8.3-14.8Z" /><path d="M4.5 20c2.4-4.8 6.2-7.6 11-10" /></>,
  };

  return <svg {...shared}>{paths[name]}</svg>;
}

function money(value: number) {
  return currency.format(Number.isFinite(value) ? value : 0);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

function fullDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function categoryStyle(category: string) {
  return categoryPresentation[category] ?? categoryPresentation.Other;
}

function monthPurchases(purchases: PurchaseRecord[]) {
  const now = new Date();
  return purchases.filter((purchase) => {
    const date = new Date(purchase.purchasedAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-modal="true"
        className={`modal-card${wide ? " modal-card-wide" : ""}`}
        role="dialog"
        aria-label={title}
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button aria-label="Close dialog" className="icon-button modal-close" onClick={onClose} type="button">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon name={icon} size={22} /></div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

function TransactionList({
  purchases,
  onOpenReceipt,
  onDelete,
  showDelete = false,
}: {
  purchases: PurchaseRecord[];
  onOpenReceipt: (receipt: ReceiptSummary) => void;
  onDelete?: (purchase: PurchaseRecord) => void;
  showDelete?: boolean;
}) {
  if (purchases.length === 0) {
    return (
      <EmptyState
        icon="activity"
        title="Nothing to see just yet"
        body="Add a purchase or sync a sample inbox to see it show up here."
      />
    );
  }

  return (
    <div className="transaction-list">
      {purchases.map((purchase) => {
        const style = categoryStyle(purchase.category);
        return (
          <article className="transaction-row" key={purchase.id}>
            <div className="merchant-mark" style={{ backgroundColor: style.tint, color: style.color }}>
              <span>{style.emoji}</span>
            </div>
            <div className="transaction-copy">
              <div className="merchant-heading">
                <strong>{purchase.merchant}</strong>
                {purchase.source === "email" ? (
                  <span className="capture-tag"><Icon name="sparkle" size={12} /> Auto</span>
                ) : null}
              </div>
              <div className="transaction-subline">
                <span>{purchase.category}</span>
                <span className="subline-dot">·</span>
                <span>{dateLabel(purchase.purchasedAt)}</span>
                {purchase.note ? <span className="transaction-note">· {purchase.note}</span> : null}
              </div>
            </div>
            <div className="transaction-trailing">
              <strong className="transaction-amount">−{money(purchase.amount)}</strong>
              {purchase.receipt ? (
                <button
                  className="receipt-action"
                  onClick={() => onOpenReceipt(purchase.receipt!)}
                  type="button"
                >
                  <Icon name="file" size={14} /> Receipt
                </button>
              ) : (
                <span className="no-receipt">No receipt</span>
              )}
            </div>
            {showDelete && onDelete ? (
              <button
                aria-label={`Delete ${purchase.merchant}`}
                className="icon-button row-delete"
                onClick={() => onDelete(purchase)}
                type="button"
              >
                <Icon name="trash" size={16} />
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function PlanCard({ onManage, compact = false }: { onManage: () => void; compact?: boolean }) {
  const renewal = new Date();
  renewal.setDate(renewal.getDate() + 365);
  const formattedRenewal = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(renewal);

  return (
    <section className={`plan-card${compact ? " plan-card-compact" : ""}`}>
      <div className="plan-card-top">
        <span className="plan-icon"><Icon name="leaf" size={19} /></span>
        <span className="plan-status"><span className="status-dot" /> ACTIVE</span>
      </div>
      <p className="plan-eyebrow">YOUR MORROW MEMBERSHIP</p>
      <h3>Morrow Plus</h3>
      <div className="plan-price">$48 <span>/ year</span></div>
      <div className="plan-divider" />
      <div className="plan-renewal"><Icon name="calendar" size={15} /> Renews {formattedRenewal}</div>
      <p className="plan-description">A whole year of calmer money, better habits, and every receipt in one place.</p>
      <button className="plan-manage" onClick={onManage} type="button">
        View plan details <Icon name="arrow" size={15} />
      </button>
    </section>
  );
}

function InboxCard({
  connections,
  onConnect,
  onSync,
  syncingId,
}: {
  connections: EmailConnectionRecord[];
  onConnect: () => void;
  onSync: (connection: EmailConnectionRecord) => void;
  syncingId: string | null;
}) {
  const connection = connections[0];
  const syncing = connection?.id === syncingId;

  return (
    <section className="inbox-feature">
      <div className="inbox-feature-heading">
        <div className="inbox-orbit">
          <span className="mail-tile"><Icon name="mail" size={20} /></span>
          <span className="orbit-sparkle">✦</span>
        </div>
        <span className="preview-pill"><span /> PREVIEW MODE</span>
      </div>
      <p className="inbox-eyebrow">PURCHASE CONFIRMATIONS</p>
      <h3>Your inbox can do the filing.</h3>
      <p className="inbox-description">
        Morrow turns confirmation emails into tidy purchases, so your budget stays up to date.
      </p>
      {connection ? (
        <div className="connected-account">
          <span className="account-provider-mark">{connection.provider === "Outlook" ? "O" : "G"}</span>
          <span className="account-copy"><strong>{connection.email}</strong><small>Sample {connection.provider} inbox</small></span>
          <span className="account-check"><Icon name="check" size={14} /></span>
        </div>
      ) : (
        <div className="connected-account disconnected-account">
          <span className="account-provider-mark"><Icon name="mail" size={16} /></span>
          <span className="account-copy"><strong>No inbox added</strong><small>Add a sample connection to try auto-capture</small></span>
        </div>
      )}
      {connection ? (
        <button
          className="button button-green inbox-sync-button"
          disabled={syncing}
          onClick={() => onSync(connection)}
          type="button"
        >
          <Icon name={syncing ? "refresh" : "inbox"} size={16} />
          {syncing ? "Checking sample inbox…" : "Sync sample inbox"}
        </button>
      ) : (
        <button className="button button-green inbox-sync-button" onClick={onConnect} type="button">
          <Icon name="plus" size={16} /> Add a sample inbox
        </button>
      )}
      <p className="preview-disclaimer"><Icon name="shield" size={13} /> Preview only. No personal inbox is accessed.</p>
    </section>
  );
}

function AddPurchaseModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant,
          amount: Number(amount),
          category,
          purchasedAt: new Date(`${date}T12:00:00`).toISOString(),
          note,
          source: "manual",
          paymentMethod: "Everyday debit ·· 4821",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save this purchase.");

      if (file) {
        const fileData = await fileAsDataUrl(file);
        const receiptResponse = await fetch("/api/receipts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: result.transaction.id,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            fileData,
          }),
        });
        const receiptResult = await receiptResponse.json();
        if (!receiptResponse.ok) throw new Error(receiptResult.error ?? "Purchase saved, but the receipt could not be attached.");
      }

      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add a purchase"
      subtitle="Keep the little details together. Attach a receipt if you have one."
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={submit}>
        <label className="field-label">
          Merchant
          <input autoFocus className="form-input" onChange={(event) => setMerchant(event.target.value)} placeholder="e.g. Corner market" required value={merchant} />
        </label>
        <div className="form-row">
          <label className="field-label">
            Amount
            <span className="input-with-prefix"><span>$</span><input className="form-input" min="0.01" onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required step="0.01" type="number" value={amount} /></span>
          </label>
          <label className="field-label">
            Category
            <select className="form-input" onChange={(event) => setCategory(event.target.value)} value={category}>
              {Object.keys(categoryPresentation).map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label className="field-label">
            Purchase date
            <input className="form-input" onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
          </label>
          <label className="field-label">
            A note <span className="optional-label">optional</span>
            <input className="form-input" onChange={(event) => setNote(event.target.value)} placeholder="What was it for?" value={note} />
          </label>
        </div>
        <label className="field-label">
          Receipt <span className="optional-label">optional · image or PDF</span>
          <span className={`file-drop${file ? " file-drop-selected" : ""}`}>
            <input
              accept="image/*,.pdf,application/pdf"
              className="visually-hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                if (selected && selected.size > 5 * 1024 * 1024) {
                  setError("Please choose a receipt smaller than 5 MB.");
                  event.target.value = "";
                  setFile(null);
                  return;
                }
                setError("");
                setFile(selected);
              }}
              type="file"
            />
            <span className="file-drop-icon"><Icon name={file ? "check" : "upload"} size={17} /></span>
            <span><strong>{file ? file.name : "Choose a receipt to save"}</strong><small>{file ? `${(file.size / 1024).toFixed(0)} KB · saved privately to this purchase` : "JPG, PNG, or PDF · up to 5 MB"}</small></span>
            <span className="file-browse">{file ? "Change" : "Browse"}</span>
          </span>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button className="button button-quiet" onClick={onClose} type="button">Cancel</button>
          <button className="button button-primary" disabled={saving} type="submit">
            {saving ? "Saving…" : <><Icon name="check" size={16} /> Save purchase</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConnectInboxModal({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: (connection: EmailConnectionRecord) => void;
}) {
  const [provider, setProvider] = useState("Gmail");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not add this inbox.");
      onConnected(result.connection as EmailConnectionRecord);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Connect a sample inbox"
      subtitle="See how purchase confirmations become budget-ready transactions."
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={submit}>
        <div className="provider-options" role="group" aria-label="Email provider">
          {[
            { name: "Gmail", mark: "G", className: "google-mark" },
            { name: "Outlook", mark: "O", className: "outlook-mark" },
          ].map((option) => (
            <button
              aria-pressed={provider === option.name}
              className={`provider-option${provider === option.name ? " provider-option-active" : ""}`}
              key={option.name}
              onClick={() => setProvider(option.name)}
              type="button"
            >
              <span className={`account-provider-mark ${option.className}`}>{option.mark}</span>
              <span>{option.name}</span>
              {provider === option.name ? <Icon name="check" size={15} /> : null}
            </button>
          ))}
        </div>
        <label className="field-label">
          Email address
          <input autoComplete="email" className="form-input" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
        </label>
        <div className="privacy-callout"><Icon name="shield" size={17} /><span><strong>Safe preview, no permissions.</strong> This demo does not access or read your inbox. Syncing creates sample purchase confirmations only.</span></div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button className="button button-quiet" onClick={onClose} type="button">Cancel</button>
          <button className="button button-primary" disabled={saving} type="submit">
            {saving ? "Adding…" : <><Icon name="link" size={16} /> Add preview inbox</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BudgetPanel({
  summaries,
  totalBudget,
  totalSpent,
  onSave,
}: {
  summaries: CategorySummary[];
  totalBudget: number;
  totalSpent: number;
  onSave: (updates: { category: string; monthlyLimit: number }[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLimits(Object.fromEntries(summaries.map((summary) => [summary.category, String(summary.limit)])));
  }, [summaries]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      await onSave(summaries.map((summary) => ({
        category: summary.category,
        monthlyLimit: Number(limits[summary.category] ?? summary.limit),
      })));
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update your budgets.");
    } finally {
      setSaving(false);
    }
  }

  const spentPercent = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="page-stack">
      <section className="budget-summary-card">
        <div className="budget-summary-copy">
          <span className="soft-eyebrow">YOUR MONTHLY PLAN</span>
          <h2>A little intention goes a long way.</h2>
          <p>Give each category a gentle limit, then let Morrow keep an eye on the details.</p>
        </div>
        <div className="budget-total-block">
          <span>Planned this month</span>
          <strong>{money(totalBudget)}</strong>
          <span className="budget-remaining-label">{money(Math.max(totalBudget - totalSpent, 0))} left across your plan</span>
          <div className="budget-total-track"><span style={{ width: `${spentPercent}%` }} /></div>
        </div>
      </section>
      <section className="panel budget-panel">
        <div className="section-heading budget-section-heading">
          <div><span className="soft-eyebrow">CATEGORY LIMITS</span><h2>Your monthly budgets</h2><p>Resets at the start of each month.</p></div>
          {editing ? (
            <div className="button-pair">
              <button className="button button-quiet" onClick={() => { setEditing(false); setError(""); }} type="button">Cancel</button>
              <button className="button button-primary" disabled={saving} onClick={() => void save()} type="button">{saving ? "Saving…" : "Save limits"}</button>
            </div>
          ) : (
            <button className="button button-secondary" onClick={() => setEditing(true)} type="button">Edit limits</button>
          )}
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="budget-categories">
          {summaries.map((summary) => {
            const style = categoryStyle(summary.category);
            const progress = summary.limit > 0 ? Math.min(100, (summary.spent / summary.limit) * 100) : summary.spent > 0 ? 100 : 0;
            const over = summary.spent > summary.limit;
            return (
              <article className="budget-category-row" key={summary.category}>
                <span className="budget-category-mark" style={{ backgroundColor: style.tint, color: style.color }}>{style.emoji}</span>
                <div className="budget-category-main">
                  <div className="budget-category-topline"><strong>{summary.category}</strong><span className={over ? "over-budget" : ""}>{money(summary.spent)} <span className="budget-of">of</span> {money(summary.limit)}</span></div>
                  <div className={`budget-progress${over ? " budget-progress-over" : ""}`}><span style={{ width: `${progress}%` }} /></div>
                </div>
                {editing ? (
                  <label className="budget-edit-field"><span className="sr-only">Monthly limit for {summary.category}</span><span>$</span><input aria-label={`Monthly limit for ${summary.category}`} min="1" onChange={(event) => setLimits((current) => ({ ...current, [summary.category]: event.target.value }))} step="1" type="number" value={limits[summary.category] ?? summary.limit} /></label>
                ) : (
                  <span className="budget-limit-label">{money(summary.limit)} <small>/ mo</small></span>
                )}
              </article>
            );
          })}
        </div>
        <div className="budget-footnote"><Icon name="info" size={15} /> Spending is based on purchases recorded in the current calendar month.</div>
      </section>
    </div>
  );
}

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this receipt."));
    reader.onerror = () => reject(new Error("Could not read this receipt."));
    reader.readAsDataURL(file);
  });
}

export default function BudgetWorkspace({
  initialTransactions,
  initialConnections,
  initialBudgets,
}: WorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [purchases, setPurchases] = useState(initialTransactions);
  const [connections, setConnections] = useState(initialConnections);
  const [budgets, setBudgets] = useState(initialBudgets);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<{ fileName: string; mimeType: string; fileData: string } | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const currentMonthPurchases = useMemo(() => monthPurchases(purchases), [purchases]);
  const monthlySpend = currentMonthPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const monthlyBudget = budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0);
  const remaining = monthlyBudget - monthlySpend;
  const emailCapturedSpend = currentMonthPurchases
    .filter((purchase) => purchase.source === "email")
    .reduce((sum, purchase) => sum + purchase.amount, 0);
  const savedReceiptCount = purchases.filter((purchase) => purchase.receipt).length;
  const sortedPurchases = useMemo(
    () => [...purchases].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()),
    [purchases],
  );
  const categorySummaries = useMemo(() => {
    const spend = new Map<string, number>();
    for (const purchase of currentMonthPurchases) {
      spend.set(purchase.category, (spend.get(purchase.category) ?? 0) + purchase.amount);
    }
    const knownCategories = new Set(budgets.map((budget) => budget.category));
    for (const category of spend.keys()) knownCategories.add(category);
    return [...knownCategories]
      .map((category) => ({
        category,
        spent: spend.get(category) ?? 0,
        limit: budgets.find((budget) => budget.category === category)?.monthlyLimit ?? 0,
      }))
      .sort((a, b) => b.spent - a.spent || a.category.localeCompare(b.category));
  }, [budgets, currentMonthPurchases]);
  const matchingPurchases = sortedPurchases.filter((purchase) => {
    const matchesSearch = `${purchase.merchant} ${purchase.category} ${purchase.note ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesSource = sourceFilter === "all" || purchase.source === sourceFilter;
    return matchesSearch && matchesSource;
  });
  const receiptPurchases = matchingPurchases.filter((purchase) => purchase.receipt);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function refreshWorkspace() {
    const [purchaseResponse, connectionResponse, budgetResponse] = await Promise.all([
      fetch("/api/transactions", { cache: "no-store" }),
      fetch("/api/connections", { cache: "no-store" }),
      fetch("/api/budgets", { cache: "no-store" }),
    ]);
    if (purchaseResponse.ok) setPurchases(await purchaseResponse.json());
    if (connectionResponse.ok) setConnections(await connectionResponse.json());
    if (budgetResponse.ok) setBudgets(await budgetResponse.json());
  }

  async function openReceipt(receipt: ReceiptSummary) {
    setReceiptLoading(true);
    try {
      const response = await fetch(`/api/receipts/${receipt.id}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not open this receipt.");
      setReceiptPreview(result.receipt);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not open this receipt.");
    } finally {
      setReceiptLoading(false);
    }
  }

  async function syncConnection(connection: EmailConnectionRecord) {
    setSyncingId(connection.id);
    try {
      const response = await fetch("/api/connections/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not sync this inbox.");
      await refreshWorkspace();
      setToast(result.imported ? `${result.imported} purchase confirmation${result.imported === 1 ? "" : "s"} captured.` : "All caught up — no new sample confirmations.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not sync this inbox.");
    } finally {
      setSyncingId(null);
    }
  }

  async function deletePurchase(purchase: PurchaseRecord) {
    if (!window.confirm(`Remove ${purchase.merchant} from your activity?`)) return;
    const response = await fetch(`/api/transactions/${purchase.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setToast(result.error ?? "Could not remove this purchase.");
      return;
    }
    await refreshWorkspace();
    setToast("Purchase removed.");
  }

  async function saveBudgets(updates: { category: string; monthlyLimit: number }[]) {
    const response = await fetch("/api/budgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgets: updates }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Could not update your budgets.");
    setBudgets(result.budgets);
    setToast("Monthly limits updated.");
  }

  async function removeConnection(connection: EmailConnectionRecord) {
    if (!window.confirm(`Remove the ${connection.provider} sample inbox?`)) return;
    const response = await fetch(`/api/connections/${connection.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setToast(result.error ?? "Could not remove this inbox.");
      return;
    }
    await refreshWorkspace();
    setToast("Sample inbox removed.");
  }

  function openPlan() {
    setActiveTab("connections");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const tabHeading: Record<TabKey, { eyebrow: string; title: string; description: string }> = {
    overview: {
      eyebrow: fullDateLabel(new Date().toISOString()),
      title: "Your money, in a good place.",
      description: "A clearer view of what came in, what went out, and what you want next.",
    },
    activity: {
      eyebrow: "THE FULL PICTURE",
      title: "Every purchase, accounted for.",
      description: "Your recent spending, thoughtfully sorted and easy to search.",
    },
    receipts: {
      eyebrow: "YOUR DIGITAL RECEIPT DRAWER",
      title: "Keep the little proofs.",
      description: "Purchase receipts and confirmation notes, all beside the spending they belong to.",
    },
    budgets: {
      eyebrow: "A PLAN THAT BENDS WITH YOU",
      title: "Give every dollar a direction.",
      description: "Set a few monthly guardrails. Morrow will quietly keep you in the loop.",
    },
    connections: {
      eyebrow: "YOUR ACCOUNT",
      title: "Everything working together.",
      description: "Manage sample inbox connections and see what comes with your annual membership.",
    },
  };
  const heading = tabHeading[activeTab];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a aria-label="Morrow home" className="brand" href="#overview" onClick={(event) => { event.preventDefault(); setActiveTab("overview"); }}>
          <span className="brand-mark"><Icon name="leaf" size={21} /></span>
          <span className="brand-word">morrow<span>.</span><small>MONEY, MADE CLEAR</small></span>
        </a>
        <div className="sidebar-caption">YOUR SPACE</div>
        <nav aria-label="Main navigation" className="side-nav">
          {navItems.map((item) => (
            <button
              aria-current={activeTab === item.key ? "page" : undefined}
              className={`nav-link${activeTab === item.key ? " nav-link-active" : ""}`}
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              title={item.label}
              type="button"
            >
              <span className="nav-icon"><Icon name={item.icon} size={19} /></span>
              <span>{item.label}</span>
              {item.key === "receipts" && savedReceiptCount > 0 ? <span className="nav-count">{savedReceiptCount}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip">
          <span className="tip-icon"><Icon name="sparkle" size={15} /></span>
          <p><strong>A small tip</strong>Good plans leave a little room for life.</p>
        </div>
        <button className="profile-button" onClick={() => setActiveTab("connections")} type="button">
          <span className="profile-avatar">AM</span>
          <span className="profile-copy"><strong>Alex Morgan</strong><small>Personal space</small></span>
          <span className="profile-dots">···</span>
        </button>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-context"><span>PERSONAL FINANCE</span><span className="context-slash">/</span><strong>{navItems.find((item) => item.key === activeTab)?.label}</strong></div>
          <div className="topbar-tools">
            <label className="search-box">
              <Icon name="search" size={17} />
              <input aria-label="Search purchases" onChange={(event) => setSearch(event.target.value)} placeholder="Search purchases" value={search} />
              <kbd>⌘ K</kbd>
            </label>
            <button aria-label="Notifications" className="icon-button notification-button" onClick={() => setToast("You’re all caught up.")} type="button"><Icon name="bell" size={18} /><span /></button>
            <button aria-label="Open account settings" className="top-avatar" onClick={() => setActiveTab("connections")} type="button">AM</button>
          </div>
        </header>

        <main className="main-content">
          <section className="page-intro">
            <div>
              <p className="page-eyebrow"><span className="eyebrow-mark" />{heading.eyebrow}</p>
              <h1>{heading.title}</h1>
              <p className="page-description">{heading.description}</p>
            </div>
            <div className="intro-actions">
              {activeTab !== "connections" ? <button className="button button-primary" onClick={() => setAddOpen(true)} type="button"><Icon name="plus" size={17} /> Add purchase</button> : null}
              {activeTab === "overview" ? <button className="button button-secondary connect-top-button" onClick={() => setConnectOpen(true)} type="button"><Icon name="inbox" size={16} /> Connect inbox</button> : null}
            </div>
          </section>

          {activeTab === "overview" ? (
            <OverviewPanel
              budgets={budgets}
              categorySummaries={categorySummaries}
              connections={connections}
              emailCapturedSpend={emailCapturedSpend}
              monthlyBudget={monthlyBudget}
              monthlySpend={monthlySpend}
              onConnect={() => setConnectOpen(true)}
              onManagePlan={openPlan}
              onOpenReceipt={openReceipt}
              onSync={syncConnection}
              onViewActivity={() => setActiveTab("activity")}
              onViewBudgets={() => setActiveTab("budgets")}
              purchases={sortedPurchases}
              syncingId={syncingId}
            />
          ) : null}

          {activeTab === "activity" ? (
            <section className="panel activity-panel">
              <div className="section-heading activity-heading">
                <div><span className="soft-eyebrow">{purchases.length} PURCHASES</span><h2>Your activity</h2><p>Search is always here when you need to find something.</p></div>
                <div className="filter-tabs" role="group" aria-label="Filter purchases">
                  {[{ key: "all", label: "All" }, { key: "email", label: "Auto-captured" }, { key: "manual", label: "Added by me" }].map((filter) => (
                    <button aria-pressed={sourceFilter === filter.key} className={sourceFilter === filter.key ? "filter-tab filter-tab-active" : "filter-tab"} key={filter.key} onClick={() => setSourceFilter(filter.key)} type="button">{filter.label}</button>
                  ))}
                </div>
              </div>
              <TransactionList onDelete={deletePurchase} onOpenReceipt={openReceipt} purchases={matchingPurchases} showDelete />
              <div className="activity-footer"><Icon name="shield" size={15} /> Your spending is private to this preview workspace.</div>
            </section>
          ) : null}

          {activeTab === "receipts" ? (
            <div className="page-stack">
              <section className="receipt-hero">
                <div className="receipt-hero-copy"><span className="soft-eyebrow">A PLACE FOR THE PAPER TRAIL</span><h2>Find it when you need it.</h2><p>Photos, PDFs, and email confirmations stay attached to the purchase — not lost in a camera roll.</p></div>
                <div className="receipt-counter"><span className="receipt-counter-icon"><Icon name="receipt" size={20} /></span><strong>{savedReceiptCount.toString().padStart(2, "0")}</strong><span>receipts saved</span></div>
              </section>
              <section className="panel receipts-panel">
                <div className="section-heading"><div><span className="soft-eyebrow">SAVED DOCUMENTS</span><h2>Your receipt drawer</h2></div><button className="button button-secondary" onClick={() => setAddOpen(true)} type="button"><Icon name="upload" size={16} /> Save a receipt</button></div>
                {receiptPurchases.length > 0 ? (
                  <div className="receipt-list">
                    {receiptPurchases.map((purchase) => (
                      <article className="receipt-row" key={purchase.id}>
                        <button className="receipt-file-icon" onClick={() => purchase.receipt && void openReceipt(purchase.receipt)} type="button"><Icon name="file" size={19} /></button>
                        <div className="receipt-row-copy"><strong>{purchase.merchant}</strong><span>{purchase.receipt?.fileName} <i>·</i> {dateLabel(purchase.purchasedAt)}</span></div>
                        <span className="receipt-row-amount">{money(purchase.amount)}</span>
                        <button className="receipt-open-button" onClick={() => purchase.receipt && void openReceipt(purchase.receipt)} type="button">View <Icon name="arrow" size={14} /></button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="receipt" title="Your receipt drawer is ready" body="Attach a photo or PDF to a purchase, or try a sample inbox sync to bring in a confirmation." action={<button className="button button-primary" onClick={() => setAddOpen(true)} type="button"><Icon name="plus" size={16} /> Add a purchase</button>} />
                )}
                {receiptPurchases.length > 0 ? <p className="receipt-footnote"><Icon name="info" size={14} /> Showing saved receipts that match your search.</p> : null}
              </section>
            </div>
          ) : null}

          {activeTab === "budgets" ? (
            <BudgetPanel
              onSave={saveBudgets}
              summaries={categorySummaries.length ? categorySummaries : budgets.map((budget) => ({ category: budget.category, limit: budget.monthlyLimit, spent: 0 }))}
              totalBudget={monthlyBudget}
              totalSpent={monthlySpend}
            />
          ) : null}

          {activeTab === "connections" ? (
            <ConnectionsPage
              connections={connections}
              onConnect={() => setConnectOpen(true)}
              onManagePlan={() => setToast("Subscription billing is available in your account portal.")}
              onRemove={removeConnection}
              onSync={syncConnection}
              syncingId={syncingId}
            />
          ) : null}
        </main>
      </div>

      {addOpen ? <AddPurchaseModal onClose={() => setAddOpen(false)} onSaved={async () => { setAddOpen(false); await refreshWorkspace(); setToast("Purchase saved to your budget."); }} /> : null}
      {connectOpen ? <ConnectInboxModal onClose={() => setConnectOpen(false)} onConnected={async () => { setConnectOpen(false); await refreshWorkspace(); setToast("Preview inbox added. Try a sample sync to capture confirmations."); }} /> : null}
      {receiptPreview ? <ReceiptModal onClose={() => setReceiptPreview(null)} receipt={receiptPreview} /> : null}
      {receiptLoading ? <div aria-live="polite" className="receipt-loading"><span className="loading-spinner" /> Opening receipt…</div> : null}
      {toast ? <div aria-live="polite" className="toast-message"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div> : null}
    </div>
  );
}

function OverviewPanel({
  budgets,
  categorySummaries,
  connections,
  emailCapturedSpend,
  monthlyBudget,
  monthlySpend,
  onConnect,
  onManagePlan,
  onOpenReceipt,
  onSync,
  onViewActivity,
  onViewBudgets,
  purchases,
  syncingId,
}: {
  budgets: BudgetRecord[];
  categorySummaries: CategorySummary[];
  connections: EmailConnectionRecord[];
  emailCapturedSpend: number;
  monthlyBudget: number;
  monthlySpend: number;
  onConnect: () => void;
  onManagePlan: () => void;
  onOpenReceipt: (receipt: ReceiptSummary) => void;
  onSync: (connection: EmailConnectionRecord) => void;
  onViewActivity: () => void;
  onViewBudgets: () => void;
  purchases: PurchaseRecord[];
  syncingId: string | null;
}) {
  const monthSpend = monthPurchases(purchases);
  const remaining = monthlyBudget - monthlySpend;
  const usedPercent = monthlyBudget > 0 ? Math.min(100, (monthlySpend / monthlyBudget) * 100) : 0;
  const capturedCount = monthSpend.filter((purchase) => purchase.source === "email").length;
  const weeklyTotals = [0, 0, 0, 0, 0];
  for (const purchase of monthSpend) {
    const day = new Date(purchase.purchasedAt).getDate();
    const weekIndex = Math.min(4, Math.floor((day - 1) / 7));
    weeklyTotals[weekIndex] += purchase.amount;
  }
  const maxWeek = Math.max(...weeklyTotals, 1);
  const topCategories = categorySummaries.filter((item) => item.spent > 0).slice(0, 4);
  const chartLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "This week"];
  const sortedThisMonth = [...monthSpend].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <article className="stat-card stat-card-spend">
          <div className="stat-topline"><span>Spent this month</span><span className="stat-icon stat-icon-green"><Icon name="wallet" size={17} /></span></div>
          <div className="stat-value">{money(monthlySpend)}</div>
          <div className="stat-bottomline"><span className="stat-sparkline"><span /><span /><span /><span /><span /><span /><span /></span><span className="stat-note">across {monthSpend.length} purchases</span></div>
        </article>
        <article className="stat-card stat-card-remaining">
          <div className="stat-topline"><span>Room in your plan</span><span className="stat-icon stat-icon-lime"><Icon name="budget" size={17} /></span></div>
          <div className="stat-value">{money(Math.max(remaining, 0))}</div>
          <div className="stat-bottomline"><span className="stat-note">of {money(monthlyBudget)} planned</span><span className="mini-progress"><span style={{ width: `${usedPercent}%` }} /></span></div>
        </article>
        <article className="stat-card stat-card-capture">
          <div className="stat-topline"><span>Captured by email</span><span className="stat-icon stat-icon-lilac"><Icon name="sparkle" size={17} /></span></div>
          <div className="stat-value">{money(emailCapturedSpend)}</div>
          <div className="stat-bottomline"><span className="stat-note"><strong>{capturedCount}</strong> purchases matched automatically</span><span className="capture-ring"><Icon name="check" size={12} /></span></div>
        </article>
      </section>

      <div className="overview-grid">
        <section className="panel spending-panel">
          <div className="section-heading chart-heading">
            <div><span className="soft-eyebrow">YOUR MONTH AT A GLANCE</span><h2>Spending rhythm</h2><p>A steady pace is a good sign.</p></div>
            <span className="period-selector"><Icon name="calendar" size={15} /> This month <span className="selector-caret">⌄</span></span>
          </div>
          <div className="chart-area" role="img" aria-label="Bar chart of spending totals by week this month">
            <div className="chart-y-labels"><span>{money(maxWeek).replace(".00", "")}</span><span>{money(maxWeek * 0.66).replace(".00", "")}</span><span>{money(maxWeek * 0.33).replace(".00", "")}</span><span>$0</span></div>
            <div className="chart-main">
              <div className="chart-grid-lines"><span /><span /><span /><span /></div>
              <div className="chart-bars">
                {weeklyTotals.map((total, index) => {
                  const height = total === 0 ? 3 : Math.max(8, (total / maxWeek) * 100);
                  return (
                    <div className="chart-bar-group" key={chartLabels[index]}>
                      <div className={`chart-bar${index === 4 ? " chart-bar-current" : ""}`} style={{ height: `${height}%` }} title={`${chartLabels[index]}: ${money(total)}`}>
                        <span className="chart-bar-shine" />
                      </div>
                      <span className="chart-bar-label">{chartLabels[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="chart-summary"><span className="chart-legend-dot" /> Spending this month <strong>{money(monthlySpend)}</strong><span className="chart-summary-note">{usedPercent.toFixed(0)}% of monthly plan</span></div>
        </section>

        <section className="panel category-panel">
          <div className="section-heading category-heading"><div><span className="soft-eyebrow">WHAT MATTERS MOST</span><h2>Where it goes</h2></div><button aria-label="View budgets" className="round-link" onClick={onViewBudgets} type="button"><Icon name="arrow" size={16} /></button></div>
          {topCategories.length > 0 ? (
            <div className="category-list">
              {topCategories.map((summary) => {
                const style = categoryStyle(summary.category);
                const progress = summary.limit > 0 ? Math.min(100, (summary.spent / summary.limit) * 100) : 0;
                return (
                  <div className="category-item" key={summary.category}>
                    <div className="category-item-top"><span className="category-label"><span className="category-emoji" style={{ backgroundColor: style.tint, color: style.color }}>{style.emoji}</span><strong>{summary.category}</strong></span><span className="category-value">{money(summary.spent)}</span></div>
                    <div className="category-track"><span style={{ width: `${progress}%`, backgroundColor: style.color }} /></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon="budget" title="Your categories will show here" body="Add a purchase to start seeing your spending rhythm." />
          )}
          <div className="category-card-footer"><span>Monthly plan</span><strong>{money(budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0))}</strong></div>
        </section>
      </div>

      <div className="lower-grid">
        <section className="panel recent-panel">
          <div className="section-heading recent-heading"><div><span className="soft-eyebrow">JUST THE LATEST</span><h2>Recent activity</h2></div><button className="text-link" onClick={onViewActivity} type="button">See all <Icon name="arrow" size={15} /></button></div>
          <TransactionList onOpenReceipt={onOpenReceipt} purchases={sortedThisMonth.slice(0, 5)} />
        </section>
        <div className="lower-aside">
          <InboxCard connections={connections} onConnect={onConnect} onSync={onSync} syncingId={syncingId} />
          <PlanCard compact onManage={onManagePlan} />
        </div>
      </div>
    </div>
  );
}

function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: { fileName: string; mimeType: string; fileData: string };
  onClose: () => void;
}) {
  const downloadUrl = receipt.fileData.startsWith("data:")
    ? receipt.fileData
    : `data:text/plain;charset=utf-8,${encodeURIComponent(receipt.fileData)}`;

  return (
    <Modal title={receipt.fileName} subtitle="Saved privately beside its purchase." onClose={onClose} wide>
      <div className="receipt-preview-content">
        {receipt.mimeType === "text/plain" ? (
          <div className="receipt-paper"><span className="receipt-paper-brand">MORROW · SAVED RECEIPT</span><pre>{receipt.fileData}</pre></div>
        ) : receipt.mimeType.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`Saved receipt: ${receipt.fileName}`} className="receipt-image-preview" src={receipt.fileData} />
        ) : receipt.mimeType === "application/pdf" ? (
          <iframe className="receipt-pdf-preview" title={receipt.fileName} src={receipt.fileData} />
        ) : (
          <div className="receipt-unavailable"><Icon name="file" size={28} /><p>Preview isn’t available for this file type.</p></div>
        )}
      </div>
      <div className="modal-actions receipt-modal-actions">
        <span className="receipt-secure-note"><Icon name="shield" size={14} /> Your receipt stays in this workspace.</span>
        <a className="button button-secondary" download={receipt.fileName} href={downloadUrl}><Icon name="download" size={16} /> Download</a>
      </div>
    </Modal>
  );
}

function ConnectionsPage({
  connections,
  onConnect,
  onManagePlan,
  onRemove,
  onSync,
  syncingId,
}: {
  connections: EmailConnectionRecord[];
  onConnect: () => void;
  onManagePlan: () => void;
  onRemove: (connection: EmailConnectionRecord) => void;
  onSync: (connection: EmailConnectionRecord) => void;
  syncingId: string | null;
}) {
  return (
    <div className="settings-grid">
      <section className="panel connection-settings-panel">
        <div className="section-heading"><div><span className="soft-eyebrow">AUTOMATIC PURCHASE CAPTURE</span><h2>Email connections</h2><p>Purchase confirmations can become transactions without another manual step.</p></div><button className="button button-primary" onClick={onConnect} type="button"><Icon name="plus" size={16} /> Add inbox</button></div>
        {connections.length > 0 ? (
          <div className="connection-list">
            {connections.map((connection) => (
              <article className="connection-row" key={connection.id}>
                <span className={`account-provider-mark connection-provider-${connection.provider.toLowerCase()}`}>{connection.provider === "Outlook" ? "O" : "G"}</span>
                <div className="connection-row-copy"><strong>{connection.email}</strong><span>{connection.provider} · Preview connection</span></div>
                <span className="connection-status"><i /> Added</span>
                <button className="button button-soft" disabled={syncingId === connection.id} onClick={() => onSync(connection)} type="button"><Icon name="refresh" size={15} />{syncingId === connection.id ? "Syncing" : "Sync"}</button>
                <button aria-label={`Remove ${connection.email}`} className="icon-button connection-remove" onClick={() => onRemove(connection)} type="button"><Icon name="trash" size={16} /></button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon="inbox" title="No inboxes connected" body="Add a sample inbox to preview how purchase confirmations can be organized." action={<button className="button button-primary" onClick={onConnect} type="button"><Icon name="plus" size={16} /> Add a sample inbox</button>} />
        )}
        <div className="preview-explainer"><span className="explainer-icon"><Icon name="shield" size={18} /></span><div><strong>This workspace is in preview mode</strong><p>Inbox connections here are simulated. Sync adds sample purchase confirmations only; it does not access or store your real email. Live Gmail or Outlook authorization can be enabled with provider credentials.</p></div></div>
      </section>

      <section className="subscription-card">
        <div className="subscription-glow" />
        <span className="subscription-pill"><Icon name="sparkle" size={13} /> YOUR ANNUAL MEMBERSHIP</span>
        <div className="subscription-brand"><span className="subscription-brand-mark"><Icon name="leaf" size={20} /></span><span>Morrow Plus</span></div>
        <h2>A year of feeling<br />good about money.</h2>
        <p>Everything you need to make thoughtful plans, keep your receipts close, and spend with confidence.</p>
        <div className="subscription-price"><strong>$48</strong><span>USD / year</span></div>
        <div className="subscription-includes">
          <span><Icon name="check" size={15} /> Unlimited budgets & categories</span>
          <span><Icon name="check" size={15} /> Your searchable receipt drawer</span>
          <span><Icon name="check" size={15} /> Automatic purchase capture</span>
          <span><Icon name="check" size={15} /> One calm place for your money</span>
        </div>
        <button className="subscription-manage" onClick={onManagePlan} type="button">Manage annual plan <Icon name="arrow" size={15} /></button>
        <p className="subscription-footnote">Annual billing · Preview account · No payment details collected</p>
      </section>

      <section className="panel privacy-panel">
        <div className="privacy-panel-icon"><Icon name="shield" size={20} /></div>
        <div><h3>Your money is yours.</h3><p>Purchases and receipts are stored in this workspace. This preview doesn’t connect to bank accounts or read real inboxes.</p></div>
        <span className="privacy-preview-label">PRIVATE PREVIEW</span>
      </section>
    </div>
  );
}
