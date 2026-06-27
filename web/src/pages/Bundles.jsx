import { useEffect, useState, useCallback } from 'react';
import { getBundles, createBundle, getBundleHistory, getBundleQRCode } from '../api/bundle.api';
import { getStyles } from '../api/style.api';

const STAGES = ['cutting', 'stitching', 'finishing', 'packing'];
const STATUS_COLORS = { wip: '#f59e0b', packed: '#10b981' };
const STAGE_COLORS = { cutting: '#3b82f6', stitching: '#8b5cf6', finishing: '#f59e0b', packing: '#10b981' };

export default function Bundles() {
  const [bundles, setBundles] = useState([]);
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [historyBundle, setHistoryBundle] = useState(null);
  const [history, setHistory] = useState([]);
  const [qrBundle, setQrBundle] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [form, setForm] = useState({ bundleId: '', styleId: '', quantity: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', stage: '' });

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.stage) params.stage = filter.stage;
      const res = await getBundles(params);
      setBundles(res.data);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { getStyles().then(r => setStyles(r.data)); }, []);
  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createBundle({ ...form, quantity: Number(form.quantity) });
      setShowCreate(false);
      setForm({ bundleId: '', styleId: '', quantity: '' });
      fetchBundles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bundle');
    } finally {
      setSubmitting(false);
    }
  };

  const viewHistory = async (bundle) => {
    setHistoryBundle(bundle);
    try {
      const res = await getBundleHistory(bundle.bundleId);
      setHistory(res.data);
    } catch { setHistory([]); }
  };

  const viewQR = async (bundle) => {
    setQrBundle(bundle);
    setQrUrl(null);
    setQrLoading(true);
    try {
      const url = await getBundleQRCode(bundle.bundleId);
      setQrUrl(url);
    } catch {
      setQrUrl(null);
    } finally {
      setQrLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrUrl || !qrBundle) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `${qrBundle.bundleId}-qrcode.png`;
    a.click();
  };

  const closeQR = () => {
    if (qrUrl) URL.revokeObjectURL(qrUrl);
    setQrBundle(null);
    setQrUrl(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Bundles</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Bundle</button>
      </div>

      <div className="filters">
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="wip">WIP</option>
          <option value="packed">Packed</option>
        </select>
        <select value={filter.stage} onChange={e => setFilter(f => ({ ...f, stage: e.target.value }))}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Bundle ID</th><th>Style</th><th>Qty</th>
                <th>Stage</th><th>Status</th><th>Created</th>
                <th>QR</th><th>History</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map(b => (
                <tr key={b._id}>
                  <td><strong style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{b.bundleId}</strong></td>
                  <td>{b.styleId?.name} <span className="badge">{b.styleId?.code}</span></td>
                  <td>{b.quantity}</td>
                  <td>
                    <span className="stage-badge" style={{
                      backgroundColor: STAGE_COLORS[b.currentStage] + '22',
                      color: STAGE_COLORS[b.currentStage],
                      border: `1px solid ${STAGE_COLORS[b.currentStage]}`
                    }}>{b.currentStage}</span>
                  </td>
                  <td>
                    <span className="stage-badge" style={{
                      backgroundColor: STATUS_COLORS[b.status] + '22',
                      color: STATUS_COLORS[b.status],
                      border: `1px solid ${STATUS_COLORS[b.status]}`
                    }}>{b.status}</span>
                  </td>
                  <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-link" onClick={() => viewQR(b)}>QR Code</button>
                  </td>
                  <td>
                    <button className="btn-link" onClick={() => viewHistory(b)}>History</button>
                  </td>
                </tr>
              ))}
              {bundles.length === 0 && (
                <tr><td colSpan={8} className="empty-state">No bundles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Bundle Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Bundle</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Bundle ID *</label>
                <input
                  value={form.bundleId}
                  onChange={e => setForm(f => ({ ...f, bundleId: e.target.value.toUpperCase() }))}
                  placeholder="CK001-B004"
                  required
                />
              </div>
              <div className="form-group">
                <label>Style *</label>
                <select value={form.styleId} onChange={e => setForm(f => ({ ...f, styleId: e.target.value }))} required>
                  <option value="">Select style...</option>
                  {styles.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number" min="1"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="50"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrBundle && (
        <div className="modal-overlay" onClick={closeQR}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h3>QR Code</h3>
              <button className="modal-close" onClick={closeQR}>×</button>
            </div>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{
                  fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem',
                  background: '#f1f5f9', padding: '6px 14px', borderRadius: 6,
                  letterSpacing: '1px', color: '#0f172a'
                }}>
                  {qrBundle.bundleId}
                </span>
              </div>

              {qrLoading && (
                <div style={{ padding: '40px 0' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              )}

              {qrUrl && (
                <>
                  <div style={{
                    border: '1px solid #e2e8f0', borderRadius: 12, padding: 16,
                    display: 'inline-block', background: '#fff', marginBottom: 16
                  }}>
                    <img src={qrUrl} alt={`QR code for ${qrBundle.bundleId}`} width={240} height={240} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 16 }}>
                    {qrBundle.styleId?.name} · {qrBundle.quantity} pcs ·{' '}
                    <span style={{ textTransform: 'capitalize' }}>{qrBundle.currentStage}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={downloadQR}>
                      ↓ Download PNG
                    </button>
                    <button className="btn btn-outline" onClick={() => window.print()}>
                      Print
                    </button>
                  </div>
                </>
              )}

              {!qrLoading && !qrUrl && (
                <div className="alert alert-error">Failed to load QR code</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyBundle && (
        <div className="modal-overlay" onClick={() => setHistoryBundle(null)}>
          <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>History: {historyBundle.bundleId}</h3>
              <button className="modal-close" onClick={() => setHistoryBundle(null)}>×</button>
            </div>
            {history.length === 0 ? (
              <p className="empty-state">No transitions logged yet</p>
            ) : (
              <div className="timeline">
                {history.map(t => (
                  <div key={t._id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-title">{t.fromStage} → <strong>{t.toStage}</strong></div>
                      <div className="timeline-meta">By {t.operatorId?.name} · {new Date(t.timestamp).toLocaleString()}</div>
                      {t.notes && <div className="timeline-notes">{t.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
