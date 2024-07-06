import './base.css';
// import { read } from 'xlsx';
import * as XLSX from 'xlsx';
import { useState, useRef } from 'react';
// // react-bootstrap
// import Table from 'react-bootstrap/Table';

// let workbook;
// let tableObjData = null;
// // 最終行数
// let lastRowNum = 1;

export default function App() {
    // エクセルテーブル表示用
    const [tableObjData, setTableObjData] = useState(null);
    // const [displayTable, setDisplayTable] = useState(null);
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
    // let appTableData = null;
    // workbook
    const [workbook, setWorkBook] = useState(null);

    // ファイル変更
    function changeFile(e) {
        // // 動的テーブル削除
        // $('#dynamic_table_id1').remove();
    
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
        // reader.readAsBinaryString(e.target.files[0]);
        reader.readAsArrayBuffer(file);
        // // ファイル名表示
        // $('#uploadFileNameDisplay').text(file.name);
    }

    // エクセルファイルデータ取得
    function getWorkBookData(tempTable, getType) {
        // 最終行設定
        let ref = tempTable['!ref'].split(':');
        setLastRowNum(Number((ref[1]).replace(/[a-z]/gi, '')));

        // カラムリストのリセット
        excelOtherData.current.columnList.clear();

        // delete tempTable['!ref'];
        // delete tempTable['!margins'];
        
        let ttTable = null;
        let sheetRange = null;

        if(getType === 'all') {
            // TODO:削除予定
            // setTableObjData(tTable);
            // ttTable = getAllData(tempTable);
            sheetRange = XLSX.utils.decode_range(tempTable["!ref"]);
        }
        else if(getType === 'range') {
            sheetRange = XLSX.utils.decode_range(excelOtherData.current.rangeStart + ':' + excelOtherData.current.rangeEnd);
            // ttTable = getPointingRange(tempTable, sheetRange);
        }
        ttTable = getPointingRange(tempTable, sheetRange);

        // setTableObjData(ttTable);

        let tempColumn = {No: {w: "No"}};
        // let setArray = (Array.from(excelOtherData.current.columnList)).sort();
        // TODO:バグあり。エクセル表通りに並んでない
        let setArray = (Array.from(excelOtherData.current.columnList));
        for(const item of setArray) {
            tempColumn[item] = {w: item};
        }

        // TODO:
        setTableObjData(Object.assign({0: tempColumn}, ttTable));
    }

    // TODO:
    // // 全データ取得
    // function getAllData(tempTable) {
    //     let tKey = null;
    //     let regex = new RegExp(/[^0-9]/g);
    //     let tTable = {};

    //     for(let key in tempTable) {
    //         tTable = tTable = setTableColum(tTable, tKey, key, regex, tempTable);
    //         // // 数字のみ抜き出し
    //         // tKey = key.replace(regex, '');

    //         // // 数字をテーブルキーに設定
    //         // if(tTable[tKey] === undefined) {
    //         //     tTable[tKey] = {No: {w: tKey}};
    //         // }
    //         // tTable[tKey][key] = tempTable[key];
    //     }

    //     return tTable;
    // }

    // 範囲指定のデータ取得
    function getPointingRange(tempTable, sheetRange) {
        let tKey = null;
        let regex = new RegExp(/[^0-9]/g);
        let tTable = {};

        // TODO:
        // まずは数字で範囲を指定する①
        // let sheetRange = XLSX.utils.decode_range("A170:J199");
        // 現在のシート範囲を取得
        // let sheetRange = XLSX.utils.decode_range(excelOtherData.current.rangeStart + ':' + excelOtherData.current.rangeEnd);        
        
        let address;
        let cell;
        // TODO:要考慮
        // let merges = tempTable["!merges"];

        for(var cIndex = sheetRange.s.c; cIndex <= sheetRange.e.c; cIndex++) {
            for(var rIndex = sheetRange.s.r; rIndex <= sheetRange.e.r; rIndex++) {
                address = XLSX.utils.encode_cell({r: rIndex, c:cIndex});
                cell = tempTable[address];

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
                    // 数値のみ切り出し
                    tKey = address.replace(regex, '');
                    if(tTable[tKey] === undefined) {
                        tTable[tKey] = {No: {w: tKey}};
                    }
                    tTable[tKey][address] = {w: null}; 
                }
            }
        }

        return tTable;
    }

    function setTableColum(tTable, tKey, key, regex, tempTable) {
        let alphaRegex = new RegExp(/[^A-Z]/g);
        let alphaColumn = null;

        // 数字のみ抜き出し
        tKey = key.replace(regex, '');
        // 英語のみ抜き出し
        alphaColumn = key.replace(alphaRegex, '');

        // 数字をテーブルキーに設定
        if(tTable[tKey] === undefined) {
            tTable[tKey] = {No: {w: tKey}};
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


    // // ファイル表示
    // function excelDisplay() {
    //     // // TODO:
    //     // console.log('tableObjData ===============================');
    //     // console.log(tableObjData);
    //     // let tempTableDisplay = Object.entries(tableObjData).map(([key,val]) => {
    //     //     return <tr><td id={key}>{val}</td></tr>;
    //     // });
    //     // setDisplayTable(tempTableDisplay);
    // }


    var htmlDisplay = <tr><td>test</td></tr>;
    var sheetNameOption = <option value=""> --- </option>;

    // エクセル表表示
    if(typeof(tableObjData) === 'object' && tableObjData != null) {
        htmlDisplay = Object.entries(tableObjData).map(([key,val]) => {
            return (
                    <tr id={key} className={`Tr${key}`}>
                        {
                            Object.entries(val).map(([k, v]) => {
                                return (<td id={k} className={`Td${k}`}>{v['w']}</td>)
                            })
                        }
                    </tr>
            );
            // return <tr><td id={key}>{val['v']}</td></tr>;
        });
    }
    // シート名設定
    if(typeof(sheetNameList) === 'object' && sheetNameList != null) {
        sheetNameOption = Object.entries(sheetNameList).map(([key, value]) => {
            return <option value={key}>{value}</option>;
        });
    }
    
    function changeRangeStart(e) {
        excelOtherData.current.rangeStart = e.target.value;
    }

    function changeRangeEnd(e) {
        excelOtherData.current.rangeEnd = e.target.value;
    }

    return (
        <>
            <div className="Pd10">
                <div>
                    <span className='Pd10'>
                        <input type="file" id="fileUpload" name="fileUpload" onChange={changeFile} /> 
                    </span>
                    <span className='Pd10'>
                        シート名選択：<select onChange={changeFileSheet}>
                            {sheetNameOption}                           
                        </select>
                    </span>
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
                <div className='Pd10'>
                    エクセル表示領域：
                </div>
                <div>
                    {lastRowNum} /
                </div>
                <div>
                    <table className='ExcelHtmlDisplay'>
                        {htmlDisplay}
                    </table>
                </div>
            </div>
        </>
    );
}