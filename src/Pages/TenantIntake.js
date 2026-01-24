// src/Pages/TenantIntake.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../form.css";
import { useNavigate } from "react-router-dom";

const API = " http://localhost:8000/api";

function TenantIntake() {
  const [formData, setFormData] = useState({
    srNo: "",
    name: "",
    phoneNo: "",
    address: "",
    joiningDate: "",
    dob: "",
    category: "",
    relativeAddress: "",
    companyAddress: "",
    dateOfJoiningCollege: "",
    roomNo: "",
    bedNo: "",
    baseRent: "",
    rentAmount: "",
    depositAmount: "",
    relative1Relation: "Self",
    relative1Name: "",
    relative1Phone: "",
    relative2Relation: "Self",
    relative2Name: "",
    relative2Phone: "",
  });

  const [docFiles, setDocFiles] = useState([]);
  const [docMsg, setDocMsg] = useState("");

  const [selfAadharFile, setSelfAadharFile] = useState(null);
  const [parentAadharFile, setParentAadharFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [inviteToken, setInviteToken] = useState(null);
  const [inviteError, setInviteError] = useState("");
  const [formId, setFormId] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const isTenant = params.get("tenant") === "true";
  const isLocked = params.get("lock") === "1" || params.get("lock") === "true";

  const navigate = useNavigate();

  /* ===========================
     Prefill From Query Params
  ============================ */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...(params.has("category") ? { category: params.get("category") } : {}),
      ...(params.has("name") ? { name: params.get("name") } : {}),
      ...(params.has("phoneNo")
        ? { phoneNo: params.get("phoneNo").replace(/\D/g, "").slice(0, 10) }
        : {}),
      ...(params.has("roomNo") ? { roomNo: params.get("roomNo") } : {}),
      ...(params.has("bedNo") ? { bedNo: params.get("bedNo") } : {}),
      ...(params.has("baseRent") ? { baseRent: params.get("baseRent") } : {}),
      ...(params.has("rentAmount") ? { rentAmount: params.get("rentAmount") } : {}),
      ...(params.has("depositAmount") ? { depositAmount: params.get("depositAmount") } : {}),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     Optional: formId from URL
  ============================ */
  useEffect(() => {
    const fid = params.get("formId");
    if (fid) setFormId(fid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     Invite Link Validation
     ✅ pulls formId + srNo + prefill
  ============================ */
  useEffect(() => {
    const token = params.get("inv");
    if (!token) return;

    setInviteToken(token);

    (async () => {
      try {
        const r = await axios.get(`${API}/invites/${token}`);

        const fid = r.data?.formId || r.data?.form?._id;
        if (fid) setFormId(String(fid));

        // Prefill from invite
        if (r.data?.ok && r.data.prefill) {
          const pre = { ...r.data.prefill };
          if (pre.category == null) delete pre.category; // prevent null overwrite

          setFormData((prev) => ({
            ...prev,
            ...pre,
          }));
        }

        // If backend sends existing form data too (optional)
        if (r.data?.form) {
          const existing = { ...r.data.form };
          delete existing._id;
          delete existing.__v;

          setFormData((prev) => ({
            ...prev,
            ...existing,
          }));
        }
      } catch (err) {
        const code = err?.response?.status;
        if (code === 409) setInviteError("This link has already been used.");
        else if (code === 410) setInviteError("This link has expired.");
        else if (code === 404) setInviteError("Invalid invite link.");
        else setInviteError("Could not validate invite link.");

        console.warn("Invite validation failed.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     (Optional) SR No preview for admin-only pages
     Tenant links should already have srNo from invite.
  ============================ */
  const fetchSrNo = async () => {
    try {
      const res = await axios.get(`${API}/forms/count`);
      setFormData((prev) => ({ ...prev, srNo: res.data.nextSrNo }));
      return res.data.nextSrNo;
    } catch (err) {
      console.error("Error fetching Sr No:", err);
      return "";
    }
  };

  useEffect(() => {
    // Only fetch srNo preview when NOT tenant link
    if (!params.get("inv")) fetchSrNo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     Input Handlers
  ============================ */
  const lockedFields = [
    "category",
    "name",
    "phoneNo",
    "roomNo",
    "bedNo",
    "baseRent",
    "rentAmount",
    "depositAmount",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ tenants should never change these
    if (isTenant && lockedFields.includes(name)) return;

    // ✅ lock only if field already has value
    if (isLocked && lockedFields.includes(name) && String(formData[name] || "").trim() !== "") {
      return;
    }

    if (name === "phoneNo" || name === "relative1Phone" || name === "relative2Phone") {
      const onlyDigits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: onlyDigits }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRentAmountChange = (e) => {
    if (isTenant || isLocked) return;
    const v = e.target.value;
    if (v === "" || /^\d+(\.\d{0,2})?$/.test(v)) {
      setFormData((prev) => ({ ...prev, rentAmount: v }));
    }
  };

  /* ===========================
     Remove Doc
  ============================ */
  const removeDoc = (idx) => setDocFiles((prev) => prev.filter((_, i) => i !== idx));

  /* ===========================
     Sanitize Payload
  ============================ */
  function sanitizeTenantPayload(obj) {
    const out = {};

    for (const [k, v] of Object.entries(obj || {})) {
      if (v === "" || v == null) continue;

      if (/(amount|price|rent|deposit|srNo)$/i.test(k)) {
        const n = Number(String(v).replace(/[,₹\s]/g, ""));
        if (Number.isFinite(n)) out[k] = n;
        continue;
      }

      if (/(date|dob|joining)/i.test(k)) {
        out[k] = v;
        continue;
      }

      out[k] = v;
    }

    return out;
  }

  /* ===========================
     Upload Docs
  ============================ */
  async function uploadDocsIfAny(docs) {
    if (!docs.length) return [];

    const fd = new FormData();
    docs.forEach((d) => fd.append("documents", d.file));

    const up = await axios.post(`${API}/uploads/docs`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const uploadedFiles = up.data?.files || [];
    return uploadedFiles.map((f, i) => ({
      fileName: docs[i]?.file?.name || f.filename || `doc-${i + 1}`,
      relation: docs[i]?.relation || "Self",
      url:
        f.url ||
        f.path ||
        f.location ||
        f.secure_url ||
        (f._id ? `${API}/documents/${f._id}` : "#"),
    }));
  }

  /* ===========================
     ✅ UPDATE ONLY (NO CREATE)
     Uses your existing route: PUT /api/update/:id (updateProfile)
  ============================ */
  async function submitUpdateOnly(payload) {
    if (!formId) throw new Error("Missing formId. Invite must be linked to a draft form.");

    // Safety: never allow these to be updated from tenant intake
    delete payload.srNo;
    delete payload.category;
    delete payload.roomNo;
    delete payload.bedNo;

    // ✅ IMPORTANT: use your existing backend update route
    return await axios.put(`${API}/update/${formId}`, payload);
  }

  /* ===========================
     SUBMIT FORM
  ============================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);

    try {
      if (!inviteToken) {
        alert("Invite token missing. Please open the original invite link.");
        return;
      }

      if (!formId) {
        alert("formId missing. Admin invite must create & link a draft form.");
        return;
      }

      if (!formData.category?.trim()) return alert("Category is required");
      if (!formData.name?.trim()) return alert("Name is required");
      if (!formData.joiningDate) return alert("Joining Date is required");
      if (!formData.address?.trim()) return alert("Address is required");

      if (formData.phoneNo && !/^\d{10}$/.test(formData.phoneNo))
        return alert("Enter valid 10-digit phone number.");

      if (formData.relative1Phone && !/^\d{10}$/.test(formData.relative1Phone))
        return alert("Relative 1 phone must be 10 digits.");

      if (formData.relative2Phone && !/^\d{10}$/.test(formData.relative2Phone))
        return alert("Relative 2 phone must be 10 digits.");

      const documents = await uploadDocsIfAny([...docFiles]);

      const raw = {
        ...formData,
        relativeAddress1: formData.relativeAddress,
        documents,
        source: "public-intake",
        status: "pending_review",
        inviteToken,
      };
      delete raw.relativeAddress;

      const payload = sanitizeTenantPayload(raw);

      console.log("SUBMIT PAYLOAD =>", {
        formId,
        category: payload.category,
        roomNo: payload.roomNo,
        bedNo: payload.bedNo,
      });
await axios.put(`${API}/invites/${inviteToken}/submit`, payload);


      if (isTenant) navigate("/form-submitted");
      else navigate("/add-data");
    } catch (error) {
      console.error("Error submitting form:", error);

      console.log("FAILED URL =>", error?.config?.url);
      console.log("STATUS =>", error?.response?.status);
      console.log("RESP =>", error?.response?.data);
      console.log("RESP JSON =>", JSON.stringify(error?.response?.data, null, 2));
      console.log("formId =>", formId);

      alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error.message ||
          "Failed to submit"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ===========================
     RENDER UI
  ============================ */
  return (
    <>
      <h2>Tenant Form</h2>

      {inviteError && (
        <div className="alert alert-danger" role="alert">
          {inviteError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-container">
        {/* Sr No */}
        <div className="form-group">
          <label>Sr No.</label>
          <input type="text" value={formData.srNo} readOnly className="form-input" />
        </div>

        {/* NAME */}
        <div className="form-group">
          <label>Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            readOnly={isTenant || isLocked}
          />
        </div>

        {/* PHONE */}
        <div className="form-group">
          <label>Phone No</label>
          <input
            name="phoneNo"
            value={formData.phoneNo}
            onChange={handleChange}
            className="form-input"
            readOnly={isTenant || isLocked}
          />
        </div>

        {/* ADDRESS */}
        <div className="form-group">
          <label>Address</label>
          <input name="address" value={formData.address} onChange={handleChange} className="form-input" />
        </div>

        {/* JOINING */}
        <div className="form-group">
          <label>Joining Date</label>
          <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="form-input" />
        </div>

        {/* DOB */}
        <div className="form-group">
          <label>DOB</label>
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="form-input" />
        </div>

        {/* RELATIVE ADDRESS */}
        <div className="form-group">
          <label>Relative Address</label>
          <input name="relativeAddress" value={formData.relativeAddress} onChange={handleChange} className="form-input" />
        </div>

        {/* RELATIVE 1 */}
        <fieldset className="form-group">
          <legend>Relative 1</legend>
          <select name="relative1Relation" value={formData.relative1Relation} onChange={handleChange} className="form-input">
            {["Self", "Sister", "Brother", "Father", "Husband", "Mother"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <input name="relative1Name" value={formData.relative1Name} onChange={handleChange} className="form-input" placeholder="Name" />
          <input name="relative1Phone" value={formData.relative1Phone} onChange={handleChange} className="form-input" placeholder="10 digit" />
        </fieldset>

        {/* RELATIVE 2 */}
        <fieldset className="form-group">
          <legend>Relative 2</legend>
          <select name="relative2Relation" value={formData.relative2Relation} onChange={handleChange} className="form-input">
            {["Self", "Sister", "Brother", "Father", "Husband", "Mother"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <input name="relative2Name" value={formData.relative2Name} onChange={handleChange} className="form-input" placeholder="Name" />
          <input name="relative2Phone" value={formData.relative2Phone} onChange={handleChange} className="form-input" placeholder="10 digit" />
        </fieldset>

        {/* COMPANY */}
        <div className="form-group">
          <label>Company / College</label>
          <input name="companyAddress" value={formData.companyAddress} onChange={handleChange} className="form-input" />
        </div>

        {/* JOINING COLLEGE */}
        <div className="form-group">
          <label>Date of Joining College/Office</label>
          <input
            type="date"
            name="dateOfJoiningCollege"
            value={formData.dateOfJoiningCollege}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {/* Category (Admin only) */}
        {!isTenant && (
          <div className="form-group">
            <label>Category</label>
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input"
              readOnly={isLocked}
            />
          </div>
        )}

        {/* ROOM */}
        <div className="form-group">
          <label>Room No</label>
          <input
            name="roomNo"
            value={formData.roomNo}
            onChange={handleChange}
            className="form-input"
            readOnly={isTenant || isLocked}
          />
        </div>

        {/* BED */}
        <div className="form-group">
          <label>Bed No</label>
          <input
            name="bedNo"
            value={formData.bedNo}
            onChange={handleChange}
            className="form-input"
            readOnly={isTenant || isLocked}
          />
        </div>

        {/* RENT */}
        <div className="form-group">
          <label>Rent Amount</label>
          <input
            name="rentAmount"
            value={formData.rentAmount}
            onChange={handleRentAmountChange}
            className="form-input"
            readOnly={isTenant || isLocked}
          />
        </div>

        {/* DEPOSIT */}
        <div className="form-group">
          <label>Deposit Amount</label>
          <input
            name="depositAmount"
            value={formData.depositAmount}
            onChange={(e) => {
              if (isTenant || isLocked) return;
              const v = e.target.value;
              if (v === "" || /^\d+(\.\d{0,2})?$/.test(v)) {
                setFormData((prev) => ({ ...prev, depositAmount: v }));
              }
            }}
            className="form-input"
            readOnly={isTenant || isLocked}
          />
        </div>

        {/* DOCUMENT UPLOADS */}
        <div className="form-group">
          <label>Upload Aadhaar & Photograph</label>

          {/* Self Aadhaar */}
          <div>
            <label>Self Aadhaar Card</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="form-input"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelfAadharFile(file);
                setDocFiles((prev) => {
                  const filtered = prev.filter((d) => d.role !== "selfAadhar");
                  if (!file) return filtered;
                  return [...filtered, { file, relation: "Self Aadhaar Card", role: "selfAadhar" }];
                });
              }}
            />
            {selfAadharFile && <small className="text-muted">{selfAadharFile.name}</small>}
          </div>

          {/* Parent Aadhaar */}
          <div>
            <label>Parent Aadhaar Card</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="form-input"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setParentAadharFile(file);
                setDocFiles((prev) => {
                  const filtered = prev.filter((d) => d.role !== "parentAadhar");
                  if (!file) return filtered;
                  return [...filtered, { file, relation: "Parent Aadhaar Card", role: "parentAadhar" }];
                });
              }}
            />
            {parentAadharFile && <small className="text-muted">{parentAadharFile.name}</small>}
          </div>

          {/* Photo */}
          <div>
            <label>Tenant Photograph</label>
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="form-input"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setPhotoFile(file);
                setDocFiles((prev) => {
                  const filtered = prev.filter((d) => d.role !== "photo");
                  if (!file) return filtered;
                  return [...filtered, { file, relation: "Tenant Photo", role: "photo" }];
                });
              }}
            />
            {photoFile && <small className="text-muted">{photoFile.name}</small>}
          </div>

          {docMsg && <small className="text-danger mt-1 d-block">{docMsg}</small>}
        </div>

        {/* Uploaded list */}
        {docFiles.length > 0 && (
          <div className="form-group">
            <ul>
              {docFiles.map((d, i) => (
                <li key={i} className="doc-row">
                  {d.relation}: {d.file.name} ({Math.ceil(d.file.size / 1024)} KB)
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm ml-2"
                    onClick={() => {
                      if (d.role === "selfAadhar") setSelfAadharFile(null);
                      if (d.role === "parentAadhar") setParentAadharFile(null);
                      if (d.role === "photo") setPhotoFile(null);
                      removeDoc(i);
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </button>

        {!isTenant && (
          <button type="button" className="back-btn" onClick={() => navigate("/mainpage")}>
            Back
          </button>
        )}
      </form>
    </>
  );
}

export default TenantIntake;
