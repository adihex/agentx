import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Search, Download, FileAudio, CheckCircle, Loader2 } from "lucide-react";

var u = ({ value: n2, onChange: r2, onScan: i2, disabled: a2 }) =>
    jsxs(`div`, {
      style: { display: `flex`, gap: `0.5rem`, marginBottom: `2rem` },
      children: [
        jsx(`input`, {
          type: `text`,
          value: n2,
          onChange: (e2) => r2(e2.target.value),
          onKeyPress: (e2) => e2.key === `Enter` && i2(),
          placeholder: `Enter song name (e.g. 'Stairway to Heaven')`,
          disabled: a2,
          style: {
            flex: 1,
            padding: `0.75rem 1rem`,
            borderRadius: `0.5rem`,
            border: `1px solid #333`,
            backgroundColor: `#0a0a0a`,
            color: `#fff`,
            outline: `none`,
            opacity: a2 ? 0.6 : 1,
          },
        }),
        jsx(`button`, {
          onClick: i2,
          disabled: a2 || !n2.trim(),
          style: {
            padding: `0.75rem 1.5rem`,
            borderRadius: `0.5rem`,
            border: `none`,
            backgroundColor: `#00f2fe`,
            color: `#000`,
            fontWeight: `bold`,
            cursor: a2 || !n2.trim() ? `not-allowed` : `pointer`,
            opacity: a2 || !n2.trim() ? 0.6 : 1,
          },
          children: `Scan`,
        }),
      ],
    }),
  d = ({ progress: n2, label: r2 }) =>
    jsxs(`div`, {
      style: { marginBottom: `2rem` },
      children: [
        jsxs(`div`, {
          style: { display: `flex`, justifyContent: `space-between`, marginBottom: `0.5rem` },
          children: [
            jsx(`span`, { style: { fontSize: `0.875rem`, color: `#aaa` }, children: r2 }),
            jsxs(`span`, {
              style: { fontSize: `0.875rem`, fontWeight: `bold`, color: `#00f2fe` },
              children: [n2, `%`],
            }),
          ],
        }),
        jsx(`div`, {
          style: {
            height: `8px`,
            backgroundColor: `#0a0a0a`,
            borderRadius: `4px`,
            overflow: `hidden`,
          },
          children: jsx(`div`, {
            role: `progressbar`,
            "aria-valuenow": n2,
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            style: {
              width: `${n2}%`,
              height: `100%`,
              background: `linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)`,
              transition: `width 0.5s ease`,
            },
          }),
        }),
      ],
    }),
  f = [
    { id: `search`, label: `Search`, icon: Search },
    { id: `download`, label: `Download`, icon: Download },
    { id: `extract`, label: `Extract`, icon: FileAudio },
    { id: `done`, label: `Complete`, icon: CheckCircle },
  ],
  p = ({ activeStep: n2, progress: r2 }) =>
    jsxs(`div`, {
      style: {
        display: `grid`,
        gridTemplateColumns: `repeat(4, 1fr)`,
        gap: `1rem`,
        marginBottom: `2rem`,
      },
      children: [
        f.map((i2) => {
          let a2 = i2.icon,
            o2 = n2 === i2.id,
            s2 = f.findIndex((e2) => e2.id === n2),
            l2 = f.findIndex((e2) => e2.id === i2.id),
            u2 = r2 === 100 || (n2 !== null && s2 > l2);
          return jsxs(
            `div`,
            {
              "data-testid": `step-${i2.id}`,
              style: {
                display: `flex`,
                flexDirection: `column`,
                alignItems: `center`,
                opacity: o2 || u2 ? 1 : 0.3,
                transition: `opacity 0.3s`,
              },
              children: [
                jsx(`div`, {
                  style: {
                    width: `40px`,
                    height: `40px`,
                    borderRadius: `50%`,
                    backgroundColor: u2 ? `#00f2fe` : `#333`,
                    display: `flex`,
                    alignItems: `center`,
                    justifyContent: `center`,
                    marginBottom: `0.5rem`,
                    color: u2 ? `#000` : `#fff`,
                  },
                  children: o2
                    ? jsx(Loader2, { size: 20, style: { animation: `spin 1s linear infinite` } })
                    : jsx(a2, { size: 20 }),
                }),
                jsx(`span`, {
                  style: { fontSize: `0.75rem`, color: u2 ? `#00f2fe` : `#fff` },
                  children: i2.label,
                }),
              ],
            },
            i2.id,
          );
        }),
        jsx(`style`, {
          children: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `,
        }),
      ],
    }),
  m = ({ logs: n2, status: r2 }) =>
    jsxs(`div`, {
      style: {
        backgroundColor: `#0a0a0a`,
        borderRadius: `0.5rem`,
        padding: `1rem`,
        border: `1px solid #333`,
      },
      children: [
        jsxs(`div`, {
          style: {
            fontSize: `0.75rem`,
            color: `#666`,
            marginBottom: `0.5rem`,
            display: `flex`,
            justifyContent: `space-between`,
          },
          children: [
            jsx(`span`, { children: `SYSTEM LOG` }),
            jsx(`span`, {
              style: { color: r2 === `Connected` ? `#4caf50` : `#f44336` },
              children: r2.toUpperCase(),
            }),
          ],
        }),
        n2.map((t2, n3) =>
          jsx(
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
              children: `> ${t2}`,
            },
            n3,
          ),
        ),
      ],
    }),
  h = function () {
    let [a2, o2] = useState(``),
      [s2, c2] = useState(`Disconnected`),
      [l2, f2] = useState([]),
      [h2, g] = useState(0),
      [_, v] = useState(null),
      [y, b] = useState(``),
      x = useRef(null);
    useEffect(
      () => (
        S(),
        () => {
          var _a;
          return (_a = x.current) == null ? void 0 : _a.close();
        }
      ),
      [],
    );
    let S = () => {
        let e2 = new WebSocket(`ws://localhost:9222`);
        ((x.current = e2),
          (e2.onopen = () => {
            (c2(`Connected`), w(`Connected to agentx runtime.`));
          }),
          (e2.onmessage = (e3) => {
            C(JSON.parse(e3.data));
          }),
          (e2.onclose = () => {
            (c2(`Disconnected`), w(`Disconnected. Retrying...`), setTimeout(S, 3e3));
          }));
      },
      C = (e2) => {
        if (
          (e2.method === `Music.Status` && w(e2.params.message),
          e2.method === `Toolchain.responseReceived`)
        ) {
          let { toolName: t2, result: n2 } = e2.params;
          if (!n2.success) {
            w(`Error in ${t2}: ${n2.error}`);
            return;
          }
          t2 === `searchMusic`
            ? (v(`download`), g(25), w(`Found: ${n2.bestMatch.title}. Downloading...`))
            : t2 === `downloadAndUpload`
              ? (v(`extract`), g(50), w(`Uploaded to GCS. Triggering Cloud Run job...`))
              : t2 === `triggerCloudRun` &&
                (v(`done`),
                g(100),
                w(`Extraction complete! Your file is ready in the output bucket.`));
        }
      },
      w = (e2) => {
        f2((t2) => [...t2.slice(-4), e2]);
      };
    return jsx(`div`, {
      style: {
        minHeight: `100vh`,
        display: `flex`,
        flexDirection: `column`,
        alignItems: `center`,
        justifyContent: `center`,
        padding: `2rem`,
      },
      children: jsxs(`div`, {
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
          jsx(`h1`, {
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
          jsx(u, {
            value: a2,
            onChange: o2,
            onScan: () => {
              var _a;
              a2.trim() &&
                (b(a2),
                v(`search`),
                g(5),
                w(`Initializing extraction workflow for "${a2}"...`),
                ((_a = x.current) == null ? void 0 : _a.readyState) === WebSocket.OPEN &&
                  x.current.send(
                    JSON.stringify({
                      jsonrpc: `2.0`,
                      id: Date.now(),
                      method: `Music.StartExtraction`,
                      params: { songName: a2 },
                    }),
                  ));
            },
            disabled: h2 > 0 && h2 < 100,
          }),
          _ && jsx(d, { progress: h2, label: y }),
          jsx(p, { activeStep: _, progress: h2 }),
          jsx(m, { logs: l2, status: s2 }),
        ],
      }),
    });
  };

export { h as component };
//# sourceMappingURL=routes-Slc8T1mC.mjs.map
