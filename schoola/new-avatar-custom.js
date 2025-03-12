const frameContainer = document.querySelector('.frame-container');
frameContainer.style.setProperty('--width-in-pixels', window.innerWidth);
window.addEventListener('resize', function() {
    frameContainer.style.setProperty('--width-in-pixels', window.innerWidth);           ;
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
import { avatarPreset } from 'https://arms00.github.io/schoola/preset.js'; // 아바타 프리셋 데이터, 배포시 수정 필요
import animations from 'https://arms00.github.io/customAnimations.js';
const { 
    animationFiles_M_Idle_Base64,
    animationFiles_F_Idle_Base64,
    animationFiles_M_Common_Base64,
    animationFiles_F_Common_Base64,
    animationFiles_M_Extend_Base64,
    animationFiles_F_Extend_Base64 
} = animations;

let avatarGLBUrl = '';
let modalScene, modalCamera, modalRenderer, modalControls, modalMixer, modalClock;
let avatarModalModel;
let modelJSON = null;
let animationClips = [];
let validAnimations = [];
let actions = {}; // 애니메이션 액션들을 저장할 객체
let characterGender = 'F'; // 기본 성별 설정
let selectedAvatarId = 'new';
// let previousAvatarId = null;
let language = 'kr'; // or 'en'
window.token = null;
// 원하는 프리셋 인덱스 설정 (1~5)
window.characterPresetIndex = 3; // 예: 1=아카데믹, 2=에너제틱, 3=단정캐주얼, 4=크리에이티브, 5=퓨처리스틱


const subdomain = 'school-metaverse';        
const apiKey = 'sk_live_nv5h5OeBk95WlymTeQsiebUAAxMvKgFf-a1c';
const hashdefault = "DGEiAIc3F0A4IwWMrauDE1N0JJZlryt2MRWuZl1eJREmpGEaYJgbBGE1G3cvomMRZUqFI0g5F19jn1WZIGp2HHA0nT1cIQAhHzSXEzgvoRVmIQS1rRf0FyuWMT55YISiEmMkH3MBMy9aDIc3YKIMZxMMGF00E0MZGz5SGHWjMaEHH2y2LIE1ZR1gETIQF0D2AwMcHHLkAwR2ImW1YJcipaNgn3Z=";    
const fetchStr = "aHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MS9jaGF0L2NvbXBsZXRpb25z";
const appId = '673aa4ca396ed1e04e138cb2';
const frame = document.getElementById('frame');
const frameOverlay = document.getElementById('frame-overlay');
const avatarID = document.getElementById('avatarUrl');
const closeButton = document.querySelector('.modal-content>.close-button');

window.addEventListener('message', subscribe);        

window.start = start;
window.setPreset = setPreset;
window.characterJson = null;
window.strCode = hashdefault;
window.characterGender = characterGender;
window.fetchStr = fetchStr;
window.applyAssetChanges = applyAssetChanges;

async function start(forcedGender = null, avatarJson = null) {
    console.log('Starting...: ', window.characterPresetIndex);
    // Create and display the loading spinner

    const frameContainer = document.querySelector('.frame-container');
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    frameContainer.appendChild(spinner);
    
    // Remove spinner when frame is ready
    // const removeSpinner = () => {
    //     if (spinner && spinner.parentNode) {
    //         spinner.parentNode.removeChild(spinner);
    //     }
    // };
    const userJson = await createUser();
    window.token = userJson.data.token;
    const avatarTemplates = await getAvatarTemplates(window.token);
    const templates = avatarTemplates.data;
    
    // 성별 설정 - 강제 성별이 있으면 사용, 없으면 랜덤 또는 현재 성별 유지
    const gender = forcedGender || (Math.random() < 0.5 ? 'male' : 'female');

    // Filter templates by chosen gender
    const genderTemplates = templates.filter(template => template.gender === gender);
    // Randomly select one template from filtered list
    const randomTemplate = genderTemplates[Math.floor(Math.random() * genderTemplates.length)];
    // Use this template's ID
    console.log('Random template id:', randomTemplate.id);
    characterGender = gender.toUpperCase().charAt(0); // Set 'M' or 'F'
    window.draftAvatar = null;
    draftAvatar = await createDraftAvatar(subdomain, 'fullbody-xr', window.token, randomTemplate.id);
    selectedAvatarId = window.draftAvatar.data.id;

    // 프리셋 적용
    applyPresetToAvatar(window.draftAvatar.data, window.characterPresetIndex - 1); // 배열은 0부터 시작하므로 -1
    
    await changeDraftAvatar(window.token, selectedAvatarId, window.draftAvatar.data);    
    window.characterJson = window.draftAvatar.data;
    console.log('Draft avatar patched:', window.draftAvatar.data);

    setTimeout(async () => {
        const ret = await saveDraftAvatar(window.token, selectedAvatarId);        
        if (!ret) {
            console.error('Draft avatar save failed.');
            start(forcedGender, avatarJson);
            return;
        }
        updateGenderButtons();
        displayIframe();
        spinner.remove();                
    }, 1000);
    createLoadingSpiiner();
    
    function updateGenderButtons() {
        const femaleButton = document.getElementById('femaleButton');
        const maleButton = document.getElementById('maleButton');
        if (characterGender === 'F') {
            femaleButton.classList.add('active');
            maleButton.classList.remove('active');
        } else {
            femaleButton.classList.remove('active');
            maleButton.classList.add('active');
        }
    }
}

start();

// 변경사항 적용 함수 개선
// 변경사항 적용 함수 개선
async function applyAssetChanges(changes) {
    if (!window.characterJson) return;
    
    console.log("변경 전 characterJson:", JSON.stringify(window.characterJson.assets));
    
    // 변경사항 적용
    Object.keys(changes).forEach(part => {
        // API의 키 이름 규칙에 맞게 조정
        const apiKeyName = getApiKeyForPart(part);
        
        // 값 처리 로직 개선
        let assetValue = '';
        
        if (changes[part] === '') {
            // 직접 빈 문자열이 전달된 경우 (제거 요청)
            assetValue = '';
        } else if (changes[part] === null || changes[part] === undefined) {
            // null 또는 undefined인 경우 빈 문자열로 처리 (제거 요청)
            assetValue = '';
        } else if (typeof changes[part] === 'object' && changes[part] !== null) {
            // 객체로 전달된 경우 (일반 에셋 변경)
            assetValue = changes[part].id !== undefined ? changes[part].id : '';
        } else {
            // 그 외 문자열이나 다른 값이 전달된 경우
            assetValue = String(changes[part]);
        }
        
        // characterJson에 값 설정
        window.characterJson.assets[apiKeyName] = assetValue;
        
        // 디버깅 로그 추가
        console.log(`${part} 변경: ${assetValue} (API 키: ${apiKeyName})`);
    });
    
    console.log("변경 후 characterJson:", JSON.stringify(window.characterJson.assets));
    
    // 변경된 내용으로 아바타 업데이트
    await changeDraftAvatar(window.token, selectedAvatarId, window.characterJson);

    await new Promise(resolve => setTimeout(resolve, 500));
    
    await saveDraftAvatar(window.token, selectedAvatarId);
    
    // iframe 새로고침
    setTimeout(() => {            
        displayIframe();
    }, 1000);
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
                    ...(patched_data.assets.beardStyle && { "beardStyle": patched_data.assets.beardStyle })||(patched_data.assets.beardStyle === "" && { "beardStyle": patched_data.assets.beardStyle }),
                    ...(patched_data.assets.eyebrowStyle && { "eyebrowStyle": patched_data.assets.eyebrowStyle }),
                    ...(patched_data.assets.eyebrowColor && { "eyebrowColor": patched_data.assets.eyebrowColor }),
                    ...(patched_data.assets.faceWear && { "facewear": patched_data.assets.faceWear })||(patched_data.assets.facewear === "" && { "facewear": patched_data.assets.facewear }),
                    ...(patched_data.assets.faceMask && { "faceMask": patched_data.assets.faceMask })||(patched_data.assets.faceMask === "" && { "faceMask": patched_data.assets.faceMask }),
                    ...(patched_data.assets.glasses && { "glasses": patched_data.assets.glasses })||(patched_data.assets.glasses === "" && { "glasses": patched_data.assets.glasses }),
                    ...(patched_data.assets.hairStyle && { "hairStyle": patched_data.assets.hairStyle }),
                    ...(patched_data.assets.hairColor && { "hairColor": patched_data.assets.hairColor }),
                    ...(patched_data.assets.headwear && { "headwear": patched_data.assets.headwear })||(patched_data.assets.headwear === "" && { "headwear": patched_data.assets.headwear }),
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

async function saveDraftAvatar(bearer_token, draft_avatar_id) {
    try {
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
            return null;
        }
        
        const json = await response.json();
        console.log('Draft avatar saved:', json);
        return json;
    }
    catch (error) {
        console.error('Draft avatar save failed:', error);
        console.log('Retrying in 0.5 second...');        
        return null;
    }
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
        
const modal = document.getElementById('avatarModal');        
const swSwitch = document.getElementById('sw-switch');

swSwitch.addEventListener('click', function(event) {            
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

closeButton.addEventListener('click', function(event) {
    console.log('Close button clicked.');
    modal.style.display = 'none';
    document.getElementById('exportButton').style.display = 'none';
    document.getElementById('modalClose').style.display = 'none';
    createLoadingSpiiner();
    document.getElementById('frame-overlay').style.display = 'none';
    animationClips = [];
    validAnimations = [];
    actions = {};    
    modelJSON = null;               
    avatarGLBUrl = '';            
    document.getElementById('avatarGLBUrlData').value = '';
    document.getElementById('modelJSONData').value = '';
    document.getElementById('avatarModalModelData').value = '';
    if (avatarModalModel) {
        modalScene.remove(avatarModalModel);
        avatarModalModel = null;
    }
    if (modalMixer) {
        try{
            modalMixer.uncacheRoot(avatarModalModel);
        }                
        catch (error) {
            console.error('모델 캐시 제거 중 오류 발생:', error);
        }
        modalMixer = null;
    }                          
});

function subscribe(event) {
    const json = parse(event);
    if (json?.source !== 'readyplayerme') {
        return;
    }

    if (json.eventName === 'v1.frame.ready') {                                
        console.log('Frame is ready.');
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
                selectedAvatarId = data.id;
                displayIframe();
                characterGender = data.outfitGender; // JSON 구조에 따라 적절히 수정
                modelJSON = data;
                console.log('캐릭터 성별:', characterGender);
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

function createLoadingSpiiner() {
    // Create and display the loading spinner            
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.id = 'loadingSpinner';
    modal.querySelector('.modal-content').appendChild(spinner);
}

function openModal() {            
    modal.style.display = 'flex';

    loadAvatarModal(avatarGLBUrl+'?lod=0').then(() => {
        loadAllAnimations(characterGender, true);
    }).finally(() => {                
        document.getElementById('exportButton').style.display = 'inline-block';
        document.getElementById('modalClose').style.display = 'inline-block';
        // Remove the loading spinner after loading is complete
        if (document.getElementById('loadingSpinner')) 
        {                    
            document.getElementById('loadingSpinner').remove();
        }
        serializeAvatarModalModel(avatarModalModel);
    });                      
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

// 모듈 스크립트의 exportGLB 함수를 전역 객체에 할당
window.exportGLB = exportGLB;

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

window.addEventListener('exportGLBEvent', () => {
    exportGLB();
});

window.addEventListener('getModelJSONEvent', () => {
    GetModelJSON();
});

window.addEventListener('getModelGLBEvent', () => {
    GetModelGLB();
});

window.addEventListener('getAvatarGLBUrlEvent', () => {
    GetAvatarGLBUrl();
});

