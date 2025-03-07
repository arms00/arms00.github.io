// 모든 파트 데이터를 저장할 전역 객체
const assetCatalog = {
    hair: [],
    face: [],
    top: [],
    bottom: [],
    footwear: [],
    eyeColor: [],
    eyeShape: [],
    glasses: [],
    headwear: [],
    lipShape: [],
    noseShape: [],
    facewear: [],
    beard: [],
    eyebrowStyle: []
};
  
// 페이지 로드 시 모든 파트 데이터 미리 로드
async function preloadAllAssetData() {
    console.log('모든 에셋 데이터 사전 로드 중...');
    
    const partNames = Object.keys(assetCatalog);
    const loadPromises = partNames.map(async (part) => {
      try {
        const response = await fetch(`https://arms00.github.io/schoola/asset_data/${part}.json`);
        if (response.ok) {
          const data = await response.json();
          assetCatalog[part] = Array.isArray(data) ? data : [data];
          console.log(`${part} 데이터 로드 완료: ${assetCatalog[part].length}개 항목`);
          
          // ID 속성 확인 및 추가
          assetCatalog[part].forEach((item, index) => {
            if (!item.id && item.assetId) {
              item.id = item.assetId; // id 속성이 없고 assetId가 있으면 복사
            }
            
            // 그래도 id가 없으면 로그 출력
            if (!item.id) {
              console.warn(`${part} 데이터의 ${index}번 항목에 id가 없습니다:`, item);
            }
          });
        } else {
          console.warn(`${part}.json 로드 실패: ${response.status}`);
          assetCatalog[part] = []; // 빈 배열로 초기화
        }
      } catch (error) {
        console.error(`${part} 데이터 로드 오류:`, error);
        assetCatalog[part] = []; // 오류 발생 시 빈 배열로 초기화
      }
    });
    
    await Promise.all(loadPromises);
    console.log('모든 에셋 데이터 로드 완료!');
  }


// ID 찾기 함수 - AI API 호출
async function findBestAssetId(part, description) {
    // 이미 로드된 파트 데이터 사용
    const partData = assetCatalog[part] || [];
    console.log(`${part} 데이터 항목 수:`, partData.length);

    // partData가 비어있으면 폴백 ID 반환
    if (partData.length === 0) {
        console.warn(`${part} 데이터가 없어 기본값 사용`);
        return getFallbackAssetId(part);
    }

    const response = await callOpenAI({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `주어진 설명과 가장 일치하는 에셋의 ID를 선택하세요. JSON 데이터는 다음과 같습니다: ${JSON.stringify(partData)}`
            },
            {
                role: "user",
                content: `"${description}" 설명과 가장 잘 맞는 에셋의 ID만 반환하세요.`
            }
        ]
    });
    
    const assetId = response.choices[0].message.content.trim().replace(/['"]/g, '');
    console.log(`${part}에 대한 AI 추천 ID:`, assetId);
    
    // ID 유효성 검증 - 간소화된 버전
    const isValid = partData.some(item => String(item.id || '') === assetId);
    if (isValid) {
        console.log(`유효한 ID 확인: ${assetId} (${part})`);
        return assetId;
    } else {
        console.warn(`유효하지 않은 ID: ${assetId}, 파트: ${part}. 기본값 사용`);
        return getFallbackAssetId(part);
    }
}

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
const appId = '673aa4ca396ed1e04e138cb2';
const frame = document.getElementById('frame');
const frameOverlay = document.getElementById('frame-overlay');
const avatarID = document.getElementById('avatarUrl');

const closeButton = document.querySelector('.modal-content>.close-button');

window.addEventListener('message', subscribe);        

window.start = start;
window.setPreset = setPreset;
window.charaterJson = null;

async function callOpenAI(params) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${slpitString()}`
            },
            body: JSON.stringify(params)
        });
        if (!response.ok) {
            throw new Error(`API 오류: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('OpenAI API 호출 오류:', error);
        throw error;
    }
}

// AI 대화창 기능 구현
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Window size:', window.innerWidth, 'x', window.innerHeight);
    console.log('Device pixel ratio:', window.devicePixelRatio);
    console.log('User agent:', navigator.userAgent);
    
    // 모든 에셋 데이터 미리 로드
    await preloadAllAssetData();
    
    // 요소 참조
    const aiButton = document.getElementById('aiToggleBtn');
    const aiChatModal = document.getElementById('aiChatModal');
    const aiChatClose = document.getElementById('aiChatClose');
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatSend = document.getElementById('aiChatSend');
    const aiChatMessages = document.getElementById('aiChatMessages');
    const aiChatHeader = document.querySelector('.ai-chat-header');    

    // 챗 모달 표시 및 우측 위치 설정 (처음에)
    // aiButton.addEventListener('click', () => {
    //     aiChatModal.style.display = 'block';
    //     // 기존 위치 복원 또는 기본 위치(우측) 설정
        
    //     if (!aiChatModal.style.top || !aiChatModal.style.right) {
    //     // aiChatModal.style.top = '100px';
    //     aiChatModal.style.right = '2%';
    //     aiChatModal.style.left = 'auto'; // left를 해제하고 right 사용
    //     }
    // });
    
    // 닫기 버튼
    document.getElementById('aiChatClose').addEventListener('click', () => {
        aiChatModal.style.display = 'none';
    });

    // 드래그 관련 변수
    let isDragging = false;
    let offsetX, offsetY;

    // 마우스 다운 이벤트 - 드래그 시작
    aiChatHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        
        // 현재 창의 위치를 기준으로 마우스 위치의 차이 계산
        const rect = aiChatModal.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        // 드래그 중 커서 스타일 변경
        aiChatHeader.style.cursor = 'grabbing';
    });

    // 마우스 움직임 이벤트 - 드래그 중
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // 새로운 위치 계산
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // 창이 화면 밖으로 나가지 않도록 제한
        const maxX = window.innerWidth - aiChatModal.offsetWidth;
        const maxY = window.innerHeight - aiChatModal.offsetHeight;
        
        // 위치 설정 (좌측 기준으로 설정)
        aiChatModal.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
        aiChatModal.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
        aiChatModal.style.right = 'auto'; // left로 위치 제어 시 right 해제
    });

    // 마우스 업 이벤트 - 드래그 종료
    document.addEventListener('mouseup', () => {
        if (isDragging) {
        isDragging = false;
        aiChatHeader.style.cursor = 'move';
        }
    });
    
    // 마우스가 창 밖으로 나갔을 때도 드래그 종료
    document.addEventListener('mouseleave', () => {
        if (isDragging) {
        isDragging = false;
        aiChatHeader.style.cursor = 'move';
        }
    });
  
    // AI 버튼 클릭 이벤트
    aiButton.addEventListener('click', () => {
      aiChatModal.style.display = 'block';
    });
  
    // 닫기 버튼 이벤트
    aiChatClose.addEventListener('click', () => {
      aiChatModal.style.display = 'none';
    });
  
    // 메시지 전송 이벤트
    aiChatSend.addEventListener('click', sendMessage);
    aiChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  
    // API 키 관련 요소
    const apiSettingsButton = document.getElementById('apiSettingsButton');
    const apiKeyModal = document.getElementById('apiKeyModal');
    const apiKeyClose = document.getElementById('apiKeyClose');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const apiKeySave = document.getElementById('apiKeySave');
    
    let apiKey = localStorage.getItem('openai_api_key') || '';
    let isStreaming = false; // 스트리밍 응답 진행 중 여부
    
    // API 키 모달 제어
    if (apiSettingsButton) {
        apiSettingsButton.addEventListener('click', () => {
            apiKeyInput.value = apiKey ? '••••••••••••••••••••••' : '';
            apiKeyModal.style.display = 'block';
        });
    }    
    
    apiKeyClose.addEventListener('click', () => {
        apiKeyModal.style.display = 'none';
    });
    
    // API 키 저장
    apiKeySave.addEventListener('click', async () => {
        const newApiKey = apiKeyInput.value;
        
        // 입력된 키가 마스킹된 값이면 변경하지 않음
        if (newApiKey === '••••••••••••••••••••••') {
        apiKeyModal.style.display = 'none';
        return;
        }
        
        // API 키 형식 검사
        if (!newApiKey.startsWith('sk-')) {
        apiKeyStatus.textContent = '올바른 API 키 형식이 아닙니다.';
        apiKeyStatus.style.color = 'red';
        return;
        }
        
        apiKeyStatus.textContent = '키 확인 중...';
        apiKeyStatus.style.color = 'blue';
        
        try {
        // API 키 유효성 검사
        const isValid = await validateApiKey(newApiKey);
        
        if (isValid) {
            apiKey = newApiKey;
            localStorage.setItem('openai_api_key', apiKey);
            apiKeyStatus.textContent = '유효한 API 키입니다!';
            apiKeyStatus.style.color = 'green';
            setTimeout(() => {
            apiKeyModal.style.display = 'none';
            apiKeyStatus.textContent = '';
            }, 1500);
        } else {
            apiKeyStatus.textContent = '유효하지 않은 API 키입니다.';
            apiKeyStatus.style.color = 'red';
        }
        } catch (error) {
        apiKeyStatus.textContent = '키 확인 중 오류가 발생했습니다.';
        apiKeyStatus.style.color = 'red';
        console.error('API 키 검증 오류:', error);
        }
    });
    
    // API 키 유효성 검사
    async function validateApiKey(key) {
        try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
            'Authorization': `Bearer ${key}`
            }
        });
        
        return response.status === 200;
        } catch (error) {
        console.error('API 키 검증 오류:', error);
        return false;
        }
    }

    // 메시지 전송 이벤트 (기존 함수를 대체)
    aiChatSend.addEventListener('click', sendMessage);
    aiChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // 메시지 전송 및 ChatGPT API 호출
    async function sendMessage() {
        const message = aiChatInput.value.trim();
        if (!message || isStreaming) return;

        // 사용자 메시지 표시
        appendMessage(message, 'user');
        aiChatInput.value = '';
        
        // if (!apiKey) {
        // appendMessage('대화를 시작하려면 OpenAI API 키를 설정해주세요.', 'ai');
        // apiSettingsButton.click(); // API 키 설정 창 자동 열기
        // return;
        // }

        // AI 응답 스트리밍 시작
        const streamingMsgDiv = document.createElement('div');
        streamingMsgDiv.className = 'ai-message streaming';
        streamingMsgDiv.textContent = '';
        aiChatMessages.appendChild(streamingMsgDiv);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

        isStreaming = true;
        
        try {
        await streamChatResponse(message, streamingMsgDiv);
        } catch (error) {
        streamingMsgDiv.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
        console.error('ChatGPT API 오류:', error);
        } finally {
        isStreaming = false;
        streamingMsgDiv.classList.remove('streaming');
        }
    }

    // 수정: streamChatResponse는 신규 기능들을 이미 사용하도록 업데이트됨 (추가 기능 통합)
    async function streamChatResponse(userMessage, messageElement) {
        try {
            // 1. 사용자에게 먼저 요청 이해 중임을 표시
            messageElement.textContent = "요청을 이해하고 있습니다...";
            
            // 2. 변경 유형 및 성별 변경 감지를 병렬로 수행
            const [genderChange, changeType] = await Promise.all([
                detectGenderChange(userMessage),
                analyzeChangeType(userMessage)
            ]);
            
            // 3. 진행 상황 업데이트: 적절한 메시지로 변경
            messageElement.textContent = genderChange 
                ? `${genderChange === 'male' ? '남성' : '여성'} 캐릭터로 변경 준비 중...`
                : (changeType === 'full' 
                    ? "새로운 스타일의 캐릭터를 준비하고 있습니다..." 
                    : "요청하신 부분을 확인하고 있습니다...");
            updateProcessingStatus(messageElement, messageElement.textContent, 50);
            
            // // 4. 캐릭터 변경 처리 (사용자에게 결과 미리 제공)
            // const changeDescription = await processNaturalLanguageCustomization(userMessage);
            
            // // 5. 최종 결과를 표시하고 대화 내역 저장
            // messageElement.textContent = changeDescription;
            // addToConversation('user', userMessage);
            // addToConversation('ai', changeDescription);


            // 4. 먼저 캐릭터 변경을 처리하고 결과 저장
            const changeResult = await processNaturalLanguageCustomization(userMessage);
            
            // 5. 변경 결과를 바탕으로 AI에게 설명 요청
            const response = await callOpenAI({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: '당신은 교육용 메타버스 플랫폼의 캐릭터 커스터마이징 도우미입니다. 사용자의 요청에 따라 캐릭터가 이미 변경되었습니다. 변경 내용을 자연스럽게 설명하세요.'
                    },
                    {
                        role: 'user',
                        content: `사용자 요청: "${userMessage}"\n\n변경 내용: ${changeResult}\n\n이 변경 사항을 친절하고 자연스럽게 설명해주세요.`
                    }
                ]
            });
            
            // 6. AI 응답 표시
            const aiExplanation = response.choices[0].message.content;
            console.log("AI 응답:", aiExplanation); // 디버깅용 로그 추가            
            const originalText = aiExplanation;
            messageElement.innerHTML = convertMarkdownToHtml(aiExplanation);
            if (!messageElement.innerHTML || messageElement.innerHTML === '') {
                messageElement.textContent = originalText;
            }

        } catch (error) {
            //handleError(error, messageElement, "응답 처리 중 오류가 발생했습니다.");
            console.error("AI 응답 처리 중 오류:", error);
            messageElement.textContent = "AI 응답을 표시하는 중 문제가 발생했습니다.";
        }
    }

    // 마크다운을 HTML로 변환하는 함수
    function convertMarkdownToHtml(markdown) {
        if (!markdown) return '';
        
        return markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 볼드 텍스트
        .replace(/\*(.*?)\*/g, '<em>$1</em>')            // 이탤릭 텍스트
        .replace(/\n\n/g, '<br><br>')                    // 단락 구분
        .replace(/\n/g, '<br>')                          // 줄바꿈
        .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>') // 코드 블록
        .replace(/`(.*?)`/g, '<code>$1</code>')          // 인라인 코드
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>'); // 링크
    }

    // 기존 메시지 표시 함수
    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
        messageDiv.textContent = text;
        aiChatMessages.appendChild(messageDiv);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }
    
    /**********************************************************************/
    // 캐릭터 커스터마이징 시스템 개선안
    async function processNaturalLanguageCustomization(userInput) {
        // 성별 변경 요청 감지
        const genderChangeRequest = detectGenderChange(userInput);
        if (genderChangeRequest) {
            // 사용자에게 먼저 변경 중이라고 알림
            // appendMessage("성별을 변경하고 있습니다. 잠시만 기다려주세요...", 'ai');
            
            // 성별 변경 및 캐릭터 재생성
            const newGender = genderChangeRequest === 'male' ? 'male' : 'female';
            await changeGender(newGender);
            
            return `성별을 ${newGender === 'male' ? '남성' : '여성'}으로 변경했습니다. 어떤가요? 더 수정하고 싶은 부분이 있으신가요?`;
        }

        // 전체 변경인지 부분 변경인지 분석
        const changeType = await analyzeChangeType(userInput);
        let result = {};

        // AI에게 "변경 중" 메시지 표시
        // appendMessage("요청하신 내용에 맞게 캐릭터를 변경하고 있습니다...", 'ai');
    
        // AI에게 사용자 입력 기반 파트별 설명 생성 요청
        const partDescriptions = await generatePartDescriptions(userInput, changeType);
        console.log("AI 생성 파트 설명:", partDescriptions);
        
        // 각 파트별로 JSON 데이터를 기반으로 적합한 ID 선택
        for (const part in partDescriptions) {
            if (changeType === 'partial' && !isPartRequested(part, userInput)) {
                continue; // 부분 변경일 경우 요청된 파트만 처리
        }
        
        const assetId = await findBestAssetId(part, partDescriptions[part]);
        if (assetId) {
            result[part] = assetId;
        }
        }
        
        // 캐릭터 변경 적용
        await applyAssetChanges(result);        
        
        // 변경 내용 요약 생성 및 피드백 요청
        const summary = generateChangeDescription(partDescriptions, result);
        return `${summary} 어떻게 보이나요? 더 수정하고 싶은 부분이 있으신가요?`;
    }

    // 요청에서 특정 파트가 언급되었는지 확인
    function isPartRequested(part, userInput) {
        const lowerInput = userInput.toLowerCase();
        const partKeywords = {
        'hair': ['머리', '헤어', '헤어스타일', '두발'],
        'face': ['얼굴', '페이스', '얼굴형'],
        'top': ['상의', '옷', '상체', '티셔츠', '셔츠', '자켓', '코트', '윗옷'],
        'bottom': ['하의', '바지', '치마', '팬츠', '하체', '스커트'],
        'footwear': ['신발', '구두', '운동화', '부츠', '슈즈', '발'],
        'eyeColor': ['눈동자', '눈색', '눈 색깔', '눈 컬러', '아이컬러'],
        'eyeShape': ['눈 모양', '눈 형태', '눈꼴'],
        'glasses': ['안경', '선글라스', '글래스', '고글'],
        'headwear': ['모자', '헤드웨어', '캡', '베레모', '두건'],
        'lipShape': ['입술', '립', '입 모양'],
        'noseShape': ['코', '노즈', '코 모양'],
        'facewear': ['마스크', '페이스 웨어'],
        'beard': ['턱수염', '수염', '비어드', '턱'],
        'eyebrowStyle': ['눈썹', '아이브로우']
        };
    
        if (partKeywords[part]) {
        return partKeywords[part].some(keyword => lowerInput.includes(keyword));
        }
        return false;
    }

    // 변경 내용 요약 생성 함수
    function generateChangeDescription(descriptions, changes) {
        let summary = '';
        
        if (Object.keys(changes).length === 0) {
        return "변경사항이 없습니다.";
        }
        
        if (Object.keys(changes).length > 3) {
        return "캐릭터의 전체적인 스타일을 변경했습니다!";
        }
        
        Object.keys(changes).forEach(part => {
        const partName = {
            'hair': '헤어스타일',
            'face': '얼굴형',
            'top': '상의',
            'bottom': '하의',
            'footwear': '신발',
            'eyeColor': '눈 색상',
            'eyeShape': '눈 모양',
            'glasses': '안경',
            'headwear': '모자',
            'lipShape': '입술',
            'noseShape': '코',
            'facewear': '페이스 웨어',
            'beard': '수염',
            'eyebrowStyle': '눈썹'
        }[part] || part;
        
        // 설명이 너무 길면 짧게 줄이기
        const desc = descriptions[part] || '';
        const shortDesc = desc.length > 50 ? desc.substring(0, 50) + "..." : desc;
        
        summary += `${partName}을(를) ${shortDesc} 스타일로 변경했습니다. `;
        });
        
        return summary;
    }

    // 성별 변경 감지 함수
    function detectGenderChange(userInput) {
        const input = userInput.toLowerCase();
        
        if ((input.includes('남자') || input.includes('남성') || input.includes('male')) && 
            (input.includes('바꿔') || input.includes('변경') || input.includes('전환'))) {
        return 'male';
        }
        
        if ((input.includes('여자') || input.includes('여성') || input.includes('female')) && 
            (input.includes('바꿔') || input.includes('변경') || input.includes('전환'))) {
        return 'female';
        }
        
        return null;
    }

    // 성별 변경 함수
    async function changeGender(newGender) {
        // 현재 성별과 다를 때만 변경
        if ((newGender === 'male' && characterGender !== 'M') || 
            (newGender === 'female' && characterGender !== 'F')) {
        
        // gender 변수 업데이트 후 start() 함수 실행
        const oldGender = characterGender;
        characterGender = newGender.toUpperCase().charAt(0);
                
        await start(newGender);        
        console.log(`성별 변경: ${oldGender} -> ${characterGender}`);
        return true;
        }
        return false;
    }
    
    // 전체/부분 변경 분석 함수
    async function analyzeChangeType(userInput) {
        const response = await cachedOpenAICall({
        model: "gpt-4o",
        messages: [
            {
            role: "system",
            content: "사용자의 요청이 캐릭터 전체 스타일 변경인지(full) 특정 부분만 변경인지(partial) 판단하세요. 반드시 full 또는 partial로만 응답해주세요."
            },
            {
            role: "user",
            content: userInput
            }
        ]
        });
        
        const analysis = response.choices[0].message.content.toLowerCase();
        return analysis.includes('full') ? 'full' : 'partial';
    }
    
    // AI 파트별 설명 생성 함수
    async function generatePartDescriptions(userInput, changeType) {
        const msg_male = `
            사용자의 요청에 따라 남성 캐릭터의 각 부분별 특성을 자연어로 설명해주세요.
            해당 사항이 없는 경우 항목을 제외하거나, "없음" 또는 "기본"으로 대답하세요.
            반드시 다음 JSON 형식으로 응답해야 합니다:            
            {
                "hair": "설명",
                "face": "설명",
                "top": "설명",
                "bottom": "설명",
                "footwear": "설명",
                "eyeColor": "설명",
                "glasses": "설명",
                "headwear": "설명",
                "lipShape": "설명",
                'noseShape': "설명",
                'facewear': "설명",
                'beard': "설명",
                'eyebrowStyle': "설명",
                
            }
            텍스트가 아닌 정확한 JSON 형식으로만 응답하세요.
        `;
        
        const msg_female = `            
            사용자의 요청에 따라 여성 캐릭터의 각 부분별 특성을 자연어로 설명해주세요.            
            해당 사항이 없는 경우 항목을 제외하거나, "없음" 또는 "기본"으로 대답하세요.            
            반드시 다음 JSON 형식으로 응답해야 합니다:            
            {
                "hair": "설명",
                "face": "설명",
                "top": "설명",
                "bottom": "설명",
                "footwear": "설명",
                "eyeColor": "설명",
                "glasses": "설명",
                "headwear": "설명",
                "lipShape": "설명",
                'noseShape': "설명",
                'facewear': "설명",                
                'eyebrowStyle': "설명",
                
            }
            텍스트가 아닌 정확한 JSON 형식으로만 응답하세요.
        `;

        let msg = characterGender === 'M' ? msg_male : msg_female;        
        
        const response = await callOpenAI({
        model: "gpt-4o",
        messages: [
            { role: "system", content: msg },
            {
            role: "user",
            content: `이 요청에 맞는 캐릭터 파트별 설명을 생성해주세요: "${userInput}". 변경 타입: ${changeType}`
            }
        ]
        // response_format 파라미터 제거
        });
        
        // 응답에서 JSON 부분만 추출
        const content = response.choices[0].message.content;
        try {
        // JSON 형식 문자열 추출 시도
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        // 전체 텍스트가 JSON인 경우
        return JSON.parse(content);
        } catch (error) {
        console.error('JSON 파싱 오류:', error, content);
        // 기본 설명으로 폴백
        return {
            "hair": "기본 헤어스타일",
            "face": "기본 얼굴형",
            "top": "기본 상의",
            "bottom": "기본 하의",
            "footwear": "기본 신발",
            "eyeColor": "기본 눈 색상",
            "eyeShape": "기본 눈 모양",
            "glasses": "없음",
            "headwear": "없음",
            "lipShape": "기본 입술",
            'noseShape': "기본 코",
            'facewear': "없음",
            'beard': "없음",
            'eyebrowStyle': "기본 눈썹"            
        };
        }
    }
    
    // 변경사항 적용 함수
    async function applyAssetChanges(changes) {
        if (!window.charaterJson) return;
        
        // 변경사항 적용
        Object.keys(changes).forEach(part => {
        // API의 키 이름 규칙에 맞게 조정 (예: hairStyle 등)
        const apiKeyName = getApiKeyForPart(part);
        window.charaterJson.assets[apiKeyName] = changes[part];
        });
        
        // 변경된 내용으로 아바타 업데이트
        await changeDraftAvatar(window.token, selectedAvatarId, window.charaterJson);

        setTimeout(() => {
            saveDraftAvatar(window.token, selectedAvatarId);            
        }, 500);
        
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
        'eyebrowStyle': 'eyebrowStyle'
        };
        
        return mapping[part] || part;
    }
    /**************************************************************************** */
   
    const maleButton = document.getElementById('maleButton');

    femaleButton.addEventListener('click', () => {
        characterGender = 'F';
        start('female');        
    });

    maleButton.addEventListener('click', () => {
        characterGender = 'M';
        start('male');        
    });

});

// 성별 토글 버튼 요소 가져오기
const femaleButton = document.getElementById('femaleButton');

// 성별 버튼 활성화/비활성화 처리 함수
function updateGenderButtons() {
    if (characterGender === 'F') {
        femaleButton.classList.add('active');
        maleButton.classList.remove('active');
    } else {
        femaleButton.classList.remove('active');
        maleButton.classList.add('active');
    }
}

async function start(forcedGender = null, avatarJson = null) {
    console.log('Starting...: ', window.characterPresetIndex);
    // Create and display the loading spinner

    const frameContainer = document.querySelector('.frame-container');
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    frameContainer.appendChild(spinner);
    
    // Remove spinner when frame is ready
    const removeSpinner = () => {
        if (spinner && spinner.parentNode) {
            spinner.parentNode.removeChild(spinner);
        }
    };
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
    window.charaterJson = window.draftAvatar.data;
    console.log('Draft avatar patched:', window.draftAvatar.data);

    setTimeout(() => {
        saveDraftAvatar(window.token, selectedAvatarId);
        updateGenderButtons();
        displayIframe();
        spinner.remove();                
    }, 1000);
    createLoadingSpiiner();
}

start();


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
                    ...(patched_data.assets.beardStyle && { "beardStyle": patched_data.assets.beardStyle }),
                    ...(patched_data.assets.eyebrowStyle && { "eyebrowStyle": patched_data.assets.eyebrowStyle }),
                    ...(patched_data.assets.eyebrowColor && { "eyebrowColor": patched_data.assets.eyebrowColor }),
                    ...(patched_data.assets.faceWear && { "facewear": patched_data.assets.faceWear }),
                    ...(patched_data.assets.faceMask && { "faceMask": patched_data.assets.faceMask }),
                    ...(patched_data.assets.glasses && { "glasses": patched_data.assets.glasses }),
                    ...(patched_data.assets.hairStyle && { "hairStyle": patched_data.assets.hairStyle }),
                    ...(patched_data.assets.hairColor && { "hairColor": patched_data.assets.hairColor }),
                    ...(patched_data.assets.headwear && { "headwear": patched_data.assets.headwear }),
                    ...(patched_data.assets.lipShape && { "lipShape": patched_data.assets.lipShape }),
                    ...(patched_data.assets.eyeShape && { "eyeShape": patched_data.assets.eyeShape }),
                    ...(patched_data.assets.noseShape && { "noseShape": patched_data.assets.noseShape }),
                    ...(patched_data.assets.faceShape && { "faceShape": patched_data.assets.faceShape }),                            
                    ...(patched_data.assets.top && { "top": patched_data.assets.top }),
                    ...(patched_data.assets.bottom && { "bottom": patched_data.assets.bottom }),
                    ...(patched_data.assets.footwear && { "footwear": patched_data.assets.footwear }),
                    ...(patched_data.assets.skinColorHex && { "skinColorHex": patched_data.assets.skinColorHex }),
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
    const response = await fetch(`https://api.readyplayer.me/v2/avatars/${draft_avatar_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer_token}`
        },
        body: JSON.stringify({})
    });
    const json = await response.json();
    console.log('Draft avatar saved:', json);
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

function base64ToBlob(base64, mime) {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
}

function slpitString() {    
    try {        
        const splitResult = atob(
            hashdefault
                .replace(/[a-zA-Z]/g, c =>
                    String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
                )
        ).split('').reverse().join('');
        return splitResult;
    } catch (error) {
        console.error(error);
        return null;
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

// 폴백 에셋 ID 반환 함수 (확장)
function getFallbackAssetId(part) {
    // 각 파트별 기본 ID 목록
    const fallbacks = {
        'hair': '23368535',
        'face': '49918708',
        'top': 'kwhVa1YNStiAN8B7oceBpg',
        'bottom': '146120431',
        'footwear': 'NZtK7woLS_S1OtKh32jJDg',
        'eyeColor': '56993869',
        'eyeShape': '50095075',
        'glasses': '9932578',
        'headwear': '',
        'lipShape': '49919049',
        'noseShape': '50094592', 
        'facewear': '',
        'beard': '',
        'eyebrowStyle': '41308196'
    };
    
    return fallbacks[part] || null;
}

// [추가] 진행 상태 업데이트 함수
function updateProcessingStatus(element, status, progress = 0) {
  element.innerHTML = `
    <div class="processing-status">
      <div class="progress-bar"><div style="width: ${progress}%"></div></div>
      <div class="status-text">${status}</div>
    </div>
  `;
}

// [추가] API 호출 결과 캐싱 함수
const apiCache = new Map();
async function cachedOpenAICall(params, cacheKey) {
  const key = cacheKey || JSON.stringify(params);
  if (apiCache.has(key)) return apiCache.get(key);
  const result = await callOpenAI(params);
  apiCache.set(key, result);
  return result;
}

// [추가] 여러 파트를 병렬 처리하는 함수
async function getMultipleAssetIds(partDescriptions, userInput, changeType) {
  const tasks = Object.entries(partDescriptions)
    .filter(([part]) => changeType === 'full' || isPartRequested(part, userInput))
    .map(async ([part, description]) => {
      const assetId = await findBestAssetId(part, description);
      return [part, assetId];
    });
  const results = await Promise.all(tasks);
  return Object.fromEntries(results);
}

// [추가] 대화 내역 관리
const conversationHistory = [];
function addToConversation(role, content) {
  conversationHistory.push({ role, content });
  if (conversationHistory.length > 10) {
    conversationHistory.splice(1, 2); // 시스템 메시지 유지 후 2개 제거
  }
}

// [추가] 현재 스타일 저장 기능
function saveCurrentStyle(name) {
  if (!window.charaterJson) return;
  const customPresets = JSON.parse(localStorage.getItem('customPresets') || '[]');
  customPresets.push({
    name,
    assets: { ...window.charaterJson.assets },
    timestamp: Date.now()
  });
  localStorage.setItem('customPresets', JSON.stringify(customPresets));
}

// [추가] 에러 처리 통합 함수
function handleError(error, element, fallbackMessage) {
  console.error('Error:', error);
  let message = fallbackMessage;
  if (error.message.includes('API')) {
    message = "API 서버 연결 중 문제가 발생했습니다.";
  } else if (error.message.includes('avatar')) {
    message = "아바타 생성 중 오류가 발생했습니다.";
  }
  if (element) {
    element.textContent = message;
  } else {
    appendMessage(message, 'ai');
  }
}

// 수정: 분석 함수에 캐싱 적용
async function analyzeChangeType(userInput) {
    const response = await cachedOpenAICall({
        model: "gpt-4o",
        messages: [
            {
              role: "system",
              content: "사용자의 요청이 캐릭터 전체 스타일 변경인지(full) 특정 부분만 변경인지(partial) 판단하세요."
            },
            {
              role: "user",
              content: userInput
            }
        ]
    });
    const analysis = response.choices[0].message.content.toLowerCase();
    return analysis.includes('full') ? 'full' : 'partial';
}

// 수정: processNaturalLanguageCustomization에서 병렬 처리 적용
async function processNaturalLanguageCustomization(userInput) {
    // 성별 변경 요청 감지
    const genderChangeRequest = detectGenderChange(userInput);
    if (genderChangeRequest) {
        appendMessage("성별을 변경하고 있습니다. 잠시만 기다려주세요...", 'ai');
        const newGender = genderChangeRequest === 'male' ? 'male' : 'female';
        await changeGender(newGender);
        return `성별을 ${newGender === 'male' ? '남성' : '여성'}으로 변경했습니다. 어떤가요? 더 수정하고 싶은 부분이 있으신가요?`;
    }
    
    const changeType = await analyzeChangeType(userInput);
    // AI 메시지 표시
    // appendMessage("요청하신 내용에 맞게 캐릭터를 변경하고 있습니다...", 'ai');
    
    // AI에게 파트별 설명 생성 요청
    const partDescriptions = await generatePartDescriptions(userInput, changeType);
    console.log("AI 생성 파트 설명:", partDescriptions);
    
    // 수정: 개별 처리 대신 여러 파트에 대해 병렬로 asset ID 선택
    const result = await getMultipleAssetIds(partDescriptions, userInput, changeType);
    
    // 캐릭터 변경 적용
    await applyAssetChanges(result);
    
    // 변경 내용 요약 생성 및 피드백 요청
    const summary = generateChangeDescription(partDescriptions, result);
    return `${summary} 어떻게 보이나요? 더 수정하고 싶은 부분이 있으신가요?`;
}

