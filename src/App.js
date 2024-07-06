import './base.css';
// import { read } from 'xlsx';
import * as XLSX from 'xlsx';
import { useState, useRef } from 'react';
import { useImmer } from 'use-immer';

export default function App() {
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
    // 列項目リスト
    // const [columnTrList, setColumnTrList] = useState([]);
    const [columnTrList, updateColumnTrList] = useImmer([]);
    const [activeRow, setActiveRow] = useState({id: null, btn: null, rangeStartFlg: true});

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

        // TODO:列データ削除
        updateColumnTrList([]);
    }


    // 範囲指定のデータ取得
    function getPointingRange(tempTable, sheetRange) {
        let tKey = null;
        let regex = new RegExp(/[^0-9]/g);
        let tTable = {};

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

    // 表項目に値を設定
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
                                return (<td id={k} className={`Td${k}`} onClick={e => {tableTdClick(e, v['w'], k)}}>{v['w']}</td>)
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
        if(activeRow.id !== null) {
            if(activeRow.btn === 'head') {
                updateColumnTrList(draft => {
                    const tr = draft.find(a => a.id === activeRow.id);
                    tr[activeRow.btn].val = val;
                    tr.position.val = position;
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
    }

    // TODO:不要になったら消す
    // // カラム列Tr表示
    // if(Array.isArray(columnTrList) === true && columnTrList.length > 0) {
    //     trListDisplay = columnTrList.map((obj) => {
    //         return (<ColumnTrLine 
    //             id={obj.id}
    //             headVal={obj.headVal}
    //             position={obj.position}
    //             range={obj.range}
    //             parentGroup={obj.parentGroup}
    //         />);
    //     });
    // }

    function TrLineDisplay({tr}) {
        if(Array.isArray(tr) === true && tr.length > 0) {
            let trListDisplay = columnTrList.map((obj) => {
            return (<ColumnTrLine 
                    id={obj.id}
                    head={obj.head}
                    position={obj.position}
                    range={obj.range}
                    parentGroup={obj.parentGroup}
                />);
            });
            return trListDisplay;
            // trListDisplay = 
        //     return (
        //     <>
        //         {
        //             tr.map((obj) => {
        //                 <ColumnTrLine 
        //                     id={obj.id}
        //                     headVal={obj.headVal}
        //                     position={obj.position}
        //                     range={obj.range}
        //                     parentGroup={obj.parentGroup}
        //                 />
        //             })
        //         }
        //     </>            
        // );
        }
    }

    
    function changeRangeStart(e) {
        excelOtherData.current.rangeStart = e.target.value;
    }

    function changeRangeEnd(e) {
        excelOtherData.current.rangeEnd = e.target.value;
    }

    // function ColumnAdd() {
    //     return (
    //         <>
    //             <div className='Pd10'>
    //                 <span><button>ヘッダ追加</button></span>
    //             </div>
    //             <div className='Container Pd10'>
    //                 <div>
    //                     <div>ヘッダ</div>
    //                     <div><input type="text" value="部門CD" /></div>
    //                 </div>
    //                 <div>
    //                     <div>列位置</div>
    //                     <div>
    //                         <input type="text" value="B172" className='Wid30' />
    //                         <button className='MgL5'>列位置指定</button>
    //                     </div>
    //                 </div>
    //                 <div>
    //                     <div>ヘッダに紐づく範囲</div>
    //                     <div>
    //                         <input type="text" value="B185-191" className='Wid30' />
    //                         <button className='MgL5'>範囲指定</button>
    //                     </div>
    //                 </div>
    //                 <div>
    //                     <div>親グループ</div>
    //                     <div><input type="checkbox" value="true" /></div>
    //                 </div>
    //             </div>
    //         </>
    //     );
    // }


    // 列指定領域
    function ColumnAdd() {
        return (
            <>
                <div className='Pd10'>
                    <span><button onClick={columnTrAddButton}>ヘッダ追加</button></span>
                </div>
                <table>
                    <thead>
                        <th className='tdCenter'>ヘッダ</th>
                        <th className='tdCenter'>列位置</th>
                        <th className='tdCenter'>ヘッダ範囲</th>
                        <th className='tdCenter'>親グループ</th>
                    </thead>
                    <tbody>
                        <TrLineDisplay tr={columnTrList} />
                    </tbody>
                </table>
            </>
        );
    }

    // ヘッダ追加ボタン押下時
    function columnTrAddButton() {
        let id = 'column' + columnTrList.length;
        updateColumnTrList([
            ...columnTrList,
            {id, head: {val: null, color: null}, position: {val: null, color: null}, range: {val: null, color: null}, parentGroup: null}
        ]);
    }

    // 列追加ColumnTrLine
    function ColumnTrLine({id, head, position, range, parentGroup}) {
        // let no = columnTrList.length;
        // let headValColor = headVal.color === 'ActiveButton' ? '' : 'ActiveButton';

        return (
            <tr key={id}>
                <td className='tdCenter'>
                    <input type="text" value={head.val} className='Wid30' onChange={e => {targetChangeVal(id, 'head', e)}} />
                    <button className={`MgL5 ${head.color}`} onClick={e => {targetBtnOn(id, 'head', e)}}>ヘッダ指定</button>
                </td>
                <td className='tdCenter'>
                    <input type="text" value={position.val} className='Wid30' onChange={e => {targetChangeVal(id, 'position', e)}} />
                    <button className={`MgL5 ${position.color}`} onClick={e => {targetBtnOn(id, 'position', e)}}>列位置指定</button>
                </td>
                <td className='tdCenter'>
                    <input type="text" value={range.val} className='Wid30' onChange={e => {targetChangeVal(id, 'range', e)}} />
                    <button className={`MgL5 ${range.color}`} onClick={e => {targetBtnOn(id, 'range', e)}}>範囲指定</button>
                </td>
                <td className='tdCenter'>
                    <input type="checkbox" checked={parentGroup} />
                </td>
            </tr>
        );
    }

    // // ヘッダを指定する処理
    // function targetHead(id) {
    //     updateColumnTrList(draft => {
    //         const tr = draft.find(a => a.id === id);
    //         tr.head.color = 'ActiveButton';
    //         tr.position.color = 'ActiveButton';
    //         tr.range.color = 'ActiveButton';
    //     });
    // }
    function targetBtnOn(id, btnName, e) {
        e.stopPropagation(); e.preventDefault();

        setActiveRow({id: id, btn: btnName, rangeStartFlg: true});
        let btnList = ['head', 'position', 'range'];        
        updateColumnTrList(draft => {
            // const tr = draft.find(a => a.id === id);
            draft.map(d => {
                if(d.id === id) {
                    for(const btn of btnList) {
                        if(btn === btnName) {
                            d[btn].color = 'ActiveButton';
                        }
                        else {
                            d[btn].color = '';
                        }
                    }
                }
                else {
                    d.head.color = '';
                    d.position.color = '';
                    d.range.color = '';
                }
            });            
        });
    }

    function targetChangeVal(id, btnName, e) {
        e.stopPropagation(); e.preventDefault();
        updateColumnTrList(draft => {
            const tr = draft.find(a => a.id === id);
            tr[btnName].val = e.target.value;
        });
    }
    


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
                {/* 取込列指定 */}
                <div className="Pd10">
                    <ColumnAdd />                   
                </div>
            </div>
        </>
    );
}