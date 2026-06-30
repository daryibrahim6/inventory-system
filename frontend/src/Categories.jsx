import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './Categories.css';

const API_URL = 'http://localhost:3001/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat kategori');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const url = editingId
        ? `${API_URL}/categories/${editingId}`
        : `${API_URL}/categories`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kategori');

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, description: cat.description || '' });
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

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>Kategori Barang</h1>
            <p className="page-subtitle">{categories.length} kategori terdaftar</p>
          </div>
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Nama Kategori <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Elektronik"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Deskripsi</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat (opsional)"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel}>Batal</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Memuat data...</div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Kategori</th>
                  <th>Deskripsi</th>
                  <th>Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan="5" className="empty">Belum ada kategori</td></tr>
                ) : (
                  categories.map((cat, idx) => (
                    <tr key={cat.id}>
                      <td>{idx + 1}</td>
                      <td className="font-medium">{cat.name}</td>
                      <td>{cat.description || '-'}</td>
                      <td>{new Date(cat.createdAt).toLocaleDateString('id-ID')}</td>
                      <td className="actions">
                        <button className="btn-sm btn-edit" onClick={() => handleEdit(cat)}>Edit</button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(cat.id)}>Hapus</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Categories;
