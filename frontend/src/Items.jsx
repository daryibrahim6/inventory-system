import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import './Categories.css';

const API_URL = 'http://localhost:3001/api';

function Items() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', categoryId: '', unit: '', stock: '', price: '' });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const token = localStorage.getItem('token');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      const res = await fetch(`${API_URL}/items?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat barang');
      const data = await res.json();
      setItems(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data);
      }
    } catch {}
  };

  useEffect(() => { fetchItems(); fetchCategories(); }, [fetchItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const url = editingId ? `${API_URL}/items/${editingId}` : `${API_URL}/items`;
      const method = editingId ? 'PUT' : 'POST';
      const body = { ...formData, categoryId: Number(formData.categoryId), stock: Number(formData.stock), price: Number(formData.price) };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan barang');
      setShowForm(false);
      setEditingId(null);
      setFormData({ code: '', name: '', categoryId: '', unit: '', stock: '', price: '' });
      fetchItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({ code: item.code, name: item.name, categoryId: String(item.categoryId), unit: item.unit, stock: String(item.stock), price: String(item.price) });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus barang ini?')) return;
    try {
      const res = await fetch(`${API_URL}/items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal menghapus barang'); }
      fetchItems();
    } catch (err) { setError(err.message); }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>Master Data Barang</h1>
            <p className="page-subtitle">{pagination.total} barang terdaftar</p>
          </div>
          {!showForm && (
            <button className="btn-primary" onClick={() => { setShowForm(true); setFormData({ code: '', name: '', categoryId: '', unit: '', stock: '', price: '' }); setEditingId(null); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah Barang
            </button>
          )}
        </div>

        {error && <div className="alert-error">{error}</div>}

        {showForm && (
          <div className="form-card">
            <h3>{editingId ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Kode Barang <span className="required">*</span></label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="BRG-001" required />
                </div>
                <div className="form-group">
                  <label>Nama Barang <span className="required">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Laptop ASUS" required />
                </div>
                <div className="form-group">
                  <label>Kategori <span className="required">*</span></label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required>
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>Satuan <span className="required">*</span></label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="pcs, box, kg" required />
                </div>
                <div className="form-group">
                  <label>Stok</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" min="0" />
                </div>
                <div className="form-group">
                  <label>Harga Satuan <span className="required">*</span></label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0" min="0" required />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setError(''); }}>Batal</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="search-bar">
          <input type="text" placeholder="Cari barang (kode/nama)..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {loading ? (
          <div className="loading">Memuat data...</div>
        ) : (
          <>
            <div className="table-card">
              <table>
                <thead>
                  <tr><th>No</th><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th>Satuan</th><th>Stok</th><th>Harga</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="8" className="empty">Tidak ada data</td></tr>
                  ) : items.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{(page - 1) * 10 + idx + 1}</td>
                      <td><code className="code-badge">{item.code}</code></td>
                      <td className="font-medium">{item.name}</td>
                      <td><span className="category-tag">{item.category?.name || '-'}</span></td>
                      <td>{item.unit}</td>
                      <td className={item.stock <= 5 ? 'low-stock' : ''}>{item.stock}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td className="actions">
                        <button className="btn-sm btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(item.id)}>Hapus</button>
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

export default Items;
