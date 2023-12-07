
/* 확장 처리용 */
function lzw_decode(s, base = 64) {
    let sym = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_!#%()*+,./:;=?@[]^{|}~ $`";
    sym += "\\1\\2\\3\\4\\5\\6\\7\b\t\v\f\\16\\17\\20\\21\\22\\23\\24\\25\\26\\27\\30\\31\\32\\33\\34\\35\\36\\37\xf7&'>\0\n\r\"<\\";
    let size = base * base * base;
    let symd = {};
    for (let i = 0; i < base; i++) {
        symd[sym.charAt(i)] = i;
    }
    let d = new Map();
    let num = 257;
    let logb = Math.log2(base);
    let logn = 8 / logb | 0;
    let i = 0;
    function unpack(pos = 0) {
        return symd[s[i++]] + (pos == logn ? 0 : base * unpack(pos + 1));
    }
    let word = String.fromCharCode(unpack());
    let prev = word;
    let o = [word];
    while (i < s.length) {
        logn = Math.log2(num++) / logb | 0;
        let key = unpack();
        word = key < 256 ? String.fromCharCode(key) : d.has(key) ? d.get(key) : word + word.charAt(0);
        o.push(word);
        if (num == size - 1) {
            d.clear();
            num = 256;
        }
        d.set(num - 2, prev + word.charAt(0));
        prev = word;
    }
    return decodeURIComponent(escape(o.join("")));
}

if (typeof window === 'undefined') {
    Object.assign(exports, { lzw_encode, lzw_decode });
}
let transPrevRange = null;
let prevRange = null;
let transRangeHead = null;

function _scrollUpdate() {
    clearCurrentSelectionBoxes();
    if (!g_transMode) return;
    let scheduledAnimationFrame = false;
    if (scheduledAnimationFrame) return;
    clearInterval(g_interval);
    clearTimeout(g_timeOut);
    g_interval = setInterval(() => {
        clearCurrentSelectionBoxes();
        drawSelectionBoxes();
        drawPreRangeBoxes();
        //if (getRestScroll()<1.5) scrollUpdate(false);
    }, 200);
    g_timeOut = setTimeout(() => clearInterval(g_interval), 600);
    scheduledAnimationFrame = true;
    requestAnimationFrame(() => scheduledAnimationFrame = false);
    scrollUpdate(false);
}
function scrollUpdate(isTrans = false, _error = false) {
    if (isNearScrollTop()) 
    {
        prevRange = null;
        transRangeHead = null; 
    }
    let _scrollDiff = window.scrollY;
    let _selection = window.getSelection();
    _selection.removeAllRanges();
    let _range = document.createRange();
    if (prevRange != null && isTrans) {
        _range = prevRange;
        _selection.addRange(_range);
    }
    else {
        if (transRangeHead) _range = transRangeHead;
        else _range.selectNodeContents(g_content.firstChild);
        _selection.addRange(_range);
        _range = _selection.getRangeAt(0);
        let rangeRect2 = _range.getBoundingClientRect();
        let rangeNewLine = true;
        while (_selection.rangeCount) {
            let rangeRect = rangeRect2;
            if ((_scrollDiff >= 0 && rangeRect.top >= window.innerHeight * 0.55) || (_scrollDiff < 0 && rangeRect.top <= window.innerHeight * 0.6)) {
                // if (!rangeNewLine) {
                //   if (_scrollDiff>=0) _selection.modify('move', 'backward', 'word');
                //   else _selection.modify('move', 'forward', 'word');
                //   _range = _selection.getRangeAt(0);
                // }
                break;
            }
            rangeNewLine = false;
            if (_scrollDiff >= 0) _selection.modify('move', 'forward', 'sentence');
            else _selection.modify('move', 'backward', 'sentence');
            _range = _selection.getRangeAt(0);
            rangeRect2 = _range.getBoundingClientRect();
            if ((_scrollDiff >= 0 && rangeRect2.top > rangeRect.top && rangeRect2.left < rangeRect.left) || (_scrollDiff < 0 && rangeRect2.top < rangeRect.top && rangeRect2.left > rangeRect.left))
                rangeNewLine = true;
        }
        if (!_selection.rangeCount) return;
        while (_selection.rangeCount) {
            let rangeRect = rangeRect2;
            if ((_scrollDiff >= 0 && rangeRect.top <= window.innerHeight * 0.5) || (_scrollDiff < 0 && rangeRect.top >= window.innerHeight * 0.55)) {
                if (!rangeNewLine) {
                    if (_scrollDiff >= 0) _selection.modify('move', 'forward', 'character');
                    else _selection.modify('move', 'backward', 'character');
                    _range = _selection.getRangeAt(0);
                }
                break;
            }
            rangeNewLine = false;
            if (_scrollDiff >= 0) _selection.modify('move', 'backward', 'character');
            else _selection.modify('move', 'forward', 'character');
            _range = _selection.getRangeAt(0);
            rangeRect2 = _range.getBoundingClientRect();
            if ((_scrollDiff >= 0 && rangeRect2.top > rangeRect.top && rangeRect2.left < rangeRect.left) || (_scrollDiff < 0 && rangeRect2.top < rangeRect.top && rangeRect2.left > rangeRect.left))
                rangeNewLine = true;
        }
        if (!_selection.rangeCount) return;
        if (_range != transRangeHead) {
            if (transRangeHead == null) transRangeHead = _range;
            _selection.modify('extend', 'forward', 'sentence');
            _range = _selection.getRangeAt(0);
            if (!_error) {
                let error = false;

                while (_selection.toString().length < +DEF_번역글자수제한) {
                    _prevRange = _range;
                    let rangeRect = _range.getBoundingClientRect();
                    _selection.modify('extend', 'forward', 'sentence');
                    _range = _selection.getRangeAt(0);
                    if (_selection.toString().length >= 5000) {
                        error = true;
                        g_transMode = false;
                        setTimeout(() => g_transMode = true, 500);
                        scrollUpdate(false, true);
                        return;
                        _range = _prevRange;
                        _range = _selection.getRangeAt(0);
                        break;
                    }
                    if (_prevRange == _range) {
                        break;
                    }
                }

                if (_selection.toString().length < 5000 && !error) {
                    while (_selection.toString().length > +DEF_번역글자수제한) {
                        _prevRange = _range;
                        _selection.modify('extend', 'backward', 'word');
                        _range = _selection.getRangeAt(0);
                        if (_prevRange == _range) break;
                    }
                }
                if (_selection.toString().includes('<<이전')) {
                    _selection.modify('extend', 'backward', 'sentence');
                    _range = _selection.getRangeAt(0);
                }
            } else Alert("Error detection!");
        }
        else {
            _range = prevRange;
            _range = _selection.getRangeAt(0);
        }
    }
    if (!_selection.rangeCount || _selection.toString().trim().length == 0) return;
    prevRange = _range;
    const _str = _selection.toString().replaceAll("%", "⁒").replaceAll("&", "＆").replaceAll("©", "(C)").replaceAll("®", "(R)").replaceAll("$", "＄");
    let __str = "";
    Alert(_str.length);
    if (_str.length < +DEF_번역창최소줄수 * +DEF_번역창줄당글자) {
        const needLine = ((+DEF_번역창최소줄수 * +DEF_번역창줄당글자) - _str.length) / (+DEF_번역창줄당글자);
        __str = "+%0A".repeat(parseInt(needLine)) + _str
    }
    else __str = _str;
    const _ret = "https://www.bing.com/translator/?ref=TThis&text=" + __str;

    if (isTrans) {
        const _transUpdateBtns = document.getElementsByName('trans_update');
        for (let i = 0; i < _transUpdateBtns.length; i++)
            _transUpdateBtns[i].disabled = true;
        toggle_bottom(0, 'none');
        clearCurrentSelectionBoxes();
        drawSelectionBoxes();
        transPrevRange = _range;
        drawPreRangeBoxes();
        _selection.removeAllRanges();
        openFrame_trans(_ret, !didOpenFrame_trans());
        setTimeout(() => {
            for (let i = 0; i < _transUpdateBtns.length; i++)
                _transUpdateBtns[i].disabled = false;
        }
            , 3500);
    }
    if (_str != g_lastTransWords) g_lastTransWords = _str;
}
function drawSelectionBoxes() {
    //let _selection = window.getSelection();
    //if (!_selection.rangeCount) return;
    let rect = prevRange.getBoundingClientRect();//_selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width && rect.height) {
        let outline = document.createElement("div");
        //outline.setAttribute('onclick', 'clearCurrentSelectionBoxes();');
        outline.classList.add("bounding-rect");
        outline.style.top = (rect.top - 4 + "px");
        outline.style.left = (rect.left - 4 + "px");
        outline.style.width = (rect.width + 4 + "px");
        outline.style.height = (rect.height + 4 + "px");
        outline.style.zIndex = 3;
        document.body.appendChild(outline);
    }
}
function drawPreRangeBoxes() {
    if (transPrevRange != null) {
        let rects = transPrevRange.getClientRects();
        for (let i = 0; i < rects.length; i++) {
            let rect = rects[i];
            // Check to make sure the selection dimensions aren't zero.
            if (rect.width && rect.height) {
                let outline = document.createElement("div");
                //outline.setAttribute('onclick', 'clearCurrentSelectionBoxes();');
                outline.classList.add("segment-rect");
                outline.style.top = (rect.top + "px");
                outline.style.left = (rect.left + "px");
                outline.style.width = (rect.width + "px");
                outline.style.height = (rect.height + "px");
                outline.style.zIndex = 2;
                document.body.appendChild(outline);
            }
        }
    }
}
function handleSelectionChange() {
    clearTimeout(selectionChangeTimer);
    selectionChangeTimer = setTimeout(drawSelectionBoxes, 500);
}
function redrawSelectionBoxes(event) {
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(drawSelectionBoxes, 300);
}
function clearCurrentSelectionBoxes(_qs = "div.bounding-rect, div.segment-rect") {
    let nodes = document.querySelectorAll(_qs);
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].parentNode.removeChild(nodes[i]);
    }
}
function isNearScrollTop() {
    const emHeight = parseFloat(getComputedStyle(document.body).fontSize);
    const scrollThreshold = 1.5 * emHeight; // 1.5em 이내로 설정
    return (window.scrollY < scrollThreshold || g_content.scrollTop < scrollThreshold);
}
function isNearScrollBottom() {
    const emSize = parseFloat(getComputedStyle(document.body).fontSize);
    // 스크롤이 1em 이내로 남았는지 확인
    const scrollThresholdEm = 1;
    const scrollThresholdPx = scrollThresholdEm * emSize;
    const scrolledHeight = window.scrollY + window.innerHeight;
    const totalHeight = document.documentElement.scrollHeight;
    return totalHeight - scrolledHeight < scrollThresholdPx;
}

function onChangeURI_Option(_select) {
    const _option = _select.options[_select.selectedIndex].value;
    optUrl = _select.options[_select.selectedIndex].getAttribute('optUrl');
    const openType = _select.options[_select.selectedIndex].getAttribute('openType');
    donthideSearchBar();
    if (openType === "copyall;out;noquery") {
        _select.options[_select.selectedIndex].selected = false;
        _select.options[0].selected = true;
        CopyAllDoc();
        setTimeout(() => location.href = optUrl, 500);
        return;
    }
    else if (openType === "trans") {
        //@@@
        if (searchInput.value.length>15)
        {
            location.href = "r" + searchInput.value;
        }

		_select.options[_select.selectedIndex].selected = false;
        _select.options[0].selected = true;
        if (isParallel) { Alert('병행보기에선 할 수 없습니다'); return; }        
        document.addEventListener('scroll', _scrollUpdate);
        g_content.setAttribute('preMarginTop', g_content.style.marginTop);
        g_content.setAttribute('preMarginBottom', g_content.style.marginBottom);
        DEF_번역글자수제한 = Math.sqrt((window.innerWidth * 0.618) * (window.innerHeight * 1.618)) * 0.95;//1.1;
        if (DEF_번역글자수제한 > 960) DEF_번역글자수제한 = 960;
        DEF_번역창최소줄수 = (window.innerHeight / 80) + 2;
        DEF_번역창줄당글자 = window.innerWidth / 11;
        let transHeight = 109 - (((window.innerWidth * window.innerHeight) * 0.01 - 40) / 620);
        const transTop = 38 - transHeight;
        const transFootBottom = 100 - (transHeight + transTop);
        let transExtTop = (100 - transHeight) - 15;
        const transExtFootBottom = 100 - (transHeight + transExtTop);
        if (transExtTop > 0) transExtTop = 0;
        let transHalfTop = (100 - transHeight) - 49;
        const transHalfFootBottom = 100 - (transHeight + transHalfTop);
        if (transHalfTop > 0) transHalfTop = 0;        
        let _iframe_parent2 = document.getElementById('iframe_parent2');
        _iframe_parent2.setAttribute('transHeight', transHeight);
        _iframe_parent2.setAttribute('transTop', transTop);        
        _iframe_parent2.setAttribute('transFootBottom', transFootBottom);
        _iframe_parent2.setAttribute('transHalfTop', transHalfTop);
        _iframe_parent2.setAttribute('transHalfFootBottom', transHalfFootBottom);
        _iframe_parent2.setAttribute('transExtTop', transExtTop);
        _iframe_parent2.setAttribute('transExtFootBottom', transExtFootBottom);
        let _iframe2 = document.getElementById('_iframe2');
        let _bottom = document.getElementById('_iframeBottom2');
        //setTimeout(()=>Alert(transHeight+" / "+ transTop + " / " +transFootBottom), 500);
        if (transHeight > 100) transHeight = 100;
        _iframe2.style.height = transHeight.toString() + '%';
        _iframe2.style.top = transTop.toString() + '%';
        _bottom.style.bottom = transFootBottom.toString() + '%';
        g_transMode = true;        
        g_lastTransWords = "";
        transPrevRange = null;
        prevRange = null;
        transRangeHead = null;                
        // 선택된 부분이 있을때 선택된 부분만 번역(하려고 했으나 창 피트가 안 맞)
        // if (_isSelection && g_rangeValue.length>0)
        // {
        //     let transWord = g_rangeValue.substr(0,DEF_번역글자수제한);
        //     openFrame_trans("https://www.bing.com/translator/?ref=TThis&text=" + transWord, true);
        //     scrollUpdate(false);
        // }
        // else 
        {
            openFrame_trans(optUrl, true);
            scrollUpdate(true);
        }
		return;
    }
    else if (openType === "in") {
        let value = "";
        if (typeof g_rangeValue !== 'undefined' && g_rangeValue.length > 0 && _isSelection) { value = g_rangeValue; }
        else value = searchInput.value;
        if (_option === "5") { if ((/^h[0-9]+$/i).test(value)) value = value.replace(/h([0-9]+)/i, '\$1'); }
        else if (_option === "6") { if ((/^g[0-9]+$/i).test(value)) value = value.replace(/g([0-9]+)/i, '\$1'); }
		if (_option === "3") optUrl += "성경에서+"+value;//+"&form=QBLH&sp=-1&lq=0&pq=성경에서+"+value+"&sc=10-4&qs=n";
			else optUrl += value;		
        if (value.trim().length > 0) searchInput.value = value;        
        openFrame(optUrl);
        return;
    }
    else if (openType === "esv") {
        let value = "";
        if (typeof g_rangeValue !== 'undefined' && g_rangeValue.length > 0 && _isSelection) { value = g_rangeValue; }
        //else value=testInput.value;
        const optUrl2 = _select.options[_select.selectedIndex].getAttribute('optUrl2');
        _select.options[_select.selectedIndex].selected = false;
        _select.options[0].selected = true;
        if (value.trim().length > 0) { searchInput.value = value; location.href = optUrl + value; }
        else location.href = optUrl2 + getCurBook('eng');
    }
    else if (openType === "copydiv") {
        copydiv();
        return;
    }
    else if (openType === "bcvautolink") {
        pagebcvswitch();
        _select.options[_select.selectedIndex].selected = false;
        _select.options[0].selected = true;
    }
    else if (openType==="docview")
    {
        document.documentElement.innerText = g_content.outerHTML.toString();
    }
}

function copydiv() {
    const _divs = document.getElementsByTagName('div');
    for (let i = 0; i < _divs.length; i++) {
        if (_divs[i].textContent.length > 0 && (_divs[i].className !== 'ui' && _divs[i].id !== 'content') || (_divs[i].id == 'content' && g_content.getElementsByClassName('sverse') == null)) {
            const _checkbox = document.createElement('input');
            _checkbox.setAttribute('type', 'checkbox');
            //_checkbox.style.cssText +='left:1em;float:left;';
            _checkbox.className = 'divCk';
            _divs[i].prepend(_checkbox);
        }
    }
    document.getElementById('floatDiv').style.display = 'flex';
    funcmode = 1;
    toggle_bottom(0, 'none');
    _select.options[_select.selectedIndex].selected = false;
    _select.options[0].selected = true;
}
function checkfordiv(_type) {
    const _checks = document.getElementsByClassName('divCk');
    const len = _checks.length;
    if (_type == 'all_check') {
        for (let i = 0; i < len; i++) {
            _checks[i].checked = true;
        }
    }
    if (_type == 'all_release') {
        for (let i = 0; i < len; i++) {
            _checks[i].checked = false;
        }
    }
    if (_type == 'exit') {
        while (document.getElementsByClassName('divCk').length > 0) {
            document.getElementsByClassName('divCk')[0].remove();
        }
        document.getElementById('floatDiv').style.display = 'none';
        funcmode = 0;
    }
}
function copydivs(_type, option = false) {
    const _checks = document.getElementsByClassName('divCk');
    const len = _checks.length;
    let _str = "";
    if (_type == 'text') {
        let _verses = "";
        const _title = getCurBook();
        let _v_prev = 0; let _v_con = "0";
        for (let i = 0; i < len; i++) {
            if (_checks[i].checked) {
                const _v = _checks[i].parentElement.getAttribute('verse');
                if (_v.length > 0) {
                    if (_v_prev === 0) _verses = _v;
                    else if (_v_prev == parseInt(_v)) { }
                    else if (_v_prev == parseInt(_v) - 1 && _v != "1") _v_con = _v;
                    else if (parseInt(_v_con) > 0) { _verses += "-" + _v_con + "," + _v; _v_con = ""; }
                    else _verses += "," + _v;
                    _v_prev = parseInt(_v);
                }
                let _abbr = null;
                if (option) _abbr = _checks[i].parentElement.getAttribute('biblename');
                _abbr = _abbr = null ? "(" + _abbr + ") " : "";
                _str += _abbr + _checks[i].parentElement.textContent + '\n';
            }
        }
        if (_v_con.length > 0) _verses += "-" + _v_con;
        if (_verses.length > 0) _str += "[" + _title + ":" + _verses + " ]";
        else _str += "[" + _title + "]";
        CopyAllDoc(_str, 'Copied from Text');
    }
    if (_type == 'html') {
        _str = document.title.len > 0 ? document.getElementsByTagName('title')[0].outerHTML : "";
        for (let i = 0; i < len; i++) {
            if (_checks[i].checked) {
                let clone = _checks[i].parentElement.cloneNode(true);
                clone.getElementsByClassName('divCk')[0].remove();
                clone.style.margin = "0.25em";
                _str += clone.outerHTML;
                clone.remove();
            }
        }
        CopyAllDoc(_str, 'Copied from HTML');
    }
    if (_type == 'doc_html') {
        document.documentElement.innerText = document.documentElement.outerHTML.toString();
    }
    if (_type == 'doc_content') {        
        document.documentElement.innerText = g_content.outerHTML.toString();
    }
    if (_type == 'content') {
        _str = g_content.outerHTML;
        CopyAllDoc(_str, 'Copied from content');
    }
    if (_type == 'body') {
        _str = document.body.outerHTML;
        CopyAllDoc(_str, 'Copied from document body');
    }
}
function frameOnload(_iframe) {
    return;
}

function didOpenFrame_trans() {
    let _ifp2 = document.getElementById('iframe_parent2');
    if (_ifp2.style.display == 'block') { return true; }
    else return false;
}
function openFrame_trans(_url, _frameOpen = true) {
    let _iframe = document.getElementById('_iframe2');
    _iframe.src = _url;
    if (_frameOpen) {
        frameHide();
        g_content.style.marginTop = window.innerHeight * 0.63;
        g_content.style.marginBottom = window.innerHeight * 0.33;
        let _ifp2 = document.getElementById('iframe_parent2');
        _ifp2.style.display = 'block';
    }
}

function frameHide_trans() {
    pvtClk();
    clearCurrentSelectionBoxes();
    window.getSelection().removeAllRanges();
    _isSelection = false;
    g_rangeValue = "";
    g_transMode = false;
    g_content.style.marginTop = g_content.getAttribute('preMarginTop');
    g_content.style.marginBottom = g_content.getAttribute('preMarginBottom');
    g_content.style.paddingTop = '0em';
    let selectSite = document.getElementById('search_site');
    selectSite.selectedIndex = 0;
    //clearInterval(iframeUrlInterval);
    let _iframeDiv = document.getElementById('iframe_div');
    let _iframe = document.getElementById('_iframe2');
    _iframe.src = "";
    _iframeDiv.style.display = "none";
    document.getElementById('iframe_parent2').style.display = 'none';
    document.removeEventListener('scroll', _scrollUpdate);
    location.reload(true);
}
function frameTransFit() {
    let _iframe_parent2 = document.getElementById('iframe_parent2');
    let _iframe2 = document.getElementById('_iframe2');
    let _bottom = document.getElementById('_iframeBottom2');    
    _iframe2.style.top = _iframe_parent2.getAttribute('transTop') + '%';
    _bottom.style.bottom = _iframe_parent2.getAttribute('transFootBottom') + '%';
    g_content.style.paddingTop = '0em';    
    clearCurrentSelectionBoxes();
    drawSelectionBoxes();
    drawPreRangeBoxes();
}
function frameTransExtendFit() {
    let _iframe_parent2 = document.getElementById('iframe_parent2');
    let _iframe2 = document.getElementById('_iframe2');
    let _bottom = document.getElementById('_iframeBottom2');    
    _iframe2.style.top = _iframe_parent2.getAttribute('transExtTop') + '%';
    _bottom.style.bottom = _iframe_parent2.getAttribute('transExtFootBottom') + '%';
}
function frameTransHalfFit() {
    let _iframe_parent2 = document.getElementById('iframe_parent2');
    let _iframe2 = document.getElementById('_iframe2');
    let _bottom = document.getElementById('_iframeBottom2');    
    _iframe2.style.top = _iframe_parent2.getAttribute('transHalfTop') + '%';
    _bottom.style.bottom = _iframe_parent2.getAttribute('transHalfFootBottom') + '%';
    g_content.style.paddingTop = '5em';
    clearCurrentSelectionBoxes();
    drawSelectionBoxes();
    drawPreRangeBoxes();
}
function openFrame(_url = optUrl) {
    frameHide_trans();
    let _iframeDiv = document.getElementById('iframe_div');
    _iframeDiv.style.zIndex = 99;
    let _iframe = document.getElementById('_iframe1');
    _iframe.src = _url;
    _iframeDiv.style.display = 'flex';
    document.getElementById('iframe_parent1').style.display = 'inline-block';
    //location.reload();
}
function frameFullscreen() {
    let _iframe = document.getElementById('_iframe1');
    let _btn = document.getElementById('iframeFullscreen');
    let w = _iframe.style.width;
    let h = _iframe.style.height;
    let pw, ph;
    if (w != '100vw' && h != '100vh') {
        _iframe.setAttribute('pwidth', w);
        _iframe.setAttribute('pheight', h);
        _iframe.style.width = '100vw';
        _iframe.style.height = '100%';
        _btn.textContent = "[ - ]";
    }
    else {
        pw = _iframe.getAttribute('pwidth', w);
        ph = _iframe.getAttribute('pheight', h);
        _iframe.style.width = pw;
        _iframe.style.height = ph;
        _btn.textContent = "[ + ]";
    }
}
function frameHide() {
    pvtClk();    
    let selectSite = document.getElementById('search_site');
    selectSite.selectedIndex = 0;
    hideSearchBarAfterFew();
    let _iframeDiv = document.getElementById('iframe_div');
    let _iframe = document.getElementById('_iframe1');
    _iframe.src = "";
    _iframeDiv.style.display = "none";
    document.getElementById('iframe_parent1').style.display = 'none';
    location.reload(true);
}

function CopyAllDoc(copyStr = "", _message = "") {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.style.border = 'none';
    textarea.style.height = '0.1em';
    //textarea.style.fontSize = '0.1em';
    if (copyStr !== "") {
        textarea.value = copyStr;
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        if (_message != "") Alert(_message);
    }
    else {
        funcmode = 2;
        if (g_selection != null) g_selection.removeAllRanges();
        toggle_bottom(0, "none");
        textarea.value = document.body.outerHTML;
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        Alert("All Document Copied");
        funcmode = 0;
    }
}

function allselect() {
    funcmode = 3;
    loadImgStart();
    setTimeout(() => {
        g_selection = window.getSelection();
        g_range = document.createRange();
        g_range.selectNodeContents(g_content);
        g_rangeValue = g_range.toString();
        CopyAllDoc(g_rangeValue);
        g_selection.removeAllRanges();
        g_selection.addRange(g_range);
        _isSelection = true;
        funcmode = 0;
    }, 500);
    setTimeout(() => { loadImgStop(); Alert('All Text copied to clipboard(' + g_rangeValue.length + ')') }, 800);
}

async function srcbb(_str_, inThisBook = false) {	
    loadImgStart();
    let ret = await waitForModules("KC5-BibleTexts");
    if (!ret && !bibles)
    {
        loadImgStop();
        Alert('검색할 성경데이터 파일이 없습니다');        
        return false;
    }
    
    Alert("Searching Now.. in " + Object.keys(bibles).length + " bibles");
    let strch1 = getCurBook("num") + '\\t\\d+\\t\\d+[^\\r\\n\\$]+' + _str_;
    let strch2 = '\\d+\\t\\d+\\t\\d+[^\\r\\n\\$]+' + _str_;
    let _m = new Array();

    for (let bible_name of Object.keys(bibles)) {
        // 스트롱코드 등 특수서치는 잠시 제외
        // const ctlReg = /\(.+?\)/g; const strReg = /[HG]\d.+?/gi; const ctlMat = _str_.match(ctlReg); let ctlStr = "";
        // if (ctlMat && ctlMat.length > 0) ctlStr = ctlMat[0];
        // let _str = _str_.replaceAll(/\s+/g, ' ').toLowerCase();//.replaceAll(ctlReg,'').replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" );
        // if (strReg.test(_str)) {
        //     //_str = _str.replaceAll(/[^HG0-9]/gi, '');//원래코드
        //     _str = _str.replaceAll(ctlReg, '').replaceAll(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&").replaceAll(/[^HG0-9]/gi, '');
        // }

        const _regex = inThisBook ? new RegExp(strch1, 'gi') : new RegExp(strch2, 'gi');
        const _matches = bibles[bible_name].match(_regex);        

        if (_matches && _matches.length > 0) {
            let _len = _matches.length;
            Alert("Found " + bible_name + ":" +_len + " verses");
            let maxLen = Setting("성경검색최대개수");
            if (!maxLen || maxLen<=0 || maxLen>5600) maxLen = 1500;
            if (_len > maxLen) _len = maxLen;
            for (let i = 0; i < _len; i++) {
                let _m2 = _matches[i].split('\t');
                if (_m2[0]>=66) continue;                
                let _book = rar_e_s[_m2[0]-1];
                let _chapter = _m2[1];
                let _verse = _m2[2];
                //let _text = _m2[3];
                _m.push(_book + "." + _chapter + "." + _verse + "/" + bible_name);
            }
        }
    }
    loadImgStop();
    if (_m.length > 0) {        
        Alert("Found " + _m.length + " verses");
        await timer(250);
        location.href = "y " + _m.join('%09');
    }
    else {
        Alert("FIND NOTHING" + _str);
        return false;
    }
}