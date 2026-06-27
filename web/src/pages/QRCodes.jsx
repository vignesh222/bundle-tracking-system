import { useEffect, useState, useCallback } from 'react';
import { getBundles, getBundleQRCode } from '../api/bundle.api';

const STAGE_COLORS = {
  cutting: '#3b82f6',
  stitching: '#8b5cf6',
  finishing: '#f59e0b',
  packing: '#10b981',
};

function QRCard({ bundle }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoke;
    getBundleQRCode(bundle.bundleId)
      .then(url => { revoke = url; setQrUrl(url); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [bundle.bundleId]);

  const download = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `${bundle.bundleId}-qr.png`;
    a.click();
  };

  return (
    <div className="qr-card">
      <div className="qr-image-wrap">
        {loading && <div className="qr-placeholder"><div className="spinner" /></div>}
        {error && <div className="qr-placeholder qr-error">Failed</div>}
        {qrUrl && <img src={qrUrl} alt={bundle.bundleId} width={180} height={180} />}
      </div>

      <div className="qr-meta">
        <div className="qr-bundle-id">{bundle.bundleId}</div>
        <div className="qr-style">{bundle.styleId?.name} <span className="badge">{bundle.styleId?.code}</span></div>
        <div className="qr-row">
          <span
            className="stage-badge"
            style={{
              backgroundColor: STAGE_COLORS[bundle.currentStage] + '22',
              color: STAGE_COLORS[bundle.currentStage],
              border: `1px solid ${STAGE_COLORS[bundle.currentStage]}`,
            }}
          >
            {bundle.currentStage}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{bundle.quantity} pcs</span>
        </div>
      </div>

      <button className="btn btn-outline btn-sm qr-download-btn" onClick={download} disabled={!qrUrl}>
        Download PNG
      </button>
    </div>
  );
}

export default function QRCodes() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? { stage: filter } : {};
      const res = await getBundles(params);
      setBundles(res.data);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  const printAll = () => window.print();

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">QR Codes</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }}
          >
            <option value="">All Stages</option>
            {['cutting', 'stitching', 'finishing', 'packing'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button className="btn btn-outline" onClick={fetchBundles}>Refresh</button>
          <button className="btn btn-primary no-print" onClick={printAll}>Print All</button>
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : bundles.length === 0 ? (
        <div className="empty-state" style={{ padding: 60 }}>No bundles found</div>
      ) : (
        <div className="qr-grid">
          {bundles.map(b => <QRCard key={b._id} bundle={b} />)}
        </div>
      )}
    </div>
  );
}
