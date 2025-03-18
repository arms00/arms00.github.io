
// 페이지 로드 시 모든 파트 데이터 미리 로드
async function preloadAllAssetData() {
    console.log('모든 에셋 데이터 사전 로드 중...');
    
    const partNames = Object.keys(assetCatalog);
    const loadPromises = partNames.map(async (part) => {
      try {
        const response = await fetch(`https://arms00.github.io/schoola/asset_data/${part}.json`);
        if (response.ok) {
          const data = await response.json();
          window.assetCatalog[part] = Array.isArray(data) ? data : [data];
          console.log(`${part} 데이터 로드 완료: ${window.assetCatalog[part].length}개 항목`);
          
          // ID 속성 확인 및 추가
          window.assetCatalog[part].forEach((item, index) => {
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
          window.assetCatalog[part] = []; // 빈 배열로 초기화
        }
      } catch (error) {
        console.error(`${part} 데이터 로드 오류:`, error);
        window.assetCatalog[part] = []; // 오류 발생 시 빈 배열로 초기화
      }
    });
    
    await Promise.all(loadPromises);
    console.log('모든 에셋 데이터 로드 완료!');
}

document.addEventListener('DOMContentLoaded', async () => {

    // 모든 에셋 데이터 미리 로드
    await preloadAllAssetData();    

    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatSend = document.getElementById('aiChatSend');    
  
    // 메시지 전송 이벤트
    aiChatSend.addEventListener('click', sendMessage);
    aiChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
});

let isStreaming = false; // 스트리밍 응답 진행 중 여부
let conversationCount = 0; // 대화 횟수
const MAX_CONVERSATION_COUNT = 25; // 최대 대화 횟수 제한

// 메시지 전송 및 ChatGPT API 호출
async function sendMessage() {
    const message = aiChatInput.value.trim();
    if (!message || isStreaming) return;

    // 사용자 메시지 표시
    appendMessage(message, 'user');
    aiChatInput.value = '';
    
    // 대화 횟수 업데이트
    updateConversationCount();

    // AI 응답 스트리밍 시작
    const streamingMsgDiv = document.createElement('div');
    streamingMsgDiv.className = 'ai-message streaming';
    streamingMsgDiv.textContent = '';
    aiChatMessages.appendChild(streamingMsgDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    isStreaming = true;
    
    try {
        await window.streamChatResponse(message, streamingMsgDiv);
    } catch (error) {
        streamingMsgDiv.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
        console.error('ChatGPT API 오류:', error);
    } finally {
        isStreaming = false;
        streamingMsgDiv.classList.remove('streaming');
    }
}    

// 대화 횟수 제한 및 UI 표시
function updateConversationCount() {
    conversationCount++;
    const remainingCount = MAX_CONVERSATION_COUNT - conversationCount;
    const statusElement = document.getElementById('conversation-status');
    if (remainingCount <= 10 && statusElement) {
        statusElement.textContent = `남은 대화 횟수: ${remainingCount}`;
    }
    if (remainingCount <= 0) {
        alert("대화 횟수가 초과되었습니다. 더 이상 대화를 진행할 수 없습니다.");
        // 추가적인 제한 로직을 여기에 추가
    }
}

function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
    messageDiv.textContent = text;
    aiChatMessages.appendChild(messageDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    scrollToBottom(aiChatMessages, true);
}

function scrollToBottom(element, delayed = false) {
    if (delayed) {
      // 렌더링 후 약간의 지연을 두고 스크롤
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 100);
    } else {
      element.scrollTop = element.scrollHeight;
    }
}

window.scrollToBottom = scrollToBottom;

const apiCache = new Map();
const ChacheMaxSize = 50;
const CACHE_TTL = 1000 * 60 * 30; // 30분

export async function callRes(params, options = {}) {
    
    if (!params.model) {
        params.model = 'gpt-4o';
    }
    const {
        retryCount = 3,
        initialDelay = 1000,
        cache = false,
        cacheKey = null,
        cacheTTL = CACHE_TTL
    } = options;

    if (cache) {
        const key = cacheKey || JSON.stringify(params);
        const now = Date.now();
        if (apiCache.has(key)) {
        const { data, timestamp } = apiCache.get(key);
        if (now - timestamp < cacheTTL) {
            return data;
        }
        }
    }

    let lastError = null;
    let delay = initialDelay;
    for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
        if (attempt > 0) {
            console.log(`API 호출 재시도 ${attempt}/${retryCount}, ${delay/1000}초 후...`);
            updateApiCallStatus(`API 호출 재시도 중 (${attempt}/${retryCount})`, true);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
        
        if (params.stream === true) {
            const response = await fetch(atob(window.fetchStr), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${slpitString()}`
            },
            body: JSON.stringify(params)
            });
            if (!response.ok) {
            if (response.status === 429 && attempt < retryCount) {
                lastError = new Error(`API 속도 제한 도달: ${response.status}, 재시도 중...`);
                continue;
            }
            throw new Error(`API 오류: ${response.status} ${response.statusText}`);
            }
            return response;
        } else {
            const response = await fetch(atob(window.fetchStr), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${slpitString()}`
            },
            body: JSON.stringify(params)
            });
            if (!response.ok) {
            if (response.status === 429 && attempt < retryCount) {
                lastError = new Error(`API 속도 제한 도달: ${response.status}, 재시도 중...`);
                continue;
            }
            throw new Error(`API 오류: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            if (cache) {
            const key = cacheKey || JSON.stringify(params);
            apiCache.set(key, { data: result, timestamp: Date.now() });
            // 캐시 크기 관리 (기본:최대 50개 항목)
            if (apiCache.size > ChacheMaxSize) {
                const oldestKey = [...apiCache.entries()]
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
                apiCache.delete(oldestKey);
            }
            }
            return result;
        }
        } catch (error) {
        lastError = error;
        console.error(`시도 ${attempt + 1}/${retryCount + 1} 실패:`, error);
        if (attempt < retryCount) continue;
        console.error('모든 재시도 실패:', error);
        throw lastError || new Error('API 호출 중 알 수 없는 오류 발생');
        }
    }
    throw lastError || new Error('모든 재시도가 실패했습니다');
    }

    function updateApiCallStatus(message, isRetrying = false) {
    const statusElement = document.getElementById('api-status');
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.className = isRetrying ? 'api-status retrying' : 'api-status';
    if (!isRetrying) {
        setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'api-status';
        }, 5000);
    }
}

export function convertMarkdownToHtml(markdown) {
  if (!markdown) return '';
  return markdown
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
}

function slpitString() {
  try {
    const splitResult = atob(
      window.strCode
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

export function debugLog(...args) {
  if (window.DEBUG_MODE) {
    console.log("[DEBUG]", ...args);
  }
}
