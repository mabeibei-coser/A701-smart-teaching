import React from 'react';

const THEME = {
  '学术清透': '',
  '温暖手稿': 'theme-manuscript',
  '潮玩科技': 'theme-neotech',
};

export default function CardRenderer({ data, styleType }) {
  const t = THEME[styleType] || '';
  if (!data?.title) return null;

  const body = dispatch(data);
  return (
    <div className={t}>
      <div className="card">
        <div className="card-title">{data.title}</div>
        {body}
      </div>
    </div>
  );
}

function dispatch(data) {
  if (data.events && Array.isArray(data.events)) return <Timeline data={data} />;
  if (data.leftItem && data.rightItem) return <Comparison data={data} />;
  if (data.steps && Array.isArray(data.steps)) return <Process data={data} />;
  if (data.branches && Array.isArray(data.branches)) return <Panorama data={data} />;
  return <Concept data={data} />;
}

/* ============ 通用 ============ */
const Sec  = ({ c }) => <div className="card-sec">{c}</div>;
const In   = ({ c }) => <div className="card-insight">💡 {c}</div>;
const Tag  = ({ c }) => <span className="card-tag">{c}</span>;

/* ============ 概念卡 ============ */
function Concept({ data }) {
  // 新格式: modules = [{name, points}]
  const modules = data.modules || [];
  // 旧格式兼容
  const kp = data.keyPoints || [];
  const rw = data.realWorld || [];
  const def = data.definition;

  return (
    <>
      {def && <div className="card-hero">{def}</div>}

      {/* 新格式：模块+要点层级 */}
      {modules.length > 0 ? (
        modules.map((mod, mi) => (
          <div key={mi}>
            <Sec c={mod.name} />
            <div className="card-points">
              {(mod.points || []).map((p, pi) => (
                <div key={pi} className="card-point">{p}</div>
              ))}
            </div>
          </div>
        ))
      ) : (
        /* 旧格式兼容 */
        <>
          {kp.length > 0 && (
            <>
              <Sec c="关键认知" />
              <div className="card-points">
                {kp.map((p, i) => <div key={i} className="card-point">{p}</div>)}
              </div>
            </>
          )}
          {rw.length > 0 && (
            <>
              <Sec c="现实案例" />
              <div className="card-examples">
                {rw.map((r, i) => {
                  const tit = typeof r === 'string' ? r : (r.title || '');
                  const des = typeof r === 'string' ? '' : (r.desc || '');
                  return (
                    <div key={i} className="card-example">
                      <div className="card-ex-title">{tit}</div>
                      {des && <div className="card-ex-desc">{des}</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {data.summary && <In c={data.summary} />}
    </>
  );
}

/* ============ 时间线卡 ============ */
function Timeline({ data }) {
  const evts   = data.events || [];
  const phases = data.phases || [];

  return (
    <>
      <Sec c="时间脉络" />
      <div className="card-timeline">
        {evts.map((e, i) => (
          <div key={i} className="card-tl-node">
            <div className="card-tl-dot" />
            <div className="card-tl-time">{e.time}</div>
            <div className="card-tl-label">{e.label}</div>
            {(e.desc || e.description) && (
              <div className="card-flow-desc" style={{ marginTop: 4, fontSize: '0.8rem' }}>{e.desc || e.description}</div>
            )}
          </div>
        ))}
      </div>

      {phases.length > 0 && (
        <div className="card-phases">
          {phases.map((p, i) => <span key={i} className="card-phase">{p}</span>)}
        </div>
      )}

      {data.summary && <In c={data.summary} />}
    </>
  );
}

/* ============ 对比卡 ============ */
function Comparison({ data }) {
  const tbl = data.comparisonTable || [];
  const lt  = data.leftItem?.traits  || data.leftItem?.features  || [];
  const rt  = data.rightItem?.traits || data.rightItem?.features || [];
  const dec = data.decision || data.summary;

  return (
    <>
      {/* VS 头部 */}
      <div className="card-vs-header">
        <span className="card-vs-name card-vs-left">{data.leftItem?.name || 'A'}</span>
        <span className="card-vs-badge">VS</span>
        <span className="card-vs-name card-vs-right">{data.rightItem?.name || 'B'}</span>
      </div>

      {/* 特征标签 */}
      <div className="card-traits">
        <div className="card-trait-col">{lt.map((f, i) => <Tag key={i} c={f} />)}</div>
        <div className="card-trait-col">{rt.map((f, i) => <Tag key={i} c={f} />)}</div>
      </div>

      {/* 对比表格 */}
      {tbl.length > 0 && (
        <>
          <Sec c="逐维对比" />
          <div className="card-compare-table">
            <div className="card-ct-row card-ct-header">
              <div className="card-ct-cell">维度</div>
              <div className="card-ct-cell">{data.leftItem?.name || 'A'}</div>
              <div className="card-ct-cell">{data.rightItem?.name || 'B'}</div>
            </div>
            {tbl.map((r, i) => (
              <div key={i} className="card-ct-row">
                <div className="card-ct-cell card-ct-dim">{r.dimension || r.aspect}</div>
                <div className="card-ct-cell card-ct-a">{r.left}</div>
                <div className="card-ct-cell card-ct-b">{r.right}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {dec && <In c={dec} />}
    </>
  );
}

/* ============ 流程卡 ============ */
function Process({ data }) {
  const steps = data.steps || [];

  return (
    <>
      <Sec c="流程步骤" />
      <div className="card-flow">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="card-flow-step">
              <div className="card-flow-num">{s.order || i + 1}</div>
              <div className="card-flow-name">{s.name}</div>
              {(s.desc || s.description) && (
                <div className="card-flow-desc">{s.desc || s.description}</div>
              )}
            </div>
            {i < steps.length - 1 && <div className="card-flow-arrow">→</div>}
          </React.Fragment>
        ))}
      </div>

      {data.outcome && <div className="card-outcome">🎯 {data.outcome}</div>}
    </>
  );
}

/* ============ 全景图卡 ============ */
function Panorama({ data }) {
  const branches = data.branches || data.subFields || [];
  const apps     = data.applications || [];

  return (
    <>
      <Sec c="知识全景" />

      {data.coreConcept && <div className="card-pano-core">{data.coreConcept}</div>}

      {branches.length > 0 && (
        <>
          <Sec c="核心分支" />
          <div className="card-branches">
            {branches.map((b, i) => (
              <div key={i} className="card-branch">
                <div className="card-br-name">{b.name}</div>
                {(b.desc || b.description) && (
                  <div className="card-br-desc">{b.desc || b.description}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {apps.length > 0 && (
        <>
          <Sec c="实际应用" />
          <div className="card-apps">
            {apps.map((a, i) => (
              <span key={i} className="card-app">
                {a.name}
                {(a.desc || a.description) && <span className="card-app-desc">{a.desc || a.description}</span>}
              </span>
            ))}
          </div>
        </>
      )}

      {data.summary && <In c={data.summary} />}
    </>
  );
}
