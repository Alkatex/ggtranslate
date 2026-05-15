import asyncio
import websockets
import json
import numpy as np
from faster_whisper import WhisperModel

print("⏳ Chargement Whisper distil-large-v3...")
model = WhisperModel("distil-large-v3", device="cuda", compute_type="int8_float16")
print("✅ Whisper prêt sur GPU")

SAMPLE_RATE = 16000
clients = {}

async def handle_client(websocket):
    client_id = id(websocket)
    clients[client_id] = {"buffer": np.array([], dtype=np.float32), "language": "fr"}
    print(f"🔌 Client connecté: {client_id}")

    try:
        async for message in websocket:
            if isinstance(message, str):
                data = json.loads(message)
                if data.get("type") == "config":
                    clients[client_id]["language"] = data.get("language", "fr")
                    print(f"🌍 Langue: {clients[client_id]['language']}")
            elif isinstance(message, bytes):
                pcm_int16 = np.frombuffer(message, dtype=np.int16)
                pcm_float32 = pcm_int16.astype(np.float32) / 32768.0
                clients[client_id]["buffer"] = np.concatenate([
                    clients[client_id]["buffer"],
                    pcm_float32
                ])
                buffer_duration = len(clients[client_id]["buffer"]) / SAMPLE_RATE
                if buffer_duration >= 1.0:
                    audio = clients[client_id]["buffer"].copy()
                    clients[client_id]["buffer"] = np.array([], dtype=np.float32)
                    lang = clients[client_id]["language"]
                    segments, info = model.transcribe(
                        audio,
                        language=lang,
                        beam_size=1,
                        vad_filter=True,
                        vad_parameters={"min_silence_duration_ms": 300}
                    )
                    text = " ".join([s.text.strip() for s in segments])
                    if text:
                        await websocket.send(json.dumps({
                            "type": "transcript",
                            "text": text,
                            "isFinal": True,
                            "language": lang
                        }))
                        print(f"📝 {lang}: {text}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        del clients[client_id]
        print(f"🔌 Client déconnecté: {client_id}")

async def main():
    print("🚀 Serveur Whisper WebSocket démarré sur ws://localhost:8765")
    async with websockets.serve(handle_client, "localhost", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
