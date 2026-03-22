import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toggleFavorite } from '../api'
import { useAuth } from '../hooks/useAuth'
import styles from './ServiceCard.module.css'

const COLORS = ['#1C3A1A','#2E6B2A','#5A9E3A','#3D5A3E','#4A7C59','#1B4D2E']

function timeAgo(ts) {
  const d = Math.floor((Date.now()/1000) - ts)
  if (d < 3600) return `${Math.floor(d/60)} dk önce`
  if (d < 86400) return `${Math.floor(d/3600)} sa önce`
  if (d < 604800) return `${Math.floor(d/86400)} gün önce`
  return new Date(ts*1000).toLocaleDateString('tr-TR')
}

export default function ServiceCard({ service, isFav = false, onFavToggle }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fav, setFav] = useState(isFav)
  const color = COLORS[service.id % COLORS.length]
  const initials = service.owner_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '??'
  const rating = service.avg_rating ? Number(service.avg_rating).toFixed(1) : null

  const handleFav = async e => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    try { const r = await toggleFavorite(service.id); setFav(r.data.favorited); onFavToggle?.() } catch {}
  }

  return (
    <div className={`card ${styles.card}`} onClick={() => navigate(`/services/${service.id}`)}>
      {service.owner_id === user?.id && <div className={styles.ownBadge}>Sizin</div>}
      <div className={styles.top}>
        <div className={styles.avatar} style={{ background: color }}>{initials}</div>
        <div className={styles.info}>
          <div className={styles.name}>{service.owner_name}</div>
          <div className={styles.loc}>📍 {service.ilce || service.owner_ilce || 'Bursa'}</div>
        </div>
        <button className={`${styles.fav} ${fav ? styles.favOn : ''}`} onClick={handleFav}>♥</button>
      </div>
      <div className={styles.title}>{service.title}</div>
      <p className={styles.desc}>{service.description}</p>
      <div className={styles.tags}>
        <span className="badge badge-green">{service.category}</span>
        {service.ilce && <span className="badge badge-gray">{service.ilce}</span>}
      </div>
      <div className={styles.footer}>
        <span className={styles.price}>{service.price} TL/{service.price_unit}</span>
        <span className={styles.rating}>
          {rating ? <>⭐ {rating} <span style={{color:'#aaa'}}>({service.review_count})</span></> : <span style={{color:'#aaa'}}>Yeni</span>}
        </span>
      </div>
    </div>
  )
}
