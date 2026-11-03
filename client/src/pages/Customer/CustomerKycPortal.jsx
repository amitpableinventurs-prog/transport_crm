import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Check,
  LoaderCircle,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Trash2
} from 'lucide-react';

const TOKEN_KEY = 'transport_customer_access_token';
const REFRESH_TOKEN_KEY = 'transport_customer_refresh_token';
const EMPTY_ADDRESS = { label: 'Office', address: '', city: '', state: '', pincode: '', contactName: '', contactPhone: '', isDefault: false };
const DEFAULT_PREFERENCES = { language: 'en', defaultVehicleType: '', notifyBySms: true, notifyByEmail: true };

async function customerRequest(path, { body, method = 'GET' } = {}, allowRefresh = true) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  let requestBody;
  if (body) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`/api/v1${path}`, { method, headers, body: requestBody });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401 && allowRefresh && sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
    const refreshResponse = await fetch('/api/v1/customers/auth/refresh-token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: sessionStorage.getItem(REFRESH_TOKEN_KEY) })
    });
    const refreshed = await refreshResponse.json().catch(() => ({}));
    if (!refreshResponse.ok || !refreshed.accessToken || !refreshed.refreshToken) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      const error = new Error(refreshed.message || 'Your session expired. Please sign in again.');
      error.status = 401;
      throw error;
    }
    sessionStorage.setItem(TOKEN_KEY, refreshed.accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshed.refreshToken);
    return customerRequest(path, { body, method }, false);
  }
  if (!response.ok) {
    const error = new Error(result.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return result.data ?? result;
}

function Field({ label, value, onChange, required = false, type = 'text', inputMode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}{required && <span className="ml-1 text-rose-600">*</span>}</span><input type={type} inputMode={inputMode} required={required} value={value || ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" /></label>;
}

function StatusBadge({ status }) {
  const tone = status === 'Verified' || status === 'Active' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : status === 'Rejected' || status === 'Suspended' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800';
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status || 'NotSubmitted'}</span>;
}

function OtpSignIn({ onSignedIn, onError }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [mockOtp, setMockOtp] = useState('');

  async function sendOtp(event) {
    event.preventDefault();
    if (!phone.trim()) {
      onError('Mobile number is required. Enter your number, then select Send OTP.');
      return;
    }
    setBusy(true); onError(''); setNotice(''); setMockOtp('');
    try {
      const result = await customerRequest('/customers/auth/send-otp', { method: 'POST', body: { phone: phone.trim() } });
      setOtpSent(true);
      setMockOtp(result.mockOtp || '');
      setNotice(`Code sent to ${result.phone || phone}.`);
    } catch (error) { onError(error.message); } finally { setBusy(false); }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      onError('Enter the complete 6-digit OTP shown for local testing or sent to your phone.');
      return;
    }
    setBusy(true); onError('');
    try {
      const result = await customerRequest('/customers/auth/verify-otp', { method: 'POST', body: { phone: phone.trim(), otp: otp.trim() } });
      sessionStorage.setItem(TOKEN_KEY, result.accessToken);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      onSignedIn(result.accessToken);
    } catch (error) { onError(error.message); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-5xl items-center justify-center">
      <section className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-2">
        <div className="bg-[#102c27] p-7 text-white sm:p-10">
          <div className="flex items-center gap-2 text-emerald-300"><ShieldCheck size={19} /><span className="text-xs font-bold uppercase tracking-[0.16em]">Customer workspace</span></div>
          <h1 className="mt-8 max-w-md text-3xl font-bold leading-tight">Your account and KYC</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">Keep your business profile current and submit your PAN details for review.</p>
        </div>
        <form onSubmit={otpSent ? verifyOtp : sendOtp} className="space-y-4 p-6 sm:p-9">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Customer sign in</p><h2 className="mt-2 text-xl font-bold text-slate-950">{otpSent ? 'Verify your phone' : 'Continue with OTP'}</h2><p className="mt-2 text-sm text-slate-600">{notice || 'We will send a one-time code to your phone.'}</p></div>
          {mockOtp && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><span className="font-semibold">Development OTP:</span> <span className="font-mono tracking-[0.2em]">{mockOtp}</span></div>}
          <Field label="Mobile number" value={phone} onChange={setPhone} type="tel" inputMode="tel" />
          {otpSent && <><Field label="Six-digit OTP" value={otp} onChange={setOtp} inputMode="numeric" /><p className="text-xs text-slate-500">Enter all 6 digits to verify.</p></>}
          <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin" /> : otpSent ? <ShieldCheck size={16} /> : <Phone size={16} />}{otpSent ? 'Verify and continue' : 'Send OTP'}</button>
          {otpSent && <button type="button" onClick={sendOtp} disabled={busy} className="w-full rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Resend code</button>}
          <p className="text-xs leading-5 text-slate-500">Development mock OTP is printed in the API terminal and shown here for local testing only.</p>
        </form>
      </section>
    </div>
  );
}

export default function CustomerKycPortal() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [customer, setCustomer] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [profile, setProfile] = useState({ companyName: '', contactPerson: '', email: '', gstin: '', pan: '', address: { street: '', city: '', state: '', pincode: '' } });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadPortal() {
    const [dashboardResult, profileResult, preferencesResult, addressesResult] = await Promise.all([
      customerRequest('/customers/portal/dashboard'),
      customerRequest('/customers/portal/profile'),
      customerRequest('/customers/portal/preferences'),
      customerRequest('/customers/portal/addresses')
    ]);
    const nextCustomer = profileResult.data || profileResult.customer || profileResult;
    setDashboard(dashboardResult);
    setCustomer(nextCustomer);
    setPreferences({ ...DEFAULT_PREFERENCES, ...(preferencesResult.preferences || preferencesResult) });
    setAddresses(Array.isArray(addressesResult) ? addressesResult : addressesResult.addresses || []);
    setProfile({
      companyName: nextCustomer.companyName || '', contactPerson: nextCustomer.contactPerson || '',
      email: nextCustomer.email || '', gstin: nextCustomer.gstin || '', pan: nextCustomer.pan || '',
      address: { street: nextCustomer.address?.street || '', city: nextCustomer.address?.city || '', state: nextCustomer.address?.state || '', pincode: nextCustomer.address?.pincode || '' }
    });
  }

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([
      customerRequest('/customers/portal/dashboard'),
      customerRequest('/customers/portal/profile'),
      customerRequest('/customers/portal/preferences'),
      customerRequest('/customers/portal/addresses')
    ])
      .then(([dashboardResult, profileResult, preferencesResult, addressesResult]) => {
        if (!active) return;
        const nextCustomer = profileResult.data || profileResult.customer || profileResult;
        setDashboard(dashboardResult);
        setCustomer(nextCustomer);
        setPreferences({ ...DEFAULT_PREFERENCES, ...(preferencesResult.preferences || preferencesResult) });
        setAddresses(Array.isArray(addressesResult) ? addressesResult : addressesResult.addresses || []);
        setProfile({
          companyName: nextCustomer.companyName || '', contactPerson: nextCustomer.contactPerson || '',
          email: nextCustomer.email || '', gstin: nextCustomer.gstin || '', pan: nextCustomer.pan || '',
          address: { street: nextCustomer.address?.street || '', city: nextCustomer.address?.city || '', state: nextCustomer.address?.state || '', pincode: nextCustomer.address?.pincode || '' }
        });
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message);
        if (requestError.status === 401) { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(REFRESH_TOKEN_KEY); setToken(''); }
      });
    return () => { active = false; };
  }, [token]);

  function updateAddress(field, value) { setProfile((current) => ({ ...current, address: { ...current.address, [field]: value } })); }

  function useSavedAddress() {
    const savedAddress = addresses.find((address) => address.isDefault) || addresses[0];
    if (!savedAddress) return;
    setProfile((current) => ({
      ...current,
      address: {
        street: savedAddress.address || '',
        city: savedAddress.city || '',
        state: savedAddress.state || '',
        pincode: savedAddress.pincode || ''
      }
    }));
    setError('');
    setNotice('Saved address copied into your profile. Save profile to apply it.');
  }

  async function saveProfile(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await customerRequest('/customers/portal/profile', { method: 'PUT', body: profile });
      await loadPortal();
      setNotice(result.message || 'Profile saved. You can submit your KYC details for review.');
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function savePanNumber(event) {
    event.preventDefault(); setError(''); setNotice('');
    const pan = profile.pan.trim().toUpperCase();
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) {
      setError('PAN number must be 10 characters: 5 letters, 4 digits, then 1 letter. Please check the number and try again.');
      return;
    }

    setBusy(true);
    try {
      const result = await customerRequest('/customers/portal/profile', {
        method: 'PUT',
        body: { pan }
      });
      await loadPortal();
      setNotice(result.message || 'PAN number saved to your customer profile.');
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function savePreferences(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await customerRequest('/customers/portal/preferences', { method: 'PUT', body: preferences });
      setPreferences({ ...DEFAULT_PREFERENCES, ...(result.preferences || result) });
      setNotice('Notification and booking preferences saved.');
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function saveAddress(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const editing = Boolean(editingAddressId);
      const result = await customerRequest(`/customers/portal/addresses${editing ? `/${encodeURIComponent(editingAddressId)}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        body: addressForm
      });
      setAddressForm(EMPTY_ADDRESS);
      setEditingAddressId('');
      await loadPortal();
      setNotice(result.message || (editing ? 'Address updated.' : 'Address saved.'));
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function deleteAddress(address) {
    if (!window.confirm(`Delete the saved address "${address.label || address.city}"?`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await customerRequest(`/customers/portal/addresses/${encodeURIComponent(address._id)}`, { method: 'DELETE' });
      await loadPortal();
      setNotice(result.message || 'Address deleted.');
      if (editingAddressId === address._id) { setEditingAddressId(''); setAddressForm(EMPTY_ADDRESS); }
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function submitKyc() {
    setBusy(true); setError(''); setNotice('');
    try {
      await customerRequest('/customers/portal/kyc/submit', { method: 'POST', body: {} });
      await loadPortal();
      setNotice('KYC submitted. You can track document and review status below.');
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function downloadDocument(document) {
    try {
      const response = await fetch(`/api/v1/customers/portal/kyc/documents/${document._id}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Document download failed.');
      const url = URL.createObjectURL(await response.blob());
      const link = window.document.createElement('a'); link.href = url; link.download = document.originalName; link.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.message); }
  }

  async function signOut() {
    try { await customerRequest('/customers/auth/logout', { method: 'POST', body: {} }); } catch {}
    sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(REFRESH_TOKEN_KEY); setToken(''); setCustomer(null); setDocuments([]);
  }

  if (!token) return <div>{error && <div role="alert" className="mb-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}<OtpSignIn onSignedIn={(value) => { setError(''); setToken(value); }} onError={setError} /></div>;

  const missingKycFields = [
    ['companyName', 'Company / customer name'],
    ['contactPerson', 'Contact person'],
    ['email', 'Email'],
    ['pan', 'PAN number'],
    ['address.street', 'Street address'],
    ['address.city', 'City'],
    ['address.state', 'State'],
    ['address.pincode', 'Pincode']
  ].filter(([field]) => {
    const value = field.startsWith('address.')
      ? profile.address[field.slice('address.'.length)]
      : profile[field];
    return !String(value || '').trim();
  }).map(([, label]) => label);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">Customer account</p><h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-950">Profile & KYC</h1><p className="mt-1 text-sm text-slate-600">Update your account and submit your PAN details for verification.</p></div><div className="flex items-center gap-2"><StatusBadge status={customer?.kycStatus} /><button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LogOut size={14} />Sign out</button></div></header>
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Profile completion</p><p className="mt-1 text-2xl font-bold text-slate-950">{dashboard?.profile?.completionPercent ?? '—'}{dashboard?.profile?.completionPercent != null ? '%' : ''}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Saved addresses</p><p className="mt-1 text-2xl font-bold text-slate-950">{dashboard?.savedAddresses ?? '—'}</p></div>
      </section>
      {error && <div role="alert" className="flex items-start gap-2 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
      {notice && <div role="status" className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><Check size={16} />{notice}</div>}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-slate-950">Customer profile</h2><p className="mt-1 text-xs text-slate-500">Signed in as {customer?.phone}</p></div><BadgeCheck size={19} className="text-emerald-700" /></div>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Company / customer name" value={profile.companyName} onChange={(value) => setProfile((current) => ({ ...current, companyName: value }))} required /><Field label="Contact person" value={profile.contactPerson} onChange={(value) => setProfile((current) => ({ ...current, contactPerson: value }))} required /><Field label="Email" type="email" value={profile.email} onChange={(value) => setProfile((current) => ({ ...current, email: value }))} required /><Field label="GSTIN (business)" value={profile.gstin} onChange={(value) => setProfile((current) => ({ ...current, gstin: value.toUpperCase() }))} /><Field label="Street address" value={profile.address.street} onChange={(value) => updateAddress('street', value)} required /><Field label="City" value={profile.address.city} onChange={(value) => updateAddress('city', value)} required /><Field label="State" value={profile.address.state} onChange={(value) => updateAddress('state', value)} required /><Field label="Pincode" value={profile.address.pincode} onChange={(value) => updateAddress('pincode', value)} required /></div>
          {addresses.length > 0 && <button type="button" onClick={useSavedAddress} className="text-xs font-semibold text-emerald-800 underline underline-offset-2">Use saved default address</button>}
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}Save profile</button>
        </form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2"><MapPin size={18} className="text-emerald-700" /><div><h2 className="text-base font-bold text-slate-950">Saved addresses</h2><p className="mt-1 text-xs text-slate-500">Manage pickup and delivery contacts for future bookings.</p></div></div>
        <div className="mb-5 space-y-2">
          {addresses.length ? addresses.map((address) => (
            <article key={address._id} className="flex flex-col justify-between gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center">
              <div><p className="text-sm font-semibold text-slate-900">{address.label || 'Address'}{address.isDefault && <span className="ml-2 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Default</span>}</p><p className="mt-1 text-xs text-slate-600">{address.address}, {address.city}, {address.state} {address.pincode}</p><p className="mt-1 text-xs text-slate-500">{[address.contactName, address.contactPhone].filter(Boolean).join(' · ') || 'No contact details'}</p></div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => { setEditingAddressId(address._id); setAddressForm({ ...EMPTY_ADDRESS, ...address }); }} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={13} />Edit</button>
                <button type="button" onClick={() => deleteAddress(address)} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={13} />Delete</button>
              </div>
            </article>
          )) : <p className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">No saved addresses yet.</p>}
        </div>
        <form onSubmit={saveAddress} className="space-y-4 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-900">{editingAddressId ? 'Edit address' : 'Add an address'}</h3>{editingAddressId && <button type="button" onClick={() => { setEditingAddressId(''); setAddressForm(EMPTY_ADDRESS); }} className="text-xs font-semibold text-slate-600 underline">Cancel edit</button>}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label" value={addressForm.label} onChange={(value) => setAddressForm((current) => ({ ...current, label: value }))} />
            <Field label="Address" value={addressForm.address} onChange={(value) => setAddressForm((current) => ({ ...current, address: value }))} required />
            <Field label="City" value={addressForm.city} onChange={(value) => setAddressForm((current) => ({ ...current, city: value }))} required />
            <Field label="State" value={addressForm.state} onChange={(value) => setAddressForm((current) => ({ ...current, state: value }))} required />
            <Field label="Pincode" value={addressForm.pincode} onChange={(value) => setAddressForm((current) => ({ ...current, pincode: value }))} required />
            <Field label="Contact name" value={addressForm.contactName} onChange={(value) => setAddressForm((current) => ({ ...current, contactName: value }))} />
            <Field label="Contact phone" value={addressForm.contactPhone} onChange={(value) => setAddressForm((current) => ({ ...current, contactPhone: value }))} />
            <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={Boolean(addressForm.isDefault)} onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))} className="h-4 w-4 accent-emerald-700" />Make this the default address</label>
          </div>
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}{editingAddressId ? 'Save address' : 'Add address'}</button>
        </form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5"><h2 className="text-base font-bold text-slate-950">Preferences</h2><p className="mt-1 text-xs text-slate-500">Choose booking defaults and how we contact you.</p></div>
        <form onSubmit={savePreferences} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Language</span><select value={preferences.language} onChange={(event) => setPreferences((current) => ({ ...current, language: event.target.value }))} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option><option value="gu">Gujarati</option></select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Default vehicle type</span><select value={preferences.defaultVehicleType} onChange={(event) => setPreferences((current) => ({ ...current, defaultVehicleType: event.target.value }))} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">No default</option>{['Mini Truck', 'Pickup', 'Truck', 'Container', 'Trailer', 'Tanker'].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={preferences.notifyBySms} onChange={(event) => setPreferences((current) => ({ ...current, notifyBySms: event.target.checked }))} className="h-4 w-4 accent-emerald-700" />Receive SMS notifications</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={preferences.notifyByEmail} onChange={(event) => setPreferences((current) => ({ ...current, notifyByEmail: event.target.checked }))} className="h-4 w-4 accent-emerald-700" />Receive email notifications</label>
          </div>
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}Save preferences</button>
        </form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5"><h2 className="text-base font-bold text-slate-950">KYC verification</h2><p className="mt-1 text-xs text-slate-500">Enter and save your PAN number. No PDF or document upload is needed.</p></div>
        <form onSubmit={savePanNumber} className="mb-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <label className="block max-w-md"><span className="mb-1.5 block text-xs font-semibold text-slate-700">PAN card number</span><input type="text" value={profile.pan} onChange={(event) => setProfile((current) => ({ ...current, pan: event.target.value.toUpperCase().slice(0, 10) }))} placeholder="ABCDE1234F" maxLength={10} required autoCapitalize="characters" aria-describedby="pan-number-help" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm uppercase text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" /><span id="pan-number-help" className="mt-1.5 block text-[11px] text-slate-500">Format: 10 characters — 5 letters, 4 digits, then 1 letter.</span></label>
          <button type="submit" disabled={busy || !profile.pan.trim()} className="mt-3 inline-flex items-center gap-2 rounded-md border border-emerald-700 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}Save PAN number</button>
        </form>
        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center"><div><p className="text-xs text-slate-600">{customer?.isProfileComplete ? 'File uploads are optional. Submit your completed profile and PAN number for review.' : 'Complete and save your profile, including your PAN number, before submitting KYC.'}</p>{missingKycFields.length > 0 && <p className="mt-1 text-xs text-amber-800">Still needed: {missingKycFields.join(', ')}.</p>}</div><button type="button" onClick={submitKyc} disabled={busy || !customer?.isProfileComplete || customer?.kycStatus === 'Pending'} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45"><ShieldCheck size={15} />Submit KYC for review</button></div>
      </section>
    </div>
  );
}