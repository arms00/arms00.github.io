
document.getElementById('loadingFix').innerHTML="<b>···LOADING···</b>";
//loadImgStart();
Remove_script();

//#region 검색 및 디텍션 워드, 클릭 이벤트
document.addEventListener('click', (e) => {
    if (!_loaded) return;
    let target = e.target;    
    if (target.parentElement.id == "content") target = target.parentElement;
    if (target.getAttribute("xcontenteditable") == "true" || target.getAttribute("contenteditable") == "true") {
        g_rangeValue = "";
        _isSelection = false;
        target.focus();
        return;
    }    
    if (target.tagName == "IMG" || target.tagName == "BUTTON" || target.tagName == "INPUT" || target.tagName == "SUMMARY" || target.tagName == "TEXTAREA" || target.tagName == "SELECT" || target.className == "ui" || target.parentElement.tagName == "BUTTON" || target.parentElement.tagName == "INPUT" || target.parentElement.tagName == "SUMMARY" || target.parentElement.tagName == "TEXTAREA" || target.parentElement.tagName == "SELECT" || target.parentElement.className == "ui") {
        pvtClk();
        return;
    }
    if (funcmode > 0) { return; }
    setTimeout(() => g_isdragged = false, 500);
    if (a_prevent) { return; }
    if (g_transMode) clearCurrentSelectionBoxes();
    wordDetection(e);
    if (g_transMode) { drawSelectionBoxes(); drawPreRangeBoxes(); }
    //getWordAtPoint(e);
});

document.addEventListener('selectionchange', (e) => {
    if (!_loaded) return;
    //if (isSelection===false) return;
    pvtClk();
    g_selection = window.getSelection();
    g_range = g_selection.getRangeAt(0);
    if (g_rangeValue.length > 0) g_rangeValue_prev = g_rangeValue;
    g_rangeValue = g_range.toString().trim();
    if (_isSelection) searchInput.value = g_rangeValue;
    let len = g_rangeValue.length;
    if (len > 0) { 
        _isSelection = true;
        if (len != g_rangeValue_prev.length) { 
            g_isdragged = true; 
            donthideSearchBar();
            if (wordDetectionReleaseTimeOut) clearTimeout(wordDetectionReleaseTimeOut);
        }        
    }
    //else hideSearchBarAfterFew();
    if (len > 500) Alert('(' + len.toString() + ')');
}
);
window.addEventListener('copy', (e) => {    
    if (!_loaded) return;
    if (funcmode > 0) return;    
    pvtClk();
    Alert('Copied to clipboard');
    toggle_bottom(0);

    let _interval = setInterval(async () => {
        if (g_rangeValue_prev.length > 0) {
            searchInput.value = g_rangeValue_prev;
            await timer(100);
            if (searchInput.value == g_rangeValue_prev) {
                //searchInput.select();
                clearInterval(_interval);
            }
        }
    }, 100);
}
);
//#endregion 검색 및 디텍션 워드, 클릭 이벤트


window.addEventListener('orientationchange', () => {
    if (!_loaded) return;
    searchInput.blur()
});
/*
function fetchAndInsertHTML(url) {
    const proxyUrl = "https://web-proxy-067b1f653386.herokuapp.com/";
	//decodedUrl = decodeURIComponent(escape(atob(encodedText))); 
    fetch(proxyUrl + url)
    .then(response => {
        if (!response.ok) {
            Alert("Network response was not ok");
        }
        return response.text();
    })
    .then(html => {
        document.getElementById('content').innerHTML = transformResourcePaths(html, url, proxyUrl);
    })
    .catch(error => {
        Alert("Failed to fetch and insert HTML: " + error);
    });
}
function transformResourcePaths(html, originalSiteUrl, proxyUrl) {
    // 이미지, 스크립트, 링크 태그의 속성들을 찾아 수정하기 위한 정규식
    const resourcePatterns = [
        { tag: 'img', attribute: 'src' },
        { tag: 'link', attribute: 'href' },
        { tag: 'script', attribute: 'src' }
        // 필요한 다른 태그와 속성도 여기에 추가할 수 있습니다.
    ];

    resourcePatterns.forEach(pattern => {
        const regex = new RegExp(`(<${pattern.tag}[^>]*?${pattern.attribute}=["'])([^"']*?)(["'][^>]*?>)`, 'gi');
        html = html.replace(regex, (match, prefix, resourcePath, suffix) => {
            // 절대 경로나 프로토콜을 포함하는 URL은 그대로 둡니다.
            if (resourcePath.startsWith('http://') || resourcePath.startsWith('https://') || resourcePath.startsWith('//')) {
                return match;
            }
            // 상대 경로를 프록시를 거쳐 로드하도록 수정합니다.
            //return prefix + proxyUrl + originalSiteUrl + resourcePath + suffix;
            return prefix + proxyUrl + resourcePath + suffix;
        });
    });

    return html;
}
*/

function createSelectionFromPoint(startX, startY, endX, endY) {
    let doc = document;
    let start, end, range = null;
    if (typeof doc.caretPositionFromPoint != "undefined") {
        start = doc.caretPositionFromPoint(startX, startY);
        end = doc.caretPositionFromPoint(endX, endY);
        range = doc.createRange();
        range.setStart(start.offsetNode, start.offset);
        range.setEnd(end.offsetNode, end.offset);
    } else if (typeof doc.caretRangeFromPoint != "undefined") {
        start = doc.caretRangeFromPoint(startX, startY);
        end = doc.caretRangeFromPoint(endX, endY);
        range = doc.createRange();
        range.setStart(start.startContainer, start.startOffset);
        range.setEnd(end.startContainer, end.startOffset);
    }
    if (range !== null && typeof window.getSelection != "undefined") {
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof doc.body.createTextRange != "undefined") {
        range = doc.body.createTextRange();
        range.moveToPoint(startX, startY);
        let endRange = range.duplicate();
        endRange.moveToPoint(endX, endY);
        range.setEndPoint("EndToEnd", endRange);
        range.select();
    }
    return range.toString();
}
function addPvtClk(_tagName, _eval, isClass = false) {
    if (isClass) _t = document.getElementsByClassName(_tagName);
    else _t = document.getElementsByTagName(_tagName);
    if (_t.length === 0) return;
    const len = _t.length;
    for (let i = 0; i < len; i++) {
        let className = _t[i].className;
        if (className == null) continue;
        let _onclick = _t[i].getAttribute('onclick');
        if (_onclick != null && _onclick.includes(_eval + '(')) continue;
        if (_onclick == null) _onclick = "";
        _t[i].setAttribute('onclick', _eval + '();' + _onclick);
    }
}

//@@1 텍스트 디텍션
function wordDetection(e, ahref_wtext = false) {
    if (Setting("텍스트선택해제시간"))
    {   
        if (lastSelectedElement != e.target)
        {
            if (wordDetectionReleaseTimeOut) 
            {
                clearTimeout(wordDetectionReleaseTimeOut);
            }
            wordDetectionReleaseTimeOut = setTimeout(
                () => {
                    if (lastSelectedElement==e.target)
                    {
                        _isSelection = false;
                        g_rangeValue = "";
                        g_selection.removeAllRanges();
                        lastSelectedElement = null;                
                    }                
                } , Setting("텍스트선택해제시간") * 1000 );
        }
    }
    if (lastSelectedElement && lastSelectedElement.hasAttribute('prev-border')) {
        lastSelectedElement.style.border = lastSelectedElement.getAttribute('prev-border');
        lastSelectedElement.removeAttribute('prev-border');
    }                
    lastSelectedElement = e.target;    
    g_selection = window.getSelection();
    if (!g_selection || g_selection.rangeCount < 1) {
        g_rangeValue = "";
        if (!_isSelection) toggle_bottom(); _isSelection = false;
        hideSearchBarAfterFew();
        return g_rangeValue;
    }
    const node = g_selection.anchorNode;
    let text = node.data;
    let index = g_selection.anchorOffset,
        symbol = "a",
        word = "";
    if (text.length > 1) {
        while (!regexOnclick.test(symbol) && symbol !== undefined) {
            symbol = text[index--];
        }
        index += 2;
        symbol = "a";
        while (!regexOnclick.test(symbol) && index < text.length) {
            symbol = text[index++];
            word += symbol;
        }
    } else {
        word = text;
    };
    word = word.replace(regexOnclick, "");
    if (word.length == 0) {
        if (!g_isdragged && !_isSelection) toggle_bottom();
        _isSelection = false;
        g_rangeValue = "";
        g_selection.removeAllRanges();
        hideSearchBarAfterFew();
        return g_rangeValue;
    }
    let range_prev = g_range ? g_range : null;
    g_range = g_selection.getRangeAt(0);
    if (range_prev != null && g_range.compareBoundaryPoints(Range.END_TO_END, range_prev) == 0) {
        _isSelection = true;
        toggle_bottom(0);
        return g_rangeValue;
    }    

    while ((g_range.startOffset > 0) && g_range.toString().match(word_regexp)) {
        g_range.setStart(node, (g_range.startOffset - 1));
    }
    if (!g_range.toString().match(word_regexp)) {
        g_range.setStart(node, g_range.startOffset + 1);
    }
    while ((g_range.endOffset < node.length) && g_range.toString().match(word_regexp)) {
        g_range.setEnd(node, g_range.endOffset + 1);
    }
    if (!g_range.toString().match(word_regexp)) {
        g_range.setEnd(node, g_range.endOffset - 1);
    }

    if (!(g_range.getBoundingClientRect().left <= e.x + 3 && g_range.getBoundingClientRect().right >= e.x - 3 &&
        g_range.getBoundingClientRect().top <= e.y + 2 && g_range.getBoundingClientRect().bottom >= e.y - 2)) {
        if (!g_isdragged && !_isSelection) toggle_bottom();
        _isSelection = false;
        g_rangeValue = "";
        g_selection.removeAllRanges();
        return g_rangeValue;
    }

    g_rangeValue = g_range.toString().trim();
    if (g_rangeValue !== "") {
        clearTimeout(onc_timeOut);
        _isSelection = true;
        searchInputValue(g_rangeValue);
        if (!ahref_wtext)
        {
            if (Setting("스트롱클릭시여러사전비교")&&(/^[A-Za-z]\d+$/.test(g_rangeValue))) 
            {
                setTimeout(() => location.href = 'd-=' + g_rangeValue, 50);
                loadImgStart(300);                
            }
            else if (Setting("영어단어클릭즉시찾기")&&(/^[A-Za-z\s]+$/.test(g_rangeValue))) 
            {
                if (Setting("영어단어즉시팝업사전")) 
                {
                    setTimeout(() => location.href = 'd-' + Setting("영어단어즉시팝업사전") + ' ' + g_rangeValue.toLowerCase(), 50);
                    loadImgStart(300);                    
                }
                else onC(true, g_rangeValue);
            }
            else if (Setting("한글단어클릭즉시찾기")&&(/^[ㄱ-힣\s]+$/.test(g_rangeValue))) onC(true,g_rangeValue);
            else toggle_bottom(0);
        }             
    }
    else {
        if (!_isSelection) toggle_bottom();
        g_rangeValue = "";
        _isSelection = false;
        g_selection.removeAllRanges();
    }
    return g_rangeValue;
}
function getWordAtPoint(e, _range = null) {    
    const x = e.clientX, y = e.clientY, ex = e.x, ey = e.y;
    if (funcmode > 0) return;
    setTimeout(() => g_isdragged = false, 500);
    if (a_prevent) return;
    let isSuccess = false;
    let range_prev = g_range ? g_range : null;    
    if ((g_selection = window.getSelection()) && g_selection.type != "Control") {
        let textNode, offset;
        g_range = document.caretRangeFromPoint(x, y);
        textNode = g_range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
            Alert(g_range.toString());
            g_range.expand('word');

            while (/\s$/.test(g_range.text) && g_range.toString().length > 0) { textRange.moveEnd("character", -1); }            
            if (!word_regexp.test(g_range.text) || g_range.toString().trim() === "") isSuccess = false; else isSuccess = true;            
        }        
        else isSuccess = false;
    } else isSuccess = false;

    if (!isSuccess) {
        if (!g_isdragged && !_isSelection) toggle_bottom();
        _isSelection = false;
        g_rangeValue = "";
        return false;
    }
    if (range_prev != null && g_range.compareBoundaryPoints(Range.END_TO_END, range_prev) == 0) {
        _isSelection = true;
        toggle_bottom(0);
        return true;
    }    
    g_rangeValue = g_range.toString().trim();
    if (g_rangeValue.length > 0) {
        clearTimeout(onc_timeOut);
        g_selection.removeAllRanges();
        g_selection.addRange(g_range);
        _isSelection = true;
        searchInput.value = g_rangeValue;
        toggle_bottom(0);
        return true;
    }
}
function searchInputValue(_str) {
    searchInput.value = _str;
}
//@@2 a처리와 하단 인풋바
function on_a(_element = null) {
    a_prevent = true;
    lastSelectedElement = _element;
    if (_element != null && _element.innerText !== "") {
        g_selection = window.getSelection();
        g_range = document.createRange();
        g_range.selectNodeContents(_element);
        g_selection.removeAllRanges();
        g_selection.addRange(g_range);

        // let _reghghref = /s([HG]\d+)[^\d]/;
        // if (_element.href && _element.href.match(_reghghref)) {
        //     let _match = _element.href.match(_reghghref);
        //     let _val = _match[0].replace(_reghghref, '\$1');
        //     if (_val == _element.innerText) searchInputValue(val);
        //     else searchInputValue(_val + "(" + _element.innerText + ")");
        // }
        // else 

        searchInputValue(_element.innerText);        
        onC(false);
        onc_timeOut = setTimeout(() => {
            toggle_bottom(0); a_prevent = false;
        }, 500);        
    }
    else {
        if (_isSelection && g_rangeValue.length > 0) {
            let range_prev = g_range ? g_range : null;
            onc_timeOut = setTimeout(() => {
                if (range_prev != null) {
                    g_selection = window.getSelection();
                    g_selection.removeAllRanges();
                    g_selection.addRange(range_prev);
                }
                a_prevent = false;
            }, 300);
        }
        else a_prevent = false;        
    }
}
function pvtClk() {
    a_prevent = true;
    onc_timeOut = setTimeout(() => a_prevent = false, 500);
}
function input_on_focus(_input) {
    if (!_loaded) return;
    inputResize();
    donthideSearchBar();
    if (wordDetectionReleaseTimeOut) clearTimeout(wordDetectionReleaseTimeOut);    
    ws_switch(true);
    a_prevent = true;
    _isSelection = false;
    _input.isfocused = "focus";
}
function input_on_blur(_input) {    
    if (!_loaded) return;
    hideSearchBarAfterFew();
    a_prevent = false;
    setTimeout(() => {
        setTimeout(() => { ws_switch(false); }, 300);
        _input.isfocused = "blur";
        el = document.getElementById('words_search_div');
        el.style.height = "auto";
    }, 200);
}
async function clickInputBtn() {
    await waitForModules('KC5-ScriptEx-ReferencesTrans');    
    clickDicBtn();    
}
//#endregion

async function ws_switch(checked) {
    const _thistitle = document.getElementById('thistitle');
    if (document.title.length > 0) _thistitle.value = getCurBook(); else _thistitle.style.display = 'none';
    const _el = document.getElementById('ws_div_2');
    const _hs = 0.0; const _he = 2.0;
    //_el.style.height=checked?'0':'2em';
    await_el.setAttribute('style', checked ? 'height:0em;display:inline' : 'height:2em;display:none');
    for (let h = checked ? _hs : _he; checked ? (h < _he) : (h > _hs); checked ? (h += 0.05) : (h -= 0.05)) {
        setTimeout(() => _el.style.height = h.toString() + 'em', checked ? (h * 100) : ((_he - h) * 100));
    }
}

function inputResize(scChange = false) {
    el = document.getElementById('words_search_div');
    if (screen.height == window.innerHeight && !Setting("키보드사용")) {
        if (screen.height > screen.width)
            el.style.height = "50%";
        else el.style.height = "70%";
    }
    searchInput.focus();
}

function getRestScroll() {
    return (((document.body.offsetHeight - (window.scrollY + window.innerHeight)) + window.screen.height) / window.screen.height);
}

async function scrollToView(delay = 1200) {
    let _sCnt = 0;        
    //if (delay === 0 || !g_skipConvert) return;
    while (true) {
        await timer(300);
        if (g_content.style.display != 'none' && window.screen.height > 100) break;
        _sCnt++; if (_sCnt > 33) return;
    }
    const _timeOut_ = setTimeout(async function _repeat() {
        if (g_content.style.display != 'none' && window.screen.height > 100 && getRestScroll() > 1.05) {
            await window.scrollTo({ top: window.scrollY - window.screen.height * 0.168, behavior: "smooth" });
            await setTimeout(() => {
                if (g_content.style.display == 'none' || window.screen.height < 100) _repeat();
                else { clearTimeout(_timeOut_); return; }
            }, 360)
        }
    }, delay);
}

function toggle_bottom(toggleIndex = -1, _display = "inline") {    
    // 0: 무조건 0번 표시 , 1: 무조건 1번 디폴트 표시 , -1: 0번이 표시<->숨김 스위칭, 0번 숨김일 때는 1번은 디폴트로 , -99 : 무조건 다 디폴트로    
    let isDisplay = false;
    if (toggleIndex === 0) {
        toggleElements[0].style.display = _display;
        toggleElements[1].style.display = 'none';
        isDisplay = true;
    }
    else if (toggleIndex === 1) {
        toggleElements[0].style.display = 'none';
        toggleElements[1].style.display = toggleElements[1].getAttribute('default-display');
    }
    else if (toggleIndex === -1) {
        if (toggleElements[0].style.display === 'none') {
            toggleElements[0].style.display = _display;
            toggleElements[1].style.display = 'none';
            isDisplay = true;
        }
        else {
            toggleElements[0].style.display = 'none';
            toggleElements[1].style.display = toggleElements[1].getAttribute('default-display');
        }
    }
    else if (toggleIndex === -2) {
        toggleElements[0].style.display = 'none';
        toggleElements[1].style.display = toggleElements[1].getAttribute('default-display');
        if (Setting("검색내용자동소거"))
        {
            searchInput.value = null;        
        }        
    }
    else if (toggleIndex < 0) //return to default display
    {
        toggleElements[0].style.display = toggleElements[0].getAttribute('default-display');
        toggleElements[1].style.display = toggleElements[1].getAttribute('default-display');
    }
    if (isDisplay) {
        hideSearchBarAfterFew();
    }
}
function hideSearchBarAfterFew() {
    donthideSearchBar();
    if (Setting("검색바숨김시간"))
    {
        g_timeOutInput = setTimeout(
            () => {
                toggle_bottom(-2);
                _isSelection = false;
                g_selection.removeAllRanges();            
            }, Setting("검색바숨김시간") * 1000
        );
    }
}
function donthideSearchBar() {
    if (g_timeOutInput)
    {
        clearTimeout(g_timeOutInput);
        g_timeOutInput = null;
    }
}
function bottomToggle(_btn) {
    if (_btn.ison === "on") {
        _btn.ison = "off";
        _btn.textContent = "▲";
        _btn.style.height = "1.5rem";
        toggleElements[1].style.height = "0.5rem";
    }
    else {
        _btn.ison = "on";
        _btn.textContent = "▼";
        _btn.style.height = "1rem";
        toggleElements[1].style.height = null;
    }
}
function onTest() {
    document.documentElement.innerText = document.documentElement.outerHTML.toString();
}

function ColorOfString(__str = "", _alpha = 0.26, _bright = 1) {
    let _str = __str.substr(0, 3);
    if (_bright == 1 && charColor.hasOwnProperty(_str)) return charColor[_str] + ',' + _alpha + ')';
    let cc1 = Math.floor((((_str.charCodeAt(0) ? _str.charCodeAt(0) : 128) * 6 + 255) % 255) * _bright);
    let cc2 = Math.floor((((_str.charCodeAt(1) ? _str.charCodeAt(1) : 128) * 6 + 255) % 255) * _bright);
    let cc3 = Math.floor((((_str.charCodeAt(2) ? _str.charCodeAt(2) : 128) * 6 + 255) % 255) * _bright);
    if (cc1 > 255) cc1 = 255; if (cc2 > 255) cc2 = 255; if (cc3 > 255) cc3 = 255;
    charColor[_str] = 'rgba(' + cc1.toString() + "," + cc2.toString() + "," + cc3.toString();
    return charColor[_str] + ',' + _alpha + ')';
}

function clickDicBtn() {
    let _v = searchInput.value;
    let _v0 = _v[0]; let _v10 = _v[_v.length - 1];
    if (_v0 === '#') { document.getElementById('floatDiv').style.display = 'flex'; return; }
    if (_v0 === '>') { eval(_v.substr(1)); return; }
    if (_v0 === '@') { location.href = _v.substr(1); return; }
    if (_v0 === '*' || _v10 === '*') { location.href = "d-* " + _v.replaceAll(/[\*]/gi, ''); return; }
    if (_v0 === '-' || _v10 === '-' || _v0 === '=' || _v10 === '=') { location.href = "d-= " + _v.replaceAll(/[\-]/gi, ''); return; }

    // if (_v0 === "!" || _v[_v.length - 1] === "!") {
    //     let _vv = _v.replaceAll('!', '').replaceAll(' ', '');
    //     let __testBible = testBible(_vv);
    //     if (__testBible && __testBible.length > 0) { BibleRefsIndex('force', __testBible); return; }
    //     else {
    //         __testBible = go_bible(_vv, false, true);
    //         if (__testBible && __testBible.length > 0) { BibleRefsIndex('force', __testBible); return; }
    //         else { Alert("Invalid key"); }
    //     }
    // }
        
    let _testBible = parseInt(_v)&&const_bx&&const_cx?testBible(const_bx+" "+const_cx+"."+_v, true, '') : testBible(_v);
    let _go_bible = _testBible?false:go_bible(_v, true);    
    if (_v.length == 0) go_bible();
    else if (_testBible && _testBible.length > 0) location.href = _testBible;
    else if (_v0 == '?' && !_v.includes(' ')) go_bible(_v);
    else if (!_go_bible) {
        regcv = /([0-9]{1,3})[.:장편\s﹕]{1,6}([0-9]{1,3})/g;
        if (/[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/g.test(_v[0])) _v = _v.substr(1);
        if (!isNaN(_v)) {
            let _maxv = g_content.getElementsByClassName('verse').length;
            let _intv = parseInt(_v);
            if (_intv < 1) _intv = 1;
            if (_intv == 1) window.scrollTo(0, 0);
            else if (_intv > 999) window.scrollTo(0, document.body.scrollHeight);
            else {
                if (_intv > _maxv) _intv = _maxv;
                location.href = "#v" + _intv; setv(parseInt(_intv)); scrollToView(100);
            }
        }        
        else if (_v.includes(' ') || _v0 === '.') {
            if (_v0 === '.') srcbb(_v.trim(), true); else srcbb(_v.trim());
        }
        else if (regcv.test(searchInput.value)) location.href = "b" + getCurBook("num") + "." + searchInput.value.replace(regcv, '\$1') + "." + searchInput.value.replace(regcv, '\$2');
        else onC();
    }
    onC(false);
}
//@@8 서치 및 서치버튼 등 처리
function onC(doSearch = true, _str_ = "") {
    a_prevent = true;    
    if (doSearch) 
    { 
        setTimeout(() => searchDic(_str_), 100);
        loadImgStart(300);        
    }
}

function searchDic(_str_ = "", _justStringReturn = false, d_how = "d-=") {
    if (_str_ === "" || _str_ == null) _str_ = searchInput.value;    
    let str = _str_.replace(/^[^A-Za-z0-9가-힣\s]+/, '').replace(/[^A-Za-z0-9가-힣\s]+$/, '');
    //if (typeof _사전대체어 !== 'undefined') { for (let key in _사전대체어) { str = str.replaceAll(key, _사전대체어[key]); } }
    let _str = "";

    if (str.match(regexLettersK) && str.match(regexLettersK)[0] == str) {
        //if (/[ㄱ-ㅣ]/.test(str[0])) str = str.substr(1);
        _str = str;
        if (!(uniqueNames.indexOf(_str.slice(0, 2) + ";") != -1 || uniqueNames.indexOf(_str.slice(0, 3) + ";") != -1 || uniqueNames.indexOf(_str.slice(0, 4) + ";") != -1 || uniqueNames.indexOf(_str.slice(0, 5) + ";") != -1 || uniqueNames.indexOf(_str.slice(0, 6) + ";") != -1 || uniqueNames.indexOf(_str.slice(0, 7) + ";") != -1 || uniqueNames.indexOf(_str.slice(0, 8) + ";") != -1)) {
            if (endChrs4.indexOf(_str.slice(_str.length - 4)) != -1) {
                _str = _str.slice(0, _str.length - 4);
            }
            else if (endChrs3.indexOf(_str.slice(_str.length - 3)) != -1) {
                _str = _str.slice(0, _str.length - 3);
            }
            else if (endChrs2.indexOf(_str.slice(_str.length - 2)) != -1) {
                _str = _str.slice(0, _str.length - 2);
            }
            else if (endChrs1.indexOf(_str.slice(_str.length - 1)) != -1) {
                _str = _str.slice(0, _str.length - 1);
            }
        }
        let searchStrs = str + "%09" + _str;
        if ((_str.length < 2 && oneChrs.indexOf(str.charAt(0)) != -1) || (_str.length <= 2 && oneChrSp.indexOf(str.charAt(0)) != -1)) {
            if (_justStringReturn) return str.charAt(0) + "%09_";
            else location.href = d_how + " " + str.charAt(0) + "%09_";
        }
        else {
            for (i = 1; i < _str.length; i++) {
                searchStrs += "%09" + _str.slice(0, -i);
            }
            if (_justStringReturn) return searchStrs + "%09_";
            else location.href = d_how + " " + searchStrs + "%09_";
        }
    }
    else {
        const strU = str[0].toUpperCase() + str.slice(1).toLowerCase();
        const strL = str.toLowerCase();
        let _strU; let _strL;
        let searchStrs = strU + "%09" + strL;
        const len = str.length;
        if (len === 1) {
            location.href = "d-* " + str;
        } else {
            for (i = 1; len > 2 && i < len - 1; i++) {
                _strU = strU.slice(0, -i); _strL = strL.slice(0, -i);
                searchStrs += "%09" + _strU + "%09" + _strL;
            }
            if (_justStringReturn) return searchStrs + "%09_";
            else location.href = d_how + " " + searchStrs + "%09_";
        }
    }
}

async function pagebcvswitch(forceSet=undefined) {    
    let _option = GetBCVConvertOptionElement();    
    if (!_option) return;
    
    if(forceSet!==undefined)
    {
        if (forceSet)
        {
            _option.textContent = '성구인식 취소';
            isBCVconverted = true;
            return;
        }
        else
        {
            _option.textContent = '성구인식 변환';
            isBCVconverted = false;
            return;
        }
    }

    let isSuccess = false;
    if (!isBCVconverted) {
        if (!contentBackrollStr) contentBackrollStr = await g_content.innerHTML.toString();               
        if (_loaded) {
            g_skipConvert = false;
            if (contentBCVconvertedStr) {
                g_content.innerHTML = contentBCVconvertedStr;
                isSuccess = true;
            }
            else {
                await waitForModules('KC5-ScriptEx-ReferencesTrans');
                isSuccess = await BibleRefsIndex();
            }
            if (isSuccess) 
            {                
                _option.textContent = '성구인식 취소';
                isBCVconverted = true; 
            }            
        }
    }
    else {
        if (_loaded) {
            if (contentBackrollStr)
            {
                isBCVconverted = false;            
                g_content.innerHTML = await contentBackrollStr;
                if (_loaded) Alert('성구 인식 전으로 복구했습니다');
                _option.textContent = '성구인식 변환';
            }            
            else
            {
                if (_loaded) Alert('exception');
            }
        }
    }

}

function TestB()
{
    let testStr = "y1.1.1";
    let testBible = 'isv';
    for (let i=0; i<rar.length; i++)
    {
        //for (let v=1; v<2; v++)
        for (let v=1; v<bcv_arr[i+1].length; v++)
        {
            testStr += "%09"+rar[i]+v+"/"+testBible;
        }        
    }
    Alert(testStr);
    location.href = testStr;
}

//@@9 end of script  