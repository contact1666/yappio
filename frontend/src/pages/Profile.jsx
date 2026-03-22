import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUser, getUserServices, sendMessage } from '../api'
import { useAuth } from '../hooks/useAuth'
import ServiceCard from '../components/ServiceCard'
import styles from './Profile.module.css'

const COLORS = ['#1C3A1A','#2E6B2A','#5A9E3A','#3D5A3E','#4A7C59']

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgText, setMsgText] = useState('')
  const [msgSent, setMsgSent] = useState(false)
  const [showMsg, setShowMsg] = useState(false)

  const isMe = user?.id === Number(id)

  useEffect(() => {
    Promise.all([getUser(id), getUserServices(id)])
      .then(([u, s]) => { setProfile(u.data); setServices(s.data) })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const handleMsg = async e => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    await sendMessage({ receiver_id: Number(id), content: msgText })
    setMsgSent(true)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#8BA88A' }}>Yükleniyor...</div>
  if (!profile) return null

  const color = COLORS[Number(id) % COLORS.length]
  const initials = profile.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const totalReviews = services.reduce((a, s) => a + (s.review_count || 0), 0)
  const avgRating = services.length > 0
    ? (services.reduce((a, s) => a + (Number(s.avg_rating) || 0), 0) / services.filter(s => s.avg_rating).length || 0).toFixed(1)
    : null

  return (
    <div>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroTop}>
            <div className={styles.avatar} style={{ background: color }}>{initials}</div>
            <div className={styles.heroInfo}>
              <h1 className={styles.name}>{profile.name}</h1>
              <div className={styles.meta}>
                {profile.ilce && <span>📍 {profile.ilce}, Bursa</span>}
                {avgRating && <span>⭐ {avgRating} ortalama puan</span>}
                <span>✅ {services.length} aktif ilan</span>
                <span>💬 {totalReviews} değerlendirme</span>
              </div>
            </div>
            <div className={styles.heroActions}>
              {isMe ? (
                <button className={styles.btnW} onClick={() => navigate('/dashboard')}>Dashboard</button>
              ) : (
                <>
                  <button className={styles.btnW} onClick={() => setShowMsg(!showMsg)}>💬 Mesaj Gönder</button>
                  <button className={styles.btnG} onClick={() => navigate('/messages')}>Teklif İste</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 20px 3rem' }}>
        <div className={styles.layout}>
          <main>
            {showMsg && !isMe && (
              <div className={`card ${styles.msgBox}`}>
                <h4 style={{ fontWeight: 700, marginBottom: 10 }}>Mesaj Gönder</h4>
                {msgSent ? <div className="success-msg">✓ Mesajınız gönderildi!</div> : (
                  <form onSubmit={handleMsg}>
                    <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={4} placeholder="Mesajınızı yazın..." style={{ marginBottom: 10 }} required />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn btn-dark btn-sm">Gönder</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowMsg(false)}>İptal</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {profile.bio && (
              <div className={`card ${styles.bioCard}`}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Hakkında</h3>
                <p style={{ fontSize: 14, color: '#6B8A68', lineHeight: 1.7 }}>{profile.bio}</p>
              </div>
            )}

            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '1.5rem 0 1rem', color: '#1C2B1A' }}>
              {isMe ? 'İlanlarım' : `${profile.name} adlı kişinin ilanları`} ({services.length})
            </h2>
            {services.length === 0 ? (
              <div className={styles.empty}>
                {isMe ? <><p>Henüz ilan eklemediniz.</p><button className="btn btn-dark" onClick={() => navigate('/create')}>+ İlk İlanı Ver</button></> : <p>Henüz ilan yok.</p>}
              </div>
            ) : (
              <div className={styles.grid}>{services.map(s => <ServiceCard key={s.id} service={s} />)}</div>
            )}
          </main>

          <aside>
            <div className={`card ${styles.infoCard}`}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Bilgiler</h4>
              {[['İlçe', profile.ilce || 'Belirtilmedi'], ['Toplam İlan', services.length], ['Toplam Yorum', totalReviews], ['Ortalama Puan', avgRating ? `${avgRating} ⭐` : 'Henüz yok']].map(([k, v]) => (
                <div key={k} className={styles.infoRow}><span style={{ color: '#8BA88A', fontSize: 13 }}>{k}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span></div>
              ))}
              {isMe && (
                <button className="btn btn-outline btn-full btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/dashboard')}>Profili Düzenle</button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
