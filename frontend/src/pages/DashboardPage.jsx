import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../api/client';
import { Link } from 'react-router-dom';
import styles from './DashboardPage.module.css';

const STATUS_COLOR = {
  TODO: 'blue', IN_PROGRESS: 'yellow', DONE: 'green', CANCELLED: 'red',
};
const PRIORITY_COLOR = {
  LOW: 'text3', MEDIUM: 'blue', HIGH: 'yellow', URGENT: 'red',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksAPI.stats()
      .then((r) => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading dashboard…</div>;

  const byStatus = stats?.byStatus || {};
  const total = stats?.total || 0;
  const done = byStatus.DONE || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const statCards = [
    { label: 'Total Tasks', value: total, color: 'accent' },
    { label: 'Completed', value: done, color: 'green' },
    { label: 'In Progress', value: byStatus.IN_PROGRESS || 0, color: 'yellow' },
    { label: 'Completion', value: `${pct}%`, color: 'blue' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.greeting}>Good day, {user?.username} 👋</h1>
          <p className={styles.sub}>Here's what's happening with your tasks.</p>
        </div>
        <Link to="/tasks" className={styles.newTaskBtn}>+ New Task</Link>
      </div>

      {/* Stat Cards */}
      <div className={styles.statGrid}>
        {statCards.map((s) => (
          <div key={s.label} className={`${styles.statCard} ${styles[`color_${s.color}`]}`}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span>Overall Progress</span>
          <span className={styles.progressPct}>{pct}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.progressMeta}>{done} of {total} tasks completed</div>
      </div>

      {/* Status Breakdown + Recent Tasks */}
      <div className={styles.bottomGrid}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>By Status</h2>
          <div className={styles.statusList}>
            {['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'].map((s) => (
              <div key={s} className={styles.statusRow}>
                <span className={`${styles.dot} ${styles[`dot_${STATUS_COLOR[s]}`]}`} />
                <span className={styles.statusLabel}>{s.replace('_', ' ')}</span>
                <span className={styles.statusCount}>{byStatus[s] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitleRow}>
            <h2 className={styles.panelTitle}>Recent Tasks</h2>
            <Link to="/tasks" className={styles.viewAll}>View all →</Link>
          </div>
          <div className={styles.recentList}>
            {(stats?.recentTasks || []).length === 0 && (
              <p className={styles.empty}>No tasks yet. <Link to="/tasks">Create one!</Link></p>
            )}
            {(stats?.recentTasks || []).map((t) => (
              <div key={t.id} className={styles.recentItem}>
                <div className={styles.recentTitle}>{t.title}</div>
                <div className={styles.recentMeta}>
                  <span className={`${styles.chip} ${styles[`chip_${STATUS_COLOR[t.status]}`]}`}>{t.status.replace('_',' ')}</span>
                  <span className={`${styles.chip} ${styles[`chip_${PRIORITY_COLOR[t.priority]}`]}`}>{t.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
