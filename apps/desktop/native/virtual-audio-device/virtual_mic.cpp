#include <napi.h>
#include <algorithm>
#define NOMINMAX
#include <windows.h>
#include <mmdeviceapi.h>
#include <audioclient.h>
#include <audiopolicy.h>
#include <functiondiscoverykeys_devpkey.h>
#include <vector>
#include <string>
#include <thread>
#include <atomic>

#define REFTIMES_PER_SEC 10000000

struct AudioDevice {
    std::wstring id;
    std::wstring name;
};

std::vector<AudioDevice> GetRenderDevices() {
    std::vector<AudioDevice> devices;
    
    HRESULT hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    bool needsUninit = SUCCEEDED(hr);

    IMMDeviceEnumerator* pEnumerator = nullptr;
    IMMDeviceCollection* pCollection = nullptr;

    hr = CoCreateInstance(
        __uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
        __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator
    );
    if (FAILED(hr)) { if (needsUninit) CoUninitialize(); return devices; }

    hr = pEnumerator->EnumAudioEndpoints(eRender, DEVICE_STATE_ACTIVE, &pCollection);
    if (FAILED(hr)) { pEnumerator->Release(); if (needsUninit) CoUninitialize(); return devices; }

    UINT count = 0;
    pCollection->GetCount(&count);

    for (UINT i = 0; i < count; i++) {
        IMMDevice* pDevice = nullptr;
        if (FAILED(pCollection->Item(i, &pDevice))) continue;

        LPWSTR pwszId = nullptr;
        pDevice->GetId(&pwszId);

        IPropertyStore* pProps = nullptr;
        pDevice->OpenPropertyStore(STGM_READ, &pProps);

        PROPVARIANT varName;
        PropVariantInit(&varName);
        
        AudioDevice dev;
        if (pwszId) dev.id = pwszId;

        if (pProps && SUCCEEDED(pProps->GetValue(PKEY_Device_FriendlyName, &varName))) {
            if (varName.vt == VT_LPWSTR && varName.pwszVal) {
                dev.name = varName.pwszVal;
            }
            PropVariantClear(&varName);
        }

        devices.push_back(dev);

        if (pProps) pProps->Release();
        if (pwszId) CoTaskMemFree(pwszId);
        pDevice->Release();
    }

    pCollection->Release();
    pEnumerator->Release();
    if (needsUninit) CoUninitialize();

    return devices;
}

class VirtualAudioPlayer {
public:
    std::atomic<bool> isPlaying{false};

    HRESULT PlayBuffer(
        const std::wstring& deviceId,
        const std::vector<int16_t>& audioData,
        int sampleRate,
        int channels
    ) {
        HRESULT hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
        bool needsUninit = SUCCEEDED(hr);

        IMMDeviceEnumerator* pEnumerator = nullptr;
        IMMDevice* pDevice = nullptr;
        IAudioClient* pAudioClient = nullptr;
        IAudioRenderClient* pRenderClient = nullptr;

        hr = CoCreateInstance(
            __uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
            __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator
        );
        if (FAILED(hr)) goto cleanup;

        if (deviceId.empty()) {
            hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &pDevice);
        } else {
            hr = pEnumerator->GetDevice(deviceId.c_str(), &pDevice);
        }
        if (FAILED(hr)) goto cleanup;

        hr = pDevice->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr, (void**)&pAudioClient);
        if (FAILED(hr)) goto cleanup;

        {
            WAVEFORMATEX wfx = {};
            wfx.wFormatTag = WAVE_FORMAT_PCM;
            wfx.nChannels = (WORD)channels;
            wfx.nSamplesPerSec = (DWORD)sampleRate;
            wfx.wBitsPerSample = 16;
            wfx.nBlockAlign = wfx.nChannels * (wfx.wBitsPerSample / 8);
            wfx.nAvgBytesPerSec = wfx.nSamplesPerSec * wfx.nBlockAlign;
            wfx.cbSize = 0;

            hr = pAudioClient->Initialize(
                AUDCLNT_SHAREMODE_SHARED,
                0,
                REFTIMES_PER_SEC,
                0,
                &wfx,
                nullptr
            );
            if (FAILED(hr)) goto cleanup;

            hr = pAudioClient->GetService(__uuidof(IAudioRenderClient), (void**)&pRenderClient);
            if (FAILED(hr)) goto cleanup;

            UINT32 bufferFrameCount = 0;
            pAudioClient->GetBufferSize(&bufferFrameCount);

            hr = pAudioClient->Start();
            if (FAILED(hr)) goto cleanup;

            isPlaying = true;
            size_t dataOffset = 0;
            size_t totalFrames = audioData.size() / channels;

            while (dataOffset < totalFrames) {
                Sleep(10);

                UINT32 numFramesPadding = 0;
                pAudioClient->GetCurrentPadding(&numFramesPadding);

                UINT32 numFramesAvailable = bufferFrameCount - numFramesPadding;
                UINT32 framesToWrite = (UINT32)std::min((size_t)numFramesAvailable, totalFrames - dataOffset);

                if (framesToWrite == 0) continue;

                BYTE* pData = nullptr;
                hr = pRenderClient->GetBuffer(framesToWrite, &pData);
                if (FAILED(hr)) break;

                memcpy(pData, audioData.data() + dataOffset * channels, framesToWrite * channels * sizeof(int16_t));

                pRenderClient->ReleaseBuffer(framesToWrite, 0);
                dataOffset += framesToWrite;
            }

            Sleep(200);
            pAudioClient->Stop();
            isPlaying = false;
        }

    cleanup:
        if (pRenderClient) pRenderClient->Release();
        if (pAudioClient) pAudioClient->Release();
        if (pDevice) pDevice->Release();
        if (pEnumerator) pEnumerator->Release();
        if (needsUninit) CoUninitialize();

        return hr;
    }
};

static VirtualAudioPlayer* gPlayer = nullptr;

Napi::Value ListDevices(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    auto devices = GetRenderDevices();
    auto arr = Napi::Array::New(env, devices.size());

    for (size_t i = 0; i < devices.size(); i++) {
        auto obj = Napi::Object::New(env);

        std::string id(devices[i].id.begin(), devices[i].id.end());
        std::string name(devices[i].name.begin(), devices[i].name.end());

        obj.Set("id", Napi::String::New(env, id));
        obj.Set("name", Napi::String::New(env, name));
        arr.Set((uint32_t)i, obj);
    }

    return arr;
}

Napi::Value PlayAudio(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        return Napi::Boolean::New(env, false);
    }

    std::string deviceIdStr = info[0].As<Napi::String>().Utf8Value();
    std::wstring deviceId(deviceIdStr.begin(), deviceIdStr.end());

    Napi::Buffer<int16_t> buffer = info[1].As<Napi::Buffer<int16_t>>();
    int sampleRate = info[2].As<Napi::Number>().Int32Value();
    int channels = info[3].As<Napi::Number>().Int32Value();

    std::vector<int16_t> audioData(buffer.Data(), buffer.Data() + buffer.Length());

    if (!gPlayer) gPlayer = new VirtualAudioPlayer();

    std::thread([=]() {
        gPlayer->PlayBuffer(deviceId, audioData, sampleRate, channels);
    }).detach();

    return Napi::Boolean::New(env, true);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("listDevices", Napi::Function::New(env, ListDevices));
    exports.Set("playAudio", Napi::Function::New(env, PlayAudio));
    return exports;
}

NODE_API_MODULE(virtual_audio_device, Init)