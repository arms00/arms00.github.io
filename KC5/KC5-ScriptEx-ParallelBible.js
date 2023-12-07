//#region 병행성경시각화
async function saveParallelVisibilityState(bibleName, isVisible) {    
    // 먼저 해당 키에 대한 데이터를 삭제합니다. (필요없음)
    //await deleteData("paralle_abbr_display", bibleName);
    
    // 삭제 후, 새로운 데이터를 추가합니다.
    await writeData("paralle_abbr_display", bibleName, isVisible);    
    //Alert("병행성경 " + bibleName + ":" + await getParallelVisibilityState(bibleName));
}

async function getParallelVisibilityState(bibleName) {
    let visibilityState = await readData("paralle_abbr_display", bibleName);
    return visibilityState ? visibilityState.value : true;
}

async function transCompares() {        
    //첫번째 abbr 및 하부 abbr 획득
    const abbrs = g_content.getElementsByClassName('abbr');
    // 각 abbr 들의 biblename을 획득하여, 컬러값을 생성
    const abbrLen = abbrs.length;
    let style = document.createElement('style');
    style.innerHTML = '[name=_verse_] {margin-top:0.5em;margin-bottom:0.3em;white-space:nowrap;display:block;overflow-x:auto;}\n.bibleSubTitle {margin-left:0.25em;margin-right:0.25em;}\n';
    let bibleBtns = document.createElement('span');    
    let bibleNameBtn = {};
    let isWide = false;
    if (Setting("시각화된병행좌우와이드")) isWide = true;    
    for (let i = 0; i < abbrLen; i++)
    {
        let abbr = abbrs[i]; let _str = abbr.innerText;
        if (!bibleNameBtn[_str])
        {
            bibleNames[_str] = true;
            bibleNameBtn[_str] = document.createElement('button');
            bibleNameBtn[_str].innerText = _str;
            bibleNameBtn[_str].classList.add("verno_btn");            
            bibleNameBtn[_str].setAttribute('name', 'btn_' + _str);
            //bibleNameBtn[_str].setAttribute('onclick', 'onClick_bibleBtn("' + _str + '")');
            bibleBtns.append(bibleNameBtn[_str]);
            if (isWide)
            {
                if (Setting("시각화된병행절색칠BOX")) style.innerHTML +=  '[name="'+ _str +'"] {padding-left:0.25em;padding-right:0.25em;background-color:'+ColorOfString(_str, 0.16)+';}\n';                
                else style.innerHTML +=  '[name="'+ _str +'"] {margin-bottom:1em;padding-right:0.25em;padding-left:0.4em;border-left:solid 0.35em '+ColorOfString(_str, 0.5)+';}\n';        
            }
            else
            {
                if (Setting("시각화된병행절색칠BOX")) style.innerHTML +=  '[name="'+ _str +'"] {margin-left:0.8em;margin-right:0.8em;padding-left:0.5em;padding-right:0.5em;background-color:'+ColorOfString(_str, 0.16)+';}\n';                
                else style.innerHTML +=  '[name="'+ _str +'"] {margin-left:0.8em;margin-right:0.8em;margin-bottom:1em;padding-left:0.5em;padding-right:0.2em;border-left:solid 0.35em '+ColorOfString(_str, 0.5)+';}\n';                                
            }            
            style.innerHTML +=  '[name="btn_'+ _str +'"] {background-color:'+ColorOfString(_str)+';}\n';            
        }
        else break;
    }    
    // 각 병행성경의 표시여부를 확인하여, 성경이름별 표시여부를 저장        
    for (let bibleName in bibleNames) {
        //while (!bibleName) await timer(100);
        //Alert("Checking visibility for:", bibleName);
        let isVisible = await getParallelVisibilityState(bibleName);
        if (isVisible !== null) {
            bibleNames[bibleName] = isVisible;            
        }        
    }    
    const compareHTML = g_content.innerHTML.replace(
    /(?<sverseP><p class\="sverse"(?:(?!<p class\="sverse")[\s\S])*?|<p id\="v1" class\="verse[\s\S]*?)<\/p>(?<sverseTitle><h2 class="title"[\s\S]*?<\/h2>)<p.*?>/g,'$<sverseP>').replace(/<p (?<verseRoot>id\="v\d+".*?)(?<verseSpan><span (?<verseAtt1>.*?id="r.*?>))(?<abbrLink1><a class\="abbr"[^>]*>(?<abbrName1>.*?)<\/a>)(?<verseContent>(?:<p>.*?<\/p>|[\s\S])*?)(<\/span>)?<\/p>/g,'<p name="_verse_" $<verseRoot></p><div name="$<abbrName1>" class="sverse" $<verseAtt1>$<verseContent></div>').replace(/<p (?<sverseDiv>class\="sverse".*?|[^>]*id="r.*?)(?<abbrLink2><a class\="abbr"[^>]*>(?<abbrName2>.*?)<\/a>)(?<sverseContent>(?:<p>.*?<\/p>|[\s\S])*?)<\/p>/g, '<div name="$<abbrName2>"$<sverseDiv>$<sverseContent></div>');

    g_content.innerHTML = compareHTML;    
    requestAnimationFrame(() => {
        if (isChangedCompareBible) 
        {            
            return;
        }
        // DOM 변경이 완료된 후의 코드
        for (let bibleName in bibleNames) {
            const verses = g_content.querySelectorAll('div[name="' + bibleName + '"]');
            verses.forEach(_v => 
                {
                    if (Setting("RTL을LTR로표시")) 
                    {
                        _v.setAttribute('dir', 'ltr');      
                        if (Setting("콘텐츠좌우정렬")) _v.style.textAlign = 'justify';
                        else _v.style.textAlign = 'left';
                    }           
                    _v.style.display = bibleNames[bibleName] ? 'block' : 'none';                    
                }            
            );
            const btns = g_content.querySelectorAll('[name="btn_' + bibleName + '"]');
            btns.forEach(_b => {
                //_b.innerText = bibleNames[bibleName] ? bibleName : '🚫' + bibleName;
                _b.style.opacity = bibleNames[bibleName] ? '1' : '0.5';
                _b.style.width = bibleNames[bibleName] ? 'auto' : '1.5rem';
            });
        }
        isChangedCompareBible = true;
    });    
    // verse라는 name으로 만들어준 각 절별로 bibleNameBtn 준비한 성경이름으로 버튼들을 생성한다        
    let names = Object.keys(bibleNameBtn);    
    const verses = g_content.querySelectorAll('[name="_verse_"]');    
    if (verses.length === 0) { 
        bibleNameBtn = null;
        isChangedCompareBible = false; return; 
    }
    const curB = getCurBook("b");
    const curC = getCurBook("c");    
    if (names.length>0 && verses.length>0)
    {        
        verses.forEach(_verse => {
            const curV = _verse.getAttribute('id').replace('v', '');
            if (Setting("시각화된병행소제목표시"))
                SetParallelSubtitles(curB, curC, curV, _verse);                            
            let btn = bibleBtns.cloneNode(true);            
            _verse.appendChild(btn);
            btn.childNodes.forEach(_btn => {
                _btn.setAttribute('onclick', 'onClick_bibleBtn(this,' + curB + ',' + curC + ',' + curV + ')');
            });
        });
        g_content.append(style);
    }    
}

// function AbbrsVisibilities()
// {   
//     let testValue = "";
//     for (let bibleName in bibleNames) {
//         testValue += bibleName + ":" + bibleNames[bibleName] + "/";
//         const verses = g_content.querySelectorAll('div[name="' + bibleName + '"]');
//         verses.forEach(_v => _v.style.display = bibleNames[bibleName] ? 'block' : 'none');
//         const btns = g_content.querySelectorAll('[name="btn_' + bibleName + '"]');
//         btns.forEach(_b => {
//             _b.innerText = bibleNames[bibleName] ? bibleName : '🚫' + bibleName;
//             _b.style.opacity = bibleNames[bibleName] ? '1' : '0.5';
//         });
//     }
//     Alert("Test :: " + testValue);
// }

function SetParallelSubtitles(curB, curC, curV, verseElement) {    
    //await waitForModules('성경소제목');    
    const subTitle = ElementSubtitle(curB, curC, curV);
    if (subTitle !== null) verseElement.parentNode.insertBefore(subTitle, verseElement);
}

function ElementSubtitle(curB, curC, curV) {    
    if (typeof bibleSubtitles !== 'undefined' && bibleSubtitles.length > 0)
    {
        let isSubtitled = false;
        const subTitleElement = document.createElement('h2');
        subTitleElement.classList.add("bibleSubTitle");

        for (let i = 0; i < bibleSubtitles.length; i++) {
            const subTitle = findSubtitle(bibleSubtitles[i], curB, curC, curV);
            if (subTitle && subTitle.head) {
                const subtitleSpan = document.createElement('span');
                //const subTitleRange = findSubtitleRange(bibleSubtitles[i], curB, curC, curV);
                //const xrefs = await findComplexReference(subTitleRange.start.b, subTitleRange.start.c, subTitleRange.start.v, subTitleRange.end.b, subTitleRange.end.c, subTitleRange.end.v);
                // if (xrefs && xrefs.length > 0) {
                //     subtitleSpan.setAttribute('href', xrefs[0]);
                // }
                // subtitleSpan.classList.add("kc_ui");
                // const rf = document.createElement('RF');
                // rf.textContent = '▶ ';
                // subtitleSpan.appendChild(rf);
                //     subTitleRange.end.b + '.' + subTitleRange.end.c + '.' + subTitleRange.end.v );
                //     _subTitleLink.setAttribute('href', 'b' + subTitleRange.start.b + '.' + subTitleRange.start.c + '.' + subTitleRange.start.v + '-' + subTitleRange.end.b + '.' + subTitleRange.end.c + '.' + subTitleRange.end.v );
                //     _subTitleLink.classList.add("kc_ui");
                //     _subTitleLink.textContent = '▶ ';
                //     _subTitle.prepend(_subTitleLink);
                // }
                subtitleSpan.textContent = i == 0? subTitle.head : ' (' + subTitle.head + ')';
                //subtitleSpan.outerHTML += '<RF>▶<Rf>';
                subTitleElement.appendChild(subtitleSpan);
                isSubtitled = true;
            }            
        }
        if (isSubtitled) return subTitleElement;        
    }
    return null;
    // if (typeof bibleSubtitles2 !== 'undefined')
    // {
    //     const subTitle2 = GetElementSubtitle(bibleSubtitles2, curB, curC, curV);        
    //     if (subTitle2) {            
    //         title_head.insertBefore(subTitle2, element);
    //     }
    // }    
}

function SetVerseBibleButtons(verseElement, buttonsElement){

}

async function onClick_bibleBtn(btnElement, curB, curC, curV) {    
    const _name = btnElement.getAttribute('name').replace('btn_', '');

    if (Setting("시각화된병행버튼으로성경숨기기")) {
        //현재 위치 알아내기            
        const viewportRelativeTop = btnElement.getBoundingClientRect().top;
        loadImgStart();
        await timer(100);
        const allVerses = g_content.querySelectorAll('div[name]');
        const targetVerses = g_content.querySelectorAll('[name="' + _name + '"]');
        const isTargetVisible = targetVerses[0].style.display !== 'none';
        const totalVisible = [...allVerses].filter(v => v.style.display !== 'none').length;
        const totalNotVisible = [...allVerses].filter(v => v.style.display === 'none').length;

        let otherVersesVisibleCount = 0;
        allVerses.forEach(_v => {
            if (_v.style.display !== 'none' && !_name.includes(_v.getAttribute('name'))) {
                otherVersesVisibleCount++;
            }
        });

        // if (totalNotVisible === 0) {
        //     allVerses.forEach(_v => _v.style.display = 'none');
        //     targetVerses.forEach(_v => _v.style.display = 'block');
        // } else                
        // if (otherVersesVisibleCount === allVerses.length - targetVerses.length && !isTargetVisible) {
        //     // 만약 하나의 성경만 안 보이는 상태에서 그 성경의 버튼을 누르면, 
        //     // 해당 성경만 보이게하고 나머지 성경들은 모두 숨긴다.
        //     allVerses.forEach(_v => _v.style.display = 'none');
        //     targetVerses.forEach(_v => _v.style.display = 'block');
        // } else if (totalVisible === targetVerses.length && isTargetVisible) {
        //     // 하나의 성경만 보이는 상태에서 그 성경의 버튼을 누르면, 
        //     // 해당 성경을 숨기고 나머지 성경들은 모두 보인다.
        //     allVerses.forEach(_v => _v.style.display = 'block');
        //     targetVerses.forEach(_v => _v.style.display = 'none');
        // } else {
        //     // 기본 토글 동작
        //     targetVerses.forEach(_v => {
        //         _v.style.display = _v.style.display === 'none' ? 'block' : 'none';
        //     });
        // }

        // 기본 토글 동작
        targetVerses.forEach(_v => {
                _v.style.display = _v.style.display === 'none' ? 'block' : 'none';
            });

        // 버튼 이름 업데이트
        const allBtns = g_content.querySelectorAll('button[name^="btn_"]');
        const isSaved = {};
        for (const _b of allBtns) {
            const btnBibleName = _b.getAttribute('name').replace('btn_', '');
            const btnVerses = g_content.querySelectorAll('[name="' + btnBibleName + '"]');
            const isBtnBibleVisible = btnVerses[0].style.display !== 'none';
            if (!isSaved[btnBibleName]) {
                await saveParallelVisibilityState(btnBibleName, isBtnBibleVisible);
                isSaved[btnBibleName] = true;
            }
            if (isBtnBibleVisible) {
                _b.innerText = btnBibleName;
                _b.style.opacity = '1'; // 완전 불투명
                _b.style.width = 'auto';
            } else {                
                _b.style.opacity = '0.5'; // 70% 투명도
                _b.style.width = '1.5rem';
            }
        }        
        loadImgStop();
        // 다시 해당 성경 절의 위치로 스크롤
        const absolutePositionAfterChange = btnElement.getBoundingClientRect().top + window.pageYOffset;            
        window.scrollTo(0, absolutePositionAfterChange - viewportRelativeTop);
    } else {
        location.href = 'b' + curB + '.' + curC + '.' + curV + '.' + _name;
    }
}

async function showAllBibles(curElement = null) {
    // 1. 숨겨진 모든 성경을 보이게함
    // 2. 화면의 상하단으로 너무 치우진 절을 스크롤을 조정함
    const viewportHeight = window.innerHeight;
    const viewportRelativeTop = curElement ? curElement.getBoundingClientRect().top : 0;
        
    if (Setting("시각화된병행버튼으로성경숨기기")) {                
        loadImgStart();
        await timer(100);

        for (let bibleName in bibleNames) {
            const verses = g_content.querySelectorAll('div[name="' + bibleName + '"]');
            verses.forEach(_v => _v.style.display = 'block');
            await saveParallelVisibilityState(bibleName, true);
            const btns = g_content.querySelectorAll('[name="btn_' + bibleName + '"]');
            btns.forEach(_b => {
                _b.innerText = bibleName;
                _b.style.opacity = '1';
            });
        }
        
        loadImgStop();
    }
    if (curElement !== null) {
            const absolutePositionAfterChange = curElement.getBoundingClientRect().top + window.pageYOffset;
            const scrollToPosition = absolutePositionAfterChange - viewportRelativeTop;
            
           window.scrollTo(0, scrollToPosition); 

           if (Setting("선택절스크롤보정")  && viewportRelativeTop !== 0 && viewportRelativeTop !== viewportHeight) {
                if (viewportRelativeTop < viewportHeight * 0.15) {
                    window.scrollTo({ top: scrollToPosition - window.innerHeight * 0.2 + viewportRelativeTop, behavior: 'smooth' });
                } else if (viewportRelativeTop > viewportHeight * 0.8) {
                    window.scrollTo({ top: scrollToPosition + (viewportRelativeTop - window.innerHeight * 0.7) + curElement.offsetHeight, behavior: 'smooth' });
                }                 
           }
        }
}
//#endregion