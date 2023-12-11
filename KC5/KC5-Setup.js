//#region KC5-SETTINGS
// Description: KC5의 설정값을 정의합니다
const _SETTING_ = {
    
    "콘텐츠좌우정렬":{
        value: true,
        description: "콘텐츠를 좌우 정렬하여 좀 더 보기 좋게 합니다",
    },
    "스트롱클릭시여러사전비교":{
        value: false,// false이면 기본 설정 사전으로 뜸
        description: "스트롱번호를 클릭하면 가능한 모든 사전에서 찾습니다",
    },
    "영어단어클릭즉시찾기":{
        value: true,
        description: "클릭한 단어가 영어단어면 즉시 영어사전에서 찾습니다",
    },
    "영어단어즉시팝업사전":{
        value: "Eng2Kor",// 값이 없으면("") 모든 사전에서 찾음
        //사전의 약어를 입력
        description: "[영어단어클릭즉시찾기]가 true일 때 지정한 사전에서만 찾습니다",
    },
    "한글단어클릭즉시찾기":{
        value: true,        
        description: "클릭한 단어가 한글단어이면 즉시 가능한 모든 사전에서 찾습니다",
    },
    "Interlinear어형태표시":{
        value: true,        
        description: "스트롱이 합쳐진 Interlinear성경에서 문법 morph를 표시합니다",
    },
    "Interlinear어형태축약":{
        value: true,        
        description: "문법 morph를 가능한 짧게 축약하여 표시합니다",
    },
    "RTL을LTR로표시":{
        value: false,
        description: "RTL 문서를 LTR 형태로 표시합니다",
    },
    "단일행병행시각화":{
        value: true,
        description: "단일행 병행보기일때 KC플러그인만의 병행형태로 시각화합니다",
    },
    "시각화된병행소제목표시":{
        value: true,
        description: "KC플러그인 병행보기에서 별도의 소제목도 표시합니다",
    },
    "시각화된병행좌우와이드":{
        value: true,
        description: "KC플러그인 병행보기 문서를 좌우로 최대한 넓게 표시합니다",
    },
    "시각화된병행절색칠BOX":{
        value: true, // false이면 측선으로 표시
        description: "KC플러그인 병행보기 문서의 각 절을 박스형태로 색칠합니다",
    },
    "시각화된병행버튼으로성경숨기기":{
        value: true,
        description: "KC플러그인 병행보기시 역본 버튼으로 특정 성경들만 표시합니다",
    },
    "번역자노트보기좋게":{
        value: true,
        description: "번역자 노트 표시일때 좀 더 보기 좋게 정리합니다",
    },
    "팝업창모음정리":{
        value: true,
        description: "주석, 사전, 참조성구 등의 팝업창을 더 보기 좋게 정리합니다",
    },
    "띄울때성구자동변환":{
        value: true,
        description: "주석, 사전 등을 띄울 때 가능한 모든 참조성구를 자동으로 변환합니다(책, 저널 등은 제외됨)",
    },
    "띄울때X스크롤보정":{
        value: 0, //pixels, 0이면 보정 안함
        description: "처음에 페이지를 띄울 때 X축 스크롤을 픽셀 단위로 살짝 보정합니다",
    },
    "선택절스크롤보정":{
        value: true,
        description: "특정 절이 선택된 때 절 위치를 좀 더 잘 보이도록 살짝 스크롤합니다",
    },
    "텍스트선택해제시간":{
        value: 7, //seconds, 0이면 해제 안함
        description: "선택된 텍스트의 선택 영역은 일정 시간이 지나면 자동으로 사라집니다(초)",
    },
    "선택된텍스트번역가능":{ // <== 만들어줘야 함
        value: true,
        description: "선택된 텍스트가 있으면 번역 선택시 해당 텍스트를 번역할 수 있습니다",
    },
    "검색바숨김시간":{
        value: 20, //seconds, 0이면 숨기지 않음
        description: "검색 입력바에 일정 시간 동안 입력이 없으면 자동으로 숨깁니다 (초)",
    },
    "검색내용자동소거":{
        value: false,
        description: "검색 입력바에 입력된 내용이 검색바를 닫을 때 자동으로 지워집니다",
    },    
    "검색바표시위로":{
        value: false,
        description: "검색 입력바를 화면 상단으로 표시합니다(전체화면 문서에서만 적용)",
    },
    "키보드사용":{
        value: false,
        description: "물리 키보드 사용에 맞추어 전체화면시 검색바 표시 위치를 고정합니다",
    },
    "대체어변환":{
        value: true,
        description: "콘텐츠의 내용중 _대체어에 지정된 내용이 나오면 치환합니다",
    },
    "대체이미지사용":{
        value: true,
        description: "불분명한 이미지 파일을 KC5의 대체 이미지가 있으면 사용합니다",
    },
    "성경검색최대개수":{
        value: 1500, // 지정 가능 최대치 5600 (1500 권장), 0이하이거나 5600이상이면 1500으로 지정됨
        description: "성경 검색 결과의 최대 개수를 지정합니다",
    },
};

// OJB성경 보정용 치환
const _대체어 = {
    "[(C) Copyright 2002 Artists For Israel International] " : "",
    "\\pard \\pard\\par \\qc {\\par \\b\\cf16" : "<h2>",
    "}\\par\\pard \\par " : "</h2>",
    "\\par " : "",
    // OpenBible용
    //"[object marker]" : "[o.m]",
    //"<E>" : "<E><small>",
    //"<e>" : "</small><e>",
};
//#endregion KC5-SETTINGS
const _version = "KC5";
const _path = "https://arms00.github.io/";
const _img_path = "https://arms00.github.io/resources/img/";
//#region Const
    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
    const timer = ms => new Promise(res => setTimeout(res, ms));
    //const _until = async (condition, interval = 100) => { while (!condition) await timer(interval); return condition;}
    const regexOnclick = /[^\p{L}\p{N}\p{M}'''-]/ug; //모든 방식의 문자
        // /[^a-zA-Z가-힣0-9]/ug; //일반 영문자,한글,숫자만
    const word_regexp = /^[\p{L}\p{N}\p{M}'''’·-]*$/u;
    const searchInput = document.getElementById('searchInput');
    const endChrs4 = "하시니라;",
    endChrs3 = "하시고;하시되;이니라;들로도;으로만;으로는;으로도;이거든;이어든;",
    endChrs2 = "이여;시여;하여;시니;니라;따라;께서;에서;게서;에게;부터;까지;이다;이라;로도;로서;로써;보다;라고;이다;였다;했다;하고;시고;하라;셨다;니라;어요;시며;이며;이고;이니;마저;조차;이냐;느냐;같이;처럼;만큼;만치;커녕;토록;밖에;인즉;든가;든지;나마;말로;소서;에는;으로;므로;이까;들을;위에;들의;들이;들과;들로;들은;들도;거늘;어든;",
    endChrs1 = "이가은는과와에을를로의아야며다라만도냐서여요나라란뿐";
    oneChrs ="가갈갑값강개객갱걸검것겉겨격겸곁곧곬곳교구굿규그글긴깃깐깰꺼껴꼭꼴꽃꽉꽤꾀끝각간감갓겁겐겔겹경고곡군곰곱공곽관광굄국군굴굶굽궁권궐궤귀극근금급기길김꿀꿈끈코콩큼키나낙난날남납낫낮낯내널넬년노녹논놀놈놉놋뇌누눈너넉넋네넷뉘늘느늣능늪님단달담당닻다닭답댁더덤돔둑둘딴땀떡떤대덕덜덧덫도독돈돌돐돕동돛되두뒤디들등딸땅때땜떡떼또똥뜰뜻띠람랍렘록롯룹룻리막만맏말맛망매맥맨먼멜몹뭐뭘먹메면명몇모목몫몸못묘문물뭇뭍밀및밑바밖벨볼빈빔박반발밤밥밧방밭배백뱀번벌법벗베벤벧벽변별병볕보복본봉부북분불붓비빚빛빵뺨뼈뼘뿔사삯산살삶삼삽새셈셋소술숩심삽상새색샘생서석선섬성섶세센셀쇠숩숲소속손솜솥수순술숨숯시식신실십스슥습싹쌍쑥씨악알암야약양얘얼업엠아안앎앞에엔엠알열옛오와엠엣연염영옆예옥온옴옵옷왕외요욕욥욘용우울움원월위욥유육율은읍의이인일백잎왜입자잔잘잠짝장재저적전절점점정젖제조좀종좌죄주죽줄줌중쥐즉즙지진짐집짓짚쪽차참창채책처척천철첨첩첫청체초촉촌총추축복출춤충층칠칡침칭칼켜키탈탐태터턱털테톱통퇴틀틈티파판팔팥패퍽펄편폐폭표펜푼풀품피필하학한함합해향헷혀혈형혹혼홀홋화활호홰회획횡효후훌훔훕훗흙흠히힌헨",
    oneChrSp ="뜻낮밤빵떡땅셈셋욥롯룻함붓빛빚",
    uniqueNames = "종말;아들;가나;가다라;가레아;가룟유다;가르다;가르스나;가이;가야바;갈가;갈대아;갈라;갈라디아;에브라다;갈릴리;고나냐;고니야;고라;고랑;고레스;고란도;고모라;고아;골고다;구니;구다;구레뇨;구브로;구사야;구아도;굿고다;그나냐;그나니;그나아나;그다랴;그달리아;그데라;그두라;그리다;그리스도;그마랴;그말리;그시아;그일라;글라야;글라우디아;글라우디오;글라우디오루시아;글로에;글리다;긋시아;기드오니;기브아;기아;기오;긴느도이;길로;길리기아;쿰란;길보아;나사로;나아라;나아란;네리;네리야;네아;누가;눔마;느고;느고다;느다냐;느말리야;느시야;느아랴;느헤미야;느후스다;니고볼리;니골라;니도;니므라;다대오;다라;다랄라;다레아;다르다;다르오;다마리;다브가;다비다;답부아;당아;더둘로;더디오;데라;데므니;데메드리오;데살로니가;데오빌로;델라;델멜라;도다와;도도;도르가;도바도니아;도비야;도아;돕가;두기고;두라;두로;두루실라;두아디라;드고아;드다;드로아;드루버나;드보라;들라야;들릴라;등에;디과;디글라;디나;유스도;디도;디리아;디매오;바다;디브니;디브리;드블라;디오누시오;딤나;라새아;라아다;레가;애가;레아;레이;로가;로도;루가오니아;루기아;루사니아;루스드라;루시아;르말랴;룻다;르보나;르아야;르엘라야;리브가;라비야;리시아;린나;립나;마가;마게도냐;마노아;마라;마랄라;마르다;마리아;마사다;마세야;마스레가;마아가;마홀리;막게다;막달라;막베나;막벨라;말고;말기수아;말라;말리;맛다나;맛다냐;맛다다;맛다디아;맛디디아;맛디아;맛만나;만나;맛메나;멧시야;십자가;멘나;멜레아;모리아;모세라;몰라다;무라;무시아;므고나;므깃도;므두셀라;므라리;므라야;므아라;므후만;므히다;미가;미가야;미스만나;믹므다;밀가;밀로;밋가;바다라;바드로;베디메오;바라;바라가;바로;호브라;바로느고;바리야;바마스다;바메나;바세아;바아나;바알라;바요나;너구리;거북이;박부가;밤빌리아;밧수아;버가;베가;베다;베데스다;베드로;베드야;베라;베뢰아;베스도;벧니므라;벧마아가;벧바라;벳새다;벧싯다;벧하란;벧호글라;글라라;벨라;병아리;독수리;보드나도;보디메라;보라다;보스라;본도;본디오;빌라도;부겔로;부라;부로;부로고로;부아;부엉이;붕어;올챙이;부와;북기야;불라스도;브가히야;브나;브나야;브다히야;브루다;브리스가;브리스길라;브리아;브소드야;브에라;브에리;브에스드라;브엘랴다;블라스도;블라야;비그리;비느아;비두니아;노아;비디아;비라도;비스가;비스다;빅다;빅다나;빈누이;빌가;빌라델비아;빌룰로고;사노아;사라;사마리아;산발라;살라;삼라;삼무아;삽다;삽드가;삽비라;아나니아;세군도;소고;소라;소아;수가;수리아;수가냐;스게와;스구디아;스라야;스라히야;스레라;스루야;스리;스마아;스마야;스미다;스미라;스바냐;스바니아;스비다;스와;스이라;시드리;시므아;시비아;시비야;시스라;시아;실로;실라;실루기아;십보라;십브라;아가;아가야;아가이고;아구사도;사도;아구스도;아굴라;아그리아;아라비아;아나냐;아나니아;아나야;아다;아다다;아다라;아다야;아닥사스다;아달리야;아도니야;아도나이;아드마다;아라;아레다;아레오바고;아리다다;아리에;아리스다고;아마시야;아모리;아박다;아베가;아벨벧마아가;아벳느고;아볼로;아볼로니아;아비다;아비스아;아비아;아비야;아사냐;아사리아;아사시야;아사야;아살리야;아세가;아소도;아시아;아야;아와;아이;아하라;아하시야;아호아;아히야;아히오;악고;안도니아;알렉산드리아;알와;암불리아;압다;압비아;애니아;야다;야도;야라;야로이;야스야;엘로아;야아레시야;야아사냐;야아사니야;야아시야;야알라;야이로;얏두아;에드레이;에디오피아;에라스도;에바부라;에바부로디도;에베네도;에브라다;에서;에스라;에스리;에슬리;엘다아;엘라;오메가;포도;사과;엘랴다;엘르아다;아궁이;엘리;엘리가;엘리아다;에바다;달리다;엘리야;아세라;사하두다;여고냐;여고니야;여골리아;여골리야;여다야;여디다;여디디아;여리고;여베레기야;여사냐;여사렐라;여호수아;여호앗다;여호야다;여호와;여후디야;여히스기야;여히야;여히엘리;예드야;예라;예레미야;오브라;와냐;왜사다;요글리;요다;요라;요시비야;요시아;요시야;요아다;요야다;욧바다;우리;우리아;울라;웃시아;원숭이;유두고;유다;유스도;유오디아;윳다;이달라;이드라;이드로;이리;이리야;이므라;이사야;이스가;이스라히야;이스리;이스마야;이스와;이와;인도;입다;잇도;잇시야;케이사리아;코끼리;파리;하가;하그리;하길라;하나냐;하디다;하라다;하바시냐;하마시아;하만;메시아;메시야;하바야;하빌라;하사야;하스나아;하스라;하아하스다리;할렐루야;하와;학기야;함므다다;핫스누아;헤로디아;헤만;헬라;헬리;호글라;호다위아;호다위야;호드야;호디야;호리;호바야;호사야;호세아;호세야;후리;훌다;히라;히브리;히스기야;힐기야;";
    const regrexContent = /(<E>(.|\n)*?\<e>)|(<a (.|\n)*?\/a>)|(&(.|\n)*?;)|(<(.|\n)*?>)|([ㄱ-힣A-Za-zа-яА-Я]\d{1,6})|[^ㄱ-힣A-Za-zа-яА-Я]|[ㄱ-힣A-Za-z]+/gm;
    const regexLettersU = new RegExp("[A-Za-zа-яА-Я가-힣\s]+", "i");
    const regexLettersK = new RegExp("[ㄱ-힣\s]+", "g");  
    const bNameEng = new Array("", "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation");    
    const IS_PARALLEL = () => document.title.length > 0 && document.title.includes("Parallel") && (document.querySelectorAll(".verse").length==document.querySelectorAll(".verno").length); //병행성경
    const IS_COMPARE_BIBLE = () => document.title.length > 0 && document.title.includes("Bible Compare") && (document.querySelectorAll(".verse").length==document.querySelectorAll(".verno").length); //비교성경
    const IS_BIBLE = () => {
        const titleExists = document.title.length > 0;
        const vernoExists = document.querySelector('.verno') !== null;
        const verseExists = document.querySelector('.verse') !== null;
        const bibleNaviExists = document.getElementById('bibleNavi') !== null;
        const keywords = ['더보기', '비교', '병행보기', '탐색목록'];    
        const hasMoreLink = Array.from(document.querySelectorAll('a.bible')).some((item) => 
        {
            return keywords.some(keyword => item.innerHTML.includes(keyword));
        });    
        const bibleRefExist = /(<strong>1. <a class\="bible" href\="b.+?">[^\s]+[\s][^\s]+).+?(<\/a>)/.test(document.getElementById('content').innerHTML);
        return (titleExists && vernoExists && verseExists) || bibleNaviExists || hasMoreLink || bibleRefExist;
    };
    //성경
//#endregion Const

//#region Global Variables
    var loadedJS = {};
    var loadedCSS = {};
    //해상도에 따라 자동조절됨
    var
        DEF_번역글자수제한 = "400",//config.getAttribute('번역글자수제한'),
        DEF_번역창최소줄수 = "8",//config.getAttribute('번역창최소줄수'),
        DEF_번역창줄당글자 = "40";//config.getAttribute('번역창줄당글자');        
    var _fadeout;
    var _timeOut;
    var toggleElements = new Array();
    var charColor = {};
    var bibleNames = {};
    var optUrl = "";
    var contentBackrollStr;
    var contentBCVconvertedStr;
    var rem_import = false;    
    var isChangedCompareBible = false;    
    var funcmode = 0;
    var g_selection = null;
    var g_range = null;
    var a_prevent = false;
    var _isSelection = false;
    var g_rangeValue = "";
    var onc_timeOut = null;
    var g_isdragged = false;
    var g_timeOut = undefined;
    var g_timeOutInput = undefined;    
    var g_interval = undefined;
    var __isComp = false;
    var g_content = true;
    var g_transMode = false;
    var g_lastTransWords = "";
    var scrollDelayTime = 0;
    var g_skipConvert = false;
    var isBCVconverted = false;
    var _loaded = false;
    var isParallel = false;
    var const_bx=""; var const_cx=""; 
    var lastSelectedElement = null;
    var dontBibleRefsIndex = false;
    var wordDetectionReleaseTimeOut = null;
    var g_rangeValue_prev = "";
//#endregion Global Variables

//#region Functions Essential
function Alert(message, duration = 3000, copytoclippboard = false) {
    if (copytoclippboard) CopyAllDoc(message)
    clearInterval(_fadeout);
    clearTimeout(_timeOut);
    let alertDiv = document.getElementById('alert_div');
    let alertBox = document.getElementById('alert');
    let _opacity = 2.5;
    alertBox.style.opacity = '1';
    alertBox.textContent = message;
    alertDiv.style.display = 'inline';
    _fadeout = setInterval(() => { _opacity -= 0.1; if (_opacity < 0) { _opacity = 0; clearInterval(_fadeout); } alertDiv.style.opacity = clamp(_opacity, 0, 1).toString(); }, 100);
    _timeOut = setTimeout(() => { alertDiv.style.display = 'none'; clearInterval(_fadeout); alertBox.style.opacity = '1'; }, duration);
}

function getCurBook(_type = "") {    
    let _title = "";
    if (document.title.length > 0) {
        _title = document.title.replace('Parallel ', '').replace('Bible Compare ', '');
    }
    if (_type === "") return _title;
    else {
        let _cRegrex = /(.+?)[\s]+([0-9]+)[\s]*/;
        if (_cRegrex.test(_title)) {
            let _c = _title.replace(_cRegrex, '\$2');
            let _i = getbIndex(_title.replace(_cRegrex, '\$1'));
            if (_type === "b" || _type === "num") return _i;
            else if (_type === "c") return _c.replace(/[^0-9]/g, '');
            let _bName = bNameEng[_i];
            return _bName + "+" + _c; //<= eng or else..
        }
    }
    return _title;
}

function getbIndex(_str = "") {
    let x = _str.replaceAll(' ', '');
    for (let i = rar.length - 1; i >= 0; i = i - 1) { if (rar[i] == x || x.match(rar_f[i])) return (i + 1); }
    for (let i = 0; i < rar.length; i++) { if (rar[i] == x || x.match(rar_f[i])) return (i + 1); }
    return 0;
}

async function Remove_script() {
    let _scripts = document.getElementsByTagName('script');
    while (_scripts.length > 0) { _scripts[0].remove(); }
    setTimeout(
        () => {
            _scripts = document.getElementsByTagName('script');
            if (_scripts.length > 0) Remove_script();
        }
        , 3000);
}

async function loadImgStart(duration = 2000, _href = "") {
    document.getElementById('dic_searching_div').style.display = 'flex'; a_prevent = true;
    if (_href.length>0) 
    {
        await timer(100);
        location.href = _href;
    }
    if (duration>0)
    {
        await timer(duration);        
        setTimeout(() => { loadImgStop(); a_prevent = false; }, duration);
    }
}

function loadImgStop() {    
    document.getElementById('dic_searching_div').style.display = 'none'; a_prevent = false;
}
//#endregion Functions Essential

//#region 소제목찾기
function findSubtitle(bibleSubtitles, book, chapter, verse) {            
    if (typeof bibleSubtitles === 'undefined' ||  bibleSubtitles.length == 0) return null;
    return bibleSubtitles.filter(item => 
        item.b == book && 
        item.c == chapter && 
        item.v == verse
    ).pop();
}

function findNearSubtitle(bibleSubtitles, book, chapter, verse) {            
    if (typeof bibleSubtitles === 'undefined' ||  bibleSubtitles.length == 0) return null;
    return bibleSubtitles.filter(item => 
        item.b == book && 
        item.c == chapter && 
        item.v <= verse
    ).pop();
}

async function findSubtitleRange(bibleSubtitles, book, chapter, verse) {    
    if (typeof bibleSubtitles === 'undefined' ||  bibleSubtitles.length == 0) return null;

    const currentSubtitle = bibleSubtitles.filter(item => 
        item.b == book && 
        item.c == chapter && 
        item.v == verse
    ).pop();

    if (!currentSubtitle) return null;

    const nextSubtitleIndex = bibleSubtitles.findIndex(item => 
        item.b == book && 
        item.c >= chapter && 
        item.v > verse
    );

    let endBook, endChapter, endVerse;

    if (nextSubtitleIndex === -1) {
        // 해당 챕터의 마지막 절 번호를 설정합니다.        
        endBook = book;
        endChapter = chapter;
        endVerse = bcv_arr[book][chapter];
    } else {
        endBook = bibleSubtitles[nextSubtitleIndex].b;
        endChapter = bibleSubtitles[nextSubtitleIndex].c;
        endVerse = bibleSubtitles[nextSubtitleIndex].v - 1;
    }

    return {
        start: {
            b: currentSubtitle.b,
            c: currentSubtitle.c,
            v: currentSubtitle.v,
        },
        end: {
            b: endBook,
            c: endChapter,
            v: endVerse,
        },
        head: currentSubtitle.head
    };
}

async function findComplexReference(startB, startC, startV, endB, endC, endV, index=-1) {    
    if (typeof xRefs === 'undefined' || xRefs.length == 0) return null;
    const filteredRefs = xRefs.filter(ref => {
        const startCondition = (ref.fb < startB) || 
                               (ref.fb == startB && ref.fc < startC) || 
                               (ref.fb == startB && ref.fc == startC && ref.fv <= startV);
        
        const endCondition = (ref.tb > endB) || 
                             (ref.tb == endB && ref.tc > endC) || 
                             (ref.tb == endB && ref.tc == endC && ref.tv >= endV);
        
        return (ref.i==index||index<0) && startCondition && endCondition;
    });
    
    if (index<0)
    {
        // i를 무시하고 중복 제거
        const uniqueRefs = Array.from(new Set(
            filteredRefs.map(ref => {
                // 객체의 복사본을 생성하고 `i` 프로퍼티를 삭제
                const copyRef = { ...ref };
                delete copyRef.i;
                return JSON.stringify(copyRef);
            })
        )).map(JSON.parse);
        return uniqueRefs;
    }
    else {
        // 중복 제거
        const uniqueRefs = Array.from(new Set(filteredRefs.map(JSON.stringify)))
                             .map(JSON.parse);
        return uniqueRefs;
    }    
}
//#endregion 소제목찾기

//#region Modulue Loading Functions
    function loadJS(url) {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.src = _path + _version + "/" + url + '.js';
            script.type = 'text/javascript';

            // 로드가 성공적으로 완료되었을 때
            script.onload = function() {
                loadedJS[url] = true;        
                resolve(true);
            };

            // 로드에 실패했을 때
            script.onerror = function() {        
                loadedJS[url] = false;
                Alert(url + ' Loading Failed..');
                reject(false);
            };

            document.body.appendChild(script);
        });
    }

    function loadCSS(url) {
        return new Promise((resolve, reject) => {
            let link = document.createElement('link');
            link.href = _path + _version + "/" + url + '.css';
            link.rel = 'stylesheet';
            link.type = 'text/css';

            // 로드가 성공적으로 완료되었을 때
            link.onload = function() {
                loadedCSS[url] = true;        
                resolve(true);
            };

            // 로드에 실패했을 때
            link.onerror = function() {        
                loadedCSS[url] = false;
                Alert(url + ' Loading Failed..');
                reject(false);
            };

            document.head.appendChild(link);
        });
    }

    function checkLoadedJS_Promise(key) {
        return new Promise((resolve, reject) => {
            if (key in loadedJS) {
                if (loadedJS[key] === true) {
                    resolve();
                } else {
                    reject(new Error(key + ' not loaded'));
                }
            } else {
                loadJS(key).then(resolve).catch(reject);
            }
        });
    }
    // 예시 사용법:
    //waitForModules('_SETTINGS_', '참조', 'anotherModule', 'yetAnotherModule');
    async function waitForModules(...modules) {
        try {
            // 각 모듈에 대해 checkLoadedJS_Promise 함수를 호출하고 Promise.all로 모든 모듈이 로드될 때까지 대기
            await Promise.all(modules.map(module => checkLoadedJS_Promise(module)));
            return true;
        } catch (error) {
            //Alert('Failed to load modules:', error);
            return false;
        }
    }

    function Setting(key) {    
        // _SETTING_ 객체 자체가 있는지 확인
        if (typeof _SETTING_ !== 'undefined' && _SETTING_ !== null) {
            // 해당 키가 _SETTING_ 객체에 있는지 확인
            if (_SETTING_.hasOwnProperty(key) && _SETTING_[key].hasOwnProperty('value')) {
                return _SETTING_[key].value;
            }
            return null; // 키가 없으면 null 반환
        }
        return undefined; // _SETTING_이 없으면 undefined 반환
    }

//#endregion

//#region DataStorage
    //DB 코드
    var request = indexedDB.open("KC_Plugin_Database", 1);
    let dbOpened = false;

    let dbPromise = new Promise((resolve, reject) => {
        request.onsuccess = function(event) {
            dbOpened = true;
            resolve(event.target.result);
        };
        request.onerror = function(event) {
            reject(new Error("DB connection error"));
        };
    });

    request.onupgradeneeded = function(event) {
        var db = event.target.result;
        var objectStore = db.createObjectStore("paralle_abbr_display", { keyPath: "name" });
    };

    // request.onerror = function(event) {
    //     Alert("Error occurred:" + event.target.errorCode);
    // };

    // request.onsuccess = function(event) {
    //     //Alert("Database opened successfully");
    // };

    function writeData(order, key, value) {
        if (dbOpened === false) return; 
        var db = request.result;
        var transaction = db.transaction([order], "readwrite");
        var objectStore = transaction.objectStore(order);
        
        // Use "put" to either add a new item or update an existing item.
        objectStore.put({ name: key, value: value });

        transaction.oncomplete = function(event) {        
            //Alert("Transaction completed: database modification finished.");
        };

        transaction.onerror = function(event) {
            Alert("Transaction not opened due to error.");
        };
    }

    function readData(order, key) {
        if (dbOpened === false) return;
        return new Promise((resolve, reject) => {
            var db = request.result;
            var transaction = db.transaction([order]);
            var objectStore = transaction.objectStore(order);
            var getRequest = objectStore.get(key);
            
            getRequest.onerror = function(event) {
                //Alert("Error occurred:" + event.target.errorCode);
                reject(new Error(event.target.errorCode));
            };
            
            getRequest.onsuccess = function(event) {
                if (getRequest.result) {
                    //Alert("Name:" + getRequest.result.name + " / Value:" + getRequest.result.value);
                    resolve(getRequest.result);
                } else {
                    //Alert(key + " couldn't be found in your database!");
                    resolve(null);  // 찾을 수 없으면 null을 반환합니다.
                }
            };
        });
    }

    async function deleteData(storeName, key) {
        if (dbOpened === false) return;
        return new Promise((resolve, reject) => {
            const dbRequest = indexedDB.open(storeName);
            
            dbRequest.onsuccess = function(event) {
                const db = event.target.result;
                const transaction = db.transaction([storeName], 'readwrite');
                const objectStore = transaction.objectStore(storeName);
                const deleteRequest = objectStore.delete(key);
                
                deleteRequest.onsuccess = function() {
                    resolve();
                };
                
                deleteRequest.onerror = function() {
                    reject(new Error("Error deleting data from IndexedDB."));
                };
            };
            
            dbRequest.onerror = function(event) {
                reject(new Error("Error accessing IndexedDB."));
            };
        });
    }
//#endregion

//#region DOM Loading
    window.addEventListener('DOMContentLoaded', (e) => {
        document.body.style.minHeight = '10em';
        DomLoad();
    });
    function Do_SettingOnLoad() {
        toggleElements[0] = document.getElementById('words_search_div');
        toggleElements[0].setAttribute('default-display', 'none');
        toggleElements[1] = document.getElementById('details_bottom_div');
        toggleElements[1].setAttribute('default-display', 'none');
        ws_switch(true);
        if (IS_BIBLE()) {
            let bibleNavi = document.getElementById('bibleNavi');
            if (!bibleNavi) {
                bibleNavi = document.createElement('span');
                bibleNavi.id = 'bibleNavi';
                bibleNavi.style.display = 'none';
            }
            g_content.querySelectorAll("a.bible").forEach((item) => {
                const keywords = ['더보기', '탐색목록', '비교', '병행보기'];
                if (keywords.some(keyword => item.innerHTML.includes(keyword))) {
                    bibleNavi.appendChild(item);
                }
            });            
            document.body.appendChild(bibleNavi);

            if (Setting("Interlinear어형태표시")) {  
                const _awtext = g_content.querySelectorAll('a.wtext');
                if (_awtext && _awtext.length > 0)
                {
                    const updatedHTML = g_content.innerHTML.replace(/(<a class="wtext"[^>]+href="s.*?\|m)(.*?)([\"\/][^>]*>.*?<\/a>)(\s*<.*?>.*?<\/.*?>)/g,
                        function(match, p1, p2, p3, p4) {
                                let capitalizedP2 = p2.replace(/\?v=.*?$/g, '').replace(/(^.|[^가-힣ㄱ-ㅎA-Za-z0-9].)/gi, str => str.toUpperCase()).replace(/\|m$/gi,'');//p2.charAt(0).toUpperCase() + p2.slice(1).replace(/\?v=.*?$/g, '');
                                if (Setting("Interlinear어형태축약"))
                                {
                                    const zipP2 = capitalizedP2.replace(/\s*/g,'').replace(/([ㄱ-힣ㄱ-ㅎ0-9]*)/g, str => str.length>2?str.substr(0,3):str.charAt(0)).replace(/([A-Za-z]*)/g, str => str.length>2?str.substr(0,3):str.charAt(0));
                                    if (zipP2.length>10)
                                    {
                                        return p1 + p2 + p3 + ' <span class="morph_"> <a class="morph" href="m' + p2 + '">' + zipP2.replace(/([ㄱ-힣ㄱ-ㅎ0-9]*)/g, str => str.length>2?str.substr(0,2):str.charAt(0)).replace(/([A-Za-z]*)/g, str => str.length>2?str.substr(0,2):str.charAt(0)) + '</a></span>' + p4;
                                    }                        
                                    return p1 + p2 + p3 + ' <span class="morph_"> <a class="morph" href="m' + p2 + '">' + zipP2 + '</a></span>' + p4;                 
                                }                    
                                return p1 + p2 + p3 + ' <span class="morph_"> <a class="morph" href="m' + p2 + '">' + capitalizedP2 + '</a></span>' + p4;
                            }
                        );
                    g_content.innerHTML = updatedHTML;            
                }
            }
        }
        
        if (Setting("RTL을LTR로표시"))
        {        
            document.documentElement.dir = "ltr";
            document.body.style.direction = "ltr";
            g_content.style.direction = "ltr";
        }

        if (Setting("콘텐츠좌우정렬"))
        {        
            g_content.style.textAlign = 'justify';
            g_content.style.textJustify = 'auto';        
            g_content.style.wordBreak = 'normal';
            g_content.style.wordWrap = 'break-word';
            g_content.style.hyphens = 'auto';
            g_content.style.textAlignLast = 'start';
        }

        if (Setting("검색바표시위로")) { // 창으로 표시된 것(title.length==0)은 하단 다른UI에 가리지 않게 조금 위로 표시                
            //어째서인지 호출된 창에서는 위쪽으로 표시되지 않음. 나중에 확인해보자.
            if (document.title.length == 0) 
            {
                document.getElementById('words_search_div').style.bottom = '0';
                document.getElementById('details_bottom_div').style.bottom = '0';                
                if (document.title.length == 0) document.getElementById('search_bar_bottom').innerHTML = '<br><br>';
                //document.getElementById('search_bar_top').innerHTML = '<br><br>';
            }
            else
            {
                document.getElementById('words_search_div').style.top = '0';
                document.getElementById('details_bottom_div').style.top = '0';
            }
        }
        else
        {
            document.getElementById('words_search_div').style.bottom = '0';
            document.getElementById('details_bottom_div').style.bottom = '0';                
            if (document.title.length == 0) document.getElementById('search_bar_bottom').innerHTML = '<br><br>';
        }

        if (document.title.length == 0) {
            if (!Setting("키보드사용")) { searchInput.style.backgroundColor = 'rgba(180,180,180,0.5)'; searchInput.style.color = 'white';}
        }

        if (Setting("번역자노트보기좋게"))
        {
            let span_comframe = g_content.querySelectorAll('span.comframe');
            if (span_comframe.length > 0)
            {
                span_comframe.forEach(span => {                            
                    span.innerHTML = span.innerHTML.replace(/>\(v\.\d+\)/,'>');
                    span.innerHTML = '<br style="line-height:0.2em;" />' + span.innerHTML + '<br style="line-height:0.3em;" />';
                    span.outerHTML = '<div class="comframd" style="margin:0.15em 0.25em 0.2em 0.25em;">' + span.outerHTML + '</div>';       
                });    
                g_content.querySelectorAll('p').forEach(p=> {
                    if (p.innerHTML=='') p.remove();
                    else if (p.className == 'p')
                        p.outerHTML = p.innerHTML + '<br style="line-height:0.3em;" />'
                });
            }            
        }

        waitForModules('KC5-ScriptEx-InternetTranslationAndSearch')
    }    
    async function DomLoad() {            
        let dummy = document.createElement('p');
        dummy.id = 'DummyForScreenFullBtn'
        dummy.innerHTML = "<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br> ";
        g_content = document.getElementById('content');                
        if (g_content) 
        {            
            // if (!document.getElementsByTagName('img')) {
            //     document.body.setAttribute('prevColor', document.body.style.color);
            //     document.body.style.color = "#00000000";                
            //     document.body.style.minHeight = '10em';
            //     g_content.setAttribute('prevColor', g_content.style.color);
            //     g_content.style.color = "#00000000";
            // }
            g_content.appendChild(dummy);
        }
        let exit = false;
        if (g_content.getAttribute("xcontenteditable") == "true" || g_content.getAttribute("contenteditable") == "true") {        
            g_content.style.display = "inline-block";
            g_content.style.contentVisibility = "auto";
            exit = true;
        }
        else if ((/.+?개인노트/).test(document.title) || (/Personal notes.+/i).test(document.title)) {
            document.body.style.width = '100%';
            g_content.style.display = "inline-block";
            g_content.style.contentVisibility = "auto";
            exit = true;
        }    
        if (exit)
        {   
            RemoveLoading();
            loadImgStop();
            Remove_script();
            return;
        }        
        
        Do_SettingOnLoad();   
        
        try {
            let db = await dbPromise;        
        } catch (error) {
            Alert(error);
        }
        scrollDelayTime = 300;
        // 병행성경은 처리시간 단축을 위해     
        isParallel = IS_PARALLEL();
        if (!g_content.querySelector("table.parallel") && !g_content.querySelector("thead.tableFloatingHeaderOriginal")) //<=수평테이블병행
        {
            g_content.style.overflow = 'auto';
            g_content.style.width = '99.5%';
            if (document.title.length > 0 && (isParallel || IS_COMPARE_BIBLE()))//<=비교보기
            {
                scrollDelayTime = 800;
                if (isParallel && Setting("단일행병행시각화"))
                {   
                    g_skipConvert = true;
                    await waitForModules('KC5-ScriptEx-ParallelBible');
                    await transCompares();            
                }            
            }
            else if (!IS_BIBLE())
            {   
                await waitForModules('KC5-ScriptEx-ReferencesTrans');            
                await onLoad();            
            }
            else {
                const _regex3 = /(<strong>\d+\. <a class\="bible" href\="b.+?">[^\s]+[\s][^\s]+).+?(<\/a>)/g;
                
                if (_regex3.test(g_content.innerHTML)) {            
                //if (g_content.innerHTML.match(_regex3) !== null) {            
                    g_content.innerHTML = g_content.innerHTML.replace(_regex3, '\$1\$2');                    
                    dontBibleRefsIndex = true;
                }
            }
        }        

        OnLoadEnd();
        
        _loaded = true;
    }
    async function onLoad() {
        let conStr = g_content.innerHTML.toString();
        
        const _regex = /<h2>[\d]+\. (<a class\="bible viewmore.*?>(.+?)(:.*?)?<\/a>)<\/h2>/g;
        const _regex_n = /<h2>[\d]+\. <a class\="bible viewmore.*?>(.*?)<\/a><\/h2>/;
        const _matches = conStr.match(_regex);
        const countViewmore = g_content.querySelectorAll('a.bible.viewmore').length;
        __isComp = _matches ? true : false;
        
        if (Setting("팝업창모음정리") && !IS_BIBLE() && _matches) {
            let comDiv = document.getElementById('details_bottom_div');

            for (let i = 0; i < _matches.length; i++) {
                let btn = document.createElement('button');
                btn.className = 'details_btn';
                let id = _matches[i].replace(_regex_n, '\$1');

                let btnText = document.createTextNode(id.substr(0, 4));
                btn.appendChild(btnText);
                btn.setAttribute('onclick', "{let _element=document.getElementById('comviewDetail-" + i + "'); _element.open=true; _element.scrollIntoView(); setTimeout( () => {window.scrollTo({ top: window.scrollY - 32, behavior: 'smooth' });} , 100);}");
                btn.style.backgroundColor = ColorOfString(id, 0.9);
                btn.style.color = 'white';
                comDiv.appendChild(btn);
            }
            comDiv.setAttribute('default-display', 'inline');
            toggle_bottom(1);

            g_content.innerHTML = await conStr.replace(_regex, '<br></details></b></strong></div><p></p><details class="comviewDetail" name="\$2" open><summary>&nbsp;\$2 (\$1)</summary><div class="comDiv" name="\$2">');
            
            let allDetailsComs = g_content.getElementsByClassName("comviewDetail");
            if (allDetailsComs.length > 0) dontBibleRefsIndex = false;
            for (let j = 0; j < allDetailsComs.length; j++) {            
                allDetailsComs[j].id = "comviewDetail-" + j.toString();                        
                const extractedValue = allDetailsComs[j].getAttribute('name');
                if (extractedValue)
                {
                    allDetailsComs[j].querySelectorAll('a').forEach(a => {
                        if (a.hasAttribute('href')&&a.getAttribute('href').startsWith('d') && !a.getAttribute('href').includes('d-' + extractedValue)) {
                            a.setAttribute('href', 'd-' + extractedValue + ' ' + a.getAttribute('href').substr(1));
                        }
                    });
                }
            }        
        }
        
        g_content.querySelectorAll(".comDiv").forEach(async div => {
            if (div.hasAttribute('name')) {                    
                div.style.backgroundColor = ColorOfString(div.getAttribute('name'), 0.2, 0.6);
            }
            else div.style.backgroundColor = 'white';
            if (Setting("띄울때성구자동변환")) {
                BibleRefsIndex("comDiv", "", div);
                isBCVconverted = true;
            }
        });

        if (!dontBibleRefsIndex && Setting("띄울때성구자동변환") && !isBCVconverted) {                                
            isBCVconverted = await BibleRefsIndex();
        }
    };

    function OnLoadEnd()
    {
        g_content.querySelectorAll('a').forEach( link => {
            if (Setting("대체이미지사용") && link.hasAttribute('href') && /^[A-Za-z0-9\-]+\.(?:jpg|png|gif|jpeg|jfif)$/i.test(link.getAttribute('href')))
            {
                link.addEventListener('click', function(event) {
                    event.preventDefault();
                    pvtClk();
                    event.stopPropagation();
                    //location.href = 'file://../KC-labs/res-hi/' + link.getAttribute('href');                
                    location.href = _img_path + link.getAttribute('href');
                });
                return;
            }
            let _href = link.getAttribute('href');
            if (link.hasAttribute('href')&&Setting("스트롱클릭시여러사전비교")&&(/^[Ss][HhGg]\d+/.test(link.getAttribute('href'))))
            {
                _href = 'd-=' + link.getAttribute('href').substr(1).replace(/^(.*?)(?:\?|\|).*$/g, '\$1');
                link.setAttribute('href', _href);
            }
            if (link.className == 'wtext')
            {
                const _span = document.createElement('span');
                _span.className = 'wtext';
                _span.innerHTML = link.innerHTML;
                link.replaceWith(_span);
                link.setAttribute('href', _href);

                _span.addEventListener('click', function(event) {
                    event.preventDefault();                
                    pvtClk();                
                    event.stopPropagation();
                    let prevLastSelectedElement = lastSelectedElement;
                    let prevG_rangeValue = g_rangeValue;
                    let word = wordDetection(event, true); 
                    if (prevLastSelectedElement == lastSelectedElement && prevG_rangeValue == g_rangeValue) return;                
                    if (_href) {
                        if (_span.innerText.includes(' ')) 
                        {
                            let _spanBorder = _span.style.border;                            
                            _span.setAttribute('prev-border', _spanBorder);
                            _span.style.border = '1px solid red';
                            setTimeout(() => {
                                _span.style.border = _spanBorder;
                                _span.removeAttribute('prev-border');
                            }, clamp(Setting("텍스트선택해제시간"), 2, 15) * 1000);
                        }
                        lastSelectedElement = event.target;                    
                        setTimeout(() => {                        
                            let word2 = '';
                            if (word != _span.innerText) word2 = _span.innerText;                                                    
                            if (Setting("스트롱클릭시여러사전비교"))
                            {
                                if (!(/^[A-Za-z]\d+/.test(word))) {
                                    word = word.toLowerCase().replace(/[^가-힣a-z0-9\s]/g, '').replace(/\b[a-z]/g, char => char.toUpperCase());
                                }
                                location.href = _href + (word.length>0?'%09' + word + '%09' + word.toLowerCase() : '') + (word2.length>0?'%09' + word2 + '%09' + word2.toLowerCase() : '');
                            }
                            else
                            {
                                location.href = _href;
                                searchInputValue(word);   
                            }
                        }, 100);
                        loadImgStart(300);
                    }                
                });
                return;
            }
            link.addEventListener('click', async function(event) {
                event.preventDefault();
                event.stopPropagation();
                pvtClk();
                
                let className = event.target.className;
                if (typeof className === 'undefined') className = "";
                
                //if (/left|right|center|ref|xref|verno|bible|notes|comment|material\-icons|journal/i.test(className)) return; //? pvtClk() : on_a(event.target);
                if (!(/left|right|center|verno/i.test(className))) 
                {
                    loadImgStart(300);
                    await timer(100);
                }

                // if (className.includes('verno') && isParallel && isChangedCompareBible && Setting("시각화된병행버튼으로성경숨기기")) {
                //     showAllBibles(event.target);
                //     return;
                // }
                searchInputValue(link.innerText);                
                location.href = link.getAttribute('href');
            });                             
        });

        g_content.querySelectorAll('h1,h2,h3,h4,h5').forEach( h => {
            h.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                pvtClk();
                searchInputValue(wordDetection(event, true));                
            });            
        });

        if (Setting("대체이미지사용"))
        {
            g_content.querySelectorAll('img').forEach( img => {
                if (/^[A-Za-z0-9\-\.]+$/.test(img.getAttribute('src')))
                {
                    if (img.hasAttribute('src')) 
                    {                    
                        let src = img.getAttribute('src');                        
                        //let file = location.href + 'KC-labs/resources/img/' + src;
                        let file = _img_path + src;
                        img.setAttribute('href', src);
                        img.addEventListener('click', (e) => {                            
                            e.preventDefault();
                            e.stopPropagation();
                            pvtClk();
                            //location.href = 'file://../KC-labs/res-hi/' + src;
                            location.href = _img_path + src;
                        });
                        img.setAttribute('src', file);
                    }                
                }
            });
        }

        loadImgStop();

        document.body.style.opacity = '0.3';
        document.body.style.color = 'black';
        document.body.style.padding = '0 0.35em 0.61em 0.35em';
        document.body.style.minWidth = '95%';
        //document.body.style.minHeight = '100%';
        document.body.style.overflow = 'auto';

        if (g_content)
        {
            g_content.style.color = 'black';
            //g_content.style.width = '99.5%';
            g_content.style.margin = '1.5em 0.6em 5em 0.1em';
            //g_content.style.minHeight = '10em';
            //g_content.style.overflow = 'auto';
            g_content.style.contentVisibility = "auto";
            g_content.style.display = "inline-block";            

            if (Setting("선택절스크롤보정") && IS_BIBLE())
            {
                let currentVerse = g_content.querySelector('verse.current');
                if (currentVerse) currentVerse.scrollIntoView();
                scrollToView(scrollDelayTime);
            }
        }
        
        let opacity = 0;
            const fadein = setInterval(() => {             
                opacity += 0.5;
                document.body.style.opacity = opacity.toString();                
                if (opacity >= 1) {
                    clearInterval(fadein);                    
                    document.body.style.opacity = '1';
                }
            }, 10);

        if (Setting("대체어변환") && typeof _대체어 !== 'undefined') {
            for (let key in _대체어) {
                if (g_content.innerHTML.includes(key)) {
                    g_content.innerHTML = g_content.innerHTML.replaceAll(key, _대체어[key]);
                }
            }
            // g_content.querySelectorAll('*').forEach(function(node) {
            //     if (!node.innerText || !node.innerText.length==0) return;
            //     for (let key in _대체어)
            //     {
            //         if (node.innerText.length>=key.length && node.innerText.includes(key))
            //             node.innerText = node.innerText.replaceAll(key, _대체어[key]);
            //     }
            // });
        }

        if (IS_BIBLE() && document.getElementById('bibleNavi')) 
        {
            if (document.getElementById('DummyForScreenFullBtn'))
            {
                document.getElementById('DummyForScreenFullBtn').outerHTML = document.getElementById('bibleNavi').innerHTML + document.getElementById('DummyForScreenFullBtn').outerHTML;
            }
            else g_content.innerHTML += document.getElementById('bibleNavi').innerHTML;
            document.getElementById('bibleNavi').remove();
        }

        if (Setting("띄울때X스크롤보정")) window.scrollBy({left:Setting("띄울때X스크롤보정")});
        
        RemoveLoading();        

        if (document.getElementById('DummyForScreenFullBtn'))
        {
            g_content.style.minHeight = '17em';
            document.body.style.height = '100vh';
            let height = 80;
            const dummy = document.getElementById('DummyForScreenFullBtn');
            const smallizeDummy = setInterval(()=> {
                height -= 40;
                dummy.style.height = height.toString() + "%";
                document.body.style.height = (180-height).toString() + 'vh';
                if (height<=0) 
                {
                    document.body.style.height = 'auto';
                    clearInterval(smallizeDummy);
                    dummy.remove();
                }
            },200 );            
        }        
    }

    async function RemoveLoading()
    {    
        document.getElementById('loadingFix').remove();
    }
//#endregion DOMLoading

function testwin() {    
    let back_div = document.createElement('div');
    back_div.id = 'testwin';
    back_div.style.position = 'fixed';
    //win.style.top = '0';
    //win.style.left = '0';
    back_div.style.width = '100%';
    back_div.style.height = '100%';
    back_div.style.zIndex = '4';
    back_div.style.justifyContent = 'center';
    back_div.style.alignItems = 'center';
    back_div.style.backgroundColor = 'rgba(0,0,0,0.5)';
    back_div.style.verticalAlign = 'middle';
    back_div.style.display = 'flex';
    back_div.style.flexDirection = 'column';
    back_div.style.color = 'white';
    back_div.style.fontSize = '2em';
    back_div.style.textAlign = 'center';
    back_div.style.overflow = 'auto';
    
    let content_div = document.createElement('div');
    content_div.id = 'testwin_content';
    content_div.style.display = 'flex';
    content_div.style.flexDirection = 'column';
    content_div.style.justifyContent = 'center';
    content_div.style.alignItems = 'center';
    content_div.style.width = '80%';
    content_div.style.height = '80%';
    content_div.style.zIndex = '5';
    content_div.style.backgroundColor = 'white';
    content_div.style.verticalAlign = 'middle';
    content_div.style.fontSize = '1.3em';
    content_div.style.textAlign = 'center';
    content_div.style.overflow = 'auto';
    content_div.style.padding = '1em';
    content_div.style.borderRadius = '1em';
    content_div.style.boxShadow = '0 0 2em rgba(0,0,0,0.5)';
    content_div.style.color = 'black';
    content_div.style.wordBreak = 'keep-all';
    content_div.style.wordWrap = 'break-word';
    content_div.style.hyphens = 'auto';
    content_div.style.textAlignLast = 'start';
    content_div.style.border = '1px solid black';
    back_div.appendChild(content_div);

    let ui = document.createElement('div');
    ui.style.justifyContent = 'center';
    ui.style.alignItems = 'center';
    ui.style.width = '100%';
    ui.style.height = '2em';
    ui.style.verticalAlign = 'middle';
    ui.style.bottom = '0';
    ui.style.display = 'flex';
    ui.style.flexDirection = 'row';
    back_div.appendChild(ui);

    //let btn = document.createElement('button');
    //btn.style.width = '100%';
    //btn.style.height = '100%';
    const settingsContainer = document.getElementById('settingsContainer');
    settingsContainer.appendChild(back_div);
}