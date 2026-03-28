import React, { useEffect, useState } from 'react';
import { adminAPI } from '../api/client';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('overview'); // 'overview' | 'users'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      adminAPI.stats(),
      adminAPI.users({ page, limit: 15 }),
    ])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data.data);
        setUsers(usersRes.data.data);
        setPagination(usersRes.data.pagination);
      })
      .catch(() => showToast('Failed to load admin data', 'error'))
      .finally(() => setLoading(false));
  }, [page]);

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await adminAPI.updateRole(user.id, newRole);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
      showToast(`${user.username} is now ${newRole}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleStatusToggle = async (user) => {
    try {
      const res = await adminAPI.toggleStatus(user.id);
      const updated = res.data.data;
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: updated.isActive } : u));
      showToast(`${user.username} ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  if (loading) return <div className={styles.loading}>Loading admin panel…</div>;

  const byStatus = stats?.tasksByStatus || {};

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>{toast.msg}</div>
      )}

      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.sub}>Platform management & analytics</p>
        </div>
        <span className={styles.adminBadge}>⬡ ADMIN</span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'overview' ? styles.activeTab : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`${styles.tab} ${tab === 'users' ? styles.activeTab : ''}`} onClick={() => setTab('users')}>Users ({pagination?.total ?? '…'})</button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className={styles.animate}>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statVal} style={{ color: 'var(--accent)' }}>{stats?.totalUsers ?? 0}</div>
              <div className={styles.statLabel}>Total Users</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal} style={{ color: 'var(--blue)' }}>{stats?.totalTasks ?? 0}</div>
              <div className={styles.statLabel}>Total Tasks</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal} style={{ color: 'var(--green)' }}>{byStatus.DONE ?? 0}</div>
              <div className={styles.statLabel}>Completed</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal} style={{ color: 'var(--yellow)' }}>{byStatus.IN_PROGRESS ?? 0}</div>
              <div className={styles.statLabel}>In Progress</div>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Recent Registrations</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Username</th><th>Email</th><th>Role</th><th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentUsers || []).map((u) => (
                  <tr key={u.id}>
                    <td><span className={styles.uname}>{u.username}</span></td>
                    <td><span className={styles.email}>{u.email}</span></td>
                    <td>
                      <span className={`${styles.roleBadge} ${u.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className={styles.date}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className={styles.animate}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>All Users</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Tasks</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><span className={styles.uname}>{u.username}</span></td>
                    <td><span className={styles.email}>{u.email}</span></td>
                    <td>
                      <span className={`${styles.roleBadge} ${u.role === 'ADMIN' ? styles.roleAdmin : styles.roleUser}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusDot} ${u.isActive ? styles.active : styles.inactive}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={styles.taskCount}>{u._count?.tasks ?? 0}</td>
                    <td>
                      <div className={styles.actionRow}>
                        <button className={styles.actionBtn} onClick={() => handleRoleToggle(u)}>
                          {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        <button
                          className={`${styles.actionBtn} ${u.isActive ? styles.deactivateBtn : styles.activateBtn}`}
                          onClick={() => handleStatusToggle(u)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>← Prev</button>
                <span className={styles.pageInfo}>Page {pagination.page} of {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Next →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
