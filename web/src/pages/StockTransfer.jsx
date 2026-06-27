import { useEffect, useState } from 'react';
import { getStock, transferStock, getMovements } from '../api/stock.api';
import { getStyles } from '../api/style.api';

export default function StockTransfer() {
  const [stock, setStock] = useState([]);
  const [styles, setStyles] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState({ styleId: '', fromLoc: 'factory', toLoc: 'dispatch', quantity: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = async () => {
    const [s, st, m] = await Promise.all([getStock(), getStyles(), getMovements()]);
    setStock(s.data);
    setStyles(st.data);
    setMovements(m.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const getAvailable = () => {
    if (!form.styleId || !form.fromLoc) return null;
    const item = stock.find(s => s.styleId?._id === form.styleId && s.location === form.fromLoc);
    return item?.quantity ?? 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await transferStock({ ...form, quantity: Number(form.quantity) });
      setSuccess('Transfer completed successfully!');
      setForm(f => ({ ...f, quantity: '' }));
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const stockByLoc = { factory: [], dispatch: [] };
  stock.forEach(item => { stockByLoc[item.location]?.push(item); });

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Stock Transfer</h2>
      </div>

      <div className="two-col">
        <div>
          <div className="section-title">Transfer Stock</div>
          <div className="card">
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <div className="form-group">
                <label>Style</label>
                <select value={form.styleId} onChange={e => setForm(f => ({ ...f, styleId: e.target.value }))} required>
                  <option value="">Select style...</option>
                  {styles.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>From</label>
                  <select value={form.fromLoc} onChange={e => setForm(f => ({ ...f, fromLoc: e.target.value }))}>
                    <option value="factory">Factory</option>
                    <option value="dispatch">Dispatch</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>To</label>
                  <select value={form.toLoc} onChange={e => setForm(f => ({ ...f, toLoc: e.target.value }))}>
                    <option value="dispatch">Dispatch</option>
                    <option value="factory">Factory</option>
                  </select>
                </div>
              </div>
              {form.styleId && (
                <div className="available-hint">Available: <strong>{getAvailable()}</strong> pcs</div>
              )}
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Enter quantity" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>{submitting ? 'Transferring...' : 'Transfer Stock'}</button>
            </form>
          </div>
        </div>

        <div>
          <div className="section-title">Current Stock</div>
          <div className="card">
            <div className="stock-section-label">Factory Store</div>
            {stockByLoc.factory.length === 0 ? <p className="empty-state">No factory stock</p> : (
              stockByLoc.factory.map(item => (
                <div key={item._id} className="stock-row">
                  <span>{item.styleId?.name}</span>
                  <span className="badge">{item.styleId?.code}</span>
                  <strong>{item.quantity} pcs</strong>
                </div>
              ))
            )}
            <div className="stock-section-label" style={{ marginTop: '1rem' }}>Dispatch</div>
            {stockByLoc.dispatch.length === 0 ? <p className="empty-state">No dispatch stock</p> : (
              stockByLoc.dispatch.map(item => (
                <div key={item._id} className="stock-row">
                  <span>{item.styleId?.name}</span>
                  <span className="badge">{item.styleId?.code}</span>
                  <strong>{item.quantity} pcs</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: '2rem' }}>Movement History</div>
      <div className="table-card">
        <table className="table">
          <thead><tr><th>Type</th><th>Style</th><th>From</th><th>To</th><th>Qty</th><th>By</th><th>Time</th></tr></thead>
          <tbody>
            {movements.map(m => (
              <tr key={m._id}>
                <td><span className={`badge badge--${m.type}`}>{m.type}</span></td>
                <td>{m.styleId?.name}</td>
                <td>{m.fromLoc || '—'}</td>
                <td>{m.toLoc || '—'}</td>
                <td>{m.quantity}</td>
                <td>{m.doneBy?.name}</td>
                <td>{new Date(m.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {movements.length === 0 && <tr><td colSpan={7} className="empty-state">No movements yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
