import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import './Categories.css';

const API_URL = 'http://localhost:3001/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const token = localStorage.getItem('token');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      const res = await fetch(`${API_URL}/categories?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat kategori');
      const data = await res.json();
      setCategories(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const url = editingId ? `${API_URL}/categories/${editingId}` : `${API_URL}/categories`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kategori');
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '' });
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus kategori');
      }
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>Kategori Barang</h1>
            <p className="page-subtitle">{pagination.total} kategori terdaftar</p>
          </div>
          {!showForm && (
            <button className="btn-primary" onClick={() => { setShowForm(true); setFormData({ name: '' }); setEditingId(null); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah Kategori
            </button>
          )}
        </div>

        {error && <div className="alert-error">{error}</div>}

        {showForm && (
          <div className="form-card">
            <h3>{editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Kategori <span className="required">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="Contoh: Elektronik" required />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setError(''); }}>Batal</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="search-bar">
          <input type="text" placeholder="Cari kategori..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {loading ? (
          <div className="loading">Memuat data...</div>
        ) : (
          <>
            <div className="table-card">
              <table>
                <thead>
                  <tr><th>No</th><th>Nama Kategori</th><th>Dibuat</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr><td colSpan="4" className="empty">Tidak ada data</td></tr>
                  ) : categories.map((cat, idx) => (
                    <tr key={cat.id}>
                      <td>{(page - 1) * 10 + idx + 1}</td>
                      <td className="font-medium">{cat.name}</td>
                      <td>{new Date(cat.createdAt).toLocaleDateString('id-ID')}</td>
                      <td className="actions">
                        <button className="btn-sm btn-edit" onClick={() => handleEdit(cat)}>Edit</button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(cat.id)}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
                <span>Halaman {page} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Categories;
