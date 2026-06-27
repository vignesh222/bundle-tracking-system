import { useEffect, useState } from 'react';
import { getStyles, createStyle } from '../api/style.api';

export default function Styles() {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchStyles = async () => {
    try {
      const res = await getStyles();
      setStyles(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStyles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createStyle(form);
      setShowModal(false);
      setForm({ name: '', code: '', description: '' });
      fetchStyles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create style');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Styles / SKUs</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Style</button>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Code</th><th>Description</th><th>Created By</th><th>Date</th></tr>
            </thead>
            <tbody>
              {styles.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong></td>
                  <td><span className="badge">{s.code}</span></td>
                  <td>{s.description || '—'}</td>
                  <td>{s.createdBy?.name}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {styles.length === 0 && (
                <tr><td colSpan={5} className="empty-state">No styles yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Style / SKU</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Style Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Classic Kurta" required />
              </div>
              <div className="form-group">
                <label>SKU Code *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CK001" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Style'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
