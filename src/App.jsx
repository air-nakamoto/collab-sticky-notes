import { useState, useRef, useCallback, useEffect } from "react";

const COLORS = [
  { name: "yellow", bg: "#fff9c4", border: "#f9e547", shadow: "rgba(249,229,71,0.3)" },
  { name: "pink", bg: "#fce4ec", border: "#f48fb1", shadow: "rgba(244,143,177,0.3)" },
  { name: "blue", bg: "#e3f2fd", border: "#90caf9", shadow: "rgba(144,202,249,0.3)" },
  { name: "green", bg: "#e8f5e9", border: "#a5d6a7", shadow: "rgba(165,214,167,0.3)" },
  { name: "orange", bg: "#fff3e0", border: "#ffcc80", shadow: "rgba(255,204,128,0.3)" },
  { name: "purple", bg: "#f3e5f5", border: "#ce93d8", shadow: "rgba(206,147,216,0.3)" },
];

const USER_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#e84393"];
const SHAPE_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#555", "#e67e22", "#1abc9c"];
const SHAPE_TYPES = [
  { type: "arrow", label: "➜ 矢印" },
  { type: "dotted-circle", label: "◯ 点線丸" },
  { type: "dotted-rect", label: "▭ 点線四角" },
];

const FNT = "'Klee One', 'Zen Kurenaido', 'Yu Gothic', sans-serif";

function gid() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function groom() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 6; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
}

/* ── Storage ── */
async function saveBoard(rid, data) {
  try {
    localStorage.setItem(
      "board:" + rid,
      JSON.stringify({ ...data, updatedAt: Date.now() })
    );
    return true;
  } catch (e) {
    console.error("save", e);
    return false;
  }
}

async function loadBoard(rid) {
  try {
    const r = localStorage.getItem("board:" + rid);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

async function updatePresence(rid, u) {
  try {
    localStorage.setItem(
      "presence:" + rid + ":" + u.name,
      JSON.stringify({ ...u, lastSeen: Date.now() })
    );
  } catch { }
}

async function loadPresence(rid) {
  try {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("presence:" + rid + ":")) {
        try {
          const r = localStorage.getItem(k);
          if (r) {
            const d = JSON.parse(r);
            if (Date.now() - d.lastSeen < 15000) out.push(d);
          }
        } catch { }
      }
    }
    return out;
  } catch {
    return [];
  }
}

/* ── Toast ── */
function Toast({ msg, visible }) {
  return (
    <div
      style={{
        position: "fixed", top: 20, left: "50%",
        transform: "translateX(-50%) translateY(" + (visible ? 0 : -60) + "px)",
        background: "#3e3428", color: "#f5e6c8", padding: "10px 24px",
        borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: FNT,
        zIndex: 99999, boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        border: "1px solid rgba(245,230,200,0.2)",
        opacity: visible ? 1 : 0, transition: "all 0.3s ease",
        pointerEvents: "none",
      }}
    >
      {msg}
    </div>
  );
}

/* ── Join Screen ── */
function JoinScreen({ onJoin }) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ok = name.trim().length > 0;

  const doCreate = async () => {
    if (!ok) { setError("名前を入力してください"); return; }
    setLoading(true);
    setError("");
    const id = groom();
    const success = await saveBoard(id, { notes: [], shapes: [] });
    if (success) {
      onJoin(name.trim(), id, true);
    } else {
      setError("作成に失敗しました");
      setLoading(false);
    }
  };

  const doJoin = async () => {
    if (!ok) { setError("名前を入力してください"); return; }
    const id = roomId.trim().toUpperCase();
    if (id.length < 4) { setError("ルームIDを正しく入力してください"); return; }
    setLoading(true);
    setError("");
    const data = await loadBoard(id);
    if (data) {
      onJoin(name.trim(), id, false);
    } else {
      setError("ルーム「" + id + "」が見つかりません");
      setLoading(false);
    }
  };

  const ib = { padding: "14px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 15, outline: "none", fontFamily: FNT, textAlign: "center", width: "100%", boxSizing: "border-box" };
  const bp = { padding: "14px", borderRadius: 10, border: "none", width: "100%", background: "linear-gradient(135deg,#d4b06a,#c9a043)", color: "#2a2218", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: FNT };
  const bs = { ...bp, background: "transparent", border: "1.5px solid rgba(245,230,200,0.5)", color: "#fff" };
  const bd = { ...bp, opacity: 0.4, cursor: "not-allowed" };

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#1a1510 0%,#2e2720 40%,#3e3428 100%)", fontFamily: FNT }}>
      <link href="https://fonts.googleapis.com/css2?family=Klee+One&family=Zen+Kurenaido&display=swap" rel="stylesheet" />
      <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", borderRadius: 20, padding: "48px 44px", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", maxWidth: 440, width: "90%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📌</div>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: 0 }}>付箋ボード</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 6 }}>みんなで使えるリアルタイム共有付箋ボード</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginBottom: 6, display: "block", fontWeight: 600 }}>❶ あなたの表示名</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="例：Air" maxLength={12} style={ib} disabled={loading} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginBottom: 6, display: "block", fontWeight: 600 }}>❷ ボードを選ぶ</label>
          {!showJoin ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={doCreate} disabled={loading || !ok} style={ok && !loading ? bp : bd}>{loading ? "作成中..." : "✨ 新しいボードを作成する"}</button>
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>または</div>
              <button onClick={() => { if (ok) { setShowJoin(true); setError(""); } else setError("先に名前を入力してください"); }} style={ok ? bs : { ...bs, opacity: 0.4, cursor: "not-allowed" }}>🔗 ルームIDで既存ボードに参加</button>
              <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: 0, lineHeight: 1.8 }}>
                  <strong style={{ color: "rgba(255,255,255,0.9)" }}>📖 使い方：</strong><br />
                  ① 1人目が「新しいボードを作成する」をクリック<br />
                  ② 画面上部のルームID（6文字）をコピー<br />
                  ③ 仲間にIDを共有<br />
                  ④ 仲間は「ルームIDで参加」→ IDを入力して合流
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0, textAlign: "center" }}>仲間から共有されたルームIDを入力</p>
              <input type="text" value={roomId} onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(""); }} onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && doJoin()} placeholder="例：K7MX3P" maxLength={6} autoFocus style={{ ...ib, fontSize: 24, fontFamily: "monospace", letterSpacing: "0.3em" }} disabled={loading} />
              <button onClick={doJoin} disabled={loading || roomId.trim().length < 4} style={roomId.trim().length >= 4 && !loading ? bp : bd}>{loading ? "接続中..." : "このルームに参加する"}</button>
              <button onClick={() => { setShowJoin(false); setRoomId(""); setError(""); }} style={{ padding: 8, background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontFamily: FNT }}>← 戻る</button>
            </div>
          )}
        </div>

        {error && <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)", color: "#e8a09a", fontSize: 13, textAlign: "center" }}>⚠️ {error}</div>}
      </div>
    </div>
  );
}

/* ── Shape Item ── */
function ShapeItem({ shape, isSelected, onSelect, onDragStart, onRotateStart, onResize, onDelete, onLayerToggle, onColorChange }) {
  const s = shape;
  const sel = isSelected;
  const col = s.color || "#555";

  const renderSVG = () => {
    if (s.type === "arrow") {
      const mid = "ah-" + s.id;
      return (
        <svg width={s.w} height={s.h} style={{ overflow: "visible" }}>
          <defs>
            <marker id={mid} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0,10 3.5,0 7" fill={col} />
            </marker>
          </defs>
          <line x1="4" y1={s.h / 2} x2={s.w - 4} y2={s.h / 2} stroke={col} strokeWidth={2.5} markerEnd={"url(#" + mid + ")"} />
        </svg>
      );
    }
    if (s.type === "dotted-circle") {
      return (
        <svg width={s.w} height={s.h}>
          <ellipse cx={s.w / 2} cy={s.h / 2} rx={Math.max(4, s.w / 2 - 4)} ry={Math.max(4, s.h / 2 - 4)} fill="none" stroke={col} strokeWidth={2.5} strokeDasharray="8 5" />
        </svg>
      );
    }
    if (s.type === "dotted-rect") {
      return (
        <svg width={s.w} height={s.h}>
          <rect x="3" y="3" width={Math.max(4, s.w - 6)} height={Math.max(4, s.h - 6)} rx="4" fill="none" stroke={col} strokeWidth={2.5} strokeDasharray="8 5" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        position: "absolute", left: s.x, top: s.y, width: s.w, height: s.h,
        transform: "rotate(" + (s.rotation || 0) + "deg)",
        transformOrigin: "center center",
        zIndex: s.zIndex || 0, cursor: "move",
        outline: sel ? "2px dashed rgba(52,152,219,0.7)" : "none",
        outlineOffset: 4,
      }}
      onMouseDown={(e) => {
        if (e.target.closest("[data-sc]")) return;
        e.stopPropagation();
        onSelect(s.id);
        onDragStart(e, s.id);
      }}
      onTouchStart={(e) => {
        if (e.target.closest("[data-sc]")) return;
        e.stopPropagation();
        onSelect(s.id);
        onDragStart(e, s.id);
      }}
    >
      {renderSVG()}

      {sel && (
        <>
          {/* Rotation handle */}
          <div data-sc="1"
            onMouseDown={(e) => { e.stopPropagation(); onRotateStart(e, s.id); }}
            onTouchStart={(e) => { e.stopPropagation(); onRotateStart(e, s.id); }}
            style={{
              position: "absolute", top: -32, left: "50%", transform: "translateX(-50%)",
              width: 22, height: 22, borderRadius: "50%", background: "#3498db",
              cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.3)", border: "2px solid #fff",
            }} title="ドラッグで回転"
          >↻</div>
          <div style={{ position: "absolute", top: -12, left: "50%", width: 1, height: 12, background: "rgba(52,152,219,0.5)", transform: "translateX(-50%)" }} />

          {/* Resize handle */}
          <div data-sc="1"
            onMouseDown={(e) => { e.stopPropagation(); onResize(e, s.id); }}
            onTouchStart={(e) => { e.stopPropagation(); onResize(e, s.id); }}
            style={{
              position: "absolute", bottom: -6, right: -6, width: 14, height: 14,
              background: "#fff", border: "2px solid #3498db", borderRadius: 2,
              cursor: "nwse-resize", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }} title="ドラッグでサイズ変更"
          />

          {/* Right side vertical menu */}
          <div data-sc="1" onClick={(e) => e.stopPropagation()} style={{
            position: "absolute", top: -10, left: s.w + 12,
            display: "flex", flexDirection: "column", gap: 4, alignItems: "center",
            background: "#fff", padding: 6, borderRadius: 10,
            boxShadow: "0 3px 16px rgba(0,0,0,0.18)", minWidth: 36,
          }}>
            <button onClick={() => onLayerToggle(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "3px", borderRadius: 6, lineHeight: 1 }} title={s.layer === "above" ? "背面へ" : "前面へ"}>
              {s.layer === "above" ? "⬇" : "⬆"}
            </button>
            <div style={{ width: "100%", height: 1, background: "#eee" }} />
            {SHAPE_COLORS.map((c) => (
              <button key={c} onClick={() => onColorChange(s.id, c)} style={{
                width: 18, height: 18, borderRadius: "50%", background: c,
                border: s.color === c ? "2px solid #333" : "1.5px solid #ddd",
                cursor: "pointer", padding: 0,
              }} />
            ))}
            <div style={{ width: "100%", height: 1, background: "#eee" }} />
            <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "3px", color: "#e74c3c", borderRadius: 6, lineHeight: 1 }} title="削除">🗑</button>
          </div>

          {/* Angle display */}
          <div style={{ position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#888", whiteSpace: "nowrap", background: "rgba(255,255,255,0.85)", padding: "1px 6px", borderRadius: 4 }}>
            {Math.round(s.rotation || 0)}°
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sticky Note ── */
function StickyNote({ note, isDragging, onDragStart, onDelete, onEdit, onColorChange, onEditStart, onEditEnd, onDeselect }) {
  const color = COLORS.find((c) => c.name === note.color) || COLORS[0];
  const [showColors, setShowColors] = useState(false);

  return (
    <div
      style={{
        position: "absolute", left: note.x, top: note.y,
        width: note.width || 190, minHeight: 80,
        background: color.bg, borderLeft: "3px solid " + color.border,
        borderRadius: "2px 8px 8px 2px", padding: 0,
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isDragging
          ? "6px 10px 28px rgba(0,0,0,0.22), 2px 3px 8px " + color.shadow
          : "2px 3px 12px " + color.shadow + ", 1px 1px 3px rgba(0,0,0,0.08)",
        transform: "rotate(" + (note.rotation || 0) + "deg) scale(" + (isDragging ? 1.04 : 1) + ")",
        transition: isDragging ? "box-shadow 0.1s, transform 0.08s" : "box-shadow 0.25s, transform 0.2s, left 0.3s ease, top 0.3s ease",
        zIndex: note.zIndex || 1, userSelect: "none", fontFamily: FNT,
      }}
      onMouseDown={(e) => { if (e.target.closest("[data-no-drag]")) return; onDeselect(); onDragStart(e, note.id); }}
      onTouchStart={(e) => { if (e.target.closest("[data-no-drag]")) return; onDeselect(); onDragStart(e, note.id); }}
    >
      {note.author && <div style={{ position: "absolute", top: -8, left: 10, background: color.border, color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 6, fontWeight: 600, opacity: 0.7 }}>{note.author}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 6px 2px 8px", borderBottom: "1px solid " + color.border + "44" }}>
        <div style={{ display: "flex", gap: 3, position: "relative" }}>
          <button data-no-drag="true" onClick={() => setShowColors(!showColors)} style={{ width: 14, height: 14, borderRadius: "50%", background: color.border, border: "1.5px solid rgba(0,0,0,0.1)", cursor: "pointer", padding: 0 }} title="色を変更" />
          {showColors && (
            <div data-no-drag="true" style={{ position: "absolute", top: 20, left: 0, display: "flex", gap: 3, background: "#fff", padding: "4px 6px", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", zIndex: 999 }}>
              {COLORS.map((c) => (
                <button key={c.name} onClick={() => { onColorChange(note.id, c.name); setShowColors(false); }} style={{ width: 18, height: 18, borderRadius: "50%", background: c.border, border: note.color === c.name ? "2px solid #333" : "1.5px solid rgba(0,0,0,0.1)", cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          )}
        </div>
        <button data-no-drag="true" onClick={() => onDelete(note.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 16, lineHeight: 1, padding: "0 2px", fontFamily: "sans-serif" }} title="削除">×</button>
      </div>

      <div data-no-drag="true" contentEditable suppressContentEditableWarning
        onFocus={() => onEditStart(note.id)}
        onBlur={(e) => { onEdit(note.id, e.currentTarget.textContent); onEditEnd(); }}
        style={{ padding: "8px 10px 10px", fontSize: 14, lineHeight: 1.6, color: "#3e3a2e", outline: "none", minHeight: 40, wordBreak: "break-word", cursor: "text", letterSpacing: "0.02em" }}
      >
        {note.text}
      </div>
    </div>
  );
}

/* ── Export: build HTML ── */
function buildExportHTML(notes, shapes, w, h) {
  let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>付箋ボード</title></head><body style="margin:0;background:#f5f0e8;overflow:auto"><div style="position:relative;width:' + w + 'px;height:' + h + 'px;min-width:100vw;min-height:100vh">';

  for (const s of shapes) {
    const c = s.color || "#555";
    let inner = "";
    if (s.type === "arrow") {
      inner = '<svg width="' + s.w + '" height="' + s.h + '" style="overflow:visible"><defs><marker id="a' + s.id + '" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="' + c + '"/></marker></defs><line x1="4" y1="' + (s.h / 2) + '" x2="' + (s.w - 4) + '" y2="' + (s.h / 2) + '" stroke="' + c + '" stroke-width="2.5" marker-end="url(#a' + s.id + ')"/></svg>';
    } else if (s.type === "dotted-circle") {
      inner = '<svg width="' + s.w + '" height="' + s.h + '"><ellipse cx="' + (s.w / 2) + '" cy="' + (s.h / 2) + '" rx="' + Math.max(4, s.w / 2 - 4) + '" ry="' + Math.max(4, s.h / 2 - 4) + '" fill="none" stroke="' + c + '" stroke-width="2.5" stroke-dasharray="8 5"/></svg>';
    } else if (s.type === "dotted-rect") {
      inner = '<svg width="' + s.w + '" height="' + s.h + '"><rect x="3" y="3" width="' + Math.max(4, s.w - 6) + '" height="' + Math.max(4, s.h - 6) + '" rx="4" fill="none" stroke="' + c + '" stroke-width="2.5" stroke-dasharray="8 5"/></svg>';
    }
    html += '<div style="position:absolute;left:' + s.x + 'px;top:' + s.y + 'px;width:' + s.w + 'px;height:' + s.h + 'px;transform:rotate(' + (s.rotation || 0) + 'deg);transform-origin:center center;z-index:' + (s.zIndex || 0) + '">' + inner + '</div>';
  }

  for (const n of notes) {
    const c = COLORS.find((cc) => cc.name === n.color) || COLORS[0];
    const escaped = (n.text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html += '<div style="position:absolute;left:' + n.x + 'px;top:' + n.y + 'px;width:' + (n.width || 190) + 'px;min-height:80px;background:' + c.bg + ';border-left:3px solid ' + c.border + ';border-radius:2px 8px 8px 2px;padding:10px 12px;font-size:14px;line-height:1.6;color:#3e3a2e;transform:rotate(' + (n.rotation || 0) + 'deg);box-shadow:2px 3px 12px ' + c.shadow + ';z-index:' + (n.zIndex || 1) + ';font-family:sans-serif;word-break:break-word">' + escaped + '</div>';
  }

  html += '</div></body></html>';
  return html;
}

/* ── Export: PNG via Canvas ── */
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function exportToPNG(notes, shapes, boardW, boardH, roomId, showToast) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(boardW, 4000);
    canvas.height = Math.min(boardH, 4000);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Shapes
    for (const s of shapes) {
      const c = s.color || "#555";
      ctx.save();
      ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
      ctx.rotate(((s.rotation || 0) * Math.PI) / 180);
      ctx.translate(-s.w / 2, -s.h / 2);
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.5;

      if (s.type === "arrow") {
        ctx.beginPath();
        ctx.moveTo(4, s.h / 2);
        ctx.lineTo(s.w - 14, s.h / 2);
        ctx.stroke();
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(s.w - 4, s.h / 2);
        ctx.lineTo(s.w - 14, s.h / 2 - 5);
        ctx.lineTo(s.w - 14, s.h / 2 + 5);
        ctx.closePath();
        ctx.fill();
      } else if (s.type === "dotted-circle") {
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.ellipse(s.w / 2, s.h / 2, Math.max(4, s.w / 2 - 4), Math.max(4, s.h / 2 - 4), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (s.type === "dotted-rect") {
        ctx.setLineDash([8, 5]);
        drawRoundedRect(ctx, 3, 3, Math.max(4, s.w - 6), Math.max(4, s.h - 6), 4);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // Notes
    for (const n of notes) {
      const c = COLORS.find((cc) => cc.name === n.color) || COLORS[0];
      const nw = n.width || 190;
      const textLines = [];
      ctx.font = "14px sans-serif";
      let line = "";
      for (const ch of (n.text || "")) {
        if (ctx.measureText(line + ch).width > nw - 24) {
          textLines.push(line);
          line = ch;
        } else {
          line += ch;
        }
      }
      if (line) textLines.push(line);
      const nh = Math.max(80, textLines.length * 20 + 24);

      ctx.save();
      ctx.translate(n.x + nw / 2, n.y + nh / 2);
      ctx.rotate(((n.rotation || 0) * Math.PI) / 180);
      ctx.translate(-nw / 2, -nh / 2);

      ctx.shadowColor = c.shadow;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = c.bg;
      drawRoundedRect(ctx, 0, 0, nw, nh, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.fillStyle = c.border;
      ctx.fillRect(0, 0, 3, nh);

      ctx.fillStyle = "#3e3a2e";
      ctx.font = "14px sans-serif";
      textLines.forEach((txt, i) => {
        ctx.fillText(txt, 12, 22 + i * 20);
      });
      ctx.restore();
    }

    canvas.toBlob((blob) => {
      if (!blob) { showToast("PNG保存に失敗しました"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "board-" + roomId + ".png";
      a.click();
      URL.revokeObjectURL(url);
      showToast("🖼️ PNG保存しました");
    }, "image/png");
  } catch (err) {
    console.error(err);
    showToast("PNG保存に失敗しました");
  }
}

/* ── Board Screen ── */
function BoardScreen({ userName, roomId, onLeave }) {
  const scrollRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [members, setMembers] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dragType, setDragType] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newText, setNewText] = useState("");
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [maxZ, setMaxZ] = useState(100);
  const [initialized, setInitialized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedShape, setSelectedShape] = useState(null);
  const [shapeColor, setShapeColor] = useState("#e74c3c");
  const [showShapePanel, setShowShapePanel] = useState(false);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const [rotating, setRotating] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const dragOffset = useRef({ x: 0, y: 0 });
  const autoScrollRef = useRef(null);
  const lastSyncRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  const rotateCenter = useRef({ cx: 0, cy: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const didDragRef = useRef(false);
  const userColor = USER_COLORS[userName.charCodeAt(0) % USER_COLORS.length];

  const showT = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg: "", visible: false }), 1800);
  };

  const doSave = useCallback((n, s) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      lastSyncRef.current = Date.now();
      await saveBoard(roomId, { notes: n, shapes: s });
    }, 200);
  }, [roomId]);

  const saveAll = useCallback((n, s) => {
    setNotes(n);
    setShapes(s);
    doSave(n, s);
  }, [doSave]);

  // Init
  useEffect(() => {
    (async () => {
      const d = await loadBoard(roomId);
      if (d) {
        setNotes(d.notes || []);
        setShapes(d.shapes || []);
        const all = [...(d.notes || []), ...(d.shapes || [])];
        setMaxZ(all.reduce((m, i) => Math.max(m, i.zIndex || 0), 100));
      }
      setInitialized(true);
    })();
  }, [roomId]);

  // Polling
  useEffect(() => {
    if (!initialized) return;
    const poll = async () => {
      await updatePresence(roomId, { name: userName, color: userColor });
      setMembers(await loadPresence(roomId));
      if (Date.now() - lastSyncRef.current > 800) {
        const d = await loadBoard(roomId);
        if (d && d.updatedAt > lastSyncRef.current) {
          setNotes((prev) => {
            const remote = d.notes || [];
            if (dragging && dragType === "note") {
              return remote.map((rn) => {
                if (rn.id === dragging) {
                  const l = prev.find((ln) => ln.id === rn.id);
                  return l || rn;
                }
                return rn;
              });
            }
            return remote;
          });
          setShapes((prev) => {
            const remote = d.shapes || [];
            if ((dragging && dragType === "shape") || rotating || resizing) {
              return remote.map((rs) => {
                if (rs.id === dragging || rs.id === rotating || rs.id === resizing) {
                  const l = prev.find((ls) => ls.id === rs.id);
                  return l || rs;
                }
                return rs;
              });
            }
            return remote;
          });
        }
      }
    };
    const iv = setInterval(poll, 1500);
    poll();
    return () => clearInterval(iv);
  }, [initialized, roomId, userName, userColor, dragging, dragType, rotating, resizing]);

  const boardSize = (() => {
    let mx = 1400, my = 900;
    for (const n of notes) {
      mx = Math.max(mx, n.x + (n.width || 195) + 150);
      my = Math.max(my, n.y + 250);
    }
    for (const s of shapes) {
      mx = Math.max(mx, s.x + s.w + 100);
      my = Math.max(my, s.y + s.h + 100);
    }
    return { width: mx, height: my };
  })();

  // Drag start handlers
  const handleNoteDragStart = useCallback((e, id) => {
    e.preventDefault();
    didDragRef.current = false;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const c = scrollRef.current;
    if (!c) return;
    const n = notes.find((n) => n.id === id);
    if (!n) return;
    const r = c.getBoundingClientRect();
    dragOffset.current = { x: cx - r.left + c.scrollLeft - n.x, y: cy - r.top + c.scrollTop - n.y };
    const nz = maxZ + 1;
    setMaxZ(nz);
    setNotes((prev) => {
      const u = prev.map((p) => (p.id === id ? { ...p, zIndex: nz } : p));
      doSave(u, shapes);
      return u;
    });
    setDragging(id);
    setDragType("note");
  }, [notes, shapes, maxZ, doSave]);

  const handleShapeDragStart = useCallback((e, id) => {
    e.preventDefault();
    didDragRef.current = false;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const c = scrollRef.current;
    if (!c) return;
    const s = shapes.find((s) => s.id === id);
    if (!s) return;
    const r = c.getBoundingClientRect();
    dragOffset.current = { x: cx - r.left + c.scrollLeft - s.x, y: cy - r.top + c.scrollTop - s.y };
    setDragging(id);
    setDragType("shape");
  }, [shapes]);

  const handleRotateStart = useCallback((e, id) => {
    e.preventDefault();
    const s = shapes.find((s) => s.id === id);
    if (!s) return;
    const c = scrollRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    rotateCenter.current = { cx: s.x + s.w / 2 - c.scrollLeft + r.left, cy: s.y + s.h / 2 - c.scrollTop + r.top };
    setRotating(id);
  }, [shapes]);

  const handleResizeStart = useCallback((e, id) => {
    e.preventDefault();
    const s = shapes.find((s) => s.id === id);
    if (!s) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    resizeStart.current = { x: cx, y: cy, w: s.w, h: s.h };
    setResizing(id);
  }, [shapes]);

  // Global move/end handler
  useEffect(() => {
    const hasDrag = dragging !== null;
    const hasRot = rotating !== null;
    const hasRes = resizing !== null;
    if (!hasDrag && !hasRot && !hasRes) return;

    const handleMove = (e) => {
      e.preventDefault();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      didDragRef.current = true;

      if (hasRot) {
        const oc = rotateCenter.current;
        const a = Math.atan2(cy - oc.cy, cx - oc.cx) * (180 / Math.PI) + 90;
        const norm = ((a % 360) + 360) % 360;
        setShapes((p) => p.map((s) => (s.id === rotating ? { ...s, rotation: Math.round(norm) } : s)));
        return;
      }
      if (hasRes) {
        const dx = cx - resizeStart.current.x;
        const dy = cy - resizeStart.current.y;
        setShapes((p) => p.map((s) => (s.id === resizing ? { ...s, w: Math.max(30, resizeStart.current.w + dx), h: Math.max(20, resizeStart.current.h + dy) } : s)));
        return;
      }
      if (hasDrag) {
        const container = scrollRef.current;
        if (!container) return;
        const r = container.getBoundingClientRect();
        const nx = cx - r.left + container.scrollLeft - dragOffset.current.x;
        const ny = cy - r.top + container.scrollTop - dragOffset.current.y;
        if (dragType === "note") {
          setNotes((p) => p.map((n) => (n.id === dragging ? { ...n, x: Math.max(0, nx), y: Math.max(0, ny) } : n)));
        } else {
          setShapes((p) => p.map((s) => (s.id === dragging ? { ...s, x: Math.max(0, nx), y: Math.max(0, ny) } : s)));
        }
        // Auto-scroll
        if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
        const doScroll = () => {
          let moved = false;
          if (cx - r.left < 60) { container.scrollLeft -= 15; moved = true; }
          if (r.right - cx < 60) { container.scrollLeft += 15; moved = true; }
          if (cy - r.top < 60) { container.scrollTop -= 15; moved = true; }
          if (r.bottom - cy < 60) { container.scrollTop += 15; moved = true; }
          if (moved) autoScrollRef.current = requestAnimationFrame(doScroll);
        };
        doScroll();
      }
    };

    const handleEnd = () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
      // Save
      setNotes((n) => {
        setShapes((s) => {
          lastSyncRef.current = Date.now();
          saveBoard(roomId, { notes: n, shapes: s });
          return s;
        });
        return n;
      });
      setDragging(null);
      setDragType(null);
      setRotating(null);
      setResizing(null);
    };

    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [dragging, dragType, rotating, resizing, roomId]);

  // Canvas click - deselect only if not dragging
  const handleCanvasClick = useCallback((e) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    // Check if clicking empty area
    const tag = e.target.tagName;
    const isDot = e.target.hasAttribute("data-dots");
    if (e.target === e.currentTarget || isDot || tag === "rect" || tag === "circle" || tag === "pattern") {
      setSelectedShape(null);
    }
  }, []);

  // Actions
  const addNote = () => {
    if (!newText.trim()) return;
    const c = scrollRef.current;
    const nz = maxZ + 1;
    setMaxZ(nz);
    const nn = {
      id: gid(), text: newText.trim(),
      x: (c ? c.scrollLeft : 0) + 80 + Math.random() * 200,
      y: (c ? c.scrollTop : 0) + 40 + Math.random() * 120,
      color: selectedColor, rotation: (Math.random() - 0.5) * 5,
      zIndex: nz, width: 195, author: userName,
    };
    saveAll([...notes, nn], shapes);
    setNewText("");
  };

  const deleteNote = (id) => saveAll(notes.filter((n) => n.id !== id), shapes);
  const editNote = (id, text) => saveAll(notes.map((n) => (n.id === id ? { ...n, text } : n)), shapes);
  const changeNoteColor = (id, c) => saveAll(notes.map((n) => (n.id === id ? { ...n, color: c } : n)), shapes);

  const addShape = (type) => {
    const c = scrollRef.current;
    const nz = maxZ + 1;
    setMaxZ(nz);
    const defs = { arrow: { w: 160, h: 40 }, "dotted-circle": { w: 120, h: 120 }, "dotted-rect": { w: 160, h: 100 } };
    const d = defs[type] || { w: 120, h: 80 };
    const ns = {
      id: gid(), type,
      x: (c ? c.scrollLeft : 0) + 200 + Math.random() * 100,
      y: (c ? c.scrollTop : 0) + 100 + Math.random() * 80,
      w: d.w, h: d.h, rotation: 0, color: shapeColor, zIndex: nz, layer: "above",
    };
    setSelectedShape(ns.id);
    saveAll(notes, [...shapes, ns]);
    showT((SHAPE_TYPES.find((t) => t.type === type) || {}).label + " を追加");
  };

  const deleteShape = (id) => { setSelectedShape(null); saveAll(notes, shapes.filter((s) => s.id !== id)); };
  const toggleLayer = (id) => {
    saveAll(notes, shapes.map((s) => {
      if (s.id !== id) return s;
      const nl = s.layer === "above" ? "below" : "above";
      const nz = nl === "below" ? 0 : maxZ + 1;
      if (nl === "above") setMaxZ((p) => p + 1);
      return { ...s, layer: nl, zIndex: nz };
    }));
  };
  const changeShapeColor = (id, c) => saveAll(notes, shapes.map((s) => (s.id === id ? { ...s, color: c } : s)));
  const copyRoomId = () => { navigator.clipboard && navigator.clipboard.writeText(roomId).then(() => showT("✅ ルームIDをコピーしました")); };

  const doExportHTML = () => {
    const html = buildExportHTML(notes, shapes, boardSize.width, boardSize.height);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "board-" + roomId + ".html";
    a.click();
    URL.revokeObjectURL(url);
    showT("📄 HTML保存しました");
    setShowExport(false);
  };

  const doExportPNG = () => {
    exportToPNG(notes, shapes, boardSize.width, boardSize.height, roomId, showT);
    setShowExport(false);
  };

  if (!initialized) {
    return (
      <div style={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#3e3428", color: "#f5e6c8", fontFamily: FNT }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📌</div>
          <div>読み込み中...</div>
        </div>
      </div>
    );
  }

  const belowShapes = shapes.filter((s) => s.layer === "below");
  const aboveShapes = shapes.filter((s) => s.layer !== "below");

  const tbBtn = { padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(245,230,200,0.2)", background: "rgba(255,255,255,0.06)", color: "#f5e6c8", fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" };

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", fontFamily: FNT, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Klee+One&family=Zen+Kurenaido&display=swap" rel="stylesheet" />
      <Toast msg={toast.msg} visible={toast.visible} />

      {/* Toolbar */}
      <div style={{ flexShrink: 0, background: "linear-gradient(135deg,#5d4e37 0%,#3e3428 100%)", padding: "7px 12px", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 2px 16px rgba(0,0,0,0.2)", zIndex: 10000, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#f5e6c8", whiteSpace: "nowrap" }}>📌 付箋ボード</span>

        <button onClick={copyRoomId} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 6, border: "1px solid rgba(245,230,200,0.2)", background: "rgba(255,255,255,0.06)", cursor: "pointer", color: "#f5e6c8", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.15em" }} title="クリックでコピー">🔗 {roomId}</button>

        <div style={{ display: "flex", alignItems: "center" }}>
          {members.map((m, i) => (
            <div key={m.name} style={{ width: 22, height: 22, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700, border: "2px solid #3e3428", marginLeft: i > 0 ? -4 : 0 }} title={m.name}>{m.name.charAt(0)}</div>
          ))}
          <span style={{ fontSize: 9, color: "rgba(245,230,200,0.4)", marginLeft: 4, whiteSpace: "nowrap" }}>{members.length}人</span>
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(245,230,200,0.15)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 140 }}>
          <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && addNote()} placeholder="付箋テキスト..." style={{ flex: 1, padding: "5px 9px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.1)", color: "#f5e6c8", fontSize: 12, outline: "none", fontFamily: "inherit", minWidth: 60 }} />
          <div style={{ display: "flex", gap: 2 }}>
            {COLORS.map((c) => (
              <button key={c.name} onClick={() => setSelectedColor(c.name)} style={{ width: 16, height: 16, borderRadius: "50%", background: c.bg, border: selectedColor === c.name ? "2px solid #f5e6c8" : "1.5px solid rgba(255,255,255,0.2)", cursor: "pointer", padding: 0 }} />
            ))}
          </div>
          <button onClick={addNote} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "linear-gradient(135deg,#c9a96e,#b8943f)", color: "#3e3428", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>追加</button>
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(245,230,200,0.15)" }} />

        <div style={{ position: "relative" }}>
          <button onClick={() => setShowShapePanel(!showShapePanel)} style={{ ...tbBtn, border: showShapePanel ? "1px solid rgba(201,169,110,0.6)" : tbBtn.border, background: showShapePanel ? "rgba(201,169,110,0.15)" : tbBtn.background }}>🔷 図形</button>
          {showShapePanel && (
            <div style={{ position: "absolute", top: 0, left: "100%", marginLeft: 6, background: "rgba(62,52,40,0.97)", borderRadius: 10, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", padding: "10px 12px", zIndex: 30000, display: "flex", flexDirection: "column", gap: 6, minWidth: 130, border: "1px solid rgba(245,230,200,0.15)" }}>
              <span style={{ color: "rgba(245,230,200,0.7)", fontSize: 10, fontWeight: 600 }}>図形を追加</span>
              {SHAPE_TYPES.map((st) => (
                <button key={st.type} onClick={() => addShape(st.type)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(245,230,200,0.2)", background: "rgba(255,255,255,0.06)", color: "#f5e6c8", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>{st.label}</button>
              ))}
              <div style={{ height: 1, background: "rgba(245,230,200,0.15)" }} />
              <span style={{ color: "rgba(245,230,200,0.7)", fontSize: 10, fontWeight: 600 }}>色</span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {SHAPE_COLORS.map((c) => (
                  <button key={c} onClick={() => setShapeColor(c)} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: shapeColor === c ? "2px solid #f5e6c8" : "1.5px solid rgba(255,255,255,0.2)", cursor: "pointer", padding: 0 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <button onClick={() => setShowExport(!showExport)} style={tbBtn}>💾 保存</button>
          {showExport && (
            <div style={{ position: "absolute", top: 32, right: 0, background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", padding: 6, zIndex: 30000, minWidth: 150, display: "flex", flexDirection: "column", gap: 2 }}>
              <button onClick={doExportPNG} style={{ padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, textAlign: "left", borderRadius: 6, fontFamily: "inherit", color: "#333" }}>🖼️ PNG画像で保存</button>
              <button onClick={doExportHTML} style={{ padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, textAlign: "left", borderRadius: 6, fontFamily: "inherit", color: "#333" }}>📄 HTMLで保存</button>
            </div>
          )}
        </div>

        <span style={{ fontSize: 9, color: "rgba(245,230,200,0.3)", whiteSpace: "nowrap" }}>{notes.length}枚 {shapes.length}図形</span>
        <button onClick={() => setShowHelp(!showHelp)} style={{ ...tbBtn, padding: "3px 7px" }}>❓</button>
        <button onClick={onLeave} style={{ background: "none", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 6, color: "rgba(231,76,60,0.7)", fontSize: 10, padding: "3px 7px", cursor: "pointer", fontFamily: "inherit" }}>退室</button>
      </div>



      {/* Help */}
      {showHelp && (
        <div style={{ position: "absolute", top: 50, right: 14, zIndex: 20000, background: "#3e3428", border: "1px solid rgba(245,230,200,0.2)", borderRadius: 12, padding: "16px 18px", maxWidth: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          <div style={{ color: "#f5e6c8", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>使い方</div>
          <div style={{ color: "rgba(245,230,200,0.6)", fontSize: 12, lineHeight: 1.8 }}>
            <strong>🔗 ルームID：</strong>クリックでコピー → 仲間に共有<br />
            <strong>📌 付箋：</strong>テキスト入力 → 色選択 → 「追加」<br />
            <strong>🔷 図形：</strong>「図形」ボタン → 種類と色を選んでクリック<br />
            <strong>↻ 回転：</strong>図形をクリック → 上の青い丸をドラッグ<br />
            <strong>↔ サイズ：</strong>図形をクリック → 右下の□をドラッグ<br />
            <strong>⬆⬇色🗑：</strong>図形をクリック → 右の縦メニュー<br />
            <strong>💾 保存：</strong>PNG画像またはHTMLで盤面を保存<br /><br />
            <span style={{ opacity: 0.5 }}>※ 同期は約1.5秒間隔</span>
          </div>
          <button onClick={() => setShowHelp(false)} style={{ marginTop: 10, width: "100%", padding: "6px", borderRadius: 6, border: "1px solid rgba(245,230,200,0.2)", background: "transparent", color: "#f5e6c8", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>閉じる</button>
        </div>
      )}

      {/* Canvas */}
      <div ref={scrollRef} onClick={handleCanvasClick} style={{
        flex: 1, overflow: "auto", position: "relative",
        background: "radial-gradient(ellipse at 30% 20%,rgba(210,180,140,0.15) 0%,transparent 60%),radial-gradient(ellipse at 80% 70%,rgba(180,160,130,0.1) 0%,transparent 50%),#f5f0e8",
      }}>
        <div style={{ position: "relative", width: boardSize.width, height: boardSize.height, minWidth: "100%", minHeight: "100%" }}>
          <svg data-dots="1" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.15 }} width="100%" height="100%">
            <defs>
              <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="0.8" fill="#8b7355" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>

          {belowShapes.map((s) => (
            <ShapeItem key={s.id} shape={s} isSelected={selectedShape === s.id} onSelect={setSelectedShape} onDragStart={handleShapeDragStart} onRotateStart={handleRotateStart} onResize={handleResizeStart} onDelete={deleteShape} onLayerToggle={toggleLayer} onColorChange={changeShapeColor} />
          ))}

          {notes.map((note) => (
            <StickyNote key={note.id} note={note} isDragging={dragging === note.id && dragType === "note"} onDragStart={handleNoteDragStart} onDelete={deleteNote} onEdit={editNote} onColorChange={changeNoteColor} onEditStart={setEditingId} onEditEnd={() => setEditingId(null)} onDeselect={() => setSelectedShape(null)} />
          ))}

          {aboveShapes.map((s) => (
            <ShapeItem key={s.id} shape={s} isSelected={selectedShape === s.id} onSelect={setSelectedShape} onDragStart={handleShapeDragStart} onRotateStart={handleRotateStart} onResize={handleResizeStart} onDelete={deleteShape} onLayerToggle={toggleLayer} onColorChange={changeShapeColor} />
          ))}

          {notes.length === 0 && shapes.length === 0 && (
            <div style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📌</div>
              <div style={{ color: "#b5a48a", fontSize: 16, marginBottom: 8 }}>付箋や図形を追加してみましょう</div>
              <div style={{ color: "#c9b99a", fontSize: 13, lineHeight: 1.8 }}>
                ルームID <span style={{ fontFamily: "monospace", letterSpacing: "0.2em", background: "rgba(139,115,85,0.15)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>{roomId}</span> を仲間に共有して一緒に使おう
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Root ── */
export default function CollabStickyNotesApp() {
  const [session, setSession] = useState(null);

  if (!session) {
    return <JoinScreen onJoin={(n, r, c) => setSession({ name: n, roomId: r, isCreator: c })} />;
  }

  return <BoardScreen userName={session.name} roomId={session.roomId} onLeave={() => setSession(null)} />;
}
