import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState([]);
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]); setGlobalError('');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field) => errors.find((e) => e.field === field)?.message;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>⬡</span>
          <h1 className={styles.title}>Create account</h1>
          <p className={styles.subtitle}>Join TaskFlow today</p>
        </div>

        {globalError && <div className={styles.errorBox}>{globalError}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" value={form.username}
              onChange={handleChange} placeholder="johndoe" required autoFocus />
            {fieldError('username') && <span className={styles.fieldErr}>{fieldError('username')}</span>}
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
            {fieldError('email') && <span className={styles.fieldErr}>{fieldError('email')}</span>}
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={form.password}
              onChange={handleChange} placeholder="Min 8 chars, 1 uppercase, 1 number" required />
            {fieldError('password') && <span className={styles.fieldErr}>{fieldError('password')}</span>}
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
