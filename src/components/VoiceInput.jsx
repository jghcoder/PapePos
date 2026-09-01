import { useRef, useState } from 'react'
import { useOnline } from '../context/OnlineContext.jsx'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function VoiceInput({ onResult }) {
  const online = useOnline()
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState('')
  const recognitionRef = useRef(null)

  const supported = Boolean(SpeechRecognition)

  function startListening() {
    if (!supported || !online) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-MX'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim()
      setHeard(transcript)
      // Normaliza: quita espacios para códigos dictados como "cero cero uno" -> el usuario puede
      // decir el código directamente, o números separados; aquí solo limpiamos espacios sobrantes.
      const code = transcript.replace(/\s+/g, '').toUpperCase()
      onResult(code, transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <div className="card">
      <div className="row-between">
        <h3 style={{ margin: 0 }}>Dictar código</h3>
        <button
          className={listening ? 'btn-danger' : 'btn-secondary'}
          onClick={listening ? stopListening : startListening}
          disabled={!supported || !online}
        >
          {listening ? '⏹ Detener' : '🎤 Hablar'}
        </button>
      </div>

      {!online && (
        <p className="muted" style={{ marginTop: 8 }}>
          El dictado por voz necesita internet. Usa la cámara o escribe el código mientras tanto.
        </p>
      )}
      {online && !supported && (
        <p className="muted" style={{ marginTop: 8 }}>
          Este navegador no admite dictado por voz.
        </p>
      )}
      {heard && <p style={{ marginTop: 8 }}>Escuché: <strong>{heard}</strong></p>}
    </div>
  )
}
