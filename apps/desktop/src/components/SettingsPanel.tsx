import { useState, useEffect } from 'react'
import { useAppLanguage } from '../store/appLanguage'

const API_URL = 'https://ggtranslatebackend-production.up.railway.app'
const DISCORD_CLIENT_ID = '1499073387828609094'

interface AudioDevice {
  deviceId: string
  label: string
}

interface SettingsPanelProps {
  onClose: (micDeviceId: string | null, headsetDeviceId: string | null, virtualDeviceId: string | null) => void
}

function deduplicateDevices(devices: AudioDevice[]): AudioDevice[] {
  const filtered = devices.filter(d => d.deviceId !== 'default' && d.deviceId !== 'communications')
  function normalizeLabel(label: string): string {
    return label.toLowerCase()
      .replace(/^(default\s*-?\s*)/, '').replace(/^(microphone\s*[\(\-]\s*)/, '')
      .replace(/^(casque\s*[\(\-]\s*)/, '').replace(/^(headset\s*[\(\-]\s*)/, '')
      .replace(/^(haut-parleurs?\s*[\(\-]\s*)/, '').replace(/^(speakers?\s*[\(\-]\s*)/, '')
      .replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*/gi, '').replace(/\s*\(\d+- /g, '').trim()
  }
  const seen = new Set<string>()
  return filtered.filter(d => {
    const key = normalizeLabel(d.label)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { t, lang, setLang } = useAppLanguage()
  const [inputs, setInputs] = useState<AudioDevice[]>([])
  const [outputs, setOutputs] = useState<AudioDevice[]>([])
  const [selectedMic, setSelectedMic] = useState('')
  const [selectedHeadset, setSelectedHeadset] = useState('')
  const [selectedVirtualDevice, setSelectedVirtualDevice] = useState('')
  const [micVolume, setMicVolume] = useState(0)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [discordGuildId, setDiscordGuildId] = useState('')
  const [discordEnabled, setDiscordEnabled] = useState(false)
  const [discordStatus, setDiscordStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')

  useEffect(() => { loadDevices(); loadDiscordSettings() }, [])

  async function loadDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()))
      const devices = await navigator.mediaDevices.enumerateDevices()
      setInputs(deduplicateDevices(devices.filter(d => d.kind === 'audioinput').map(d => ({ deviceId: d.deviceId, label: d.label || t('settings.mic.default') }))))
      setOutputs(deduplicateDevices(devices.filter(d => d.kind === 'audiooutput').map(d => ({ deviceId: d.deviceId, label: d.label || t('settings.headset.default') }))))
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

  async function loadDiscordSettings() {
    const savedGuildId = await window.electron.settings.get('discordGuildId') as string
    const savedEnabled = await window.electron.settings.get('discordEnabled') as boolean
    if (savedGuildId) { setDiscordGuildId(savedGuildId); setDiscordEnabled(savedEnabled || false); checkDiscordConnection(savedGuildId) }
  }

  async function checkDiscordConnection(guildId: string) {
    if (!guildId) return
    setDiscordStatus('checking')
    try {
      const res = await fetch(`${API_URL}/discord/check/${guildId}`)
      const data = await res.json()
      setDiscordStatus(data.inGuild ? 'connected' : 'error')
    } catch { setDiscordStatus('error') }
  }

  async function saveDiscordSettings() {
    await window.electron.settings.set('discordGuildId', discordGuildId)
    await window.electron.settings.set('discordEnabled', discordEnabled)
    await checkDiscordConnection(discordGuildId)
  }

  async function testMic() {
    setTesting(true); setTestResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: selectedMic ? { deviceId: { exact: selectedMic } } : true })
      const audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser); analyser.fftSize = 256
      const data = new Uint8Array(analyser.frequencyBinCount)
      let frames = 0; let maxVol = 0
      const check = () => {
        analyser.getByteFrequencyData(data)
        const vol = data.reduce((a, b) => a + b, 0) / data.length
        setMicVolume(Math.min(100, vol * 2))
        if (vol > maxVol) maxVol = vol
        frames++
        if (frames < 100) requestAnimationFrame(check)
        else {
          stream.getTracks().forEach(t => t.stop()); audioCtx.close()
          setTesting(false); setMicVolume(0)
          setTestResult(maxVol > 5 ? t('settings.mic.ok') : t('settings.mic.fail'))
        }
      }
      requestAnimationFrame(check)
    } catch { setTesting(false); setTestResult(t('settings.mic.error')) }
  }

  const handleClose = () => {
    if (selectedMic) window.electron.settings.set('micDeviceId', selectedMic)
    if (selectedHeadset) window.electron.settings.set('headsetDeviceId', selectedHeadset)
    if (selectedVirtualDevice) window.electron.settings.set('virtualDeviceId', selectedVirtualDevice)
    window.electron.settings.set('discordGuildId', discordGuildId)
    window.electron.settings.set('discordEnabled', discordEnabled)
    onClose(selectedMic || null, selectedHeadset || null, selectedVirtualDevice || null)
  }

  const discordOutputs = outputs.filter(d =>
    d.label.toLowerCase().includes('cable') || d.label.toLowerCase().includes('vb-audio') || d.label.toLowerCase().includes('virtual')
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '14px', letterSpacing: '0.1em' }}>{t('settings.title')}</div>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>

        {/* MICROPHONE */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: '#06b6d4', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em', marginBottom: '8px' }}>{t('settings.mic')}</div>
          <select value={selectedMic} onChange={e => setSelectedMic(e.target.value)} style={{ width: '100%', background: '#111827', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '10px' }}>
            <option value="">{t('settings.mic.default')}</option>
            {inputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
          </select>
          <div style={{ height: '6px', background: '#1e2d45', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{ height: '100%', width: `${micVolume}%`, background: micVolume > 70 ? '#22c55e' : micVolume > 30 ? '#06b6d4' : '#475569', borderRadius: '99px', transition: 'width 0.1s' }}/>
          </div>
          <button onClick={testMic} disabled={testing} style={{ background: testing ? 'rgba(6,182,212,0.1)' : 'transparent', border: '1px solid #1e2d45', color: testing ? '#06b6d4' : '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: testing ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'Orbitron, sans-serif' }}>
            {testing ? t('settings.mic.testing') : t('settings.mic.test')}
          </button>
          {testResult && <div style={{ marginTop: '8px', fontSize: '12px', color: testResult.startsWith('✅') ? '#22c55e' : '#f97316' }}>{testResult}</div>}
        </div>

        {/* CASQUE */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: '#06b6d4', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em', marginBottom: '8px' }}>{t('settings.headset')}</div>
          <select value={selectedHeadset} onChange={e => setSelectedHeadset(e.target.value)} style={{ width: '100%', background: '#111827', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <option value="">{t('settings.headset.default')}</option>
            {outputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
          </select>
        </div>

        {/* SORTIE VERS DISCORD */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ color: '#a855f7', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em', marginBottom: '8px' }}>{t('settings.discord.output')}</div>
          <div style={{ color: '#475569', fontSize: '11px', marginBottom: '8px' }}>{t('settings.discord.output.desc')}</div>
          <select value={selectedVirtualDevice} onChange={e => setSelectedVirtualDevice(e.target.value)} style={{ width: '100%', background: '#111827', border: '1px solid #2d1f45', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <option value="">{t('settings.discord.disabled')}</option>
            {discordOutputs.length > 0
              ? discordOutputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)
              : outputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)
            }
          </select>
          {selectedVirtualDevice && <div style={{ marginTop: '8px', fontSize: '11px', color: '#22c55e' }}>{t('settings.discord.output.active')}</div>}
          {discordOutputs.length === 0 && <div style={{ marginTop: '8px', fontSize: '11px', color: '#f97316' }}>{t('settings.discord.output.none')}</div>}
        </div>

        {/* DISCORD BOT */}
        <div style={{ marginBottom: '24px', background: '#0a0f1a', border: '1px solid #1e2d45', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ color: '#5865f2', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
              <span style={{ fontSize: '16px', marginRight: '6px' }}>🤖</span>{t('settings.discord.bot')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: discordEnabled ? '#22c55e' : '#475569' }}>
                {discordEnabled ? t('settings.discord.enabled') : t('settings.discord.disabledlabel')}
              </span>
              <div onClick={() => setDiscordEnabled(!discordEnabled)} style={{ width: '36px', height: '20px', borderRadius: '99px', background: discordEnabled ? '#5865f2' : '#1e2d45', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                <div style={{ position: 'absolute', top: '3px', left: discordEnabled ? '18px' : '3px', width: '14px', height: '14px', background: '#fff', borderRadius: '50%', transition: 'all 0.2s' }}/>
              </div>
            </div>
          </div>
          <div style={{ color: '#475569', fontSize: '11px', marginBottom: '12px', lineHeight: 1.5 }}>
            Le bot poste les traductions en temps réel dans un canal <strong style={{ color: '#5865f2' }}>#ggtranslate</strong> de ton serveur Discord.
          </div>
          <button onClick={() => window.electron.shell.openExternal(`https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=3072&scope=bot`)} style={{ width: '100%', marginBottom: '12px', background: 'rgba(88,101,242,0.15)', border: '1px solid #5865f2', color: '#5865f2', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Orbitron, sans-serif' }}>
            {t('settings.discord.invite')}
          </button>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px' }}>
            {t('settings.discord.serverid')}
            <span style={{ color: '#475569', marginLeft: '6px' }}>{t('settings.discord.serverid.hint')}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={discordGuildId} onChange={e => setDiscordGuildId(e.target.value)} placeholder="Ex: 1443738679477801143" style={{ flex: 1, background: '#111827', border: '1px solid #1e2d45', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            <button onClick={saveDiscordSettings} style={{ background: 'rgba(88,101,242,0.2)', border: '1px solid #5865f2', color: '#5865f2', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
          </div>
          {discordStatus !== 'idle' && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: discordStatus === 'connected' ? '#22c55e' : discordStatus === 'checking' ? '#06b6d4' : '#ef4444' }}>
              {discordStatus === 'checking' && t('settings.discord.checking')}
              {discordStatus === 'connected' && t('settings.discord.connected')}
              {discordStatus === 'error' && t('settings.discord.error')}
            </div>
          )}
        </div>

        {/* LANGUE DE L'APP */}
        <div style={{ marginBottom: '24px', background: '#0a0f1a', border: '1px solid #1e2d45', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#06b6d4', fontSize: '11px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em', marginBottom: '12px' }}>
            🌍 {t('lang.select').toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['fr', 'en', 'es'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                flex: 1, padding: '10px',
                background: lang === l ? 'rgba(6,182,212,0.15)' : 'transparent',
                border: `1px solid ${lang === l ? '#06b6d4' : '#1e2d45'}`,
                color: lang === l ? '#06b6d4' : '#475569',
                borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'Orbitron, sans-serif',
                transition: 'all 0.2s',
              }}>
                {l === 'fr' ? '🇫🇷 FR' : l === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleClose} style={{ width: '100%', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>
          {t('settings.save')}
        </button>
      </div>
    </div>
  )
}