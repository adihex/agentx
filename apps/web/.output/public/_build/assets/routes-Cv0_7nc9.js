import { i as e, n as t, t as n } from "./jsx-runtime-ByY1xr43.js";
var r = e(t(), 1),
  i = n(),
  a = ({ value: e, onChange: t, onScan: n, disabled: r }) =>
    (0, i.jsxs)(`div`, {
      style: { display: `flex`, gap: `0.5rem`, marginBottom: `2rem` },
      children: [
        (0, i.jsx)(`input`, {
          type: `text`,
          value: e,
          onChange: (e) => t(e.target.value),
          onKeyPress: (e) => e.key === `Enter` && n(),
          placeholder: `Enter song name (e.g. 'Stairway to Heaven')`,
          disabled: r,
          style: {
            flex: 1,
            padding: `0.75rem 1rem`,
            borderRadius: `0.5rem`,
            border: `1px solid #333`,
            backgroundColor: `#0a0a0a`,
            color: `#fff`,
            outline: `none`,
            opacity: r ? 0.6 : 1,
          },
        }),
        (0, i.jsx)(`button`, {
          onClick: n,
          disabled: r || !e.trim(),
          style: {
            padding: `0.75rem 1.5rem`,
            borderRadius: `0.5rem`,
            border: `none`,
            backgroundColor: `#00f2fe`,
            color: `#000`,
            fontWeight: `bold`,
            cursor: r || !e.trim() ? `not-allowed` : `pointer`,
            opacity: r || !e.trim() ? 0.6 : 1,
          },
          children: `Scan`,
        }),
      ],
    }),
  o = ({ progress: e, label: t }) =>
    (0, i.jsxs)(`div`, {
      style: { marginBottom: `2rem` },
      children: [
        (0, i.jsxs)(`div`, {
          style: { display: `flex`, justifyContent: `space-between`, marginBottom: `0.5rem` },
          children: [
            (0, i.jsx)(`span`, { style: { fontSize: `0.875rem`, color: `#aaa` }, children: t }),
            (0, i.jsxs)(`span`, {
              style: { fontSize: `0.875rem`, fontWeight: `bold`, color: `#00f2fe` },
              children: [e, `%`],
            }),
          ],
        }),
        (0, i.jsx)(`div`, {
          style: {
            height: `8px`,
            backgroundColor: `#0a0a0a`,
            borderRadius: `4px`,
            overflow: `hidden`,
          },
          children: (0, i.jsx)(`div`, {
            role: `progressbar`,
            "aria-valuenow": e,
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            style: {
              width: `${e}%`,
              height: `100%`,
              background: `linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)`,
              transition: `width 0.5s ease`,
            },
          }),
        }),
      ],
    }),
  s = (e) => e.replace(/([a-z0-9])([A-Z])/g, `$1-$2`).toLowerCase(),
  c = (...e) => e.filter((e, t, n) => !!e && n.indexOf(e) === t).join(` `),
  l = {
    xmlns: `http://www.w3.org/2000/svg`,
    width: 24,
    height: 24,
    viewBox: `0 0 24 24`,
    fill: `none`,
    stroke: `currentColor`,
    strokeWidth: 2,
    strokeLinecap: `round`,
    strokeLinejoin: `round`,
  },
  u = (0, r.forwardRef)(
    (
      {
        color: e = `currentColor`,
        size: t = 24,
        strokeWidth: n = 2,
        absoluteStrokeWidth: i,
        className: a = ``,
        children: o,
        iconNode: s,
        ...u
      },
      d,
    ) =>
      (0, r.createElement)(
        `svg`,
        {
          ref: d,
          ...l,
          width: t,
          height: t,
          stroke: e,
          strokeWidth: i ? (Number(n) * 24) / Number(t) : n,
          className: c(`lucide`, a),
          ...u,
        },
        [...s.map(([e, t]) => (0, r.createElement)(e, t)), ...(Array.isArray(o) ? o : [o])],
      ),
  ),
  d = (e, t) => {
    let n = (0, r.forwardRef)(({ className: n, ...i }, a) =>
      (0, r.createElement)(u, { ref: a, iconNode: t, className: c(`lucide-${s(e)}`, n), ...i }),
    );
    return ((n.displayName = `${e}`), n);
  },
  f = d(`CircleCheckBig`, [
    [`path`, { d: `M22 11.08V12a10 10 0 1 1-5.93-9.14`, key: `g774vq` }],
    [`path`, { d: `m9 11 3 3L22 4`, key: `1pflzl` }],
  ]),
  p = d(`Download`, [
    [`path`, { d: `M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`, key: `ih7n3h` }],
    [`polyline`, { points: `7 10 12 15 17 10`, key: `2ggqvy` }],
    [`line`, { x1: `12`, x2: `12`, y1: `15`, y2: `3`, key: `1vk2je` }],
  ]),
  m = d(`FileAudio`, [
    [`path`, { d: `M17.5 22h.5a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3`, key: `rslqgf` }],
    [`path`, { d: `M14 2v4a2 2 0 0 0 2 2h4`, key: `tnqrlb` }],
    [
      `path`,
      {
        d: `M2 19a2 2 0 1 1 4 0v1a2 2 0 1 1-4 0v-4a6 6 0 0 1 12 0v4a2 2 0 1 1-4 0v-1a2 2 0 1 1 4 0`,
        key: `9f7x3i`,
      },
    ],
  ]),
  h = d(`LoaderCircle`, [[`path`, { d: `M21 12a9 9 0 1 1-6.219-8.56`, key: `13zald` }]]),
  g = [
    {
      id: `search`,
      label: `Search`,
      icon: d(`Search`, [
        [`circle`, { cx: `11`, cy: `11`, r: `8`, key: `4ej97u` }],
        [`path`, { d: `m21 21-4.3-4.3`, key: `1qie3q` }],
      ]),
    },
    { id: `download`, label: `Download`, icon: p },
    { id: `extract`, label: `Extract`, icon: m },
    { id: `done`, label: `Complete`, icon: f },
  ],
  _ = ({ activeStep: e, progress: t }) =>
    (0, i.jsxs)(`div`, {
      style: {
        display: `grid`,
        gridTemplateColumns: `repeat(4, 1fr)`,
        gap: `1rem`,
        marginBottom: `2rem`,
      },
      children: [
        g.map((n) => {
          let r = n.icon,
            a = e === n.id,
            o = g.findIndex((t) => t.id === e),
            s = g.findIndex((e) => e.id === n.id),
            c = t === 100 || (e !== null && o > s);
          return (0, i.jsxs)(
            `div`,
            {
              "data-testid": `step-${n.id}`,
              style: {
                display: `flex`,
                flexDirection: `column`,
                alignItems: `center`,
                opacity: a || c ? 1 : 0.3,
                transition: `opacity 0.3s`,
              },
              children: [
                (0, i.jsx)(`div`, {
                  style: {
                    width: `40px`,
                    height: `40px`,
                    borderRadius: `50%`,
                    backgroundColor: c ? `#00f2fe` : `#333`,
                    display: `flex`,
                    alignItems: `center`,
                    justifyContent: `center`,
                    marginBottom: `0.5rem`,
                    color: c ? `#000` : `#fff`,
                  },
                  children: a
                    ? (0, i.jsx)(h, { size: 20, style: { animation: `spin 1s linear infinite` } })
                    : (0, i.jsx)(r, { size: 20 }),
                }),
                (0, i.jsx)(`span`, {
                  style: { fontSize: `0.75rem`, color: c ? `#00f2fe` : `#fff` },
                  children: n.label,
                }),
              ],
            },
            n.id,
          );
        }),
        (0, i.jsx)(`style`, {
          children: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `,
        }),
      ],
    }),
  v = ({ logs: e, status: t }) =>
    (0, i.jsxs)(`div`, {
      style: {
        backgroundColor: `#0a0a0a`,
        borderRadius: `0.5rem`,
        padding: `1rem`,
        border: `1px solid #333`,
      },
      children: [
        (0, i.jsxs)(`div`, {
          style: {
            fontSize: `0.75rem`,
            color: `#666`,
            marginBottom: `0.5rem`,
            display: `flex`,
            justifyContent: `space-between`,
          },
          children: [
            (0, i.jsx)(`span`, { children: `SYSTEM LOG` }),
            (0, i.jsx)(`span`, {
              style: { color: t === `Connected` ? `#4caf50` : `#f44336` },
              children: t.toUpperCase(),
            }),
          ],
        }),
        e.map((e, t) =>
          (0, i.jsx)(
            `div`,
            {
              style: {
                fontSize: `0.875rem`,
                color: `#ddd`,
                marginBottom: `0.25rem`,
                whiteSpace: `nowrap`,
                overflow: `hidden`,
                textOverflow: `ellipsis`,
              },
              children: `> ${e}`,
            },
            t,
          ),
        ),
      ],
    }),
  y = function () {
    let [e, t] = (0, r.useState)(``),
      [n, s] = (0, r.useState)(`Disconnected`),
      [c, l] = (0, r.useState)([]),
      [u, d] = (0, r.useState)(0),
      [f, p] = (0, r.useState)(null),
      [m, h] = (0, r.useState)(``),
      g = (0, r.useRef)(null);
    (0, r.useEffect)(() => (y(), () => g.current?.close()), []);
    let y = () => {
        let e = new WebSocket(`ws://localhost:9222`);
        ((g.current = e),
          (e.onopen = () => {
            (s(`Connected`), x(`Connected to agentx runtime.`));
          }),
          (e.onmessage = (e) => {
            b(JSON.parse(e.data));
          }),
          (e.onclose = () => {
            (s(`Disconnected`), x(`Disconnected. Retrying...`), setTimeout(y, 3e3));
          }));
      },
      b = (e) => {
        if (
          (e.method === `Music.Status` && x(e.params.message),
          e.method === `Toolchain.responseReceived`)
        ) {
          let { toolName: t, result: n } = e.params;
          if (!n.success) {
            x(`Error in ${t}: ${n.error}`);
            return;
          }
          t === `searchMusic`
            ? (p(`download`), d(25), x(`Found: ${n.bestMatch.title}. Downloading...`))
            : t === `downloadAndUpload`
              ? (p(`extract`), d(50), x(`Uploaded to GCS. Triggering Cloud Run job...`))
              : t === `triggerCloudRun` &&
                (p(`done`),
                d(100),
                x(`Extraction complete! Your file is ready in the output bucket.`));
        }
      },
      x = (e) => {
        l((t) => [...t.slice(-4), e]);
      };
    return (0, i.jsx)(`div`, {
      style: {
        minHeight: `100vh`,
        display: `flex`,
        flexDirection: `column`,
        alignItems: `center`,
        justifyContent: `center`,
        padding: `2rem`,
      },
      children: (0, i.jsxs)(`div`, {
        style: {
          maxWidth: `600px`,
          width: `100%`,
          backgroundColor: `#1a1a1a`,
          borderRadius: `1rem`,
          padding: `2rem`,
          boxShadow: `0 10px 25px rgba(0,0,0,0.5)`,
          border: `1px solid #333`,
        },
        children: [
          (0, i.jsx)(`h1`, {
            style: {
              textAlign: `center`,
              margin: `0 0 1.5rem`,
              background: `linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)`,
              WebkitBackgroundClip: `text`,
              WebkitTextFillColor: `transparent`,
              fontSize: `2.5rem`,
            },
            children: `Music Scanner`,
          }),
          (0, i.jsx)(a, {
            value: e,
            onChange: t,
            onScan: () => {
              e.trim() &&
                (h(e),
                p(`search`),
                d(5),
                x(`Initializing extraction workflow for "${e}"...`),
                g.current?.readyState === WebSocket.OPEN &&
                  g.current.send(
                    JSON.stringify({
                      jsonrpc: `2.0`,
                      id: Date.now(),
                      method: `Music.StartExtraction`,
                      params: { songName: e },
                    }),
                  ));
            },
            disabled: u > 0 && u < 100,
          }),
          f && (0, i.jsx)(o, { progress: u, label: m }),
          (0, i.jsx)(_, { activeStep: f, progress: u }),
          (0, i.jsx)(v, { logs: c, status: n }),
        ],
      }),
    });
  };
export { y as component };
