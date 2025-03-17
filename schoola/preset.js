
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
