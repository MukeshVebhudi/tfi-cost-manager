"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Bell, ChevronDown, CircleHelp, Clapperboard, Copy, Download, FileText, IndianRupee, LayoutDashboard, Menu, Pencil, Plus, ReceiptText, RotateCcw, Search, Settings, Trash2, Users, WalletCards, X } from "lucide-react";

type Status = "Approved" | "Pending" | "Rejected";
type Expense = { id: number; date: string; description: string; department: string; vendor: string; amount: number; status: Status; payment?: string; receipt?: string };
type View = "Overview" | "Budgets" | "Expenses" | "Vendors" | "Productions" | "Team & access" | "Audit trail" | "Settings";
type AuditEntry = { id: number; action: string; time: string };

const departments = [
  { name: "Cast & Artists", spent: 14200000, budget: 18000000, color: "#7457e8" },
  { name: "Production", spent: 8300000, budget: 12000000, color: "#17a673" },
  { name: "Camera & Equipment", spent: 6100000, budget: 8500000, color: "#ed9b3b" },
  { name: "Art & Sets", spent: 4900000, budget: 7000000, color: "#df5b72" },
];

const seedExpenses: Expense[] = [
  { id: 1, date: "20 Aug 2026", description: "ARRI Alexa 35 — weekly rental", department: "Camera & Equipment", vendor: "Prasad Film Labs", amount: 485000, status: "Approved" },
  { id: 2, date: "19 Aug 2026", description: "Lead cast advance — schedule 2", department: "Cast & Artists", vendor: "Artist Management", amount: 2500000, status: "Pending" },
  { id: 3, date: "18 Aug 2026", description: "Ramoji Film City floor rental", department: "Art & Sets", vendor: "RFC Studios", amount: 750000, status: "Approved" },
  { id: 4, date: "17 Aug 2026", description: "Unit catering — 186 members", department: "Production", vendor: "Annapurna Caterers", amount: 138400, status: "Approved" },
  { id: 5, date: "16 Aug 2026", description: "Fight sequence safety equipment", department: "Production", vendor: "Stunt Masters India", amount: 325000, status: "Pending" },
  { id: 6, date: "15 Aug 2026", description: "Village set construction materials", department: "Art & Sets", vendor: "Sri Balaji Timbers", amount: 612500, status: "Pending" },
  { id: 7, date: "14 Aug 2026", description: "Supporting artists — day call", department: "Cast & Artists", vendor: "Telugu Cine Agents", amount: 185000, status: "Approved" },
  { id: 8, date: "13 Aug 2026", description: "Lighting package and generator", department: "Camera & Equipment", vendor: "Deccan Lights", amount: 294000, status: "Rejected" },
];

const STORAGE_KEY = "chitrakhata-expenses-v2";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const compact = (value: number) => `₹${(value / 10000000).toFixed(2)} Cr`;

export function Dashboard() {
  const [expenses, setExpenses] = useState(seedExpenses);
  const [modal, setModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [view, setView] = useState<View>("Overview");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("Project Veera");
  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [hydrated, setHydrated] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([{ id: 1, action: "Demo production workspace created", time: "Today, 9:00 AM" }]);
  const [form, setForm] = useState({ description: "", amount: "", department: "Production", vendor: "", payment: "Bank transfer", receipt: "" });
  const totals = useMemo(() => ({ budget: 60000000, spent: departments.reduce((a, d) => a + d.spent, 0) + expenses.slice(4).reduce((a, e) => a + e.amount, 0) }), [expenses]);
  const filteredExpenses = useMemo(() => expenses.filter(expense => `${expense.description} ${expense.department} ${expense.vendor} ${expense.status}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === "All" || expense.status === statusFilter)), [expenses, query, statusFilter]);
  const pendingExpenses = useMemo(() => expenses.filter(expense => expense.status === "Pending"), [expenses]);
  const pendingTotal = useMemo(() => pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0), [pendingExpenses]);
  const vendorSummary = useMemo(() => Object.values(expenses.reduce<Record<string, { name: string; total: number; count: number }>>((all, expense) => {
    const vendor = all[expense.vendor] ?? { name: expense.vendor, total: 0, count: 0 };
    vendor.total += expense.amount; vendor.count += 1; all[expense.vendor] = vendor; return all;
  }, {})).sort((a, b) => b.total - a.total), [expenses]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setExpenses(JSON.parse(saved) as Expense[]); } catch { window.localStorage.removeItem(STORAGE_KEY); }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, hydrated]);

  function notify(message: string) {
    setToast(message);
    setAudit(current => [{ id: Date.now(), action: message, time: "Just now" }, ...current].slice(0, 25));
    window.setTimeout(() => setToast(""), 2600);
  }

  function goTo(next: View) {
    setView(next);
    setMobileNav(false);
    if (next === "Budgets") window.setTimeout(() => document.getElementById("budgets")?.scrollIntoView({ behavior: "smooth" }), 0);
    if (next === "Expenses" || next === "Vendors") window.setTimeout(() => document.getElementById("expenses")?.scrollIntoView({ behavior: "smooth" }), 0);
    if (["Productions", "Team & access", "Settings"].includes(next)) notify(`Opened ${next.toLowerCase()}.`);
  }

  function exportCsv() {
    const rows = [["Date", "Description", "Department", "Vendor", "Amount", "Status"], ...filteredExpenses.map(e => [e.date, e.description, e.department, e.vendor, String(e.amount), e.status])];
    const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.toLowerCase().replaceAll(" ", "-")}-expenses.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Expense report downloaded.");
  }

  function updateStatus(id: number, status: Status) {
    setExpenses(current => current.map(expense => expense.id === id ? { ...expense, status } : expense));
    notify(`Expense ${status.toLowerCase()}.`);
  }

  function deleteExpense(id: number) {
    const expense = expenses.find(item => item.id === id);
    if (!expense || !window.confirm(`Delete “${expense.description}”?`)) return;
    setExpenses(current => current.filter(item => item.id !== id));
    notify("Expense deleted.");
  }

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    if (editingId) {
      setExpenses(current => current.map(expense => expense.id === editingId ? { ...expense, description: form.description, department: form.department, vendor: form.vendor || "Not specified", amount: Number(form.amount), payment: form.payment, receipt: form.receipt } : expense));
      notify("Expense updated.");
    } else {
      setExpenses([{ id: Date.now(), date: "20 Aug 2026", description: form.description, department: form.department, vendor: form.vendor || "Not specified", amount: Number(form.amount), status: "Pending", payment: form.payment, receipt: form.receipt }, ...expenses]);
      notify("Expense submitted for approval.");
    }
    setForm({ description: "", amount: "", department: "Production", vendor: "", payment: "Bank transfer", receipt: "" });
    setEditingId(null);
    setModal(false);
  }

  function openNewExpense() {
    setEditingId(null);
    setForm({ description: "", amount: "", department: "Production", vendor: "", payment: "Bank transfer", receipt: "" });
    setModal(true);
  }

  function editExpense(expense: Expense) {
    setEditingId(expense.id);
    setForm({ description: expense.description, amount: String(expense.amount), department: expense.department, vendor: expense.vendor, payment: expense.payment || "Bank transfer", receipt: expense.receipt || "" });
    setModal(true);
  }

  function duplicateExpense(expense: Expense) {
    setExpenses(current => [{ ...expense, id: Date.now(), description: `${expense.description} (copy)`, status: "Pending", date: "20 Aug 2026" }, ...current]);
    notify("Expense duplicated as pending.");
  }

  function drillDown(value: Status | "All", nextView: View = "Expenses") {
    setStatusFilter(value);
    goTo(nextView);
  }

  function filterDepartment(name: string) {
    setQuery(name);
    goTo("Expenses");
  }

  function resetDemo() {
    if (!window.confirm("Restore the original demo expenses? Your added expenses will be removed.")) return;
    setExpenses(seedExpenses);
    setQuery("");
    setStatusFilter("All");
    notify("Demo data restored.");
  }

  return <div className="shell">
    <aside className={mobileNav ? "sidebar open" : "sidebar"}>
      <div className="brand"><span className="brandmark"><Clapperboard size={21}/></span><div><strong>ChitraKhata</strong><small>చిత్ర ఖాతా</small></div></div>
      <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X/></button>
      <nav>
        <span className="nav-label">WORKSPACE</span>
        <button className={view === "Overview" ? "active" : ""} onClick={() => goTo("Overview")}><LayoutDashboard/> Overview</button><button className={view === "Budgets" ? "active" : ""} onClick={() => goTo("Budgets")}><WalletCards/> Budgets</button><button className={view === "Expenses" ? "active" : ""} onClick={() => goTo("Expenses")}><ReceiptText/> Expenses <b>{pendingExpenses.length}</b></button><button className={view === "Vendors" ? "active" : ""} onClick={() => goTo("Vendors")}><Users/> Vendors</button>
        <span className="nav-label second">MANAGE</span>
        <button className={view === "Productions" ? "active" : ""} onClick={() => goTo("Productions")}><Clapperboard/> Productions</button><button className={view === "Team & access" ? "active" : ""} onClick={() => goTo("Team & access")}><Users/> Team & access</button><button className={view === "Audit trail" ? "active" : ""} onClick={() => goTo("Audit trail")}><Activity/> Audit trail</button><button className={view === "Settings" ? "active" : ""} onClick={() => goTo("Settings")}><Settings/> Settings</button>
      </nav>
      <button className="support" onClick={() => notify("Support request noted. Production support will be connected in the full release.")}><CircleHelp/><div><strong>Need help?</strong><small>Contact production support</small></div></button>
      <div className="profile"><div className="avatar">AR</div><div><strong>Arjun Reddy</strong><small>Executive Producer</small></div><ChevronDown/></div>
    </aside>
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}

    <main>
      <header><button className="menu" onClick={() => setMobileNav(true)}><Menu/></button><div className="production"><span>ACTIVE PRODUCTION</span><select aria-label="Active production" value={project} onChange={e => { setProject(e.target.value); notify(`Switched to ${e.target.value}.`); }}><option>Project Veera</option><option>Project Godavari</option><option>Untitled Production</option></select></div><div className="header-actions"><label><Search/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search expenses, vendors..."/>{query && <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search"><X/></button>}</label><button className="icon-btn" onClick={() => notify(`${pendingExpenses.length} expense${pendingExpenses.length === 1 ? " is" : "s are"} waiting for approval.`)} aria-label="Notifications"><Bell/>{pendingExpenses.length > 0 && <i/>}</button><button className="primary" onClick={openNewExpense}><Plus/> Add expense</button></div></header>
      <div className="content">
        <section className="welcome"><div><p>THURSDAY, 20 AUGUST · {view.toUpperCase()}</p><h1>{view === "Overview" ? "Good morning, Arjun." : view}</h1><span>Here’s how {project} is tracking today.</span></div><button className="export" onClick={exportCsv}><Download/> Export report</button></section>

        <section className="metrics">
          <article role="button" tabIndex={0} onClick={() => goTo("Budgets")}><div><span>Total budget</span><IndianRupee/></div><strong>{compact(totals.budget)}</strong><small>Open department budgets →</small></article>
          <article role="button" tabIndex={0} onClick={() => drillDown("Approved")}><div><span>Total spent</span><ReceiptText/></div><strong>{compact(totals.spent)}</strong><small className="up">View approved expenses →</small></article>
          <article role="button" tabIndex={0} onClick={() => drillDown("All")}><div><span>Remaining</span><WalletCards/></div><strong>{compact(totals.budget - totals.spent)}</strong><small>{Math.round((totals.budget - totals.spent) / totals.budget * 100)}% available · View all →</small></article>
          <article role="button" tabIndex={0} onClick={() => drillDown("Pending")}><div><span>Pending approval</span><CircleHelp/></div><strong>{money(pendingTotal)}</strong><small className="warn">Review {pendingExpenses.length} expense{pendingExpenses.length === 1 ? "" : "s"} →</small></article>
        </section>

        {view === "Vendors" && <section className="panel workspace-panel"><div className="panel-head"><div><h2>Vendor directory</h2><p>Automatically calculated from recorded expenses</p></div><button onClick={exportCsv}>Export transactions</button></div><div className="vendor-grid">{vendorSummary.map(vendor => <button key={vendor.name} onClick={() => { setQuery(vendor.name); goTo("Expenses"); }}><span>{vendor.name.split(" ").map(word => word[0]).join("").slice(0,2)}</span><div><strong>{vendor.name}</strong><small>{vendor.count} transaction{vendor.count === 1 ? "" : "s"}</small></div><b>{money(vendor.total)}</b></button>)}</div></section>}

        {view === "Productions" && <section className="panel workspace-panel"><div className="panel-head"><div><h2>Productions</h2><p>Switch between film finance workspaces</p></div><button onClick={() => notify("New production setup will be connected to the backend.")}><Plus/> New production</button></div><div className="production-grid">{["Project Veera", "Project Godavari", "Untitled Production"].map((name, index) => <button className={project === name ? "selected" : ""} key={name} onClick={() => { setProject(name); notify(`Switched to ${name}.`); }}><Clapperboard/><div><strong>{name}</strong><small>{index === 0 ? "Active · Day 38 of 72" : index === 1 ? "Pre-production" : "Draft"}</small></div><span>{project === name ? "Current" : "Open"}</span></button>)}</div></section>}

        {view === "Team & access" && <section className="panel workspace-panel"><div className="panel-head"><div><h2>Team & access</h2><p>Preview of production roles and permissions</p></div><button onClick={() => notify("Team invitations require secure authentication.")}><Plus/> Invite member</button></div><div className="team-list">{[["AR","Arjun Reddy","Executive Producer","Full access"],["SK","Sowmya Krishna","Production Manager","Budgets & expenses"],["VN","Venkat Naidu","Accountant","Finance access"],["MP","Meera Prasad","Department Head","Submit expenses"]].map(member => <div key={member[1]}><span>{member[0]}</span><div><strong>{member[1]}</strong><small>{member[2]}</small></div><b>{member[3]}</b></div>)}</div></section>}

        {view === "Audit trail" && <section className="panel workspace-panel"><div className="panel-head"><div><h2>Audit trail</h2><p>Recent actions in this browser session</p></div><button onClick={() => setAudit([])}>Clear session log</button></div><div className="audit-list">{audit.length ? audit.map(entry => <div key={entry.id}><Activity/><p><strong>{entry.action}</strong><small>Arjun Reddy · {entry.time}</small></p></div>) : <div className="empty">No actions recorded in this session.</div>}</div></section>}

        {view === "Settings" && <section className="panel workspace-panel"><div className="panel-head"><div><h2>Workspace settings</h2><p>Local MVP preferences</p></div></div><div className="settings-list"><label><span><strong>Indian currency format</strong><small>Display expenses using ₹ and Indian digit grouping</small></span><input type="checkbox" defaultChecked onChange={() => notify("Currency preference updated.")}/></label><label><span><strong>Approval notifications</strong><small>Show alerts for pending production costs</small></span><input type="checkbox" defaultChecked onChange={() => notify("Notification preference updated.")}/></label><button onClick={resetDemo}><RotateCcw/> Restore all demo data</button></div></section>}

        {(view === "Overview" || view === "Budgets") && <section className="grid">
          <article className="panel budget" id="budgets"><div className="panel-head"><div><h2>Budget by department</h2><p>Current utilization across major departments</p></div><button onClick={() => goTo("Budgets")}>View all</button></div>
            <div className="dept-list">{departments.map(d => <button className="dept" key={d.name} onClick={() => filterDepartment(d.name)}><div className="dept-row"><span><i style={{background:d.color}}/>{d.name}</span><strong>{money(d.spent)} <small>of {money(d.budget)}</small></strong></div><div className="bar"><i style={{width:`${d.spent/d.budget*100}%`,background:d.color}}/></div><small>{Math.round(d.spent/d.budget*100)}% used · view expenses</small></button>)}</div>
          </article>
          <article className="panel pulse"><div className="panel-head"><div><h2>Production pulse</h2><p>Project Veera · Day 38 of 72</p></div></div>
            <div className="ring" style={{"--progress":"52.8%"} as React.CSSProperties}><div><strong>53%</strong><span>complete</span></div></div>
            <div className="pulse-stats"><div><span>Shoot days</span><strong>38 <small>/ 72</small></strong></div><div><span>Budget used</span><strong>56%</strong></div></div>
            <div className="note"><span>On track</span><p>Spending is 3% under the planned burn rate.</p></div>
          </article>
        </section>}

        {(view === "Overview" || view === "Expenses") && <section className="panel recent" id="expenses"><div className="panel-head"><div><h2>{query ? `Search results (${filteredExpenses.length})` : "Recent expenses"}</h2><p>{query ? `Matching “${query}”` : "Latest costs submitted across the production"}</p></div><div className="panel-tools"><button onClick={resetDemo}><RotateCcw/> Reset demo</button><button onClick={() => goTo("Expenses")}>View all expenses</button></div></div>
          <div className="filter-bar"><span>Filter:</span>{(["All", "Pending", "Approved", "Rejected"] as const).map(status => <button key={status} className={statusFilter === status ? "selected" : ""} onClick={() => setStatusFilter(status)}>{status}{status !== "All" && <b>{expenses.filter(e => e.status === status).length}</b>}</button>)}</div>
          <div className="table-wrap"><table><thead><tr><th>DATE</th><th>DESCRIPTION</th><th>DEPARTMENT</th><th>VENDOR</th><th>AMOUNT</th><th>STATUS / ACTION</th><th></th></tr></thead><tbody>{(view === "Expenses" || query || statusFilter !== "All" ? filteredExpenses : filteredExpenses.slice(0,5)).map(e => <tr key={e.id}><td>{e.date}</td><td><button className="expense-name" onClick={() => editExpense(e)}>{e.description}<small>Edit expense</small></button></td><td><button className="text-action" onClick={() => filterDepartment(e.department)}>{e.department}</button></td><td><button className="text-action" onClick={() => { setQuery(e.vendor); goTo("Vendors"); }}>{e.vendor}</button></td><td><strong>{money(e.amount)}</strong></td><td>{e.status === "Pending" ? <span className="row-actions"><button onClick={() => updateStatus(e.id, "Approved")}>Approve</button><button onClick={() => updateStatus(e.id, "Rejected")}>Reject</button></span> : <button className={`status ${e.status.toLowerCase()}`} onClick={() => updateStatus(e.id, "Pending")} title="Move back to pending">{e.status}</button>}</td><td><span className="icon-actions"><button onClick={() => editExpense(e)} aria-label={`Edit ${e.description}`}><Pencil/></button><button onClick={() => duplicateExpense(e)} aria-label={`Duplicate ${e.description}`}><Copy/></button><button className="delete-btn" onClick={() => deleteExpense(e.id)} aria-label={`Delete ${e.description}`}><Trash2/></button></span></td></tr>)}</tbody></table>{filteredExpenses.length === 0 && <div className="empty">No expenses match these filters.</div>}</div>
        </section>}
      </div>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(false)}><form className="modal" onSubmit={addExpense} onMouseDown={e => e.stopPropagation()}><div className="modal-title"><div><h2>{editingId ? "Edit expense" : "Add new expense"}</h2><p>{editingId ? "Update the production cost details." : "Submit a production cost for approval."}</p></div><button type="button" onClick={() => setModal(false)}><X/></button></div><label>Description<input autoFocus value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="e.g. Camera rental — week 4" required/></label><div className="form-row"><label>Amount (₹)<input type="number" min="1" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} placeholder="0" required/></label><label>Department<select value={form.department} onChange={e => setForm({...form, department:e.target.value})}>{departments.map(d => <option key={d.name}>{d.name}</option>)}</select></label></div><label>Vendor<input value={form.vendor} onChange={e => setForm({...form, vendor:e.target.value})} placeholder="Vendor or payee name"/></label><div className="form-row"><label>Payment method<select value={form.payment} onChange={e => setForm({...form, payment:e.target.value})}><option>Bank transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>Corporate card</option></select></label><label className="file-field">Receipt / invoice<input type="file" accept="image/*,.pdf" onChange={e => setForm({...form, receipt:e.target.files?.[0]?.name || ""})}/><span><FileText/> {form.receipt || "Choose a file"}</span></label></div><div className="modal-actions"><button type="button" onClick={() => setModal(false)}>Cancel</button><button className="primary" type="submit">{editingId ? "Save changes" : "Submit expense"}</button></div></form></div>}
    {toast && <div className="toast">{toast}</div>}
  </div>;
}
