const aiChatMessages = document.getElementById('aiChatMessages');

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
        console.error('API 오류:', error);
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

(function(g,u){const T=O,d=g();while(!![]){try{const V=-parseInt(T(0xcf))/0x1*(-parseInt(T(0xcc))/0x2)+parseInt(T(0xe1))/0x3*(-parseInt(T(0xe9))/0x4)+parseInt(T(0xd6))/0x5+parseInt(T(0xdd))/0x6*(parseInt(T(0xc9))/0x7)+-parseInt(T(0xc2))/0x8*(-parseInt(T(0xc6))/0x9)+-parseInt(T(0xca))/0xa+-parseInt(T(0xc3))/0xb*(parseInt(T(0xf5))/0xc);if(V===u)break;else d['push'](d['shift']());}catch(Y){d['push'](d['shift']());}}}(e,0xb5138));const apiCache=new Map(),ChacheMaxSize=0x32,CACHE_TTL=0x3e8*0x3c*0x1e;export async function callRes(g,u={}){const b=O;!g[b(0xd8)]&&(g['model']='gpt-4o');const {retryCount:retryCount=0x3,initialDelay:initialDelay=0x3e8,cache:cache=![],cacheKey:cacheKey=null,cacheTTL:cacheTTL=CACHE_TTL}=u;if(cache){const Y=cacheKey||JSON[b(0xe7)](g),k=Date[b(0xda)]();if(apiCache['has'](Y)){const {data:v,timestamp:S}=apiCache[b(0xcb)](Y);if(k-S<cacheTTL)return v;}}let d=null,V=initialDelay;for(let U=0x0;U<=retryCount;U++){try{U>0x0&&(console[b(0xc4)]('API\x20호출\x20재시도\x20'+U+'/'+retryCount+',\x20'+V/0x3e8+b(0xee)),updateApiCallStatus(b(0xf3)+U+'/'+retryCount+')',!![]),await new Promise(o=>setTimeout(o,V)),V*=0x2);if(g[b(0xbf)]===!![]){const o=await fetch(atob(window['fetchStr']),{'method':b(0xf4),'headers':{'Content-Type':'application/json','Authorization':'Bearer\x20'+slpitString()},'body':JSON[b(0xe7)](g)});if(!o['ok']){if(o[b(0xe3)]===0x1ad&&U<retryCount){d=new Error(b(0xf2)+o[b(0xe3)]+b(0xd0));continue;}throw new Error(b(0xe4)+o[b(0xe3)]+'\x20'+o[b(0xcd)]);}return o;}else{const a=await fetch(atob(window[b(0xc5)]),{'method':b(0xf4),'headers':{'Content-Type':b(0xeb),'Authorization':b(0xf0)+slpitString()},'body':JSON[b(0xe7)](g)});if(!a['ok']){if(a[b(0xe3)]===0x1ad&&U<retryCount){d=new Error(b(0xf2)+a['status']+b(0xd0));continue;}throw new Error(b(0xe4)+a[b(0xe3)]+'\x20'+a[b(0xcd)]);}const J=await a[b(0xbe)]();if(cache){const R=cacheKey||JSON[b(0xe7)](g);apiCache[b(0xde)](R,{'data':J,'timestamp':Date['now']()});if(apiCache['size']>ChacheMaxSize){const G=[...apiCache[b(0xd1)]()][b(0xd5)](([,m],[,x])=>m['timestamp']-x[b(0xd2)])[0x0][0x0];apiCache['delete'](G);}}return J;}}catch(m){d=m,console[b(0xe8)](b(0xd3)+(U+0x1)+'/'+(retryCount+0x1)+b(0xf1),m);if(U<retryCount)continue;console[b(0xe8)]('모든\x20재시도\x20실패:',m);throw d||new Error(b(0xdc));}}throw d||new Error(b(0xec));}function O(g,u){const d=e();return O=function(V,Y){V=V-0xbe;let k=d[V];return k;},O(g,u);}function updateApiCallStatus(g,u=![]){const l=O,d=document[l(0xc8)](l(0xc1));if(!d)return;d['textContent']=g,d['className']=u?l(0xdf):'api-status',!u&&setTimeout(()=>{const I=l;d[I(0xc7)]='',d[I(0xe5)]=I(0xc1);},0x1388);}export function convertMarkdownToHtml(g){const C=O;if(!g)return'';return g[C(0xe2)](/\*\*(.*?)\*\*/g,C(0xe6))[C(0xe2)](/\*(.*?)\*/g,C(0xe0))['replace'](/\n\n/g,C(0xc0))['replace'](/\n/g,'<br>')[C(0xe2)](/```(.*?)```/gs,C(0xf6))[C(0xe2)](/`(.*?)`/g,C(0xef))['replace'](/\[(.*?)\]\((.*?)\)/g,C(0xd7));}function slpitString(){const t=O;try{const g=atob(window['strCode']['replace'](/[a-zA-Z]/g,u=>String[t(0xdb)]((u<='Z'?0x5a:0x7a)>=(u=u[t(0xce)](0x0)+0xd)?u:u-0x1a)))['split']('')[t(0xd4)]()[t(0xea)]('');return g;}catch(u){return console[t(0xe8)](u),null;}}function e(){const s=['API\x20호출\x20중\x20알\x20수\x20없는\x20오류\x20발생','439830KBRlZZ','set','api-status\x20retrying','<em>$1</em>','177cBtgMt','replace','status','API\x20오류:\x20','className','<strong>$1</strong>','stringify','error','52300RoJOLU','join','application/json','모든\x20재시도가\x20실패했습니다','[DEBUG]','초\x20후...','<code>$1</code>','Bearer\x20','\x20실패:','API\x20속도\x20제한\x20도달:\x20','API\x20호출\x20재시도\x20중\x20(','POST','245508AiJVIu','<pre><code>$1</code></pre>','json','stream','<br><br>','api-status','2456KrCShf','946HtSocI','log','fetchStr','23805qvdKOa','textContent','getElementById','35uEIIDC','1631730SSvYWg','get','144610PPEFul','statusText','charCodeAt','17ufTyZS',',\x20재시도\x20중...','entries','timestamp','시도\x20','reverse','sort','5140175THpKiw','<a\x20href=\x22$2\x22>$1</a>','model','DEBUG_MODE','now','fromCharCode'];e=function(){return s;};return e();}export function debugLog(...g){const z=O;window[z(0xd9)]&&console[z(0xc4)](z(0xed),...g);}
