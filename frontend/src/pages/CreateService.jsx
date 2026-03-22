import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createService, updateService, getService } from '../api'
import { useAuth } from '../hooks/useAuth'
import styles from './CreateService.module.css'

const CATS = ['Temizlik','Tadilat & Tamirat','Nakliyat','Özel Ders & Eğitim','Bahçe & Peyzaj','Teknoloji','Güzellik & Bakım','Sağlık','Etkinlik & Organizasyon','Diğer']
const ILCELER = ['Nilüfer','Osmangazi','Yıldırım','Mudanya','Gemlik','İnegöl','Karacabey','Orhangazi','Tüm Bursa']
const CAT_ICONS = { 'Temizlik':'🧹','Tadilat & Tamirat':'🔧','Nakliyat':'🚚','Özel Ders & Eğitim':'📚','Bahçe & Peyzaj':'🌿','Teknoloji':'💻','Güzellik & Bakım':'💆','Sağlık':'🏥','Etkinlik & Organizasyon':'🎉','Diğer':'➕' }

const empty = { title: '', category: 'Temizlik', description: '', price: '', price_unit: 'saat', ilce: 'Nilüfer', logo_url: '' }

export default function CreateService() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
    if (isEdit) getService(id).then(r => setForm(r.data)).catch(() => navigate('/'))
  }, [user, id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Hizmet başlığı zorunludur.'); return }
    setLoading(true)
    try {
      if (isEdit) { await updateService(id, form); navigate(`/services/${id}`) }
      else { const r = await createService(form); navigate(`/services/${r.data.id}`) }
    } catch (err) { setError(err.response?.data?.detail || 'Bir hata oluştu') }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.inner}>
          <h1 className="page-title">{isEdit ? 'İlanı Düzenle' : 'Yeni İlan Ver'}</h1>
          <p className="page-sub">Hizmetinizi Bursa'daki binlerce kişiye duyurun</p>

          {error && <div className="error-msg" style={{ margin: '1rem 0' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={`card ${styles.section}`}>
              <h3 className={styles.sectionTitle}><span className={styles.stepNum}>1</span> Hizmet Kategorisi</h3>
              <div className={styles.catGrid}>
                {CATS.map(c => (
                  <div key={c} className={`${styles.catOpt} ${form.category === c ? styles.catSelected : ''}`} onClick={() => set('category', c)}>
                    <div className={styles.catIcon}>{CAT_ICONS[c]}</div>
                    <div className={styles.catLabel}>{c}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`card ${styles.section}`}>
              <h3 className={styles.sectionTitle}><span className={styles.stepNum}>2</span> Hizmet Detayları</h3>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Hizmet Başlığı *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Örn: Profesyonel Ev Temizliği" required />
              </div>
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Hizmetinizi detaylıca anlatın. Deneyiminiz, kullandığınız ekipmanlar, garanti koşulları..." style={{ resize: 'vertical' }} />
              </div>
            </div>

            <div className={`card ${styles.section}`}>
              <h3 className={styles.sectionTitle}><span className={styles.stepNum}>3</span> Fiyat & Konum</h3>
              <div className={styles.priceRow}>
                <div className="form-group">
                  <label className="form-label">Fiyat (TL)</label>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="500" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Birim</label>
                  <select value={form.price_unit} onChange={e => set('price_unit', e.target.value)}>
                    {['saat','gün','iş','ay','seans','hafta'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hizmet İlçesi</label>
                  <select value={form.ilce} onChange={e => set('ilce', e.target.value)}>
                    {ILCELER.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className={`card ${styles.section}`}>
              <h3 className={styles.sectionTitle}><span className={styles.stepNum}>4</span> Fotoğraf (isteğe bağlı)</h3>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Görsel URL</label>
                <input value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." type="url" />
              </div>
              <div className={styles.uploadBox}>
                <div className={styles.uploadIcon}>📸</div>
                <p className={styles.uploadText}>Hizmetinizle ilgili fotoğraf yükleyin<br /><span>PNG, JPG · Maks 5MB</span></p>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>İptal</button>
              <button type="submit" className="btn btn-dark" disabled={loading}>
                {loading ? 'Kaydediliyor...' : isEdit ? 'Değişiklikleri Kaydet' : 'İlanı Yayınla'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
