
export const systemPrompt = `
# 교육용 메타버스 캐릭터 커스터마이저 시스템

당신은 교육용 메타버스 플랫폼의 자연어 기반 캐릭터 커스터마이징 시스템입니다. 사용자가 자연어로 요청하는 캐릭터 생성 및 수정 요청을 이해하고, 적절한 에셋 ID를 매칭하여 반환해야 합니다.

## 역할 및 목적
- 사용자의 자연어 요청을 정확히 이해합니다
- 요청이 전체 캐릭터 변경인지 부분 변경인지 분석합니다
- 교육 환경에 적합한 캐릭터 에셋을 선택합니다
- 사용자 요청을 에셋 ID 조합으로 변환합니다
`;

export const avatarPreset =
[
    {
        "name": "아카데믹",
        "style": "학구적이고 전문적인",
        "characteristic": "단정함, 지적인 이미지, 신뢰감",
        "keywords": [
            "정돈된 짧은 머리, 단정한 번 헤어",
            "단정한 셔츠, 블레이저, 세미포멀 의류",
            "안경, 심플한 액세서리",            
        ],
        "color": "네이비, 그레이, 베이지 등 차분한 색상",
        "data": {
            "hair": ["11804862", "9247479", "49572698"],
            "top": ["146130059", "RAMumX7mRJKdtzkYp7SOQw"],
            "bottom": ["146120431", "rbGTy_C0Rp-9HcOpwUQOQw"],
            "footwear": ["XIzjukD6Tl-AIuznRKxLjg", "146120526"],
            "glasses": ["9247558", "45552874"],
        }        
    },
    {
        "name": "에너제틱",
        "style": "발랄하고 스포티한",
        "characteristic": "활동적, 경쾌한 이미지, 젊은 느낌",
        "keywords": [
            "높은 포니테일, 짧은 스포츠 머리",
            "스포티한 상의, 스니커즈, 스포츠 의류",
            "모자, 스포티한 액세서리",
        ],
        "color": "밝은 색상, 화려한 컬러",
        "data": {
            "hair": ["39291588", "49575697", "9247579"],
            "top": ["146142423", "146120116"],
            "bottom": ["145064644", "146120161"],
            "footwear": ["tjm2Yq4RRhC9kNEHgmZvZQ", "146120867"],
            "glasses": ["", "", "106638139"],
            "headwear": ["", "109889247", "41887474"],
        }
    },
    {
        "name": "단정캐주얼",
        "style": "단정하고 캐주얼한",
        "characteristic": "깔끔한 이미지, 심플한 스타일",
        "keywords": [
            "자연스러운 미디엄 헤어, 볼륨 웨이브 미디엄",
            "티셔츠, 스웨터, 청바지",
            "안경, 심플한 액세서리",
        ],
        "color": "화이트, 블랙, 네이비 등 심플한 색상",
        "data": {            
            "top": ["145857239", "tjfdXbNjQAubq1R8TNc6iw"],
            "bottom": ["5v8yAHTgStqDnYZuJEmFrw", "146120748"],
            "footwear": ["146120526", "XIzjukD6Tl-AIuznRKxLjg"],
            "glasses": ["9247553", "", ""],
        }
    },
    {
        "name": "크리에이티브",
        "style": "창의적이고 예술적인",
        "characteristic": "독특한 이미지, 개성적인 스타일",
        "keywords": [
            "비대칭 언더컷, 곱슬 아프로",
            "패턴 상의, 패치워크 바지",
            "모자, 독특한 액세서리",
        ],
        "color": "다채로운 컬러, 화려한 패턴",
        "data": {
            "hair": ["49561763", "40597504", "9247537"],
            "top": ["PNRGEG92SGOUUphSIcrqOg", "2l5H3ls1THm2wWiHVT8FYQ"],
            "bottom": ["148367876", "5uxVpIcuS5CrRe6CMab6hQ"],
            "footwear": ["146120230", "146089198"],
            "glasses": ["48032762", "9928964", ""],
            "headwear": ["2l5H3ls1THm2wWiHVT8FYQ", "66887893", ""],
        }
    },
    {
        "name": "퓨처리스틱",
        "style": "미래지향적인",
        "characteristic": "첨단적인 이미지, 과학적 분위기",
        "keywords": [
            "모던 짧은 머리, hair-13",
            "미래지향적 상의, 밀리터리 바지",
            "헬멧, 사이버펑크 액세서리",
        ],
        "color": "블랙, 실버, 화이트 등 단색",
        "data": {
            "hair": ["9247425", "9247469", "10204676"],
            "top": ["zj3Y_TQJR4mNqPIJZJPkxg", "QrMGVJqKQ0yyO7lh2UbkBA"],
            "bottom": ["146142477", "146120161"],
            "footwear": ["mLfEvkz7RV2tmg6cbJKUnA", "o_gJaFROSz6lH80U79CTgw"],
            "glasses": ["110789235", "10829151"],
            "headwear": ["10528601", "11007582", ""],
        }
    }
];


/*
이 헤어스타일 데이터에서 다음 다섯 가지 캐릭터에 대해 어울리는 헤어스타일 id를 찾아줘

각 스타일에 어울리는 헤어스타일 ID입니다.

학구적/전문적 스타일 (Academic)

✅ 11804862 (정돈된 짧은 머리)
✅ 9247479 (번 헤어)
✅ 49572698 (단정 우아 똥머리)
발랄하고 스포티한 스타일 (Energetic)

✅ 39291588 (높은 포니테일)
✅ 49575697 (짧은 스포츠 머리 - 수평컷 이마)
✅ 9247579 (포니테일 + 앞머리)
단정하고 캐주얼한 스타일 (Neat Casual)

✅ 9247422 (자연스러운 미디엄 헤어)
✅ 16706931 (볼륨 웨이브 미디엄)
✅ 9247542 (어깨 길이 스트레이트 헤어)
창의적/예술적 스타일 (Creative)

✅ 49561763 (비대칭 언더컷)
✅ 40597504 (곱슬 아프로)
✅ 9247537 (볼륨 컬 헤어)
미래지향적 스타일 (Futuristic)

✅ 9247425 (모던 짧은 머리)
✅ 9247469 (hair-13 - 둥근, 독특한, 조각난 텍스처)
✅ 10204676 (언더컷 + 그래픽 패턴)
*/


/*
다음은 각 스타일에 어울리는 신발 에셋 ID입니다.

학구적/전문적 스타일 (Academic)

✅ XIzjukD6Tl-AIuznRKxLjg (tennis-casual-01-grey, 심플하고 모던한 캐주얼 테니스화)
✅ 146120526 (tennis-casual-01, 베이직한 디자인의 흰색+베이지 테니스화)
발랄하고 스포티한 스타일 (Energetic)

✅ tjm2Yq4RRhC9kNEHgmZvZQ (tennis-sport-01-white, 가벼운 흰색 테니스화)
✅ 146120867 (tennis-sport-01, 다채로운 색상의 스포츠 스니커즈)
단정하고 캐주얼한 스타일 (Neat Casual)

✅ 146120526 (tennis-casual-01, 심플한 흰색+베이지 테니스화)
✅ XIzjukD6Tl-AIuznRKxLjg (tennis-casual-01-grey, 회색 테니스화)
창의적/예술적 스타일 (Creative)

✅ 146120230 (shoes-casual-01, 청키한 아웃솔이 돋보이는 로퍼)
✅ 146089198 (boots-combat-01, 반항적인 느낌의 컴뱃 부츠)
미래지향적 스타일 (Futuristic)

✅ mLfEvkz7RV2tmg6cbJKUnA (boots-sport-01-blackwine, 미래지향적인 디자인의 스포티 부츠)
✅ o_gJaFROSz6lH80U79CTgw (boots-sport-03-beigepalette, 테크웨어 느낌의 스포티 부츠)
*/

/*
각 스타일에 어울리는 안경 에셋 ID입니다.

학구적/전문적 스타일 (Academic)

✅ 9247558 (지적인 팔각 안경)
✅ 45552874 (오버사이즈 라운드 금테 안경)
발랄하고 스포티한 스타일 (Energetic)

✅ 106638139 (투명 보호 고글)
필요 없음 (일반적인 스포츠 스타일에서는 안경이 필수가 아님)
단정하고 캐주얼한 스타일 (Neat Casual)

✅ 9247553 (투명 무테 안경)
필요 없음 (캐주얼 스타일에 따라 안경 없이도 충분히 단정한 이미지 연출 가능)
창의적/예술적 스타일 (Creative)

✅ 48032762 (골드 틴티드 라운드 반무테 안경)
✅ 9928964 (패턴 템플 라운드 스퀘어 무테 안경)
미래지향적 스타일 (Futuristic)

✅ 110789235 (미래형 블랙 바이저)
✅ 10829151 (AR HUD 글래스)
*/

/*
 각 스타일에 어울리는 바지 에셋 ID입니다.

학구적/전문적 스타일 (Academic)

✅ 146120431 (pants-casual-01) - 깔끔한 검정색 슬림핏 캐주얼 바지
✅ rbGTy_C0Rp-9HcOpwUQOQw (pants-casual-01-italian) - 세련된 스트라이프 패턴 캐주얼 바지
발랄하고 스포티한 스타일 (Energetic)

✅ 145064644 (pants-casual-02) - 활동성 좋은 넉넉한 핏의 카고 팬츠
✅ 146120161 (pants-adventure-01) - 실용적이고 활동적인 카고 팬츠
단정하고 캐주얼한 스타일 (Neat Casual)

✅ 5v8yAHTgStqDnYZuJEmFrw (pants-jeans-01-color5) - 약간 부츠컷 스타일의 검정색 청바지
✅ 146120748 (pants-jeans-01) - 편안한 부츠컷 스타일 청바지
창의적/예술적 스타일 (Creative)

✅ 148367876 (pants-jeans-02) - 패치워크 디테일이 돋보이는 독특한 청바지
✅ 5uxVpIcuS5CrRe6CMab6hQ (pants-occasionwear-01-bleachedjeans) - 블리치 패턴이 있는 개성 강한 조거 팬츠
미래지향적 스타일 (Futuristic)

✅ 146142477 (pants-military-01) - 미래적인 밀리터리 스타일 바지 (무릎 보호대 & 테크웨어 느낌)
✅ 146120161 (pants-adventure-01) - 기능적이고 실용적인 스타일의 바지
*/

/*
각 스타일에 어울리는 상의 에셋 ID입니다.

학구적/전문적 스타일 (Academic)

✅ 146130059 (jacket-occasionwear-01) - 세련된 니트 재킷, 차분한 베이지 톤
✅ RAMumX7mRJKdtzkYp7SOQw (jacket-occassionwear-02-blackwhite) - 단정하고 개성 있는 블랙 & 화이트 레이어드 재킷
발랄하고 스포티한 스타일 (Energetic)

✅ 146142423 (jacket-sport-01) - 스포티하고 세련된 블랙 & 골드 자켓
✅ 146120116 (hoodie-01) - 밝고 생기 넘치는 노란색 후드티
단정하고 캐주얼한 스타일 (Neat Casual)

✅ 145857239 (top-tshirt-01) - 기본적인 심플한 흰색 티셔츠
✅ tjfdXbNjQAubq1R8TNc6iw (sweater-01-longslv-roundcoll-darkgrey) - 단정한 느낌의 진회색 스웨터
창의적/예술적 스타일 (Creative)

✅ PNRGEG92SGOUUphSIcrqOg (jacket-puffed-02-painted) - 독창적인 페인트 패턴 패딩
✅ 2l5H3ls1THm2wWiHVT8FYQ (floral-hoodie) - 개성 있는 다채로운 꽃무늬 후드
미래지향적 스타일 (Futuristic)

✅ zj3Y_TQJR4mNqPIJZJPkxg (jacket-puffed-02-black) - 트렌디한 오버사이즈 블랙 패딩
✅ QrMGVJqKQ0yyO7lh2UbkBA (sweater-01-longslv-roundcoll-brightbluedecal) - 밝은 파란색 로봇 데칼 스웨터
*/

/*
각 스타일에 어울리는 액세서리(모자/헬멧) 에셋 ID입니다.

학구적/전문적 스타일 (Academic)

필요 없음 (단정한 헤어스타일과 안경이 어울림)
발랄하고 스포티한 스타일 (Energetic)

✅ 109889247 (화이트 비니와 형광 고글 세트) - 활동적이고 스포티한 느낌의 겨울 스포츠 스타일
✅ 41887474 (블랙 야구 모자와 패턴 두건 세트) - 힙한 스트리트 스타일과 스포티한 분위기
단정하고 캐주얼한 스타일 (Neat Casual)

필요 없음 (깔끔한 캐주얼 스타일에는 모자가 필수적이지 않음)
창의적/예술적 스타일 (Creative)

✅ 2l5H3ls1THm2wWiHVT8FYQ (무지개 카우보이 모자) - 화려한 색상과 독특한 스타일
✅ 66887893 (까마귀 해골 장식 마법사 모자) - 창의적이고 예술적인 캐릭터를 위한 개성 강한 디자인
미래지향적 스타일 (Futuristic)

✅ 10528601 (사이버펑크 스타일 헬멧) - 첨단 기술과 미래적인 분위기 연출
✅ 11007582 (사이버펑크 헤드기어) - 인체 개조 느낌의 독특한 미래적 디자인
*/

