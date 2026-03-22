import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, register } from '../api'
import { useAuth } from '../hooks/useAuth'
import styles from './Auth.module.css'

function AuthLeft({ title, sub, features }) {
  return (
    <div className={styles.left}>
      <div className={styles.leftBg} />
      <div className={styles.leftContent}>
        <div className={styles.leftTag}>Yappio Bursa</div>
        <h2 className={styles.leftTitle} dangerouslySetInnerHTML={{ __html: title }} />
        <p className={styles.leftSub}>{sub}</p>
        {features.map((f, i) => (
          <div key={i} className={styles.feature}><div className={styles.featureIcon}>{f.icon}</div><div className={styles.featureText}>{f.text}</div></div>
        ))}
      </div>
    </div>
  )
}

export function Login() {
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const r = await login(form)
      loginUser(r.data.access_token, r.data.user)
      navigate('/')
    } catch (err) { setError(err.response?.data?.detail || 'Giriş başarısız') }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <AuthLeft
        title="Bursa'nın en büyük<br/><em>hizmet platformuna</em><br/>hoş geldiniz."
        sub="Temizlikçiden özel hocaya, elektrikçiden nakliyeciye — Bursa'da her şey burada."
        features={[
          { icon: '✅', text: 'Kimlik doğrulamalı hizmet verenler' },
          { icon: '💬', text: 'Güvenli mesajlaşma ve teklif sistemi' },
          { icon: '⭐', text: 'Gerçek kullanıcı değerlendirmeleri' },
          { icon: '📍', text: "Bursa'nın tüm ilçelerinde hizmet" },
        ]}
      />
      <div className={styles.right}>
        <div className={styles.box}>
          <h3 className={styles.boxTitle}>Tekrar hoş geldiniz</h3>
          <p className={styles.boxSub}>Hesabınıza giriş yapın</p>
          {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group"><label className="form-label">E-posta</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ornek@email.com" /></div>
            <div className="form-group"><label className="form-label">Şifre</label><input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
            <button type="submit" className="btn btn-dark btn-full" disabled={loading}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
          </form>
          <p className={styles.switch}>Hesabınız yok mu? <Link to="/register">Kayıt Ol</Link></p>
        </div>
      </div>
    </div>
  )
}

export function Register() {
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('user')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', ilce: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const ILCELER = ['Nilüfer','Osmangazi','Yıldırım','Mudanya','Gemlik','İnegöl','Karacabey','Orhangazi']

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const r = await register({ ...form, role })
      loginUser(r.data.access_token, r.data.user)
      navigate('/')
    } catch (err) { setError(err.response?.data?.detail || 'Kayıt başarısız') }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <AuthLeft
        title="Binlerce Bursalı ile<br/><em>buluşun.</em>"
        sub="Hizmet verin veya hizmet alın — kayıt ücretsiz, gizli ücret yok."
        features={[
          { icon: '🆓', text: 'Ücretsiz kayıt, komisyon yok' },
          { icon: '🚀', text: '5 dakikada profilinizi oluşturun' },
          { icon: '🌿', text: "Bursa'ya özel, yerel topluluk" },
        ]}
      />
      <div className={styles.right}>
        <div className={styles.box}>
          <h3 className={styles.boxTitle}>Hesap oluşturun</h3>
          <p className={styles.boxSub}>Ne olmak istiyorsunuz?</p>
          <div className={styles.roleSelect}>
            <div className={`${styles.roleOpt} ${role === 'user' ? styles.roleActive : ''}`} onClick={() => setRole('user')}>
              <div className={styles.roleIcon}>🔍</div>
              <div className={styles.roleLabel}>Hizmet Alıyorum</div>
              <div className={styles.roleSub}>Hizmet arayanlara</div>
            </div>
            <div className={`${styles.roleOpt} ${role === 'provider' ? styles.roleActive : ''}`} onClick={() => setRole('provider')}>
              <div className={styles.roleIcon}>💼</div>
              <div className={styles.roleLabel}>Hizmet Veriyorum</div>
              <div className={styles.roleSub}>Kazanmaya başla</div>
            </div>
          </div>
          {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className="form-group"><label className="form-label">Ad Soyad</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ahmet Kaya" /></div>
              <div className="form-group"><label className="form-label">Telefon</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="05__ ___ __ __" /></div>
            </div>
            <div className="form-group"><label className="form-label">E-posta</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ornek@email.com" /></div>
            <div className="form-group">
              <label className="form-label">İlçe</label>
              <select value={form.ilce} onChange={e => setForm({ ...form, ilce: e.target.value })}>
                <option value="">İlçe seçin</option>
                {ILCELER.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Şifre</label><input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="En az 6 karakter" /></div>
            <button type="submit" className="btn btn-green btn-full" disabled={loading}>{loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}</button>
          </form>
          <p className={styles.switch}>Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link></p>
        </div>
      </div>
    </div>
  )
}
