import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

/* 资料、判定、本地存档分别使用独立的本地存储键，互不覆盖 */
const LS = {
  core: 'campaign-log',        // 战役本体：章节、角色、准备情况、复盘卡
  materials: 'campaign-materials', // 资料
  rulings: 'campaign-rulings',    // 判定
  saves: 'campaign-saves',        // 本地存档（快照）
};

const PREP_STEPS = ['未准备', '准备中', '已备齐'];
const SPOT = { spot: '高光时刻', normal: '正常参与', bench: '全程陪跑' };
const SPOT_RANK = { bench: 0, normal: 1, spot: 2 };
const fmt = (t) => new Date(t).toLocaleString('zh-CN', { hour12: false });

/* ---------------- 种子数据 ---------------- */

const seedMaterials = [
  { id: 101, sessionId: 1, title: '灰港地图（手绘）', kind: '地图', note: '标注失落钟楼、旧码头与北雾林入口。' },
  { id: 102, sessionId: 2, title: '伊琳角色卡', kind: 'NPC', note: '流浪法师，态度谨慎，疑似被债主追猎。' },
  { id: 103, sessionId: 3, title: '月光草药效速查', kind: '设定', note: '仅月光下开花，可调制退烧药剂，入药需三株。' },
];

const seedRulings = [
  { id: 201, sessionId: 1, situation: '圣骑士在坍塌楼梯上强行冲刺', ruling: '过 DC 13 敏捷豁免，失败坠落并受 1d6 钝击伤害。', basis: 'DMG 紧急地形' },
  { id: 202, sessionId: 3, situation: '浓雾中追迹是否带劣势', ruling: '有游侠带路仍不免劣势，但向导术可抵消。', basis: 'PHB 追迹规则' },
];

function review(cards, main, side, extra = {}) {
  return {
    status: 'done',
    touched: true,
    completedAt: extra.at || '2024-06-08 22:40',
    cards,
    main,
    side,
    revisions: [],
    ...extra,
  };
}

const seed = {
  name: '暮光边境',
  system: 'D&D 5E',
  characters: [
    { name: '艾德里安', role: '圣骑士', player: '林默', color: '#d8a153' },
    { name: '瑟琳', role: '游侠', player: '安然', color: '#93b7a6' },
    { name: '莫尔', role: '术士', player: '周岳', color: '#b9a6d1' },
  ],
  sessions: [
    {
      id: 1, date: '2024-06-08', title: '第一章：灰港的钟声', prep: '已备齐',
      summary: '队伍抵达灰港，在失落的钟楼发现了神秘符文。', tag: '主线', color: '#d8a153',
      review: review(
        {
          艾德里安: { present: true, highlight: '稳住坍塌的旋转楼梯，把队友一个个护送到钟楼顶层。', plan: '追查符文边缘那个疑似圣徽的印记。', spotlight: 'spot' },
          瑟琳: { present: true, highlight: '识破雾中尾随的脚印，在登顶前提前预警。', plan: '去旧码头打听最近失踪的旅人。', spotlight: 'normal' },
          莫尔: { present: true, highlight: '用光亮术照亮符文，当场拓下第一手纹路。', plan: '回营地翻古籍比对符文记载。', spotlight: 'normal' },
        },
        ['确认钟楼符文与近一个月的海难有关，主线正式开启。'],
        ['守门老兵提到钟声只在起雾的夜里响——记为伏笔。'],
        { at: '2024-06-08 22:40' },
      ),
    },
    {
      id: 2, date: '2024-06-15', title: '第二章：雾中来客', prep: '已备齐',
      summary: '与流浪法师伊琳结盟，追踪海雾中的脚印。', tag: '主线', color: '#93b7a6',
      review: review(
        {
          艾德里安: { present: true, highlight: '谈判时寸步不让，逼伊琳放弃利用队伍的打算，转为平等结盟。', plan: '带伊琳去见灰港守卫队长作担保。', spotlight: 'normal' },
          瑟琳: { present: true, highlight: '沿礁石追了两小时脚印，找到法师留下的临时营地。', plan: '排查营地周围是否还有别的跟踪者。', spotlight: 'spot' },
          莫尔: { present: true, highlight: '当场识破海雾是法术余波，不是自然现象。', plan: '记下伊琳施法时的咒语发音特征。', spotlight: 'normal' },
        },
        ['与流浪法师伊琳结盟，获得追踪海雾来源的手段。'],
        ['伊琳承认她也在找一名失踪的同行者（支线钩子）。'],
        { at: '2024-06-15 22:10' },
      ),
    },
    {
      id: 3, date: '2024-06-22', title: '支线：深林采药', prep: '准备中',
      summary: '帮助村民寻找月光草，获得一枚古老铜币。', tag: '支线', color: '#b9a6d1',
      // 第三章散场后没填完：瑟琳高光空缺、艾德里安下章计划空缺、主线推进点还没写 → 停在待复盘
      review: review(
        {
          艾德里安: { present: true, highlight: '背着重伤的村民走出雾林，一路撑到村口。', plan: '', spotlight: 'normal' },
          瑟琳: { present: true, highlight: '', plan: '想再进一次雾林，找到月光草真正的花田。', spotlight: 'bench' },
          莫尔: { present: true, highlight: '认出古老铜币上的古帝国文字，断定它不该出现在这里。', plan: '查清铜币为什么会流落在采药小径上。', spotlight: 'normal' },
        },
        [''],
        ['帮村民采到月光草，换得一枚来历不明的古老铜币。'],
        { status: 'pending', completedAt: null, at: null },
      ),
    },
  ],
};

/* ---------------- 存储与迁移 ---------------- */

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function blankReview(characters) {
  return {
    status: 'pending',
    touched: false,
    completedAt: null,
    cards: Object.fromEntries(characters.map((c) => [
      c.name, { present: true, highlight: '', plan: '', spotlight: 'normal' },
    ])),
    main: [''],
    side: [''],
    revisions: [],
  };
}

/* 老存档补齐新字段：prep、review、新角色的复盘卡位 */
function migrate(d) {
  const characters = d.characters || [];
  return {
    ...d,
    characters,
    sessions: (d.sessions || []).map((s) => {
      const base = blankReview(characters);
      const old = s.review || {};
      const cards = { ...base.cards, ...(old.cards || {}) };
      return {
        ...s,
        prep: s.prep || '未准备',
        review: { ...base, ...old, cards, main: old.main?.length ? old.main : [''], side: old.side?.length ? old.side : [''], revisions: old.revisions || [] },
      };
    }),
  };
}

const clone = (x) => JSON.parse(JSON.stringify(x));
const nonEmpty = (arr) => (arr || []).map((x) => x.trim()).filter(Boolean);
const signature = (r) => JSON.stringify({ cards: r.cards, main: r.main, side: r.side });

/* 取本章之前、该玩家最近一次已复盘章节的戏份，用于戏份变化对比 */
function prevSpotlight(sessions, sessionId, name) {
  const idx = sessions.findIndex((s) => s.id === sessionId);
  for (let j = idx - 1; j >= 0; j--) {
    const r = sessions[j].review;
    const c = r?.cards?.[name];
    if (r?.status === 'done' && c && c.present !== false) return c.spotlight || 'normal';
  }
  return null;
}

/* ---------------- 复盘卡 ---------------- */

function ReviewPanel({ session, sessions, characters, onSave, notify }) {
  const original = session.review;
  const [draft, setDraft] = useState(() => clone(original));
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState([]);
  const [openRev, setOpenRev] = useState({});

  const readOnly = original.status === 'done' && !editing;
  const changed = signature(draft) !== signature(original);
  const needReason = original.touched && changed;

  const patchCard = (name, patch) => setDraft((d) => ({
    ...d,
    cards: { ...d.cards, [name]: { ...d.cards[name], ...patch } },
  }));
  const setPoint = (kind, i, v) => setDraft((d) => ({ ...d, [kind]: d[kind].map((p, j) => (j === i ? v : p)) }));
  const addPoint = (kind) => setDraft((d) => ({ ...d, [kind]: [...d[kind], ''] }));
  const delPoint = (kind, i) => setDraft((d) => ({ ...d, [kind]: d[kind].length > 1 ? d[kind].filter((_, j) => j !== i) : d[kind] }));

  const validate = (d) => {
    const e = [];
    const here = characters.filter((c) => d.cards[c.name]?.present !== false);
    if (!here.length) e.push('至少要有一位参团玩家到场');
    here.forEach((c) => {
      const card = d.cards[c.name];
      if (!card.highlight.trim()) e.push(`${c.name}（${c.player}）还没认领本场高光`);
      if (!card.plan.trim()) e.push(`${c.name}（${c.player}）还没写下章想做的事`);
    });
    if (!nonEmpty(d.main).length) e.push('主线至少要留下一个推进点');
    if (!nonEmpty(d.side).length) e.push('支线至少要留下一个推进点');
    return e;
  };

  const buildPayload = (status) => {
    const payload = {
      ...clone(draft),
      status,
      touched: original.touched || !!(nonEmpty(draft.main).length || nonEmpty(draft.side).length ||
        characters.some((c) => { const x = draft.cards[c.name]; return x && (x.highlight.trim() || x.plan.trim()); })),
      completedAt: status === 'done' ? (original.completedAt || fmt(Date.now())) : null,
      revisions: original.revisions.slice(),
    };
    if (status === 'done' && needReason) {
      if (!reason.trim()) { errors.length || setErrors(['补填或订正已保存的复盘卡，需要写明改动原因']); return null; }
      // 保留原卡：把改动前的完整内容连同原因一起存档
      payload.revisions.push({
        at: fmt(Date.now()),
        reason: reason.trim(),
        before: { status: original.status, cards: clone(original.cards), main: clone(original.main), side: clone(original.side) },
      });
    }
    return payload;
  };

  const saveDraft = () => {
    const payload = buildPayload('pending');
    if (!payload) return;
    onSave(payload);
    setErrors([]);
    notify('草稿已保存，本章继续停在「待复盘」');
  };
  const complete = () => {
    const e = validate(draft);
    setErrors(e);
    if (e.length) { notify('还有内容没填完，无法完成复盘'); return; }
    const payload = buildPayload('done');
    if (!payload) { setErrors(['补填或订正已保存的复盘卡，需要写明改动原因']); return; }
    onSave(payload);
    setErrors([]);
    setEditing(false);
    setReason('');
    notify(payload.revisions.length > original.revisions.length ? '复盘已补齐，原卡已留档' : '复盘完成，本章已结算');
  };
  const cancelEdit = () => { setDraft(clone(original)); setEditing(false); setReason(''); setErrors([]); };

  return (
    <div className="review-card">
      <div className="rc-head">
        <div>
          <small>SECTION DEBRIEF</small>
          <h4>本章复盘卡</h4>
        </div>
        <span className={original.status === 'done' ? 'pill done' : 'pill pending'}>
          {original.status === 'done' ? '✓ 已复盘' : '◔ 待复盘'}
        </span>
      </div>
      {original.status === 'done' && original.completedAt && <p className="rc-time">结算时间：{original.completedAt}</p>}

      <div className="rc-players">
        {characters.map((c) => {
          const card = draft.cards[c.name] || { present: true, highlight: '', plan: '', spotlight: 'normal' };
          const prev = card.present !== false ? prevSpotlight(sessions, session.id, c.name) : null;
          const delta = prev && prev !== card.spotlight;
          return (
            <div className={'rc-player ' + (card.present === false ? 'absent' : '')} key={c.name}>
              <div className="rc-player-head">
                <span className="rc-avatar" style={{ background: c.color }}>{c.name[0]}</span>
                <div>
                  <strong>{c.name} <small>{c.role} · 玩家 {c.player}</small></strong>
                  <label className="rc-present"><input type="checkbox" checked={card.present !== false} disabled={readOnly}
                    onChange={(e) => patchCard(c.name, { present: e.target.checked })} /> 参团到场</label>
                </div>
                <select className="rc-spot" value={card.spotlight || 'normal'} disabled={readOnly}
                  onChange={(e) => patchCard(c.name, { spotlight: e.target.value })}>
                  {Object.entries(SPOT).map(([k, v]) => <option value={k} key={k}>{v}</option>)}
                </select>
              </div>
              {card.present !== false && (
                <>
                  {prev && (
                    <div className={'rc-trend ' + (SPOT_RANK[card.spotlight] < SPOT_RANK[prev] ? 'down' : SPOT_RANK[card.spotlight] > SPOT_RANK[prev] ? 'up' : 'flat')}>
                      戏份变化：上章 {SPOT[prev]} → 本章 {SPOT[card.spotlight || 'normal']}
                      {delta ? (SPOT_RANK[card.spotlight] < SPOT_RANK[prev] ? ' ↓' : ' ↑') : ' ＝'}
                      {card.spotlight === 'bench' && <b className="bench-warn">　陪跑预警</b>}
                    </div>
                  )}
                  <label className="rc-field">本场高光（认领一件最出风头的事）
                    <textarea rows="2" disabled={readOnly} value={card.highlight} placeholder="例：最后一刻识破陷阱……"
                      onChange={(e) => patchCard(c.name, { highlight: e.target.value })} />
                  </label>
                  <label className="rc-field">下章想做的事
                    <textarea rows="2" disabled={readOnly} value={card.plan} placeholder="例：去找铁匠修复短剑……"
                      onChange={(e) => patchCard(c.name, { plan: e.target.value })} />
                  </label>
                </>
              )}
            </div>
          );
        })}
      </div>

      {[['main', '主线推进点', '主线往哪走了一步'], ['side', '支线推进点', '哪条支线被碰到了（也可以是新钩子）']].map(([kind, t, ph]) => (
        <div className="rc-points" key={kind}>
          <div className="rc-points-head"><strong>{t}</strong><span>每类结算时至少留 1 条</span></div>
          {draft[kind].map((p, i) => (
            <div className="pt-row" key={i}>
              <input disabled={readOnly} value={p} placeholder={ph} onChange={(e) => setPoint(kind, i, e.target.value)} />
              {!readOnly && <button onClick={() => delPoint(kind, i)} title="删除这一条">×</button>}
            </div>
          ))}
          {!readOnly && <button className="link-btn" onClick={() => addPoint(kind)}>＋ 添加{t}</button>}
        </div>
      ))}

      {errors.length > 0 && (
        <ul className="rc-errors">{errors.map((e, i) => <li key={i}>· {e}</li>)}</ul>
      )}

      {needReason && (
        <label className="rc-field reason">改动原因（补齐 / 订正都必须写明，原卡会保留在修订记录里）
          <textarea rows="2" value={reason} placeholder="例：瑟琳周中补开了小剧场，补记她的高光……"
            onChange={(e) => setReason(e.target.value)} />
        </label>
      )}

      <div className="rc-actions">
        {readOnly ? (
          <button className="primary" onClick={() => setEditing(true)}>✎ 补填 / 订正</button>
        ) : (
          <>
            <button className="outline" onClick={saveDraft}>先存草稿（待复盘）</button>
            <button className="primary" onClick={complete}>完成复盘</button>
            {editing && <button className="outline" onClick={cancelEdit}>放弃改动</button>}
          </>
        )}
      </div>

      {original.revisions?.length > 0 && (
        <div className="rc-revisions">
          <h5>修订记录（原卡保留）</h5>
          {original.revisions.map((r, i) => (
            <div className="rev-item" key={i}>
              <button className="rev-head" onClick={() => setOpenRev((o) => ({ ...o, [i]: !o[i] }))}>
                <span>{openRev[i] ? '▾' : '▸'} {r.at} · {r.reason}</span>
              </button>
              {openRev[i] && (
                <div className="rev-body">
                  {Object.entries(r.before.cards).filter(([, c]) => c.present !== false).map(([name, c]) => (
                    <div key={name}><b>{name}</b>
                      <p>高光：{c.highlight || '（空）'}</p>
                      <p>计划：{c.plan || '（空）'}</p>
                    </div>
                  ))}
                  <p><b>主线：</b>{nonEmpty(r.before.main).join('；') || '（空）'}</p>
                  <p><b>支线：</b>{nonEmpty(r.before.side).join('；') || '（空）'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- 主应用 ---------------- */

function App() {
  const [data, setData] = useState(() => migrate(read(LS.core, seed)));
  const [materials, setMaterials] = useState(() => read(LS.materials, seedMaterials));
  const [rulings, setRulings] = useState(() => read(LS.rulings, seedRulings));
  const [saves, setSaves] = useState(() => read(LS.saves, []));

  const [tab, setTab] = useState('timeline');
  const [active, setActive] = useState(data.sessions[0]?.id);
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ title: '', date: '2024-07-01', summary: '', tag: '主线' });

  useEffect(() => localStorage.setItem(LS.core, JSON.stringify(data)), [data]);
  useEffect(() => localStorage.setItem(LS.materials, JSON.stringify(materials)), [materials]);
  useEffect(() => localStorage.setItem(LS.rulings, JSON.stringify(rulings)), [rulings]);
  useEffect(() => localStorage.setItem(LS.saves, JSON.stringify(saves)), [saves]);

  const notify = (t) => setNotice(t);
  const cur = data.sessions.find((x) => x.id === active) || data.sessions[0];

  const patchSession = (id, patch) => setData((d) => ({
    ...d, sessions: d.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  }));
  const saveReview = (rv) => patchSession(cur.id, { review: rv });

  const addChapter = () => {
    if (!form.title.trim()) return;
    const s = {
      ...form, id: Date.now(), color: '#d8a153',
      prep: '未准备', review: blankReview(data.characters),
    };
    setData((d) => ({ ...d, sessions: [...d.sessions, s] }));
    setActive(s.id);
    setForm({ title: '', date: '2024-07-01', summary: '', tag: '主线' });
    setShow(false);
    notify('新章节已加入时间线，散场后记得填复盘卡');
  };

  const exportArchive = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({
      exportedAt: fmt(Date.now()), core: data, materials, rulings,
    }, null, 2)], { type: 'application/json' }));
    a.download = 'campaign-archive.json';
    a.click();
    notify('战役归档（含资料与判定）已导出');
  };

  const createSave = () => {
    const snap = {
      id: Date.now(), at: fmt(Date.now()),
      chapters: data.sessions.length,
      done: data.sessions.filter((s) => s.review?.status === 'done').length,
      core: clone(data), materials: clone(materials), rulings: clone(rulings),
    };
    setSaves((l) => [snap, ...l].slice(0, 20));
    notify('已生成一份本地存档快照');
  };
  const restoreSave = (s) => {
    if (!window.confirm(`读取 ${s.at} 的存档？当前未另存的内容会被覆盖。`)) return;
    setData(migrate(clone(s.core)));
    setMaterials(clone(s.materials || []));
    setRulings(clone(s.rulings || []));
    setActive(s.core.sessions[0]?.id);
    notify('已读档：每章准备情况与复盘记录都已恢复');
  };
  const downloadSave = (s) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }));
    a.download = `campaign-save-${s.id}.json`;
    a.click();
  };

  const titles = { timeline: '战役时间线', characters: '角色与阵营', places: '地点图鉴', loot: '战利品', materials: '资料准备', rulings: '判定记录', saves: '本地存档' };

  return (
    <div className="shell">
      <aside>
        <div className="logo"><span>✦</span> CAMPAIGNER</div>
        <div className="campaign">
          <small>当前战役</small>
          <strong>{data.name}</strong>
          <span>{data.system} · 2024</span>
        </div>
        <nav>
          {[['timeline', '◌', '时间线'], ['characters', '♙', '角色与阵营'], ['materials', '▤', '资料准备'], ['rulings', '§', '判定记录'], ['saves', '⤓', '本地存档'], ['places', '⌖', '地点图鉴'], ['loot', '◇', '战利品']].map(([id, i, t]) => (
            <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}><i>{i}</i>{t}</button>
          ))}
        </nav>
        <div className="side-bottom">
          <button>⚙ 偏好设置</button>
          <small>本地存储已开启 · 资料/判定/存档分库</small>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <span className="crumb">MY CAMPAIGN / {data.system}</span>
            <h1>{titles[tab]}</h1>
          </div>
          <div className="actions">
            <button onClick={exportArchive} className="outline">↓ 导出归档</button>
            <button onClick={() => setShow(true)} className="primary">＋ 新建章节</button>
          </div>
        </header>

        {tab === 'timeline' && (
          <div className="timeline-layout">
            <section className="timeline">
              <div className="timeline-intro">
                <div><span>THE CHRONICLE</span><h2>记录每一次冒险</h2></div>
                <span className="count">{data.sessions.length} CHAPTERS · {data.sessions.filter((s) => s.review?.status === 'done').length} 已复盘</span>
              </div>
              {data.sessions.map((s, i) => (
                <button className={'chapter ' + (active === s.id ? 'selected' : '')} onClick={() => setActive(s.id)} key={s.id}>
                  <div className="date">
                    <b>{new Date(s.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</b>
                    <small>{new Date(s.date).getFullYear()}</small>
                  </div>
                  <div className="line">
                    <span style={{ background: s.color }}></span>
                    {i < data.sessions.length - 1 && <i />}
                  </div>
                  <div className="chapter-copy">
                    <div className="tag">{s.tag}</div>
                    <h3>{s.title}</h3>
                    <p>{s.summary}</p>
                    <div className="chapter-badges">
                      <span className={'mini prep-' + PREP_STEPS.indexOf(s.prep)}>{s.prep}</span>
                      <span className={'mini ' + (s.review?.status === 'done' ? 'rev-done' : 'rev-pending')}>
                        {s.review?.status === 'done' ? '✓ 已复盘' : '◔ 待复盘'}
                      </span>
                    </div>
                  </div>
                  <span className="arrow">↗</span>
                </button>
              ))}
            </section>

            <section className="detail-panel">
              <div className="detail-cover" style={{ background: cur?.color }}>
                <span>CHAPTER {String(data.sessions.findIndex((x) => x.id === cur?.id) + 1).padStart(2, '0')}</span>
                <i>✦</i>
              </div>
              <div className="detail-body">
                <span className="tag">{cur?.tag}</span>
                <h2>{cur?.title}</h2>
                <p>{cur?.summary}</p>
                <div className="meta-grid">
                  <div><small>游戏日期</small><strong>{cur?.date}</strong></div>
                  <div><small>参与者</small><strong>{data.characters.length} 位玩家</strong></div>
                  <div>
                    <small>本章准备（资料页同步）</small>
                    <select className="inline-select" value={cur?.prep || '未准备'}
                      onChange={(e) => patchSession(cur.id, { prep: e.target.value })}>
                      {PREP_STEPS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div><small>复盘状态</small>
                    <strong className={cur?.review?.status === 'done' ? 'txt-done' : 'txt-pending'}>
                      {cur?.review?.status === 'done' ? '已复盘结算' : '待复盘'}
                    </strong>
                  </div>
                </div>

                {cur && (
                  <ReviewPanel key={cur.id} session={cur} sessions={data.sessions} characters={data.characters}
                    onSave={saveReview} notify={notify} />
                )}

                <div className="note"><span>✎</span><div><strong>笔记</strong><p>剧情细节、重要决定和未解线索可以先记在这里。</p></div>
                  <button onClick={() => setNotice('笔记编辑已开启')}>编辑</button></div>
              </div>
            </section>
          </div>
        )}

        {tab === 'characters' && (
          <section className="cards">
            <div className="section-note">队伍中有 {data.characters.length} 位冒险者；下方按章节回放每位玩家的戏份起伏，连续陪跑会标红。</div>
            {data.characters.map((c) => {
              const benchStreak = (() => {
                let n = 0;
                for (let i = data.sessions.length - 1; i >= 0; i--) {
                  const card = data.sessions[i].review?.cards?.[c.name];
                  if (card && card.present !== false && card.spotlight === 'bench') n += 1;
                  else if (card && card.present !== false) break;
                }
                return n;
              })();
              return (
                <article className="char-card tall" key={c.name}>
                  <div className="char-head">
                    <div className="avatar" style={{ background: c.color }}>{c.name[0]}</div>
                    <div><small>{c.role}</small><h3>{c.name}</h3><p>玩家 · {c.player}</p></div>
                  </div>
                  <div className="spot-track">
                    {data.sessions.map((s, i) => {
                      const card = s.review?.cards?.[c.name];
                      const cls = !card || card.present === false ? 'absent' : s.review?.status !== 'done' ? 'pending' : card.spotlight;
                      return <span key={s.id} className={'spot-chip ' + cls} title={`${s.title}：${SPOT[card?.spotlight] || '未结算'}`}>第{i + 1}章</span>;
                    })}
                  </div>
                  <p className={'spot-summary ' + (benchStreak >= 1 ? 'warn' : '')}>
                    {benchStreak >= 2 ? `已连续 ${benchStreak} 章陪跑，下章优先安排戏份` : benchStreak === 1 ? '上一章陪跑，关注下章回暖' : '近期戏份稳定'}
                  </p>
                </article>
              );
            })}
          </section>
        )}

        {tab === 'materials' && (
          <MaterialsTab sessions={data.sessions} materials={materials} setMaterials={setMaterials}
            prepPatch={(id, prep) => patchSession(id, { prep })} notify={notify} />
        )}

        {tab === 'rulings' && (
          <RulingsTab sessions={data.sessions} rulings={rulings} setRulings={setRulings} notify={notify} />
        )}

        {tab === 'saves' && (
          <section className="ledger">
            <div className="ledger-head">
              <div><span className="crumb">LOCAL SNAPSHOTS</span><h2>本地存档</h2>
                <p>资料、判定、复盘卡分库存放；这里手动打快照，重开战役或读档后每章准备情况和戏份变化都能原样回来。</p></div>
              <button className="primary" onClick={createSave}>＋ 立即存档</button>
            </div>
            {saves.length === 0 && <div className="ledger-empty">还没有存档快照。散场结算后建议点一次「立即存档」。</div>}
            <div className="save-list">
              {saves.map((s) => (
                <div className="save-item" key={s.id}>
                  <div className="save-icon">⤓</div>
                  <div>
                    <strong>{s.at}</strong>
                    <p>{s.chapters} 章 · 已复盘 {s.done}/{s.chapters} · 资料 {s.materials?.length || 0} 条 · 判定 {s.rulings?.length || 0} 条</p>
                  </div>
                  <div className="save-actions">
                    <button className="outline sm" onClick={() => downloadSave(s)}>导出</button>
                    <button className="outline sm danger" onClick={() => setSaves((l) => l.filter((x) => x.id !== s.id))}>删除</button>
                    <button className="primary sm" onClick={() => restoreSave(s)}>读档</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'places' && (
          <section className="empty"><div>⌖</div><h2>地点图鉴</h2><p>从章节笔记中收集地点。当前已记录灰港、雾林和失落钟楼。</p>
            <div className="place-list">
              <span>01　灰港 <b>已探索</b></span><span>02　失落钟楼 <b>已探索</b></span><span>03　雾林 <b>待探索</b></span>
            </div></section>
        )}
        {tab === 'loot' && (
          <section className="empty"><div>◇</div><h2>战利品清单</h2><p>追踪旅途中获得的装备、遗物和金币。</p>
            <div className="place-list">
              <span>月光草 × 3 <b>消耗品</b></span><span>古老铜币 × 1 <b>遗物</b></span><span>灰港守卫徽章 × 2 <b>任务物品</b></span>
            </div></section>
        )}
      </main>

      {show && (
        <div className="modal-bg">
          <div className="modal">
            <button className="close" onClick={() => setShow(false)}>×</button>
            <span className="crumb">NEW CHAPTER</span><h2>记录新的章节</h2>
            <label>章节标题<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例：第三章：月下集市" /></label>
            <label>游戏日期<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label>章节摘要<textarea rows="3" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="发生了什么？" /></label>
            <label>章节类型<select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}><option>主线</option><option>支线</option><option>番外</option></select></label>
            <button className="primary full" onClick={addChapter}>保存章节</button>
          </div>
        </div>
      )}

      {notice && <div className="toast" onClick={() => setNotice('')}>{notice}</div>}
    </div>
  );
}

/* ---------------- 资料页 ---------------- */

function useEntryForm(sessions, extra = {}) {
  const [f, setF] = useState({ sessionId: sessions[0]?.id, title: '', kind: Object.values(extra)[0] || '', note: '', situation: '', ruling: '', basis: '', ...extra });
  return [f, setF];
}

function MaterialsTab({ sessions, materials, setMaterials, prepPatch, notify }) {
  const [f, setF] = useEntryForm(sessions, { kind: '设定', note: '' });
  const add = () => {
    if (!f.title.trim() || !f.sessionId) return;
    setMaterials((l) => [...l, { id: Date.now(), sessionId: Number(f.sessionId), title: f.title.trim(), kind: f.kind, note: f.note.trim() }]);
    setF((x) => ({ ...x, title: '', note: '' }));
    notify('资料已归入对应章节');
  };
  return (
    <section className="ledger">
      <div className="ledger-head"><div><span className="crumb">PREP &amp; HANDOUTS</span><h2>资料准备</h2>
        <p>重开战役时先看这里：每章的准备进度一目了然，资料按章节归档。</p></div></div>

      <h3 className="ledger-sub">每章准备情况</h3>
      <div className="prep-table">
        {sessions.map((s) => (
          <div className="prep-row" key={s.id}>
            <span className="prep-dot" style={{ background: s.color }} />
            <div><strong>{s.title}</strong><small>{s.date} · 资料 {materials.filter((m) => m.sessionId === s.id).length} 条</small></div>
            <select value={s.prep} onChange={(e) => prepPatch(s.id, e.target.value)}>
              {PREP_STEPS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        ))}
      </div>

      <h3 className="ledger-sub">资料条目</h3>
      <div className="entry-form">
        <label>归属章节<select value={f.sessionId} onChange={(e) => setF({ ...f, sessionId: e.target.value })}>
          {sessions.map((s) => <option value={s.id} key={s.id}>{s.title}</option>)}
        </select></label>
        <label>类型<select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
          {['设定', '地图', 'NPC', '规则速查', '玩家物品'].map((k) => <option key={k}>{k}</option>)}
        </select></label>
        <label className="grow">标题<input value={f.title} placeholder="例：地下集市草图" onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label className="grow">备注<input value={f.note} placeholder="要点 / 发放时机" onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
        <button className="primary" onClick={add}>＋ 归入资料</button>
      </div>

      <div className="entry-list">
        {sessions.map((s) => {
          const items = materials.filter((m) => m.sessionId === s.id);
          if (!items.length) return null;
          return (
            <div className="entry-group" key={s.id}>
              <h4>{s.title}<span className={'mini prep-' + PREP_STEPS.indexOf(s.prep)}>{s.prep}</span></h4>
              {items.map((m) => (
                <div className="entry-item" key={m.id}>
                  <span className="kind">{m.kind}</span>
                  <div><strong>{m.title}</strong>{m.note && <p>{m.note}</p>}</div>
                  <button className="outline sm" onClick={() => setMaterials((l) => l.filter((x) => x.id !== m.id))}>删除</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- 判定页 ---------------- */

function RulingsTab({ sessions, rulings, setRulings, notify }) {
  const [f, setF] = useEntryForm(sessions, { situation: '', ruling: '', basis: '' });
  const add = () => {
    if (!f.situation.trim() || !f.ruling.trim()) return;
    setRulings((l) => [...l, { id: Date.now(), sessionId: Number(f.sessionId), situation: f.situation.trim(), ruling: f.ruling.trim(), basis: f.basis.trim() }]);
    setF((x) => ({ ...x, situation: '', ruling: '', basis: '' }));
    notify('判定已记录');
  };
  return (
    <section className="ledger">
      <div className="ledger-head"><div><span className="crumb">TABLE RULINGS</span><h2>判定记录</h2>
        <p>桌上的临时裁定和规则依据单独成档，避免下次改口或互相打架。</p></div></div>

      <div className="entry-form">
        <label>发生章节<select value={f.sessionId} onChange={(e) => setF({ ...f, sessionId: e.target.value })}>
          {sessions.map((s) => <option value={s.id} key={s.id}>{s.title}</option>)}
        </select></label>
        <label className="grow">触发情境<input value={f.situation} placeholder="例：浓雾中远程攻击是否劣势" onChange={(e) => setF({ ...f, situation: e.target.value })} /></label>
        <label className="grow">主持判定<input value={f.ruling} placeholder="当时怎么裁的" onChange={(e) => setF({ ...f, ruling: e.target.value })} /></label>
        <label>规则依据<input value={f.basis} placeholder="PHB / 房规" onChange={(e) => setF({ ...f, basis: e.target.value })} /></label>
        <button className="primary" onClick={add}>＋ 记录判定</button>
      </div>

      <div className="entry-list">
        {sessions.map((s) => {
          const items = rulings.filter((r) => r.sessionId === s.id);
          if (!items.length) return null;
          return (
            <div className="entry-group" key={s.id}>
              <h4>{s.title}</h4>
              {items.map((r) => (
                <div className="entry-item ruling" key={r.id}>
                  <span className="kind">§</span>
                  <div>
                    <strong>{r.situation}</strong>
                    <p>{r.ruling}</p>
                    {r.basis && <small>依据：{r.basis}</small>}
                  </div>
                  <button className="outline sm" onClick={() => setRulings((l) => l.filter((x) => x.id !== r.id))}>删除</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
