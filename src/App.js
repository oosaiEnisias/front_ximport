import './base.css';
// import { read } from 'xlsx';
import { useState, useEffect } from 'react';
import { useImmer } from 'use-immer';

import ReadBook from './ReadBook'
import ColumnAdd from './ColumnAdd';

const head = document.getElementsByTagName('head')[0];
const dataUrl = document.createElement('reactDataTag');


export default function App() {
    const [columnTrList, updateColumnTrList] = useImmer([]);
    const [activeRow, setActiveRow] = useState({id: null, btn: null, rangeStartFlg: true});

    var ScriptAreaAdd = () => {    
        useEffect(() => {
            dataUrl.dataset.reactData = JSON.stringify(columnTrList);
            head.appendChild(dataUrl);
        }, [columnTrList]);
    };

    // =======================================================================================
    // 画面表示
    return (
        <>
            <div className='ColumnDiv'>
                {/* エクセル表示 */}
                <div className="Pd10">
                    <ReadBook 
                        columnTrList={columnTrList}
                        updateColumnTrList={updateColumnTrList}
                        activeRow={activeRow}
                        setActiveRow={setActiveRow}
                    />
                </div>
                {/* 取込列指定 */}
                <div className="Pd10 Wid700px">
                    <ColumnAdd 
                        columnTrList={columnTrList}
                        updateColumnTrList={updateColumnTrList}
                        activeRow={activeRow}
                        setActiveRow={setActiveRow}
                    />
                    <ScriptAreaAdd />
                </div>
            </div>
        </>
    );
}