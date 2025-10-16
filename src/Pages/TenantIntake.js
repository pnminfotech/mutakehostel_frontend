// src/Pages/TenantIntake.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../form.css';
import { useNavigate } from 'react-router-dom';

const API = 'https://mutakehostel-backend.onrender.com/api';

function TenantIntake() {
  const [formData, setFormData] = useState({
    // Core
    srNo: '',
    name: '',
    phoneNo: '',
    address: '',
    joiningDate: '',
    dob: '',

    // Relative address (single line)
    relativeAddress: '',

    // Company/College
    companyAddress: '',
    dateOfJoiningCollege: '',

    // Room/Bed
    roomNo: '',
    bedNo: '',

    // Money (editable)
    baseRent: '',
    rentAmount: '',
    depositAmount: '',

    // Relatives
    relative1Relation: 'Self',
    relative1Name: '',
    relative1Phone: '',
    relative2Relation: 'Self',
    relative2Name: '',
    relative2Phone: '',
  });

  // Docs
  const [docFiles, setDocFiles] = useState([]); // [{ file, relation }]
  const [docMsg, setDocMsg] = useState('');

  // 🔹 Step 6.a — invite state
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteError, setInviteError] = useState("");

  // Query params
  const params = new URLSearchParams(window.location.search);
  const isTenant = params.get('tenant') === 'true';
  const isLocked =
    params.get('lock') === '1' ||
    params.get('lock') === 'true';

  const navigate = useNavigate();

  // Prefill from query params (only when provided)
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...(params.has('name') ? { name: params.get('name') || '' } : {}),
      ...(params.has('phoneNo') ? { phoneNo: (params.get('phoneNo') || '').replace(/\D/g, '').slice(0, 10) } : {}),
      ...(params.has('roomNo') ? { roomNo: params.get('roomNo') || '' } : {}),
      ...(params.has('bedNo') ? { bedNo: params.get('bedNo') || '' } : {}),
      ...(params.has('baseRent') ? { baseRent: params.get('baseRent') || '' } : {}),
      ...(params.has('rentAmount') ? { rentAmount: params.get('rentAmount') || '' } : {}),
      ...(params.has('depositAmount') ? { depositAmount: params.get('depositAmount') || '' } : {}),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // 🔹 Step 6.b — validate & prefill using ?inv=
  useEffect(() => {
    const token = params.get("inv");
    if (!token) return;

    setInviteToken(token);

    (async () => {
      try {
        const r = await axios.get(`${API}/invites/${token}`);
        if (r.data?.ok && r.data.prefill) {
          setFormData(prev => ({
            ...prev,
            ...r.data.prefill,
          }));
        }
      } catch (err) {
        const code = err?.response?.status;
        if (code === 409) setInviteError("This link has already been used.");
        else if (code === 410) setInviteError("This link has expired.");
        else if (code === 404) setInviteError("Invalid link.");
        else setInviteError("Could not validate invite link.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch next Sr No (display + used in payload)
  const fetchSrNo = async () => {
    try {
      const res = await axios.get(`${API}/forms/count`);
      setFormData((prev) => ({ ...prev, srNo: res.data.nextSrNo }));
      return res.data.nextSrNo;
    } catch (err) {
      console.error('Error fetching Sr No:', err);
      return '';
    }
  };

  useEffect(() => {
    fetchSrNo();
  }, []);

  // Generic change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // if field is locked, ignore input changes for those
    if (isLocked && ['name', 'phoneNo', 'roomNo', 'bedNo', 'baseRent', 'rentAmount', 'depositAmount'].includes(name)) {
      return;
    }

    // normalize phone numbers
    if (name === 'phoneNo' || name === 'relative1Phone' || name === 'relative2Phone') {
      const onlyDigits = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: onlyDigits }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Specific handlers for editable rents (numbers, >= 0)
  const handleBaseRentChange = (e) => {
    if (isLocked) return;
    const v = e.target.value;
    if (v === '' || /^\d+(\.\d{0,2})?$/.test(v)) {
      setFormData((prev) => ({
        ...prev,
        baseRent: v,
        // prefill rentAmount only if it's still empty
        rentAmount: prev.rentAmount === '' ? v : prev.rentAmount,
      }));
    }
  };

  const handleRentAmountChange = (e) => {
    if (isLocked) return;
    const v = e.target.value;
    if (v === '' || /^\d+(\.\d{0,2})?$/.test(v)) {
      setFormData((prev) => ({ ...prev, rentAmount: v }));
    }
  };

  // Docs handling
  const handleDocsChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const accepted = [];
    for (const f of files) {
      if (!/^image\//i.test(f.type)) {
        setDocMsg('Only image files are allowed.');
        continue;
      }
      accepted.push({ file: f, relation: 'Self' });
    }
    setDocFiles((prev) => [...prev, ...accepted]);
    if (accepted.length) setDocMsg('');
  };

  const removeDoc = (idx) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---------- helpers for safe payload + uploads ----------
  function sanitizeTenantPayload(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
      if (v === '' || v == null) { out[k] = undefined; continue; }  // "" -> undefined

      // numbers
      if (/(amount|price|rent|deposit|srNo)$/i.test(k)) {
        const n = Number(String(v).replace(/[,₹\s]/g, ''));
        out[k] = Number.isFinite(n) ? n : undefined;
        continue;
      }

      // dates
      if (/(date|dob|joining)/i.test(k)) {
        out[k] = v || undefined;
        continue;
      }

      out[k] = v;
    }
    return out;
  }

  async function uploadDocsIfAny(docs) {
    if (!docs.length) return [];
    const fd = new FormData();
    // BACKEND EXPECTS: "documents"
    docs.forEach((d) => fd.append('documents', d.file));

    const up = await axios.post(`${API}/uploads/docs`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const uploadedFiles = up.data?.files || [];
    return uploadedFiles.map((f, i) => ({
      fileName: docs[i]?.file?.name || f.filename || `doc-${i + 1}`,
      relation: docs[i]?.relation || 'Self',
      url:
        f.url ||
        f.path ||
        f.location ||
        f.secure_url ||
        (f._id ? `${API}/documents/${f._id}` : '#'),
    }));
  }

  // POST to /forms (with 1x retry on E11000 duplicate srNo)
  const postFormWithRetry = async (payload) => {
    try {
      return await axios.post(`${API}/forms`, payload);
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        '';

      // If duplicate key on srNo, refetch and try once more
      if (/E11000/i.test(serverMsg) || /duplicate key/i.test(serverMsg)) {
        const fresh = await fetchSrNo(); // get a fresh nextSrNo
        const retryPayload = { ...payload, srNo: Number(fresh) || fresh || undefined };
        return await axios.post(`${API}/forms`, retryPayload);
      }

      // rethrow others
      throw err;
    }
  };

  // Submit: upload docs (if any) -> post JSON to /forms
  const handleSubmit = async (e) => {
    e.preventDefault();

    // quick validation
    if (!formData.name?.trim()) { alert('Name is required'); return; }
    if (!formData.joiningDate) { alert('Joining Date is required'); return; }
    if (!formData.address?.trim()) { alert('Address is required'); return; }

    if (formData.phoneNo && !/^\d{10}$/.test(formData.phoneNo)) {
      alert('Please enter a valid 10-digit Phone No.');
      return;
    }
    if (formData.relative1Phone && !/^\d{10}$/.test(formData.relative1Phone)) {
      alert('Relative 1 phone should be a 10-digit number.');
      return;
    }
    if (formData.relative2Phone && !/^\d{10}$/.test(formData.relative2Phone)) {
      alert('Relative 2 phone should be a 10-digit number.');
      return;
    }

    try {
      // 1) Upload docs first (if any)
      const documents = await uploadDocsIfAny(docFiles);

      // 2) Build JSON payload (include srNo; server expects it)
      const raw = {
        ...formData,
        relativeAddress1: formData.relativeAddress, // map to your backend field
        documents,
        source: 'public-intake',       // optional
        status: 'pending_review',      // optional
        ...(inviteToken ? { inviteToken } : {}), // 🔹 Step 6.c — include token if present
      };
      delete raw.relativeAddress;

      // Ensure srNo is numeric if possible
      if (raw.srNo !== undefined && raw.srNo !== '') {
        const n = Number(String(raw.srNo).replace(/\D/g, ''));
        raw.srNo = Number.isFinite(n) ? n : raw.srNo;
      }

      const payload = sanitizeTenantPayload(raw);

      // 3) POST JSON (with 1x duplicate retry)
      await postFormWithRetry(payload);

      // 4) Redirect
      if (isTenant) {
        navigate('/form-submitted'); // public thank you
      } else {
        navigate('/add-data'); // admin flow
      }
    } catch (error) {
      // Log rich details to devtools to help diagnose 500s
      console.error('Error submitting form:', {
        url: error?.config?.url,
        method: error?.config?.method,
        status: error?.response?.status,
        dataSent: error?.config?.data,
        serverData: error?.response?.data,
        message: error?.message,
      });

      // 🔹 Step 6.c — 409 handling
      if (error?.response?.status === 409) {
        alert("This invitation link is invalid, expired, or already used.");
        return;
      }

      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Failed to submit the form';
      alert(msg);
    }
  };

  return (
    <>
      <h2>Tenant Form</h2>

      {/* 🔹 Optional banner if invite has issues */}
      {inviteError && (
        <div className="alert alert-danger" role="alert">
          {inviteError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-container">
        {/* Sr No (display + used) */}
        <div className="form-group">
          <label htmlFor="srNo">Sr. No.</label>
          <input type="text" name="srNo" id="srNo" value={formData.srNo} readOnly className="form-input" />
        </div>

        {/* Name (lockable) */}
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            readOnly={isLocked}
          />
        </div>

        {/* Phone (lockable) */}
        <div className="form-group">
          <label htmlFor="phoneNo">Phone No</label>
          <input
            type="tel"
            name="phoneNo"
            id="phoneNo"
            placeholder="10-digit number"
            value={formData.phoneNo}
            onChange={handleChange}
            className="form-input"
            readOnly={isLocked}
          />
          {formData.phoneNo && !/^\d{10}$/.test(formData.phoneNo) && (
            <small className="text-danger">Enter 10-digit number</small>
          )}
        </div>

        {/* Address */}
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            name="address"
            id="address"
            placeholder="House, Street, City"
            value={formData.address}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {/* Dates */}
        <div className="form-group">
          <label htmlFor="joiningDate">Joining Date</label>
          <input
            type="date"
            name="joiningDate"
            id="joiningDate"
            value={formData.joiningDate}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="dob">Date of Birth</label>
          <input
            type="date"
            name="dob"
            id="dob"
            value={formData.dob}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {/* Relative Address */}
        <div className="form-group">
          <label htmlFor="relativeAddress">Relative Address</label>
          <input
            type="text"
            name="relativeAddress"
            id="relativeAddress"
            placeholder="Optional single-line relative address"
            value={formData.relativeAddress}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {/* Relatives */}
        <fieldset className="form-group">
          <legend>Relative 1</legend>
          <div className="form-row">
            <label>Relation</label>
            <select
              name="relative1Relation"
              className="form-input"
              value={formData.relative1Relation}
              onChange={handleChange}
            >
              {['Self', 'Sister', 'Brother', 'Father', 'Husband', 'Mother'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Name</label>
            <input
              name="relative1Name"
              className="form-input"
              placeholder="Name"
              value={formData.relative1Name}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <label>Phone</label>
            <input
              name="relative1Phone"
              className="form-input"
              placeholder="10-digit number"
              value={formData.relative1Phone}
              onChange={handleChange}
            />
            {formData.relative1Phone && !/^\d{10}$/.test(formData.relative1Phone) && (
              <small className="text-danger">Enter 10-digit number</small>
            )}
          </div>
        </fieldset>

        <fieldset className="form-group">
          <legend>Relative 2</legend>
          <div className="form-row">
            <label>Relation</label>
            <select
              name="relative2Relation"
              className="form-input"
              value={formData.relative2Relation}
              onChange={handleChange}
            >
              {['Self', 'Sister', 'Brother', 'Father', 'Husband', 'Mother'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Name</label>
            <input
              name="relative2Name"
              className="form-input"
              placeholder="Name"
              value={formData.relative2Name}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <label>Phone</label>
            <input
              name="relative2Phone"
              className="form-input"
              placeholder="10-digit number"
              value={formData.relative2Phone}
              onChange={handleChange}
            />
            {formData.relative2Phone && !/^\d{10}$/.test(formData.relative2Phone) && (
              <small className="text-danger">Enter 10-digit number</small>
            )}
          </div>
        </fieldset>

        {/* Company/College */}
        <div className="form-group">
          <label htmlFor="companyAddress">Company Address / College</label>
          <input
            type="text"
            name="companyAddress"
            id="companyAddress"
            value={formData.companyAddress}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="dateOfJoiningCollege">Date of Joining College / Office</label>
          <input
            type="date"
            name="dateOfJoiningCollege"
            id="dateOfJoiningCollege"
            value={formData.dateOfJoiningCollege}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {/* Room / Bed (lockable where required) */}
        <div className="form-group">
          <label htmlFor="roomNo">Room No.</label>
          <input
            type="text"
            name="roomNo"
            id="roomNo"
            value={formData.roomNo}
            onChange={handleChange}
            className="form-input"
            readOnly={isLocked}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bedNo">Bed No.</label>
          <input
            type="text"
            name="bedNo"
            id="bedNo"
            value={formData.bedNo}
            onChange={handleChange}
            className="form-input"
            readOnly={isLocked}
          />
        </div>

        {/* Editable / Lockable Base Rent + Rent Amount */}
        {/* <div className="form-group">
          <label htmlFor="baseRent">Base Rent Amount</label>
          <input
            type="text"
            inputMode="decimal"
            name="baseRent"
            id="baseRent"
            placeholder="e.g., 3500"
            value={formData.baseRent}
            onChange={handleBaseRentChange}
            className="form-input"
            readOnly={isLocked}
          />
          <small className="text-muted">Auto-fills Rent Amount if it is blank.</small>
        </div> */}

        <div className="form-group">
          <label htmlFor="rentAmount">Rent Amount</label>
          <input
            type="text"
            inputMode="decimal"
            name="rentAmount"
            id="rentAmount"
            placeholder="e.g., 3500"
            value={formData.rentAmount}
            onChange={handleRentAmountChange}
            className="form-input"
            readOnly={isLocked}
          />
        </div>

        {/* Deposit (lockable) */}
        <div className="form-group">
          <label htmlFor="depositAmount">Deposit Amount</label>
          <input
            type="text"
            inputMode="decimal"
            name="depositAmount"
            id="depositAmount"
            placeholder="e.g., 5000"
            value={formData.depositAmount}
            onChange={(e) => {
              if (isLocked) return;
              const v = e.target.value;
              if (v === '' || /^\d+(\.\d{0,2})?$/.test(v)) {
                setFormData((prev) => ({ ...prev, depositAmount: v }));
              }
            }}
            className="form-input"
            readOnly={isLocked}
          />
        </div>

        {/* Upload Docs */}
        <div className="form-group">
          <label>Upload Documents</label>
          <input type="file" className="form-input" multiple accept="image/*" onChange={handleDocsChange} />
          {docMsg && <small className="text-danger">{docMsg}</small>}
        </div>

        {docFiles.length > 0 && (
          <div className="form-group">
            <ul className="list-unstyled">
              {docFiles.map((d, i) => (
                <li key={i} className="doc-row">
                  <span className="doc-name">
                    {d.file.name} <small className="text-muted">({Math.ceil(d.file.size / 1024)} KB)</small>
                  </span>
                  <select
                    className="form-input"
                    value={d.relation}
                    onChange={(e) => {
                      const copy = [...docFiles];
                      copy[i] = { ...copy[i], relation: e.target.value };
                      setDocFiles(copy);
                    }}
                  >
                    <option value="Self">Self</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Husband">Husband</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                  </select>
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeDoc(i)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <button type="submit" className="submit-btn">Submit</button>
        {!isTenant && (
          <button type="button" className="back-btn" onClick={() => navigate('/mainpage')}>
            Back
          </button>
        )}
      </form>
    </>
  );
}

export default TenantIntake;
