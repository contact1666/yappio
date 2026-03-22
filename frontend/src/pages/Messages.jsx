import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getConversations, getMessages, sendMessage } from '../api'
import { useAuth } from '../hooks/useAuth'
import styles from './Messages.module.css'

const COLORS = ['#1C3A1A','#2E6B2A','#5A9E3A','#3D5A3E','#4A7C59']

function timeAgo(ts) {
  const d = Math.floor((Date.now() / 1000) - ts)
  if (d < 60) return 'Az önce'
  if (d < 3600) return `${Math.floor(d / 60)} dk`
  if (d < 86400) return `${Math.floor(d / 3600)} sa`
  return new Date(ts * 1000).toLocaleDateString('tr-TR')
}

export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { otherId } = useParams()
  const [convs, setConvs] = useState([])
  const [msgs, setMsgs] = useState([])
  const [activeId, setActiveId] = useState(otherId ? Number(otherId) : null)
  const [activeName, setActiveName] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    getConversations().then(r => {
      setConvs(r.data)
      if (r.data.length > 0 && !activeId) {
        setActiveId(r.data[0].other_id)
        setActiveName(r.data[0].other_name)
      }
    }).finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!activeId) return
    getMessages(activeId).then(r => {
      setMsgs(r.data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })
  }, [activeId])

  const handleSend = async e => {
    e.preventDefault()
    if (!text.trim()) return
    await sendMessage({ receiver_id: activeId, content: text })
    setText('')
    getMessages(activeId).then(r => {
      setMsgs(r.data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })
  }

  const selectConv = (id, name) => { setActiveId(id); setActiveName(name) }

  if (!user) return null

  return (
    <div className={styles.page}>
      <div className={styles.list}>
        <div className={styles.listHeader}>
          <h3>Mesajlar</h3>
        </div>
        <div className={styles.search}>
          <input placeholder="Konuşma ara..." />
        </div>
        {loading ? <div style={{ padding: '1rem', color: '#8BA88A', fontSize: 13 }}>Yükleniyor...</div> :
          convs.length === 0 ? <div style={{ padding: '1.5rem', color: '#8BA88A', fontSize: 13 }}>Henüz mesajınız yok.</div> :
          convs.map(c => (
            <div key={c.other_id} className={`${styles.conv} ${activeId === c.other_id ? styles.convActive : ''}`}
              onClick={() => selectConv(c.other_id, c.other_name)}>
              <div className={styles.convAv} style={{ background: COLORS[c.other_id % COLORS.length] }}>
                {c.other_name?.slice(0, 2).toUpperCase()}
              </div>
              <div className={styles.convInfo}>
                <div className={styles.convName}>{c.other_name}</div>
                <div className={styles.convPreview}>{c.last_message}</div>
              </div>
              {c.last_time && <div className={styles.convTime}>{timeAgo(c.last_time)}</div>}
            </div>
          ))
        }
      </div>

      <div className={styles.chat}>
        {!activeId ? (
          <div className={styles.noChat}>Bir konuşma seçin</div>
        ) : (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatAv} style={{ background: COLORS[activeId % COLORS.length] }}>
                {activeName?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className={styles.chatName}>{activeName}</div>
                <div className={styles.chatStatus}>● Çevrimiçi</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className={styles.actionBtn} onClick={() => navigate(`/profile/${activeId}`)}>Profil</button>
              </div>
            </div>

            <div className={styles.messages}>
              {msgs.map(m => (
                <div key={m.id} className={`${styles.msg} ${m.sender_id === user.id ? styles.mine : styles.theirs}`}>
                  {m.is_offer ? (
                    <div className={styles.offerCard}>
                      <div className={styles.offerTitle}>💰 Hizmet Teklifi</div>
                      <div className={styles.offerService}>{m.offer_service}</div>
                      <div className={styles.offerPrice}>{m.offer_price} TL</div>
                      <p style={{ fontSize: 13, color: '#6B8A68', marginBottom: 10 }}>{m.content}</p>
                      {m.sender_id !== user.id && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className={styles.acceptBtn}>✓ Kabul Et</button>
                          <button className={styles.declineBtn}>Reddet</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.bubble}>{m.content}</div>
                  )}
                  <div className={styles.msgTime}>{timeAgo(m.created_at)}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form className={styles.inputArea} onSubmit={handleSend}>
              <input className={styles.chatInput} value={text} onChange={e => setText(e.target.value)} placeholder="Mesaj yazın..." />
              <button type="submit" className={styles.sendBtn}>Gönder</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
