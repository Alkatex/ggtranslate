import { useState, useEffect } from 'react'

interface AudioDevice {
  deviceId: string
  label: string
}

interface SettingsPanelProps {
  onClose: (micDeviceId: string | null, headsetDeviceId: string | null, virtualDeviceId: string | null) => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [inputs, setInputs] = useState<AudioDevice[]>([])
  const [outputs, setOutputs] = useState<AudioDevice[]>([])
  const [selectedMic, setSelectedMic] = useState('')
  const [selectedHeadset, setSelectedHeadset] = useState('')
  const [selectedVirtualDevice, setSelectedVirtualDevice] = useState('')
  const [micVolume, setMicVolume] = useState(0)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    async function loadDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(s => s.getTracks().forEach(t => t.stop()))

        const devices = await navigator.mediaDevices.enumerateDevices()

        setInputs(devices
          .filter(d => d.kind === 'audioinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || 'Micro inconnu' }))
        )
        setOutputs(devices
          .filter(d => d.kind === 'audiooutput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || 'Sortie inconnue' }))
        )

        const savedMic = await window.electron.settings.get('micDeviceId') as string
        const savedHeadset = await window.electron.settings.get('headsetDeviceId') as string
        const savedVirtual = await window.electron.settings.get('virtualDeviceId') as string
        if (savedMic) setSelectedMic(savedMic)
        if (savedHeadset) setSelectedHeadset(savedHeadset)
        if (savedVirtual) setSelectedVirtualDevice(savedVirtual)

      } catch (err) {
        console.error('Erreur accès périphériques:', err)
      }
    }
    loadDevices()
  }, [])

  async function testMic() {
    setTesting(true)
    setTestResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
      })
      const audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256
      const data = new Uint8Array(analyser.frequencyBinCount)
      let frames = 0
      let maxVol = 0
      const check = () => {
        analyser.getByteFrequencyData(data)
        const vol = data.reduce((a, b) => a + b, 0) / data.length
        setMicVolume(Math.min(100, vol * 2))
        if (vol > maxVol) maxVol = vol
        frames++
        if (frames < 100) requestAnimationFrame(check)
        else {
          stream.getTracks().forEach(t => t.stop())
          audioCtx.close()
          setTesting(false)
          setMicVolume(0)
          setTestResult(maxVol > 5
            ? '✅ Micro détecté et fonctionnel !'
            : '⚠️ Aucun son détecté — vérifie ton micro.')
        }
      }
      requestAnimationFrame(check)
    } catch (err) {
      setTesting(false)
      setTestResult('❌ Impossible d\'accéder au micro — vérifie les permissions.')
    }
  }

  const handleClose = () => {
    if (selectedMic) window.electron.settings.set('micDeviceId', selectedMic)
    if (selectedHeadset) window.electron.settings.set('headsetDeviceId', selectedHeadset)
    if (selectedVirtualDevice) window.electron.settings.set('virtualDeviceId', selectedVirtualDevice)
    onClose(selectedMic || null, selectedHeadset || null, selectedVirtualDevice || null)
  }

  // Filtrer les outputs pour la sortie Discord — montrer seulement VB-Audio
  const discordOutputs = outputs.filter(d =>
    d.label.toLowerCase().includes('cable') ||
    d.label.toLowerCase().includes('vb-audio') ||
    d.label.toLowerCase().includes('virtual')
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
    }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1424',
          border: '1px solid #1e2d45',
          borderRadius: '16px', padding: '28px',
          width: '100%', maxWidth: '480px',
          maxHeight: '90vh', overflowY: 'auto',
        }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '24px',
        }}>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#fff', fontSize: '14px',
            letterSpacing: '0.1em',
          }}>⚙️ PARAMÈTRES AUDIO</div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent', border: 'none',
              color: '#475569', cursor: 'pointer', fontSize: '20px',
            }}>✕</button>
        </div>

        {/* MICROPHONE */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            color: '#06b6d4', fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
            letterSpacing: '0.1em', marginBottom: '8px',
          }}>🎤 MICROPHONE</div>
          <select
            value={selectedMic}
            onChange={e => setSelectedMic(e.target.value)}
            style={{
              width: '100%', background: '#111827',
              border: '1px solid #1e2d45', color: '#fff',
              padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer',
              marginBottom: '10px',
            }}>
            <option value="">Micro par défaut</option>
            {inputs.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>

          <div style={{
            height: '6px', background: '#1e2d45',
            borderRadius: '99px', overflow: 'hidden',
            marginBottom: '10px',
          }}>
            <div style={{
              height: '100%', width: `${micVolume}%`,
              background: micVolume > 70 ? '#22c55e' : micVolume > 30 ? '#06b6d4' : '#475569',
              borderRadius: '99px', transition: 'width 0.1s',
            }}/>
          </div>

          <button
            onClick={testMic}
            disabled={testing}
            style={{
              background: testing ? 'rgba(6,182,212,0.1)' : 'transparent',
              border: '1px solid #1e2d45',
              color: testing ? '#06b6d4' : '#94a3b8',
              padding: '8px 16px', borderRadius: '8px',
              cursor: testing ? 'not-allowed' : 'pointer',
              fontSize: '12px', fontFamily: 'Orbitron, sans-serif',
            }}>
            {testing ? '🎤 Test en cours...' : '🎤 Tester le micro'}
          </button>

          {testResult && (
            <div style={{
              marginTop: '8px', fontSize: '12px',
              color: testResult.startsWith('✅') ? '#22c55e' : '#f97316',
            }}>{testResult}</div>
          )}
        </div>

        {/* CASQUE */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            color: '#06b6d4', fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
            letterSpacing: '0.1em', marginBottom: '8px',
          }}>🔊 CASQUE / SORTIE AUDIO</div>
          <select
            value={selectedHeadset}
            onChange={e => setSelectedHeadset(e.target.value)}
            style={{
              width: '100%', background: '#111827',
              border: '1px solid #1e2d45', color: '#fff',
              padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer',
            }}>
            <option value="">Sortie par défaut</option>
            {outputs.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* SORTIE VERS DISCORD */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            color: '#a855f7', fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
            letterSpacing: '0.1em', marginBottom: '8px',
          }}>🎮 SORTIE VERS DISCORD / JEU</div>
          <div style={{
            color: '#475569', fontSize: '11px',
            marginBottom: '8px',
          }}>
            Sélectionne le device où la traduction sera envoyée pour que tes coéquipiers l'entendent
          </div>
          <select
            value={selectedVirtualDevice}
            onChange={e => setSelectedVirtualDevice(e.target.value)}
            style={{
              width: '100%', background: '#111827',
              border: '1px solid #2d1f45', color: '#fff',
              padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer',
            }}>
            <option value="">Désactivé</option>
            {discordOutputs.length > 0 ? (
              discordOutputs.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
              ))
            ) : (
              outputs.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
              ))
            )}
          </select>
          {selectedVirtualDevice && (
            <div style={{
              marginTop: '8px', fontSize: '11px',
              color: '#22c55e',
            }}>
              ✅ La traduction sera envoyée vers ce device — configure-le comme micro dans Discord
            </div>
          )}
          {discordOutputs.length === 0 && (
            <div style={{
              marginTop: '8px', fontSize: '11px',
              color: '#f97316',
            }}>
              ⚠️ GGTranslate Mic non détecté — il sera installé automatiquement au prochain lancement
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          style={{
            width: '100%',
            background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
            border: 'none', color: '#fff',
            padding: '12px', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px',
            fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
          }}>
          Sauvegarder
        </button>
      </div>
    </div>
  )
}