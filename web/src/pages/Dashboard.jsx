import { useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboard.api';

const STAGES = ['cutting', 'stitching', 'finishing', 'packing'];
const STAGE_COLORS = {
  cutting: '#3b82f6',
  stitching: '#8b5cf6',
  finishing: '#f59e0b',
  packing: '#10b981',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;

  const wipMap = {};
  data.wipByStage.forEach(s => { wipMap[s._id] = s; });

  const stockByLoc = { factory: [], dispatch: [] };
  data.stockItems.forEach(item => {
    if (item.location === 'factory') stockByLoc.factory.push(item);
    else stockByLoc.dispatch.push(item);
  });

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <button className="btn btn-outline" onClick={() => { setLoading(true); fetchData(); }}>Refresh</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Bundles</div>
          <div className="stat-value">{data.totalBundles}</div>
        </div>
        <div className="stat-card stat-card--blue">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{data.wipBundles}</div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-label">Packed</div>
          <div className="stat-value">{data.packedBundles}</div>
        </div>
        <div className="stat-card stat-card--amber">
          <div className="stat-label">Styles</div>
          <div className="stat-value">{data.stockItems.length > 0 ? '3+' : '0'}</div>
        </div>
      </div>

      <div className="section-title">Work In Progress by Stage</div>
      <div className="stage-flow">
        {STAGES.map((stage, i) => {
          const s = wipMap[stage];
          return (
            <div key={stage} className="stage-card">
              {i > 0 && <div className="stage-arrow">→</div>}
              <div className="stage-card-inner" style={{ borderTopColor: STAGE_COLORS[stage] }}>
                <div className="stage-name" style={{ color: STAGE_COLORS[stage] }}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </div>
                <div className="stage-count">{s?.count || 0}</div>
                <div className="stage-sub">bundles</div>
                <div className="stage-qty">{s?.totalQty || 0} pcs</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="two-col">
        <div>
          <div className="section-title">Factory Stock</div>
          <div className="table-card">
            {stockByLoc.factory.length === 0 ? (
              <div className="empty-state">No factory stock</div>
            ) : (
              <table className="table">
                <thead><tr><th>Style</th><th>Code</th><th>Qty</th></tr></thead>
                <tbody>
                  {stockByLoc.factory.map(item => (
                    <tr key={item._id}>
                      <td>{item.styleId?.name}</td>
                      <td><span className="badge">{item.styleId?.code}</span></td>
                      <td><strong>{item.quantity}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div>
          <div className="section-title">Dispatch Stock</div>
          <div className="table-card">
            {stockByLoc.dispatch.length === 0 ? (
              <div className="empty-state">No dispatch stock</div>
            ) : (
              <table className="table">
                <thead><tr><th>Style</th><th>Code</th><th>Qty</th></tr></thead>
                <tbody>
                  {stockByLoc.dispatch.map(item => (
                    <tr key={item._id}>
                      <td>{item.styleId?.name}</td>
                      <td><span className="badge">{item.styleId?.code}</span></td>
                      <td><strong>{item.quantity}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {data.recentTransitions?.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: '2rem' }}>Recent Activity</div>
          <div className="table-card">
            <table className="table">
              <thead><tr><th>Bundle</th><th>Transition</th><th>Operator</th><th>Time</th></tr></thead>
              <tbody>
                {data.recentTransitions.map(t => (
                  <tr key={t._id}>
                    <td><strong>{t.bundleId?.bundleId}</strong></td>
                    <td>{t.fromStage} → {t.toStage}</td>
                    <td>{t.operatorId?.name}</td>
                    <td>{new Date(t.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
