import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Override form states
  const [overrideStudentId, setOverrideStudentId] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    name: '',
    class: 'Grade 5-A',
    dob: ''
  });

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/admin/approvals', { headers });
      setApprovals(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending approvals.');
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerifyDirect = async (studentId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/admin/approvals/${studentId}/verify`, {}, { headers });
      setSuccess('Student KYC verified and marked active successfully!');
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverride = (student) => {
    setOverrideStudentId(student.id);
    // Format DOB to YYYY-MM-DD
    let dobVal = '';
    if (student.dob) {
      try {
        dobVal = new Date(student.dob).toISOString().split('T')[0];
      } catch (e) {
        dobVal = '';
      }
    }
    setOverrideForm({
      name: student.name,
      class: student.class,
      dob: dobVal
    });
    setSuccess(null);
    setError(null);
  };

  const handleCloseOverride = () => {
    setOverrideStudentId(null);
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/admin/approvals/${overrideStudentId}/override`, overrideForm, { headers });
      setSuccess('Student profile manually corrected and KYC verified successfully!');
      setOverrideStudentId(null);
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.error || 'Override submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const isNameMismatched = (name1, name2) => {
    if (!name1 || !name2) return true;
    return name1.toLowerCase().replace(/[^a-z0-9]/g, '') !== name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const isDobMismatched = (dob1, dob2) => {
    if (!dob1 || !dob2) return true;
    try {
      return new Date(dob1).toDateString() !== new Date(dob2).toDateString();
    } catch (e) {
      return true;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="glass-panel" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Pending Identity & Document Approvals</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
          Review minor details submitted by parents alongside automated OCR extraction data.
        </p>

        {approvals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            No pending KYC approvals found. All students are currently active.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {approvals.map(student => {
              const kyc = student.kycRecord;
              const nameMismatch = kyc ? isNameMismatched(student.name, kyc.ocrData?.name) : false;
              const dobMismatch = kyc ? isDobMismatched(student.dob, kyc.ocrData?.dob) : false;
              const isOverridingThis = overrideStudentId === student.id;

              return (
                <div 
                  key={student.id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '24px', 
                    background: 'rgba(255,255,255,0.01)', 
                    border: student.ocrFlagged ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid var(--glass-border)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '15px' }}>
                    
                    {/* Student & Guardian Info */}
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', marginBottom: '8px', display: 'inline-block' }}>
                        Student #{student.id} ({student.class})
                      </span>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{student.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Parent:</strong> {student.guardian?.name} ({student.guardian?.mobile})
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <strong>Doc Type:</strong> <span style={{ textTransform: 'uppercase' }}>{kyc?.docType}</span> | <strong>Doc Ref (Masked):</strong> {kyc?.docRef || 'None'}
                      </p>
                    </div>

                    {/* Mismatch Indicators */}
                    {kyc && (
                      <div style={{ flex: 1, minWidth: '250px', background: 'rgba(0,0,0,0.15)', padding: '15px', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 'bold', display: 'block', color: student.ocrFlagged ? 'var(--error)' : 'var(--success)', marginBottom: '8px' }}>
                          {student.ocrFlagged ? '⚠️ AUTOMATED OCR ALERT: MISMATCH DETECTED' : '✅ AUTOMATED OCR: OK'}
                        </span>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Form Input:</span>
                            <div style={{ color: nameMismatch ? 'var(--error)' : 'var(--success)' }}>
                              <strong>Name:</strong> {student.name}
                            </div>
                            <div style={{ color: dobMismatch ? 'var(--error)' : 'var(--success)' }}>
                              <strong>DOB:</strong> {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <div style={{ paddingLeft: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)', display: 'block' }}>OCR Detected:</span>
                            <div style={{ color: nameMismatch ? 'var(--error)' : 'var(--success)' }}>
                              <strong>Name:</strong> {kyc.ocrData?.name || 'N/A'}
                            </div>
                            <div style={{ color: dobMismatch ? 'var(--error)' : 'var(--success)' }}>
                              <strong>DOB:</strong> {kyc.ocrData?.dob ? new Date(kyc.ocrData.dob).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {!isOverridingThis && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
                        <button 
                          className="btn" 
                          style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                          onClick={() => handleVerifyDirect(student.id)}
                          disabled={loading}
                        >
                          Verify & Approve
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 16px', fontSize: '0.8rem', border: '1px dashed var(--secondary)' }}
                          onClick={() => handleOpenOverride(student)}
                          disabled={loading}
                        >
                          Manual Override
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Manual Override Form */}
                  {isOverridingThis && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>
                        MANUAL CORRECTION OVERRIDE
                      </span>
                      
                      <form onSubmit={handleOverrideSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                          <div className="form-group">
                            <label className="form-label">Corrected Name</label>
                            <input
                              type="text"
                              required
                              className="form-input"
                              value={overrideForm.name}
                              onChange={(e) => setOverrideForm({ ...overrideForm, name: e.target.value })}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Corrected Class</label>
                            <select
                              className="form-input"
                              value={overrideForm.class}
                              onChange={(e) => setOverrideForm({ ...overrideForm, class: e.target.value })}
                              style={{ background: 'rgba(15, 23, 42, 0.8)' }}
                            >
                              <option value="Grade 1-A">Grade 1-A</option>
                              <option value="Grade 2-C">Grade 2-C</option>
                              <option value="Grade 5-A">Grade 5-A</option>
                              <option value="Grade 10-B">Grade 10-B</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Corrected Date of Birth</label>
                            <input
                              type="date"
                              required
                              className="form-input"
                              value={overrideForm.dob}
                              onChange={(e) => setOverrideForm({ ...overrideForm, dob: e.target.value })}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="submit" className="btn" disabled={loading} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                            {loading ? 'Submitting Override...' : 'Submit Correction & Approve'}
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={handleCloseOverride} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
