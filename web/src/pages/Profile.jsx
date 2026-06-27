import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Profile</h2>
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="profile-info">
          <div className="profile-row"><span>Name</span><strong>{user?.name}</strong></div>
          <div className="profile-row"><span>Email</span><strong>{user?.email}</strong></div>
          <div className="profile-row"><span>Role</span><span className={`badge badge--${user?.role}`}>{user?.role}</span></div>
        </div>
      </div>
    </div>
  );
}
