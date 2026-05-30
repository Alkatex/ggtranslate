#include <napi.h>
#include <windows.h>
#include <mmdeviceapi.h>
#include <audioclient.h>
#include <audiopolicy.h>
#include <functiondiscoverykeys_devpkey.h>
#include <vector>
#include <thread>
#include <atomic>
#include <set>
#include <algorithm>

#define REFTIMES_PER_SEC 10000000
#define DST_SAMPLE_RATE 16000

class LoopbackCapture {
public:
    std::atomic<bool> isRunning{false};
    std::thread captureThread;
    Napi::ThreadSafeFunction tsfn;
    DWORD excludePID = 0;
    UINT32 srcSampleRate = 48000;
    UINT32 numChannels = 2;

    void Start(DWORD excPID, Napi::ThreadSafeFunction fn) {
        excludePID = excPID;
        tsfn = fn;
        isRunning = true;
        captureThread = std::thread([this]() { CaptureLoop(); });
    }

    void Stop() {
        isRunning = false;
        if (captureThread.joinable()) captureThread.join();
        tsfn.Release();
    }

    void CaptureLoop() {
        HRESULT hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
        if (FAILED(hr)) return;

        IMMDeviceEnumerator* pEnumerator = nullptr;
        IMMDevice* pDevice = nullptr;
        IAudioClient* pAudioClient = nullptr;
        IAudioCaptureClient* pCaptureClient = nullptr;

        hr = CoCreateInstance(
            __uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
            __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator
        );
        if (FAILED(hr)) { CoUninitialize(); return; }

        // ─── Capture le périphérique de lecture par défaut (loopback) ─────────
        hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &pDevice);
        if (FAILED(hr)) { pEnumerator->Release(); CoUninitialize(); return; }

        hr = pDevice->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr, (void**)&pAudioClient);
        if (FAILED(hr)) { pDevice->Release(); pEnumerator->Release(); CoUninitialize(); return; }

        WAVEFORMATEX* pwfx = nullptr;
        hr = pAudioClient->GetMixFormat(&pwfx);
        if (FAILED(hr)) { pAudioClient->Release(); pDevice->Release(); pEnumerator->Release(); CoUninitialize(); return; }

        // ─── Sauvegarde du format source ───────────────────────────────────────
        srcSampleRate = pwfx->nSamplesPerSec;
        numChannels   = pwfx->nChannels;

        hr = pAudioClient->Initialize(
            AUDCLNT_SHAREMODE_SHARED,
            AUDCLNT_STREAMFLAGS_LOOPBACK,
            REFTIMES_PER_SEC, 0, pwfx, nullptr
        );
        CoTaskMemFree(pwfx);

        if (FAILED(hr)) { pAudioClient->Release(); pDevice->Release(); pEnumerator->Release(); CoUninitialize(); return; }

        hr = pAudioClient->GetService(__uuidof(IAudioCaptureClient), (void**)&pCaptureClient);
        if (FAILED(hr)) { pAudioClient->Release(); pDevice->Release(); pEnumerator->Release(); CoUninitialize(); return; }

        hr = pAudioClient->Start();
        if (FAILED(hr)) { pCaptureClient->Release(); pAudioClient->Release(); pDevice->Release(); pEnumerator->Release(); CoUninitialize(); return; }

        // ─── Buffer de resampling inter-chunk ──────────────────────────────────
        // Accumule les samples mono float pour un resampling précis sur la frontière
        std::vector<float> monoAccum;

        while (isRunning) {
            Sleep(10);

            UINT32 packetLength = 0;
            hr = pCaptureClient->GetNextPacketSize(&packetLength);
            if (FAILED(hr)) break;

            while (packetLength != 0) {
                BYTE* pData = nullptr;
                UINT32 numFramesAvailable = 0;
                DWORD flags = 0;

                hr = pCaptureClient->GetBuffer(&pData, &numFramesAvailable, &flags, nullptr, nullptr);
                if (FAILED(hr)) break;

                if (!(flags & AUDCLNT_BUFFERFLAGS_SILENT) && pData != nullptr && numFramesAvailable > 0) {
                    float* floatData = reinterpret_cast<float*>(pData);

                    // ─── Mixage multi-canaux → mono float ───────────────────────
                    for (UINT32 i = 0; i < numFramesAvailable; i++) {
                        float mono = 0.0f;
                        for (UINT32 ch = 0; ch < numChannels; ch++) {
                            mono += floatData[i * numChannels + ch];
                        }
                        mono /= (float)numChannels;
                        mono = (mono > 1.0f) ? 1.0f : (mono < -1.0f ? -1.0f : mono);
                        monoAccum.push_back(mono);
                    }

                    // ─── Resampling vers 16000 Hz si nécessaire ─────────────────
                    if (srcSampleRate != DST_SAMPLE_RATE) {
                        double ratio = (double)srcSampleRate / DST_SAMPLE_RATE;
                        UINT32 dstFrames = (UINT32)(monoAccum.size() / ratio);

                        if (dstFrames > 0) {
                            std::vector<int16_t>* heapData = new std::vector<int16_t>(dstFrames);

                            for (UINT32 j = 0; j < dstFrames; j++) {
                                double srcIdx = (double)j * ratio;
                                UINT32 idx0 = (UINT32)srcIdx;
                                UINT32 idx1 = idx0 + 1 < (UINT32)monoAccum.size() ? idx0 + 1 : idx0;
                                double frac = srcIdx - idx0;
                                float sample = (float)(monoAccum[idx0] * (1.0 - frac) + monoAccum[idx1] * frac);
                                (*heapData)[j] = static_cast<int16_t>(sample * 32767.0f);
                            }

                            // Garde les samples non encore consommés
                            UINT32 consumedSrc = (UINT32)((double)dstFrames * ratio);
                            if (consumedSrc < (UINT32)monoAccum.size()) {
                                monoAccum = std::vector<float>(monoAccum.begin() + consumedSrc, monoAccum.end());
                            } else {
                                monoAccum.clear();
                            }

                            tsfn.NonBlockingCall(heapData, [](Napi::Env env, Napi::Function jsCallback, std::vector<int16_t>* data) {
                                auto buffer = Napi::Buffer<int16_t>::Copy(env, data->data(), data->size());
                                jsCallback.Call({buffer});
                                delete data;
                            });
                        }
                    } else {
                        // Déjà à 16000 Hz — conversion directe
                        std::vector<int16_t>* heapData = new std::vector<int16_t>(monoAccum.size());
                        for (UINT32 i = 0; i < (UINT32)monoAccum.size(); i++) {
                            (*heapData)[i] = static_cast<int16_t>(monoAccum[i] * 32767.0f);
                        }
                        monoAccum.clear();

                        tsfn.NonBlockingCall(heapData, [](Napi::Env env, Napi::Function jsCallback, std::vector<int16_t>* data) {
                            auto buffer = Napi::Buffer<int16_t>::Copy(env, data->data(), data->size());
                            jsCallback.Call({buffer});
                            delete data;
                        });
                    }
                }

                hr = pCaptureClient->ReleaseBuffer(numFramesAvailable);
                if (FAILED(hr)) break;

                hr = pCaptureClient->GetNextPacketSize(&packetLength);
                if (FAILED(hr)) break;
            }
        }

        pAudioClient->Stop();
        pCaptureClient->Release();
        pAudioClient->Release();
        pDevice->Release();
        pEnumerator->Release();
        CoUninitialize();
    }
};

static LoopbackCapture* gCapture = nullptr;

Napi::Value StartCapture(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (gCapture && gCapture->isRunning) {
        gCapture->Stop();
        delete gCapture;
        gCapture = nullptr;
    }

    DWORD excludePID = info[1].As<Napi::Number>().Uint32Value();
    Napi::Function callback = info[2].As<Napi::Function>();

    auto tsfn = Napi::ThreadSafeFunction::New(env, callback, "LoopbackCapture", 0, 1);

    gCapture = new LoopbackCapture();
    gCapture->Start(excludePID, tsfn);

    return env.Undefined();
}

Napi::Value StopCapture(const Napi::CallbackInfo& info) {
    if (gCapture) {
        gCapture->Stop();
        delete gCapture;
        gCapture = nullptr;
    }
    return info.Env().Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("startCapture", Napi::Function::New(env, StartCapture));
    exports.Set("stopCapture", Napi::Function::New(env, StopCapture));
    return exports;
}

NODE_API_MODULE(loopback_capture, Init)
