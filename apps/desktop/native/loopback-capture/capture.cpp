#include <napi.h>
#include <windows.h>
#include <mmdeviceapi.h>
#include <audioclient.h>
#include <audiopolicy.h>
#include <functiondiscoverykeys_devpkey.h>
#include <vector>
#include <thread>
#include <atomic>
#include <functional>

#define REFTIMES_PER_SEC 10000000
#define REFTIMES_PER_MILLISEC 10000

class LoopbackCapture {
public:
    std::atomic<bool> isRunning{false};
    std::thread captureThread;
    Napi::ThreadSafeFunction tsfn;
    DWORD targetPID = 0;
    DWORD excludePID = 0;

    void Start(DWORD includePID, DWORD excPID, Napi::ThreadSafeFunction fn) {
        targetPID = includePID;
        excludePID = excPID;
        tsfn = fn;
        isRunning = true;
        captureThread = std::thread([this]() { CaptureLoop(); });
    }

    void Stop() {
        isRunning = false;
        if (captureThread.joinable()) {
            captureThread.join();
        }
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

        hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &pDevice);
        if (FAILED(hr)) { pEnumerator->Release(); CoUninitialize(); return; }

        hr = pDevice->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr, (void**)&pAudioClient);
        if (FAILED(hr)) { pDevice->Release(); pEnumerator->Release(); CoUninitialize(); return; }

        WAVEFORMATEX* pwfx = nullptr;
        hr = pAudioClient->GetMixFormat(&pwfx);
        if (FAILED(hr)) { pAudioClient->Release(); pDevice->Release(); pEnumerator->Release(); CoUninitialize(); return; }

        hr = pAudioClient->Initialize(
            AUDCLNT_SHAREMODE_SHARED,
            AUDCLNT_STREAMFLAGS_LOOPBACK,
            REFTIMES_PER_SEC,
            0,
            pwfx,
            nullptr
        );

        CoTaskMemFree(pwfx);

        if (FAILED(hr)) {
            pAudioClient->Release();
            pDevice->Release();
            pEnumerator->Release();
            CoUninitialize();
            return;
        }

        hr = pAudioClient->GetService(__uuidof(IAudioCaptureClient), (void**)&pCaptureClient);
        if (FAILED(hr)) {
            pAudioClient->Release();
            pDevice->Release();
            pEnumerator->Release();
            CoUninitialize();
            return;
        }

        hr = pAudioClient->Start();
        if (FAILED(hr)) {
            pCaptureClient->Release();
            pAudioClient->Release();
            pDevice->Release();
            pEnumerator->Release();
            CoUninitialize();
            return;
        }

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

                if (!(flags & AUDCLNT_BUFFERFLAGS_SILENT) && pData != nullptr) {
                    // Stéréo float32 → mono int16
                    float* floatData = reinterpret_cast<float*>(pData);
                    std::vector<int16_t> pcm16(numFramesAvailable);

                    for (UINT32 i = 0; i < numFramesAvailable; i++) {
                        // Moyenne des 2 canaux stéréo pour avoir du mono
                        float left  = floatData[i * 2];
                        float right = floatData[i * 2 + 1];
                        float mono  = (left + right) / 2.0f;

                        if (mono > 1.0f) mono = 1.0f;
                        if (mono < -1.0f) mono = -1.0f;

                        pcm16[i] = static_cast<int16_t>(mono * 32767);
                    }

                    std::vector<int16_t>* heapData = new std::vector<int16_t>(pcm16);
                    tsfn.NonBlockingCall(heapData, [](Napi::Env env, Napi::Function jsCallback, std::vector<int16_t>* data) {
                        auto buffer = Napi::Buffer<int16_t>::Copy(env, data->data(), data->size());
                        jsCallback.Call({buffer});
                        delete data;
                    });
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

    DWORD includePID = info[0].As<Napi::Number>().Uint32Value();
    DWORD excludePID = info[1].As<Napi::Number>().Uint32Value();
    Napi::Function callback = info[2].As<Napi::Function>();

    auto tsfn = Napi::ThreadSafeFunction::New(
        env, callback, "LoopbackCapture", 0, 1
    );

    gCapture = new LoopbackCapture();
    gCapture->Start(includePID, excludePID, tsfn);

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