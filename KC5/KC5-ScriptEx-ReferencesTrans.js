//#region 성구(성경장절)인식 및 변환
const bcvRegex1 = /([0-9\s]{0,3}[a-z가-힣\.\s]+)([0-9]{1,3})(?:[\.a-z장편\s:﹕ː]{1,6}([0-9]{1,3}))?/gi; //단일서치
  const bcvRegex2 = /([0-9\s]{0,3}[a-z가-힣\.\s]+)([0-9]{1,3})[\.a-z장편\s:﹕ː]{1,6}([0-9]{1,3})[\-a-z절\s~‒\-﹣–—―~∼〜]{1,6}([0-9]{1,3})/gi; //단일범위1
  const bcvRegex3 = /([0-9\s]{0,3}[a-z가-힣\.\s]+)([0-9]{1,3})[\.a-z장편\s:﹕ː]{1,6}([0-9]{1,3})[\-a-z절\s~‒\-﹣–—―~∼〜]{1,6}([0-9]{1,3})[\.·a-z장편\s﹒:﹕ː]{1,6}([0-9]{1,3})/gi; //단일범위2  
  const bcvRegex3b = /([0-9\s]{0,3}[a-z가-힣\.\s]+)([0-9]{1,3})[\.a-z장편\s:﹕ː]{1,6}([0-9]{1,3})[\-a-z절\s~‒\-﹣–—―~∼〜]{1,6}([0-9\s]{0,3}[a-z가-힣\s]+)([0-9]{1,3})[\.·a-z장편\s﹒:﹕ː]{1,6}([0-9]{1,3})/gi; //단일범위2
  const bcvRegex4 = /([123\s+]){0,1}[^0-9]+[0-9]{1,3}/gi; //범위 및 복합
  
function testBible(_str_="", ishref=true, _tailoption="&w=1") {        
    let _str = _str_.replaceAll(/chapter|ch\.|chap\.|([A-Z가-힣]+)[\.]/gi,'$1')
             .replaceAll(/[lIi](\d+)|(\d+)[lIi]|([^0-9]+\d+);(\d+,)/g,'$1$2$3:$4')
             .replaceAll(' ','')
             .toLowerCase();             
    for (let l=21; l>0; l--)
    {
      for (let y=bNameStrs.length-1; y>0; y--)
      {
        for (let x=0; x<bNameStrs[y].length; x++)
        {
          if (bNameStrs[y][x].length==l) _str=_str.replaceAll(bNameStrs[y][x].toLowerCase(), "~¦"+ y.toString() +"¦~" );
        } 
      }
    }            
    rar.forEach((r, i) => { _str = _str.replaceAll("~¦" + (i + 1).toString() + "¦~", "~¦" + r +"¦~" ); });
    _str = _str.replaceAll(/[^0-9]{0,}~¦(.+?)¦~[^0-9]{0,}/g, '\$1');
    
    if (!ishref) return _str;    
    const match1 = _str.match(bcvRegex1); // 성경색인 여부 확인
    const match2 = _str.match(bcvRegex2); // 범위 cc:vv-vv
    const match3 = _str.match(bcvRegex3); // 범위 cc:vv-cc:vv
    let match4 = _str.match(bcvRegex4); // 모든 종류에 대응하는 복합 매치
    let _xb=NaN;
    let _xc=NaN;
    let _xv=NaN;
    let _prexb=NaN;
    let _prexc=NaN;
    let _markxb=NaN;
    let check=false;
    let _ret="";
    let _forceBreakHG = false;
    
    function xrbcv(_bb, _cc, _vv=-1)
    { 
      let _bbb=_bb, _ccc=_cc, _vvv=_vv;
      if (parseInt(_bbb)==NaN)
      {   
        const _matb = _bbb.match(/[가-힣]+/g);   
        for (let i=0;i<rar.length;i++)
        { 
          if (_matb&&_matb[_matb.length-1]===rar[i]) _bbb=i+1;
        }            
      }
      if (+_ccc>bcv_arr[_bbb].length-1) _ccc=bcv_arr[_bbb].length-1;    
      if (_vvv<0||_vvv==null||parseInt(_vvv)==NaN) return _bbb+"."+_ccc;
      if (+_vvv>bcv_arr[_bbb][_ccc]) _vvv=bcv_arr[_bbb][_ccc];    
      return _bbb+"."+_ccc+"."+_vvv;
    }
    this.getbcv = function(_bcv)
    {
      _xb = _bcv.replaceAll(bcvRegex1, '\$1').replaceAll(' ','');
      if (_xb.toUpperCase()=="H"||_xb.toUpperCase()=="G") _forceBreakHG=true;
      _xc = _bcv.replaceAll(bcvRegex1, '\$2').replaceAll(/[^0-9]/g,'');
      let __xv = _bcv.replaceAll(bcvRegex1, '\$3').replaceAll(/[^0-9]/g,'');
      _xv = parseInt(__xv)?__xv:1;
    }
    this.getbno = function(_pname, _check_xc=false)
    {
      let _check=false;
      const _matb = _pname.match(/[가-힣]+/g);
      for (let i=0;i<rar.length;i++)
      {     
        if (_matb&&_matb[_matb.length-1]===rar[i]) { _prexb = _xb; _xb=(i+1).toString(); _check=true; break;}
      }
      if (_check_xc && _check) 
      {
        const _matc = _pname.match(/\d+/g);
        if (_matc) { _prexc=_xc; _xc = _matc[_matc.length-1]; if (+_xc>bcv_arr[+_xb].length-1) _xc=bcv_arr[+_xb].length-1; }
        //else { _prexc=_xc; _xc = "0"; }
      }
      return _check;
    }    
    if (match1&&_str.substr(0,match1[0].length)===match1[0]) // 검색 대상인지 확인
    {      
      getbcv(match1[0]); //최초 b c v 를 만든다
      if (_forceBreakHG) return false;
      check = getbno(_xb);
      if (check||parseInt(_xb)!=NaN) { //이름 없으면 리턴
        _ret = xrbcv(_xb, _xc, _xv);
        if (match4&&match4.length>3) //복합인지 
        {          
           //여기부터는 복합
           _str = _str.replaceAll(/[편장:﹕ː\.]/g,':').replaceAll(/[과와﹐，;﹔­]/g,',').replaceAll(/[﹒·~‒\-﹣–—―~∼〜〜]/g, '-');
           match4 = _str.match(bcvRegex4); //_str이 바뀌었으므로 다시 한번           

           let _xChain = new Array();
           let _xCon = new Array();
           let _ccnt = 0;
           check = getbno(match4[0], true);           
           for (let i=0;i<match4.length;i+=1)
           {
             let _m0=match4[i];
             const _m_prev1=(i>0)?match4[i-1]:"";
             const _m1=(i+1<match4.length)?match4[i+1]:"";
             const _m2=(i+2<match4.length)?match4[i+2]:"";
             const _m3=(i+3<match4.length)?match4[i+3]:"";
             const _m4=(i+4<match4.length)?match4[i+4]:"";
             //const _m5=(i+5<match4.length)?match4[i+5]:"";
             let _tv = _m0.replaceAll(/[^0-9]/g, '');
             
             if (bcvRegex3b.test(_m0+_m1+_m2+_m3))
             {              
               const _bcvs = _m0+_m1+_m2+_m3;
               getbcv(_m0+_m1);
               check = getbno(_xb, true); 
               if (check)
               {
                 _xChain[_ccnt] = xrbcv(_xb, _xc, _xv) + "-" + _xb+ "." + _bcvs.replaceAll(bcvRegex3b, '\$5').replaceAll(/[^0-9]/g,'') + "." + _bcvs.replaceAll(bcvRegex3b, '\$6').replaceAll(/[^0-9]/g,'');
                 _xCon[_ccnt] = "range";
                 _ccnt++; i+=3; continue; 
               }
             }
             else if (bcvRegex3.test(_m0+_m1+_m2+_m3))
             {              
               const _bcvs = _m0+_m1+_m2+_m3;
               getbcv(_m0+_m1);
               check = getbno(_xb, true); 
               if (check)
               {
                 _xChain[_ccnt] = xrbcv(_xb, _xc, _xv) + "-" + _xb+ "." + _bcvs.replaceAll(bcvRegex3, '\$4').replaceAll(/[^0-9]/g,'') + "." + _bcvs.replaceAll(bcvRegex3, '\$5').replaceAll(/[^0-9]/g,'');
                 _xCon[_ccnt] = "range";
                 _ccnt++; i+=3; continue; 
               }
             }
             else if (bcvRegex2.test(_m0+_m1+_m2))
             { 
               const _bcvs = _m0+_m1+_m2;
               getbcv(_m0+_m1);
               check = getbno(_xb, true); 
               if (check)
               {
                 _xChain[_ccnt] = xrbcv(_xb, _xc, _xv) + "-" + xrbcv(_xb, _xc) + "." + _bcvs.replaceAll(bcvRegex2, '\$4').replaceAll(/[^0-9]/g,'');
                 _xCon[_ccnt] = "range";
                 _ccnt++; i+=2; continue; 
               }
             }
             else if (bcvRegex1.test(_m0+_m1))
             {
               getbcv(_m0+_m1);
               check = getbno(_xb, true); 
               if (check)
               {
                 _xChain[_ccnt] = xrbcv(_xb, _xc, _xv);
                 _xCon[_ccnt] = "single";
                 _ccnt++; i+=1; continue; 
               }
             }
             else
             {
               if ((_m0.includes(':')||_m0.includes('.'))&&_ccnt>0) {
                 _prexc = _m_prev1.replaceAll(/[^0-9]/g, '');
                 if (_xCon[_ccnt-1]==="chapter"||_xCon[_ccnt-1]==="s_con") {
                  check = getbno(_xb, true);
                   _xChain[_ccnt-1]= xrbcv(_xb, _prexc, _tv); _xCon[_ccnt-1]="single";
                 }
                 if (_xCon[_ccnt-1]==="r_con") {_xChain[_ccnt-1]+="."+_tv; _xCon[_ccnt-1]="con_range";}
               }
               else if ((_m0.includes('-'))&&_ccnt>0) {
                 _xChain[_ccnt]="-"+_tv; _xCon[_ccnt]="r_con"; _ccnt++;
               }
               else if (_m0.includes(',')&&_ccnt>0) {
                 _xChain[_ccnt]=","+_tv; _xCon[_ccnt]="s_con"; _ccnt++;
               }
               else if (check) {
                 _xChain[_ccnt] = xrbcv(_xb, _xc);
                 _xCon[_ccnt] = "chapter"; _ccnt++;
               }
             }
             if (i>0) check=false;
             
             check = getbno(_m0, true);
             const _xb_prev = _xb; const _xc_prev = _xc;
             if (check) _tv = ""; //else _tv="."+_tv;
             check = getbno(_m1, true);
             if ( ( ( bcvRegex3.test(_m1+_m2+_m3+_m4)
             || bcvRegex2.test(_m1+_m2+_m3)
             || bcvRegex1.test(_m1+_m2) ) && check )
             || i==match4.length-1 || _m1.includes(',') || _m1.includes('-') ) 
             {
               if (_xCon[_ccnt-1]==="r_con") 
               {
                 _xCon[_ccnt-1] = "con_range";
               }
               if (_xCon[_ccnt-1]==="s_con") 
               {
                 _xChain[_ccnt-1] = xrbcv(_xb_prev, _xc_prev, _tv);
                 _xCon[_ccnt-1] = "single";
               }
             }
           }
           if (_xChain.length>0) _ret="y "+_xChain[0];
           if (_xChain.length>1) {
             for (let i=1; i<_xChain.length; i++)
             {
               if (_xCon[i]=="single"||_xCon[i]=="range") _ret+="%09"+_xChain[i];
               else if (_xCon[i]=="con_range"||_xCon[i]=="r_con") _ret+=_xChain[i];
             }
           }
        }
        else if (match3&&match3.length==1) //단일 범위인지
        { 
          const _tc2 = _str.replaceAll(bcvRegex3, '\$4').replaceAll(/[^0-9]/g,'');
          const _tv2 = _str.replaceAll(bcvRegex3, '\$5').replaceAll(/[^0-9]/g,'');
          _ret = "b"+_ret+"-"+xrbcv(_xb, _tc2, _tv2);
        }
        else if (match2&&match2.length==1) //단일 범위인지
        { 
          const _tv2 = _str.replaceAll(bcvRegex2, '\$4').replaceAll(/[^0-9]/g,'');
          _ret = "b"+_ret+"-"+xrbcv(_xb, _xc, _tv2);
        }
        else
        { 
          let _mat_ii = _str.match(bcvRegex1);          
          if (_mat_ii&&_mat_ii.length>1) //단일성구가 2 이상
          {  
            let mat_len = _mat_ii.length;
            _ret = "y ";
            for (let ii=0;ii<mat_len;ii++)
            {
              getbcv(_mat_ii[ii]);
              _ret += xrbcv(_xb, _xc, _xv);
              if (ii<mat_len-1) _ret += "%09";
            }
          }
          else 
          {            
            _ret = "b"+_ret+_tailoption; //모두 아니면 단일 검색임
          }
        }
      }
      if (_ret.length>3) return _ret;
    }
    return null;
}
function go_bible(x = "", exactly = false, onlystret = false) {
    if (x.trim() === "" && exactly) return null;    
    let _b = 0; let _c = 0; let _v = 0; const _str = testBible(x, false); if (!_str && exactly) return false; else x = _str;    
    const n_mat = _str.match(/[0-9]+/gi); if (n_mat) _c = +n_mat[n_mat.length - 1];
    const s_mat = _str.match(/[^0-9]+/gi); if (s_mat) x = s_mat[0];
    let checked = false; let ran = new Array(0, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65);
    for (let i = 0; i < rar.length; i++) { if (rar[i] == x || x.match(rar_f[i])) { ran = new Array(0, i + 1); _b = i + 1; checked = true; break; } } if (!checked) { if (x.indexOf('구약') != -1) ran = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39]; else if (x.indexOf('모') != -1 || x.indexOf('율') != -1 || x.indexOf('오') != -1 || x.indexOf('토') != -1) ran = [0, 1, 2, 3, 4, 5]; else if (x.indexOf('역') != -1) ran = [0, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; else if (x.indexOf('신정') != -1) ran = [0, 5, 6, 7, 8]; else if (x.indexOf('왕') != -1) ran = [0, 9, 10, 11, 12, 13, 14]; else if (x.indexOf('바벨') != -1 || x.indexOf('포') != -1 || x.indexOf('귀') != -1) ran = [0, 15, 16, 17]; else if (x.indexOf('지') != -1) ran = [0, 18, 19, 20, 21, 22]; else if (x.indexOf('예') != -1 || x.indexOf('선') != -1) ran = [0, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39]; else if (x.indexOf('대') != -1) ran = [0, 23, 24, 25, 26, 27]; else if (x.indexOf('소') != -1) ran = [0, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39]; else if (x.indexOf('복') != -1) ran = [0, 40, 41, 42, 43]; else if (x.indexOf('서') != -1) ran = [0, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65]; else if (x.indexOf('바') != -1) ran = [0, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57]; else if (x.indexOf('교') != -1) ran = [0, 45, 46, 47, 48]; else if (x.indexOf('옥') != -1) ran = [0, 49, 50, 51, 57]; else if (x.indexOf('재') != -1) ran = [0, 52, 53]; else if (x.indexOf('목') != -1) ran = [0, 54, 55, 56]; else if (x.indexOf('신약') != -1) ran = [0, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 66]; else if (x.indexOf('요한') != -1) ran = [0, 43, 62, 63, 64, 66]; else { _b = Math.floor((Math.random() * (bcv_arr.length - 1)) + 1); ran = new Array(0, _b); } } if (_b == 0) { _b = Math.floor((Math.random() * (ran.length - 1)) + 1); _b = ran[_b]; } if (exactly && (!checked || _c == 0)) return null; if (+_c > bcv_arr[_b].length - 1) _c = bcv_arr[_b].length - 1; else if (_c == 0) { _c = Math.floor((Math.random() * (bcv_arr[_b].length - 1)) + 1); _v = Math.floor((Math.random() * (bcv_arr[_b][_c])) + 1); } else _v=1;
    if (onlystret) return "b" + _b + '.' + _c + "&w=1";
    else { location.href = "b" + _b + '.' + _c + '.' + _v + "&w=1"; return checked; }
}

function GetBCVConvertOptionElement()
{
    const _select = document.getElementById('search_site');    
    let _selOption = null;
    if (_select)
        Array.from(_select.options).forEach((option) => {
                if (option.value=='bcvconvertoption') { _selOption = option; return _selOption; }
            });    
    return _selOption;
}

//@@5
async function BibleRefsIndex(_option_='force', bibleAnchor="", _element_=null) {            
    isBCVconverted = false;    
    let _option; 
    let _selOption = GetBCVConvertOptionElement();        
    let isHidden; if (_selOption) _selOption.getAttribute("hidden"); if (isHidden && isHidden === 'hidden') return;
    if (g_skipConvert || (document.title.length>0 && g_content.getElementsByClassName('verno').length>0 && g_content.getElementsByClassName('verse').length>0 ))
    {        
        if (_selOption)
        {
            _selOption.innerText = '성구인식 불가';
            _selOption.setAttribute("hidden", "hidden");
        }        
        if (_loaded) Alert('성구변환을 하지 않는 페이지');
        return false;
    }
    let _element = _element_===null?g_content:_element_;
    if (!_loaded)
    {
        if (document.getElementsByClassName('bible comlink').length>0) _option='yes';
        else if (_option_=="comDiv")
        { 
            _option = "yes";
        }
        else if (document.getElementById('hd1') && document.getElementById('hd1').tagName.toUpperCase()==='H1') 
        {            
            // 문서 제목이 있는 페이지 (ex.개인노트인 경우) return ---
            return false;
        }
        else if (document.title.length==0 && (document.getElementsByClassName('bible').length>5 || _element.textContent.length<120)) 
        {
            Alert('Bible reference(s)', 600);
            return false; // 다중 성경절 보기가 확실한 경우, 또는 120자 이하의 제목이 없는 짧은 코멘트일 경우
        }
        else if (__isComp) { //bible view more
            // 병행보기인 경우??
            if (_loaded) Alert('성구변환을 하지 않는 문서');
            return false;
        }
        else _option = "force";        
    }       
    let korTest = await _element.innerText.replaceAll(/<<이전|위로 가기|다음>>/g,'').match(/[가-힣]+/g);
    let korLen = 0; if (korTest) korLen = korTest.length;
    if (!contentBackrollStr) contentBackrollStr=await g_content.innerHTML.toString();            
    _element.innerHTML = _element.innerHTML.replace(/[\u200B-\u200D\uFEFF]/g, ''); //인쇄 불가 문자 제거 코드(not letters)
    // 문서에 걸린 원래 성경 링크를 다 지움 (새로 인식해서 깜)
    let _conStr = await _element.innerHTML.replace(/<a [^>]*?href\="(b|papyrus).*?>(.*?)<\/a>/g, '\$2');
    const breRegex = /(?:(?:\s*\d+\s*[\-‒﹣–—―~∼〜;﹔])*(?:(?:\s*\d+\s*)?[장절편과와\-‒﹣–—―~∼〜.·﹒:﹕ː;﹔]|and|to)*\s*(?:(?:([^가-힣](?:창세기|창세|창|출애굽기|출애굽|출|레위기|레위|레|민수기|민수|민|신명기|신명|신|여호수아|수|사사기|삿|룻기|룻|사무엘\s*상|삼상|사무엘\s*하|삼하|열왕기\s*상|왕상|열왕기\s*하|왕하|역대\s*상|역대|대상|역대\s*하|대하|에스라|스|느헤미야|느|에스더|에|욥기|욥|시편|시|잠언|잠|전도서|전|아가서|아|이사야|사|예레미야\s*애가|예레미|예레|예|렘|예레미야|애가|애|에스겔|겔|다니엘|단|호세아|호|요엘|엘|욜|아모스|암|오바댜|옵|요나|욘|미가|미|나훔|나|하박국|하박|합|스바냐|스바|습|학개|학|스갸랴|스가랴|스가|슥|말라기|말라|말|마태\s*복음|마태|마|마가\s*복음|마가|막|누가\s*복음|누가|눅|요한\s*복음|요|사도\s*행전|행전|행|로마서|로마|롬|고린도\s*전서|고전|고린도\s*후서|고후|갈라디아서|갈라디아|갈|에베소서|에베소|엡|빌립보서|빌립보|빌|골로새서|골로새|골|데살로니가\s*전서|데살로니가전|살전|데살로니가\s*후서|데살로니가후|살후|디모데\s*전서|딤전|디모데\s*후서|딤후|디도서|디도|딛|빌레몬서|빌레몬|몬|히브리서|히브리|히|야고보서|야고보|야|약|베드로\s*전서|벧전|베드로\s*후서|벧후|요한\s*일서|요한\s*1서|요1서|요일|요한\s*이서|요한\s*2서|요이|요한\s*삼서|요한\s*3서|요삼|유다서|유다|유|요한\s*계시록|계시록|계시|계|옙))|(\b(?:Second\s*Thessalonians|First\s*Thessalonians|Second\s*Corinthians|Second\s*Chronicles|First\s*Corinthians|1st\s*Thessalonians|2nd\s*Thessalonians|First\s*Chronicles|II\s*Thessalonians|1st\s*Corinthians|2nd\s*Corinthians|1\s*Thessalonians|I\s*Thessalonians|2\s*Thessalonians|1st\s*Chronicles|2nd\s*Chronicles|Song\s*of\s*Solomon|II\s*Corinthians|Second\s*Timothy|Second\s*Samuel|II\s*Chronicles|Ecclesiastes|Lamentations|1\s*Corinthians|I\s*Corinthians|2\s*Corinthians|First\s*Timothy|Deuteronomy|First\s*Samuel|Second\s*King(?:s)?|I\s*Chronicles|1\s*Chronicles|2\s*Chronicles|Philippians|Second\s*Peter|Second\s*Peter|First\s*King(?:s)?|Colossians|1st\s*Timothy|2nd\s*Timothy|First\s*Peter|Second\s*John|Apocalypse|Revelation|Leviticus|1st\s*Samuel|2nd\s*Samuel|Canticles|Zephaniah|Zechariah|Galatians|Ephesians|II\s*Timothy|First\s*John|Third\s*John|1st\s*King(?:s)?|2nd\s*King(?:s)?|Nehemiah|Proverbs|Jeremiah|Habakkuk|1st\s*Thess|2nd\s*Thess|1\s*Timothy|I\s*Timothy|2\s*Timothy|Philemon|1st\s*Peter|2nd\s*Peter|2nd\s*Peter|Genesis|Numbers|1\s*Samuel|2\s*Samuel|II\s*King(?:s)+|II\s*Chron|Proverb|Ezekiel|Obadiah|Malachi|Matthew|II\s*Thess|Hebrews|II\s*Peter|1st\s*John|2nd\s*John|3rd\s*John|III\s*John|Exodus|Number|Joshua|Judges|1st\s*Sam|2nd\s*Sam|1st\s*Kg(?:s)?|1\s*King(?:s)?|I\s*King(?:s)?|2\s*King(?:s)?|2nd\s*Kg(?:s)?|1st\s*Chr|1\s*Chron|I\s*Chron|2nd\s*Chr|2\s*Chron|Esther|Psalms|Eccles|Isaiah|Daniel|Haggai|Romans|1st\s*Cor|2nd\s*Cor|1\s*Thess|I\s*Thess|2\s*Thess|II\s*Thes|1st\s*Tim|2nd\s*Tim|Philem|1\s*Peter|I\s*Peter|1st\s*Pet|2\s*Peter|II\s*John|III\s*Joh|III\s*Jhn|II\s*Sam|II\s*Kgs|1\s*Chro|2\s*Chro|II\s*Chr|Psalm|Hosea|Jonah|Micah|Nahum|II\s*Cor|Ephes|1\s*Thes|I\s*Thes|2\s*Thes|II\s*Tim|Titus|James|II\s*Pet|1\s*John|I\s*John|2\s*John|II\s*Joh|II\s*Jhn|3\s*John|III\s*Jn|III\s*Jo|Exod|Deut|Josh|Judg|Jdgs|Ruth|1\s*Sam|I\s*Sam|2\s*Sam|II\s*Sa|1\s*Kin|1\s*Kgs|1\s*Kgs|I\s*Kgs|2\s*Kin|2\s*Kgs|2\s*Kgs|II\s*Ki|II\s*Kg|I\s*Chr|1\s*Chr|2\s*Chr|II\s*Ch|Ezra|Esth|Pslm|Prov|Eccl|Song|Ezek|Hose|Joel|Jona|Amos|Obad|Zeph|Zech|Matt|Mark|Luke|John|Acts|1\s*Cor|I\s*Cor|2\s*Cor|II\s*Co|Phil|II\s*Th|1\s*Tim|I\s*Tim|2\s*Tim|II\s*Ti|II\s*Tm|Phlm|1\s*Pet|I\s*Pet|2\s*Pet|II\s*Pe|II\s*Pt|1\s*Joh|1\s*Jhn|1\s*Joh|I\s*Joh|I\s*Jhn|2\s*Joh|2\s*Jhn|2\s*Joh|II\s*Jn|II\s*Jo|3\s*Joh|3\s*Jhn|3\s*Joh|III\s*J|Jude|Gen|Exo|Lev|Num|Deu|Jsh|Jos|Jdg|Jgs|Rth|Rut|1\s*Sa|1\s*Sm|1\s*Sa|I\s*Sa|2\s*Sa|2\s*Sm|2\s*Sa|1\s*Ki|1\s*Kg|1\s*Ki|1\s*Kg|I\s*Ki|I\s*Kg|2\s*Ki|2\s*Kg|2\s*Ki|2\s*Kg|1\s*Ch|I\s*Ch|2\s*Ch|Ezr|Neh|Est|Job|Psa|Psm|Pss|Prv|Pro|Ecc|SOS|Son|Isa|Jer|Lam|Ezk|Eze|Dan|Hos|Joe|Amo|Oba|Jon|Jnh|Mic|Nah|Hab|Zep|Hag|Zec|Mal|Mat|Mar|Mrk|Luk|Joh|Jhn|Act|Rom|1\s*Co|I\s*Co|2\s*Co|Gal|Eph|Phi|Php(_)?|Col|1\s*Th|I\s*Th|2\s*Th|1\s*Tm|1\s*Ti|I\s*Ti|I\s*Tm|2\s*Tm|2\s*Ti|2\s*Ti|Tit|Phl|Phm|Heb|Jas|Jam|1\s*Pt|1\s*Pe|I\s*Pe|I\s*Pt|2\s*Pt|2\s*Pe|II\s*P|1\s*Jo|1\s*Jn|1\s*Jo|1\s*Jn|I\s*Jn|I\s*Jo|2\s*Jo|2\s*Jn|2\s*Jo|2\s*Jn|II\s*J|3\s*Jo|3\s*Jn|3\s*Jo|3\s*Jn|Jud|Rev|Ge|Gn|Ex|Le|Lv|Nu|Nm|Nb|De|Dt|Du|Jo|Jg|Ru|1\s*S|2\s*S|1\s*K|2\s*K|Ne|Jb|Ps|Pr|Ec|So|Is|Jr|Je|La|Ez|Dn|Da|Ho|Jl|Am|Ob|Mi|Na|Hb|Zp|Hg|Zc|Ml|Mt|Mr|Mk|Lk|Lu|Jn|Ac|Rm|Ro|Ga|Co|Ti|Jm|Ja|I\s*P|1\s*P|2\s*P|I\s*J|1\s*J|2\s*J|3\s*J|Ju|Rv|Re)))\s*(?:\.|chap\.|ch\.|chapter|§)?\s*((?:\s[Il])?[0-9]{1,3})\s*(?:[a-z장편.·﹒:﹕ː;﹔,﹐，]|verse|ver\.)\s*(?:[I0-9]{1,3})\s*(?:[절\-‒﹣–—―~∼〜,﹐，]){0,2}\s*(?:and|to|[0-9\-‒﹣–—―~∼〜.·﹒:﹕ː,﹐，장절편\s])*\s*(?:[과와]\s*|(?:부터)?\s*)*)|(?:[;﹔]\s*\d+\s*(?:[\-‒﹣–—―~∼〜.·﹒:﹕ː장편]\s*\d+(?:[,﹐，]\s*\d+\s*)*)*))+\b/i;
    const breRegex2 =/(?:[^가-힣](?:창세기|창세|창|출애굽기|출애굽|출|레위기|레위|레|민수기|민수|민|신명기|신명|신|여호수아|수|사사기|삿|룻기|룻|사무엘\s*상|삼상|사무엘\s*하|삼하|열왕기\s*상|왕상|열왕기\s*하|왕하|역대\s*상|역대|대상|역대\s*하|대하|에스라|스|느헤미야|느|에스더|에|욥기|욥|시편|시|잠언|잠|전도서|전|아가서|아|이사야|사|예레미야\s*애가|예레미|예레|예|렘|예레미야|애가|애|에스겔|겔|다니엘|단|호세아|호|요엘|엘|욜|아모스|암|오바댜|옵|요나|욘|미가|미|나훔|나|하박국|하박|합|스바냐|스바|습|학개|학|스갸랴|스가랴|스가|슥|말라기|말라|말|마태\s*복음|마태|마|마가\s*복음|마가|막|누가\s*복음|누가|눅|요한\s*복음|요|사도\s*행전|행전|행|로마서|로마|롬|고린도\s*전서|고전|고린도\s*후서|고후|갈라디아서|갈라디아|갈|에베소서|에베소|엡|빌립보서|빌립보|빌|골로새서|골로새|골|데살로니가\s*전서|데살로니가전|살전|데살로니가\s*후서|데살로니가후|살후|디모데\s*전서|딤전|디모데\s*후서|딤후|디도서|디도|딛|빌레몬서|빌레몬|몬|히브리서|히브리|히|야고보서|야고보|야|약|베드로\s*전서|벧전|베드로\s*후서|벧후|요한\s*일서|요한\s*1서|요1서|요일|요한\s*이서|요한\s*2서|요이|요한\s*삼서|요한\s*3서|요삼|유다서|유다|유|요한\s*계시록|계시록|계시|계|옙)|\b(Second\s*Thessalonians|First\s*Thessalonians|Second\s*Corinthians|Second\s*Chronicles|First\s*Corinthians|1st\s*Thessalonians|2nd\s*Thessalonians|First\s*Chronicles|II\s*Thessalonians|1st\s*Corinthians|2nd\s*Corinthians|1\s*Thessalonians|I\s*Thessalonians|2\s*Thessalonians|1st\s*Chronicles|2nd\s*Chronicles|Song\s*of\s*Solomon|II\s*Corinthians|Second\s*Timothy|Second\s*Samuel|II\s*Chronicles|Ecclesiastes|Lamentations|1\s*Corinthians|I\s*Corinthians|2\s*Corinthians|First\s*Timothy|Deuteronomy|First\s*Samuel|Second\s*King(?:s)?|I\s*Chronicles|1\s*Chronicles|2\s*Chronicles|Philippians|Second\s*Peter|Second\s*Peter|First\s*King(?:s)?|Colossians|1st\s*Timothy|2nd\s*Timothy|First\s*Peter|Second\s*John|Apocalypse|Revelation|Leviticus|1st\s*Samuel|2nd\s*Samuel|Canticles|Zephaniah|Zechariah|Galatians|Ephesians|II\s*Timothy|First\s*John|Third\s*John|1st\s*King(?:s)?|2nd\s*King(?:s)?|Nehemiah|Proverbs|Jeremiah|Habakkuk|1st\s*Thess|2nd\s*Thess|1\s*Timothy|I\s*Timothy|2\s*Timothy|Philemon|1st\s*Peter|2nd\s*Peter|2nd\s*Peter|Genesis|Numbers|1\s*Samuel|2\s*Samuel|II\s*King(?:s)+|II\s*Chron|Proverb|Ezekiel|Obadiah|Malachi|Matthew|II\s*Thess|Hebrews|II\s*Peter|1st\s*John|2nd\s*John|3rd\s*John|III\s*John|Exodus|Number|Joshua|Judges|1st\s*Sam|2nd\s*Sam|1st\s*Kg(?:s)?|1\s*King(?:s)?|I\s*King(?:s)?|2\s*King(?:s)?|2nd\s*Kg(?:s)?|1st\s*Chr|1\s*Chron|I\s*Chron|2nd\s*Chr|2\s*Chron|Esther|Psalms|Eccles|Isaiah|Daniel|Haggai|Romans|1st\s*Cor|2nd\s*Cor|1\s*Thess|I\s*Thess|2\s*Thess|II\s*Thes|1st\s*Tim|2nd\s*Tim|Philem|1\s*Peter|I\s*Peter|1st\s*Pet|2\s*Peter|II\s*John|III\s*Joh|III\s*Jhn|II\s*Sam|II\s*Kgs|1\s*Chro|2\s*Chro|II\s*Chr|Psalm|Hosea|Jonah|Micah|Nahum|II\s*Cor|Ephes|1\s*Thes|I\s*Thes|2\s*Thes|II\s*Tim|Titus|James|II\s*Pet|1\s*John|I\s*John|2\s*John|II\s*Joh|II\s*Jhn|3\s*John|III\s*Jn|III\s*Jo|Exod|Deut|Josh|Judg|Jdgs|Ruth|1\s*Sam|I\s*Sam|2\s*Sam|II\s*Sa|1\s*Kin|1\s*Kgs|1\s*Kgs|I\s*Kgs|2\s*Kin|2\s*Kgs|2\s*Kgs|II\s*Ki|II\s*Kg|I\s*Chr|1\s*Chr|2\s*Chr|II\s*Ch|Ezra|Esth|Pslm|Prov|Eccl|Song|Ezek|Hose|Joel|Jona|Amos|Obad|Zeph|Zech|Matt|Mark|Luke|John|Acts|1\s*Cor|I\s*Cor|2\s*Cor|II\s*Co|Phil|II\s*Th|1\s*Tim|I\s*Tim|2\s*Tim|II\s*Ti|II\s*Tm|Phlm|1\s*Pet|I\s*Pet|2\s*Pet|II\s*Pe|II\s*Pt|1\s*Joh|1\s*Jhn|1\s*Joh|I\s*Joh|I\s*Jhn|2\s*Joh|2\s*Jhn|2\s*Joh|II\s*Jn|II\s*Jo|3\s*Joh|3\s*Jhn|3\s*Joh|III\s*J|Jude|Gen|Exo|Lev|Num|Deu|Jsh|Jos|Jdg|Jgs|Rth|Rut|1\s*Sa|1\s*Sm|1\s*Sa|I\s*Sa|2\s*Sa|2\s*Sm|2\s*Sa|1\s*Ki|1\s*Kg|1\s*Ki|1\s*Kg|I\s*Ki|I\s*Kg|2\s*Ki|2\s*Kg|2\s*Ki|2\s*Kg|1\s*Ch|I\s*Ch|2\s*Ch|Ezr|Neh|Est|Job|Psa|Psm|Pss|Prv|Pro|Ecc|SOS|Son|Isa|Jer|Lam|Ezk|Eze|Dan|Hos|Joe|Amo|Oba|Jon|Jnh|Mic|Nah|Hab|Zep|Hag|Zec|Mal|Mat|Mar|Mrk|Luk|Joh|Jhn|Act|Rom|1\s*Co|I\s*Co|2\s*Co|Gal|Eph|Phi|Php(_)?|Col|1\s*Th|I\s*Th|2\s*Th|1\s*Tm|1\s*Ti|I\s*Ti|I\s*Tm|2\s*Tm|2\s*Ti|2\s*Ti|Tit|Phl|Phm|Heb|Jas|Jam|1\s*Pt|1\s*Pe|I\s*Pe|I\s*Pt|2\s*Pt|2\s*Pe|II\s*P|1\s*Jo|1\s*Jn|1\s*Jo|1\s*Jn|I\s*Jn|I\s*Jo|2\s*Jo|2\s*Jn|2\s*Jo|2\s*Jn|II\s*J|3\s*Jo|3\s*Jn|3\s*Jo|3\s*Jn|Jud|Rev|Ge|Gn|Ex|Le|Lv|Nu|Nm|Nb|De|Dt|Du|Jo|Jg|Ru|1\s*S|2\s*S|1\s*K|2\s*K|Ne|Jb|Ps|Pr|Ec|So|Is|Jr|Je|La|Ez|Dn|Da|Ho|Jl|Am|Ob|Mi|Na|Hb|Zp|Hg|Zc|Ml|Mt|Mr|Mk|Lk|Lu|Jn|Ac|Rm|Ro|Ga|Co|Ti|Jm|Ja|I\s*P|1\s*P|2\s*P|I\s*J|1\s*J|2\s*J|3\s*J|Ju|Rv|Re))\s*(?:\.|ch|ch\.|chap\.|chapter|§)?\s*((?:\s[lI])?[\d]+)\s*(?:[,]|[장편]?)/i;
    const breRegex_content =/(창세기|창세|창|Genesis|Gen|Ge|Gn|출애굽기|출애굽|출|Exodus|Exod|Exo|Ex|레위기|레위|레|Leviticus|Lev|Le|Lv|민수기|민수|민|Numbers|Number|Num|Nu|Nm|Nb|신명기|신명|신|Deuteronomy|Deut|Deu|De|Dt|Du|여호수아|수|Joshua|Josh|Jsh|Jos|Jo|사사기|사사|삿|Judges|Judg|Jdgs|Jdg|Jgs|Jg|Ruth|Rth|Rut|Ru|룻기|룻|First\s*Samuel|1st\s*Samuel|1\s*Samuel|1st\s*Sam|1\s*Sam|I\s*Sam|1\s*Sa|1\s*Sm|1\s*Sa|I\s*Sa|1S|사무엘상|삼상|Second\s*Samuel|2nd\s*Samuel|2\s*Samuel|2nd\s*Sam|II\s*Sam|2\s*Sam|II\s*Sa|2\s*Sa|2\s*Sm|2\s*Sa|2S|사무엘하|삼하|First\s*Kings|1st\s*Kings|1st\s*Kgs|1\s*Kings|I\s*Kings|1\s*King|I\s*King|1\s*Kin|1\s*Kgs|1\s*Ki|1\s*Kg|1\s*Ki|1\s*Kg|1\s*Kgs|I\s*Ki|I\s*Kg|I\s*Kgs|1K|열왕기상|왕상|Second\s*Kings|II\s*Kings|2nd\s*Kings|2nd\s*Kgs|2\s*Kings|II\s*King|2\s*King|II\s*Kgs|2\s*Kin|2\s*Kgs|2\s*Ki|2\s*Kg|2Ki|2Kg|2Kgs|IIKi|IIKg|2K|열왕기하|왕하|First\s*Chronicles|1st\s*Chronicles|I\s*Chronicles|1\s*Chronicles|1st\s*Chr|1\s*Chron|1\s*Chron|I\s*Chron|1\s*Chro|1\s*Chro|I\s*Chr|1\s*Chr|1Ch|I\s*Ch|역대상|역대|대상|Second\s*Chronicles|2nd\s*Chronicles|II\s*Chronicles|2\s*Chronicles|2nd\s*Chr|II\s*Chron|2\s*Chron|2\s*Chron|2\s*Chro|2\s*Chro|II\s*Chr|2\s*Chr|2\s*Chr|II\s*Ch|2Ch|역대하|대하|Ezra|Ezr|에스라|스|Nehemiah|Neh|Ne|느헤미야|느|Esther|Esth|Est|에스더|에|Job|Jb|욥기|욥|Psalms|Psalm|Pslm|Psa|Psm|Ps|Pss|시편|시|Proverbs|Proverb|Prov|Prv|Pro|Pr|잠언|잠|Ecclesiastes|Eccles|Eccl|Ecc|Ec|전도서|전도|전|SongofSolomon|Canticles|Song|Song|SOS|Son|So|아가서|아가|아|Isaiah|Isa|Is|이사야|사|Jeremiah|Jer|Jr|Je|예레미야\s*애가|애가|애|Lamentations|Lam|La|예레미야|예레미|예레|예|렘|Ezekiel|Ezek|Ezk|Eze|Ez|에스겔|겔|Daniel|Dan|Dn|Da|다니엘|단|Hosea|Hose|Hos|Ho|호세아|호|Joel|Joe|Jl|요엘|엘|욜|Amos|Amo|Am|아모스|암|Obadiah|Obad|Oba|Ob|오바댜|옵|Jonah|Jona|Jon|Jnh|요나|욘|Micah|Mic|Mi|미가|미|Nahum|Nah|Na|나훔|나|Habakkuk|Hab|Hb|하박국|하박|합|Zephaniah|Zeph|Zep|Zp|스바냐|스바|습|Haggai|Hag|Hg|학개|학|Zechariah|Zech|Zec|Zc|스갸랴|스가랴|스가|슥|Malachi|Mal|Ml|말라기|말라|말|Matthew|Matt|Mat|Mt|마태복음|마태|마|Mark|Mar|Mrk|Mr|Mk|마가복음|마가|막|Luke|Luk|Lk|누가복음|누가|눅|John|Joh|Jhn|Jn|요한복음|요|Acts|Act|Ac|사도행전|행전|행|Romans|Rom|Rm|Ro|로마서|로마|롬|First\s*Corinthians|1st\s*Corinthians|1\s*Corinthians|I\s*Corinthians|1st\s*Cor|1\s*Cor|I\s*Cor|1\s*Co|I\s*Co|고린도전서|고전|Second\s*Corinthians|2nd\s*Corinthians|II\s*Corinthians|2\s*Corinthians|2nd\s*Cor|II\s*Cor|2\s*Cor|2\s*Co|II\s*Co|고린도후서|고후|Galatians|Gal|Ga|갈라디아서|갈라디아|갈|Ephesians|Ephes|Eph|에베소서|에베소|엡|Philippians|Phil|Phi|Php|빌립보서|빌립보|빌|Colossians|Col|Co|골로새서|골로새|골|First\s*Thessalonians|1st\s*Thessalonians|1\s*Thessalonians|I\s*Thessalonians|1st\s*Thess|1\s*Thess|I\s*Thess|1\s*Thes|1\s*Th|I\s*Th|I\s*Thes|데살로니가전서|데살로니가전|살전|Second\s*Thessalonians|2nd\s*Thessalonians|II\s*Thessalonians|2\s*Thessalonians|2nd\s*Thess|II\s*Thess|2\s*Thess|II\s*Thes|2\s*Thes|II\s*Th|2\s*Th|데살로니가후서|데살로니가후|살후|First\s*Timothy|1st\s*Timothy|1\s*Timothy|I\s*Timothy|1st\s*Tim|1\s*Tim|1\s*Tm|1\s*Ti|I\s*Ti|I\s*Tm|I\s*Tim|디모데전서|딤전|Second\s*Timothy|2nd\s*Timothy|II\s*Timothy|2\s*Timothy|2nd\s*Tim|II\s*Tim|2\s*Tim|2\s*Tm|2\s*Ti|2Ti|II\s*Ti|II\s*Tm|디모데후서|딤후|Titus|Tit|Ti|디도서|디도|딛|Philemon|Philem|Phlm|Phm|빌레몬서|빌레몬|몬|Hebrews|Heb|히브리서|히브리|히|James|Jas|Jam|Jm|Ja|야고보서|야고보|야|약|First\s*Peter|1st\s*Peter|1\s*Peter|I\s*Peter|1\s*Pet|1\s*Pt|1\s*Pe|I\s*P|1\s*P|I\s*Pe|I\s*Pt|I\s*Pet|1st\s*Pet|베드로전서|벧전|Second\s*Peter|Second\s*Peter|2nd\s*Peter|II\s*Peter|2nd\s*Peter|2\s*Peter|II\s*Pet|2\s*Pet|2\s*Pt|2\s*P|2\s*Pe|II\s*P|II\s*Pe|II\s*Pt|베드로후서|벧후|First\s*John|1st\s*John|1\s*John|I\s*John|1\s*Joh|1\s*Jhn|1\s*Jo|1\s*Jn|I\s*J|1\s*J|1\s*Jo|1\s*Jn|1\s*Joh|I\s*Jn|I\s*Jo|I\s*Joh|I\s*Jhn|요한일서|요한1서|요1서|요일|Second\s*John|2st\s*John|II\s*John|2\s*John|II\s*Joh|2\s*Joh|2\s*Jhn|2\s*Jo|2\s*Jn|2\s*J|2\s*Jo|2\s*Jn|2\s*Joh|II\s*J|II\s*Jn|II\s*Jo|II\s*Jhn|요한이서|요한2서|요이|Third\s*John|3rd\s*John|III\s*John|III\s*Joh|III\s*Jhn|3\s*John|III\s*Jn|3\s*Joh|3\s*Jhn|3\s*Jo|3\s*Jn|3\s*J|3\s*Jo|3\s*Jn|3\s*Joh|III\s*J|III\s*Jo|요한삼서|요한3서|요삼|Jude|Jud|Ju|유다서|유다|유|Apocalypse|Revelation|Rev|Rv|Re|요한계시록|계시록|계시|계)\s*([0-9]{1,3})\s*(?:[백천만여명살인회개세번째차년월일시분초]|[:장편]?)/i;
    const breRegex_wret = /.*?(\d+)\.(\d+).*$/;
    const breRegex_partx = /(?:전서|후서|1서|2서|3서|일서|이서|삼서)?[(]?\s*(?:\d+)\s*[:﹕ː]\s*(?:\d*)\s*[.·,﹐，﹔장편절;\s]?(?:[:﹕ː~‒\-﹣–—―~∼〜\.·,﹐，﹔Vv장편절)]?\s*(?:\d+)\s*[\-‒﹣–—―~∼〜.·﹒:﹕ː;﹔,﹐，Vv장편절)]?)+/i;
    const breRegex_part1 = /(?:상|하|전서|후서|1서|2서|3서|일서|이서|삼서)?\s*(?:\d+)\s*[:﹕ː]\s*(?:\d+)\s*[·,;)]?/i;
    const breRegex_part2preout = /(<br>|<p[^<]*?>|<div[^<]*?>|<div>)(<font[^<]*?>|<strong>|<b>|<u>|<i>)*\s*\(\s*\d+\s*\)/gi; // 일반 테그와 (숫자)<-절 오인 필터
    const breRegex_part2 = /(?:상|하|전서|후서|1서|2서|3서|일서|이서|삼서)?\s*(?:\(?\s*)(?:\d+[~‒\-﹣–—―~∼〜])?(\s*(?:\d+)\s*[.,절;)])+/gi;
    const breRegex_part2a = /\b\s*(?:(?:ver(?:se|s(?:es)?)|v)[.]?\s*)(\d+)(?:\s*([~‒\-﹣–—―~∼〜]|to|and)\s*(?:(?:ver(?:se|s(?:es)?)|v)[.]?\s*)?\d+)?\s*/gi;    
    const breRegex_part2b = /(?:상|하|전서|후서|1서|2서|3서|일서|이서|삼서)?\s*\b(?:[v][.]?\s*(?:\d+[~‒\-﹣–—―~∼〜,﹐，])?\s*(?:\d+))\b/gi;
    const breRegex_part3 = /(?:상|하|전서|후서|1서|2서|3서|일서|이서|삼서)?\s*(?:\d+)\s*장(?:\s*[\.,;\)])?/i;
    const breRegex_part3a = /\b(?:ch|ch.|chap.|chapter|§)\s*(?:\d+)/gi;
    const breRegex_out = /(?:(?:약|January|February|March|April|May|June|July|August|September|October|November|December|(Jan|Feb|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec).?)?\s*(?:\d+(?:\s*[,.]*\s*\d+)?)+\s*(?:[세번째백천만여명회개년월일분초차원인]|데나리온|달란트|세겔|오멜|에바|온스|규빗|무나|키로|리터|갤런|킬로|센티|센치|마일|광년|km|cm|ft|mile|feet|yard|hour|sec|hr|min|mm|g\b|m\b|l\b|denarius|shekel|cubit|talent|ephah|omer|mina|muna|men|more|than|less|peoples|women|°))/gi;
    const breRegex_ex = /상|하|전서|후서|1서|2서|3서|일서|이서|삼서/gi;    
    //----------------------- 앵커챕터  --------------------------------
    const const_bx_match = _element.innerText.match(breRegex_content);
    if (bibleAnchor!=="")
    {      
      const_bx = rar[parseInt(bibleAnchor.replace(breRegex_wret, '\$1'))-1];
      const_cx = bibleAnchor.replace(breRegex_wret, '\$2');
      Alert("ReIndexed with Anchor "+const_bx+" "+const_cx+" !");
    }
    else if (const_bx_match)
    {
      const_bx = const_bx_match[0].replace(breRegex_content, '\$1');
      const_cx = const_bx_match[0].replace(breRegex_content, '\$2');
    }
 
    //----------------------- A --------------------------------
    
    //@@@ b에 대한 선행 처리로 모든 <a href="b~ 제거
    _conStr = _conStr.replace(/<a [^>]*href\=["]?b[^>]*>(.*?)<\/a>/g, '\$1').replace(/<a [^>]*href\=["]?y[^>]*>.*?<\/a>/g, '').replace(/([:﹕ː;﹔,﹐，])\s+/g,'\$1 ').replace(/\s*(\d+)\s*장\s*(\d+)\s*절/g,' \$1장 \$2절');

    const a_regex = /(?:<a .+?>.*?<\/a>)|(?:<h\d[^>]*>.*?<\/h\d+>)/g;
    const a_regex_1con = /<a .+?>(.*?)<\/a>/;    
    const a_regex_2con = /<h\d+.*?>(.*?)<\/h\d+>/;
    const a_regex_1 = /(?:<a .+?>.*?<\/a>)/;
    const a_regex_2 = /(?:<h\d+.*?>.*?<\/h\d+>)/;
    //const a_regex_1rem = /(<a .+?>)|(<\/a>)/;
    //const a_regex_2rem = /(<h\d+.*?>)|(<\/h\d+>)/;
    const tags_regex = /(?:<\/\w+>)|(?:<\w+ .+?>)|(?:<\w+>)/g;    
    let _match_a = _conStr.match(a_regex);
    let _match_a_rep = new Array();    
    let _match_isRep = new Array();
    let _match_a_2 = new Array();
    let _mcnt = 0;    
    if (_match_a&&_match_a.length>0)
    {
        let len = _match_a.length;
        for (let i=0; i<len; i++)
        {
            _match_a_rep[i] = _match_a[i];
            _match_isRep[i] = 0;
            if (_option==='force') 
            {
              let _textcon = _match_a_rep[i].replace(a_regex_1con, '\$1').replace(a_regex_2con, '\$1');              
              if (a_regex_1.test(_match_a_rep[i]))
              {  
                if (_match_a_rep[i].match(/\shref\="b/))
                {                  
                  _match_isRep[i] = 1;
                  _match_a_rep[i] = _textcon;
                }
                else if (_match_a_rep[i].match(/\sclass\="xref/))
                {
                  _match_isRep[i] = 1;
                  _match_a_rep[i] = "";
                }
              }              
              _conStr=_conStr.replace(new RegExp(a_regex.source, "i"), '¦E@'+i+'@E¦');
            } else _conStr=_conStr.replace(new RegExp(a_regex.source, "i"), '¦A@'+i+'@A¦');
        }

        if (_option==='force')
        {
          for (let i=0; i<len; i++)
          {              
              if (_match_isRep[i]===1)
              {
                _conStr = _conStr.replace(/¦E@(\d+)@E¦/, _match_a_rep[i]);
              }
              else
              {
                _conStr = _conStr.replace(/¦E@(\d+)@E¦/, "¦A@\$1@A¦");
                _match_a_2[_mcnt] = _match_a[i]; _mcnt++;
              }              
          }    
        }
    }    
    //----------------------- 기타 tag --------------------------------
    let _match4p = _conStr.match(breRegex_part2preout); // 절 번호를 의미하지 않은 괄호 숫자
    let _len4p=0;
      if (_match4p&&_match4p.length>0)
        {
            _len4p = _match4p.length;
            for (let i=0;i<_len4p;i++)
            {
                _conStr = _conStr.replace(_match4p[i], '¦p@'+i+'@p¦');
            }
        }

    let _match_tags = _conStr.match(tags_regex);
    let _len_tags=0;
    if (_match_tags&&_match_tags.length>0)
    {
        _len_tags = _match_tags.length;
        for (let i=0;i<_len_tags;i++)
        {            
            _conStr = _conStr.replace(_match_tags[i], '¦¦¦T@'+i+'@T¦¦¦');
        }
    }    
    let _match_out = _conStr.match(breRegex_out);
    let _len_out=0;
    if (_match_out&&_match_out.length>0)
    {
        _len_out = _match_out.length;
        for (let i=0;i<_len_out;i++)
        {
            _conStr = _conStr.replace(_match_out[i], '¦¦¦O@'+i+'@O¦¦¦');
        }
    }
           
    //------------------------- B --------------------------------
    let _match = _conStr.match(new RegExp(breRegex.source, "gi"));    
    let _rep = new Array();
    let _len1;    
    if (_match&&_match.length>0)
    {        
        _len1 = _match.length;
        for (let i=0;i<_len1;i++)
        {
            _conStr = _conStr.replace(_match[i], '¦B@'+i+'@B¦');
            let _mat_ = _match[i].replace(/절|verse|chapter|ver\.|chap\./g,'').replace(/장/g,':').replace(/과와|and/gi,';').replace(/to|부터/gi, '-').replaceAll(/<\w+[^>]*>(.*?)<\/\w+>/g, '\$1');            
            let _ret; let _testBible;
            if (!(/(^(?!\d).+$)/.test(_mat_.trim())))
            {
                let _matchForm = _mat_.match(/([a-zA-Z가-힣]|\d\s*[a-zA-Z]).+$/i);
                if (_matchForm && _matchForm.length>0)
                {
                    let _mat1 = _mat_.replace(_matchForm[0], '');
                    let _mat2 = _matchForm[0];
                    let _testBible2 = testBible(_mat2);                    
                    _testBible = _testBible2;

                    let _matNumForm = _mat1.match(/([\-‒﹣–—―~∼〜,﹐，;﹔]).+$/);
                    // 검색된 것의 앞 부분이 숫자로 시작되는 것인지
                    let _mat1_1;
                    if (_matNumForm&&_matNumForm.length>0) _mat1_1 = _matNumForm[0];                    
                    else _mat1_1 = _mat1; 
                    
                    // 검색된 것의 숫자 부분이 장절로 이루어졌는지 절만 있는지
                    if (_mat1_1.trim().length > 0) {
                        let _testBible1="";

                        if (/[.·﹒:﹕]\s*\d+/.test(_mat1_1) && const_bx && const_bx.length > 0) 
                            _testBible1 = testBible(const_bx + " " + _mat1) + ";";
                        else if (/\d+$/.test(_mat1_1.trim()) && const_bx && const_bx.length > 0 && const_cx && const_cx.length > 0) 
                            _testBible1 = testBible(const_bx + " " + const_cx + ":" + _mat1) + ";";

                        _testBible = _testBible1 +_testBible2;
                    }                          
                }
            } else
                _testBible = testBible(_mat_);
            _ret = _testBible? _testBible:_mat_;
            if (!_testBible) _rep[i]=_match[i];
            else if (!(/[가-힣]/.test(_match[i][0]))&&(/[가-힣]/.test(_match[i][1]))) _rep[i] = _match[i][0]+'<a href="'+ _ret +'">'+_match[i].substr(1, _match[i].length)+'<\/a>';
                else _rep[i] = '<a href="'+ _ret +'">'+_match[i]+'<\/a>';            
        }
    }    
    //_element.innerHTML = _conStr; return true;
    let _match2 = _conStr.match(new RegExp(breRegex2.source, "gi"));    
    let _rep2 = new Array();
    let _len2;
    if (_match2&&_match2.length>0)
    {
        _len2 = _match2.length;
        for (let i=0;i<_len2;i++)
        {
            _conStr = _conStr.replace(_match2[i], '¦b@'+i+'@b¦');
            let query = _match2[i].replaceAll(/<\w+[^>]*>(.*?)<\/\w+>/g, '\$1');
            let _goBible = go_bible(query,true,true); 
            let _ret = _goBible? _goBible:query;
            let isKor = /[가-힣]+/g.test(_match2[i]);            
            if (!_goBible) _rep2[i]=_match2[i];
            else if (!(/[가-힣]/.test(_match2[i][0]))&&(/[가-힣]/.test(_match2[i][1]))) _rep2[i] = _match2[i][0]+'<a href="'+ _ret +'">'+_match2[i].substr(1,_match2[i].length)+'<\/a>';
                else _rep2[i] = '<a href="'+ _ret +'">'+_match2[i]+'<\/a>';            
        }
    }        
    //------------------------- CVADX --------------------------------    
    let _repx = new Array();
    let _lenx=0;
    let _rep3 = new Array();
    let _len3=0;    
    let _rep4 = new Array();
    let _len4=0;
    let _rep4a = new Array();
    let _len4a=0;
    let _rep4b = new Array();
    let _len4b=0;
    let _rep5 = new Array();
    let _len5=0;
    let _rep5a = new Array();
    let _len5a=0;
    //------------------------- CD --------------------------------    
    if (const_bx.length>0)
    {
      let _matchx = _conStr.match(new RegExp(breRegex_partx.source, "g"));
      if (_matchx&&_matchx.length>0)
      {
        _lenx = _matchx.length;
        for (let i=0;i<_lenx;i++)
        {
            _conStr = _conStr.replace(_matchx[i], '#¦D@'+i+'@D¦#');
            let _const_bx=const_bx; let m_exn = m_ex(parseInt(getbIndex(const_bx)), _matchx[i]); if (m_exn>0) _const_bx = rar[m_exn-1];
            _repx[i] = '<a href="'+testBible(_const_bx+" "+_matchx[i].replaceAll(breRegex_ex,''),true,'')+'">'+_matchx[i]+'<\/a>';            
        }
      }

      let _match3 = _conStr.match(new RegExp(breRegex_part1.source, "g"));            
      if (_match3&&_match3.length>0)
      {
        _len3 = _match3.length;
        for (let i=0;i<_len3;i++)
        {   
            _conStr = _conStr.replace(_match3[i], '#¦C@'+i+'@C¦#');
            let _const_bx=const_bx; let m_exn = m_ex(parseInt(getbIndex(const_bx)), _match3[i]); if (m_exn>0) _const_bx = rar[m_exn-1];
            _rep3[i] = '<a href="'+testBible(_const_bx+" "+_match3[i].replaceAll(breRegex_ex,'').replace(breRegex_part1,'\$1')+":"+_match3[i].replace(breRegex_part1,'\$2'),true,'')+'">'+_match3[i]+'<\/a>';          
        }
      }
      let _match5a = _conStr.match(breRegex_part3a);            
      if (_match5a&&_match5a.length>0)
      {
        _len5a = _match5a.length;
        for (let i=0;i<_len5a;i++)
        {   
            _conStr = _conStr.replace(_match5a[i], '¦ca@'+i+'@ca¦');
            let _const_bx=const_bx; let m_exn = m_ex(parseInt(getbIndex(const_bx)), _match5a[i]); if (m_exn>0) _const_bx = rar[m_exn-1];
            let query = _const_bx+(_match5a[i].replaceAll(breRegex_ex,'').replaceAll(/[^0-9]/gi,''));
            let _goBible = go_bible(query,true,true); 
            let _ret = _goBible? _goBible:query;
            if (!_goBible) _rep5a[i] = _match5a[i]; else
            _rep5a[i] = '<a href="'+ _ret +'">'+_match5a[i]+'<\/a>';          
        }
      }      
      //------------------------- V --------------------------------      
      let _match4a = _conStr.match(breRegex_part2a);
      if (_match4a&&_match4a.length>0)
      {
        _len4a = _match4a.length;        
        for (let i=0;i<_len4a;i++)
        {   
            _conStr = _conStr.replace(_match4a[i], '¦va@'+i+'@va¦');
            let _const_bx=const_bx; let m_exn = m_ex(parseInt(getbIndex(const_bx)), _match4a[i]); if (m_exn>0) _const_bx = rar[m_exn-1];          
            _rep4a[i] = '<a href="'+testBible(_const_bx+" "+const_cx+":"+(_match4a[i].replaceAll(breRegex_ex,'').replaceAll("to","-").replaceAll("and","-").replaceAll(/[^0-9,~‒\-﹣–—―~∼〜]/g,'')),true,'')+'">'+_match4a[i]+'<\/a>';          
        }
      }

      let _ignoreRegex = /(?:[a-zA-Z가-힣\-,])|(?:\(\s*\d+\s*[);])/g; // 절 표시에 있어 '4절' 이런 식 표현만 허용. 4. 4)... 그냥 숫자만 있는 등을 필터링하기 위한 정규식 검사
      let _match4 = _conStr.match(breRegex_part2);
      if (_match4&&_match4.length>0)
      {
        _len4 = _match4.length;        
        for (let i=0;i<_len4;i++)
        {
          let _const_bx=const_bx; let m_exn = m_ex(parseInt(getbIndex(const_bx)), _match4[i]); if (m_exn>0) _const_bx = rar[m_exn-1];
          if (!_match4[i].match(_ignoreRegex)) _rep4[i] = _match4[i]; else
          _rep4[i] = '<a href="'+testBible(const_bx+" "+const_cx+":"+_match4[i].replaceAll(/[()\s]/g,'').replaceAll(breRegex_ex,''),true,'')+'">'+_match4[i]+'<\/a>';
          _conStr = _conStr.replace(new RegExp(breRegex_part2.source, "i"), '#¦v@'+i+'@v¦#');
        }        
      }      
      
      let _match4b = _conStr.match(breRegex_part2b);      
      if (_match4b&&_match4b.length>0)
      {
        _len4b = _match4b.length;               
        for (let i=0;i<_len4b;i++)
        {             
            _conStr = _conStr.replace(_match4b[i], '¦vb@'+i+'@vb¦');       
            let _const_bx=const_bx; let m_exn = m_ex(parseInt(getbIndex(const_bx)), _match4b[i]); if (m_exn>0) _const_bx = rar[m_exn-1];          
            _rep4b[i] = _match4b[i][0]+'<a href="'+testBible(_const_bx+" "+const_cx+":"+(_match4b[i].replaceAll(breRegex_ex,'').replaceAll(/[^0-9]/g,'')),true,'')+'">'+_match4b[i].substr(1,_match4b[i].length-2)+'<\/a>'+_match4b[i][_match4b[i].length-1];          
        }
      }      

      let _match5 = _conStr.match(new RegExp(breRegex_part3.source, "g"));            
      if (_match5&&_match5.length>0)
      {
        _len5 = _match5.length;
        for (let i=0;i<_len5;i++)
        {            
            _conStr = _conStr.replace(_match5[i], '#¦cx@'+i+'@cx¦#');
            let _const_bx=const_bx; let m_exn = m_ex(parseInt(getbIndex(const_bx)), _match5[i]); if (m_exn>0) _const_bx = rar[m_exn-1];
            let query = _const_bx+_match5[i].replaceAll(breRegex_ex,'');
            let _goBible = go_bible(query,true,true); 
            let _ret = _goBible? _goBible:query;
            if (!_goBible) _rep5[i] = _match5[i]; else
            _rep5[i] = '<a href="'+ _ret +'">'+_match5[i]+'<\/a>';          
        }
      }      
    }
    //------------------------ B 변환 ------------------------    
    _rep.forEach(function(value, index) {
        _conStr = _conStr.replace("¦B@"+index+"@B¦", value);
    });    
    for (let i=0;i<_len2;i++)
    {
      _conStr = _conStr.replace(/¦b@(\d+)@b¦/, _rep2[i]);      
    }
    //------------------------ CVADX 변환 ------------------------
    if (_lenx>0)
    {
      for (let i=0;i<_lenx;i++)
      {
        _conStr = _conStr.replace(/#¦D@(\d+)@D¦#/, _repx[i]);        
      }
    }      
    
    if (_len3>0)
    {
      for (let i=0;i<_len3;i++)
      {
        _conStr = _conStr.replace(/#¦C@(\d+)@C¦#/, _rep3[i]);        
      }
    } 
    //--    
    if (_len4a>0)
    {
      for (let i=0;i<_len4a;i++)
      {
        _conStr = _conStr.replace(/¦va@(\d+)@va¦/, _rep4a[i]);        
      }
    }          
    if (_len4>0)
    {
      for (let i=0;i<_len4;i++)
      {
        _conStr = _conStr.replace(/#¦v@(\d+)@v¦#/, _rep4[i]);        
      }
    }
    if (_len4b>0)
    {
      for (let i=0;i<_len4b;i++)
      {
        _conStr = _conStr.replace(/¦vb@(\d+)@vb¦/, _rep4b[i]);        
      }
    }          
    if (_len5>0)
    {
      for (let i=0;i<_len5;i++)
      {
        _conStr = _conStr.replace(/#¦cx@(\d+)@cx¦#/, _rep5[i]);        
      }
    }          
    if (_len5a>0)
    {
      for (let i=0;i<_len5a;i++)
      {
        _conStr = _conStr.replace(/¦ca@(\d+)@ca¦/, _rep5a[i]);        
      }
    }
    //------------------------ HG 변환 ------------------------
    const hgReg = /\b(?:[HG]\s*[0-9]{1,4}[ab]{0,1})/g;
    let _match_hg = _conStr.match(hgReg);
    let _rep_hg = new Array();
    if (_match_hg&&_match_hg.length>0)
    {
      let _len = _match_hg.length;
      for (let i=0;i<_len;i++)
      {        
        _conStr = _conStr.replace(_match_hg[i], '¦HG@'+i+'@HG¦');
        _rep_hg[i] = '<a href="s'+_match_hg[i].replaceAll(' ','')+'">'+_match_hg[i]+'<\/a>';        
      }      
      for (let i=0;i<_len;i++)
      {
        _conStr = _conStr.replace(/¦HG@(\d+)@HG¦/, _rep_hg[i]);        
      }
    }    
    //----------------- 기타 tag 확인 --------------------
    if (_len4p>0)
    {
      for (let i=0;i<_len4p;i++)
      {
        _conStr = _conStr.replace(/¦p@(\d+)@p¦/, _match4p[i]);        
      }
    }           
    if (_len_tags>0)
    {
      for (let i=0;i<_len_tags;i++)
      {
        _conStr = await _conStr.replace(/[¦]{1,3}T@(\d+)@T[¦]{0,3}|[¦]{0,3}T@(\d+)@T[¦]{1,3}/, _match_tags[i]);
      }
    }          
    if (_len_out>0)
    {
      for (let i=0;i<_len_out;i++)
      {
        _conStr = await _conStr.replace(/[¦]{1,3}O@(\d+)@O[¦]{0,3}|[¦]{0,3}O@(\d+)@O[¦]{1,3}/, _match_out[i]);
      }
    }          
    //----------------- a 확인 --------------------
    if (_option==='force' && _match_a_2 && _match_a_2.length>0)
    {
      let len = _match_a_2.length;
      for (let i=0; i<len; i++)
      {
          _conStr = _conStr.replace(/¦A@(\d+)@A¦/, _match_a_2[i]);          
      }    
    }
    else if (_match_a && _match_a.length>0)
    {        
      let len = _match_a.length;
      for (let i=0; i<len; i++)
      {
          _conStr = _conStr.replace(/¦A@(\d+)@A¦/, _match_a[i]);          
      }    
    }    
    //---------------------------- 변환 완료 처리 -------------------------------------
    _element.innerHTML = await _conStr;
    let atags = _element.getElementsByTagName('a');    
    if (_loaded) Alert('성구 인식 변환 완료');         
    if (!contentBCVconvertedStr && _element == g_content) contentBCVconvertedStr = _conStr.toString();
    if (_selOption) _selOption.textContent = '성구인식 취소';
    isBCVconverted = true;
    return true;

    //--------------------------변환 참조용 내부 함수-----------------------------------
    function m_ex(bible_num, ex_string)
    {      
      if (ex_string.includes('전서')||ex_string.includes('상'))
      {
        if (bible_num==60||bible_num==61) return 60; //베드로
        if (bible_num==54||bible_num==55) return 54; //디모데
        if (bible_num==52||bible_num==53) return 52; //데살로니가
        if (bible_num==46||bible_num==47) return 46; //고린도
        if (bible_num==13||bible_num==14) return 13; //역대
        if (bible_num==11||bible_num==12) return 11; //열왕기
        if (bible_num==9||bible_num==10) return 9; //사무엘
      }
      else if (ex_string.includes('후서')||ex_string.includes('하'))
      {        
        if (bible_num==60||bible_num==61) return 61; //베드로
        if (bible_num==54||bible_num==55) return 55; //디모데
        if (bible_num==52||bible_num==53) return 53; //데살로니가
        if (bible_num==46||bible_num==47) return 47; //고린도
        if (bible_num==13||bible_num==14) return 14; //역대
        if (bible_num==11||bible_num==12) return 12; //열왕기
        if (bible_num==9||bible_num==10) return 10; //사무엘
      }
      else if (ex_string.includes('1서')||ex_string.includes('일서'))
      {        
        if (bible_num==62||bible_num==63||bible_num==64) return 62; //요한서신        
      }
      else if (ex_string.includes('2서')||ex_string.includes('이서'))
      {
        if (bible_num==62||bible_num==63||bible_num==64) return 63; //요한서신        
      }
      else if (ex_string.includes('3서')||ex_string.includes('삼서'))
      {
        if (bible_num==62||bible_num==63||bible_num==64) return 64; //요한서신        
      }
      return 0;
    }
  }
//#endregion
