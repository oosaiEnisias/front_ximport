import * as XLSX from 'xlsx';
import { useState, useRef } from 'react';
// import { useImmer } from 'use-immer';

export default function ReadBook({columnTrList, updateColumnTrList, activeRow, setActiveRow}) {
    // エクセルテーブル表示用
    const [tableObjData, setTableObjData] = useState(null);
    // 最終行
    const [lastRowNum, setLastRowNum] = useState(0);
    // シート名
    const [sheetNameList, setSheetNameList] = useState(null);
    // エクセル表以外のデータ
    const excelOtherData = useRef({
        // ファイル名
        fileName: ""
        // シート名
        , sheetName: ""
        // 選択シート名
        , selectSheet: ""
        // シート表示範囲
        , rangeStart: ""
        , rangeEnd: ""
        // 列リスト
        , columnList: new Set()
    });
    // workbook
    const [workbook, setWorkBook] = useState(null);
    // regex
    const regex = new RegExp(/[^0-9]/g);
    const alphaRegex = new RegExp(/[^A-Z]/g);

    // ファイル変更
    function changeFile(e) {
        e.stopPropagation(); e.preventDefault();
        var file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
        
            var tempWorkbook = XLSX.read(data);
            // workBookの保存
            setWorkBook(tempWorkbook);

            // シート名リストを取得
            setSheetNameList(tempWorkbook.SheetNames);

            // シート名に紐づくシートを取得
            let sheetName = tempWorkbook.SheetNames[0];

            // シート名設定
            excelOtherData.current.selectSheet = sheetName;

            // workSheetsの情報をすべて取得
            let tempTable = tempWorkbook.Sheets[sheetName];

            getWorkBookData(tempTable, 'all');
        };
        reader.readAsArrayBuffer(file);
    }

    // エクセルファイルデータ取得
    function getWorkBookData(tempTable, getType) {
        // 最終行設定
        let ref = tempTable['!ref'].split(':');
        setLastRowNum(Number((ref[1]).replace(/[a-z]/gi, '')));

        // カラムリストのリセット
        excelOtherData.current.columnList.clear();
        
        let ttTable = null;
        let sheetRange = null;

        if(getType === 'all') {
            sheetRange = XLSX.utils.decode_range(tempTable["!ref"]);
        }
        else if(getType === 'range') {
            sheetRange = XLSX.utils.decode_range(excelOtherData.current.rangeStart + ':' + excelOtherData.current.rangeEnd);
        }
        ttTable = getPointingRange(tempTable, sheetRange);

        let tempColumn = {No: {w: "No"}};
        // let setArray = (Array.from(excelOtherData.current.columnList)).sort();
        // TODO:バグあり。エクセル表通りに並んでない
        let setArray = (Array.from(excelOtherData.current.columnList));
        for(const item of setArray) {
            tempColumn[item] = {w: item};
        }

        // TODO:
        setTableObjData(Object.assign({0: tempColumn}, ttTable));

        // TODO:列データ削除
        updateColumnTrList([]);
    }


    // 範囲指定のデータ取得
    function getPointingRange(tempTable, sheetRange) {
        let tKey = null;
        // let regex = new RegExp(/[^0-9]/g);
        let tTable = {};

        let address;
        let cell;
        // TODO:要考慮
        // let merges = tempTable["!merges"];

        for(var cIndex = sheetRange.s.c; cIndex <= sheetRange.e.c; cIndex++) {
            for(var rIndex = sheetRange.s.r; rIndex <= sheetRange.e.r; rIndex++) {
                address = XLSX.utils.encode_cell({r: rIndex, c:cIndex});
                cell = tempTable[address];

                // 数値のみ切り出し
                tKey = address.replace(regex, '');

                if(typeof cell !== "undefined") {
                    tTable = setTableColum(tTable, tKey, address, regex, tempTable);
                    // // TODO:要考慮
                    // if(merges !== undefined) {
                    //     for(let mCell of merges) {
                    //         // マージセルの最初にあたった場合
                    //         if(mCell.s.c === cIndex && mCell.s.r === rIndex) {
                                
                    //         }
                    //     }
                    // }
                    // // 数字のみ抜き出し
                    // tKey = address.replace(regex, '');

                    // // 数字をテーブルキーに設定
                    // if(tTable[tKey] === undefined) {
                    //     tTable[tKey] = {No: tKey};
                    // }
                    // tTable[tKey][address] = tempTable[address];
                } else {
                    if(tTable[tKey] === undefined) {
                        tTable[tKey] = {No: {w: tKey, className: ''}};
                    }
                    tTable[tKey][address] = {w: null}; 
                }

                // スタイル追加
                tTable[tKey][address]['className'] = '';
            }
        }

        return tTable;
    }

    // 表項目に値を設定
    function setTableColum(tTable, tKey, key, regex, tempTable) {
        // let alphaRegex = new RegExp(/[^A-Z]/g);
        let alphaColumn = null;

        // 数字のみ抜き出し
        tKey = key.replace(regex, '');
        // 英語のみ抜き出し
        alphaColumn = key.replace(alphaRegex, '');

        // 数字をテーブルキーに設定
        if(tTable[tKey] === undefined) {
            tTable[tKey] = {No: {w: tKey, className: ''}};
        }
        tTable[tKey][key] = tempTable[key];

        if(alphaColumn !== '') {
            // カラムリストに追加
            excelOtherData.current.columnList.add(alphaColumn);
        }

        return tTable;
    }

    // 範囲指定のデータ取得後再描画
    function selectRange(e) {
        e.stopPropagation(); e.preventDefault();

        // workSheetsの情報をすべて取得
        let tempTable = workbook.Sheets[excelOtherData.current.selectSheet];

        getWorkBookData(tempTable, 'range');
    }

    // シート変更
    function changeFileSheet(e) {
        e.stopPropagation(); e.preventDefault();
        
        // シート名に紐づくシートを取得
        let sheetName = workbook.SheetNames[e.target.value];

        // 現在シート名設定
        excelOtherData.current.selectSheet = sheetName;
        // workSheetsの情報をすべて取得
        let tempTable = workbook.Sheets[sheetName];
        // workbook取り直し
        getWorkBookData(tempTable, 'all');
    }


    var htmlDisplay = <tr><td>test</td></tr>;
    // var trListDisplay = <tr><td>test</td></tr>;
    var sheetNameOption = <option value=""> --- </option>;

    // エクセル表表示
    if(typeof(tableObjData) === 'object' && tableObjData != null) {
        htmlDisplay = Object.entries(tableObjData).map(([key,val]) => {
            return (
                    <tr id={key} className={`Tr${key}`}>
                        {
                            Object.entries(val).map(([k, v]) => {
                                return (<td id={k} className={`Td${k} ${v['className']}`} onClick={e => {tableTdClick(e, v['w'], k)}}>{v['w']}</td>)
                            })
                        }
                    </tr>
            );
        });
    }
    // シート名設定
    if(typeof(sheetNameList) === 'object' && sheetNameList != null) {
        sheetNameOption = Object.entries(sheetNameList).map(([key, value]) => {
            return <option value={key}>{value}</option>;
        });
    }

    // 表示しているTdのクリック
    function tableTdClick(e, val, position) {
        e.stopPropagation(); e.preventDefault();

        let activeRowBtn = null;
        if(activeRow.id !== null) {
            activeRowBtn = activeRow.btn;
            if(activeRow.btn === 'head') {
                updateColumnTrList(draft => {
                    const tr = draft.find(a => a.id === activeRow.id);
                    tr[activeRow.btn].val = val;
                    tr.position.val = position;
                });
            }
            else if(activeRow.btn === 'position') {
                updateColumnTrList(draft => {
                    const tr = draft.find(a => a.id === activeRow.id);
                    if(tr.position.val !== '') {
                        tr.position.val += ',';
                    }
                    tr.position.val += position;
                });
            }
            else if(activeRow.btn === 'range') {
                if(activeRow.rangeStartFlg) {
                    updateColumnTrList(draft => {
                        const tr = draft.find(a => a.id === activeRow.id);
                        tr.range.val = '';
                        tr.range.val = position;
                    });
                }
                else {
                    updateColumnTrList(draft => {
                        const tr = draft.find(a => a.id === activeRow.id);
                        tr.range.val = tr.range.val + '-' + position;
                    });
                }
            }
            // 現在行変更
            setActiveRow({id: activeRow.id, btn: activeRow.btn, rangeStartFlg: !activeRow.rangeStartFlg});            
        }

        // TODO:以下だと、columnTrListが更新されてなくて、一つ前のデータが更新されている
        // １．カラム指定配列から、列位置として指定された値を配列に取得
        let colorArr = [];
        for(const trItem of columnTrList) {
            colorArr.push(trItem['position']['val']);
        }
        // let colorPosition = [];
        // ２．テーブルオブジェクトから１で取得した以外のクラス名をすべてclassNameの値を削除
        // 　　指定されているクラス名はヘッダで更新
        Object.entries(tableObjData).map(([key, val]) => {
            Object.entries(val).map(([k, v])=>{
                if(colorArr.includes(k)) {
                // colorPosition = colorArr.filter(posi => posi.indexOf(k) !== -1);
                // if(colorPosition.length > 0) {
                    if(activeRowBtn === 'head') {
                        v.className = 'HeadStyle';
                    }
                    // if(activeRowBtn === 'range') {
                    //     colorPosition = colorPosition[0].split('-');
                    //     // アルファベット取得
                    //     // 開始数取得
                    //     // 終了数取得
                    //     // 開始～終了まで色付け
                    // }
                } else {
                    v.className = '';
                }
            });
        });
        // テーブル更新
        setTableObjData(tableObjData);
    }




    
    function changeRangeStart(e) {
        excelOtherData.current.rangeStart = e.target.value;
    }

    function changeRangeEnd(e) {
        excelOtherData.current.rangeEnd = e.target.value;
    }
    
    // function execApex(e) {
    //     e.stopPropagation(); e.preventDefault();

    //     // TODO:
    //     console.log('columnTrList ===============================');
    //     console.log(columnTrList);

    //     // methodOneInJavascript(columnTrList);
    //     // const apex = new Apex(columnTrList);
    //     // apex.methodOneInJavascript();
    // }

    // =======================================================================================
    // 画面表示
    return (
        <>
            <div className='ColumnDiv'>
                {/* エクセル表示 */}
                <div className="Pd10">
                    {/* 一行目領域 */}
                    <div>
                        {/* ファイル選択 */}
                        <span className='Pd10'>
                            <input type="file" id="fileUpload" name="fileUpload" onChange={changeFile} /> 
                        </span>
                        {/* シート名選択 */}
                        <span className='Pd10'>
                            シート名選択：<select onChange={changeFileSheet}>
                                {sheetNameOption}                           
                            </select>
                        </span>
                        {/* 表示範囲指定 */}
                        <span className='Pd10'>
                            <span className='PdR5'>
                                <button onClick={selectRange}>
                                    表示範囲指定
                                </button>
                            </span>
                            <input type="text" id="rangeTop" name="rangeTop" value={excelOtherData.rangeStart} onChange={changeRangeStart} size="3" />：
                            <input type="text" id="rangeEnd" name="rangeEnd" value={excelOtherData.rangeEnd} onChange={changeRangeEnd} size="3" />
                        </span>
                    </div>
                    {/* 一行目領域の終わり */}
                    <div className='Pd10'>
                        エクセル表示領域：最終行：{lastRowNum}
                        <table className='ExcelHtmlDisplay'>
                            {htmlDisplay}
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

// function methodOneInJavascript(columnTrList) {
// }

// class Apex {
//     constructor(columnTrList) {
//         this.colTrList = columnTrList;
//     }
//     methodOneInJavascript() {};     
// }