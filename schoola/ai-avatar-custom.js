import { callRes, convertMarkdownToHtml, debugLog } from 'https://arms00.github.io/schoola/ai-utils.js';

const aiChatMessages = document.getElementById('aiChatMessages');

const assetCatalog = {
    hair: [], face: [], top: [],
    bottom: [], footwear: [], eyeColor: [],
    eyeShape: [], glasses: [], headwear: [],
    lipShape: [], noseShape: [], facewear: [],
    beard: [], beardColor: [], eyebrowStyle: [],
    skinColor: [], hairColor: [], eyebrowColor: [],
};

window.assetCatalog = assetCatalog;

// 파트 이름 변환 함수
function mapPartName(partName) {
    const partNameMap = {
        '헤어스타일': 'hair',
        '얼굴형': 'face',
        '상의': 'top',
        '하의': 'bottom',
        '신발': 'footwear',
        '눈 색상': 'eyeColor',
        '눈 모양': 'eyeShape',
        '안경': 'glasses',
        '모자': 'headwear',
        '입술': 'lipShape',
        '코': 'noseShape',
        '페이스 웨어': 'facewear',
        '수염': 'beard',
        '수염색': 'beardColor',
        '눈썹': 'eyebrowStyle',
        '피부색': 'skinColor',
        '머리색': 'hairColor',
        '눈썹색': 'eyebrowColor'
    };
    return partNameMap[partName] || partName;
}

// 내부 파트 이름을 API 키로 변환하는 함수
function getApiKeyForPart(part) {
    return mapPartName(part);
}

// 통합된 에셋 ID 찾기 함수
async function findAssetId(part, description, options = {}) {
    let { matchPriority = "similar", currentAssetId = null } = options;
    const maxAttempts = 5; // 최대 반복 횟수 제한
    let attemptCount = 0;
    
    // 이미 로드된 파트 데이터 사용
    const partData = assetCatalog[part] || [];
    console.log(`${part} 데이터 항목 수:`, partData.length);

    // partData가 비어있으면 폴백 ID 반환
    if (partData.length === 0) {
        console.warn(`${part} 데이터가 없어 기본값 사용`);
        return getFallbackWithDetails(part, description);
    }

    // 재귀 대신 반복문 사용
    while (attemptCount < maxAttempts) {
        attemptCount++;
        try {
            // 현재 에셋 ID를 프롬프트에 포함
            let currentAssetPrompt = "";
            if (currentAssetId) {
                currentAssetPrompt = `현재 적용된 에셋 ID는 "${currentAssetId}"입니다. 사용자 요청에 더 적합한 다른 에셋이 있다면 그것을 선택하세요.`;
            }
            
            // 매칭 우선순위에 따라 다른 프롬프트 사용
            let priorityPrompt = "";
            switch (matchPriority) {
                case "exact":
                    priorityPrompt = "사용자의 요청과 완벽히 일치하는 에셋만 선택하세요.";
                    break;
                case "similar":
                    priorityPrompt = "사용자의 요청과 가장 유사한 에셋을 선택하세요. 완벽히 일치하지 않더라도 괜찮습니다.";
                    break;
                case "any":
                    priorityPrompt = "사용자의 요청과 약간이라도 관련 있는 에셋을 선택하세요.";
                    break;
            }
            
            const response = await callRes({            
                messages: [
                    {
                        role: "system",
                        content: `주어진 설명과 가장 일치하는 에셋의 ID를 선택하세요. ${priorityPrompt} ${currentAssetPrompt} JSON 데이터는 다음과 같습니다: ${JSON.stringify(partData)}`
                    },
                    {
                        role: "user",
                        content: matchPriority === "simple" ?
                            `"${description}" 설명과 가장 잘 맞는 에셋의 ID만 반환하세요.` :
                            `"${description}" 설명과 가장 잘 맞는 에셋의 ID를 찾아주세요. 결과를 JSON 형식으로 반환하세요: {"id": "선택한 ID", "confidence": 1-10 사이 숫자, "reason": "선택 이유", "is_different_from_current": true/false}`
                    }
                ],
                response_format: matchPriority === "simple" ? undefined : { type: "json_object" }
            });
            
            // simple 모드인 경우 
            if (matchPriority === "simple") {
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
                    return getFallbackWithDetails(part, description);
                }
            }
            
            // 정상 모드 (고급 처리 포함)
            const result = safeJsonParse(response.choices[0].message.content);
            
            // 현재 ID와 동일하고 변경이 필요한 경우
            if (currentAssetId && result.id === currentAssetId && !result.is_different_from_current) {
                // 신뢰도에 따른 처리
                if (result.confidence >= 8) {
                    console.log(`${part}의 현재 에셋이 이미 최적입니다. 신뢰도: ${result.confidence}`);
                    return { 
                        id: result.id, 
                        requestedDescription: description, 
                        fallback: false,
                        actualDescription: findAssetDescription(partData, result.id),
                        confidence: result.confidence,
                        reason: result.reason,
                        matchPriority,
                        noChange: true  // 변경 없음을 표시
                    };
                } else {
                    console.log(`${part}에 대해 현재 에셋과 다른 대안 검색 중...`);
                    
                    const altResponse = await callRes({                    
                        messages: [
                            {
                                role: "system",
                                content: `주어진 설명과 일치하면서, 현재 에셋(ID: "${currentAssetId}")과는 다른 대체 에셋을 찾아주세요. 가능한 유사한 품질과 스타일을 유지하되, 요청에 적합한 대안을 선택하세요. JSON 데이터는 다음과 같습니다: ${JSON.stringify(partData)}`
                            },
                            {
                                role: "user",
                                content: `"${description}" 설명과 일치하면서 ID가 "${currentAssetId}"가 아닌 대체 에셋을 찾아주세요. 결과를 JSON 형식으로 반환하세요: {"id": "선택한 ID", "confidence": 1-10 사이 숫자, "reason": "선택 이유"}`
                            }
                        ],
                        response_format: { type: "json_object" }
                    });
                    
                    const altResult = safeJsonParse(altResponse.choices[0].message.content);
                    
                    if (altResult.id === currentAssetId) {
                        console.log(`${part}에 대해 적절한 대체 에셋을 찾을 수 없습니다.`);
                        return { 
                            id: result.id, 
                            requestedDescription: description, 
                            fallback: false,
                            actualDescription: findAssetDescription(partData, result.id),
                            confidence: result.confidence,
                            reason: "대체 에셋을 찾을 수 없어 현재 에셋 유지",
                            matchPriority,
                            noChange: true  // 변경 없음을 표시
                        };
                    }
                    
                    return { 
                        id: altResult.id, 
                        requestedDescription: description, 
                        fallback: false,
                        actualDescription: findAssetDescription(partData, altResult.id),
                        confidence: altResult.confidence,
                        reason: altResult.reason,
                        matchPriority,
                        alternative: true  // 대체 에셋임을 표시
                    };
                }
            }
            
            const matchingAsset = partData.find(item => String(item.id || '') === result.id);
            if (matchingAsset) {
                return { 
                    id: result.id, 
                    requestedDescription: description, 
                    fallback: false,
                    actualDescription: matchingAsset.description || matchingAsset.name || description,
                    confidence: result.confidence,
                    reason: result.reason,
                    matchPriority
                };
            }
            
            // 재귀 호출 대신 매칭 우선순위 조정 후 다음 반복으로
            if (matchPriority !== "any" && matchPriority !== "simple") {
                matchPriority = matchPriority === "exact" ? "similar" : "any";
                console.log(`${part}에 대해 일치하는 에셋을 찾지 못했습니다. 매칭 우선순위를 '${matchPriority}'로 낮춥니다.`);
                continue; // 다음 반복으로
            }
            
            // 더 이상 매칭 우선순위를 낮출 수 없으면 폴백 반환
            return getFallbackWithDetails(part, description);
            
        } catch (error) {
            console.error(`${part} 에셋 ID 찾기 오류:`, error);
            return getFallbackWithDetails(part, description);
        }
    }

    // 최대 반복 횟수를 초과한 경우 폴백 반환
    console.warn(`${part}에 대해 최대 반복 횟수를 초과했습니다. 기본값을 반환합니다.`);
    return getFallbackWithDetails(part, description);
}

// 폴백 에셋 ID 반환 함수 (확장)
function getFallbackAssetId(part) {
    // 먼저 window.defaultCharacterJson에서 값을 확인
    if (window.defaultCharacterJson && 
        window.defaultCharacterJson.assets && 
        window.defaultCharacterJson.assets[part]) {
        
        console.log(`${part}의 기본값을 window.defaultCharacterJson에서 찾음:`, window.defaultCharacterJson.assets[part]);
        return window.defaultCharacterJson.assets[part];
    }
    
    // window.defaultCharacterJson에 값이 없을 경우 기본 ID 목록 사용
    const fallbacks = {
        'hair': '23368535',
        'face': '49918708',
        'top': 'kwhVa1YNStiAN8B7oceBpg',
        'bottom': '146120431',
        'footwear': 'NZtK7woLS_S1OtKh32jJDg',
        'eyeColor': '56993869',
        'eyeShape': '50095075',
        'glasses': '',
        'headwear': '',
        'lipShape': '49919049',
        'noseShape': '50094592', 
        'facewear': '',
        'beard': '',
        'beardColor': '',
        'eyebrowStyle': '41308196',
        'outfit': '',
        'skinColor': '4',
        'hairColor': '0',
    };
    
    const fallbackId = fallbacks[part] || '';
    console.log(`${part}의 기본값을 fallbacks에서 사용:`, fallbackId);
    return fallbackId;
}

// 진행 상태 업데이트 함수
function updateProcessingStatus(element, status, progress = 0) {
  element.innerHTML = `
    <div class="processing-status">
      <div class="progress-bar"><div style="width: ${progress}%"></div></div>
      <div class="status-text">${status}</div>
    </div>
  `;
}

// 성별 결정 헬퍼 함수
function determineTargetGender(input, currentGender) {
    const maleKeywords = ['남자', '남성', '남', 'male', '맨', 'man', '사내', '남정네', '남자로', '남성으로'];
    const femaleKeywords = ['여자', '여성', '여', 'female', '우먼', 'woman', '여인', '아가씨', '여자로', '여성으로'];

    let targetGender = input.toLowerCase().trim();

    if (targetGender !== 'male' && targetGender !== 'female') {
        console.log(`입력된 성별(${targetGender})이 정확한 형식이 아님, 키워드 분석 시도`);

        if (typeof targetGender === 'string') {
            const hasMaleKeyword = maleKeywords.some(keyword => targetGender.includes(keyword));
            const hasFemaleKeyword = femaleKeywords.some(keyword => targetGender.includes(keyword));

            if (hasMaleKeyword && !hasFemaleKeyword) {
                targetGender = 'male';
                console.log(`남성 키워드 감지: 성별을 'male'로 설정`);
            } else if (hasFemaleKeyword && !hasMaleKeyword) {
                targetGender = 'female';
                console.log(`여성 키워드 감지: 성별을 'female'로 설정`);
            } else {
                targetGender = currentGender === 'M' ? 'female' : 'male';
                console.log(`명확한 성별 키워드 없음: 현재 성별(${currentGender})의 반대로 설정 -> ${targetGender}`);
            }
        } else {
            targetGender = currentGender === 'M' ? 'female' : 'male';
            console.log(`유효한 성별 입력 없음: 현재 성별의 반대로 설정 -> ${targetGender}`);
        }
    }

    return targetGender;
}

// 성별 변경 함수 강화
async function changeGender(newGender, isStart = true) {
    console.log(`성별 변경 시도: 요청=${newGender}, 현재=${window.characterGender}`);

    const targetGender = determineTargetGender(newGender, window.characterGender);
    const finalCharGender = targetGender === 'male' ? 'M' : 'F';
    console.log(`적용할 성별: ${targetGender} (${finalCharGender})`);

    if (isStart) {
        try {
            window.characterGender = finalCharGender;
            console.log(`window.start 호출 직전: characterGender=${window.characterGender}`);
            await window.start(targetGender);
            console.log(`성별 변경 성공 확인: ${window.characterGender}`);
            return true;
        } catch (error) {
            console.error(`성별 변경 중 오류(${targetGender})`, error);
            return false;
        }
    }

    window.characterGender = finalCharGender;
    return true;
}

// 에셋 ID 캐싱을 위한 추가 설정
const assetIDCache = new Map();
const ASSET_CACHE_TTL = 1000 * 60 * 5; // 5분

// 에셋 설명 찾기 헬퍼 함수
function findAssetDescription(assetData, assetId) {
    const asset = assetData.find(item => String(item.id || '') === assetId);
    return asset ? (asset.description || asset.name || "기본 스타일") : "기본 스타일";
}

// 캐시된 에셋 ID 조회 또는 검색 함수
async function getCachedOrFindAssetId(part, description, matchPriority, currentAssetId) {
    const cacheKey = cacheManager.generateKey(part, description, currentAssetId);
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    // 실제 검색 실행 - 통합 함수 사용
    const result = await findAssetId(part, description, { matchPriority, currentAssetId });
    
    // 결과 캐싱
    cacheManager.set(cacheKey, result);
    
    return result;
}

// 캐시 관리 모듈화
const cacheManager = {
    cache: new Map(),
    TTL: 1000 * 60 * 5, // 5분
    MAX_SIZE: 100,

    generateKey(part, description, currentAssetId) {
        return `${part}:${description}:${currentAssetId || 'none'}`;
    },

    get(key) {
        const now = Date.now();
        if (this.cache.has(key)) {
            const { data, timestamp } = this.cache.get(key);
            if (now - timestamp < this.TTL) {
                console.log(`캐시 적중: ${key}`);
                return data;
            }
            this.cache.delete(key); // 만료된 항목 제거
        }
        return null;
    },

    set(key, data) {
        const now = Date.now();
        this.cache.set(key, { data, timestamp: now });

        // 캐시 크기 관리
        if (this.cache.size > this.MAX_SIZE) {
            const oldestKey = [...this.cache.entries()]
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            this.cache.delete(oldestKey);
        }
    }
};

// [추가] 대화 내역 관리
let conversationHistory = [
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
  if (!window.characterJson) return;
  const customPresets = JSON.parse(localStorage.getItem('customPresets') || '[]');
  customPresets.push({
    name,
    assets: { ...window.characterJson.assets },
    timestamp: Date.now()
  });
  localStorage.setItem('customPresets', JSON.stringify(customPresets));
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
        'beardColor': '수염색',
        'eyebrowStyle': '눈썹',
        'skinColor': '피부색',
        'hairColor': '머리색',
        'eyebrowColor': '눈썹색'
    }[part] || part;
}

// 2. 문맥 기반으로 요청된 파트 분석 (키워드 매칭 대신)
async function analyzeRequestedParts(userInput, previousContext = "") {
    const response = await callRes({        
        messages: [
            {
                role: "system",
                content: "사용자의 요청에서 캐릭터 커스터마이징에서 변경하려는 부분을 분석하세요. " + 
                         "다음 부분들에 대해 변경 요청이 있는지 확인하고, JSON 형식으로 true/false 값을 반환하세요: " +
                         "hair, face, top, bottom, footwear, eyeColor, glasses, headwear, lipShape, noseShape, " +
                         "facewear, beard, beardColor, eyebrowStyle, skinColor, hairColor, eyebrowColor."
            },
            {
                role: "user",
                content: `사용자 요청: "${userInput}"
                         ${previousContext ? `이전 대화 문맥: ${previousContext}` : ''}`
            }
        ],
        response_format: { type: "json_object" }
    }, { cache: true });
    
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

// 향상된 폴백 함수
function getFallbackWithDetails(part, description) {
    const fallbackId = getFallbackAssetId(part);
    return { 
        id: fallbackId, 
        requestedDescription: description, 
        fallback: true,
        actualDescription: "기본 스타일",
        confidence: 0,
        reason: "요청에 맞는 에셋을 찾을 수 없어 기본값 사용",
        matchPriority: "fallback"
    };
}

// 기타 의도에 대한 자연스러운 대화형 응답
async function generateConversationalResponse(userInput) {
    const response = await callRes({        
        messages: [
            {
                role: "system",
                content: `당신은 교육용 메타버스 플랫폼의 캐릭터 커스터마이징 도우미입니다. 
                사용자의 메시지가 캐릭터 커스터마이징과 직접 관련이 없는 것 같습니다.
                친절하게 대화에 응하되, 가능한 대화 주제를 캐릭터 커스터마이징 관련 내용으로 
                자연스럽게 유도해보세요. 답변은 간결하고 유용해야 합니다.`
            },
            {
                role: "user",
                content: userInput
            }
        ]
    });
    
    return response.choices[0].message.content;
}

// 참조 해석 함수 개선
async function resolveReferences(userInput) {
    // 대화 히스토리가 충분하지 않으면 바로 입력 반환
    if (conversationHistory.length < 3) return userInput;
    
    const response = await callRes({        
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
    }, { cache: true });
    
    const fullRequest = response.choices[0].message.content;
    
    // 변환된 내용이 원본과 다른 경우에만 로깅
    if (fullRequest !== userInput) {
        debugLog(`참조 해석: "${userInput}" → "${fullRequest}"`);
    }
    
    return fullRequest;
}

// 에러 처리 헬퍼 함수
async function handleError(error, retryState, messageElement, retryDelay) {
    const errorMsg = error.toString().toLowerCase();
    if (errorMsg.includes('token') || errorMsg.includes('length') || errorMsg.includes('too large')) {
        console.warn(`토큰/길이 제한 관련 오류 감지: ${errorMsg}`);
        retryState.count++;
        
        if (retryState.count <= retryState.maxRetries) {
            messageElement.innerHTML = `응답이 너무 길어 간소화하여 재시도 중... (${retryState.count}/${retryState.maxRetries})`;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return { shouldRetry: true, retryState };
        }
    } else {
        retryState.count++;
        console.error(`API 요청 실패 (${retryState.count}/${retryState.maxRetries}):`, error);
        
        if (retryState.count <= retryState.maxRetries) {
            messageElement.innerHTML = `응답 요청 실패... ${retryState.count}번째 재시도 중`;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return { shouldRetry: true, retryState };
        } else {
            messageElement.innerHTML = '죄송합니다, 요청을 처리하는 중 오류가 발생했습니다.';
            throw error;
        }
    }
    return { shouldRetry: false, retryState };
}

// 스트리밍 응답 생성 함수 분리
async function generateStreamingResponse(messageElement, systemPrompt, userPrompt, delay = 1.5) {
    let retryState = { count: 0, maxRetries: 3 };
    const retryDelay = 300; // ms
    let fullText = '';
    let lastUpdate = Date.now();
    const updateInterval = 500; // ms

    messageElement.innerHTML = '';
    await new Promise(resolve => setTimeout(resolve, delay * 1000));

    while (retryState.count <= retryState.maxRetries) {
        try {
            let effectivePrompt = userPrompt;

            if (retryState.count > 0) {
                if (retryState.count === 1) {
                    effectivePrompt = userPrompt + "\n\n응답을 간결하게 요약해서 제공해주세요. 200단어를 넘지 않도록 해주세요.";
                } else if (retryState.count === 2) {
                    effectivePrompt = userPrompt.split('\n')[0] + "\n\n매우 간결하게 핵심만 요약해서 100단어 이내로 답변해주세요.";
                } else {
                    effectivePrompt = "다음 요청에 대해 50단어 이내로 극도로 간결하게 답변해주세요: " + userPrompt.split('\n')[0];
                }
                console.log(`재시도 ${retryState.count}: 요청 단순화 적용`);
                messageElement.innerHTML = `응답을 간소화하여 재시도 중... (${retryState.count}/${retryState.maxRetries})`;
            }

            const response = await callRes({                
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: effectivePrompt }
                ],
                max_tokens: 1000 - (retryState.count * 250),
                stream: true
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let chunkCount = 0;
            fullText = '';
            let lineBuffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const data = lineBuffer + chunk;
                const lines = data.split('\n');
                lineBuffer = lines.pop() || '';

                for (const line of lines.filter(line => line.trim() !== '')) {
                    if (line.includes('data: [DONE]')) continue;
                    
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6);
                            const json = safeJsonParse(jsonStr);
                            if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                                const content = json.choices[0].delta.content;
                                fullText += content;
                                chunkCount++;

                                const now = Date.now();
                                if (chunkCount % 5 === 0 || (fullText.length > 20 && fullText.length < 1000) || (now - lastUpdate > updateInterval)) {
                                    messageElement.innerHTML = convertMarkdownToHtml(fullText);
                                    if (!messageElement.innerHTML) {
                                        messageElement.textContent = fullText;
                                    }
                                    window.scrollToBottom(aiChatMessages, false);
                                    lastUpdate = now;
                                }
                            }
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                console.log('미완성 JSON 감지됨, 다음 청크를 기다립니다.');
                            } else {
                                console.error('응답 파싱 오류:', e, line);
                            }
                        }
                    }
                }
            }

            messageElement.innerHTML = convertMarkdownToHtml(fullText);
            const MAX_STORED_LENGTH = 2000;
            const storedText = fullText.length > MAX_STORED_LENGTH ? 
                                fullText.substring(0, MAX_STORED_LENGTH) + "..." : 
                                fullText;
            addToConversation("assistant", fullText);
            window.scrollToBottom(aiChatMessages, true);
            return fullText;
            
        } catch (error) {
            const { shouldRetry, newRetryState } = await handleError(error, retryState, messageElement, retryDelay);
            retryState = newRetryState;
            if (!shouldRetry) break;
        }
    }
}

// 안전한 아이템 제거 함수 개선
async function processRemoveItems(removeItems) {
    if (!Array.isArray(removeItems) || removeItems.length === 0) {
        return null;
    }

    // 제거 가능한 아이템 매핑
    const removableItemMap = {
        'headwear': ['모자', '헤드웨어', '두건', '캡', '베레모', '헤드'],
        'glasses': ['안경', '선글라스', '글래스', '고글'],
        'facewear': ['마스크', '페이스웨어', '페이스 웨어']
    };
    
    console.log("아이템 제거 처리 시작:", removeItems);       
    
    // 제거할 아이템 목록 생성 (매핑 전)
    const itemsToRemove = {};
    const itemsAttemptedToRemove = [];
    
    // 1. 요청된 아이템 매핑 및 현재 상태 확인
    for (const item of removeItems) {
        // 아이템 이름 정규화
        const normalizedItem = item.toLowerCase().trim();
        itemsAttemptedToRemove.push(normalizedItem);
        
        // 매핑 시도
        for (const [part, keywords] of Object.entries(removableItemMap)) {
            if (normalizedItem === part || keywords.some(keyword => normalizedItem.includes(keyword))) {
                // 현재 아이템이 착용 중인지 확인 (window.characterJson 사용)
                const isWearing = window.characterJson?.assets && 
                                 window.characterJson.assets[part] && 
                                 window.characterJson.assets[part].length > 0;
                
                console.log(`아이템 확인: ${part}, 착용 중: ${isWearing}`);
                
                if (isWearing) {
                    // 아이템이 있는 경우만 제거 명령 추가
                    itemsToRemove[part] = '';
                } else {
                    console.log(`${part} 아이템은 이미 착용되어 있지 않습니다.`);
                }
                break;
            }
        }
    }
    
    // 2. 제거할 아이템이 없으면 조기 반환
    if (Object.keys(itemsToRemove).length === 0) {
        if (itemsAttemptedToRemove.length > 0) {
            return `요청하신 아이템(${itemsAttemptedToRemove.join(', ')})은 이미 착용되어 있지 않습니다.`;
        }
        return null;
    }
    
    // 3. 제거 시도 - 재시도 로직 추가
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
        try {
            console.log(`아이템 제거 시도:`, itemsToRemove);
            
            // itemsToRemove 객체 구조 자세히 출력
            for (const [key, value] of Object.entries(itemsToRemove)) {
                console.log(`제거 아이템 키: "${key}", 값 타입: ${typeof value}, 값: "${value}"`);
            }
            
            // 빈 문자열로 설정하여 아이템 제거
            await window.applyAssetChanges(itemsToRemove);
            
            // 제거 후 window.characterJson 확인
            console.log("제거 후 characterJson:", 
                window.characterJson.assets.glasses !== undefined ? 
                `glasses="${window.characterJson.assets.glasses}"` : 
                "glasses=undefined");
            
            const removedNames = Object.keys(itemsToRemove).map(key => getPartDisplayName(key));
            return `${removedNames.join(', ')}을(를) 제거했습니다.`;
        } catch (error) {
            const shouldRetry = await handleError(error, retryCount, maxRetries, messageElement, retryDelay);
            if (!shouldRetry) break;
        }
    }
}

// 성별 변경 처리를 위한 헬퍼 함수
async function handleGenderChange(intentAnalysis, messageElement, results) {
    const genderType = intentAnalysis.details?.gender || 
                     (intentAnalysis.userInput.includes('남') ? 'male' : 'female');
    
    messageElement.textContent = `${genderType === 'male' ? '남성' : '여성'} 캐릭터로 변경 중...`;
    updateProcessingStatus(messageElement, messageElement.textContent, 40);
    
    try {
        const genderChangeSuccess = await changeGender(genderType);
        results.genderChanged = genderChangeSuccess;
        
        // 성별 변경만 있는 경우 응답 생성
        if (intentAnalysis.primary_intent === "gender_change" && 
            intentAnalysis.secondary_intents.length === 0) {
            return `${genderType === 'male' ? '남성' : '여성'} 캐릭터로 변경했습니다. 다른 요청이 있으신가요?`;
        }
        
        messageElement.textContent = "성별을 변경했습니다. 나머지 요청을 처리 중...";
        updateProcessingStatus(messageElement, messageElement.textContent, 60);
        return null; // 다른 처리가 필요함을 나타냄
    } catch (error) {
        console.error("성별 변경 중 오류:", error);
        throw new Error("성별 변경 중 오류가 발생했습니다.");
    }
}

// 캐릭터 초기화 처리를 위한 헬퍼 함수
async function handleReset(intentAnalysis, messageElement, results) {
    messageElement.textContent = "캐릭터를 초기 상태로 되돌리는 중...";
    updateProcessingStatus(messageElement, messageElement.textContent, 50);
    
    try {
        const resetSuccess = await resetCharacterToDefault();
        
        // 초기화만 있는 경우 응답 생성
        if (intentAnalysis.primary_intent === "initial" && 
            intentAnalysis.secondary_intents.length === 0) {
            return resetSuccess ? 
                "캐릭터가 초기 상태로 되돌아갔습니다. 다른 요청이 있으신가요?" :
                "캐릭터 초기화 중 문제가 발생했습니다. 다시 시도해주세요.";
        }
        
        results.resetToDefault = resetSuccess;
        messageElement.textContent = "캐릭터를 초기화했습니다. 나머지 요청을 처리 중...";
        updateProcessingStatus(messageElement, messageElement.textContent, 60);
        return null; // 다른 처리가 필요함을 나타냄
    } catch (error) {
        console.error("캐릭터 초기화 중 오류:", error);
        throw new Error("캐릭터 초기화 중 오류가 발생했습니다.");
    }
}

// 아이템 제거 처리를 위한 헬퍼 함수
async function handleItemRemoval(intentAnalysis, messageElement, results) {
    const removeItems = intentAnalysis.details?.remove_items || [];
    if (removeItems.length === 0) return null;
    
    messageElement.textContent = "아이템을 제거하는 중...";
    updateProcessingStatus(messageElement, messageElement.textContent, 70);
    
    try {
        const removalResponse = await processRemoveItems(removeItems);
        if (removalResponse) {
            results.removedItems = removeItems;
        }
        
        // 제거만 있는 경우 응답 생성
        if (intentAnalysis.primary_intent === "remove_item" && 
            intentAnalysis.secondary_intents.length === 0) {
            return removalResponse || "요청하신 아이템을 제거했습니다.";
        }
        
        return null; // 다른 처리가 필요함을 나타냄
    } catch (error) {
        console.error("아이템 제거 중 오류:", error);
        return null; // 다른 처리 시도
    }
}

// 정보 제공 처리를 위한 헬퍼 함수
async function handleInformation(intentAnalysis, messageElement) {
    if (intentAnalysis.primary_intent !== "information" || 
        intentAnalysis.secondary_intents.length !== 0) return null;
    
    messageElement.textContent = "질문에 대한 답변을 준비 중...";
    try {
        return await generateInformationResponse(
            intentAnalysis.userInput, 
            intentAnalysis.details?.question_topic
        );
    } catch (error) {
        console.error("정보 제공 중 오류:", error);
        throw new Error("답변을 생성하는 데 문제가 발생했습니다.");
    }
}

// 특수 의도(undo, comparison) 처리를 위한 헬퍼 함수
function handleSpecialIntent(intentAnalysis) {
    if ((intentAnalysis.primary_intent === "undo" || 
         intentAnalysis.primary_intent === "comparison") && 
        intentAnalysis.secondary_intents.length === 0) {
        return (intentAnalysis.primary_intent === "undo") 
            ? "죄송합니다, 현재 이전 상태로 되돌리기 기능은 지원하지 않습니다." 
            : "죄송합니다, 현재 이전 상태와 비교 기능은 지원하지 않습니다.";
    }
    return null;
}

// 커스터마이징 처리를 위한 헬퍼 함수
async function handleCustomization(intentAnalysis, messageElement, results) {
    const hasCustomIntent = intentAnalysis.primary_intent === "full_customization" || 
                         intentAnalysis.primary_intent === "partial_customization" ||
                         intentAnalysis.secondary_intents.includes("full_customization") || 
                         intentAnalysis.secondary_intents.includes("partial_customization");
    
    if (!hasCustomIntent) return null;
    
    const changeType = intentAnalysis.primary_intent === "full_customization" || 
                     intentAnalysis.secondary_intents.includes("full_customization") 
                     ? "full" : "partial";
    
    messageElement.textContent = changeType === "full" ? 
        '새로운 스타일의 캐릭터를 준비하고 있습니다...' : 
        '요청하신 부분을 수정하고 있습니다...';
    
    updateProcessingStatus(messageElement, messageElement.textContent, 80);
    
    try {
        const customizationResult = await processAdvancedCustomization(
            intentAnalysis.userInput, 
            intentAnalysis, 
            changeType
        );
        
        results.customizationApplied = true;
        results.customizationDetails = customizationResult;
        return null; // 최종 응답은 통합 결과 요약으로 처리
    } catch (error) {
        console.error("커스터마이징 중 오류:", error);
        results.customizationDetails = "스타일 변경 중 오류가 발생했습니다.";
        return null;
    }
}

// 일반 대화 처리를 위한 헬퍼 함수
async function handleGeneralConversation(intentAnalysis, results) {
    const hasNoSpecificChanges = intentAnalysis.primary_intent === "other" && 
                               !results.genderChanged && 
                               !results.customizationApplied && 
                               results.removedItems.length === 0 &&
                               !results.resetToDefault;
    
    if (!hasNoSpecificChanges) return null;
    
    try {
        return await generateConversationalResponse(intentAnalysis.userInput);
    } catch (error) {
        console.error("대화 응답 생성 중 오류:", error);
        throw new Error("응답을 생성하는 중 문제가 발생했습니다.");
    }
}

// 복합 의도 처리 결과 요약 생성 헬퍼 함수
function generateResultSummary(results) {
    const combinedResults = [];
    
    if (results.genderChanged) {
        combinedResults.push("성별을 변경했습니다");
    }

    if (results.resetToDefault) {
        combinedResults.push("캐릭터를 초기 상태로 되돌렸습니다");
    }
    
    if (results.removedItems.length > 0) {
        const itemNames = results.removedItems.map(item => {
            return getPartDisplayName(item) || item;
        });
        combinedResults.push(`${itemNames.join(', ')}을(를) 제거했습니다`);
    }
    
    if (results.customizationDetails) {
        combinedResults.push(results.customizationDetails);
    }
    
    return combinedResults.join(". ");
}

// 리팩토링된 메인 스트리밍 응답 함수
window.streamChatResponse = async function(userMessage, messageElement, loadingInterval = null) {
    try {
        // 1. 참조 해석 및 대화 히스토리 추가
        const resolvedMessage = await resolveReferences(userMessage);
        addToConversation("user", userMessage);
        
        // 2. 로딩 상태 표시
        // messageElement.textContent = "요청을 분석하고 있습니다...";
        // window.scrollToBottom(aiChatMessages, true);
        
        // 3. 의도 분석
        const intentAnalysis = await analyzeUserIntent(resolvedMessage);
        intentAnalysis.userInput = resolvedMessage; // 해석된 메시지 저장
        debugLog("분석된 복합 의도:", intentAnalysis);
        
        // 의도 분석 결과 검증
        if (!intentAnalysis || typeof intentAnalysis !== 'object') {
            console.error("의도 분석 결과가 유효하지 않습니다:", intentAnalysis);
            messageElement.textContent = "요청을 이해하는데 문제가 있습니다. 다시 시도해주세요.";
            return;
        }
        
        // 4. 결과 저장 객체 준비
        const results = {
            genderChanged: false,
            removedItems: [],
            customizationApplied: false,
            customizationDetails: null,
            resetToDefault: false
        };

        // 5. 각 의도 처리 함수 순차 실행 - 처리된 경우 조기 반환
        // 5.1 특수 의도 처리 (다른 처리 불필요)
        const specialResponse = handleSpecialIntent(intentAnalysis);
        if (specialResponse) {
            messageElement.textContent = specialResponse;
            addToConversation("assistant", specialResponse);
            return;
        }
        
        // 5.2 성별 변경 처리
        if (intentAnalysis.primary_intent === "gender_change" || 
            intentAnalysis.secondary_intents.includes("gender_change")) {
            const genderResponse = await handleGenderChange(intentAnalysis, messageElement, results);
            if (genderResponse) {
                messageElement.innerHTML = convertMarkdownToHtml(genderResponse);
                addToConversation("assistant", genderResponse);
                return;
            }
        }
        
        // 5.3 초기화 처리
        if (intentAnalysis.primary_intent === "initial" || 
            intentAnalysis.secondary_intents.includes("initial")) {
            const resetResponse = await handleReset(intentAnalysis, messageElement, results);
            if (resetResponse) {
                messageElement.innerHTML = convertMarkdownToHtml(resetResponse);
                addToConversation("assistant", resetResponse);
                return;
            }
        }
        
        // 5.4 아이템 제거 처리
        if (intentAnalysis.primary_intent === "remove_item" || 
            intentAnalysis.secondary_intents.includes("remove_item")) {
            const removalResponse = await handleItemRemoval(intentAnalysis, messageElement, results);
            if (removalResponse) {
                messageElement.innerHTML = convertMarkdownToHtml(removalResponse);
                addToConversation("assistant", removalResponse);
                return;
            }
        }
        
        // 5.5 정보 요청 처리
        const infoResponse = await handleInformation(intentAnalysis, messageElement);
        if (infoResponse) {
            messageElement.innerHTML = convertMarkdownToHtml(infoResponse);
            addToConversation("assistant", infoResponse);
            return;
        }
        
        // 5.6 커스터마이징 처리
        await handleCustomization(intentAnalysis, messageElement, results);
        
        // 5.7 일반 대화 처리
        const conversationResponse = await handleGeneralConversation(intentAnalysis, results);
        if (conversationResponse) {
            messageElement.innerHTML = convertMarkdownToHtml(conversationResponse);
            addToConversation("assistant", conversationResponse);
            return;
        }
        
        // 6. 복합 의도 처리 결과 요약
        const finalResultSummary = generateResultSummary(results);
        
        // 7. 자연스러운 응답 생성
        const systemPrompt = `당신은 교육용 메타버스 플랫폼의 캐릭터 커스터마이징 도우미입니다. 
                             사용자의 요청에 따라 변경된 사항을 친절하고 자연스러운 대화체로 설명해주세요.`;
                             
        const userPrompt = `사용자 요청: "${resolvedMessage}"
                         처리된 변경 내용: ${finalResultSummary}
                         
                         이 변경 사항을 자연스러운 대화체로 설명하고, 필요하다면 다음 가능한 
                         커스터마이징 옵션도 제안해주세요.
                         (귀걸이나 목걸이 팔찌 등의 액세서리는 지원하지 않습니다.)
                         커스터마이징이 가능한 범위는 다음과 같습니다:                         
                            ["hair", "face", "top", "bottom", "footwear", "eyeColor", "eyeShape", 
                             "glasses", "headwear", "lipShape", "noseShape", "facewear", "beard", 
                             "beardColor", "eyebrowStyle", "skinColor", "hairColor", "eyebrowColor"]`;
                             
        // 8. 최종 응답 스트리밍
        await generateStreamingResponse(messageElement, systemPrompt, userPrompt);        
        
    } catch (error) {        
        console.error("AI 응답 처리 중 오류:", error);
        messageElement.textContent = "AI 응답을 표시하는 중 문제가 발생했습니다.";
    }
    if (loadingInterval){
        clearInterval(loadingInterval);
    }            
};

// 캐릭터를 초기 상태로 되돌리는 함수
async function resetCharacterToDefault() {
    console.log("캐릭터 초기화 시작...");
    
    try {
        // 1. 기본 에셋 준비
        const defaultAssets = {};
        
        // 초기화할 파트 목록
        const partsToReset = [
            'hair', 'face', 'top', 'bottom', 'footwear', 'eyeColor', 'eyeShape',
            'glasses', 'headwear', 'lipShape', 'noseShape', 'facewear', 'beard',
            'beardColor', 'eyebrowStyle', 'skinColor', 'hairColor', 'eyebrowColor'
        ];
        
        // 각 파트별로 기본값 설정
        for (const part of partsToReset) {
            // window.defaultCharacterJson에서 값을 가져오거나 기본값 사용
            defaultAssets[part] = window.defaultCharacterJson && 
                                 window.defaultCharacterJson.assets && 
                                 window.defaultCharacterJson.assets[part] !== undefined ?
                                 window.defaultCharacterJson.assets[part] : 
                                 getFallbackAssetId(part);
        }
        
        // 2. 성별이 다를 경우 먼저 성별 복원
        if (window.characterGender !== window.defaultCharacterGender) {
            const targetGender = window.defaultCharacterGender === 'M' ? 'male' : 'female';
            console.log(`초기 성별(${targetGender})로 변경 중...`);
            
            // 성별 변경 시도
            await changeGender(targetGender);
        }
        
        // 3. 모든 에셋 적용
        console.log("기본 에셋 적용 중...", defaultAssets);
        await window.applyAssetChanges(defaultAssets);
        
        return true;
    } catch (error) {
        console.error("캐릭터 초기화 중 오류 발생:", error);
        return false;
    }
}

// 개선된 의도 분석 함수 - 복합 의도 지원 및 검증 추가
async function analyzeUserIntent(userInput) {
    const previousContextText = conversationHistory.slice(-4)
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => msg.content).join("\n");

    const gender = window.characterGender === 'M' ? '남성' : '여성';
    
    const response = await callRes({        
        messages: [
            {
                role: "system",
                content: `사용자의 요청을 심층 분석하여 주요 의도와 보조 의도를 모두 파악하세요. 
                하나의 요청에 여러 의도가 포함될 수 있습니다(예: 성별 변경과 헤어스타일 변경).                
                
                가능한 의도 유형:
                - initial: 초기화 요청(캐릭터를 초기 상태로 되돌림)
                - gender_change: 성별 변경 요청
                - full_customization: 전체 스타일 변경
                - partial_customization: 부분 변경
                - remove_item: 특정 아이템 제거 요청
                - information: 캐릭터 커스터마이징 관련 정보 요청
                - undo: 이전 변경 취소 요청
                - comparison: 이전 상태와 비교 요청
                - other: 기타 요청
                
                ${gender}캐릭터에 어울리도록 다음 정보를 포함한 JSON으로 응답하세요.
                parts 명은 반드시 다음과 같이 지정된 key 중 하나여야 합니다
                ["hair", "face", "top", "bottom", "footwear", "eyeColor", "eyeShape", "glasses", "headwear","lipShape", "noseShape", "facewear", "beard", "beardColor", "eyebrowStyle", "skinColor", "hairColor", "eyebrowColor"]
                :
                {
                    "primary_intent": "주요 의도",
                    "secondary_intents": ["보조 의도1", "보조 의도2", ...],
                    "details": {
                        "parts": ["변경하려는 부위1", "변경하려는 부위2", ...],
                        "styles": {
                            "부위1": {
                                "description": "스타일 설명",
                                "match_priority": "exact|similar|any", // 매칭 우선순위
                                "importance": 1-10 // 중요도 (1-10)
                            },
                            // 다른 부위들...
                        },
                        "gender": "변경 요청된 성별",
                        "question_topic": "information 의도일 때 질문 주제",
                        "remove_items": ["제거할 아이템1", "제거할 아이템2"]
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
    }, { cache: true });

    // 성별 관련 키워드 직접 확인
    const genderKeywords = {
        'male': ['남자', '남성', '남정네', '사내', '남', 'male', 'man', 'men'],
        'female': ['여자', '여성', '여인', '아가씨', '여', 'female', 'woman', 'women', 'girl']
    };
    
    // 성별 키워드가 있는지 확인하는 보조 로직
    const detectedGender = Object.entries(genderKeywords).find(([gender, keywords]) =>
        keywords.some(keyword => userInput.toLowerCase().includes(keyword))
    )?.[0];
    
    try {
        const result = JSON.parse(response.choices[0].message.content);

        // 직접 감지한 성별로 보완
        if (detectedGender && (!result.details?.gender || result.details.gender === "null")) {
            console.log(`의도 분석에서 감지된 성별 없음, 직접 감지한 성별(${detectedGender}) 사용`);
            if (!result.details) result.details = {};
            result.details.gender = detectedGender;
        }
        
        // 응답 구조 검증 및 기본값 보강
        return {
            primary_intent: result.primary_intent || "partial_customization",
            secondary_intents: Array.isArray(result.secondary_intents) ? 
                result.secondary_intents : [],
            details: {
                parts: Array.isArray(result.details?.parts) ? 
                    result.details.parts : [],
                styles: result.details?.styles || {},
                gender: result.details?.gender || null,
                question_topic: result.details?.question_topic || "",
                remove_items: Array.isArray(result.details?.remove_items) ? 
                    result.details.remove_items : []
            }
        };
    } catch (error) {
        console.error("의도 분석 결과 파싱 오류:", error);
        return { 
            primary_intent: "partial_customization", 
            secondary_intents: [],
            details: { 
                parts: [],
                styles: {},
                gender: null,
                question_topic: "",
                remove_items: []
            }
        };
    }
}

// 3단계 매칭을 적용한 고급 커스터마이징 함수 수정
async function processAdvancedCustomization(userInput, intentAnalysis, changeType) {
    debugLog("고급 커스터마이징 처리 시작:");
    debugLog("- 입력:", userInput);
    debugLog("- 변경 타입:", changeType);
    debugLog("- 의도 데이터:", JSON.stringify(intentAnalysis, null, 2));
    
    // 1. 매칭 우선순위와 함께 파트별 설명 추출
    const partsWithPriority = {};
    const partStyles = intentAnalysis.details?.styles || {};
    
    debugLog("- 스타일 데이터:", JSON.stringify(partStyles, null, 2));
    
    // 2. 각 파트에 대해 처리할지 결정
    const requestedParts = intentAnalysis.details?.parts || []; // 요청된 파트 목록
    
    Object.entries(partStyles).forEach(([part, style]) => {
        // 유효성 검사 추가
        if (!style || typeof style !== 'object') {
            console.warn(`유효하지 않은 스타일 데이터: ${part}`, style);
            return;
        }
        
        // 기본값 제공
        const description = style.description || "기본 스타일";
        const matchPriority = (style.match_priority === "exact" || 
                             style.match_priority === "similar" || 
                             style.match_priority === "any") ? 
                             style.match_priority : "similar";
        const importance = typeof style.importance === 'number' ? 
                         style.importance : 5;
        
        // full 변경이거나, partial 변경이면서 요청한 파트인 경우만 처리
        // 요청된 파트 목록에 포함되어 있는지 확인
        if (changeType === "full" || requestedParts.includes(part)) {
            // 파트 이름 매핑
            const mappedPart = getApiKeyForPart(part);
            partsWithPriority[mappedPart] = { description, matchPriority, importance };
        }
    });
    
    debugLog("처리할 파트 및 우선순위:", partsWithPriority);
    
    // 3. 각 파트별로 3단계 매칭 적용하여 에셋 ID 찾기 - 캐싱 적용
    const tasks = Object.entries(partsWithPriority).map(async ([part, details]) => {
        try {
            // 현재 에셋 ID 가져오기
            const currentAssetId = window.characterJson?.assets ? 
                               window.characterJson.assets[getApiKeyForPart(part)] : 
                               null;
            
            // 캐시된 결과 또는 새로 검색
            const result = await getCachedOrFindAssetId(
                part, 
                details.description, 
                details.matchPriority,
                currentAssetId  // 현재 에셋 ID 전달
            );
            return [part, result];
        } catch (error) {
            console.error(`파트 ${part} 처리 중 오류:`, error);
            // 오류 시 폴백 결과 반환
            return [part, getFallbackWithDetails(part, details.description)];
        }
    });
    
    const results = await Promise.all(tasks);
    const assetsToApply = Object.fromEntries(results);
    
    // 변경 전 현재 에셋 상태 저장
    const currentAssets = { ...window.characterJson?.assets } || {};
    
    // 4. 변경 사항 적용
    try {
        await window.applyAssetChanges(assetsToApply);
        
        // 5. 변경 후 실제 적용된 에셋 확인
        const appliedAssets = {};
        const finalAssets = window.characterJson?.assets || {};
        
        // 각 파트별로 실제 적용된 에셋 ID 확인
        Object.entries(assetsToApply).forEach(([part, requestedAsset]) => {
            const apiKey = getApiKeyForPart(part);
            const appliedId = finalAssets[apiKey];
            
            console.log(`[${part}] 요청 에셋 ID: ${requestedAsset.id}, 적용된 에셋 ID: ${appliedId}`);
            
            // 실제 적용된 에셋 정보 저장
            appliedAssets[part] = {
                ...requestedAsset,
                appliedId: appliedId,
                wasApplied: requestedAsset.id === appliedId,
                actuallyChanged: currentAssets[apiKey] !== appliedId
            };
        });
        
        // 6. 실제 적용된 에셋의 설명 가져오기
        const getAppliedAssetDescription = (part, assetId) => {
            if (!assetId) return "기본 스타일";
            const partData = assetCatalog[part] || [];
            return findAssetDescription(partData, assetId);
        };

        // 적용된 에셋 ID로 실제 설명 업데이트
        Object.entries(appliedAssets).forEach(([part, result]) => {
            if (result.wasApplied && result.appliedId) {
                result.actualDescription = getAppliedAssetDescription(part, result.appliedId);
            }
        });

        // 7. 변경 내용 요약 생성 - 실제 적용된 에셋 기준
        const actualDescriptions = {};
        Object.entries(appliedAssets).forEach(([part, result]) => {
            actualDescriptions[part] = (result.fallback || result.alternative) ? 
                result.actualDescription : result.requestedDescription;
        });
        
        const summary = generateAccurateChangeDescription(actualDescriptions, appliedAssets);
        return summary;
    } catch (error) {
        console.error("변경 사항 적용 중 오류:", error);
        return "스타일 변경 중 오류가 발생했습니다.";
    }
}

// 정확한 변경 요약 생성을 위한 새 함수
function generateAccurateChangeDescription(descriptions, appliedAssets) {
    let summary = '';
    
    if (Object.keys(appliedAssets).length === 0) {
        return "변경사항이 없습니다.";
    }
    
    // 변경된 항목과 유지된 항목 분리
    const changedItems = [];
    const unchangedItems = [];
    const failedItems = [];
    
    Object.entries(appliedAssets).forEach(([part, result]) => {
        const partName = getPartDisplayName(part);
        const desc = descriptions[part] || '';
        const shortDesc = desc.length > 50 ? desc.substring(0, 50) + "..." : desc;
        
        // 실제로 적용되었는지 여부에 따라 다른 메시지 구성
        if (!result.wasApplied) {      
            // 요청한 에셋과 다른 에셋이 적용된 경우      
            failedItems.push(`${partName} 변경이 요청과 다르게 "${shortDesc}" 스타일로 적용되었습니다`);
        } else if (result.alternative) {
            // 대체 에셋이 적용된 경우
            changedItems.push(`${partName}을(를) 요청과 유사한 "${shortDesc}" 스타일로 변경했습니다`);
        } else if (!result.actuallyChanged) {
            // 이전과 동일한 에셋이 유지된 경우
            unchangedItems.push(`${partName}은(는) 변경되지 않았습니다`);
        } else if (result.fallback) {
            // 폴백 에셋이 적용된 경우
            changedItems.push(`${partName}을(를) 기본 스타일로 설정했습니다`);
        } else {
            // 정상적으로 변경된 경우
            changedItems.push(`${partName}을(를) ${shortDesc} 스타일로 변경했습니다`);
        }
    });
    
    // 변경, 유지, 실패 항목을 순서대로 표시
    if (changedItems.length > 0) summary += changedItems.join('. ');
    if (unchangedItems.length > 0) {
        if (summary) summary += '. ';
        summary += unchangedItems.join('. ');
    }
    if (failedItems.length > 0) {
        if (summary) summary += '. ';
        summary += failedItems.join('. ');
    }
    
    return summary;
}

// JSON 파싱 헬퍼 함수
function safeJsonParse(jsonString, defaultValue = {}) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("JSON 파싱 오류:", error);
        return defaultValue;
    }
}

