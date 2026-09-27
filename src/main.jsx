import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import'./styles.css';

// 本地存档分键整理：资料 / 判定（复盘卡）/ 存档快照 各自独立存储
const KEYS={profile:'campaign-log',debriefs:'campaign-debriefs',archive:'campaign-archive'};

const seed={
  name:'暮光边境',system:'D&D 5E',
  sessions:[
    {id:1,date:'2024-06-08',title:'第一章：灰港的钟声',summary:'队伍抵达灰港，在失落的钟楼发现了神秘符文。',tag:'主线',color:'#d8a153',prep:'已就绪'},
    {id:2,date:'2024-06-15',title:'第二章：雾中来客',summary:'与流浪法师伊琳结盟，追踪海雾中的脚印。',tag:'主线',color:'#93b7a6',prep:'已就绪'},
    {id:3,date:'2024-06-22',title:'支线：深林采药',summary:'帮助村民寻找月光草，获得一枚古老铜币。',tag:'支线',color:'#b9a6d1',prep:'准备中'}
  ],
  characters:[
    {name:'艾德里安',role:'圣骑士',player:'林默',color:'#d8a153'},
    {name:'瑟琳',role:'游侠',player:'安然',color:'#93b7a6'},
    {name:'莫尔',role:'术士',player:'周岳',color:'#b9a6d1'}
  ]
};

const load=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?f:v}catch{return f}};
const blankCard=()=>({status:'pending',entries:{},main:'',side:'',history:[]});
const PREP=['未准备','准备中','已就绪'];
const now=()=>new Date().toLocaleString('zh-CN',{hour12:false});
// 结算条件：每位玩家的高光与下章打算都已认领，且主线、支线各至少一个推进点
const cardComplete=(c,chars)=>!!(c.main.trim()&&c.side.trim())&&chars.every(ch=>(c.entries[ch.name]?.highlight||'').trim()&&(c.entries[ch.name]?.next||'').trim());

function App(){
  const[data,setData]=useState(()=>load(KEYS.profile,seed));
  const[debriefs,setDebriefs]=useState(()=>load(KEYS.debriefs,{}));
  const[archive,setArchive]=useState(()=>load(KEYS.archive,[]));
  const[tab,setTab]=useState('timeline');
  const[active,setActive]=useState(1);
  const[show,setShow]=useState(false);
  const[notice,setNotice]=useState('');
  const[form,setForm]=useState({title:'',date:'2024-07-01',summary:'',tag:'主线',prep:'未准备'});
  const[draft,setDraft]=useState(null);   // 正在编辑的复盘卡草稿
  const[reason,setReason]=useState('');   // 改动已结算卡片时必须填写的原因

  useEffect(()=>localStorage.setItem(KEYS.profile,JSON.stringify(data)),[data]);
  useEffect(()=>localStorage.setItem(KEYS.debriefs,JSON.stringify(debriefs)),[debriefs]);
  useEffect(()=>localStorage.setItem(KEYS.archive,JSON.stringify(archive)),[archive]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),2600);return()=>clearTimeout(t)},[notice]);

  const cur=data.sessions.find(x=>x.id===active)||data.sessions[0];
  const card=debriefs[cur?.id]||blankCard();
  const editing=draft!==null;

  const add=()=>{
    if(!form.title)return;
    const s={...form,id:Date.now(),color:'#d8a153'};
    setData({...data,sessions:[...data.sessions,s]});
    setActive(s.id);setForm({title:'',date:'2024-07-01',summary:'',tag:'主线',prep:'未准备'});
    setShow(false);setNotice('新章节已加入时间线，记得开战后更新准备情况');
  };

  const cyclePrep=()=>{
    const next=PREP[(PREP.indexOf(cur.prep||'未准备')+1)%PREP.length];
    setData({...data,sessions:data.sessions.map(s=>s.id===cur.id?{...s,prep:next}:s)});
    setNotice(`「${cur.title}」准备情况 → ${next}`);
  };

  const startEdit=()=>{
    const base=JSON.parse(JSON.stringify(card));
    data.characters.forEach(ch=>{base.entries[ch.name]=base.entries[ch.name]||{highlight:'',next:''}});
    setDraft(base);setReason('');
  };

  const saveCard=()=>{
    const prev=debriefs[cur.id];
    if(prev?.status==='done'&&!reason.trim()){setNotice('修改已复盘卡片，请先写明改动原因');return}
    const done=cardComplete(draft,data.characters);
    const record={
      status:done?'done':'pending',
      entries:draft.entries,main:draft.main,side:draft.side,
      // 已结算的卡被改动时，把原卡连原因一起留档
      history:prev?.status==='done'
        ?[...(prev.history||[]),{savedAt:now(),reason:reason.trim(),snapshot:{entries:prev.entries,main:prev.main,side:prev.side}}]
        :(prev?.history||[])
    };
    setDebriefs({...debriefs,[cur.id]:record});
    if(done){
      setArchive([...archive,{at:now(),sessionId:cur.id,title:cur.title,
        spotlight:data.characters.map(ch=>({name:ch.name,highlight:record.entries[ch.name].highlight}))}]);
    }
    setDraft(null);setReason('');
    setNotice(done?'复盘完成，本章已结算并存档':'仍有空缺，本章保持「待复盘」');
  };

  const setEntry=(name,k,v)=>setDraft({...draft,entries:{...draft.entries,[name]:{...draft.entries[name],[k]:v}}});

  const exportData=()=>{
    const pack={exportedAt:now(),资料:data,判定:debriefs,存档:archive};
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}));
    a.download='campaign.json';a.click();
    setNotice('已按 资料 / 判定 / 存档 分块导出');
  };

  const spotlight=ch=>data.sessions.map(s=>({title:s.title,hl:debriefs[s.id]?.entries?.[ch.name]?.highlight||''}));
  const doneCount=id=>debriefs[id]?.status==='done';

  return <div className="shell">
    <aside>
      <div className="logo"><span>✦</span> CAMPAIGNER</div>
      <div className="campaign"><small>当前战役</small><strong>{data.name}</strong><span>{data.system} · 2024</span></div>
      <nav>{[['timeline','◌','时间线'],['characters','♙','角色与阵营'],['places','⌖','地点图鉴'],['loot','◇','战利品']].map(([id,i,t])=>
        <button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}><i>{i}</i>{t}</button>)}
      </nav>
      <div className="side-bottom">
        <button>⚙ 偏好设置</button>
        <div className="storage">
          <small>本地存储 · 分键整理</small>
          <span>资料　{KEYS.profile}</span>
          <span>判定　{KEYS.debriefs}</span>
          <span>存档　{KEYS.archive}（{archive.length}）</span>
        </div>
      </div>
    </aside>
    <main>
      <header>
        <div><span className="crumb">MY CAMPAIGN / {data.system}</span>
          <h1>{tab==='timeline'?'战役时间线':tab==='characters'?'角色与阵营':tab==='places'?'地点图鉴':'战利品'}</h1></div>
        <div className="actions">
          <button onClick={exportData} className="outline">↓ 导出</button>
          <button onClick={()=>setShow(true)} className="primary">＋ 新建章节</button>
        </div>
      </header>

      {tab==='timeline'&&<div className="timeline-layout">
        <section className="timeline">
          <div className="timeline-intro">
            <div><span>THE CHRONICLE</span><h2>记录每一次冒险</h2></div>
            <span className="count">{data.sessions.length} CHAPTERS</span>
          </div>
          {data.sessions.map((s,i)=>
            <button className={'chapter '+(active===s.id?'selected':'')} onClick={()=>{setActive(s.id);setDraft(null)}} key={s.id}>
              <div className="date"><b>{new Date(s.date).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'})}</b><small>{new Date(s.date).getFullYear()}</small></div>
              <div className="line"><span style={{background:s.color}}></span>{i<data.sessions.length-1&&<i/>}</div>
              <div className="chapter-copy">
                <div className="badges">
                  <span className="tag">{s.tag}</span>
                  <span className={'chip p'+PREP.indexOf(s.prep||'未准备')}>{s.prep||'未准备'}</span>
                  <span className={'chip '+(doneCount(s.id)?'ok':'wait')}>{doneCount(s.id)?'已复盘':'待复盘'}</span>
                </div>
                <h3>{s.title}</h3><p>{s.summary}</p>
              </div>
              <span className="arrow">↗</span>
            </button>)}
        </section>

        <section className="detail-panel">
          <div className="detail-cover" style={{background:cur?.color}}>
            <span>CHAPTER {String(data.sessions.findIndex(x=>x.id===active)+1).padStart(2,'0')}</span><i>✦</i>
          </div>
          <div className="detail-body">
            <span className="tag">{cur?.tag}</span>
            <h2>{cur?.title}</h2>
            <p>{cur?.summary}</p>
            <div className="meta-grid">
              <div><small>游戏日期</small><strong>{cur?.date}</strong></div>
              <div><small>参与者</small><strong>{data.characters.length} 位玩家</strong></div>
              <div><small>准备情况</small><button className="prep-cycle" onClick={cyclePrep}>{cur?.prep||'未准备'} ⇄</button></div>
              <div><small>结算状态</small><strong className={card.status==='done'?'ok-text':'wait-text'}>{card.status==='done'?'已复盘':'待复盘'}</strong></div>
            </div>

            <div className="debrief">
              <div className="debrief-head">
                <div><span className="crumb">DEBRIEF</span><h3>章节复盘卡</h3></div>
                <span className={'chip '+(card.status==='done'?'ok':'wait')}>{card.status==='done'?'已复盘':'待复盘'}</span>
              </div>

              {editing?<>
                <p className="hint">每位玩家认领一个本场高光和一条下章想做的事；主线、支线各至少留一个推进点，缺项则保持待复盘。</p>
                {data.characters.map(ch=>{const e=draft.entries[ch.name];return(
                  <div className="player-block" key={ch.name}>
                    <span>{ch.name} · {ch.player}</span>
                    <label>本场高光<input value={e.highlight} onChange={ev=>setEntry(ch.name,'highlight',ev.target.value)} placeholder="这一刻为什么值得记住？"/></label>
                    <label>下章想做<input value={e.next} onChange={ev=>setEntry(ch.name,'next',ev.target.value)} placeholder="下一次开局想推进什么？"/></label>
                  </div>)})}
                <label>主线推进点<textarea rows="2" value={draft.main} onChange={e=>setDraft({...draft,main:e.target.value})} placeholder="主线至少推进了一步什么？"/></label>
                <label>支线推进点<textarea rows="2" value={draft.side} onChange={e=>setDraft({...draft,side:e.target.value})} placeholder="哪条支线有了进展？"/></label>
                {card.status==='done'&&<label className="reason">改动原因（必填，原卡将保留）<input value={reason} onChange={e=>setReason(e.target.value)} placeholder="为什么修改这张已结算的卡？"/></label>}
                <div className="debrief-actions">
                  <button className="primary" onClick={saveCard}>{card.status==='done'?'保存改动':'结算本章'}</button>
                  <button className="outline" onClick={()=>setDraft(null)}>取消</button>
                </div>
              </>:card.status==='done'?<>
                {data.characters.map(ch=>{const e=card.entries[ch.name]||{};return(
                  <div className="who" key={ch.name}>
                    <b>{ch.name} <small>· {ch.player}</small></b>
                    <span>✦ 高光：{e.highlight||'—'}</span>
                    <span>→ 下章想做：{e.next||'—'}</span>
                  </div>)})}
                <div className="who"><b>推进点</b><span>主线：{card.main}</span><span>支线：{card.side}</span></div>
                {card.history?.length>0&&<details className="history">
                  <summary>改动留痕（{card.history.length} 张原卡）</summary>
                  {card.history.map((h,i)=><div className="hist-card" key={i}>
                    <b>原卡 {i+1} · {h.savedAt}</b>
                    <p>改动原因：{h.reason}</p>
                    {data.characters.map(ch=>h.snapshot.entries[ch.name]?.highlight?
                      <p key={ch.name}>{ch.name}：{h.snapshot.entries[ch.name].highlight} ／ {h.snapshot.entries[ch.name].next}</p>:null)}
                    <p>主线：{h.snapshot.main}　支线：{h.snapshot.side}</p>
                  </div>)}
                </details>}
                <div className="debrief-actions"><button className="outline" onClick={startEdit}>✎ 修改复盘（需写明原因）</button></div>
              </>:<>
                <p className="hint">本章尚未完成复盘。谁一直在陪跑、哪条支线没推进，散场前花两分钟记下来。</p>
                <div className="debrief-actions"><button className="primary" onClick={startEdit}>✎ 填写复盘卡</button></div>
              </>}
            </div>
          </div>
        </section>
      </div>}

      {tab==='characters'&&<section className="cards">
        <div className="section-note">队伍中有 {data.characters.length} 位冒险者。圆点展示每位玩家在各区章节的戏份变化（被认领的高光）。</div>
        {data.characters.map(c=>{const sp=spotlight(c);const n=sp.filter(x=>x.hl.trim()).length;return(
          <article className="char-card" key={c.name}>
            <div className="avatar" style={{background:c.color}}>{c.name[0]}</div>
            <div>
              <small>{c.role}</small>
              <h3>{c.name}</h3>
              <p>玩家 · {c.player}</p>
              <div className="spot">{sp.map((x,i)=><i key={i} className={x.hl.trim()?'on':''} title={`${x.title}${x.hl.trim()?`：${x.hl}`:'（无高光记录）'}`}/>)}</div>
            </div>
            <span className="spot-count">{n}/{data.sessions.length} 场高光</span>
            <button onClick={()=>setNotice(`${c.name} 的角色档案`)}>↗</button>
          </article>)})}
      </section>}

      {tab==='places'&&<section className="empty"><div>⌖</div><h2>地点图鉴</h2><p>从章节笔记中收集地点。当前已记录灰港、雾林和失落钟楼。</p>
        <div className="place-list"><span>01　灰港 <b>已探索</b></span><span>02　失落钟楼 <b>已探索</b></span><span>03　雾林 <b>待探索</b></span></div></section>}

      {tab==='loot'&&<section className="empty"><div>◇</div><h2>战利品清单</h2><p>追踪旅途中获得的装备、遗物和金币。</p>
        <div className="place-list"><span>月光草 × 3 <b>消耗品</b></span><span>古老铜币 × 1 <b>遗物</b></span><span>灰港守卫徽章 × 2 <b>任务物品</b></span></div></section>}
    </main>

    {show&&<div className="modal-bg"><div className="modal">
      <button className="close" onClick={()=>setShow(false)}>×</button>
      <span className="crumb">NEW CHAPTER</span><h2>记录新的章节</h2>
      <label>章节标题<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="例：第三章：月下集市"/></label>
      <label>游戏日期<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
      <label>章节摘要<textarea rows="3" value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})} placeholder="发生了什么？"/></label>
      <label>章节类型<select value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})}><option>主线</option><option>支线</option><option>番外</option></select></label>
      <label>准备情况<select value={form.prep} onChange={e=>setForm({...form,prep:e.target.value})}>{PREP.map(p=><option key={p}>{p}</option>)}</select></label>
      <button className="primary full" onClick={add}>保存章节</button>
    </div></div>}

    {notice&&<div className="toast">{notice}</div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);
