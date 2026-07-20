import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Icon } from '../../components/Icon';
import { Card, PillButton, InputField, SelectField, Alert, StatusBadge, Eyebrow } from '../../components/ui/Primitives';

export default function FeeSetup() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // Form state
  const [form, setForm] = useState({
    name: '',
    amount: '',
    type: 'tuition',
    appliesTo: 'all',
    academicYearId: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Assign Fee Form State
  const [studentsList, setStudentsList] = useState([]);
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    feeStructureId: '',
    dueDate: ''
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [yearsRes, structuresRes, studentsRes] = await Promise.all([
        axios.get('/api/academic-years', { headers }),
        axios.get('/api/fees/structures', { headers }),
        axios.get('/api/admin/students', { headers })
      ]);

      setAcademicYears(yearsRes.data);
      setFeeStructures(structuresRes.data);
      setStudentsList(studentsRes.data);

      // Select default academic year if form is empty
      if (yearsRes.data.length > 0 && !form.academicYearId) {
        setForm(prev => ({ ...prev, academicYearId: yearsRes.data[0].id }));
      }

      // Select defaults for assignment form
      setAssignForm(prev => ({
        ...prev,
        studentId: prev.studentId || (studentsRes.data.length > 0 ? studentsRes.data[0].id.toString() : ''),
        feeStructureId: prev.feeStructureId || (structuresRes.data.length > 0 ? structuresRes.data[0].id.toString() : '')
      }));

    } catch (err) {
      console.error(err);
      setError('Failed to fetch fee structures, academic years, or student rosters.');
    }
  };

  const handleAssignChange = (e) => {
    setAssignForm({ ...assignForm, [e.target.name]: e.target.value });
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    setAssignError(null);
    setAssignSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (!assignForm.studentId || !assignForm.feeStructureId || !assignForm.dueDate) {
        throw new Error('Please select a student, a fee structure, and set a due date.');
      }

      await axios.post('/api/fees/assignments', {
        studentId: Number(assignForm.studentId),
        feeStructureId: Number(assignForm.feeStructureId),
        dueDate: assignForm.dueDate
      }, { headers });

      setAssignSuccess('Fee assigned successfully!');
      setAssignForm({
        studentId: '',
        feeStructureId: '',
        dueDate: ''
      });
    } catch (err) {
      setAssignError(err.response?.data?.error || err.message || 'Failed to assign fee.');
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (struct) => {
    setEditingId(struct.id);
    setForm({
      name: struct.name,
      amount: struct.amount,
      type: struct.type,
      appliesTo: struct.appliesTo,
      academicYearId: struct.academicYearId
    });
    setSuccess(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      name: '',
      amount: '',
      type: 'tuition',
      appliesTo: 'all',
      academicYearId: academicYears[0]?.id || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        // Update (creates new version under the hood)
        await axios.put(`/api/fees/structures/${editingId}`, {
          name: form.name,
          amount: Number(form.amount),
          appliesTo: form.appliesTo
        }, { headers });
        setSuccess('Fee structure updated successfully! A new version has been generated.');
        setEditingId(null);
      } else {
        // Create new
        await axios.post('/api/fees/structures', {
          name: form.name,
          amount: Number(form.amount),
          type: form.type,
          appliesTo: form.appliesTo,
          academicYearId: Number(form.academicYearId)
        }, { headers });
        setSuccess('New fee structure created successfully!');
      }

      // Reset form fields
      setForm({
        name: '',
        amount: '',
        type: 'tuition',
        appliesTo: 'all',
        academicYearId: academicYears[0]?.id || ''
      });

      // Reload
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save fee structure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-section-sm">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Eyebrow>Fee Engine</Eyebrow>
          <h1 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-ink-black leading-tight mt-2">
            Fee Structure & Assignments
          </h1>
          <p className="font-body text-body text-on-surface-variant mt-2 max-w-2xl">
            Define fee components, target scopes, and assign them directly to student ward profiles.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Column 1: Forms */}
        <div className="flex flex-col gap-8 lg:col-span-1">
          {/* CRUD Form */}
          <Card>
            <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">
              {editingId ? 'Edit Structure (Generates Version)' : 'Create Fee Structure'}
            </h2>
            <p className="font-body text-[14px] text-on-surface-variant mb-6">
              {editingId
                ? 'Modifying this structure will create a new audit version. Existing assignments will retain their version history.'
                : 'Define a new fee component and target scope linked to an academic year.'}
            </p>

            <Alert tone="error">{error}</Alert>
            <Alert tone="success">{success}</Alert>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <InputField
                label="Structure Name"
                name="name"
                id="fee-name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Tuition Fee - Class 10"
              />

              <SelectField
                label="Academic Year"
                name="academicYearId"
                id="fee-year"
                value={form.academicYearId}
                onChange={handleChange}
                disabled={editingId !== null}
              >
                {academicYears.map(year => (
                  <option key={year.id} value={year.id}>{year.label}</option>
                ))}
              </SelectField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Amount (INR)"
                  name="amount"
                  id="fee-amount"
                  type="number"
                  required
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                />

                <SelectField
                  label="Fee Type"
                  name="type"
                  id="fee-type"
                  value={form.type}
                  onChange={handleChange}
                  disabled={editingId !== null}
                >
                  <option value="tuition">Tuition</option>
                  <option value="transport">Transport</option>
                  <option value="late_fee">Late Fee</option>
                  <option value="other">Other</option>
                </SelectField>
              </div>

              <InputField
                label="Applies To (Target Class/Scope)"
                name="appliesTo"
                id="fee-applies"
                required
                value={form.appliesTo}
                onChange={handleChange}
                placeholder="e.g. class_10, all, transport_route_a"
              />

              <div className="flex gap-3 mt-1">
                <PillButton type="submit" disabled={loading}>
                  {loading ? 'Saving…' : editingId ? 'Update Structure' : 'Create Structure'}
                </PillButton>
                {editingId && (
                  <PillButton type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </PillButton>
                )}
              </div>
            </form>
          </Card>

          {/* Assign Fee Form */}
          <Card>
            <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">Assign Fee to Student</h2>
            <p className="font-body text-[14px] text-on-surface-variant mb-6">
              Assign a defined fee structure component directly to a student ward profile.
            </p>

            <Alert tone="error">{assignError}</Alert>
            <Alert tone="success">{assignSuccess}</Alert>

            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-5">
              <SelectField
                label="Select Student"
                name="studentId"
                id="assign-student"
                value={assignForm.studentId}
                onChange={handleAssignChange}
                required
              >
                <option value="" disabled>-- Choose a Student --</option>
                {studentsList.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.class})
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Select Fee Component"
                name="feeStructureId"
                id="assign-fee"
                value={assignForm.feeStructureId}
                onChange={handleAssignChange}
                required
              >
                <option value="" disabled>-- Choose a Fee Component --</option>
                {feeStructures.map(struct => (
                  <option key={struct.id} value={struct.id}>
                    {struct.name} (v{struct.version} - ₹{Number(struct.amount).toLocaleString('en-IN')})
                  </option>
                ))}
              </SelectField>

              <InputField
                label="Due Date"
                name="dueDate"
                id="assign-due"
                type="date"
                value={assignForm.dueDate}
                onChange={handleAssignChange}
                required
              />

              <PillButton type="submit" disabled={assignLoading} className="mt-1">
                {assignLoading ? 'Assigning…' : 'Assign Fee to Student'}
              </PillButton>
            </form>
          </Card>
        </div>

        {/* Version List Table */}
        <Card className="lg:col-span-2">
          <h2 className="font-headline-sm text-headline-sm text-ink-black mb-2">Active Fee Components</h2>
          <p className="font-body text-[14px] text-on-surface-variant mb-6">
            Registered fee structures and version records stored in the system.
          </p>

          {feeStructures.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant text-[14px]">
              No fee structures registered yet. Create one on the left.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-on-surface-variant font-eyebrow text-eyebrow uppercase tracking-wider">
                    <th className="p-3">Name</th>
                    <th className="p-3">Year</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Scope</th>
                    <th className="p-3">Version</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feeStructures.map(struct => (
                    <tr key={struct.id} className="border-b border-outline-variant/20">
                      <td className="p-3 font-medium text-ink-black">{struct.name}</td>
                      <td className="p-3 text-on-surface-variant">{struct.academicYear?.label || 'N/A'}</td>
                      <td className="p-3 font-medium text-ink-black">₹{Number(struct.amount).toLocaleString('en-IN')}</td>
                      <td className="p-3 capitalize text-on-surface-variant">{struct.type}</td>
                      <td className="p-3 font-mono text-[12px] text-on-surface-variant">{struct.appliesTo}</td>
                      <td className="p-3">
                        <StatusBadge tone="signal">v{struct.version}</StatusBadge>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-3 h-9 rounded-full border border-outline-variant text-ink-black text-[12px] hover:bg-surface-container-low transition-colors"
                          onClick={() => handleEditClick(struct)}
                        >
                          <Icon name="edit" className="text-[16px]" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
