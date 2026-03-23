import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getService, addReview, sendMessage, deleteService } from '../api'
import { useAuth } from '../hooks/useAuth'
import styles from './ServiceDetail.module.css'

const COLORS = ['#1C3A1A','#2E6B2A','#5A9E3A','#3D5A3E','#4A7C59']

export default function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [svc, setSvc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [showMsg, setShowMsg] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [sent, setSent] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  useEffect(() => {
    getService(id).then(r => setSvc(r.data)).catch(() => navigate('/')).finally(() => setLoading(false))
  }, [id])

  const handleReview = async e => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    await addReview({ service_id: Number(id), ...review })
    setReviewed(true)
    getService(id).then(r => setSvc(r.data))
  }

  const handleMsg = async e => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    await sendMessage({ receiver_id: svc.owner_id, content: msgText })
    setSent(true)
  }

  const handleDelete = async () => {
    if (!window.confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return
    try {
      await deleteService(svc.id)
      navigate('/')
    } catch (err) {
      alert('İlan silinemedi: ' + (err.response?.data?.detail || 'Hata'))
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#8BA88A' }}>Yükleniyor...</div>
  if (!svc) return null

  const color = COLORS[svc.id % COLORS.length]
  const initials = svc.owner_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const rating = svc.avg_rating ? Number(svc.avg_rating).toFixed(1) : null
  const isOwner = user && user.id === svc.owner_id
  const isAdmin = user && user.role === 'admin'
  const canDelete = isOwner || isAdmin

  return (
    <div className={styles.page}>
      <div className="container">
        <button className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem' }} onClick={() => navigate(-1)}>← Geri</button>
        <div className={styles.layout}>
          <main>
            <div className={`card ${styles.header}`}>
              <div className={styles.headerTop}>
                <div className={styles.avatar} style={{ background: color }}>{initials}</div>
                <div style={{ flex: 1 }}>
                  <h1 className={styles.title}>{svc.title}</h1>
                  <div className={styles.ownerName}>{svc.owner_name}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <span className="badge badge-green">{svc.category}</span>
                    {svc.ilce && <span className="badge badge-gray">📍 {svc.ilce}</span>}
                    {rating && <span className="badge badge-amber">⭐ {rating} ({svc.review_count} yorum)</span>}
                    {isAdmin && <span className="badge" style={{ background: '#FEE2E2', color: '#DC2626' }}>👑 Admin</span>}
                  </div>
                </div>
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-sm"
                    style={{ background: '#DC2626', color: '#fff', alignSelf: 'flex-start' }}
                  >
                    🗑 Sil
                  </button>
                )}
              </div>
            </div>

            <div className={`card ${styles.descCard}`}>
              <h3 className={styles.secTitle}>Hizmet Açıklaması</h3>
              <p className={styles.desc}>{svc.description || 'Açıklama eklenmemiş.'}</p>
            </div>

            <div className={`card ${styles.descCard}`}>
              <h3 className={styles.secTitle}>Değerlendirmeler ({svc.review_count})</h3>
              {svc.reviews?.length === 0 && <p style={{ color: '#8BA88A', fontSize: 14 }}>Henüz yorum yok.</p>}
              {svc.reviews?.map(r => (
                <div key={r.id} className={styles.review}>
                  <div className={styles.reviewTop}>
                    <div className={styles.reviewAv}>{r.reviewer_name?.slice(0, 2).toUpperCase()}</div>
                    <div><div className={styles.reviewName}>{r.reviewer_name}</div><div style={{ color: '#F59E0B', fontSize: 13 }}>{'★'.repeat(r.rating)}</div></div>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B8A68', lineHeight: 1.6 }}>{r.comment}</p>
                </div>
              ))}

              {user && user.id !== svc.owner_id && !reviewed && (
                <form onSubmit={handleReview} className={styles.reviewForm}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Yorum Yap</h4>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label">Puan</label>
                    <select value={review.rating} onChange={e => setReview({ ...review, rating: Number(e.target.value) })}>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label">Yorumunuz</label>
                    <textarea value={review.comment} onChange={e => setReview({ ...review, comment: e.target.value })} rows={3} placeholder="Deneyiminizi paylaşın..." />
                  </div>
                  <button type="submit" className="btn btn-green btn-sm">Yorumu Gönder</button>
                </form>
              )}
              {reviewed && <div className="success-msg" style={{ marginTop: 10 }}>✓ Yorumunuz eklendi!</div>}
            </div>
          </main>

          <aside>
            <div className={`card ${styles.applyCard}`}>
              <div className={styles.price}>{svc.price} TL<span style={{ fontSize: 14, fontWeight: 400, color: '#8BA88A' }}>/{svc.price_unit}</span></div>
              {user && user.id !== svc.owner_id && !isAdmin ? (
                sent ? <div className="success-msg">✓ Mesajınız gönderildi!</div> :
                showMsg ? (
                  <form onSubmit={handleMsg}>
                    <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={4} placeholder="Mesajınızı yazın..." style={{ marginBottom: 10 }} required />
                    <button type="submit" className="btn btn-green btn-full" style={{ marginBottom: 8 }}>Gönder</button>
                    <button type="button" className="btn btn-outline btn-full btn-sm" onClick={() => setShowMsg(false)}>İptal</button>
                  </form>
                ) : (
                  <>
                    <button className="btn btn-dark btn-full" style={{ marginBottom: 8 }} onClick={() => setShowMsg(true)}>💬 Mesaj Gönder</button>
                    <button className="btn btn-outline btn-full" onClick={() => navigate('/messages')}>Teklif Al</button>
                  </>
                )
              ) : !user ? (
                <button className="btn btn-dark btn-full" onClick={() => navigate('/login')}>Giriş Yap</button>
              ) : isAdmin ? (
                <button className="btn btn-sm btn-full" style={{ background: '#DC2626', color: '#fff' }} onClick={handleDelete}>🗑 İlanı Sil</button>
              ) : (
                <button className="btn btn-outline btn-full" onClick={() => navigate('/create')}>Düzenle</button>
              )}
            </div>
            <div className={`card ${styles.infoCard}`}>
              {[['Hizmet Bölgesi', svc.ilce || 'Belirtilmedi'], ['Kategori', svc.category], ['Fiyat Birimi', svc.price_unit], ['Hizmet Veren', svc.owner_name]].map(([k, v]) => (
                <div key={k} className={styles.infoRow}><span style={{ color: '#8BA88A', fontSize: 13 }}>{k}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span></div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
