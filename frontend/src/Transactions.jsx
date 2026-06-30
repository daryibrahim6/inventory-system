import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import './Categories.css';
import './Transactions.css';

const API_URL = 'http://localhost:3001/api';

function Transactions() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('in');
  const [formData, setFormData] = useState({ itemId: '', quantity: '', date: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filterItem, setFilterItem] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const token = localStorage.getItem('token');

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/items?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setItems(data.data || []); }
    } catch {}
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filterItem) params.append('itemId', filterItem);
      if (filterType) params.append('type', filterType);
      if (filterStart) params.append('startDate', filterStart);
      if (filterEnd) params.append('endDate', filterEnd);
      const res = await fetch(`${API_URL}/transactions/history?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Gagal memuat transaksi');
      const data = await res.json();
      setTransactions(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, filterItem, filterType, filterStart, filterEnd]);

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const endpoint = activeTab === 'in' ? '/transactions/stock-in' : '/transactions/stock-out';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId: Number(formData.itemId), quantity: Number(formData.quantity), date: formData.date || undefined, note: formData.notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan transaksi');
      setSuccess(`Transaksi ${activeTab === 'in' ? 'masuk' : 'keluar'} berhasil!`);
      setFormData({ itemId: '', quantity: '', date: '', notes: '' });
      fetchTransactions();
      fetchItems();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleFilter = () => { setPage(1); };
  const handleClearFilter = () => { setFilterItem(''); setFilterType(''); setFilterStart(''); setFilterEnd(''); setPage(1); };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterItem) params.append('itemId', filterItem);
    if (filterType) params.append('type', filterType);
    if (filterStart) params.append('startDate', filterStart);
    if (filterEnd) params.append('endDate', filterEnd);
    window.open(`${API_URL}/transactions/export?${params}`, '_blank');
  };

  const selectedItem = items.find((i) => i.id === Number(formData.itemId));

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>Transaksi Barang</h1>
            <p className="page-subtitle">{pagination.total} transaksi tercatat</p>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div className="tabs">
          <button className={`tab ${activeTab === 'in' ? 'active' : ''}`} onClick={() => { setActiveTab('in'); setFormData({ itemId: '', quantity: '', date: '', notes: '' }); setError(''); setSuccess(''); }}>Barang Masuk</button>
          <button className={`tab ${activeTab === 'out' ? 'active' : ''}`} onClick={() => { setActiveTab('out'); setFormData({ itemId: '', quantity: '', date: '', notes: '' }); setError(''); setSuccess(''); }}>Barang Keluar</button>
        </div>

        <div className="form-card">
          <h3>{activeTab === 'in' ? 'Form Barang Masuk' : 'Form Barang Keluar'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row-3">
              <div className="form-group">
                <label>Pilih Barang <span className="required">*</span></label>
                <select value={formData.itemId} onChange={(e) => setFormData({ ...formData, itemId: e.target.value })} required>
                  <option value="">Pilih Barang</option>
                  {items.map((item) => (<option key={item.id} value={item.id}>{item.code} - {item.name} (Stok: {item.stock})</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>Jumlah <span className="required">*</span></label>
                <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="0" min="1" required />
              </div>
              <div className="form-group">
                <label>Tanggal</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Keterangan</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder={activeTab === 'in' ? 'PO-001, Supplier XYZ' : 'Departemen IT, Bapak Budi'} rows="2" />
            </div>
            {selectedItem && activeTab === 'out' && Number(formData.quantity) > selectedItem.stock && (
              <div className="stok-warning">Stok tersedia: {selectedItem.stock}, jumlah diminta: {formData.quantity}</div>
            )}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setFormData({ itemId: '', quantity: '', date: '', notes: '' }); setError(''); setSuccess(''); }}>Batal</button>
              <button type="submit" className={`btn-primary ${activeTab === 'out' ? 'btn-danger' : 'btn-success'}`} disabled={submitting}>
                {submitting ? 'Menyimpan...' : activeTab === 'in' ? 'Simpan Masuk' : 'Simpan Keluar'}
              </button>
            </div>
          </form>
        </div>

        <div className="filter-bar">
          <div className="form-group">
            <label>Barang</label>
            <select value={filterItem} onChange={(e) => setFilterItem(e.target.value)}>
              <option value="">Semua</option>
              {items.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>Jenis</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Semua</option>
              <option value="in">Masuk</option>
              <option value="out">Keluar</option>
            </select>
          </div>
          <div className="form-group">
            <label>Dari</label>
            <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Sampai</label>
            <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleFilter}>Filter</button>
          <button className="btn-secondary" onClick={handleClearFilter}>Reset</button>
          <button className="btn-export" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Excel
          </button>
        </div>

        <div className="table-card">
          <div className="table-header"><h3>Riwayat Transaksi</h3></div>
          {loading ? (
            <div className="loading">Memuat data...</div>
          ) : (
            <>
              <table>
                <thead>
                  <tr><th>No</th><th>Tanggal</th><th>Jenis</th><th>Barang</th><th>Jumlah</th><th>Keterangan</th><th>Oleh</th></tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan="7" className="empty">Tidak ada transaksi</td></tr>
                  ) : transactions.map((tx, idx) => (
                    <tr key={tx.id}>
                      <td>{(page - 1) * 15 + idx + 1}</td>
                      <td>{new Date(tx.createdAt).toLocaleDateString('id-ID')}</td>
                      <td><span className={`badge ${tx.type === 'in' ? 'badge-in' : 'badge-out'}`}>{tx.type === 'in' ? 'Masuk' : 'Keluar'}</span></td>
                      <td className="font-medium">{tx.item?.name || '-'}</td>
                      <td>{tx.quantity}</td>
                      <td>{tx.note || '-'}</td>
                      <td>{tx.createdBy?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </div>
  );
}

export default Transactions;
