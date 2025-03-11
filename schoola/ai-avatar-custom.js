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
    eyebrowStyle: [],
    skinColor: [],
    hairColor: [],
    eyebrowColor: [],
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
        const fallbackId = getFallbackAssetId(part);
        // 폴백 ID 사용 시 결과 객체에 원래 요청 설명과 실제 사용된 ID를 함께 포함
        return { 
            id: fallbackId, 
            requestedDescription: description, 
            fallback: true,
            actualDescription: "기본 스타일" 
        };
    }

    try {
        const response = await callRes({
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
        const matchingAsset = partData.find(item => String(item.id || '') === assetId);
        if (matchingAsset) {
            console.log(`유효한 ID 확인: ${assetId} (${part})`);
            // 유효한 ID인 경우 실제 적용된 에셋에 대한 정보를 함께 반환
            return { 
                id: assetId, 
                requestedDescription: description, 
                fallback: false,
                actualDescription: matchingAsset.description || matchingAsset.name || description 
            };
        } else {
            console.warn(`유효하지 않은 ID: ${assetId}, 파트: ${part}. 기본값 사용`);
            const fallbackId = getFallbackAssetId(part);
            // 폴백 ID 사용 시 결과 객체에 원래 요청 설명과 실제 사용된 ID, 폴백 여부를 함께 포함
            return { 
                id: fallbackId, 
                requestedDescription: description, 
                fallback: true,
                actualDescription: "기본 스타일" 
            };
        }
    } catch (error) {
        console.error(`${part} 에셋 ID 찾기 오류:`, error);
        const fallbackId = getFallbackAssetId(part);
        return { 
            id: fallbackId, 
            requestedDescription: description, 
            fallback: true,
            actualDescription: "기본 스타일" 
        };
    }
}

// OpenAI API 호출 함수 - 재시도 로직 포함
async function callRes(requestData, retryCount = 3, initialDelay = 1000) {
    let lastError = null;
    let delay = initialDelay;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
            // 재시도 중이라면 대기
            if (attempt > 0) {
                console.log(`API 호출 재시도 ${attempt}/${retryCount}, ${delay/1000}초 후...`);
                // 상태 표시 업데이트 (선택 사항)
                updateApiCallStatus(`API 호출 재시도 중 (${attempt}/${retryCount})`, true);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // 지수 백오프: 대기 시간을 두 배로 증가
            }
            
            // stream 파라미터가 있으면 스트리밍 응답 처리
            if (requestData.stream === true) {
                // 스트리밍의 경우 response 객체 자체를 반환
                const response = await fetch(atob(window.fetchStr), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${slpitString()}` // API 키 함수는 유지
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    // 429 에러면 재시도, 다른 에러면 즉시 실패
                    if (response.status === 429 && attempt < retryCount) {
                        lastError = new Error(`API 속도 제한 도달: ${response.status}, 재시도 중...`);
                        continue; // 다음 재시도로 진행
                    }
                    
                    throw new Error(`API 오류: ${response.status} ${response.statusText}`);
                }
                
                return response; // 스트리밍의 경우 response 객체 자체를 반환
            } else {
                // 일반 API 요청 처리 (기존 코드)
                const response = await fetch(atob(window.fetchStr), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${slpitString()}` // API 키 함수는 유지
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    // 429 에러면 재시도, 다른 에러면 즉시 실패
                    if (response.status === 429 && attempt < retryCount) {
                        lastError = new Error(`API 속도 제한 도달: ${response.status}, 재시도 중...`);
                        continue; // 다음 재시도로 진행
                    }
                    
                    throw new Error(`API 오류: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                return data;
            }
        } catch (error) {
            lastError = error;
            console.error(`시도 ${attempt + 1}/${retryCount + 1} 실패:`, error);
            
            // 마지막 시도가 아니라면 계속 재시도
            if (attempt < retryCount) {
                continue;
            }
            
            // 마지막 시도였다면 에러 발생
            console.error('모든 재시도 실패:', error);
            throw lastError || new Error('API 호출 중 알 수 없는 오류 발생');
        }
    }
    
    // 이 코드에 도달하면 모든 재시도가 실패한 것
    throw lastError || new Error('모든 재시도가 실패했습니다');
}

// 재시도 상태를 표시할 함수 추가
function updateApiCallStatus(message, isRetrying = false) {
    const statusElement = document.getElementById('api-status');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = isRetrying ? 'api-status retrying' : 'api-status';
    
    // 상태 메시지 자동 소멸 (선택 사항)
    if (!isRetrying) {
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'api-status';
        }, 5000);
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
        await streamChatResponse(message, streamingMsgDiv);
        } catch (error) {
        streamingMsgDiv.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
        console.error('ChatGPT API 오류:', error);
        } finally {
        isStreaming = false;
        streamingMsgDiv.classList.remove('streaming');
        }
    }

    async function streamChatResponse(userMessage, messageElement) {
        try {
            // 1. 참조 해석 수행
            const resolvedMessage = await resolveReferences(userMessage);
            
            // 2. 원래 사용자 메시지는 그대로 대화 내역에 저장
            addToConversation("user", userMessage);
            
            // 3. 로딩 상태 표시
            messageElement.textContent = "요청을 이해하고 있습니다...";
            scrollToBottom(aiChatMessages, true);

            // 4. 개선된 의도 분석 호출 (문맥 고려)
            const intent = await analyzeUserIntent(resolvedMessage);
            console.log("분석된 의도:", intent);

            // 5. 의도 유형에 따른 분기 처리
            switch(intent.type) {
                case "gender_change":
                    // 성별 변경 요청 처리
                    const genderType = intent.details?.gender || 
                                     (resolvedMessage.includes('남') ? 'male' : 'female');
                    
                    messageElement.textContent = `${genderType === 'male' ? '남성' : '여성'} 캐릭터로 변경 중...`;
                    updateProcessingStatus(messageElement, messageElement.textContent, 50);
                    
                    await changeGender(genderType);
                    
                    const genderResponse = `${genderType === 'male' ? '남성' : '여성'} 캐릭터로 변경했습니다. 다른 요청이 있으신가요?`;
                    messageElement.innerHTML = convertMarkdownToHtml(genderResponse);
                    addToConversation("assistant", genderResponse);
                    return;
                    
                case "information":
                    // 정보 요청 처리
                    messageElement.textContent = "질문에 대한 답변을 준비 중...";
                    const infoResponse = await generateInformationResponse(resolvedMessage, intent.details);
                    messageElement.innerHTML = convertMarkdownToHtml(infoResponse);
                    addToConversation("assistant", infoResponse);
                    return;
                
                case "undo":
                    // 되돌리기 기능 (향후 구현)
                    messageElement.textContent = "죄송합니다, 현재 이전 상태로 되돌리기 기능은 지원하지 않습니다.";
                    addToConversation("assistant", messageElement.textContent);
                    return;
                    
                case "comparison":
                    // 비교 기능 (향후 구현)
                    messageElement.textContent = "죄송합니다, 현재 이전 상태와 비교 기능은 지원하지 않습니다.";
                    addToConversation("assistant", messageElement.textContent);
                    return;
                    
                default:
                    // partial_customization 또는 full_customization 처리 (기존 로직)
                    break;
            }

            // 6. 변경 유형 결정 (문맥 고려)
            const changeType = intent.type === 'full_customization' ? 'full' : 'partial';
            
            // 7. 진행 상황 업데이트
            messageElement.textContent = changeType === 'full' 
                ? "새로운 스타일의 캐릭터를 준비하고 있습니다..." 
                : "요청하신 부분을 수정하고 있습니다...";
            updateProcessingStatus(messageElement, messageElement.textContent, 30);
            
            scrollToBottom(aiChatMessages, true);
            
            // 8. 개선된 캐릭터 변경 처리 (문맥 활용)
            const changeResult = await processNaturalLanguageCustomizationWithContext(resolvedMessage, intent);
            
            // 지연 추가
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 9. AI 응답 생성 요청
            const systemPrompt = '당신은 교육용 메타버스 플랫폼의 캐릭터 커스터마이징 도우미입니다. 사용자의 요청에 따라 캐릭터가 변경되었습니다. 변경 내용을 자연스럽게 설명하세요.';
            const userPrompt = `사용자 요청: "${resolvedMessage}"\n\n변경 내용: ${changeResult}\n\n이 변경 사항을 친절하고 자연스럽게 설명해주세요.`;
            
            // 스트리밍 응답 처리 (기존 로직 유지)
            let retryCount = 0;
            const maxRetries = 3;
            const retryDelay = 300; // ms
            let fullText = '';
            
            // 마크다운 변환 처리 준비
            messageElement.innerHTML = '';
            
            // fetchStreamingResponse 함수 호출 (기존 로직)
            async function fetchStreamingResponse() {
                // ...existing code...
                while (retryCount <= maxRetries) {
                    try {
                        // callRes 함수를 사용해 스트리밍 응답 받기
                        const response = await callRes({
                            model: 'gpt-4o',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userPrompt }
                            ],
                            stream: true
                        });

                        // 응답 스트리밍 처리 로직...
                        const reader = response.body.getReader();
                        const decoder = new TextDecoder('utf-8');

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            const chunk = decoder.decode(value);
                            const lines = chunk.split('\n').filter(line => line.trim() !== '');

                            for (const line of lines) {
                                if (line.includes('data: [DONE]')) continue;
                                
                                if (line.startsWith('data: ')) {
                                    try {
                                        const json = JSON.parse(line.slice(6)); // "data: " 제거
                                        if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                                            const content = json.choices[0].delta.content;
                                            fullText += content;
                                            
                                            // 렌더링
                                            messageElement.innerHTML = convertMarkdownToHtml(fullText);
                                            
                                            // HTML 변환 실패 시 일반 텍스트 표시
                                            if (!messageElement.innerHTML) {
                                                messageElement.textContent = fullText;
                                            }
                                            
                                            // 스크롤 조정
                                            scrollToBottom(aiChatMessages, false);
                                        }
                                    } catch (e) {
                                        console.error('응답 파싱 오류:', e, line);
                                    }
                                }
                            }
                        }
                        
                        return; // 성공 시 함수 종료
                    } catch (error) {
                        // 재시도 로직...
                        retryCount++;
                        console.error(`API 요청 실패 (${retryCount}/${maxRetries}):`, error);
                        
                        if (retryCount <= maxRetries) {
                            messageElement.innerHTML = `응답 요청 실패... ${retryCount}번째 재시도 중`;
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                        } else {
                            messageElement.innerHTML = '죄송합니다, 요청을 처리하는 중 오류가 발생했습니다.';
                            throw error;
                        }
                    }
                }
            }

            // 스트리밍 응답 실행
            await fetchStreamingResponse();
            addToConversation("assistant", fullText);
            scrollToBottom(aiChatMessages, true);

        } catch (error) {
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
    
    // 성별 토글 버튼 요소 가져오기
    const femaleButton = document.getElementById('femaleButton');
    const maleButton = document.getElementById('maleButton');

    femaleButton.addEventListener('click', () => {
        window.characterGender = 'F';
        window.start('female');        
    });

    maleButton.addEventListener('click', () => {
        window.characterGender = 'M';
        window.start('male');        
    });

    // 대화 횟수 상태 표시 요소 추가
    const conversationStatus = document.createElement('div');
    conversationStatus.id = 'conversation-status';
    conversationStatus.textContent = null;//`남은 대화 횟수: ${MAX_CONVERSATION_COUNT}`;
    aiChatMessages.appendChild(conversationStatus);

});

// 폴백 에셋 ID 반환 함수 (확장)
function getFallbackAssetId(part) {
    // 각 파트별 기본 ID 목록
    const fallbacks = {
        'hair': '23368535',
        'face': '49918708',
        //'top': 'kwhVa1YNStiAN8B7oceBpg',
        'bottom': '146120431',
        'footwear': 'NZtK7woLS_S1OtKh32jJDg',
        'eyeColor': '56993869',
        'eyeShape': '50095075',
        'glasses': '9932578',
        //'headwear': '',
        'lipShape': '49919049',
        'noseShape': '50094592', 
        //'facewear': '',
        //'beard': '',
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
const CACHE_TTL = 1000 * 60 * 30; // 30분

async function cachedOpenAICall(params, cacheKey) {
  const key = cacheKey || JSON.stringify(params);
  const now = Date.now();
  
  // 캐시에 항목이 있고 만료되지 않았는지 확인
  if (apiCache.has(key)) {
    const { data, timestamp } = apiCache.get(key);
    if (now - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  const result = await callRes(params);
  apiCache.set(key, { data: result, timestamp: now });
  
  // 캐시 크기 관리 (최대 50개 항목)
  if (apiCache.size > 50) {
    const oldestKey = [...apiCache.entries()]
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
    apiCache.delete(oldestKey);
  }
  
  return result;
}

// 수정: processNaturalLanguageCustomization에서 병렬 처리 적용
async function processNaturalLanguageCustomization(userInput) {
    // 성별 변경 요청 감지
    const genderChangeRequest = detectGenderChange(userInput);
    if (genderChangeRequest) {
        const newGender = genderChangeRequest === 'male' ? 'male' : 'female';
        await changeGender(newGender);
        return `성별을 ${newGender === 'male' ? '남성' : '여성'}으로 변경했습니다. 어떤가요? 더 수정하고 싶은 부분이 있으신가요?`;
    }
    
    const changeType = await analyzeChangeType(userInput);
    
    // AI에게 파트별 설명 생성 요청
    const partDescriptions = await generatePartDescriptions(userInput, changeType);
    console.log("AI 생성 파트 설명:", partDescriptions);
    
    // 수정: 여러 파트에 대해 병렬로 asset ID 선택 (이제 결과에 실제 적용된 정보가 포함됨)
    const results = await getMultipleAssetIds(partDescriptions, userInput, changeType);
    
    // 변경 내용 요약 생성을 위한 데이터 구성
    const appliedChanges = {};
    const actualDescriptions = {};
    
    // 결과에서 실제 ID만 추출하여 적용하기 위한 구조 생성
    Object.entries(results).forEach(([part, result]) => {
        appliedChanges[part] = result;
        
        // 실제로 적용된 설명 저장 (폴백인 경우 "기본 스타일", 아니면 요청한 설명)
        actualDescriptions[part] = result.fallback ? result.actualDescription : result.requestedDescription;
    });
    
    // 캐릭터 변경 적용
    await window.applyAssetChanges(results);
    
    // 변경 내용 요약 생성 (실제 적용된 설명 사용)
    const summary = generateChangeDescription(actualDescriptions, appliedChanges);
    
    // 추가: 실제 변경에 대한 정보 포함
    const actualChangeInfo = Object.entries(results)
        .filter(([_, result]) => result.fallback)
        .map(([part, result]) => {
            const partName = getPartDisplayName(part);
            return `${partName}의 경우 "${result.requestedDescription}" 요청이 지원되지 않아 기본 스타일을 적용했습니다.`;
        })
        .join(' ');
        
    // 기본값을 사용한 항목이 있으면 그 내용을 포함하여 반환
    const explanationWithChanges = actualChangeInfo ? 
        `${summary} (참고: ${actualChangeInfo})` : 
        summary;
    
    return explanationWithChanges;
}

function detectGenderChange(userInput) {
    const input = userInput.toLowerCase();
    
    // 더 많은 표현 포함
    const maleTerms = ['남자', '남성', '남자로', '남성으로', 'male', '남'];
    const femaleTerms = ['여자', '여성', '여자로', '여성으로', 'female', '여'];
    const changeTerms = ['바꿔', '변경', '전환', '해줘', '하고 싶어', '만들어'];
    
    // 성별 용어 포함 여부 확인
    const hasMaleTerm = maleTerms.some(term => input.includes(term));
    const hasFemaleTerm = femaleTerms.some(term => input.includes(term));
    
    // 변경 의도 표현 확인 (더 완화된 조건)
    const hasChangeTerm = changeTerms.some(term => input.includes(term)) || 
                        input.includes('성별') || input.length < 15; // 짧은 명령도 처리
    
    if (hasMaleTerm && (hasChangeTerm || input.length < 10)) {
        return 'male';
    }
    
    if (hasFemaleTerm && (hasChangeTerm || input.length < 10)) {
        return 'female';
    }
    
    return null;
}

// 성별 변경 함수
async function changeGender(newGender, isStart = true) {
    console.log(`성별 변경 시도: ${newGender}, 현재 성별: ${window.characterGender}`);
    
    // 단순화: 항상 요청된 성별로 변경
    const targetGender = newGender.toLowerCase().includes('male') || 
                         newGender.toLowerCase().includes('m') || 
                         newGender.toLowerCase().includes('남') ? 'male' : 'female';
    
    // 이전 성별 기록
    const oldGender = window.characterGender;
    
    // 새 성별로 직접 설정
    window.characterGender = targetGender === 'male' ? 'M' : 'F';
    
    console.log(`성별 변경: ${oldGender} -> ${window.characterGender}`);
    
    if (isStart) {
        try {
            await window.start(targetGender);
            console.log(`성별 변경 성공: ${oldGender} -> ${window.characterGender}`);
            return true;
        } catch (error) {
            console.error("성별 변경 중 오류:", error);
            return false;
        }
    }
    return true;
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
    'eyebrowStyle': ['눈썹', '아이브로우'],
    'skinColor': ['피부색', '피부 컬러', '피부색상', '피부톤'],
    'hairColor': ['머리색', '헤어 컬러', '헤어색', '머리색상'],
    'eyebrowColor': ['눈썹색', '아이브로우 컬러', '눈썹색상']
    };

    if (partKeywords[part]) {
    return partKeywords[part].some(keyword => lowerInput.includes(keyword));
    }
    return false;
}

// [추가] 여러 파트를 병렬 처리하는 함수
async function getMultipleAssetIds(partDescriptions, userInput, changeType) {
  const tasks = Object.entries(partDescriptions)
    .filter(([part]) => changeType === 'full' || isPartRequested(part, userInput))
    .map(async ([part, description]) => {
      const assetResult = await findBestAssetId(part, description);
      return [part, assetResult];
    });
  const results = await Promise.all(tasks);
  return Object.fromEntries(results);
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
            'skinColor': "설명",
            'hairColor': "설명",
            'eyebrowColor': "설명"
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
            'skinColor': "설명",
            'hairColor': "설명",
            'eyebrowColor': "설명"
        }
        텍스트가 아닌 정확한 JSON 형식으로만 응답하세요.
    `;

    let msg = window.characterGender === 'M' ? msg_male : msg_female;        
    
    const response = await callRes({
    model: "gpt-4o",
    messages: [
        { role: "system", content: msg },
        {
        role: "user",
        content: `이 요청에 맞는 캐릭터 파트별 설명을 생성해주세요: "${userInput}". 변경 타입: ${changeType}`
        }
    ]    
    , response_format: { type: "json_object" }    
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
        'eyebrowStyle': "기본 눈썹",
        'skinColor': "기본 피부색",
        'hairColor': "기본 머리색",
        'eyebrowColor': "기본 눈썹색"        
    };
    }
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
        const partName = getPartDisplayName(part);
        
        // 설명이 너무 길면 짧게 줄이기
        const desc = descriptions[part] || '';
        const shortDesc = desc.length > 50 ? desc.substring(0, 50) + "..." : desc;
        
        // 폴백 여부에 따라 다른 메시지 표시
        if (changes[part].fallback) {
            summary += `${partName}을(를) 기본 스타일로 설정했습니다. `;
        } else {
            summary += `${partName}을(를) ${shortDesc} 스타일로 변경했습니다. `;
        }
    });
    
    return summary;
}

// [추가] 대화 내역 관리
const conversationHistory = [
    { role: 'system', content: `# 교육용 메타버스 캐릭터 커스터마이저 시스템

당신은 교육용 메타버스 플랫폼의 자연어 기반 캐릭터 커스터마이징 시스템입니다. 사용자가 자연어로 요청하는 캐릭터 생성 및 수정 요청을 이해하고, 적절한 에셋 ID를 매칭하여 반환해야 합니다.

## 역할 및 목적
- 사용자의 자연어 요청을 정확히 이해합니다
- 요청이 전체 캐릭터 변경인지 부분 변경인지 분석합니다
- 교육 환경에 적합한 캐릭터 에셋을 선택합니다
- 사용자 요청을 에셋 ID 조합으로 변환합니다` }
];
function addToConversation(role, content) {
  // 메시지 크기 제한 (긴 응답 요약)
  const MAX_MESSAGE_LENGTH = 1000;
  if (content.length > MAX_MESSAGE_LENGTH) {
    content = content.substring(0, MAX_MESSAGE_LENGTH - 3) + '...';
  }
  
  conversationHistory.push({ role, content });
  
  // 최대 대화 길이 제한
  const MAX_CONVERSATION_LENGTH = 10;
  if (conversationHistory.length > MAX_CONVERSATION_LENGTH) {
    // 시스템 메시지는 유지, 오래된 대화는 삭제
    const systemMessages = conversationHistory.filter(msg => msg.role === 'system');
    const recentMessages = conversationHistory.slice(-MAX_CONVERSATION_LENGTH + systemMessages.length);
    conversationHistory = [...systemMessages, ...recentMessages];
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

// 기존 메시지 표시 함수
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

function getPartDisplayName(part) {
    return {
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
        'eyebrowStyle': '눈썹',
        'skinColor': '피부색',
        'hairColor': '머리색',
        'eyebrowColor': '눈썹색'
    }[part] || part;
}

function base64ToBytes(base64) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
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

// 1. 사용자 표현의 참조 해석 기능 (예: "머리를 더 짧게")
async function resolveReferences(userInput) {
    // 대화 히스토리가 충분하지 않으면 바로 입력 반환
    if (conversationHistory.length < 3) return userInput;
    
    const response = await cachedOpenAICall({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "사용자의 요청에 '더', '그것', '이전 것', '아까' 같은 이전 대화 참조가 있는지 확인하고, " +
                         "참조가 있다면 이전 대화를 고려하여 완전한 요청으로 변환하세요. " + 
                         "참조가 없다면 원래 요청을 그대로 반환하세요."
            },
            ...conversationHistory.slice(-4), // 최근 대화 제공
            {
                role: "user",
                content: `이 요청을 완전한 표현으로 바꿔주세요: "${userInput}"`
            }
        ]
    });
    
    const fullRequest = response.choices[0].message.content;
    console.log(`참조 해석: "${userInput}" → "${fullRequest}"`);
    return fullRequest;
}

// 2. 문맥 기반으로 요청된 파트 분석 (키워드 매칭 대신)
async function analyzeRequestedParts(userInput, previousContext = "") {
    const response = await cachedOpenAICall({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "사용자의 요청에서 캐릭터 커스터마이징에서 변경하려는 부분을 분석하세요. " + 
                         "다음 부분들에 대해 변경 요청이 있는지 확인하고, JSON 형식으로 true/false 값을 반환하세요: " +
                         "hair, face, top, bottom, footwear, eyeColor, glasses, headwear, lipShape, noseShape, " +
                         "facewear, beard, eyebrowStyle, skinColor, hairColor, eyebrowColor."
            },
            {
                role: "user",
                content: `사용자 요청: "${userInput}"
                         ${previousContext ? `이전 대화 문맥: ${previousContext}` : ''}`
            }
        ],
        response_format: { type: "json_object" }
    });
    
    try {
        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error("분석 결과 파싱 오류:", error);
        return {}; // 오류 시 빈 객체 반환
    }
}

// 3. 정보 요청에 대한 응답 생성 (커스터마이징이 아닌 질문)
async function generateInformationResponse(userInput, details = {}) {
    // 사용자가 질문한 내용에 대한 정보 제공
    const response = await callRes({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "당신은 교육용 메타버스 플랫폼의 캐릭터 커스터마이징 도우미입니다. " +
                        "사용자의 질문에 캐릭터 커스터마이징 관련 정보를 제공해주세요. " +
                        "답변은 친절하고 도움이 되어야 합니다."
            },
            {
                role: "user",
                content: userInput
            }
        ]
    });
    
    return response.choices[0].message.content;
}

// 4. 개선된 의도 분석 함수 - 더 상세한 의도와 세부사항 추출
async function analyzeUserIntent(userInput) {
    const previousContextText = conversationHistory.slice(-4)
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => msg.content).join("\n");
    
    const response = await cachedOpenAICall({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `사용자의 요청을 분석하여 의도를 파악하세요. 가능한 의도 유형:
                1. gender_change: 성별 변경 요청
                2. full_customization: 전체 스타일 변경
                3. partial_customization: 부분 변경
                4. information: 캐릭터 커스터마이징 관련 정보 요청
                5. undo: 이전 변경 취소 요청
                6. comparison: 이전 상태와 비교 요청
                7. other: 기타 요청
                
                JSON 형식으로 다음 정보를 포함해 응답하세요:
                {
                    "type": "의도유형",
                    "details": {
                        "parts": ["변경하려는 부위1", "변경하려는 부위2", ...],
                        "style": "요청된 스타일 설명",
                        "gender": "언급된 성별(있는 경우)",
                        "reference": "참조하는 이전 대화 내용(있는 경우)"
                    }
                }`
            },
            ...(previousContextText ? [{
                role: "system",
                content: `이전 대화 문맥: ${previousContextText}`
            }] : []),
            {
                role: "user", 
                content: userInput
            }
        ],
        response_format: { type: "json_object" }
    });
    
    try {
        const result = JSON.parse(response.choices[0].message.content);
        return result;
    } catch (error) {
        console.error("의도 분석 결과 파싱 오류:", error);
        return { type: "partial_customization", details: {} };
    }
}

// 5. 개선된 streamChatResponse 함수로 문맥 활용
async function streamChatResponse(userMessage, messageElement) {
    try {
        // 1. 참조 해석 수행
        const resolvedMessage = await resolveReferences(userMessage);
        
        // 2. 원래 사용자 메시지는 그대로 대화 내역에 저장
        addToConversation("user", userMessage);
        
        // 3. 로딩 상태 표시
        messageElement.textContent = "요청을 이해하고 있습니다...";
        scrollToBottom(aiChatMessages, true);

        // 4. 개선된 의도 분석 호출 (문맥 고려)
        const intent = await analyzeUserIntent(resolvedMessage);
        console.log("분석된 의도:", intent);

        // 5. 의도 유형에 따른 분기 처리
        switch(intent.type) {
            case "gender_change":
                // 성별 변경 요청 처리
                const genderType = intent.details?.gender || 
                (resolvedMessage.includes('남') ? 'male' : 'female');

                console.log("성별 변경 감지: ", genderType);
                console.log("현재 성별: ", window.characterGender);

                messageElement.textContent = `${genderType === 'male' ? '남성' : '여성'} 캐릭터로 변경 중...`;
                updateProcessingStatus(messageElement, messageElement.textContent, 50);

                const changeResult = await changeGender(genderType);
                console.log("성별 변경 결과: ", changeResult);
                
                const genderResponse = `${genderType === 'male' ? '남성' : '여성'} 캐릭터로 변경했습니다. 다른 요청이 있으신가요?`;
                messageElement.innerHTML = convertMarkdownToHtml(genderResponse);
                addToConversation("assistant", genderResponse);
                return;
                
            case "information":
                // 정보 요청 처리
                messageElement.textContent = "질문에 대한 답변을 준비 중...";
                const infoResponse = await generateInformationResponse(resolvedMessage, intent.details);
                messageElement.innerHTML = convertMarkdownToHtml(infoResponse);
                addToConversation("assistant", infoResponse);
                return;
            
            case "undo":
                // 되돌리기 기능 (향후 구현)
                messageElement.textContent = "죄송합니다, 현재 이전 상태로 되돌리기 기능은 지원하지 않습니다.";
                addToConversation("assistant", messageElement.textContent);
                return;
                
            case "comparison":
                // 비교 기능 (향후 구현)
                messageElement.textContent = "죄송합니다, 현재 이전 상태와 비교 기능은 지원하지 않습니다.";
                addToConversation("assistant", messageElement.textContent);
                return;
                
            default:
                // partial_customization 또는 full_customization 처리 (기존 로직)
                break;
        }

        // 6. 변경 유형 결정 (문맥 고려)
        const changeType = intent.type === 'full_customization' ? 'full' : 'partial';
        
        // 7. 진행 상황 업데이트
        messageElement.textContent = changeType === 'full' 
            ? "새로운 스타일의 캐릭터를 준비하고 있습니다..." 
            : "요청하신 부분을 수정하고 있습니다...";
        updateProcessingStatus(messageElement, messageElement.textContent, 30);
        
        scrollToBottom(aiChatMessages, true);
        
        // 8. 개선된 캐릭터 변경 처리 (문맥 활용)
        const changeResult = await processNaturalLanguageCustomizationWithContext(resolvedMessage, intent);
        
        // 지연 추가
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 9. AI 응답 생성 요청
        const systemPrompt = '당신은 교육용 메타버스 플랫폼의 캐릭터 커스터마이징 도우미입니다. 사용자의 요청에 따라 캐릭터가 변경되었습니다. 변경 내용을 자연스럽게 설명하세요.';
        const userPrompt = `사용자 요청: "${resolvedMessage}"\n\n변경 내용: ${changeResult}\n\n이 변경 사항을 친절하고 자연스럽게 설명해주세요.`;
        
        // 스트리밍 응답 처리 (기존 로직 유지)
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 300; // ms
        let fullText = '';
        
        // 마크다운 변환 처리 준비
        messageElement.innerHTML = '';
        
        // fetchStreamingResponse 함수 호출 (기존 로직)
        async function fetchStreamingResponse() {
            // ...existing code...
            while (retryCount <= maxRetries) {
                try {
                    // callRes 함수를 사용해 스트리밍 응답 받기
                    const response = await callRes({
                        model: 'gpt-4o',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        stream: true
                    });

                    // 응답 스트리밍 처리 로직...
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder('utf-8');

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n').filter(line => line.trim() !== '');

                        for (const line of lines) {
                            if (line.includes('data: [DONE]')) continue;
                            
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.slice(6)); // "data: " 제거
                                    if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                                        const content = json.choices[0].delta.content;
                                        fullText += content;
                                        
                                        // 렌더링
                                        messageElement.innerHTML = convertMarkdownToHtml(fullText);
                                        
                                        // HTML 변환 실패 시 일반 텍스트 표시
                                        if (!messageElement.innerHTML) {
                                            messageElement.textContent = fullText;
                                        }
                                        
                                        // 스크롤 조정
                                        scrollToBottom(aiChatMessages, false);
                                    }
                                } catch (e) {
                                    console.error('응답 파싱 오류:', e, line);
                                }
                            }
                        }
                    }
                    
                    return; // 성공 시 함수 종료
                } catch (error) {
                    // 재시도 로직...
                    retryCount++;
                    console.error(`API 요청 실패 (${retryCount}/${maxRetries}):`, error);
                    
                    if (retryCount <= maxRetries) {
                        messageElement.innerHTML = `응답 요청 실패... ${retryCount}번째 재시도 중`;
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    } else {
                        messageElement.innerHTML = '죄송합니다, 요청을 처리하는 중 오류가 발생했습니다.';
                        throw error;
                    }
                }
            }
        }

        // 스트리밍 응답 실행
        await fetchStreamingResponse();
        addToConversation("assistant", fullText);
        scrollToBottom(aiChatMessages, true);

    } catch (error) {
        console.error("AI 응답 처리 중 오류:", error);
        messageElement.textContent = "AI 응답을 표시하는 중 문제가 발생했습니다.";
    }
}

// 6. 문맥을 활용한 커스터마이징 처리 함수
async function processNaturalLanguageCustomizationWithContext(resolvedMessage, intent) {
    // 이미 성별 변경이 처리되었으면 넘어감
    if (intent.type === 'gender_change') {
        return "성별이 변경되었습니다.";
    }
    
    const changeType = intent.type === 'full_customization' ? 'full' : 'partial';
    
    // 1. 이전 문맥을 고려한 파트 요청 분석
    const previousContextText = conversationHistory.slice(-6)
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => msg.content).join("\n");
    
    // 2. 파트별 설명 생성 요청 전 문맥 활용
    const partDescriptions = await generatePartDescriptionsWithContext(
        resolvedMessage, 
        changeType, 
        intent.details?.parts || [],
        previousContextText
    );
    console.log("AI 생성 파트 설명 (문맥 활용):", partDescriptions);
    
    // 3. 병렬로 asset ID 선택 처리
    const results = await getMultipleAssetIds(partDescriptions, resolvedMessage, changeType, intent);
    
    // 4. 결과 처리 로직
    const appliedChanges = {};
    const actualDescriptions = {};
    
    Object.entries(results).forEach(([part, result]) => {
        appliedChanges[part] = result;
        actualDescriptions[part] = result.fallback ? result.actualDescription : result.requestedDescription;
    });
    
    // 5. 변경 사항 적용
    await window.applyAssetChanges(results);
    
    // 6. 변경 요약 생성
    const summary = generateChangeDescription(actualDescriptions, appliedChanges);
    
    // 7. 폴백 사용 항목에 대한 정보 포함
    const actualChangeInfo = Object.entries(results)
        .filter(([_, result]) => result.fallback)
        .map(([part, result]) => {
            const partName = getPartDisplayName(part);
            return `${partName}의 경우 "${result.requestedDescription}" 요청이 지원되지 않아 기본 스타일을 적용했습니다.`;
        })
        .join(' ');
    
    // 8. 최종 설명 반환
    return actualChangeInfo ? `${summary} (참고: ${actualChangeInfo})` : summary;
}

// 7. 문맥을 활용한 파트별 설명 생성
async function generatePartDescriptionsWithContext(userInput, changeType, requestedParts = [], previousContext = "") {
    const msg_context = `
        이전 대화 문맥: ${previousContext}
    `;
    
    const msg_base = `
        사용자의 요청과 이전 대화 문맥을 고려하여 캐릭터의 각 부분별 특성을 자연어로 설명해주세요.
        해당 사항이 없는 경우 항목을 제외하거나, "없음" 또는 "기본"으로 대답하세요.
        ${changeType === 'partial' ? '요청된 부분만 변경하고 나머지는 그대로 유지하세요.' : '전체적인 스타일 변경을 수행하세요.'}
        반드시 다음 JSON 형식으로 응답해야 합니다:
    `;
    
    const msg_male = `
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
            'skinColor': "설명",
            'hairColor': "설명",
            'eyebrowColor': "설명"
        }
    `;
    
    const msg_female = `
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
            'skinColor': "설명",
            'hairColor': "설명",
            'eyebrowColor': "설명"
        }
    `;
    
    const genderMsg = window.characterGender === 'M' ? msg_male : msg_female;
    const msg = msg_base + genderMsg + "\n텍스트가 아닌 정확한 JSON 형식으로만 응답하세요.";
    
    const response = await callRes({
        model: "gpt-4o",
        messages: [
            { role: "system", content: msg },
            { role: "system", content: msg_context },
            {
                role: "user",
                content: `이 요청에 맞는 캐릭터 파트별 설명을 생성해주세요: "${userInput}". 변경 타입: ${changeType}, 특별히 요청된 부분: ${JSON.stringify(requestedParts)}`
            }
        ],        
        response_format: { type: "json_object" }
    });
    
    // 응답에서 JSON 추출 및 파싱 (기존 로직)
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
            // 기본 파트 설명...
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
            'eyebrowStyle': "기본 눈썹",
            'skinColor': "기본 피부색",
            'hairColor': "기본 머리색",
            'eyebrowColor': "기본 눈썹색"
        };
    }
}

// 대화 횟수 제한을 위한 변수
const MAX_CONVERSATION_COUNT = 25;
let conversationCount = 0;

// 키워드 매칭이 아닌 문맥 이해 방식으로 개선된 성별 변경 감지
async function analyzeGenderIntent(userInput, conversationContext) {
    const response = await cachedOpenAICall({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "사용자의 메시지가 캐릭터 성별 변경 요청인지 판단하고, 요청된 성별이 무엇인지 파악하세요."
            },
            {
                role: "system", 
                content: conversationContext || ""
            },
            {
                role: "user",
                content: `사용자 메시지: "${userInput}"\n\n이 메시지가 성별 변경 요청인 경우 "male" 또는 "female"을 반환하고, 아니면 "none"을 반환하세요.`
            }
        ],
        response_format: { type: "text" }
    });
    
    const result = response.choices[0].message.content.trim().toLowerCase();
    return result === "male" || result === "female" ? result : null;
}

// 일상 대화 처리 방식
async function handleUserMessage(userInput) {
    const purposeCheck = await checkMessagePurpose(userInput);
    
    if (purposeCheck.isCustomizationRelated) {
        // 커스터마이징 관련 - 정상 처리
        return processCustomizationRequest(userInput);
    } else if (purposeCheck.isEducationalQuery) {
        // 교육 관련 질문 - 제한적 허용
        return generateEducationalResponse(userInput);
    } else {
        // 완전히 오프토픽인 경우 - 친절하게 주제로 유도
        return `죄송합니다만, 저는 캐릭터 커스터마이징과 교육용 메타버스에 관한 질문에 답변하도록 설계되었습니다. 캐릭터에 적용하고 싶은 스타일이나 변경 사항이 있으시면 말씀해주세요.`;
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


