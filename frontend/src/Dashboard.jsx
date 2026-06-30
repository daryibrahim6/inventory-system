import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Dashboard.css';

const API_URL = 'http://localhost:3001/api';

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat dashboard');
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton-grid">
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <div className="error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>{error}</p>
            <button onClick={fetchDashboard}>Coba Lagi</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p className="page-subtitle">Ringkasan inventaris Anda</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Item</span>
              <span className="stat-value">{dashboard.totalItems}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Kategori</span>
              <span className="stat-value">{dashboard.totalCategories}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fefce8', color: '#eab308' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Nilai Inventory</span>
              <span className="stat-value">Rp {dashboard.totalInventoryValue.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Transaksi Masuk</span>
              <span className="stat-value">{dashboard.monthlyTransactionsIn}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="7 23 3 19 7 15"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Transaksi Keluar</span>
              <span className="stat-value">{dashboard.monthlyTransactionsOut}</span>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className="card">
            <div className="card-header">
              <h2>Stok Terendah</h2>
              <span className="badge-tag">5 Terendah</span>
            </div>
            <div className="card-body">
              {dashboard.lowStockItems.length === 0 ? (
                <div className="empty-state">
                  <p>Belum ada data item</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Nama</th>
                      <th>Kategori</th>
                      <th className="text-right">Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td><code className="code-badge">{item.code}</code></td>
                        <td>{item.name}</td>
                        <td><span className="category-tag">{item.category.name}</span></td>
                        <td className="text-right">
                          <span className={`stock-value ${item.stock === 0 ? 'stock-zero' : item.stock <= 5 ? 'stock-low' : ''}`}>
                            {item.stock} {item.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Transaksi Bulan Ini</h2>
            </div>
            <div className="card-body">
              <div className="period-info">
                <div className="period-row">
                  <span className="period-label">Periode</span>
                  <span className="period-value">
                    {new Date(dashboard.period.start).toLocaleDateString('id-ID', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })} - {new Date(dashboard.period.end).toLocaleDateString('id-ID', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="period-row">
                  <span className="period-label">Masuk</span>
                  <span className="period-value text-green">{dashboard.monthlyTransactionsIn} transaksi</span>
                </div>
                <div className="period-row">
                  <span className="period-label">Keluar</span>
                  <span className="period-value text-red">{dashboard.monthlyTransactionsOut} transaksi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
