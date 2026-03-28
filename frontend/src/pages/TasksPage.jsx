import React, { useEffect, useState, useCallback } from 'react';
import { tasksAPI } from '../api/client';
import styles from './TasksPage.module.css';

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_COLOR = { TODO:'blue', IN_PROGRESS:'yellow', DONE:'green', CANCELLED:'red' };
const PRIORITY_COLOR = { LOW:'text3', MEDIUM:'blue', HIGH:'yellow', URGENT:'red' };

const EMPTY_FORM = { title:'', description:'', status:'TODO', priority:'MEDIUM', dueDate:'' };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page:1, limit:10, status:'', priority:'', search:'' });
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''));
      const res = await tasksAPI.list(params);
      setTasks(res.data.data);
      setPagination(res.data.pagination);
    } catch { showToast('Failed to load tasks', 'error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditTask(null); setModal('create'); };
  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0,10) : '',
    });
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditTask(null); };

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, dueDate: form.dueDate || null };
      if (modal === 'create') {
        await tasksAPI.create(payload);
        showToast('Task created!');
      } else {
        await tasksAPI.update(editTask.id, payload);
        showToast('Task updated!');
      }
      closeModal();
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await tasksAPI.delete(id);
      showToast('Task deleted');
      setDeleteId(null);
      fetchTasks();
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await tasksAPI.updateStatus(id, status);
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    } catch { showToast('Failed to update status', 'error'); }
  };

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val, page: 1 }));

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.sub}>{pagination?.total ?? '…'} total tasks</p>
        </div>
        <button className={styles.createBtn} onClick={openCreate}>+ New Task</button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input className={styles.searchInput} placeholder="Search tasks…"
          value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={styles.select}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} className={styles.select}>
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className={styles.loadingText}>Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <p>No tasks found.</p>
          <button className={styles.createBtn} onClick={openCreate}>Create your first task</button>
        </div>
      ) : (
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskTop}>
                <div className={styles.taskTitle}>{task.title}</div>
                <div className={styles.taskActions}>
                  <button className={styles.editBtn} onClick={() => openEdit(task)}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => setDeleteId(task.id)}>Delete</button>
                </div>
              </div>
              {task.description && (
                <p className={styles.taskDesc}>{task.description}</p>
              )}
              <div className={styles.taskMeta}>
                <select
                  className={`${styles.statusSelect} ${styles[`statusSelect_${STATUS_COLOR[task.status]}`]}`}
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
                <span className={`${styles.chip} ${styles[`chip_${PRIORITY_COLOR[task.priority]}`]}`}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className={styles.due}>
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span className={styles.created}>
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={filters.page <= 1} onClick={() => setFilter('page', filters.page - 1)} className={styles.pageBtn}>← Prev</button>
          <span className={styles.pageInfo}>Page {pagination.page} of {pagination.totalPages}</span>
          <button disabled={filters.page >= pagination.totalPages} onClick={() => setFilter('page', filters.page + 1)} className={styles.pageBtn}>Next →</button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{modal === 'create' ? 'New Task' : 'Edit Task'}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSave} className={styles.modalForm}>
              <div className={styles.field}>
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleFormChange} required placeholder="Task title" />
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Optional description" rows={3} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleFormChange}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Priority</label>
                  <select name="priority" value={form.priority} onChange={handleFormChange}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label>Due Date</label>
                <input name="dueDate" type="date" value={form.dueDate} onChange={handleFormChange} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Saving…' : modal === 'create' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className={styles.overlay} onClick={() => setDeleteId(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete Task?</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className={styles.dangerBtn} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
