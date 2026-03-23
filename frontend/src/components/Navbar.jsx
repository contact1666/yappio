import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>
          <img 
            src="/yappio.png?v=2" 
            alt="Yappio Logo" 
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }} 
          />
        </Link>

        <div className={styles.links}>
          <Link to="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>Hizmetler</Link>
          <Link to="/how" className={styles.link}>Nasıl Çalışır?</Link>
          <Link to="/regions" className={styles.link}>Bölgeler</Link>
        </div>

        <div className={styles.actions}>
          {user ? (
            <>
              <Link to="/create" className="btn btn-green btn-sm">+ İlan Ver</Link>
              <Link to="/messages" className={styles.iconBtn} title="Mesajlar">💬</Link>
              <div className={styles.userMenu}>
                <Link to="/dashboard" className={styles.avatar}>{user.name?.slice(0, 2).toUpperCase()}</Link>
                <div className={styles.dropdown}>
                  <Link to="/dashboard">Dashboard</Link>
                  <Link to={`/profile/${user.id}`}>Profilim</Link>
                  <Link to="/favorites">Favorilerim</Link>
                  <hr />
                  <button onClick={() => { logoutUser(); navigate('/') }}>Çıkış Yap</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Giriş Yap</Link>
              <Link to="/register" className="btn btn-dark btn-sm">Kayıt Ol</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}