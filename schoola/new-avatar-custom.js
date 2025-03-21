const frameContainer = document.querySelector('.frame-container');
frameContainer.style.setProperty('--width-in-pixels', window.innerWidth);
window.addEventListener('resize', function() {
    frameContainer.style.setProperty('--width-in-pixels', window.innerWidth);
});

const aiChatInput = document.getElementById('aiChatInput');

aiChatInput.addEventListener('focus', function() {
    console.log('Focus event:', this.value);    
    pauseMonitoringAvatarUpdates();
});

aiChatInput.addEventListener('blur', function() {
    console.log('Blur event:', this.value);
    resumeMonitoringAvatarUpdates();
});

function setPreset(index) {
    window.characterPresetIndex = index;
    start(); // 캐릭터 재생성
    window.updatePresetButtons(index);
  }

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { avatarPreset } from 'https://arms00.github.io/schoola/preset.js';
import animations from 'https://arms00.github.io/customAnimations.js';
const { 
    animationFiles_M_Idle_Base64,
    animationFiles_F_Idle_Base64,
    animationFiles_M_Common_Base64,
    animationFiles_F_Common_Base64,
    animationFiles_M_Extend_Base64,
    animationFiles_F_Extend_Base64 
} = animations;

const subdomain = 'school-metaverse';        
const apiKey = 'sk_live_nv5h5OeBk95WlymTeQsiebUAAxMvKgFf-a1c';
const hashdefault = "DGEiAIc3F0A4IwWMrauDE1N0JJZlryt2MRWuZl1eJREmpGEaYJgbBGE1G3cvomMRZUqFI0g5F19jn1WZIGp2HHA0nT1cIQAhHzSXEzgvoRVmIQS1rRf0FyuWMT55YISiEmMkH3MBMy9aDIc3YKIMZxMMGF00E0MZGz5SGHWjMaEHH2y2LIE1ZR1gETIQF0D2AwMcHHLkAwR2ImW1YJcipaNgn3Z=";    
const fetchStr = "aHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MS9jaGF0L2NvbXBsZXRpb25z";
const appId = '673aa4ca396ed1e04e138cb2';
const frame = document.getElementById('frame');
const frameOverlay = document.getElementById('frame-overlay');
const avatarID = document.getElementById('avatarUrl');
const closeButton = document.querySelector('.modal-content>.close-button');
const modal = document.getElementById('avatarModal');        
const swSwitch = document.getElementById('sw-switch');

let avatarGLBUrl = '';
let modalScene, modalCamera, modalRenderer, modalControls, modalMixer, modalClock;
let avatarModalModel;
let modelJSON = null;
let animationClips = [];
let validAnimations = [];
let actions = {}; // 애니메이션 액션들을 저장할 객체
let selectedAvatarId = 'new';
let avatarExported = false;
// let previousAvatarId = null;
let language = 'kr'; // or 'en'
window.token = null;
window.strCode = hashdefault;
window.fetchStr = fetchStr;
// 원하는 프리셋 인덱스 설정 (1~5)
window.start = start;
window.setPreset = setPreset;
window.applyAssetChanges = applyAssetChanges;
window.characterJson = null;
window.characterGender = null;
window.defaultCharacterGender = null;
window.defaultCharacterJson = null;

// 전역 상태 관리
const AvatarMonitor = {
    currentInstanceId: 0,
    abortController: null,
    isPaused: false,  // 일시 중지 상태 추적
    pausedData: null, // 일시 중지 시점의 상태 저장
    
    // 모니터링 시작
    async startMonitoring(SkipOnFirstCheck = false, avatar_id = null, checkInterval = 200) {
        // 일시 중지 상태 초기화
        this.isPaused = false;
        this.pausedData = null;
        
        if (selectedAvatarId === 'new') {
            console.error('모니터링할 아바타 ID가 필요합니다');
            return;
        }
    
        if (!avatar_id) avatar_id = selectedAvatarId;
        
        // 진행 중인 모니터링 정리
        this.stopMonitoring();
        
        // 새 인스턴스 ID 생성
        this.currentInstanceId++;
        const instanceId = this.currentInstanceId;
        
        // 새 AbortController 생성
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        
        console.log(`모니터링 #${instanceId} 시작: 아바타 ID ${avatar_id}`);
        
        // JSON URL 생성
        const jsonUrl = `https://models.readyplayer.me/${avatar_id}.json`;
        
        try {
            // 초기 데이터 가져오기
            const initialResponse = await fetch(jsonUrl, { signal });
            const initialData = await initialResponse.json();
            
            // 이미 취소되었거나 다른 인스턴스가 시작되었는지 확인
            if (signal.aborted || instanceId !== this.currentInstanceId) {
                console.log(`모니터링 #${instanceId}: 이미 취소됨`);
                return;
            }
            
            const initialUpdatedAt = initialData.updatedAt;
            console.log(`모니터링 #${instanceId}: 초기 updatedAt: ${initialUpdatedAt}`);
            
            const aiChatInput = document.getElementById('aiChatInput');
            if (aiChatInput) aiChatInput.disabled = false;
            
            // 최초 확인 처리
            if (SkipOnFirstCheck) {
                this.startMonitoring(false, avatar_id, checkInterval);
                return;
            }
            
            // 모니터링 루프 시작
            this.monitoringLoop(instanceId, jsonUrl, initialUpdatedAt, signal, avatar_id, checkInterval);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error(`모니터링 #${instanceId}: 초기 데이터 로드 실패`, error);
            }
        }
    },
    
    // 모니터링 루프 (일시 중지 기능 추가)
    async monitoringLoop(instanceId, jsonUrl, initialUpdatedAt, signal, avatar_id, checkInterval) {
        // while 루프로 모니터링 지속
        while (!signal.aborted && instanceId === this.currentInstanceId) {
            try {
                // 일시 중지 상태 확인
                if (this.isPaused) {
                    // 일시 중지 상태에서는 짧은 간격으로 상태 확인만 수행
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue; // 다음 루프로 건너뜀
                }
                
                // 지정된 간격만큼 대기
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                
                // 인스턴스가 여전히 유효한지 확인
                if (signal.aborted || instanceId !== this.currentInstanceId) {
                    console.log(`모니터링 #${instanceId}: 루프 중 취소됨`);
                    break;
                }
                
                // 현재 상태 확인
                const response = await fetch(jsonUrl, { signal });
                const currentData = await response.json();
                
                // 인스턴스가 여전히 유효한지 확인
                if (signal.aborted || instanceId !== this.currentInstanceId) {
                    console.log(`모니터링 #${instanceId}: 요청 후 취소됨`);
                    break;
                }
                
                // 일시 중지 확인
                if (this.isPaused) continue;
                
                const currentUpdatedAt = currentData.updatedAt;
                
                if (currentUpdatedAt !== initialUpdatedAt) {
                    console.log(`모니터링 #${instanceId}: 변경 감지! ${initialUpdatedAt} -> ${currentUpdatedAt}`);
                    
                    // 중요: 먼저 모니터링 중지
                    this.stopMonitoring(); 
                    
                    // 그 후 처리 진행
                    processUpdatedAvatar(currentData);
                    break; // 변경이 감지되었으므로 루프 종료
                }
            } catch (error) {
                // AbortError는 정상적인 취소이므로 에러로 처리하지 않음
                if (error.name !== 'AbortError') {
                    console.error(`모니터링 #${instanceId}: 데이터 로드 실패`, error);
                    
                    // 오류 발생 시 약간 대기 후 계속 (완전히 종료하지 않음)
                    await new Promise(resolve => setTimeout(resolve, checkInterval * 2));
                } else {
                    break; // AbortError면 루프 종료
                }
            }
        }
    },
    
    // 모니터링 일시 중지
    pauseMonitoring() {
        if (!this.isPaused && this.currentInstanceId > 0) {
            console.log(`모니터링 #${this.currentInstanceId} 일시 중지`);
            this.isPaused = true;
            
            // 현재 상태 저장 (재개 시 사용)
            this.pausedData = {
                instanceId: this.currentInstanceId,
                timestamp: Date.now()
            };
            
            return true;
        }
        return false; // 이미 일시 중지되었거나 모니터링 중이 아님
    },
    
    // 모니터링 재개
    resumeMonitoring() {
        if (this.isPaused && this.pausedData) {
            // 일시 중지 시간이 너무 오래 지났으면 모니터링 새로 시작
            const pauseDuration = Date.now() - this.pausedData.timestamp;
            const maxPauseDuration = 30000; // 30초
            
            if (pauseDuration > maxPauseDuration) {
                console.log(`일시 중지 시간(${pauseDuration}ms)이 너무 길어 모니터링을 새로 시작합니다`);
                this.isPaused = false;
                this.pausedData = null;
                this.startMonitoring();
                return true;
            }
            
            // 같은 인스턴스에서 재개
            if (this.pausedData.instanceId === this.currentInstanceId) {
                console.log(`모니터링 #${this.currentInstanceId} 재개 (일시 중지 기간: ${pauseDuration}ms)`);
                this.isPaused = false;
                this.pausedData = null;
                return true;
            } else {
                // 인스턴스 ID가 변경됨 - 새로 시작
                console.log('인스턴스 ID가 변경되어 모니터링을 새로 시작합니다');
                this.isPaused = false;
                this.pausedData = null;
                this.startMonitoring();
                return true;
            }
        }
        return false; // 일시 중지 상태가 아님
    },
    
    // 모니터링 중지 (일시 중지 상태도 초기화)
    stopMonitoring() {
        console.log(`모니터링 #${this.currentInstanceId} 중지`);
        
        // 일시 중지 상태 초기화
        this.isPaused = false;
        this.pausedData = null;
        
        // 진행 중인 모든 fetch 요청과 while 루프 즉시 중단
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        
        // 인스턴스 ID를 변경하여 이전 루프가 재개되지 않도록 함
        this.currentInstanceId++;
    }
};

// 모니터링 일시 중지 함수
function pauseMonitoringAvatarUpdates() {
    return AvatarMonitor.pauseMonitoring();
}

// 모니터링 재개 함수
function resumeMonitoringAvatarUpdates() {
    return AvatarMonitor.resumeMonitoring();
}

// 시간 제한 일시 중지 함수 (일정 시간 후 자동 재개)
function pauseMonitoringAvatarUpdatesWithTimeout(timeoutMs = 5000) {
    if (AvatarMonitor.pauseMonitoring()) {
        console.log(`${timeoutMs}ms 후 모니터링 자동 재개 예약됨`);
        setTimeout(() => {
            if (AvatarMonitor.isPaused) {
                AvatarMonitor.resumeMonitoring();
            }
        }, timeoutMs);
        return true;
    }
    return false;
}

// 모니터링 상태 확인 함수
function getMonitoringStatus() {
    return {
        isActive: AvatarMonitor.currentInstanceId > 0 && AvatarMonitor.abortController !== null,
        isPaused: AvatarMonitor.isPaused,
        instanceId: AvatarMonitor.currentInstanceId
    };
}

swSwitch.addEventListener('click', function() {            
    console.log('Switch button clicked.');
    selectedAvatarId = 'new';
    document.getElementById('avatarGLBUrlData').value = '';
    document.getElementById('modelJSONData').value = '';
    document.getElementById('avatarModalModelData').value = '';
    console.log('Subscription created.');
    const blockOverlay1 = document.querySelector('.block-overlay-1');
    blockOverlay1.innerHTML = "";
    //blockOverlay1.style.backgroundColor = "rgba(180, 180, 180, 0)";            
    const blockOverlay2 = document.querySelector('.block-overlay-2');
    setTimeout(() => {                
        blockOverlay1.style.backgroundColor = "rgba(246, 246, 246, 0)";
        blockOverlay2.style.backgroundColor = "rgba(246, 246, 246, 0)";            
    }, 250);
    //start();
    location.reload();
});

closeButton.addEventListener('click', async function() {
    console.log('Close button clicked.');
    modal.style.display = 'none';
    document.getElementById('exportButton').style.display = 'none';
    document.getElementById('modalClose').style.display = 'none';
    createLoadingSpinner();
    document.getElementById('frame-overlay').style.display = 'none';
    animationClips = [];
    validAnimations = [];
    actions = {};    
    modelJSON = null;               
    avatarGLBUrl = '';    
    avatarExported = false;
    // stopMonitoringAvatarUpdates();
    // pauseMonitoringAvatarUpdates();
    document.getElementById('avatarGLBUrlData').value = '';
    document.getElementById('modelJSONData').value = '';
    document.getElementById('avatarModalModelData').value = '';        
    if (avatarModalModel) {
        modalScene.remove(avatarModalModel);
        avatarModalModel = null;
    }    
    monitorAvatarUpdates();
    if (modalMixer) {
        try{
            modalMixer.uncacheRoot(avatarModalModel);
        }                
        catch (error) {
            console.log('모델 캐시 제거 중 오류 발생:', error);
        }
        modalMixer = null;
    }
    const aiModal = document.getElementById('aiChatModal');
    if (aiModal.style.display !== 'none') {
        aiChatInput.disabled = false;
        setTimeout(() => {
            aiChatInput.focus();
        }, 300);
    }
});

window.addEventListener('message', subscribe);        

// 전역 스피너 관리 객체
const SpinnerManager = {
    activeSpinners: new Map(),
    
    create(containerId, spinnerId = null) {
        // 이미 존재하는 스피너 제거
        this.remove(containerId);
        
        const container = document.getElementById(containerId) || document.querySelector(containerId);
        if (!container) return null;
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        if (spinnerId) {
            spinner.id = spinnerId;
        } else {
            spinner.id = `spinner-${Date.now()}`;
        }
        
        container.appendChild(spinner);
        this.activeSpinners.set(containerId, spinner.id);
        return spinner;
    },
    
    remove(containerId) {
        if (this.activeSpinners.has(containerId)) {
            const spinnerId = this.activeSpinners.get(containerId);
            const spinner = document.getElementById(spinnerId);
            if (spinner && spinner.parentNode) {
                spinner.parentNode.removeChild(spinner);
            }
            this.activeSpinners.delete(containerId);
        } else {
            // 컨테이너에 있는 모든 스피너 제거 (안전장치)
            const container = document.getElementById(containerId) || document.querySelector(containerId);
            if (container) {
                const spinners = container.querySelectorAll('.loading-spinner');
                spinners.forEach(spinner => spinner.remove());
            }
        }
    },
    
    removeAll() {
        // 모든 활성 스피너 제거
        this.activeSpinners.forEach((spinnerId, containerId) => {
            this.remove(containerId);
        });
        
        // 추가 안전장치: 문서 전체에서 남은 스피너 검색 및 제거
        document.querySelectorAll('.loading-spinner').forEach(spinner => {
            spinner.remove();
        });
    }
};

async function start(forcedGender = null) {
    console.log('Starting...:', window.characterPresetIndex);
    avatarExported = false;
    // 이전 스피너 정리
    SpinnerManager.removeAll();
    
    // 새 스피너 추가
    SpinnerManager.create('.frame-container', 'main-spinner');
    
    try {
        stopMonitoringAvatarUpdates();
        const userJson = await createUser();
        window.token = userJson.data.token;
        const avatarTemplates = await getAvatarTemplates(window.token);
        const templates = avatarTemplates.data;

        // 성별 설정 - 강제 성별이 있으면 사용, 없으면 랜덤 또는 현재 성별 유지
        const gender = (forcedGender && forcedGender == 'male' ? 'male' : 'female') || (Math.random() < 0.5 ? 'male' : 'female');
        
        // Filter templates by chosen gender
        const genderTemplates = templates.filter(template => template.gender === gender);
        const randomTemplate = genderTemplates[Math.floor(Math.random() * genderTemplates.length)];
        console.log('Random template id:', randomTemplate.id);
        
        window.characterGender = gender.toUpperCase().charAt(0); // Set 'M' or 'F'
        window.defaultCharacterGender = window.characterGender;
        window.draftAvatar = null;
        window.draftAvatar = await createDraftAvatar(subdomain, 'fullbody', window.token, randomTemplate.id); //'fullbody-xr'
        selectedAvatarId = window.draftAvatar.data.id;
        
        // 프리셋 적용
        if (forcedGender) {
            if (forcedGender !== 'male' && forcedGender !== 'female')
            {                
                window.draftAvatar.data.assets.beardColor = "0";
                window.draftAvatar.data.assets.beardStyle = "";
                window.draftAvatar.data.assets.bottom = "146120748";
                window.draftAvatar.data.assets.eyeColor = "9781803";
                window.draftAvatar.data.assets.eyeShape = "";
                window.draftAvatar.data.assets.eyebrowColor = "0";
                window.draftAvatar.data.assets.eyebrowStyle = "41303269";
                window.draftAvatar.data.assets.faceMask = "";
                window.draftAvatar.data.assets.faceShape = "";
                window.draftAvatar.data.assets.footwear = "146120526"; //"XIzjukD6Tl-AIuznRKxLjg"
                window.draftAvatar.data.assets.glasses = "9247553";
                window.draftAvatar.data.assets.hairColor = "0";
                window.draftAvatar.data.assets.hairStyle = "16845783";
                window.draftAvatar.data.assets.headwear = "";
                window.draftAvatar.data.assets.lipShape = "";
                window.draftAvatar.data.assets.noseShape = "";
                window.draftAvatar.data.assets.outfit = "";
                window.draftAvatar.data.assets.shirt = "";
                window.draftAvatar.data.assets.skinColor = "4";
                window.draftAvatar.data.assets.skinColorHex = "#de8d6e"; //"#dea190"
                window.draftAvatar.data.assets.top = "145857239"; //"tjfdXbNjQAubq1R8TNc6iw"
                window.defaultCharacterJson = JSON.parse(JSON.stringify(window.draftAvatar.data));
            }
            else if (window.characterJson && window.characterJson.length > 4)
            {
                if (gender == 'female') {                
                    window.draftAvatar.data.assets.beardStyle = "";
                    window.draftAvatar.data.assets.beardColor ="0";
                    window.draftAvatar.data.assets.outfit = "";
                    window.characterJson.assets.beardStyle = "";
                    window.characterJson.assets.beardColor = "0";
                    window.characterJson.assets.outfit = "";
                }
                window.draftAvatar.data = JSON.parse(JSON.stringify(window.characterJson));
            }
            else {
                applyPresetToAvatar(window.draftAvatar.data, window.characterPresetIndex - 1);                
            }
        }        
        else
        {
            applyPresetToAvatar(window.draftAvatar.data, window.characterPresetIndex - 1);            
        }
                    
        await changeDraftAvatar(window.token, selectedAvatarId, window.draftAvatar.data);
        window.characterJson = JSON.parse(JSON.stringify(window.draftAvatar.data));
        window.defaultCharacterJson = JSON.parse(JSON.stringify(window.draftAvatar.data));

        // 저장 시도 (재시도 로직 포함)
        const saveResult = await saveDraftAvatarWithRetry(window.token, selectedAvatarId);
        
        if (saveResult) {
            const femaleButton = document.getElementById('femaleButton');
            const maleButton = document.getElementById('maleButton');
            if (window.characterGender === 'F') {
                femaleButton.classList.add('active');
                maleButton.classList.remove('active');
            } else {
                femaleButton.classList.remove('active');
                maleButton.classList.add('active');
            }
            setTimeout(() => {
                displayIframe();
                const modal = document.querySelector('#avatarModal');
                if (modal && modal.style.display !== 'flex') monitorAvatarUpdates();
                // 성공 시 스피너 제거
                SpinnerManager.remove('.frame-container');
            }, 1000);            
        } else {
            throw new Error('Failed to save avatar after retries');
        }
        
    } catch (error) {
        console.error('Error in start process:', error);
        
        // 오류 알림 표시
        const frameContainer = document.querySelector('.frame-container');
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = '아바타 생성 중 오류가 발생했습니다. 다시 시도해주세요.';
        frameContainer.appendChild(errorMsg);
        
        // 스피너 제거 (오류 상태에서도)
        SpinnerManager.remove('.frame-container');
        
        // 3초 후 오류 메시지 제거 및 재시도
        setTimeout(() => {
            if (errorMsg.parentNode) {
                errorMsg.parentNode.removeChild(errorMsg);
            }
            start(forcedGender);
        }, 3000);
    }
}

// 변경사항 적용 함수 개선
async function applyAssetChanges(changes) {
    if (!window.characterJson) return;
    
    stopMonitoringAvatarUpdates();
    console.log("변경 전 characterJson:", JSON.stringify(window.characterJson.assets));
    
    // 변경된 값만 저장할 객체
    const changedAssets = {};
    let hasChanges = false;

    // 변경사항 적용
    Object.keys(changes).forEach(part => {
        // API의 키 이름 규칙에 맞게 조정
        const apiKeyName = getApiKeyForPart(part);
        
        if (window.characterJson.assets[apiKeyName] && changes[part] && window.characterJson.assets[apiKeyName] !== changes[part]) {
            changedAssets[apiKeyName] = changes[part];
            hasChanges = true;
        } else {
            // 값 처리 로직 개선
            let assetValue = '';
            
            if (changes[part] === '' || changes[part] === null || changes[part] === undefined) {
                // 제거 요청
                assetValue = '';
            } else if (typeof changes[part] === 'object' && changes[part] !== null) {
                // 객체로 전달된 경우 (일반 에셋 변경)
                assetValue = changes[part].id !== undefined ? changes[part].id : '';
            } else {
                // 그 외 문자열이나 다른 값이 전달된 경우
                assetValue = String(changes[part]);
            }
            
            // 현재 값과 비교하여 변경된 경우만 처리
            const currentValue = window.characterJson.assets[apiKeyName] || '';
            
            if (currentValue !== assetValue) {
                // 실제 변경이 있는 경우만 처리
                console.log(`${part} 변경: ${currentValue} → ${assetValue}`);
                changedAssets[apiKeyName] = assetValue;
                hasChanges = true;
                
                // characterJson 업데이트
                window.characterJson.assets[apiKeyName] = assetValue;
            } else {
                console.log(`${part} 변경 없음: ${currentValue}`);
            }
        }        
    });

    // 변경 사항이 없으면 조기 종료
    if (!hasChanges) {
        console.log("변경된 에셋이 없습니다. API 호출 생략");
        monitorAvatarUpdates();
        return;
    }
    
    console.log("변경된 에셋만 API 호출:", changedAssets);
        
    try {
        // 변경된 값만 포함하는 부분 데이터 생성
        const partialData = {
            data: {
                assets: changedAssets
            }
        };
        
        // 변경된 에셋만 업데이트
        await changeDraftAvatarPartial(window.token, selectedAvatarId, partialData);
        await new Promise(resolve => setTimeout(resolve, 500));
        await saveDraftAvatarWithRetry(window.token, selectedAvatarId);
        
        // iframe 새로고침
        setTimeout(() => {
            displayIframe();
            monitorAvatarUpdates();
        }, 1000);
    } catch (error) {
        console.error("에셋 변경 중 오류 발생:", error);
        monitorAvatarUpdates();
    }
}

// API 호출용 파트 이름 변환
function getApiKeyForPart(part) {
    const mapping = {
    'hair': 'hairStyle',
    'face': 'faceShape',
    'top': 'top',
    'bottom': 'bottom',
    'footwear': 'footwear',
    'eyeColor': 'eyeColor',
    'eyeShape': 'eyeShape',
    'glasses': 'glasses',
    'headwear': 'headwear',
    'lipShape': 'lipShape',
    'noseShape': 'noseShape',
    'facewear': 'facewear',
    'beard': 'beardStyle',
    'eyebrowStyle': 'eyebrowStyle',
    'skinColor': 'skinColor',
    'hairColor': 'hairColor',
    'eyebrowColor': 'eyebrowColor'
    };
    
    return mapping[part] || part;
}

// 프리셋 적용 함수
function applyPresetToAvatar(avatarData, presetIndex) {
    if (presetIndex < 0 || presetIndex >= avatarPreset.length) {
        console.error('Invalid preset index');
        return;
    }
    
    const preset = avatarPreset[presetIndex];
    console.log(`Applying ${preset.name} (${preset.style}) style with random selections`);
    
    // 기본 속성 적용
    avatarData.assets.skinColor = '4';
    avatarData.assets.skinColorHex = '#de8d6e';
    
    // 각 파트를 랜덤하게 선택하여 적용
    if (preset.data.hair && preset.data.hair.length > 0) {
        const randomIndex = Math.floor(Math.random() * preset.data.hair.length);
        avatarData.assets.hairStyle = preset.data.hair[randomIndex];
    }
    
    if (preset.data.top && preset.data.top.length > 0) {
        const randomIndex = Math.floor(Math.random() * preset.data.top.length);
        avatarData.assets.top = preset.data.top[randomIndex];
    }
    
    if (preset.data.bottom && preset.data.bottom.length > 0) {
        const randomIndex = Math.floor(Math.random() * preset.data.bottom.length);
        avatarData.assets.bottom = preset.data.bottom[randomIndex];
    }
    
    if (preset.data.footwear && preset.data.footwear.length > 0) {
        const randomIndex = Math.floor(Math.random() * preset.data.footwear.length);
        avatarData.assets.footwear = preset.data.footwear[randomIndex];
    }
    
    if (preset.data.glasses && preset.data.glasses.length > 0) {
        const randomIndex = Math.floor(Math.random() * preset.data.glasses.length);
        avatarData.assets.glasses = preset.data.glasses[randomIndex];
    }
    
    if (preset.data.headwear && preset.data.headwear.length > 0) {
        const randomIndex = Math.floor(Math.random() * preset.data.headwear.length);
        avatarData.assets.headwear = preset.data.headwear[randomIndex];
    }
}

async function createUser() {
    const response = await fetch(`https://${subdomain}.readyplayer.me/api/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },                
        body: JSON.stringify({})
    });
    const json = await response.json();
    console.log('User created:', json);
    return json;
}

async function getAvatarTemplates(bearer_token) {
    const response = await fetch(`https://api.readyplayer.me/v2/avatars/templates`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer_token}`
        }
    });
    const json = await response.json();
    console.log('Avatar templates:', json);
    return json;
}

async function createDraftAvatar(partner, body_type, bearer_token, template_id) {            
    const response = await fetch(`https://api.readyplayer.me/v2/avatars/templates/${template_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer_token}`
        },
        body: JSON.stringify({
            "data" : {
                "partner": partner,
                "bodyType": body_type
            }                    
        })
    });
    const json = await response.json();
    console.log('Draft avatar created:', json);
    return json;
}

async function changeDraftAvatar(bearer_token, draft_avatar_id, patched_data) {
    console.log('Patched data:', patched_data);
    
    const response = await fetch(`https://api.readyplayer.me/v2/avatars/${draft_avatar_id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer_token}`
        },
        body: JSON.stringify({
            "data" : {
                "assets": {
                    ...(patched_data.assets.skinColor && { "skinColor": patched_data.assets.skinColor }),
                    ...(patched_data.assets.eyeColor && { "eyeColor": patched_data.assets.eyeColor }),
                    ...(patched_data.assets.beardColor && { "beardColor": patched_data.assets.beardColor }),
                    ...(patched_data.assets.beardStyle === '' && { "beardStyle": patched_data.assets.beardStyle })||(patched_data.assets.beardStyle && { "beardStyle": patched_data.assets.beardStyle }),
                    ...(patched_data.assets.eyebrowStyle && { "eyebrowStyle": patched_data.assets.eyebrowStyle }),
                    ...(patched_data.assets.eyebrowColor && { "eyebrowColor": patched_data.assets.eyebrowColor }),
                    ...(patched_data.assets.facewear === '' && { "facewear": patched_data.assets.facewear })||(patched_data.assets.faceWear && { "facewear": patched_data.assets.faceWear }),
                    ...(patched_data.assets.faceMask === '' && { "faceMask": patched_data.assets.faceMask })||(patched_data.assets.faceMask && { "faceMask": patched_data.assets.faceMask }),
                    ...(patched_data.assets.glasses === '' && { "glasses": patched_data.assets.glasses })||(patched_data.assets.glasses && { "glasses": patched_data.assets.glasses }),
                    ...(patched_data.assets.hairStyle && { "hairStyle": patched_data.assets.hairStyle }),
                    ...(patched_data.assets.hairColor && { "hairColor": patched_data.assets.hairColor }),
                    ...(patched_data.assets.headwear === '' && { "headwear": patched_data.assets.headwear })||(patched_data.assets.headwear && { "headwear": patched_data.assets.headwear }),
                    ...(patched_data.assets.lipShape && { "lipShape": patched_data.assets.lipShape }),
                    ...(patched_data.assets.eyeShape && { "eyeShape": patched_data.assets.eyeShape }),
                    ...(patched_data.assets.noseShape && { "noseShape": patched_data.assets.noseShape }),
                    ...(patched_data.assets.faceShape && { "faceShape": patched_data.assets.faceShape }),                            
                    ...(patched_data.assets.top && { "top": patched_data.assets.top }),
                    ...(patched_data.assets.bottom && { "bottom": patched_data.assets.bottom }),
                    ...(patched_data.assets.footwear && { "footwear": patched_data.assets.footwear }),
                    //...(patched_data.assets.skinColorHex && { "skinColorHex": patched_data.assets.skinColorHex }),
                    ...(patched_data.assets.outfit && { "outfit": '' }),//patched_data.assets.outfit }),
                }
            }                    
        })
    });
    const json = await response.json();
    console.log('Draft avatar changed:', json);
    return json;
}

// 부분 변경만 처리하는 함수
async function changeDraftAvatarPartial(bearer_token, draft_avatar_id, partialData) {
    console.log('부분 변경 데이터:', partialData);
    
    const response = await fetch(`https://api.readyplayer.me/v2/avatars/${draft_avatar_id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer_token}`
        },
        body: JSON.stringify(partialData)
    });
    
    const json = await response.json();
    console.log('부분 변경 결과:', json);
    return json;
}

async function saveDraftAvatarWithRetry(bearer_token, draft_avatar_id, maxRetries = 3, delay = 1000) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
        try {
            attempts++;
            console.log(`Attempt ${attempts} to save draft avatar...`);
            
            const response = await fetch(`https://api.readyplayer.me/v2/avatars/${draft_avatar_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${bearer_token}`
                },
                body: JSON.stringify({})
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const json = await response.json();
            console.log('Draft avatar saved:', json);
            return json;
        } 
        catch (error) {
            console.error(`Draft avatar save failed (attempt ${attempts}):`, error);
            
            if (attempts >= maxRetries) {
                console.error('Maximum retry attempts reached');
                return null;
            }
            
            // 점진적 지연 시간 증가 (1초, 2초, 4초...)
            const waitTime = delay * Math.pow(2, attempts - 1);
            console.log(`Retrying in ${waitTime/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    return null; // 최대 재시도 횟수를 초과한 경우
}

function monitorAvatarUpdates(SkipOnFirstCheck = false, avatar_id = null, checkInterval = 200) {
    AvatarMonitor.startMonitoring(SkipOnFirstCheck, avatar_id, checkInterval);
}

function stopMonitoringAvatarUpdates() {
    AvatarMonitor.stopMonitoring();
    return Promise.resolve(); // 기존 코드와의 호환성 유지
}

// 업데이트된 아바타 처리 함수
function processUpdatedAvatar(avatarData) {
    console.log('업데이트된 아바타 처리 시작:', avatarData);

    // 모달이 이미 열려있는지 확인
    const modal = document.querySelector('#avatarModal');
    if (modal && modal.style.display === 'flex') return;

    // 필요한 데이터 설정
    // selectedAvatarId = avatarData.id;
    // window.characterGender = avatarData.outfitGender;
    modelJSON = avatarData;
    avatarGLBUrl = `https://models.readyplayer.me/${avatarData.id}.glb`;

    // 성공 알림 표시
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = '캐릭터가 준비되었습니다!';
    document.querySelector('.frame-container').appendChild(notification);

    // iframe 갱신은 선택적으로
    // displayIframe();

    if (notification.parentNode) notification.remove();
    if (modal && modal.style.display === 'flex') return;
    openModal();
}

async function getPermanentAvatar(bearer_token = null, avatar_id = null) {    
    const response = await fetch(getavatarGLBUrl(), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer_token}`
        }
    });
    const json = await response.json();
    console.log('Permanent avatar:', json);
    return json;
}

function displayIframe() {
    document.getElementById('exportButton').style.display = 'none';
    document.getElementById('modalClose').style.display = 'none';
    
    if (window.token) {
        if (subdomain) {
            frame.src = `https://${subdomain}.readyplayer.me/${language}/avatar?frameApi&token=${window.token}&id=${selectedAvatarId}`;
        }
        else
        {
            frame.src = `https://readyplayer.me/${language}/avatar?frameApi&token=${window.token}&id=${selectedAvatarId}`;
        }                
    }
    else
    {
        if (subdomain) {
            frame.src = `https://${subdomain}.readyplayer.me/${language}/avatar?frameApi&id=${selectedAvatarId}`;
        }
        else
        {
            frame.src = `https://readyplayer.me/${language}/avatar?frameApi&id=${selectedAvatarId}`;
        }                
    }

    console.log('Frame URL:', frame.src);
    document.getElementById('frame').hidden = false;            
}        

function subscribe(event) {
    const json = parse(event);
    if (json?.source !== 'readyplayerme') {
        return;
    }

    if (json.eventName === 'v1.frame.ready') {                                
        console.log('Frame is ready.');
        const frame = document.getElementById('frame');
        frame.contentWindow.postMessage(
            JSON.stringify({
                target: 'readyplayerme',
                type: 'subscribe',
                eventName: 'v1.**'
            }),
            '*'
        );
    }

    if (json.eventName === 'v1.subscription.created') {                
        console.log('Subscription created.');
        const blockOverlay1 = document.querySelector('.block-overlay-1');
        const blockOverlay2 = document.querySelector('.block-overlay-2');
        setTimeout(() => {                    
            blockOverlay1.style.backgroundColor = "rgba(246, 246, 246, 1)";
            blockOverlay1.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" style="width: 70%;height: 70%;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1"> <path d="M921.6 585.728c0 226.304-184.32 409.6-409.6 409.6s-409.6-182.272-409.6-409.6c0-78.848 21.504-152.576 62.464-215.04l133.12 76.8c-25.6 39.936-39.936 87.04-39.936 138.24 0 142.336 114.688 254.976 254.976 254.976 142.336 0 257.024-114.688 257.024-254.976 0-118.784-79.872-219.136-189.44-247.808v131.072L196.608 248.832 577.536 28.672v151.552C772.096 214.016 921.6 381.952 921.6 585.728z" fill="#3ADAEA"/> </svg>`
            blockOverlay2.style.backgroundColor = "rgba(246, 246, 246, 1)";
        }, 2000);

        const modal = document.querySelector('#avatarModal');
        if (!(modal && modal.style.display === 'flex')) {
            if (aiChatInput) {
                aiChatInput.disabled = false;
                setTimeout(() => {
                    aiChatInput.focus();
                }, 300);
            }
        }
    }

    if (json.eventName === 'v1.subscription.deleted') {
        console.log('Subscription deleted.');                
    }

    if (json.eventName === 'v1.user.set') {
        console.log(`User with id ${json.data.id} set: ${JSON.stringify(json)}`);                
    }

    if (json.eventName === 'v1.user.updated') {
        console.log(`User with id ${json.data.id} updated: ${JSON.stringify(json)}`);
    }

    if (json.eventName === 'v1.user.logout') {
        console.log(`User with id ${json.data.id} logged out: ${JSON.stringify(json)}`);                
    }

    if (json.eventName === 'v1.user.authorized') {
        console.log(`User with id ${json.data.id} authorized: ${JSON.stringify(json)}`);                
    }
    
    console.log(json);            

    if (json.eventName === 'v1.avatar.exported') {
        avatarExported = true;
        const aiChatModal = document.getElementById('aiChatModal');
        if (aiChatModal) aiChatModal.style.display = 'none';
        modal.style.display = 'flex';
        frameOverlay.style.display = 'flex';
        avatarGLBUrl = json.data.url;
        console.log('Avatar GLB URL:', avatarGLBUrl);

        // .glb URL을 .json으로 변경
        const jsonUrl = avatarGLBUrl.replace(/\.glb$/, '.json');

        // JSON 데이터 가져오기
        fetch(jsonUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('JSON 파일을 불러오는 데 실패했습니다.');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                // selectedAvatarId = data.id;
                // displayIframe();
                // window.characterGender = data.outfitGender; // JSON 구조에 따라 적절히 수정
                // console.log('캐릭터 성별:', window.characterGender);
                modelJSON = data;                
                openModal();
            })
            .catch(error => {
                console.error('JSON 데이터를 가져오는 중 오류 발생:', error);
                // 기본 애니메이션 로드
                openModal();                        
            });
    }

    if (json.eventName === 'v1.user.set') {
        console.log(`User with id ${json.data.id} set: ${JSON.stringify(json)}`);
    }
}

function parse(event) {
    try {
        return JSON.parse(event.data);
    } catch (error) {
        return null;
    }
}

function createLoadingSpinner() {
    // 기존 스피너가 있다면 제거
    if (document.getElementById('loadingSpinner')) {
        document.getElementById('loadingSpinner').remove();
    }
    
    // 새 스피너 생성
    return SpinnerManager.create('.modal-content', 'loadingSpinner');
}

window.openModal = openModal;

function openModal() {
    displayIframe();    
    // const aiChatModal = document.getElementById('aiChatModal');
    // if (aiChatModal) aiChatModal.style.display = 'none';
    modal.style.display = 'flex';
    stopMonitoringAvatarUpdates();
    
    // 모달 로딩 스피너 생성
    createLoadingSpinner();
    
    // 타임아웃 설정 (로딩이 30초 이상 지속되면 오류 처리)
    const loadingTimeout = setTimeout(() => {
        console.error('Modal loading timeout');
        SpinnerManager.remove('.modal-content');
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'modal-error';
        errorMsg.textContent = '모델을 불러오지 못했습니다. 다시 시도해주세요.';
        modal.querySelector('.modal-content').appendChild(errorMsg);
    }, 30000);
    
    // 모델 로드 시도
    loadAvatarModal(avatarGLBUrl+'?lod=0')
        .then(() => loadAllAnimations(window.characterGender, true))
        .then(() => {
            clearTimeout(loadingTimeout); // 타임아웃 취소
            document.getElementById('exportButton').style.display = 'inline-block';
            document.getElementById('modalClose').style.display = 'inline-block';
            SpinnerManager.remove('.modal-content');
            serializeAvatarModalModel(avatarModalModel);
        })
        .catch(error => {
            clearTimeout(loadingTimeout); // 타임아웃 취소
            console.error('Error loading avatar model:', error);
            SpinnerManager.remove('.modal-content');
            
            const errorMsg = document.createElement('div');
            errorMsg.className = 'modal-error';
            errorMsg.textContent = '모델을 불러오지 못했습니다. 다시 시도해주세요.';
            modal.querySelector('.modal-content').appendChild(errorMsg);
        });
    
    // 나머지 설정 계속 진행    
    initModalScene();
    animateModal();    
    // 데이터 태그에 값 설정
    document.getElementById('avatarGLBUrlData').setAttribute('value', avatarGLBUrl);
    document.getElementById('modelJSONData').setAttribute('value', JSON.stringify(modelJSON));
}

/**
 * avatarModalModel을 JSON 문자열로 변환하는 함수
 * @param {THREE.Object3D} model - THREE.js Object3D 모델
 * @returns {string} - JSON 문자열
 */
    function serializeAvatarModalModel(model) {
    if (!model) return '';

    console.log('Serializing avatar modal model...');
    const exporter = new GLTFExporter();
    let serialized = '';

    exporter.parse(model, function (result) {
        serialized = JSON.stringify(result, null, 2);                
        document.getElementById('avatarModalModelData').value = serialized;
    }, { binary: false });
}

function initModalScene() {
    const canvas = document.getElementById('modalCanvas');
    modalRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    modalRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
    modalRenderer.setPixelRatio(window.devicePixelRatio);

    modalScene = new THREE.Scene();
    modalScene.background = new THREE.Color(0xf0f0f5); // 부드러운 파스텔 배경으로 변경

    modalCamera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    modalCamera.position.set(0, 2, 4);

    modalControls = new OrbitControls(modalCamera, modalRenderer.domElement);
    modalControls.enablePan = false;
    modalControls.minDistance = 1.5;
    modalControls.maxDistance = 5;
    modalControls.maxPolarAngle = Math.PI / 2;
    modalControls.minPolarAngle = 0;
    modalControls.rotateSpeed = 0.5;
    modalControls.zoomSpeed = 0.6;
    modalControls.target.set(0, 0.75, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // 밝기 감소
    modalScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xe5e5e5, 0.7); // 부드러운 색상
    directionalLight.position.set(5, 5, 7.5);
    directionalLight.castShadow = false;
    modalScene.add(directionalLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
    dirLight.position.set(-8, 12, 8);
    dirLight.castShadow = true;            
    modalScene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
    hemiLight.position.set(0, 50, 0);
    modalScene.add(hemiLight);
    modalRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    modalRenderer.toneMappingExposure = 1.7;

    modalClock = new THREE.Clock();
    window.addEventListener('resize', onModalWindowResize, false);
}

function onModalWindowResize() {
    const canvas = document.getElementById('modalCanvas');
    modalCamera.aspect = canvas.clientWidth / canvas.clientHeight;
    modalCamera.updateProjectionMatrix();
    modalRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

function animateModal() {
    requestAnimationFrame(animateModal);
    const delta = modalClock.getDelta();
    if (modalMixer) modalMixer.update(delta);
    modalControls.update();
    modalRenderer.render(modalScene, modalCamera);
}

async function loadAvatarModal(url) {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            function(gltf) {
                if (avatarModalModel) {
                    modalScene.remove(avatarModalModel);
                }
                avatarModalModel = gltf.scene;
                modalScene.add(avatarModalModel);

                // modalMixer를 아바타 모델 로드 후 애니메이션 유무와 상관없이 생성
                modalMixer = new THREE.AnimationMixer(avatarModalModel);

                // 아바타 GLB 내부에 애니메이션이 있다면 재생 (선택사항)
                if (gltf.animations && gltf.animations.length > 0) {
                    gltf.animations.forEach((clip) => {
                        modalMixer.clipAction(clip).play();
                    });
                }

                console.log('Avatar loaded into modal.');
                resolve();
            },
            undefined,
            function(error) {
                console.error('An error occurred while loading the avatar into modal:', error);
                reject(error);
            }
        );
    });
}

// Base64 to Blob conversion utility
function base64ToBlob(base64, mime) {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
}

// loadAllAnimations() 호출 시점에는 이미 모델 본 이름이 변경되어 있으므로,
// 여기서 필터링이 정상적으로 동작하고 Idle 애니메이션이 일치하는 본을 찾을 수 있음.
async function loadAllAnimations(gender, excludeIdle = false) {
    let commonAnimations, extendAnimations, idleAnimation;

    if (gender.toLowerCase().startsWith('m')) {
        idleAnimation = animationFiles_M_Idle_Base64;
        commonAnimations = animationFiles_M_Common_Base64;
        extendAnimations = animationFiles_M_Extend_Base64;
    } else if (gender.toLowerCase().startsWith('f')) {
        idleAnimation = animationFiles_F_Idle_Base64;
        commonAnimations = animationFiles_F_Common_Base64;
        extendAnimations = animationFiles_F_Extend_Base64;
    } else {
        console.warn('알 수 없는 성별입니다. 기본 애니메이션을 로드합니다.');
        idleAnimation = animationFiles_M_Idle_Base64; // 기본 Idle 애니메이션
        commonAnimations = animationFiles_M_Common_Base64; // 기본값 설정
        extendAnimations = animationFiles_M_Extend_Base64;
    }

    // 기본 Idle 애니메이션 로드
    try {
        const blob = base64ToBlob(idleAnimation[0].data, 'model/gltf-binary');
        const url = URL.createObjectURL(blob);

        const gltf = await new GLTFLoader().loadAsync(url);
        if (gltf.animations) {
            gltf.animations[0].name = 'Idle';
            animationClips.push(gltf.animations[0]);
        }

        URL.revokeObjectURL(url);
        console.log('Idle Animation Loaded');
    } catch (error) {
        console.error('Error loading idle animation:', error);
    }
    if (modalMixer && animationClips.length > 0) {
        const idleClip = animationClips.find(clip => clip.name === 'Idle');
        if (idleClip) {
            const idleAction = modalMixer.clipAction(idleClip);
            idleAction.play();
        }
    }

    // 공통 애니메이션 로드
    for (const anim of commonAnimations) {
        if (excludeIdle && anim.name.toLowerCase().includes('idle')) {
            continue; // Idle 애니메이션 제외
        }                
        try {
            const blob = base64ToBlob(anim.data, 'model/gltf-binary');
            const url = URL.createObjectURL(blob);

            const gltf = await new GLTFLoader().loadAsync(url);
            if (gltf.animations && gltf.animations.length > 0) {
                gltf.animations.forEach((clip) => {
                    clip.name = anim.name;
                    animationClips.push(clip);
                });
            }

            URL.revokeObjectURL(url);
            console.log('Common Animations Loaded');
        } catch (error) {
            console.error(`Error loading animation from ${anim.name}:`, error);
        }
    }

    // 추가 애니메이션 로드
    for (const anim of extendAnimations) {
        if (excludeIdle && anim.name.toLowerCase().includes('idle')) {
            continue; // Idle 애니메이션 제외
        }
        try {
            const blob = base64ToBlob(anim.data, 'model/gltf-binary');
            const url = URL.createObjectURL(blob);

            const gltf = await new GLTFLoader().loadAsync(url);
            if (gltf.animations && gltf.animations.length > 0) {
                gltf.animations.forEach((clip) => {
                    clip.name = anim.name;
                    animationClips.push(clip);
                });
            }

            URL.revokeObjectURL(url);
            console.log('Extend Animations Loaded');
        } catch (error) {
            console.error(`Error loading animation from ${anim.name}:`, error);
        }
    }

    if (avatarModalModel) {
        const boneNames = getBoneNames(avatarModalModel);
        validAnimations = filterValidAnimations(animationClips, boneNames);
        console.log('Valid Animations:', validAnimations.map(clip => clip.name));
    }
}

function getBoneNames(model) {
    const boneNames = new Set();
    model.traverse((node) => {
        if (node.isBone) {
            boneNames.add(node.name);
        }
    });
    return boneNames;
}

function filterValidAnimations(animations, boneNames) {
    const filteredClips = [];

    animations.forEach((clip) => {
        const filteredTracks = clip.tracks.filter((track) => {
            const boneName = track.name.split('.')[0];
            return boneNames.has(boneName);
        });

        if (filteredTracks.length > 0) {
            const filteredClip = new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
            filteredClips.push(filteredClip);
        } else {
            console.warn(`Animation "${clip.name}" has no valid tracks and was skipped.`);
        }
    });

    return filteredClips;
}

export async function exportGLB() {
    if (!avatarModalModel) {
        alert('No avatar loaded to export.');
        throw new Error('No avatar loaded to export.');
    }

    // 필터링 로직은 그대로 유지
    console.log('노드 이름을 변경합니다...');
    avatarModalModel.name = 'AvatarRoot';

    avatarModalModel.traverse((node) => {
        if (node.name === 'Wolf3D_Body') node.name = 'Hand';
        else if (node.name === 'Wolf3D_Hair') node.name = 'Hair';
        else if (node.name === 'Wolf3D_Head') node.name = 'Head';
        else if (node.name === 'Wolf3D_Outfit_Bottom') node.name = 'Leg';
        else if (node.name === 'Wolf3D_Outfit_Footwear') node.name = 'Foot';
        else if (node.name === 'Wolf3D_Outfit_Top') node.name = 'Body';
        else if (node.name.startsWith('Wolf3D_')) {
            node.name = node.name.replace('Wolf3D_', '');
        }
    });

    console.log('본 이름을 수집합니다...');
    const boneNames = new Set();
    avatarModalModel.traverse((node) => {
        if (node.isBone) {
            boneNames.add(node.name);
        }
    });
    console.log('수집된 본 이름:', Array.from(boneNames));

    console.log('애니메이션 클립을 필터링하고 트랙 이름을 업데이트합니다...');
    const filteredAnimations = animationClips.map(originalClip => {
        const clip = originalClip.clone();
        const filteredTracks = clip.tracks.filter(track => {
            const boneName = track.name.split('.')[0];
            return boneNames.has(boneName);
        }).map(track => {
            const parts = track.name.split('.');
            if (parts.length > 1) {
                const boneName = parts[0];
                const newBoneName = boneName.startsWith('Wolf3D_') ? boneName.replace('Wolf3D_', '') : boneName;
                parts[0] = newBoneName;
                const newTrack = track.clone();
                newTrack.name = parts.join('.');
                return newTrack;
            }
            return track;
        });

        if (filteredTracks.length > 0) {
            return new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
        }
        return null;
    }).filter(clip => clip !== null);

    const exporter = new GLTFExporter();
    // parse 메서드 사용 - 콜백 방식
    return new Promise((resolve, reject) => {
        exporter.parse(
            avatarModalModel,
            (result) => {
                console.log('GLB 익스포트가 완료되었습니다.');
                let output;
                if (result instanceof ArrayBuffer) {
                    output = result;
                } else {
                    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                    output = blob;
                }

                const blob = new Blob([output], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'avatar.glb';
                link.click();
                URL.revokeObjectURL(url);
                
                resolve(modelJSON);
            },
            {
                binary: true,
                onlyVisible: false,
                animations: filteredAnimations
            }
        );
    });
}

function GetModelJSON() {
    return modelJSON;
}

function GetAvatarGLBUrl() {
    return avatarGLBUrl;
}

function GetModelGLB() {
    return avatarModalModel;
}

// 모듈 스크립트의 exportGLB 함수를 전역 객체에 할당
window.exportGLB = exportGLB;
window.GetModelJSON = GetModelJSON;
window.GetModelGLB = GetModelGLB;
window.GetAvatarGLBUrl = GetAvatarGLBUrl;

// 전역 에러 핸들러 추가
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    
    // 어떤 오류가 발생하더라도 모든 스피너 제거
    SpinnerManager.removeAll();
    
    // 사용자에게 알림
    const errorToast = document.createElement('div');
    errorToast.className = 'error-toast';
    errorToast.innerHTML = '오류가 발생했습니다. 페이지를 새로고침해 주세요.';
    document.body.appendChild(errorToast);
    
    // 5초 후 알림 제거
    setTimeout(() => {
        if (errorToast.parentNode) {
            errorToast.parentNode.removeChild(errorToast);
        }
    }, 5000);
});
