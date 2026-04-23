import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { getAvailableLanguages } from '../lib/languages'

const SAMPLE_GROUPS = [
  { id: 1, name: 'Valorant FR/EN', members: 4, maxMembers: 8, langs: ['🇫🇷', '🇬🇧', '🇪🇸'], code: 'VAL-1234' },
  { id: 2, name: 'CS2 International', members: 6, maxMembers: 10, langs: ['🇩🇪', '🇷🇺', '🇵🇱', '🇧🇷'], code: 'CS2-5678' },
  { id: 3, name: 'League of Legends', members: 2, maxMembers: 5, langs: ['🇰🇷', '🇯🇵', '🇨🇳'], code: 'LOL-9012' },
  { id: 4, name: 'Warzone Squad', members: 3, maxMembers: 4, langs: ['🇺🇸', '🇲🇽', '🇦🇷'], code: 'WAR-3456' },
]

export function GroupsPage() {
  const navigate = useNavigate()
  const { plan } = useAuthStore()
  const LANGUAGES = getAvailableLanguages(plan)

  const [selectedLang, setSelectedLang] = useState('fr')
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh', padding: '24px 48px',
      maxWidth: '800px', margin: '0 auto',
    }}>

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '32px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#06b6d4', fontSize: '20px',
            letterSpacing: '0.1em',
          }}>GG TRANSLATE</h1>
          <p style={{
            color: '#475569', fontSize: '11px',
            letterSpacing: '0.15em', marginTop: '2px',
          }}>GROUPES VOCAUX</p>
        </div>
        <button
          onClick={() => navigate('/translate')}
          style={{
            background: 'transparent', border: 'none',
            color: '#94a3b8', cursor: 'pointer', fontSize: '13px',
          }}>← Traducteur</button>
      </div>

      {/* MA LANGUE */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          color: '#94a3b8', fontSize: '11px',
          letterSpacing: '0.1em', marginBottom: '8px',
          fontFamily: 'Orbitron, sans-serif',
        }}>MA LANGUE DANS LES GROUPES</p>
        <select
          value={selectedLang}
          onChange={e => setSelectedLang(e.target.value)}
          style={{
            width: '100%', background: '#0d1424',
            border: '1px solid #1e2d45', color: '#fff',
            padding: '12px 16px', borderRadius: '10px',
            fontSize: '14px', cursor: 'pointer',
          }}>
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
          ))}
        </select>
      </div>

      {/* BOUTONS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => { setShowCreate(true); setShowJoin(false) }}
          style={{
            flex: 1,
            background: showCreate
              ? 'linear-gradient(to right, #3b82f6, #06b6d4)'
              : 'transparent',
            border: showCreate ? 'none' : '1px solid #1e2d45',
            color: '#fff',
            padding: '14px', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px',
            fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
            transition: 'all 0.2s',
          }}>+ Créer un groupe</button>
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false) }}
          style={{
            flex: 1,
            background: showJoin
              ? 'rgba(6,182,212,0.15)'
              : 'transparent',
            border: `1px solid ${showJoin ? '#06b6d4' : '#1e2d45'}`,
            color: '#fff',
            padding: '14px', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px',
            fontFamily: 'Orbitron, sans-serif',
            transition: 'all 0.2s',
          }}># Rejoindre par code</button>
      </div>

      {/* CRÉER UN GROUPE */}
      {showCreate && (
        <div style={{
          background: '#0d1424', border: '1px solid #1e2d45',
          borderRadius: '12px', padding: '20px', marginBottom: '24px',
        }}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: '11px',
            color: '#06b6d4', marginBottom: '16px',
          }}>✨ CRÉER UN GROUPE</div>

          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Nom du groupe (ex: Valorant FR/EN)"
            style={{
              width: '100%', background: '#111827',
              border: '1px solid #1e2d45', color: '#fff',
              padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />

          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '12px', marginBottom: '16px',
          }}>
            <button
              onClick={() => setIsPublic(true)}
              style={{
                background: isPublic ? 'rgba(6,182,212,0.15)' : 'transparent',
                border: `1px solid ${isPublic ? '#06b6d4' : '#1e2d45'}`,
                color: isPublic ? '#06b6d4' : '#94a3b8',
                padding: '8px 16px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '12px',
              }}>🌍 Public</button>
            <button
              onClick={() => setIsPublic(false)}
              style={{
                background: !isPublic ? 'rgba(6,182,212,0.15)' : 'transparent',
                border: `1px solid ${!isPublic ? '#06b6d4' : '#1e2d45'}`,
                color: !isPublic ? '#06b6d4' : '#94a3b8',
                padding: '8px 16px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '12px',
              }}>🔒 Privé</button>
          </div>

          <button style={{
            width: '100%',
            background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
            border: 'none', color: '#fff',
            padding: '12px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '13px',
            fontFamily: 'Orbitron, sans-serif',
          }}>Créer le groupe →</button>
        </div>
      )}

      {/* REJOINDRE */}
      {showJoin && (
        <div style={{
          background: '#0d1424', border: '1px solid #1e2d45',
          borderRadius: '12px', padding: '20px', marginBottom: '24px',
        }}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: '11px',
            color: '#06b6d4', marginBottom: '16px',
          }}># REJOINDRE PAR CODE</div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ex: VAL-1234"
              style={{
                flex: 1, background: '#111827',
                border: '1px solid #1e2d45', color: '#fff',
                padding: '10px 14px', borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <button style={{
              background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
              border: 'none', color: '#fff',
              padding: '10px 20px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px',
              fontFamily: 'Orbitron, sans-serif',
            }}>Rejoindre</button>
          </div>
        </div>
      )}

      {/* GROUPES PUBLICS */}
      <p style={{
        color: '#94a3b8', fontSize: '11px',
        letterSpacing: '0.1em', marginBottom: '12px',
        fontFamily: 'Orbitron, sans-serif',
      }}>👥 GROUPES PUBLICS</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {SAMPLE_GROUPS.map(group => (
          <div key={group.id} style={{
            background: '#0d1424', border: '1px solid #1e2d45',
            borderRadius: '12px', padding: '16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                color: '#fff', fontSize: '14px',
                fontWeight: 600, marginBottom: '6px',
              }}>{group.name}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: '#475569', fontSize: '12px' }}>
                  👥 {group.members}/{group.maxMembers}
                </span>
                <span style={{ color: '#475569', fontSize: '12px' }}>·</span>
                <span style={{ fontSize: '14px' }}>{group.langs.join(' ')}</span>
              </div>
            </div>
            <button style={{
              background: 'transparent',
              border: '1px solid #06b6d4',
              color: '#06b6d4', padding: '8px 16px',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '12px', fontFamily: 'Orbitron, sans-serif',
            }}>Rejoindre</button>
          </div>
        ))}
      </div>

      {/* COMING SOON */}
      <div style={{
        marginTop: '24px',
        border: '1px dashed #1e2d45', borderRadius: '12px',
        padding: '20px', textAlign: 'center',
      }}>
        <div style={{ color: '#475569', fontSize: '12px', marginBottom: '8px' }}>
          🚀 Groupes en temps réel — bientôt disponible
        </div>
        <div style={{ color: '#334155', fontSize: '11px' }}>
          Crée un groupe, invite tes amis et parlez toutes les langues ensemble
        </div>
      </div>
    </div>
  )
}