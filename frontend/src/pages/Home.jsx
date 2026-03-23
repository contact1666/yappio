// v2
import { useState, useEffect } from 'react'
import { getServices } from '../api'
import ServiceCard from '../components/ServiceCard'
import styles from './Home.module.css'

const CATS = ['Temizlik','Tadilat & Tamirat','Nakliyat','Özel Ders & Eğitim','Bahçe & Peyzaj','Teknoloji','Güzellik & Bakım','Sağlık','Etkinlik & Organizasyon']
const ILCELER = ['Nilüfer','Osmangazi','Yıldırım','Mudanya','Gemlik','İnegöl','Karacabey','Orhangazi']

export default function Home() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [ilce, setIlce] = useState('')
  const [debSearch, setDebSearch] = useState('')

  useEffect(() => { const t = setTimeout(() => setDebSearch(search), 350); return () => clearTimeout(t) }, [search])

  useEffect(() => {
    setLoading(true)
    getServices({ search: debSearch, category, ilce })
      .then(r => setServices(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [debSearch, category, ilce])

  return (
    <div>
      <div className={styles.hero}>
        <div className="container">
          <div className={styles.heroTag}><div className={styles.dot}></div> Bursa'ya özel hizmet platformu</div>
          <h1 className={styles.heroTitle}>Bursa'da ihtiyacın<br />ne olursa <em>çözüm burada.</em></h1>
          <p className={styles.heroSub}>Temizlikçiden özel hocaya, elektrikçiden nakliyeciye — Bursalı hizmet verenler tek çatı altında.</p>
          <div className={styles.searchBox}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ne arıyorsunuz? (temizlik, özel ders, nakliyat...)" className={styles.searchInput} />
            <div className={styles.ilceRow}>
              <span className={styles.ilceLabel}>İlçe:</span>
              <button className={`${styles.ilceChip} ${!ilce ? styles.ilceActive : ''}`} onClick={() => setIlce('')}>Tümü</button>
              {ILCELER.map(i => <button key={i} className={`${styles.ilceChip} ${ilce === i ? styles.ilceActive : ''}`} onClick={() => setIlce(i === ilce ? '' : i)}>{i}</button>)}
            </div>
          </div>
          <div className={styles.stats}>
            <span>👥 1.240 kayıtlı hizmet veren</span>
            <span>·</span>
            <span>✅ 8.500+ tamamlanan iş</span>
            <span>·</span>
            <span>⭐ 4.8/5 ortalama puan</span>
          </div>
        </div>
      </div>

      <div className={styles.catBar}>
        <div className="container">
          <div className={styles.cats}>
            <button className={`${styles.cat} ${!category ? styles.catActive : ''}`} onClick={() => setCategory('')}>🏠 Tümü</button>
            {CATS.map(c => <button key={c} className={`${styles.cat} ${category === c ? styles.catActive : ''}`} onClick={() => setCategory(c === category ? '' : c)}>{c}</button>)}
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={`card ${styles.filterCard}`}>
              <div className={styles.filterHead}>Bursa İlçeleri</div>
              {ILCELER.map(i => (
                <label key={i} className={styles.filterOpt}>
                  <input type="checkbox" checked={ilce === i} onChange={() => setIlce(ilce === i ? '' : i)} /> {i}
                </label>
              ))}
              <div className={styles.filterSep} />
              <div className={styles.filterHead}>Özellik</div>
              <label className={styles.filterOpt}><input type="checkbox" /> Sadece doğrulanmış</label>
              <label className={styles.filterOpt}><input type="checkbox" /> Bugün müsait</label>
              <label className={styles.filterOpt}><input type="checkbox" /> Eve geliyor</label>
            </div>
          </aside>

          <main>
            <div className={styles.gridHeader}>
              <span className={styles.count}>{loading ? 'Yükleniyor...' : `${services.length} hizmet veren bulundu`}</span>
              <select className={styles.sort}>
                <option>En İyi Puanlı</option>
                <option>En Düşük Fiyat</option>
                <option>En Yeni</option>
              </select>
            </div>
            {loading ? (
              <div className={styles.grid}>{[...Array(6)].map((_, i) => <div key={i} className={`card ${styles.skeleton}`} />)}</div>
            ) : services.length === 0 ? (
              <div className={styles.empty}>Aradığınız kriterlere uygun hizmet veren bulunamadı.</div>
            ) : (
              <div className={styles.grid}>{services.map(s => <ServiceCard key={s.id} service={s} />)}</div>
            )}
          </main>
        </div>
      </div>

      <div className={styles.howSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Nasıl Çalışır?</h2>
            <p className={styles.sectionSub}>Hizmet arıyor musunuz, yoksa vermek mi istiyorsunuz?</p>
          </div>
          <div className={styles.howGrid}>
            <div className={styles.howCard}>
              <div className={styles.howCardTitle}>🔍 Hizmet Arayanlar</div>
              <div className={styles.howSteps}>
                <div className={styles.howStep}><div className={styles.howNum}>1</div><div><strong>İhtiyacını Belirt</strong><p>Ne yaptırmak istediğini yaz, Bursa'daki ilçeni seç.</p></div></div>
                <div className={styles.howStep}><div className={styles.howNum}>2</div><div><strong>Teklifleri Karşılaştır</strong><p>Hizmet verenlerle mesajlaş, fiyat ve yorumları incele.</p></div></div>
                <div className={styles.howStep}><div className={styles.howNum}>3</div><div><strong>İşini Hallettir</strong><p>Randevu al, iş bitince değerlendir.</p></div></div>
              </div>
            </div>
            <div className={styles.howCard}>
              <div className={styles.howCardTitle}>💼 Hizmet Verenler</div>
              <div className={styles.howSteps}>
                <div className={styles.howStep}><div className={styles.howNum}>1</div><div><strong>Ücretsiz Kaydol</strong><p>5 dakikada profilini oluştur, hizmetlerini ekle.</p></div></div>
                <div className={styles.howStep}><div className={styles.howNum}>2</div><div><strong>Müşteri Bul</strong><p>Bursa'daki binlerce kişiye ulaş, tekliflerini gönder.</p></div></div>
                <div className={styles.howStep}><div className={styles.howNum}>3</div><div><strong>Kazan</strong><p>İşi tamamla, değerlendirme al, güvenilirliğini artır.</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.aboutSection}>
        <div className="container">
          <div className={styles.aboutInner}>
            <div className={styles.aboutLeft}>
              <div className={styles.aboutTag}>Biz Kimiz?</div>
              <h2 className={styles.aboutTitle}>Yappio, 2026 yılında<br /><em>Bursa'da doğdu.</em></h2>
              <p className={styles.aboutText}>Yappio, 2026 yılında Bursa'da doğan yerel bir hizmet platformudur. Temizlikten özel derse, tadilattan nakliyata kadar Bursa'nın dört bir yanındaki hizmet verenlerini ihtiyaç sahipleriyle buluşturuyoruz.</p>
              <p className={styles.aboutText}>Binlerce Bursalı artık Yappio'ya güveniyor. Çünkü biz sadece bir platform değil, Bursa'nın dijital mahalle kültürüyüz.</p>
              <div className={styles.aboutSlogan}>Güvenilir. Yerel. Yappio.</div>
            </div>
            <div className={styles.aboutRight}>
              <div className={styles.aboutStat}><div className={styles.aboutStatNum}>1.240+</div><div className={styles.aboutStatLbl}>Hizmet Veren</div></div>
              <div className={styles.aboutStat}><div className={styles.aboutStatNum}>8.500+</div><div className={styles.aboutStatLbl}>Tamamlanan İş</div></div>
              <div className={styles.aboutStat}><div className={styles.aboutStatNum}>8</div><div className={styles.aboutStatLbl}>Bursa İlçesi</div></div>
              <div className={styles.aboutStat}><div className={styles.aboutStatNum}>4.8/5</div><div className={styles.aboutStatLbl}>Müşteri Puanı</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
