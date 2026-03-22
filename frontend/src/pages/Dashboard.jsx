import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, getUserServices, getMyFavorites, updateMe } from '../api'
import { useAuth } from '../hooks/useAuth'
import ServiceCard from '../components/ServiceCard'
import styles from './Dashboard.module.css'

const MENU = [
  { id: 'overview', icon: '📊', label: 'Genel Bakış' },
  { id: 'services', icon: '📋', label: 'İlanlarım' },
  { id: 'favorites', icon: '♥', label: 'Favorilerim' },
  { id: 'profile', icon: '👤', label: 'Profil Düzenle' },
]

export default function Dashboard() {
  const { user, loginUser, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [stats, setStats] = useState(null)
  const [services, setServices] = useState([])
  const [favs, setFavs] = useState([])
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', phone: '', ilce: '' })
  const [profileMsg, setProfileMsg] = useState('')

  const ILCELER = ['Nilüfer','Osmangazi','Yıldırım','Mudanya','Gemlik','İnegöl','Karacabey','Orhangazi']

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setProfileForm({ name: user.name || '', bio: user.bio || '', phone: user.phone || '', ilce: user.ilce || '' })
    getDashboardStats().then(r => setStats(r.data))
    getUserServices(user.id).then(r => setServices(r.data))
    getMyFavorites().then(r => setFavs(r.data))
  }, [user])

  const handleProfileSave = async e => {
    e.preventDefault()
    try {
      await updateMe(profileForm)
      loginUser(localStorage.getItem('token'), { ...user, ...profileForm })
      setProfileMsg('Profil güncellendi!')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch { setProfileMsg('Bir hata oluştu.') }
  }

  if (!user) return null

  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={styles.layout}>
      <aside className={styles.side}>
        <div className={styles.sideUser}>
          <div className={styles.sideAv}>{initials}</div>
          <div className={styles.sideName}>{user.name}</div>
          <div className={styles.sideRole}>{user.role === 'provider' ? '🟢 Hizmet Veren' : '🔵 Hizmet Alan'}</div>
        </div>
        <nav className={styles.menu}>
          {MENU.map(m => (
            <button key={m.id} className={`${styles.menuItem} ${active === m.id ? styles.menuActive : ''}`} onClick={() => setActive(m.id)}>
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
          <div style={{ marginTop: 'auto', padding: '1rem 0 0' }}>
            <button className={styles.menuItem} onClick={() => navigate(`/profile/${user.id}`)}>
              <span>👁</span> Profilimi Gör
            </button>
            <button className={styles.menuItem} onClick={() => navigate('/create')}>
              <span>➕</span> Yeni İlan Ver
            </button>
            <button className={`${styles.menuItem} ${styles.menuLogout}`} onClick={() => { logoutUser(); navigate('/') }}>
              <span>🚪</span> Çıkış Yap
            </button>
          </div>
        </nav>
      </aside>

      <main className={styles.main}>
        {/* OVERVIEW */}
        {active === 'overview' && (
          <>
            <div className={styles.pageHeader}>
              <h2>Genel Bakış</h2>
              <p>Merhaba {user.name?.split(' ')[0]}, hoş geldiniz!</p>
            </div>
            <div className={styles.statsGrid}>
              {[
                { icon: '📋', num: stats?.total_services ?? '—', lbl: 'Aktif İlan' },
                { icon: '⭐', num: stats?.avg_rating || '—', lbl: 'Ortalama Puan' },
                { icon: '💬', num: stats?.total_reviews ?? '—', lbl: 'Toplam Yorum' },
                { icon: '♥', num: favs.length, lbl: 'Favori' },
              ].map((s, i) => (
                <div key={i} className={styles.statBox}>
                  <div className={styles.statIcon}>{s.icon}</div>
                  <div className={styles.statNum}>{s.num}</div>
                  <div className={styles.statLbl}>{s.lbl}</div>
                </div>
              ))}
            </div>
            <div className={styles.quickActions}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Hızlı İşlemler</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-dark" onClick={() => navigate('/create')}>+ Yeni İlan Ver</button>
                <button className="btn btn-outline" onClick={() => navigate('/messages')}>💬 Mesajlarım</button>
                <button className="btn btn-outline" onClick={() => setActive('profile')}>👤 Profil Düzenle</button>
              </div>
            </div>
            {services.length > 0 && (
              <>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '2rem 0 1rem' }}>Son İlanlarım</h3>
                <div className={styles.grid}>{services.slice(0, 3).map(s => <ServiceCard key={s.id} service={s} />)}</div>
              </>
            )}
          </>
        )}

        {/* SERVICES */}
        {active === 'services' && (
          <>
            <div className={styles.pageHeader}>
              <div><h2>İlanlarım</h2><p>{services.length} aktif ilan</p></div>
              <button className="btn btn-dark" onClick={() => navigate('/create')}>+ Yeni İlan</button>
            </div>
            {services.length === 0 ? (
              <div className={styles.empty}>
                <p>Henüz ilan eklemediniz.</p>
                <button className="btn btn-dark" onClick={() => navigate('/create')}>+ İlk İlanı Ver</button>
              </div>
            ) : <div className={styles.grid}>{services.map(s => <ServiceCard key={s.id} service={s} />)}</div>}
          </>
        )}

        {/* FAVORITES */}
        {active === 'favorites' && (
          <>
            <div className={styles.pageHeader}><h2>Favorilerim</h2><p>{favs.length} favori ilan</p></div>
            {favs.length === 0 ? (
              <div className={styles.empty}><p>Henüz favoriye eklediğiniz ilan yok.</p><button className="btn btn-dark" onClick={() => navigate('/')}>İlanları İncele</button></div>
            ) : <div className={styles.grid}>{favs.map(s => <ServiceCard key={s.id} service={s} isFav={true} onFavToggle={() => getMyFavorites().then(r => setFavs(r.data))} />)}</div>}
          </>
        )}

        {/* PROFILE EDIT */}
        {active === 'profile' && (
          <>
            <div className={styles.pageHeader}><h2>Profil Düzenle</h2></div>
            <div className={`card ${styles.profileCard}`}>
              {profileMsg && <div className={profileMsg.includes('hata') ? 'error-msg' : 'success-msg'} style={{ marginBottom: '1rem' }}>{profileMsg}</div>}
              <form onSubmit={handleProfileSave} className={styles.profileForm}>
                <div className={styles.formRow2}>
                  <div className="form-group"><label className="form-label">Ad Soyad</label><input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Telefon</label><input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="05__ ___ __ __" /></div>
                </div>
                <div className="form-group">
                  <label className="form-label">İlçe</label>
                  <select value={profileForm.ilce} onChange={e => setProfileForm({ ...profileForm, ilce: e.target.value })}>
                    <option value="">İlçe seçin</option>
                    {ILCELER.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hakkımda</label>
                  <textarea value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} rows={4} placeholder="Kendinizi tanıtın, deneyimlerinizden bahsedin..." style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-dark">Kaydet</button>
                  <button type="button" className="btn btn-outline" onClick={() => navigate(`/profile/${user.id}`)}>Profili Gör</button>
                </div>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
