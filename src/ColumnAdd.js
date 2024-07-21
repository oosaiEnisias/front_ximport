
export default function ColumnAdd({columnTrList, updateColumnTrList, activeRow, setActiveRow}) {
    // const [activeRow, setActiveRow] = useState({id: null, btn: null, rangeStartFlg: true});

    const groups = [
        {value: '1', label: '親'}
        , {value: '2', label: '子'}
        , {value: null, label: '--'}
    ];
    
    // 列追加ColumnTrLine
    function ColumnTrLine({id, head, position, range, group, fixed}) {
        return (
            <tr id={id}>
                <td className='tdCenter Wid20'>
                    <input type="text" defaultValue={head.val} className="Wid50" onBlur={e => {targetChangeVal(id, 'head', e)}} disabled={fixed.val !== ''} />
                    <button className={`MgL5 ${head.color}`} onClick={e => {targetBtnOn(id, 'head', e)}} disabled={fixed.val !== ''} >ヘッダ指定</button>
                </td>
                <td className='tdCenter Wid20'>
                    <input type="text" defaultValue={position.val} className="Wid50" onBlur={e => {targetChangeVal(id, 'position', e)}} disabled={fixed.val !== ''} />
                    <button className={`MgL5 ${position.color}`} onClick={e => {targetBtnOn(id, 'position', e)}} disabled={fixed.val !== ''}>列位置指定</button>
                </td>
                <td className='tdCenter Wid20'>
                    <input type="text" defaultValue={range.val} className="Wid50" onBlur={e => {targetChangeVal(id, 'range', e)}} disabled={fixed.val !== '' || group.val === '1'} />
                    <button className={`MgL5 ${range.color}`} onClick={e => {targetBtnOn(id, 'range', e)}} disabled={fixed.val !== '' || group.val === '1'}>範囲指定</button>
                </td>
                <td className='tdCenter Wid20'>
                    {/* TODO: */}
                    {/* <input type="checkbox" checked={parentGroup} /> */}
                    <select defaultValue={group.val} onChange={e => {targetChangeVal(id, 'group', e)}} disabled={fixed.val !== ''}>
                        <option value={null}> -- </option>
                        <option value="1">親</option>
                        <option value="2">子</option>
                        {/* <option value="3">固定値</option> */}
                    </select>
                </td>
                <td className='tdCenter Wid20'>
                    <input type="text" defaultValue={fixed.val} onBlur={e => {targetChangeVal(id, 'fixed', e)}} disabled={group.val === '1'} />
                </td>
            </tr>
        );
    }

    // 入力値変更処理
    function targetChangeVal(id, btnName, e) {
        e.stopPropagation(); 
        e.preventDefault();
        updateColumnTrList(draft => {
            const tr = draft.find(a => a.id === id);
            tr[btnName].val = e.target.value;
        });
    }

    // ボタン押下時動作
    function targetBtnOn(id, btnName, e) {
        e.stopPropagation(); e.preventDefault();

        setActiveRow({id: id, btn: btnName, rangeStartFlg: true});
        // let btnList = ['head', 'position', 'range', 'group'];
        let btnList = ['head', 'position', 'range'];        
        updateColumnTrList(draft => {
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
                return d;
            });            
        });
    }

    // ヘッダ追加ボタン押下時
    function columnTrAddButton(e) {
        e.stopPropagation(); e.preventDefault();
        let id = 'column' + columnTrList.length;
        // let id = 'testMan';
        updateColumnTrList([
            ...columnTrList,
            {id, head: {val: null, color: null}, position: {val: '', color: null}, range: {val: null, color: null}, group: {val: null}, fixed: {val: ''}}
        ]);
    }

    function TrLineDisplay({tr}) {
        if(Array.isArray(tr) === true && tr.length > 0) {
            let trListDisplay = columnTrList.map((obj) => {
            return (<ColumnTrLine 
                    key={obj.id}
                    id={obj.id}
                    head={obj.head}
                    position={obj.position}
                    range={obj.range}
                    group={obj.group}
                    fixed={obj.fixed}
                />);
            });
            return trListDisplay;
        }
    }

    
    return (
        <>
            <div className='Pd10'>
                <span><button onClick={columnTrAddButton}>ヘッダ追加</button></span>
                <div>項目タイプでグループ（親・子）または固定値を選択できます。</div>
                <div>親：親の列分レコードを作成します。親は子の列数と一致する必要があります。（横軸対応）</div>
                <div>子：親と同数の列が指定される必要があります。</div>
                <div>固定値：列、ヘッダ範囲は不要で、常に同じ値がレコードに入ります</div>
            </div>
            <table>
                <thead>
                    <th className='tdCenter'>ヘッダ</th>
                    <th className='tdCenter'>列位置</th>
                    <th className='tdCenter'>ヘッダ範囲</th>
                    <th className='tdCenter'>項目タイプ</th>
                    <th className='tdCenter'>固定値</th>
                </thead>
                <tbody>
                    <TrLineDisplay tr={columnTrList} />
                </tbody>
            </table>
        </>
    );
}