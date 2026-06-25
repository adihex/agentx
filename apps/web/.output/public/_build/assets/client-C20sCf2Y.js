const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f || (m.f = ["assets/routes-Cv0_7nc9.js", "assets/jsx-runtime-ByY1xr43.js"]),
) => i.map((i) => d[i]);
import { i as e, n as t, r as n, t as r } from "./jsx-runtime-ByY1xr43.js";
var i = n((e) => {
    function t(e, t) {
      var n = e.length;
      e.push(t);
      a: for (; 0 < n; ) {
        var r = (n - 1) >>> 1,
          a = e[r];
        if (0 < i(a, t)) ((e[r] = t), (e[n] = a), (n = r));
        else break a;
      }
    }
    function n(e) {
      return e.length === 0 ? null : e[0];
    }
    function r(e) {
      if (e.length === 0) return null;
      var t = e[0],
        n = e.pop();
      if (n !== t) {
        e[0] = n;
        a: for (var r = 0, a = e.length, o = a >>> 1; r < o; ) {
          var s = 2 * (r + 1) - 1,
            c = e[s],
            l = s + 1,
            u = e[l];
          if (0 > i(c, n))
            l < a && 0 > i(u, c)
              ? ((e[r] = u), (e[l] = n), (r = l))
              : ((e[r] = c), (e[s] = n), (r = s));
          else if (l < a && 0 > i(u, n)) ((e[r] = u), (e[l] = n), (r = l));
          else break a;
        }
      }
      return t;
    }
    function i(e, t) {
      var n = e.sortIndex - t.sortIndex;
      return n === 0 ? e.id - t.id : n;
    }
    if (
      ((e.unstable_now = void 0),
      typeof performance == `object` && typeof performance.now == `function`)
    ) {
      var a = performance;
      e.unstable_now = function () {
        return a.now();
      };
    } else {
      var o = Date,
        s = o.now();
      e.unstable_now = function () {
        return o.now() - s;
      };
    }
    var c = [],
      l = [],
      u = 1,
      d = null,
      f = 3,
      p = !1,
      m = !1,
      h = !1,
      g = !1,
      _ = typeof setTimeout == `function` ? setTimeout : null,
      v = typeof clearTimeout == `function` ? clearTimeout : null,
      y = typeof setImmediate < `u` ? setImmediate : null;
    function b(e) {
      for (var i = n(l); i !== null; ) {
        if (i.callback === null) r(l);
        else if (i.startTime <= e) (r(l), (i.sortIndex = i.expirationTime), t(c, i));
        else break;
        i = n(l);
      }
    }
    function x(e) {
      if (((h = !1), b(e), !m))
        if (n(c) !== null) ((m = !0), S || ((S = !0), T()));
        else {
          var t = n(l);
          t !== null && ae(x, t.startTime - e);
        }
    }
    var S = !1,
      C = -1,
      ee = 5,
      w = -1;
    function te() {
      return g ? !0 : !(e.unstable_now() - w < ee);
    }
    function ne() {
      if (((g = !1), S)) {
        var t = e.unstable_now();
        w = t;
        var i = !0;
        try {
          a: {
            ((m = !1), h && ((h = !1), v(C), (C = -1)), (p = !0));
            var a = f;
            try {
              b: {
                for (b(t), d = n(c); d !== null && !(d.expirationTime > t && te()); ) {
                  var o = d.callback;
                  if (typeof o == `function`) {
                    ((d.callback = null), (f = d.priorityLevel));
                    var s = o(d.expirationTime <= t);
                    if (((t = e.unstable_now()), typeof s == `function`)) {
                      ((d.callback = s), b(t), (i = !0));
                      break b;
                    }
                    (d === n(c) && r(c), b(t));
                  } else r(c);
                  d = n(c);
                }
                if (d !== null) i = !0;
                else {
                  var u = n(l);
                  (u !== null && ae(x, u.startTime - t), (i = !1));
                }
              }
              break a;
            } finally {
              ((d = null), (f = a), (p = !1));
            }
            i = void 0;
          }
        } finally {
          i ? T() : (S = !1);
        }
      }
    }
    var T;
    if (typeof y == `function`)
      T = function () {
        y(ne);
      };
    else if (typeof MessageChannel < `u`) {
      var re = new MessageChannel(),
        ie = re.port2;
      ((re.port1.onmessage = ne),
        (T = function () {
          ie.postMessage(null);
        }));
    } else
      T = function () {
        _(ne, 0);
      };
    function ae(t, n) {
      C = _(function () {
        t(e.unstable_now());
      }, n);
    }
    ((e.unstable_IdlePriority = 5),
      (e.unstable_ImmediatePriority = 1),
      (e.unstable_LowPriority = 4),
      (e.unstable_NormalPriority = 3),
      (e.unstable_Profiling = null),
      (e.unstable_UserBlockingPriority = 2),
      (e.unstable_cancelCallback = function (e) {
        e.callback = null;
      }),
      (e.unstable_forceFrameRate = function (e) {
        0 > e || 125 < e
          ? console.error(
              `forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`,
            )
          : (ee = 0 < e ? Math.floor(1e3 / e) : 5);
      }),
      (e.unstable_getCurrentPriorityLevel = function () {
        return f;
      }),
      (e.unstable_next = function (e) {
        switch (f) {
          case 1:
          case 2:
          case 3:
            var t = 3;
            break;
          default:
            t = f;
        }
        var n = f;
        f = t;
        try {
          return e();
        } finally {
          f = n;
        }
      }),
      (e.unstable_requestPaint = function () {
        g = !0;
      }),
      (e.unstable_runWithPriority = function (e, t) {
        switch (e) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            e = 3;
        }
        var n = f;
        f = e;
        try {
          return t();
        } finally {
          f = n;
        }
      }),
      (e.unstable_scheduleCallback = function (r, i, a) {
        var o = e.unstable_now();
        switch (
          (typeof a == `object` && a
            ? ((a = a.delay), (a = typeof a == `number` && 0 < a ? o + a : o))
            : (a = o),
          r)
        ) {
          case 1:
            var s = -1;
            break;
          case 2:
            s = 250;
            break;
          case 5:
            s = 1073741823;
            break;
          case 4:
            s = 1e4;
            break;
          default:
            s = 5e3;
        }
        return (
          (s = a + s),
          (r = {
            id: u++,
            callback: i,
            priorityLevel: r,
            startTime: a,
            expirationTime: s,
            sortIndex: -1,
          }),
          a > o
            ? ((r.sortIndex = a),
              t(l, r),
              n(c) === null && r === n(l) && (h ? (v(C), (C = -1)) : (h = !0), ae(x, a - o)))
            : ((r.sortIndex = s), t(c, r), m || p || ((m = !0), S || ((S = !0), T()))),
          r
        );
      }),
      (e.unstable_shouldYield = te),
      (e.unstable_wrapCallback = function (e) {
        var t = f;
        return function () {
          var n = f;
          f = t;
          try {
            return e.apply(this, arguments);
          } finally {
            f = n;
          }
        };
      }));
  }),
  a = n((e, t) => {
    t.exports = i();
  }),
  o = n((e) => {
    var n = t();
    function r(e) {
      var t = `https://react.dev/errors/` + e;
      if (1 < arguments.length) {
        t += `?args[]=` + encodeURIComponent(arguments[1]);
        for (var n = 2; n < arguments.length; n++)
          t += `&args[]=` + encodeURIComponent(arguments[n]);
      }
      return (
        `Minified React error #` +
        e +
        `; visit ` +
        t +
        ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
      );
    }
    function i() {}
    var a = {
        d: {
          f: i,
          r: function () {
            throw Error(r(522));
          },
          D: i,
          C: i,
          L: i,
          m: i,
          X: i,
          S: i,
          M: i,
        },
        p: 0,
        findDOMNode: null,
      },
      o = Symbol.for(`react.portal`);
    function s(e, t, n) {
      var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
      return {
        $$typeof: o,
        key: r == null ? null : `` + r,
        children: e,
        containerInfo: t,
        implementation: n,
      };
    }
    var c = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function l(e, t) {
      if (e === `font`) return ``;
      if (typeof t == `string`) return t === `use-credentials` ? t : ``;
    }
    ((e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = a),
      (e.createPortal = function (e, t) {
        var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11)) throw Error(r(299));
        return s(e, t, null, n);
      }),
      (e.flushSync = function (e) {
        var t = c.T,
          n = a.p;
        try {
          if (((c.T = null), (a.p = 2), e)) return e();
        } finally {
          ((c.T = t), (a.p = n), a.d.f());
        }
      }),
      (e.preconnect = function (e, t) {
        typeof e == `string` &&
          (t
            ? ((t = t.crossOrigin),
              (t = typeof t == `string` ? (t === `use-credentials` ? t : ``) : void 0))
            : (t = null),
          a.d.C(e, t));
      }),
      (e.prefetchDNS = function (e) {
        typeof e == `string` && a.d.D(e);
      }),
      (e.preinit = function (e, t) {
        if (typeof e == `string` && t && typeof t.as == `string`) {
          var n = t.as,
            r = l(n, t.crossOrigin),
            i = typeof t.integrity == `string` ? t.integrity : void 0,
            o = typeof t.fetchPriority == `string` ? t.fetchPriority : void 0;
          n === `style`
            ? a.d.S(e, typeof t.precedence == `string` ? t.precedence : void 0, {
                crossOrigin: r,
                integrity: i,
                fetchPriority: o,
              })
            : n === `script` &&
              a.d.X(e, {
                crossOrigin: r,
                integrity: i,
                fetchPriority: o,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
        }
      }),
      (e.preinitModule = function (e, t) {
        if (typeof e == `string`)
          if (typeof t == `object` && t) {
            if (t.as == null || t.as === `script`) {
              var n = l(t.as, t.crossOrigin);
              a.d.M(e, {
                crossOrigin: n,
                integrity: typeof t.integrity == `string` ? t.integrity : void 0,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
            }
          } else t ?? a.d.M(e);
      }),
      (e.preload = function (e, t) {
        if (typeof e == `string` && typeof t == `object` && t && typeof t.as == `string`) {
          var n = t.as,
            r = l(n, t.crossOrigin);
          a.d.L(e, n, {
            crossOrigin: r,
            integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            nonce: typeof t.nonce == `string` ? t.nonce : void 0,
            type: typeof t.type == `string` ? t.type : void 0,
            fetchPriority: typeof t.fetchPriority == `string` ? t.fetchPriority : void 0,
            referrerPolicy: typeof t.referrerPolicy == `string` ? t.referrerPolicy : void 0,
            imageSrcSet: typeof t.imageSrcSet == `string` ? t.imageSrcSet : void 0,
            imageSizes: typeof t.imageSizes == `string` ? t.imageSizes : void 0,
            media: typeof t.media == `string` ? t.media : void 0,
          });
        }
      }),
      (e.preloadModule = function (e, t) {
        if (typeof e == `string`)
          if (t) {
            var n = l(t.as, t.crossOrigin);
            a.d.m(e, {
              as: typeof t.as == `string` && t.as !== `script` ? t.as : void 0,
              crossOrigin: n,
              integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            });
          } else a.d.m(e);
      }),
      (e.requestFormReset = function (e) {
        a.d.r(e);
      }),
      (e.unstable_batchedUpdates = function (e, t) {
        return e(t);
      }),
      (e.useFormState = function (e, t, n) {
        return c.H.useFormState(e, t, n);
      }),
      (e.useFormStatus = function () {
        return c.H.useHostTransitionStatus();
      }),
      (e.version = `19.2.5`));
  }),
  s = n((e, t) => {
    function n() {
      if (
        !(
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
        )
      )
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
        } catch (e) {
          console.error(e);
        }
    }
    (n(), (t.exports = o()));
  }),
  c = n((e) => {
    var n = a(),
      r = t(),
      i = s();
    function o(e) {
      var t = `https://react.dev/errors/` + e;
      if (1 < arguments.length) {
        t += `?args[]=` + encodeURIComponent(arguments[1]);
        for (var n = 2; n < arguments.length; n++)
          t += `&args[]=` + encodeURIComponent(arguments[n]);
      }
      return (
        `Minified React error #` +
        e +
        `; visit ` +
        t +
        ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
      );
    }
    function c(e) {
      return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
    }
    function l(e) {
      var t = e,
        n = e;
      if (e.alternate) for (; t.return; ) t = t.return;
      else {
        e = t;
        do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
        while (e);
      }
      return t.tag === 3 ? n : null;
    }
    function u(e) {
      if (e.tag === 13) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
          return t.dehydrated;
      }
      return null;
    }
    function d(e) {
      if (e.tag === 31) {
        var t = e.memoizedState;
        if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
          return t.dehydrated;
      }
      return null;
    }
    function f(e) {
      if (l(e) !== e) throw Error(o(188));
    }
    function p(e) {
      var t = e.alternate;
      if (!t) {
        if (((t = l(e)), t === null)) throw Error(o(188));
        return t === e ? e : null;
      }
      for (var n = e, r = t; ; ) {
        var i = n.return;
        if (i === null) break;
        var a = i.alternate;
        if (a === null) {
          if (((r = i.return), r !== null)) {
            n = r;
            continue;
          }
          break;
        }
        if (i.child === a.child) {
          for (a = i.child; a; ) {
            if (a === n) return (f(i), e);
            if (a === r) return (f(i), t);
            a = a.sibling;
          }
          throw Error(o(188));
        }
        if (n.return !== r.return) ((n = i), (r = a));
        else {
          for (var s = !1, c = i.child; c; ) {
            if (c === n) {
              ((s = !0), (n = i), (r = a));
              break;
            }
            if (c === r) {
              ((s = !0), (r = i), (n = a));
              break;
            }
            c = c.sibling;
          }
          if (!s) {
            for (c = a.child; c; ) {
              if (c === n) {
                ((s = !0), (n = a), (r = i));
                break;
              }
              if (c === r) {
                ((s = !0), (r = a), (n = i));
                break;
              }
              c = c.sibling;
            }
            if (!s) throw Error(o(189));
          }
        }
        if (n.alternate !== r) throw Error(o(190));
      }
      if (n.tag !== 3) throw Error(o(188));
      return n.stateNode.current === n ? e : t;
    }
    function m(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e;
      for (e = e.child; e !== null; ) {
        if (((t = m(e)), t !== null)) return t;
        e = e.sibling;
      }
      return null;
    }
    var h = Object.assign,
      g = Symbol.for(`react.element`),
      _ = Symbol.for(`react.transitional.element`),
      v = Symbol.for(`react.portal`),
      y = Symbol.for(`react.fragment`),
      b = Symbol.for(`react.strict_mode`),
      x = Symbol.for(`react.profiler`),
      S = Symbol.for(`react.consumer`),
      C = Symbol.for(`react.context`),
      ee = Symbol.for(`react.forward_ref`),
      w = Symbol.for(`react.suspense`),
      te = Symbol.for(`react.suspense_list`),
      ne = Symbol.for(`react.memo`),
      T = Symbol.for(`react.lazy`),
      re = Symbol.for(`react.activity`),
      ie = Symbol.for(`react.memo_cache_sentinel`),
      ae = Symbol.iterator;
    function oe(e) {
      return typeof e != `object` || !e
        ? null
        : ((e = (ae && e[ae]) || e[`@@iterator`]), typeof e == `function` ? e : null);
    }
    var se = Symbol.for(`react.client.reference`);
    function ce(e) {
      if (e == null) return null;
      if (typeof e == `function`) return e.$$typeof === se ? null : e.displayName || e.name || null;
      if (typeof e == `string`) return e;
      switch (e) {
        case y:
          return `Fragment`;
        case x:
          return `Profiler`;
        case b:
          return `StrictMode`;
        case w:
          return `Suspense`;
        case te:
          return `SuspenseList`;
        case re:
          return `Activity`;
      }
      if (typeof e == `object`)
        switch (e.$$typeof) {
          case v:
            return `Portal`;
          case C:
            return e.displayName || `Context`;
          case S:
            return (e._context.displayName || `Context`) + `.Consumer`;
          case ee:
            var t = e.render;
            return (
              (e = e.displayName),
              (e ||=
                ((e = t.displayName || t.name || ``),
                e === `` ? `ForwardRef` : `ForwardRef(` + e + `)`)),
              e
            );
          case ne:
            return ((t = e.displayName || null), t === null ? ce(e.type) || `Memo` : t);
          case T:
            ((t = e._payload), (e = e._init));
            try {
              return ce(e(t));
            } catch {}
        }
      return null;
    }
    var le = Array.isArray,
      E = r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      D = i.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      ue = { pending: !1, data: null, method: null, action: null },
      de = [],
      fe = -1;
    function O(e) {
      return { current: e };
    }
    function k(e) {
      0 > fe || ((e.current = de[fe]), (de[fe] = null), fe--);
    }
    function A(e, t) {
      (fe++, (de[fe] = e.current), (e.current = t));
    }
    var pe = O(null),
      me = O(null),
      he = O(null),
      ge = O(null);
    function _e(e, t) {
      switch ((A(he, t), A(me, e), A(pe, null), t.nodeType)) {
        case 9:
        case 11:
          e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
          break;
        default:
          if (((e = t.tagName), (t = t.namespaceURI))) ((t = Vd(t)), (e = Hd(t, e)));
          else
            switch (e) {
              case `svg`:
                e = 1;
                break;
              case `math`:
                e = 2;
                break;
              default:
                e = 0;
            }
      }
      (k(pe), A(pe, e));
    }
    function ve() {
      (k(pe), k(me), k(he));
    }
    function ye(e) {
      e.memoizedState !== null && A(ge, e);
      var t = pe.current,
        n = Hd(t, e.type);
      t !== n && (A(me, e), A(pe, n));
    }
    function be(e) {
      (me.current === e && (k(pe), k(me)), ge.current === e && (k(ge), (Qf._currentValue = ue)));
    }
    var xe, Se;
    function Ce(e) {
      if (xe === void 0)
        try {
          throw Error();
        } catch (e) {
          var t = e.stack.trim().match(/\n( *(at )?)/);
          ((xe = (t && t[1]) || ``),
            (Se =
              -1 <
              e.stack.indexOf(`
    at`)
                ? ` (<anonymous>)`
                : -1 < e.stack.indexOf(`@`)
                  ? `@unknown:0:0`
                  : ``));
        }
      return (
        `
` +
        xe +
        e +
        Se
      );
    }
    var we = !1;
    function Te(e, t) {
      if (!e || we) return ``;
      we = !0;
      var n = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      try {
        var r = {
          DetermineComponentFrameRoot: function () {
            try {
              if (t) {
                var n = function () {
                  throw Error();
                };
                if (
                  (Object.defineProperty(n.prototype, `props`, {
                    set: function () {
                      throw Error();
                    },
                  }),
                  typeof Reflect == `object` && Reflect.construct)
                ) {
                  try {
                    Reflect.construct(n, []);
                  } catch (e) {
                    var r = e;
                  }
                  Reflect.construct(e, [], n);
                } else {
                  try {
                    n.call();
                  } catch (e) {
                    r = e;
                  }
                  e.call(n.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (e) {
                  r = e;
                }
                (n = e()) && typeof n.catch == `function` && n.catch(function () {});
              }
            } catch (e) {
              if (e && r && typeof e.stack == `string`) return [e.stack, r.stack];
            }
            return [null, null];
          },
        };
        r.DetermineComponentFrameRoot.displayName = `DetermineComponentFrameRoot`;
        var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, `name`);
        i &&
          i.configurable &&
          Object.defineProperty(r.DetermineComponentFrameRoot, `name`, {
            value: `DetermineComponentFrameRoot`,
          });
        var a = r.DetermineComponentFrameRoot(),
          o = a[0],
          s = a[1];
        if (o && s) {
          var c = o.split(`
`),
            l = s.split(`
`);
          for (i = r = 0; r < c.length && !c[r].includes(`DetermineComponentFrameRoot`); ) r++;
          for (; i < l.length && !l[i].includes(`DetermineComponentFrameRoot`); ) i++;
          if (r === c.length || i === l.length)
            for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i]; ) i--;
          for (; 1 <= r && 0 <= i; r--, i--)
            if (c[r] !== l[i]) {
              if (r !== 1 || i !== 1)
                do
                  if ((r--, i--, 0 > i || c[r] !== l[i])) {
                    var u =
                      `
` + c[r].replace(` at new `, ` at `);
                    return (
                      e.displayName &&
                        u.includes(`<anonymous>`) &&
                        (u = u.replace(`<anonymous>`, e.displayName)),
                      u
                    );
                  }
                while (1 <= r && 0 <= i);
              break;
            }
        }
      } finally {
        ((we = !1), (Error.prepareStackTrace = n));
      }
      return (n = e ? e.displayName || e.name : ``) ? Ce(n) : ``;
    }
    function Ee(e, t) {
      switch (e.tag) {
        case 26:
        case 27:
        case 5:
          return Ce(e.type);
        case 16:
          return Ce(`Lazy`);
        case 13:
          return e.child !== t && t !== null ? Ce(`Suspense Fallback`) : Ce(`Suspense`);
        case 19:
          return Ce(`SuspenseList`);
        case 0:
        case 15:
          return Te(e.type, !1);
        case 11:
          return Te(e.type.render, !1);
        case 1:
          return Te(e.type, !0);
        case 31:
          return Ce(`Activity`);
        default:
          return ``;
      }
    }
    function De(e) {
      try {
        var t = ``,
          n = null;
        do ((t += Ee(e, n)), (n = e), (e = e.return));
        while (e);
        return t;
      } catch (e) {
        return (
          `
Error generating stack: ` +
          e.message +
          `
` +
          e.stack
        );
      }
    }
    var Oe = Object.prototype.hasOwnProperty,
      ke = n.unstable_scheduleCallback,
      Ae = n.unstable_cancelCallback,
      je = n.unstable_shouldYield,
      Me = n.unstable_requestPaint,
      Ne = n.unstable_now,
      Pe = n.unstable_getCurrentPriorityLevel,
      Fe = n.unstable_ImmediatePriority,
      Ie = n.unstable_UserBlockingPriority,
      Le = n.unstable_NormalPriority,
      Re = n.unstable_LowPriority,
      ze = n.unstable_IdlePriority,
      Be = n.log,
      Ve = n.unstable_setDisableYieldValue,
      He = null,
      Ue = null;
    function We(e) {
      if ((typeof Be == `function` && Ve(e), Ue && typeof Ue.setStrictMode == `function`))
        try {
          Ue.setStrictMode(He, e);
        } catch {}
    }
    var Ge = Math.clz32 ? Math.clz32 : Je,
      Ke = Math.log,
      qe = Math.LN2;
    function Je(e) {
      return ((e >>>= 0), e === 0 ? 32 : (31 - ((Ke(e) / qe) | 0)) | 0);
    }
    var Ye = 256,
      Xe = 262144,
      Ze = 4194304;
    function Qe(e) {
      var t = e & 42;
      if (t !== 0) return t;
      switch (e & -e) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
          return 64;
        case 128:
          return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
          return e & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return e & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return e & 62914560;
        case 67108864:
          return 67108864;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 0;
        default:
          return e;
      }
    }
    function $e(e, t, n) {
      var r = e.pendingLanes;
      if (r === 0) return 0;
      var i = 0,
        a = e.suspendedLanes,
        o = e.pingedLanes;
      e = e.warmLanes;
      var s = r & 134217727;
      return (
        s === 0
          ? ((s = r & ~a),
            s === 0
              ? o === 0
                ? n || ((n = r & ~e), n !== 0 && (i = Qe(n)))
                : (i = Qe(o))
              : (i = Qe(s)))
          : ((r = s & ~a),
            r === 0
              ? ((o &= s), o === 0 ? n || ((n = s & ~e), n !== 0 && (i = Qe(n))) : (i = Qe(o)))
              : (i = Qe(r))),
        i === 0
          ? 0
          : t !== 0 &&
              t !== i &&
              (t & a) === 0 &&
              ((a = i & -i), (n = t & -t), a >= n || (a === 32 && n & 4194048))
            ? t
            : i
      );
    }
    function et(e, t) {
      return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
    }
    function tt(e, t) {
      switch (e) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
          return t + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function nt() {
      var e = Ze;
      return ((Ze <<= 1), !(Ze & 62914560) && (Ze = 4194304), e);
    }
    function rt(e) {
      for (var t = [], n = 0; 31 > n; n++) t.push(e);
      return t;
    }
    function it(e, t) {
      ((e.pendingLanes |= t),
        t !== 268435456 && ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0)));
    }
    function at(e, t, n, r, i, a) {
      var o = e.pendingLanes;
      ((e.pendingLanes = n),
        (e.suspendedLanes = 0),
        (e.pingedLanes = 0),
        (e.warmLanes = 0),
        (e.expiredLanes &= n),
        (e.entangledLanes &= n),
        (e.errorRecoveryDisabledLanes &= n),
        (e.shellSuspendCounter = 0));
      var s = e.entanglements,
        c = e.expirationTimes,
        l = e.hiddenUpdates;
      for (n = o & ~n; 0 < n; ) {
        var u = 31 - Ge(n),
          d = 1 << u;
        ((s[u] = 0), (c[u] = -1));
        var f = l[u];
        if (f !== null)
          for (l[u] = null, u = 0; u < f.length; u++) {
            var p = f[u];
            p !== null && (p.lane &= -536870913);
          }
        n &= ~d;
      }
      (r !== 0 && ot(e, r, 0),
        a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t)));
    }
    function ot(e, t, n) {
      ((e.pendingLanes |= t), (e.suspendedLanes &= ~t));
      var r = 31 - Ge(t);
      ((e.entangledLanes |= t),
        (e.entanglements[r] = e.entanglements[r] | 1073741824 | (n & 261930)));
    }
    function st(e, t) {
      var n = (e.entangledLanes |= t);
      for (e = e.entanglements; n; ) {
        var r = 31 - Ge(n),
          i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
      }
    }
    function ct(e, t) {
      var n = t & -t;
      return ((n = n & 42 ? 1 : lt(n)), (n & (e.suspendedLanes | t)) === 0 ? n : 0);
    }
    function lt(e) {
      switch (e) {
        case 2:
          e = 1;
          break;
        case 8:
          e = 4;
          break;
        case 32:
          e = 16;
          break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          e = 128;
          break;
        case 268435456:
          e = 134217728;
          break;
        default:
          e = 0;
      }
      return e;
    }
    function ut(e) {
      return ((e &= -e), 2 < e ? (8 < e ? (e & 134217727 ? 32 : 268435456) : 8) : 2);
    }
    function dt() {
      var e = D.p;
      return e === 0 ? ((e = window.event), e === void 0 ? 32 : mp(e.type)) : e;
    }
    function ft(e, t) {
      var n = D.p;
      try {
        return ((D.p = e), t());
      } finally {
        D.p = n;
      }
    }
    var pt = Math.random().toString(36).slice(2),
      j = `__reactFiber$` + pt,
      mt = `__reactProps$` + pt,
      ht = `__reactContainer$` + pt,
      gt = `__reactEvents$` + pt,
      _t = `__reactListeners$` + pt,
      vt = `__reactHandles$` + pt,
      yt = `__reactResources$` + pt,
      M = `__reactMarker$` + pt;
    function bt(e) {
      (delete e[j], delete e[mt], delete e[gt], delete e[_t], delete e[vt]);
    }
    function xt(e) {
      var t = e[j];
      if (t) return t;
      for (var n = e.parentNode; n; ) {
        if ((t = n[ht] || n[j])) {
          if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
            for (e = df(e); e !== null; ) {
              if ((n = e[j])) return n;
              e = df(e);
            }
          return t;
        }
        ((e = n), (n = e.parentNode));
      }
      return null;
    }
    function St(e) {
      if ((e = e[j] || e[ht])) {
        var t = e.tag;
        if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
      }
      return null;
    }
    function Ct(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
      throw Error(o(33));
    }
    function wt(e) {
      var t = e[yt];
      return ((t ||= e[yt] = { hoistableStyles: new Map(), hoistableScripts: new Map() }), t);
    }
    function N(e) {
      e[M] = !0;
    }
    var Tt = new Set(),
      Et = {};
    function Dt(e, t) {
      (Ot(e, t), Ot(e + `Capture`, t));
    }
    function Ot(e, t) {
      for (Et[e] = t, e = 0; e < t.length; e++) Tt.add(t[e]);
    }
    var kt = RegExp(
        `^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`,
      ),
      At = {},
      jt = {};
    function Mt(e) {
      return Oe.call(jt, e)
        ? !0
        : Oe.call(At, e)
          ? !1
          : kt.test(e)
            ? (jt[e] = !0)
            : ((At[e] = !0), !1);
    }
    function Nt(e, t, n) {
      if (Mt(t))
        if (n === null) e.removeAttribute(t);
        else {
          switch (typeof n) {
            case `undefined`:
            case `function`:
            case `symbol`:
              e.removeAttribute(t);
              return;
            case `boolean`:
              var r = t.toLowerCase().slice(0, 5);
              if (r !== `data-` && r !== `aria-`) {
                e.removeAttribute(t);
                return;
              }
          }
          e.setAttribute(t, `` + n);
        }
    }
    function Pt(e, t, n) {
      if (n === null) e.removeAttribute(t);
      else {
        switch (typeof n) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(t);
            return;
        }
        e.setAttribute(t, `` + n);
      }
    }
    function Ft(e, t, n, r) {
      if (r === null) e.removeAttribute(n);
      else {
        switch (typeof r) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(n);
            return;
        }
        e.setAttributeNS(t, n, `` + r);
      }
    }
    function It(e) {
      switch (typeof e) {
        case `bigint`:
        case `boolean`:
        case `number`:
        case `string`:
        case `undefined`:
          return e;
        case `object`:
          return e;
        default:
          return ``;
      }
    }
    function Lt(e) {
      var t = e.type;
      return (e = e.nodeName) && e.toLowerCase() === `input` && (t === `checkbox` || t === `radio`);
    }
    function Rt(e, t, n) {
      var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
      if (
        !e.hasOwnProperty(t) &&
        r !== void 0 &&
        typeof r.get == `function` &&
        typeof r.set == `function`
      ) {
        var i = r.get,
          a = r.set;
        return (
          Object.defineProperty(e, t, {
            configurable: !0,
            get: function () {
              return i.call(this);
            },
            set: function (e) {
              ((n = `` + e), a.call(this, e));
            },
          }),
          Object.defineProperty(e, t, { enumerable: r.enumerable }),
          {
            getValue: function () {
              return n;
            },
            setValue: function (e) {
              n = `` + e;
            },
            stopTracking: function () {
              ((e._valueTracker = null), delete e[t]);
            },
          }
        );
      }
    }
    function zt(e) {
      if (!e._valueTracker) {
        var t = Lt(e) ? `checked` : `value`;
        e._valueTracker = Rt(e, t, `` + e[t]);
      }
    }
    function Bt(e) {
      if (!e) return !1;
      var t = e._valueTracker;
      if (!t) return !0;
      var n = t.getValue(),
        r = ``;
      return (
        e && (r = Lt(e) ? (e.checked ? `true` : `false`) : e.value),
        (e = r),
        e === n ? !1 : (t.setValue(e), !0)
      );
    }
    function Vt(e) {
      if (((e ||= typeof document < `u` ? document : void 0), e === void 0)) return null;
      try {
        return e.activeElement || e.body;
      } catch {
        return e.body;
      }
    }
    var Ht = /[\n"\\]/g;
    function P(e) {
      return e.replace(Ht, function (e) {
        return `\\` + e.charCodeAt(0).toString(16) + ` `;
      });
    }
    function F(e, t, n, r, i, a, o, s) {
      ((e.name = ``),
        o != null && typeof o != `function` && typeof o != `symbol` && typeof o != `boolean`
          ? (e.type = o)
          : e.removeAttribute(`type`),
        t == null
          ? (o !== `submit` && o !== `reset`) || e.removeAttribute(`value`)
          : o === `number`
            ? ((t === 0 && e.value === ``) || e.value != t) && (e.value = `` + It(t))
            : e.value !== `` + It(t) && (e.value = `` + It(t)),
        t == null
          ? n == null
            ? r != null && e.removeAttribute(`value`)
            : Wt(e, o, It(n))
          : Wt(e, o, It(t)),
        i == null && a != null && (e.defaultChecked = !!a),
        i != null && (e.checked = i && typeof i != `function` && typeof i != `symbol`),
        s != null && typeof s != `function` && typeof s != `symbol` && typeof s != `boolean`
          ? (e.name = `` + It(s))
          : e.removeAttribute(`name`));
    }
    function Ut(e, t, n, r, i, a, o, s) {
      if (
        (a != null &&
          typeof a != `function` &&
          typeof a != `symbol` &&
          typeof a != `boolean` &&
          (e.type = a),
        t != null || n != null)
      ) {
        if (!((a !== `submit` && a !== `reset`) || t != null)) {
          zt(e);
          return;
        }
        ((n = n == null ? `` : `` + It(n)),
          (t = t == null ? n : `` + It(t)),
          s || t === e.value || (e.value = t),
          (e.defaultValue = t));
      }
      ((r ??= i),
        (r = typeof r != `function` && typeof r != `symbol` && !!r),
        (e.checked = s ? e.checked : !!r),
        (e.defaultChecked = !!r),
        o != null &&
          typeof o != `function` &&
          typeof o != `symbol` &&
          typeof o != `boolean` &&
          (e.name = o),
        zt(e));
    }
    function Wt(e, t, n) {
      (t === `number` && Vt(e.ownerDocument) === e) ||
        e.defaultValue === `` + n ||
        (e.defaultValue = `` + n);
    }
    function Gt(e, t, n, r) {
      if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t[`$` + n[i]] = !0;
        for (n = 0; n < e.length; n++)
          ((i = t.hasOwnProperty(`$` + e[n].value)),
            e[n].selected !== i && (e[n].selected = i),
            i && r && (e[n].defaultSelected = !0));
      } else {
        for (n = `` + It(n), t = null, i = 0; i < e.length; i++) {
          if (e[i].value === n) {
            ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
            return;
          }
          t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
      }
    }
    function Kt(e, t, n) {
      if (t != null && ((t = `` + It(t)), t !== e.value && (e.value = t), n == null)) {
        e.defaultValue !== t && (e.defaultValue = t);
        return;
      }
      e.defaultValue = n == null ? `` : `` + It(n);
    }
    function qt(e, t, n, r) {
      if (t == null) {
        if (r != null) {
          if (n != null) throw Error(o(92));
          if (le(r)) {
            if (1 < r.length) throw Error(o(93));
            r = r[0];
          }
          n = r;
        }
        ((n ??= ``), (t = n));
      }
      ((n = It(t)),
        (e.defaultValue = n),
        (r = e.textContent),
        r === n && r !== `` && r !== null && (e.value = r),
        zt(e));
    }
    function Jt(e, t) {
      if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
          n.nodeValue = t;
          return;
        }
      }
      e.textContent = t;
    }
    var Yt = new Set(
      `animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(
        ` `,
      ),
    );
    function Xt(e, t, n) {
      var r = t.indexOf(`--`) === 0;
      n == null || typeof n == `boolean` || n === ``
        ? r
          ? e.setProperty(t, ``)
          : t === `float`
            ? (e.cssFloat = ``)
            : (e[t] = ``)
        : r
          ? e.setProperty(t, n)
          : typeof n != `number` || n === 0 || Yt.has(t)
            ? t === `float`
              ? (e.cssFloat = n)
              : (e[t] = (`` + n).trim())
            : (e[t] = n + `px`);
    }
    function Zt(e, t, n) {
      if (t != null && typeof t != `object`) throw Error(o(62));
      if (((e = e.style), n != null)) {
        for (var r in n)
          !n.hasOwnProperty(r) ||
            (t != null && t.hasOwnProperty(r)) ||
            (r.indexOf(`--`) === 0
              ? e.setProperty(r, ``)
              : r === `float`
                ? (e.cssFloat = ``)
                : (e[r] = ``));
        for (var i in t) ((r = t[i]), t.hasOwnProperty(i) && n[i] !== r && Xt(e, i, r));
      } else for (var a in t) t.hasOwnProperty(a) && Xt(e, a, t[a]);
    }
    function Qt(e) {
      if (e.indexOf(`-`) === -1) return !1;
      switch (e) {
        case `annotation-xml`:
        case `color-profile`:
        case `font-face`:
        case `font-face-src`:
        case `font-face-uri`:
        case `font-face-format`:
        case `font-face-name`:
        case `missing-glyph`:
          return !1;
        default:
          return !0;
      }
    }
    var $t = new Map([
        [`acceptCharset`, `accept-charset`],
        [`htmlFor`, `for`],
        [`httpEquiv`, `http-equiv`],
        [`crossOrigin`, `crossorigin`],
        [`accentHeight`, `accent-height`],
        [`alignmentBaseline`, `alignment-baseline`],
        [`arabicForm`, `arabic-form`],
        [`baselineShift`, `baseline-shift`],
        [`capHeight`, `cap-height`],
        [`clipPath`, `clip-path`],
        [`clipRule`, `clip-rule`],
        [`colorInterpolation`, `color-interpolation`],
        [`colorInterpolationFilters`, `color-interpolation-filters`],
        [`colorProfile`, `color-profile`],
        [`colorRendering`, `color-rendering`],
        [`dominantBaseline`, `dominant-baseline`],
        [`enableBackground`, `enable-background`],
        [`fillOpacity`, `fill-opacity`],
        [`fillRule`, `fill-rule`],
        [`floodColor`, `flood-color`],
        [`floodOpacity`, `flood-opacity`],
        [`fontFamily`, `font-family`],
        [`fontSize`, `font-size`],
        [`fontSizeAdjust`, `font-size-adjust`],
        [`fontStretch`, `font-stretch`],
        [`fontStyle`, `font-style`],
        [`fontVariant`, `font-variant`],
        [`fontWeight`, `font-weight`],
        [`glyphName`, `glyph-name`],
        [`glyphOrientationHorizontal`, `glyph-orientation-horizontal`],
        [`glyphOrientationVertical`, `glyph-orientation-vertical`],
        [`horizAdvX`, `horiz-adv-x`],
        [`horizOriginX`, `horiz-origin-x`],
        [`imageRendering`, `image-rendering`],
        [`letterSpacing`, `letter-spacing`],
        [`lightingColor`, `lighting-color`],
        [`markerEnd`, `marker-end`],
        [`markerMid`, `marker-mid`],
        [`markerStart`, `marker-start`],
        [`overlinePosition`, `overline-position`],
        [`overlineThickness`, `overline-thickness`],
        [`paintOrder`, `paint-order`],
        [`panose-1`, `panose-1`],
        [`pointerEvents`, `pointer-events`],
        [`renderingIntent`, `rendering-intent`],
        [`shapeRendering`, `shape-rendering`],
        [`stopColor`, `stop-color`],
        [`stopOpacity`, `stop-opacity`],
        [`strikethroughPosition`, `strikethrough-position`],
        [`strikethroughThickness`, `strikethrough-thickness`],
        [`strokeDasharray`, `stroke-dasharray`],
        [`strokeDashoffset`, `stroke-dashoffset`],
        [`strokeLinecap`, `stroke-linecap`],
        [`strokeLinejoin`, `stroke-linejoin`],
        [`strokeMiterlimit`, `stroke-miterlimit`],
        [`strokeOpacity`, `stroke-opacity`],
        [`strokeWidth`, `stroke-width`],
        [`textAnchor`, `text-anchor`],
        [`textDecoration`, `text-decoration`],
        [`textRendering`, `text-rendering`],
        [`transformOrigin`, `transform-origin`],
        [`underlinePosition`, `underline-position`],
        [`underlineThickness`, `underline-thickness`],
        [`unicodeBidi`, `unicode-bidi`],
        [`unicodeRange`, `unicode-range`],
        [`unitsPerEm`, `units-per-em`],
        [`vAlphabetic`, `v-alphabetic`],
        [`vHanging`, `v-hanging`],
        [`vIdeographic`, `v-ideographic`],
        [`vMathematical`, `v-mathematical`],
        [`vectorEffect`, `vector-effect`],
        [`vertAdvY`, `vert-adv-y`],
        [`vertOriginX`, `vert-origin-x`],
        [`vertOriginY`, `vert-origin-y`],
        [`wordSpacing`, `word-spacing`],
        [`writingMode`, `writing-mode`],
        [`xmlnsXlink`, `xmlns:xlink`],
        [`xHeight`, `x-height`],
      ]),
      en =
        /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function tn(e) {
      return en.test(`` + e)
        ? `javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`
        : e;
    }
    function nn() {}
    var rn = null;
    function an(e) {
      return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
      );
    }
    var on = null,
      sn = null;
    function cn(e) {
      var t = St(e);
      if (t && (e = t.stateNode)) {
        var n = e[mt] || null;
        a: switch (((e = t.stateNode), t.type)) {
          case `input`:
            if (
              (F(
                e,
                n.value,
                n.defaultValue,
                n.defaultValue,
                n.checked,
                n.defaultChecked,
                n.type,
                n.name,
              ),
              (t = n.name),
              n.type === `radio` && t != null)
            ) {
              for (n = e; n.parentNode; ) n = n.parentNode;
              for (
                n = n.querySelectorAll(`input[name="` + P(`` + t) + `"][type="radio"]`), t = 0;
                t < n.length;
                t++
              ) {
                var r = n[t];
                if (r !== e && r.form === e.form) {
                  var i = r[mt] || null;
                  if (!i) throw Error(o(90));
                  F(
                    r,
                    i.value,
                    i.defaultValue,
                    i.defaultValue,
                    i.checked,
                    i.defaultChecked,
                    i.type,
                    i.name,
                  );
                }
              }
              for (t = 0; t < n.length; t++) ((r = n[t]), r.form === e.form && Bt(r));
            }
            break a;
          case `textarea`:
            Kt(e, n.value, n.defaultValue);
            break a;
          case `select`:
            ((t = n.value), t != null && Gt(e, !!n.multiple, t, !1));
        }
      }
    }
    var ln = !1;
    function un(e, t, n) {
      if (ln) return e(t, n);
      ln = !0;
      try {
        return e(t);
      } finally {
        if (
          ((ln = !1),
          (on !== null || sn !== null) &&
            (bu(), on && ((t = on), (e = sn), (sn = on = null), cn(t), e)))
        )
          for (t = 0; t < e.length; t++) cn(e[t]);
      }
    }
    function dn(e, t) {
      var n = e.stateNode;
      if (n === null) return null;
      var r = n[mt] || null;
      if (r === null) return null;
      n = r[t];
      a: switch (t) {
        case `onClick`:
        case `onClickCapture`:
        case `onDoubleClick`:
        case `onDoubleClickCapture`:
        case `onMouseDown`:
        case `onMouseDownCapture`:
        case `onMouseMove`:
        case `onMouseMoveCapture`:
        case `onMouseUp`:
        case `onMouseUpCapture`:
        case `onMouseEnter`:
          ((r = !r.disabled) ||
            ((e = e.type),
            (r = !(e === `button` || e === `input` || e === `select` || e === `textarea`))),
            (e = !r));
          break a;
        default:
          e = !1;
      }
      if (e) return null;
      if (n && typeof n != `function`) throw Error(o(231, t, typeof n));
      return n;
    }
    var fn = !(
        typeof window > `u` ||
        window.document === void 0 ||
        window.document.createElement === void 0
      ),
      pn = !1;
    if (fn)
      try {
        var mn = {};
        (Object.defineProperty(mn, `passive`, {
          get: function () {
            pn = !0;
          },
        }),
          window.addEventListener(`test`, mn, mn),
          window.removeEventListener(`test`, mn, mn));
      } catch {
        pn = !1;
      }
    var hn = null,
      gn = null,
      _n = null;
    function vn() {
      if (_n) return _n;
      var e,
        t = gn,
        n = t.length,
        r,
        i = `value` in hn ? hn.value : hn.textContent,
        a = i.length;
      for (e = 0; e < n && t[e] === i[e]; e++);
      var o = n - e;
      for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
      return (_n = i.slice(e, 1 < r ? 1 - r : void 0));
    }
    function yn(e) {
      var t = e.keyCode;
      return (
        `charCode` in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
      );
    }
    function bn() {
      return !0;
    }
    function xn() {
      return !1;
    }
    function Sn(e) {
      function t(t, n, r, i, a) {
        for (var o in ((this._reactName = t),
        (this._targetInst = r),
        (this.type = n),
        (this.nativeEvent = i),
        (this.target = a),
        (this.currentTarget = null),
        e))
          e.hasOwnProperty(o) && ((t = e[o]), (this[o] = t ? t(i) : i[o]));
        return (
          (this.isDefaultPrevented = (
            i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented
          )
            ? bn
            : xn),
          (this.isPropagationStopped = xn),
          this
        );
      }
      return (
        h(t.prototype, {
          preventDefault: function () {
            this.defaultPrevented = !0;
            var e = this.nativeEvent;
            e &&
              (e.preventDefault
                ? e.preventDefault()
                : typeof e.returnValue != `unknown` && (e.returnValue = !1),
              (this.isDefaultPrevented = bn));
          },
          stopPropagation: function () {
            var e = this.nativeEvent;
            e &&
              (e.stopPropagation
                ? e.stopPropagation()
                : typeof e.cancelBubble != `unknown` && (e.cancelBubble = !0),
              (this.isPropagationStopped = bn));
          },
          persist: function () {},
          isPersistent: bn,
        }),
        t
      );
    }
    var Cn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
          return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
      },
      wn = Sn(Cn),
      Tn = h({}, Cn, { view: 0, detail: 0 }),
      En = Sn(Tn),
      Dn,
      On,
      kn,
      An = h({}, Tn, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: Vn,
        button: 0,
        buttons: 0,
        relatedTarget: function (e) {
          return e.relatedTarget === void 0
            ? e.fromElement === e.srcElement
              ? e.toElement
              : e.fromElement
            : e.relatedTarget;
        },
        movementX: function (e) {
          return `movementX` in e
            ? e.movementX
            : (e !== kn &&
                (kn && e.type === `mousemove`
                  ? ((Dn = e.screenX - kn.screenX), (On = e.screenY - kn.screenY))
                  : (On = Dn = 0),
                (kn = e)),
              Dn);
        },
        movementY: function (e) {
          return `movementY` in e ? e.movementY : On;
        },
      }),
      jn = Sn(An),
      Mn = Sn(h({}, An, { dataTransfer: 0 })),
      Nn = Sn(h({}, Tn, { relatedTarget: 0 })),
      Pn = Sn(h({}, Cn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 })),
      Fn = Sn(
        h({}, Cn, {
          clipboardData: function (e) {
            return `clipboardData` in e ? e.clipboardData : window.clipboardData;
          },
        }),
      ),
      In = Sn(h({}, Cn, { data: 0 })),
      Ln = {
        Esc: `Escape`,
        Spacebar: ` `,
        Left: `ArrowLeft`,
        Up: `ArrowUp`,
        Right: `ArrowRight`,
        Down: `ArrowDown`,
        Del: `Delete`,
        Win: `OS`,
        Menu: `ContextMenu`,
        Apps: `ContextMenu`,
        Scroll: `ScrollLock`,
        MozPrintableKey: `Unidentified`,
      },
      Rn = {
        8: `Backspace`,
        9: `Tab`,
        12: `Clear`,
        13: `Enter`,
        16: `Shift`,
        17: `Control`,
        18: `Alt`,
        19: `Pause`,
        20: `CapsLock`,
        27: `Escape`,
        32: ` `,
        33: `PageUp`,
        34: `PageDown`,
        35: `End`,
        36: `Home`,
        37: `ArrowLeft`,
        38: `ArrowUp`,
        39: `ArrowRight`,
        40: `ArrowDown`,
        45: `Insert`,
        46: `Delete`,
        112: `F1`,
        113: `F2`,
        114: `F3`,
        115: `F4`,
        116: `F5`,
        117: `F6`,
        118: `F7`,
        119: `F8`,
        120: `F9`,
        121: `F10`,
        122: `F11`,
        123: `F12`,
        144: `NumLock`,
        145: `ScrollLock`,
        224: `Meta`,
      },
      zn = { Alt: `altKey`, Control: `ctrlKey`, Meta: `metaKey`, Shift: `shiftKey` };
    function Bn(e) {
      var t = this.nativeEvent;
      return t.getModifierState ? t.getModifierState(e) : (e = zn[e]) ? !!t[e] : !1;
    }
    function Vn() {
      return Bn;
    }
    var Hn = Sn(
        h({}, Tn, {
          key: function (e) {
            if (e.key) {
              var t = Ln[e.key] || e.key;
              if (t !== `Unidentified`) return t;
            }
            return e.type === `keypress`
              ? ((e = yn(e)), e === 13 ? `Enter` : String.fromCharCode(e))
              : e.type === `keydown` || e.type === `keyup`
                ? Rn[e.keyCode] || `Unidentified`
                : ``;
          },
          code: 0,
          location: 0,
          ctrlKey: 0,
          shiftKey: 0,
          altKey: 0,
          metaKey: 0,
          repeat: 0,
          locale: 0,
          getModifierState: Vn,
          charCode: function (e) {
            return e.type === `keypress` ? yn(e) : 0;
          },
          keyCode: function (e) {
            return e.type === `keydown` || e.type === `keyup` ? e.keyCode : 0;
          },
          which: function (e) {
            return e.type === `keypress`
              ? yn(e)
              : e.type === `keydown` || e.type === `keyup`
                ? e.keyCode
                : 0;
          },
        }),
      ),
      Un = Sn(
        h({}, An, {
          pointerId: 0,
          width: 0,
          height: 0,
          pressure: 0,
          tangentialPressure: 0,
          tiltX: 0,
          tiltY: 0,
          twist: 0,
          pointerType: 0,
          isPrimary: 0,
        }),
      ),
      Wn = Sn(
        h({}, Tn, {
          touches: 0,
          targetTouches: 0,
          changedTouches: 0,
          altKey: 0,
          metaKey: 0,
          ctrlKey: 0,
          shiftKey: 0,
          getModifierState: Vn,
        }),
      ),
      Gn = Sn(h({}, Cn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 })),
      Kn = Sn(
        h({}, An, {
          deltaX: function (e) {
            return `deltaX` in e ? e.deltaX : `wheelDeltaX` in e ? -e.wheelDeltaX : 0;
          },
          deltaY: function (e) {
            return `deltaY` in e
              ? e.deltaY
              : `wheelDeltaY` in e
                ? -e.wheelDeltaY
                : `wheelDelta` in e
                  ? -e.wheelDelta
                  : 0;
          },
          deltaZ: 0,
          deltaMode: 0,
        }),
      ),
      qn = Sn(h({}, Cn, { newState: 0, oldState: 0 })),
      Jn = [9, 13, 27, 32],
      Yn = fn && `CompositionEvent` in window,
      Xn = null;
    fn && `documentMode` in document && (Xn = document.documentMode);
    var Zn = fn && `TextEvent` in window && !Xn,
      Qn = fn && (!Yn || (Xn && 8 < Xn && 11 >= Xn)),
      $n = ` `,
      er = !1;
    function tr(e, t) {
      switch (e) {
        case `keyup`:
          return Jn.indexOf(t.keyCode) !== -1;
        case `keydown`:
          return t.keyCode !== 229;
        case `keypress`:
        case `mousedown`:
        case `focusout`:
          return !0;
        default:
          return !1;
      }
    }
    function nr(e) {
      return ((e = e.detail), typeof e == `object` && `data` in e ? e.data : null);
    }
    var rr = !1;
    function ir(e, t) {
      switch (e) {
        case `compositionend`:
          return nr(t);
        case `keypress`:
          return t.which === 32 ? ((er = !0), $n) : null;
        case `textInput`:
          return ((e = t.data), e === $n && er ? null : e);
        default:
          return null;
      }
    }
    function ar(e, t) {
      if (rr)
        return e === `compositionend` || (!Yn && tr(e, t))
          ? ((e = vn()), (_n = gn = hn = null), (rr = !1), e)
          : null;
      switch (e) {
        case `paste`:
          return null;
        case `keypress`:
          if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
            if (t.char && 1 < t.char.length) return t.char;
            if (t.which) return String.fromCharCode(t.which);
          }
          return null;
        case `compositionend`:
          return Qn && t.locale !== `ko` ? null : t.data;
        default:
          return null;
      }
    }
    var or = {
      color: !0,
      date: !0,
      datetime: !0,
      "datetime-local": !0,
      email: !0,
      month: !0,
      number: !0,
      password: !0,
      range: !0,
      search: !0,
      tel: !0,
      text: !0,
      time: !0,
      url: !0,
      week: !0,
    };
    function sr(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t === `input` ? !!or[e.type] : t === `textarea`;
    }
    function cr(e, t, n, r) {
      (on ? (sn ? sn.push(r) : (sn = [r])) : (on = r),
        (t = Ed(t, `onChange`)),
        0 < t.length &&
          ((n = new wn(`onChange`, `change`, null, n, r)), e.push({ event: n, listeners: t })));
    }
    var lr = null,
      ur = null;
    function dr(e) {
      yd(e, 0);
    }
    function fr(e) {
      if (Bt(Ct(e))) return e;
    }
    function pr(e, t) {
      if (e === `change`) return t;
    }
    var mr = !1;
    if (fn) {
      var hr;
      if (fn) {
        var gr = `oninput` in document;
        if (!gr) {
          var _r = document.createElement(`div`);
          (_r.setAttribute(`oninput`, `return;`), (gr = typeof _r.oninput == `function`));
        }
        hr = gr;
      } else hr = !1;
      mr = hr && (!document.documentMode || 9 < document.documentMode);
    }
    function vr() {
      lr && (lr.detachEvent(`onpropertychange`, yr), (ur = lr = null));
    }
    function yr(e) {
      if (e.propertyName === `value` && fr(ur)) {
        var t = [];
        (cr(t, ur, e, an(e)), un(dr, t));
      }
    }
    function br(e, t, n) {
      e === `focusin`
        ? (vr(), (lr = t), (ur = n), lr.attachEvent(`onpropertychange`, yr))
        : e === `focusout` && vr();
    }
    function xr(e) {
      if (e === `selectionchange` || e === `keyup` || e === `keydown`) return fr(ur);
    }
    function Sr(e, t) {
      if (e === `click`) return fr(t);
    }
    function Cr(e, t) {
      if (e === `input` || e === `change`) return fr(t);
    }
    function wr(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var Tr = typeof Object.is == `function` ? Object.is : wr;
    function Er(e, t) {
      if (Tr(e, t)) return !0;
      if (typeof e != `object` || !e || typeof t != `object` || !t) return !1;
      var n = Object.keys(e),
        r = Object.keys(t);
      if (n.length !== r.length) return !1;
      for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!Oe.call(t, i) || !Tr(e[i], t[i])) return !1;
      }
      return !0;
    }
    function Dr(e) {
      for (; e && e.firstChild; ) e = e.firstChild;
      return e;
    }
    function Or(e, t) {
      var n = Dr(e);
      e = 0;
      for (var r; n; ) {
        if (n.nodeType === 3) {
          if (((r = e + n.textContent.length), e <= t && r >= t)) return { node: n, offset: t - e };
          e = r;
        }
        a: {
          for (; n; ) {
            if (n.nextSibling) {
              n = n.nextSibling;
              break a;
            }
            n = n.parentNode;
          }
          n = void 0;
        }
        n = Dr(n);
      }
    }
    function kr(e, t) {
      return e && t
        ? e === t
          ? !0
          : e && e.nodeType === 3
            ? !1
            : t && t.nodeType === 3
              ? kr(e, t.parentNode)
              : `contains` in e
                ? e.contains(t)
                : e.compareDocumentPosition
                  ? !!(e.compareDocumentPosition(t) & 16)
                  : !1
        : !1;
    }
    function Ar(e) {
      e =
        e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null
          ? e.ownerDocument.defaultView
          : window;
      for (var t = Vt(e.document); t instanceof e.HTMLIFrameElement; ) {
        try {
          var n = typeof t.contentWindow.location.href == `string`;
        } catch {
          n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = Vt(e.document);
      }
      return t;
    }
    function jr(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return (
        t &&
        ((t === `input` &&
          (e.type === `text` ||
            e.type === `search` ||
            e.type === `tel` ||
            e.type === `url` ||
            e.type === `password`)) ||
          t === `textarea` ||
          e.contentEditable === `true`)
      );
    }
    var Mr = fn && `documentMode` in document && 11 >= document.documentMode,
      Nr = null,
      Pr = null,
      Fr = null,
      Ir = !1;
    function Lr(e, t, n) {
      var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
      Ir ||
        Nr == null ||
        Nr !== Vt(r) ||
        ((r = Nr),
        `selectionStart` in r && jr(r)
          ? (r = { start: r.selectionStart, end: r.selectionEnd })
          : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
            (r = {
              anchorNode: r.anchorNode,
              anchorOffset: r.anchorOffset,
              focusNode: r.focusNode,
              focusOffset: r.focusOffset,
            })),
        (Fr && Er(Fr, r)) ||
          ((Fr = r),
          (r = Ed(Pr, `onSelect`)),
          0 < r.length &&
            ((t = new wn(`onSelect`, `select`, null, t, n)),
            e.push({ event: t, listeners: r }),
            (t.target = Nr))));
    }
    function Rr(e, t) {
      var n = {};
      return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n[`Webkit` + e] = `webkit` + t),
        (n[`Moz` + e] = `moz` + t),
        n
      );
    }
    var zr = {
        animationend: Rr(`Animation`, `AnimationEnd`),
        animationiteration: Rr(`Animation`, `AnimationIteration`),
        animationstart: Rr(`Animation`, `AnimationStart`),
        transitionrun: Rr(`Transition`, `TransitionRun`),
        transitionstart: Rr(`Transition`, `TransitionStart`),
        transitioncancel: Rr(`Transition`, `TransitionCancel`),
        transitionend: Rr(`Transition`, `TransitionEnd`),
      },
      Br = {},
      Vr = {};
    fn &&
      ((Vr = document.createElement(`div`).style),
      `AnimationEvent` in window ||
        (delete zr.animationend.animation,
        delete zr.animationiteration.animation,
        delete zr.animationstart.animation),
      `TransitionEvent` in window || delete zr.transitionend.transition);
    function Hr(e) {
      if (Br[e]) return Br[e];
      if (!zr[e]) return e;
      var t = zr[e],
        n;
      for (n in t) if (t.hasOwnProperty(n) && n in Vr) return (Br[e] = t[n]);
      return e;
    }
    var Ur = Hr(`animationend`),
      Wr = Hr(`animationiteration`),
      Gr = Hr(`animationstart`),
      Kr = Hr(`transitionrun`),
      qr = Hr(`transitionstart`),
      Jr = Hr(`transitioncancel`),
      Yr = Hr(`transitionend`),
      Xr = new Map(),
      Zr =
        `abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(
          ` `,
        );
    Zr.push(`scrollEnd`);
    function Qr(e, t) {
      (Xr.set(e, t), Dt(t, [e]));
    }
    var $r =
        typeof reportError == `function`
          ? reportError
          : function (e) {
              if (typeof window == `object` && typeof window.ErrorEvent == `function`) {
                var t = new window.ErrorEvent(`error`, {
                  bubbles: !0,
                  cancelable: !0,
                  message:
                    typeof e == `object` && e && typeof e.message == `string`
                      ? String(e.message)
                      : String(e),
                  error: e,
                });
                if (!window.dispatchEvent(t)) return;
              } else if (typeof process == `object` && typeof process.emit == `function`) {
                process.emit(`uncaughtException`, e);
                return;
              }
              console.error(e);
            },
      ei = [],
      ti = 0,
      ni = 0;
    function ri() {
      for (var e = ti, t = (ni = ti = 0); t < e; ) {
        var n = ei[t];
        ei[t++] = null;
        var r = ei[t];
        ei[t++] = null;
        var i = ei[t];
        ei[t++] = null;
        var a = ei[t];
        if (((ei[t++] = null), r !== null && i !== null)) {
          var o = r.pending;
          (o === null ? (i.next = i) : ((i.next = o.next), (o.next = i)), (r.pending = i));
        }
        a !== 0 && si(n, i, a);
      }
    }
    function ii(e, t, n, r) {
      ((ei[ti++] = e),
        (ei[ti++] = t),
        (ei[ti++] = n),
        (ei[ti++] = r),
        (ni |= r),
        (e.lanes |= r),
        (e = e.alternate),
        e !== null && (e.lanes |= r));
    }
    function ai(e, t, n, r) {
      return (ii(e, t, n, r), ci(e));
    }
    function oi(e, t) {
      return (ii(e, null, null, t), ci(e));
    }
    function si(e, t, n) {
      e.lanes |= n;
      var r = e.alternate;
      r !== null && (r.lanes |= n);
      for (var i = !1, a = e.return; a !== null; )
        ((a.childLanes |= n),
          (r = a.alternate),
          r !== null && (r.childLanes |= n),
          a.tag === 22 && ((e = a.stateNode), e === null || e._visibility & 1 || (i = !0)),
          (e = a),
          (a = a.return));
      return e.tag === 3
        ? ((a = e.stateNode),
          i &&
            t !== null &&
            ((i = 31 - Ge(n)),
            (e = a.hiddenUpdates),
            (r = e[i]),
            r === null ? (e[i] = [t]) : r.push(t),
            (t.lane = n | 536870912)),
          a)
        : null;
    }
    function ci(e) {
      if (50 < du) throw ((du = 0), (fu = null), Error(o(185)));
      for (var t = e.return; t !== null; ) ((e = t), (t = e.return));
      return e.tag === 3 ? e.stateNode : null;
    }
    var li = {};
    function ui(e, t, n, r) {
      ((this.tag = e),
        (this.key = n),
        (this.sibling =
          this.child =
          this.return =
          this.stateNode =
          this.type =
          this.elementType =
            null),
        (this.index = 0),
        (this.refCleanup = this.ref = null),
        (this.pendingProps = t),
        (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
        (this.mode = r),
        (this.subtreeFlags = this.flags = 0),
        (this.deletions = null),
        (this.childLanes = this.lanes = 0),
        (this.alternate = null));
    }
    function di(e, t, n, r) {
      return new ui(e, t, n, r);
    }
    function fi(e) {
      return ((e = e.prototype), !(!e || !e.isReactComponent));
    }
    function pi(e, t) {
      var n = e.alternate;
      return (
        n === null
          ? ((n = di(e.tag, t, e.key, e.mode)),
            (n.elementType = e.elementType),
            (n.type = e.type),
            (n.stateNode = e.stateNode),
            (n.alternate = e),
            (e.alternate = n))
          : ((n.pendingProps = t),
            (n.type = e.type),
            (n.flags = 0),
            (n.subtreeFlags = 0),
            (n.deletions = null)),
        (n.flags = e.flags & 65011712),
        (n.childLanes = e.childLanes),
        (n.lanes = e.lanes),
        (n.child = e.child),
        (n.memoizedProps = e.memoizedProps),
        (n.memoizedState = e.memoizedState),
        (n.updateQueue = e.updateQueue),
        (t = e.dependencies),
        (n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
        (n.sibling = e.sibling),
        (n.index = e.index),
        (n.ref = e.ref),
        (n.refCleanup = e.refCleanup),
        n
      );
    }
    function mi(e, t) {
      e.flags &= 65011714;
      var n = e.alternate;
      return (
        n === null
          ? ((e.childLanes = 0),
            (e.lanes = t),
            (e.child = null),
            (e.subtreeFlags = 0),
            (e.memoizedProps = null),
            (e.memoizedState = null),
            (e.updateQueue = null),
            (e.dependencies = null),
            (e.stateNode = null))
          : ((e.childLanes = n.childLanes),
            (e.lanes = n.lanes),
            (e.child = n.child),
            (e.subtreeFlags = 0),
            (e.deletions = null),
            (e.memoizedProps = n.memoizedProps),
            (e.memoizedState = n.memoizedState),
            (e.updateQueue = n.updateQueue),
            (e.type = n.type),
            (t = n.dependencies),
            (e.dependencies =
              t === null ? null : { lanes: t.lanes, firstContext: t.firstContext })),
        e
      );
    }
    function hi(e, t, n, r, i, a) {
      var s = 0;
      if (((r = e), typeof e == `function`)) fi(e) && (s = 1);
      else if (typeof e == `string`)
        s = Uf(e, n, pe.current) ? 26 : e === `html` || e === `head` || e === `body` ? 27 : 5;
      else
        a: switch (e) {
          case re:
            return ((e = di(31, n, t, i)), (e.elementType = re), (e.lanes = a), e);
          case y:
            return gi(n.children, i, a, t);
          case b:
            ((s = 8), (i |= 24));
            break;
          case x:
            return ((e = di(12, n, t, i | 2)), (e.elementType = x), (e.lanes = a), e);
          case w:
            return ((e = di(13, n, t, i)), (e.elementType = w), (e.lanes = a), e);
          case te:
            return ((e = di(19, n, t, i)), (e.elementType = te), (e.lanes = a), e);
          default:
            if (typeof e == `object` && e)
              switch (e.$$typeof) {
                case C:
                  s = 10;
                  break a;
                case S:
                  s = 9;
                  break a;
                case ee:
                  s = 11;
                  break a;
                case ne:
                  s = 14;
                  break a;
                case T:
                  ((s = 16), (r = null));
                  break a;
              }
            ((s = 29), (n = Error(o(130, e === null ? `null` : typeof e, ``))), (r = null));
        }
      return ((t = di(s, n, t, i)), (t.elementType = e), (t.type = r), (t.lanes = a), t);
    }
    function gi(e, t, n, r) {
      return ((e = di(7, e, r, t)), (e.lanes = n), e);
    }
    function _i(e, t, n) {
      return ((e = di(6, e, null, t)), (e.lanes = n), e);
    }
    function vi(e) {
      var t = di(18, null, null, 0);
      return ((t.stateNode = e), t);
    }
    function yi(e, t, n) {
      return (
        (t = di(4, e.children === null ? [] : e.children, e.key, t)),
        (t.lanes = n),
        (t.stateNode = {
          containerInfo: e.containerInfo,
          pendingChildren: null,
          implementation: e.implementation,
        }),
        t
      );
    }
    var bi = new WeakMap();
    function xi(e, t) {
      if (typeof e == `object` && e) {
        var n = bi.get(e);
        return n === void 0 ? ((t = { value: e, source: t, stack: De(t) }), bi.set(e, t), t) : n;
      }
      return { value: e, source: t, stack: De(t) };
    }
    var Si = [],
      Ci = 0,
      wi = null,
      Ti = 0,
      Ei = [],
      Di = 0,
      Oi = null,
      ki = 1,
      Ai = ``;
    function ji(e, t) {
      ((Si[Ci++] = Ti), (Si[Ci++] = wi), (wi = e), (Ti = t));
    }
    function Mi(e, t, n) {
      ((Ei[Di++] = ki), (Ei[Di++] = Ai), (Ei[Di++] = Oi), (Oi = e));
      var r = ki;
      e = Ai;
      var i = 32 - Ge(r) - 1;
      ((r &= ~(1 << i)), (n += 1));
      var a = 32 - Ge(t) + i;
      if (30 < a) {
        var o = i - (i % 5);
        ((a = (r & ((1 << o) - 1)).toString(32)),
          (r >>= o),
          (i -= o),
          (ki = (1 << (32 - Ge(t) + i)) | (n << i) | r),
          (Ai = a + e));
      } else ((ki = (1 << a) | (n << i) | r), (Ai = e));
    }
    function Ni(e) {
      e.return !== null && (ji(e, 1), Mi(e, 1, 0));
    }
    function Pi(e) {
      for (; e === wi; ) ((wi = Si[--Ci]), (Si[Ci] = null), (Ti = Si[--Ci]), (Si[Ci] = null));
      for (; e === Oi; )
        ((Oi = Ei[--Di]),
          (Ei[Di] = null),
          (Ai = Ei[--Di]),
          (Ei[Di] = null),
          (ki = Ei[--Di]),
          (Ei[Di] = null));
    }
    function Fi(e, t) {
      ((Ei[Di++] = ki), (Ei[Di++] = Ai), (Ei[Di++] = Oi), (ki = t.id), (Ai = t.overflow), (Oi = e));
    }
    var Ii = null,
      I = null,
      L = !1,
      Li = null,
      Ri = !1,
      zi = Error(o(519));
    function Bi(e) {
      throw (
        Ki(
          xi(
            Error(
              o(
                418,
                1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? `text` : `HTML`,
                ``,
              ),
            ),
            e,
          ),
        ),
        zi
      );
    }
    function Vi(e) {
      var t = e.stateNode,
        n = e.type,
        r = e.memoizedProps;
      switch (((t[j] = e), (t[mt] = r), n)) {
        case `dialog`:
          (Q(`cancel`, t), Q(`close`, t));
          break;
        case `iframe`:
        case `object`:
        case `embed`:
          Q(`load`, t);
          break;
        case `video`:
        case `audio`:
          for (n = 0; n < _d.length; n++) Q(_d[n], t);
          break;
        case `source`:
          Q(`error`, t);
          break;
        case `img`:
        case `image`:
        case `link`:
          (Q(`error`, t), Q(`load`, t));
          break;
        case `details`:
          Q(`toggle`, t);
          break;
        case `input`:
          (Q(`invalid`, t),
            Ut(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0));
          break;
        case `select`:
          Q(`invalid`, t);
          break;
        case `textarea`:
          (Q(`invalid`, t), qt(t, r.value, r.defaultValue, r.children));
      }
      ((n = r.children),
        (typeof n != `string` && typeof n != `number` && typeof n != `bigint`) ||
        t.textContent === `` + n ||
        !0 === r.suppressHydrationWarning ||
        Md(t.textContent, n)
          ? (r.popover != null && (Q(`beforetoggle`, t), Q(`toggle`, t)),
            r.onScroll != null && Q(`scroll`, t),
            r.onScrollEnd != null && Q(`scrollend`, t),
            r.onClick != null && (t.onclick = nn),
            (t = !0))
          : (t = !1),
        t || Bi(e, !0));
    }
    function Hi(e) {
      for (Ii = e.return; Ii; )
        switch (Ii.tag) {
          case 5:
          case 31:
          case 13:
            Ri = !1;
            return;
          case 27:
          case 3:
            Ri = !0;
            return;
          default:
            Ii = Ii.return;
        }
    }
    function Ui(e) {
      if (e !== Ii) return !1;
      if (!L) return (Hi(e), (L = !0), !1);
      var t = e.tag,
        n;
      if (
        ((n = t !== 3 && t !== 27) &&
          ((n = t === 5) &&
            ((n = e.type), (n = !(n !== `form` && n !== `button`) || Ud(e.type, e.memoizedProps))),
          (n = !n)),
        n && I && Bi(e),
        Hi(e),
        t === 13)
      ) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(o(317));
        I = uf(e);
      } else if (t === 31) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(o(317));
        I = uf(e);
      } else
        t === 27
          ? ((t = I), Zd(e.type) ? ((e = lf), (lf = null), (I = e)) : (I = t))
          : (I = Ii ? cf(e.stateNode.nextSibling) : null);
      return !0;
    }
    function Wi() {
      ((I = Ii = null), (L = !1));
    }
    function Gi() {
      var e = Li;
      return (e !== null && (Zl === null ? (Zl = e) : Zl.push.apply(Zl, e), (Li = null)), e);
    }
    function Ki(e) {
      Li === null ? (Li = [e]) : Li.push(e);
    }
    var qi = O(null),
      Ji = null,
      Yi = null;
    function Xi(e, t, n) {
      (A(qi, t._currentValue), (t._currentValue = n));
    }
    function Zi(e) {
      ((e._currentValue = qi.current), k(qi));
    }
    function Qi(e, t, n) {
      for (; e !== null; ) {
        var r = e.alternate;
        if (
          ((e.childLanes & t) === t
            ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t)
            : ((e.childLanes |= t), r !== null && (r.childLanes |= t)),
          e === n)
        )
          break;
        e = e.return;
      }
    }
    function $i(e, t, n, r) {
      var i = e.child;
      for (i !== null && (i.return = e); i !== null; ) {
        var a = i.dependencies;
        if (a !== null) {
          var s = i.child;
          a = a.firstContext;
          a: for (; a !== null; ) {
            var c = a;
            a = i;
            for (var l = 0; l < t.length; l++)
              if (c.context === t[l]) {
                ((a.lanes |= n),
                  (c = a.alternate),
                  c !== null && (c.lanes |= n),
                  Qi(a.return, n, e),
                  r || (s = null));
                break a;
              }
            a = c.next;
          }
        } else if (i.tag === 18) {
          if (((s = i.return), s === null)) throw Error(o(341));
          ((s.lanes |= n),
            (a = s.alternate),
            a !== null && (a.lanes |= n),
            Qi(s, n, e),
            (s = null));
        } else s = i.child;
        if (s !== null) s.return = i;
        else
          for (s = i; s !== null; ) {
            if (s === e) {
              s = null;
              break;
            }
            if (((i = s.sibling), i !== null)) {
              ((i.return = s.return), (s = i));
              break;
            }
            s = s.return;
          }
        i = s;
      }
    }
    function ea(e, t, n, r) {
      e = null;
      for (var i = t, a = !1; i !== null; ) {
        if (!a) {
          if (i.flags & 524288) a = !0;
          else if (i.flags & 262144) break;
        }
        if (i.tag === 10) {
          var s = i.alternate;
          if (s === null) throw Error(o(387));
          if (((s = s.memoizedProps), s !== null)) {
            var c = i.type;
            Tr(i.pendingProps.value, s.value) || (e === null ? (e = [c]) : e.push(c));
          }
        } else if (i === ge.current) {
          if (((s = i.alternate), s === null)) throw Error(o(387));
          s.memoizedState.memoizedState !== i.memoizedState.memoizedState &&
            (e === null ? (e = [Qf]) : e.push(Qf));
        }
        i = i.return;
      }
      (e !== null && $i(t, e, n, r), (t.flags |= 262144));
    }
    function ta(e) {
      for (e = e.firstContext; e !== null; ) {
        if (!Tr(e.context._currentValue, e.memoizedValue)) return !0;
        e = e.next;
      }
      return !1;
    }
    function na(e) {
      ((Ji = e), (Yi = null), (e = e.dependencies), e !== null && (e.firstContext = null));
    }
    function ra(e) {
      return aa(Ji, e);
    }
    function ia(e, t) {
      return (Ji === null && na(e), aa(e, t));
    }
    function aa(e, t) {
      var n = t._currentValue;
      if (((t = { context: t, memoizedValue: n, next: null }), Yi === null)) {
        if (e === null) throw Error(o(308));
        ((Yi = t), (e.dependencies = { lanes: 0, firstContext: t }), (e.flags |= 524288));
      } else Yi = Yi.next = t;
      return n;
    }
    var oa =
        typeof AbortController < `u`
          ? AbortController
          : function () {
              var e = [],
                t = (this.signal = {
                  aborted: !1,
                  addEventListener: function (t, n) {
                    e.push(n);
                  },
                });
              this.abort = function () {
                ((t.aborted = !0),
                  e.forEach(function (e) {
                    return e();
                  }));
              };
            },
      sa = n.unstable_scheduleCallback,
      ca = n.unstable_NormalPriority,
      la = {
        $$typeof: C,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0,
      };
    function ua() {
      return { controller: new oa(), data: new Map(), refCount: 0 };
    }
    function da(e) {
      (e.refCount--,
        e.refCount === 0 &&
          sa(ca, function () {
            e.controller.abort();
          }));
    }
    var fa = null,
      pa = 0,
      ma = 0,
      ha = null;
    function ga(e, t) {
      if (fa === null) {
        var n = (fa = []);
        ((pa = 0),
          (ma = dd()),
          (ha = {
            status: `pending`,
            value: void 0,
            then: function (e) {
              n.push(e);
            },
          }));
      }
      return (pa++, t.then(_a, _a), t);
    }
    function _a() {
      if (--pa === 0 && fa !== null) {
        ha !== null && (ha.status = `fulfilled`);
        var e = fa;
        ((fa = null), (ma = 0), (ha = null));
        for (var t = 0; t < e.length; t++) (0, e[t])();
      }
    }
    function va(e, t) {
      var n = [],
        r = {
          status: `pending`,
          value: null,
          reason: null,
          then: function (e) {
            n.push(e);
          },
        };
      return (
        e.then(
          function () {
            ((r.status = `fulfilled`), (r.value = t));
            for (var e = 0; e < n.length; e++) (0, n[e])(t);
          },
          function (e) {
            for (r.status = `rejected`, r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
          },
        ),
        r
      );
    }
    var ya = E.S;
    E.S = function (e, t) {
      ((eu = Ne()),
        typeof t == `object` && t && typeof t.then == `function` && ga(e, t),
        ya !== null && ya(e, t));
    };
    var ba = O(null);
    function xa() {
      var e = ba.current;
      return e === null ? K.pooledCache : e;
    }
    function Sa(e, t) {
      t === null ? A(ba, ba.current) : A(ba, t.pool);
    }
    function Ca() {
      var e = xa();
      return e === null ? null : { parent: la._currentValue, pool: e };
    }
    var wa = Error(o(460)),
      Ta = Error(o(474)),
      Ea = Error(o(542)),
      Da = { then: function () {} };
    function Oa(e) {
      return ((e = e.status), e === `fulfilled` || e === `rejected`);
    }
    function ka(e, t, n) {
      switch (
        ((n = e[n]), n === void 0 ? e.push(t) : n !== t && (t.then(nn, nn), (t = n)), t.status)
      ) {
        case `fulfilled`:
          return t.value;
        case `rejected`:
          throw ((e = t.reason), Na(e), e);
        default:
          if (typeof t.status == `string`) t.then(nn, nn);
          else {
            if (((e = K), e !== null && 100 < e.shellSuspendCounter)) throw Error(o(482));
            ((e = t),
              (e.status = `pending`),
              e.then(
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `fulfilled`), (n.value = e));
                  }
                },
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `rejected`), (n.reason = e));
                  }
                },
              ));
          }
          switch (t.status) {
            case `fulfilled`:
              return t.value;
            case `rejected`:
              throw ((e = t.reason), Na(e), e);
          }
          throw ((ja = t), wa);
      }
    }
    function Aa(e) {
      try {
        var t = e._init;
        return t(e._payload);
      } catch (e) {
        throw typeof e == `object` && e && typeof e.then == `function` ? ((ja = e), wa) : e;
      }
    }
    var ja = null;
    function Ma() {
      if (ja === null) throw Error(o(459));
      var e = ja;
      return ((ja = null), e);
    }
    function Na(e) {
      if (e === wa || e === Ea) throw Error(o(483));
    }
    var Pa = null,
      Fa = 0;
    function Ia(e) {
      var t = Fa;
      return ((Fa += 1), Pa === null && (Pa = []), ka(Pa, e, t));
    }
    function La(e, t) {
      ((t = t.props.ref), (e.ref = t === void 0 ? null : t));
    }
    function Ra(e, t) {
      throw t.$$typeof === g
        ? Error(o(525))
        : ((e = Object.prototype.toString.call(t)),
          Error(
            o(
              31,
              e === `[object Object]` ? `object with keys {` + Object.keys(t).join(`, `) + `}` : e,
            ),
          ));
    }
    function za(e) {
      function t(t, n) {
        if (e) {
          var r = t.deletions;
          r === null ? ((t.deletions = [n]), (t.flags |= 16)) : r.push(n);
        }
      }
      function n(n, r) {
        if (!e) return null;
        for (; r !== null; ) (t(n, r), (r = r.sibling));
        return null;
      }
      function r(e) {
        for (var t = new Map(); e !== null; )
          (e.key === null ? t.set(e.index, e) : t.set(e.key, e), (e = e.sibling));
        return t;
      }
      function i(e, t) {
        return ((e = pi(e, t)), (e.index = 0), (e.sibling = null), e);
      }
      function a(t, n, r) {
        return (
          (t.index = r),
          e
            ? ((r = t.alternate),
              r === null
                ? ((t.flags |= 67108866), n)
                : ((r = r.index), r < n ? ((t.flags |= 67108866), n) : r))
            : ((t.flags |= 1048576), n)
        );
      }
      function s(t) {
        return (e && t.alternate === null && (t.flags |= 67108866), t);
      }
      function c(e, t, n, r) {
        return t === null || t.tag !== 6
          ? ((t = _i(n, e.mode, r)), (t.return = e), t)
          : ((t = i(t, n)), (t.return = e), t);
      }
      function l(e, t, n, r) {
        var a = n.type;
        return a === y
          ? d(e, t, n.props.children, r, n.key)
          : t !== null &&
              (t.elementType === a ||
                (typeof a == `object` && a && a.$$typeof === T && Aa(a) === t.type))
            ? ((t = i(t, n.props)), La(t, n), (t.return = e), t)
            : ((t = hi(n.type, n.key, n.props, null, e.mode, r)), La(t, n), (t.return = e), t);
      }
      function u(e, t, n, r) {
        return t === null ||
          t.tag !== 4 ||
          t.stateNode.containerInfo !== n.containerInfo ||
          t.stateNode.implementation !== n.implementation
          ? ((t = yi(n, e.mode, r)), (t.return = e), t)
          : ((t = i(t, n.children || [])), (t.return = e), t);
      }
      function d(e, t, n, r, a) {
        return t === null || t.tag !== 7
          ? ((t = gi(n, e.mode, r, a)), (t.return = e), t)
          : ((t = i(t, n)), (t.return = e), t);
      }
      function f(e, t, n) {
        if ((typeof t == `string` && t !== ``) || typeof t == `number` || typeof t == `bigint`)
          return ((t = _i(`` + t, e.mode, n)), (t.return = e), t);
        if (typeof t == `object` && t) {
          switch (t.$$typeof) {
            case _:
              return (
                (n = hi(t.type, t.key, t.props, null, e.mode, n)), La(n, t), (n.return = e), n
              );
            case v:
              return ((t = yi(t, e.mode, n)), (t.return = e), t);
            case T:
              return ((t = Aa(t)), f(e, t, n));
          }
          if (le(t) || oe(t)) return ((t = gi(t, e.mode, n, null)), (t.return = e), t);
          if (typeof t.then == `function`) return f(e, Ia(t), n);
          if (t.$$typeof === C) return f(e, ia(e, t), n);
          Ra(e, t);
        }
        return null;
      }
      function p(e, t, n, r) {
        var i = t === null ? null : t.key;
        if ((typeof n == `string` && n !== ``) || typeof n == `number` || typeof n == `bigint`)
          return i === null ? c(e, t, `` + n, r) : null;
        if (typeof n == `object` && n) {
          switch (n.$$typeof) {
            case _:
              return n.key === i ? l(e, t, n, r) : null;
            case v:
              return n.key === i ? u(e, t, n, r) : null;
            case T:
              return ((n = Aa(n)), p(e, t, n, r));
          }
          if (le(n) || oe(n)) return i === null ? d(e, t, n, r, null) : null;
          if (typeof n.then == `function`) return p(e, t, Ia(n), r);
          if (n.$$typeof === C) return p(e, t, ia(e, n), r);
          Ra(e, n);
        }
        return null;
      }
      function m(e, t, n, r, i) {
        if ((typeof r == `string` && r !== ``) || typeof r == `number` || typeof r == `bigint`)
          return ((e = e.get(n) || null), c(t, e, `` + r, i));
        if (typeof r == `object` && r) {
          switch (r.$$typeof) {
            case _:
              return ((e = e.get(r.key === null ? n : r.key) || null), l(t, e, r, i));
            case v:
              return ((e = e.get(r.key === null ? n : r.key) || null), u(t, e, r, i));
            case T:
              return ((r = Aa(r)), m(e, t, n, r, i));
          }
          if (le(r) || oe(r)) return ((e = e.get(n) || null), d(t, e, r, i, null));
          if (typeof r.then == `function`) return m(e, t, n, Ia(r), i);
          if (r.$$typeof === C) return m(e, t, n, ia(t, r), i);
          Ra(t, r);
        }
        return null;
      }
      function h(i, o, s, c) {
        for (
          var l = null, u = null, d = o, h = (o = 0), g = null;
          d !== null && h < s.length;
          h++
        ) {
          d.index > h ? ((g = d), (d = null)) : (g = d.sibling);
          var _ = p(i, d, s[h], c);
          if (_ === null) {
            d === null && (d = g);
            break;
          }
          (e && d && _.alternate === null && t(i, d),
            (o = a(_, o, h)),
            u === null ? (l = _) : (u.sibling = _),
            (u = _),
            (d = g));
        }
        if (h === s.length) return (n(i, d), L && ji(i, h), l);
        if (d === null) {
          for (; h < s.length; h++)
            ((d = f(i, s[h], c)),
              d !== null && ((o = a(d, o, h)), u === null ? (l = d) : (u.sibling = d), (u = d)));
          return (L && ji(i, h), l);
        }
        for (d = r(d); h < s.length; h++)
          ((g = m(d, i, h, s[h], c)),
            g !== null &&
              (e && g.alternate !== null && d.delete(g.key === null ? h : g.key),
              (o = a(g, o, h)),
              u === null ? (l = g) : (u.sibling = g),
              (u = g)));
        return (
          e &&
            d.forEach(function (e) {
              return t(i, e);
            }),
          L && ji(i, h),
          l
        );
      }
      function g(i, s, c, l) {
        if (c == null) throw Error(o(151));
        for (
          var u = null, d = null, h = s, g = (s = 0), _ = null, v = c.next();
          h !== null && !v.done;
          g++, v = c.next()
        ) {
          h.index > g ? ((_ = h), (h = null)) : (_ = h.sibling);
          var y = p(i, h, v.value, l);
          if (y === null) {
            h === null && (h = _);
            break;
          }
          (e && h && y.alternate === null && t(i, h),
            (s = a(y, s, g)),
            d === null ? (u = y) : (d.sibling = y),
            (d = y),
            (h = _));
        }
        if (v.done) return (n(i, h), L && ji(i, g), u);
        if (h === null) {
          for (; !v.done; g++, v = c.next())
            ((v = f(i, v.value, l)),
              v !== null && ((s = a(v, s, g)), d === null ? (u = v) : (d.sibling = v), (d = v)));
          return (L && ji(i, g), u);
        }
        for (h = r(h); !v.done; g++, v = c.next())
          ((v = m(h, i, g, v.value, l)),
            v !== null &&
              (e && v.alternate !== null && h.delete(v.key === null ? g : v.key),
              (s = a(v, s, g)),
              d === null ? (u = v) : (d.sibling = v),
              (d = v)));
        return (
          e &&
            h.forEach(function (e) {
              return t(i, e);
            }),
          L && ji(i, g),
          u
        );
      }
      function b(e, r, a, c) {
        if (
          (typeof a == `object` && a && a.type === y && a.key === null && (a = a.props.children),
          typeof a == `object` && a)
        ) {
          switch (a.$$typeof) {
            case _:
              a: {
                for (var l = a.key; r !== null; ) {
                  if (r.key === l) {
                    if (((l = a.type), l === y)) {
                      if (r.tag === 7) {
                        (n(e, r.sibling), (c = i(r, a.props.children)), (c.return = e), (e = c));
                        break a;
                      }
                    } else if (
                      r.elementType === l ||
                      (typeof l == `object` && l && l.$$typeof === T && Aa(l) === r.type)
                    ) {
                      (n(e, r.sibling), (c = i(r, a.props)), La(c, a), (c.return = e), (e = c));
                      break a;
                    }
                    n(e, r);
                    break;
                  } else t(e, r);
                  r = r.sibling;
                }
                a.type === y
                  ? ((c = gi(a.props.children, e.mode, c, a.key)), (c.return = e), (e = c))
                  : ((c = hi(a.type, a.key, a.props, null, e.mode, c)),
                    La(c, a),
                    (c.return = e),
                    (e = c));
              }
              return s(e);
            case v:
              a: {
                for (l = a.key; r !== null; ) {
                  if (r.key === l)
                    if (
                      r.tag === 4 &&
                      r.stateNode.containerInfo === a.containerInfo &&
                      r.stateNode.implementation === a.implementation
                    ) {
                      (n(e, r.sibling), (c = i(r, a.children || [])), (c.return = e), (e = c));
                      break a;
                    } else {
                      n(e, r);
                      break;
                    }
                  else t(e, r);
                  r = r.sibling;
                }
                ((c = yi(a, e.mode, c)), (c.return = e), (e = c));
              }
              return s(e);
            case T:
              return ((a = Aa(a)), b(e, r, a, c));
          }
          if (le(a)) return h(e, r, a, c);
          if (oe(a)) {
            if (((l = oe(a)), typeof l != `function`)) throw Error(o(150));
            return ((a = l.call(a)), g(e, r, a, c));
          }
          if (typeof a.then == `function`) return b(e, r, Ia(a), c);
          if (a.$$typeof === C) return b(e, r, ia(e, a), c);
          Ra(e, a);
        }
        return (typeof a == `string` && a !== ``) || typeof a == `number` || typeof a == `bigint`
          ? ((a = `` + a),
            r !== null && r.tag === 6
              ? (n(e, r.sibling), (c = i(r, a)), (c.return = e), (e = c))
              : (n(e, r), (c = _i(a, e.mode, c)), (c.return = e), (e = c)),
            s(e))
          : n(e, r);
      }
      return function (e, t, n, r) {
        try {
          Fa = 0;
          var i = b(e, t, n, r);
          return ((Pa = null), i);
        } catch (t) {
          if (t === wa || t === Ea) throw t;
          var a = di(29, t, null, e.mode);
          return ((a.lanes = r), (a.return = e), a);
        }
      };
    }
    var Ba = za(!0),
      Va = za(!1),
      Ha = !1;
    function Ua(e) {
      e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, lanes: 0, hiddenCallbacks: null },
        callbacks: null,
      };
    }
    function Wa(e, t) {
      ((e = e.updateQueue),
        t.updateQueue === e &&
          (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null,
          }));
    }
    function Ga(e) {
      return { lane: e, tag: 0, payload: null, callback: null, next: null };
    }
    function Ka(e, t, n) {
      var r = e.updateQueue;
      if (r === null) return null;
      if (((r = r.shared), G & 2)) {
        var i = r.pending;
        return (
          i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
          (r.pending = t),
          (t = ci(e)),
          si(e, null, n),
          t
        );
      }
      return (ii(e, r, t, n), ci(e));
    }
    function qa(e, t, n) {
      if (((t = t.updateQueue), t !== null && ((t = t.shared), n & 4194048))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), st(e, n));
      }
    }
    function Ja(e, t) {
      var n = e.updateQueue,
        r = e.alternate;
      if (r !== null && ((r = r.updateQueue), n === r)) {
        var i = null,
          a = null;
        if (((n = n.firstBaseUpdate), n !== null)) {
          do {
            var o = { lane: n.lane, tag: n.tag, payload: n.payload, callback: null, next: null };
            (a === null ? (i = a = o) : (a = a.next = o), (n = n.next));
          } while (n !== null);
          a === null ? (i = a = t) : (a = a.next = t);
        } else i = a = t;
        ((n = {
          baseState: r.baseState,
          firstBaseUpdate: i,
          lastBaseUpdate: a,
          shared: r.shared,
          callbacks: r.callbacks,
        }),
          (e.updateQueue = n));
        return;
      }
      ((e = n.lastBaseUpdate),
        e === null ? (n.firstBaseUpdate = t) : (e.next = t),
        (n.lastBaseUpdate = t));
    }
    var Ya = !1;
    function Xa() {
      if (Ya) {
        var e = ha;
        if (e !== null) throw e;
      }
    }
    function Za(e, t, n, r) {
      Ya = !1;
      var i = e.updateQueue;
      Ha = !1;
      var a = i.firstBaseUpdate,
        o = i.lastBaseUpdate,
        s = i.shared.pending;
      if (s !== null) {
        i.shared.pending = null;
        var c = s,
          l = c.next;
        ((c.next = null), o === null ? (a = l) : (o.next = l), (o = c));
        var u = e.alternate;
        u !== null &&
          ((u = u.updateQueue),
          (s = u.lastBaseUpdate),
          s !== o && (s === null ? (u.firstBaseUpdate = l) : (s.next = l), (u.lastBaseUpdate = c)));
      }
      if (a !== null) {
        var d = i.baseState;
        ((o = 0), (u = l = c = null), (s = a));
        do {
          var f = s.lane & -536870913,
            p = f !== s.lane;
          if (p ? (J & f) === f : (r & f) === f) {
            (f !== 0 && f === ma && (Ya = !0),
              u !== null &&
                (u = u.next =
                  { lane: 0, tag: s.tag, payload: s.payload, callback: null, next: null }));
            a: {
              var m = e,
                g = s;
              f = t;
              var _ = n;
              switch (g.tag) {
                case 1:
                  if (((m = g.payload), typeof m == `function`)) {
                    d = m.call(_, d, f);
                    break a;
                  }
                  d = m;
                  break a;
                case 3:
                  m.flags = (m.flags & -65537) | 128;
                case 0:
                  if (
                    ((m = g.payload), (f = typeof m == `function` ? m.call(_, d, f) : m), f == null)
                  )
                    break a;
                  d = h({}, d, f);
                  break a;
                case 2:
                  Ha = !0;
              }
            }
            ((f = s.callback),
              f !== null &&
                ((e.flags |= 64),
                p && (e.flags |= 8192),
                (p = i.callbacks),
                p === null ? (i.callbacks = [f]) : p.push(f)));
          } else
            ((p = { lane: f, tag: s.tag, payload: s.payload, callback: s.callback, next: null }),
              u === null ? ((l = u = p), (c = d)) : (u = u.next = p),
              (o |= f));
          if (((s = s.next), s === null)) {
            if (((s = i.shared.pending), s === null)) break;
            ((p = s),
              (s = p.next),
              (p.next = null),
              (i.lastBaseUpdate = p),
              (i.shared.pending = null));
          }
        } while (1);
        (u === null && (c = d),
          (i.baseState = c),
          (i.firstBaseUpdate = l),
          (i.lastBaseUpdate = u),
          a === null && (i.shared.lanes = 0),
          (Gl |= o),
          (e.lanes = o),
          (e.memoizedState = d));
      }
    }
    function Qa(e, t) {
      if (typeof e != `function`) throw Error(o(191, e));
      e.call(t);
    }
    function $a(e, t) {
      var n = e.callbacks;
      if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Qa(n[e], t);
    }
    var eo = O(null),
      to = O(0);
    function no(e, t) {
      ((e = Wl), A(to, e), A(eo, t), (Wl = e | t.baseLanes));
    }
    function ro() {
      (A(to, Wl), A(eo, eo.current));
    }
    function io() {
      ((Wl = to.current), k(eo), k(to));
    }
    var ao = O(null),
      oo = null;
    function so(e) {
      var t = e.alternate;
      (A(R, R.current & 1),
        A(ao, e),
        oo === null && (t === null || eo.current !== null || t.memoizedState !== null) && (oo = e));
    }
    function co(e) {
      (A(R, R.current), A(ao, e), oo === null && (oo = e));
    }
    function lo(e) {
      e.tag === 22 ? (A(R, R.current), A(ao, e), oo === null && (oo = e)) : uo(e);
    }
    function uo() {
      (A(R, R.current), A(ao, ao.current));
    }
    function fo(e) {
      (k(ao), oo === e && (oo = null), k(R));
    }
    var R = O(0);
    function po(e) {
      for (var t = e; t !== null; ) {
        if (t.tag === 13) {
          var n = t.memoizedState;
          if (n !== null && ((n = n.dehydrated), n === null || af(n) || of(n))) return t;
        } else if (
          t.tag === 19 &&
          (t.memoizedProps.revealOrder === `forwards` ||
            t.memoizedProps.revealOrder === `backwards` ||
            t.memoizedProps.revealOrder === `unstable_legacy-backwards` ||
            t.memoizedProps.revealOrder === `together`)
        ) {
          if (t.flags & 128) return t;
        } else if (t.child !== null) {
          ((t.child.return = t), (t = t.child));
          continue;
        }
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return null;
          t = t.return;
        }
        ((t.sibling.return = t.return), (t = t.sibling));
      }
      return null;
    }
    var mo = 0,
      z = null,
      B = null,
      ho = null,
      go = !1,
      _o = !1,
      vo = !1,
      yo = 0,
      bo = 0,
      xo = null,
      So = 0;
    function V() {
      throw Error(o(321));
    }
    function Co(e, t) {
      if (t === null) return !1;
      for (var n = 0; n < t.length && n < e.length; n++) if (!Tr(e[n], t[n])) return !1;
      return !0;
    }
    function wo(e, t, n, r, i, a) {
      return (
        (mo = a),
        (z = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (E.H = e === null || e.memoizedState === null ? Bs : Vs),
        (vo = !1),
        (a = n(r, i)),
        (vo = !1),
        _o && (a = Eo(t, n, r, i)),
        To(e),
        a
      );
    }
    function To(e) {
      E.H = zs;
      var t = B !== null && B.next !== null;
      if (((mo = 0), (ho = B = z = null), (go = !1), (bo = 0), (xo = null), t)) throw Error(o(300));
      e === null || ic || ((e = e.dependencies), e !== null && ta(e) && (ic = !0));
    }
    function Eo(e, t, n, r) {
      z = e;
      var i = 0;
      do {
        if ((_o && (xo = null), (bo = 0), (_o = !1), 25 <= i)) throw Error(o(301));
        if (((i += 1), (ho = B = null), e.updateQueue != null)) {
          var a = e.updateQueue;
          ((a.lastEffect = null),
            (a.events = null),
            (a.stores = null),
            a.memoCache != null && (a.memoCache.index = 0));
        }
        ((E.H = Hs), (a = t(n, r)));
      } while (_o);
      return a;
    }
    function Do() {
      var e = E.H,
        t = e.useState()[0];
      return (
        (t = typeof t.then == `function` ? No(t) : t),
        (e = e.useState()[0]),
        (B === null ? null : B.memoizedState) !== e && (z.flags |= 1024),
        t
      );
    }
    function Oo() {
      var e = yo !== 0;
      return ((yo = 0), e);
    }
    function ko(e, t, n) {
      ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~n));
    }
    function Ao(e) {
      if (go) {
        for (e = e.memoizedState; e !== null; ) {
          var t = e.queue;
          (t !== null && (t.pending = null), (e = e.next));
        }
        go = !1;
      }
      ((mo = 0), (ho = B = z = null), (_o = !1), (bo = yo = 0), (xo = null));
    }
    function jo() {
      var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
      return (ho === null ? (z.memoizedState = ho = e) : (ho = ho.next = e), ho);
    }
    function H() {
      if (B === null) {
        var e = z.alternate;
        e = e === null ? null : e.memoizedState;
      } else e = B.next;
      var t = ho === null ? z.memoizedState : ho.next;
      if (t !== null) ((ho = t), (B = e));
      else {
        if (e === null) throw z.alternate === null ? Error(o(467)) : Error(o(310));
        ((B = e),
          (e = {
            memoizedState: B.memoizedState,
            baseState: B.baseState,
            baseQueue: B.baseQueue,
            queue: B.queue,
            next: null,
          }),
          ho === null ? (z.memoizedState = ho = e) : (ho = ho.next = e));
      }
      return ho;
    }
    function Mo() {
      return { lastEffect: null, events: null, stores: null, memoCache: null };
    }
    function No(e) {
      var t = bo;
      return (
        (bo += 1),
        xo === null && (xo = []),
        (e = ka(xo, e, t)),
        (t = z),
        (ho === null ? t.memoizedState : ho.next) === null &&
          ((t = t.alternate), (E.H = t === null || t.memoizedState === null ? Bs : Vs)),
        e
      );
    }
    function Po(e) {
      if (typeof e == `object` && e) {
        if (typeof e.then == `function`) return No(e);
        if (e.$$typeof === C) return ra(e);
      }
      throw Error(o(438, String(e)));
    }
    function Fo(e) {
      var t = null,
        n = z.updateQueue;
      if ((n !== null && (t = n.memoCache), t == null)) {
        var r = z.alternate;
        r !== null &&
          ((r = r.updateQueue),
          r !== null &&
            ((r = r.memoCache),
            r != null &&
              (t = {
                data: r.data.map(function (e) {
                  return e.slice();
                }),
                index: 0,
              })));
      }
      if (
        ((t ??= { data: [], index: 0 }),
        n === null && ((n = Mo()), (z.updateQueue = n)),
        (n.memoCache = t),
        (n = t.data[t.index]),
        n === void 0)
      )
        for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ie;
      return (t.index++, n);
    }
    function Io(e, t) {
      return typeof t == `function` ? t(e) : t;
    }
    function Lo(e) {
      return Ro(H(), B, e);
    }
    function Ro(e, t, n) {
      var r = e.queue;
      if (r === null) throw Error(o(311));
      r.lastRenderedReducer = n;
      var i = e.baseQueue,
        a = r.pending;
      if (a !== null) {
        if (i !== null) {
          var s = i.next;
          ((i.next = a.next), (a.next = s));
        }
        ((t.baseQueue = i = a), (r.pending = null));
      }
      if (((a = e.baseState), i === null)) e.memoizedState = a;
      else {
        t = i.next;
        var c = (s = null),
          l = null,
          u = t,
          d = !1;
        do {
          var f = u.lane & -536870913;
          if (f === u.lane ? (mo & f) === f : (J & f) === f) {
            var p = u.revertLane;
            if (p === 0)
              (l !== null &&
                (l = l.next =
                  {
                    lane: 0,
                    revertLane: 0,
                    gesture: null,
                    action: u.action,
                    hasEagerState: u.hasEagerState,
                    eagerState: u.eagerState,
                    next: null,
                  }),
                f === ma && (d = !0));
            else if ((mo & p) === p) {
              ((u = u.next), p === ma && (d = !0));
              continue;
            } else
              ((f = {
                lane: 0,
                revertLane: u.revertLane,
                gesture: null,
                action: u.action,
                hasEagerState: u.hasEagerState,
                eagerState: u.eagerState,
                next: null,
              }),
                l === null ? ((c = l = f), (s = a)) : (l = l.next = f),
                (z.lanes |= p),
                (Gl |= p));
            ((f = u.action), vo && n(a, f), (a = u.hasEagerState ? u.eagerState : n(a, f)));
          } else
            ((p = {
              lane: f,
              revertLane: u.revertLane,
              gesture: u.gesture,
              action: u.action,
              hasEagerState: u.hasEagerState,
              eagerState: u.eagerState,
              next: null,
            }),
              l === null ? ((c = l = p), (s = a)) : (l = l.next = p),
              (z.lanes |= f),
              (Gl |= f));
          u = u.next;
        } while (u !== null && u !== t);
        if (
          (l === null ? (s = a) : (l.next = c),
          !Tr(a, e.memoizedState) && ((ic = !0), d && ((n = ha), n !== null)))
        )
          throw n;
        ((e.memoizedState = a), (e.baseState = s), (e.baseQueue = l), (r.lastRenderedState = a));
      }
      return (i === null && (r.lanes = 0), [e.memoizedState, r.dispatch]);
    }
    function zo(e) {
      var t = H(),
        n = t.queue;
      if (n === null) throw Error(o(311));
      n.lastRenderedReducer = e;
      var r = n.dispatch,
        i = n.pending,
        a = t.memoizedState;
      if (i !== null) {
        n.pending = null;
        var s = (i = i.next);
        do ((a = e(a, s.action)), (s = s.next));
        while (s !== i);
        (Tr(a, t.memoizedState) || (ic = !0),
          (t.memoizedState = a),
          t.baseQueue === null && (t.baseState = a),
          (n.lastRenderedState = a));
      }
      return [a, r];
    }
    function Bo(e, t, n) {
      var r = z,
        i = H(),
        a = L;
      if (a) {
        if (n === void 0) throw Error(o(407));
        n = n();
      } else n = t();
      var s = !Tr((B || i).memoizedState, n);
      if (
        (s && ((i.memoizedState = n), (ic = !0)),
        (i = i.queue),
        ds(Uo.bind(null, r, i, e), [e]),
        i.getSnapshot !== t || s || (ho !== null && ho.memoizedState.tag & 1))
      ) {
        if (
          ((r.flags |= 2048),
          os(9, { destroy: void 0 }, Ho.bind(null, r, i, n, t), null),
          K === null)
        )
          throw Error(o(349));
        a || mo & 127 || Vo(r, t, n);
      }
      return n;
    }
    function Vo(e, t, n) {
      ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = z.updateQueue),
        t === null
          ? ((t = Mo()), (z.updateQueue = t), (t.stores = [e]))
          : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
    }
    function Ho(e, t, n, r) {
      ((t.value = n), (t.getSnapshot = r), Wo(t) && Go(e));
    }
    function Uo(e, t, n) {
      return n(function () {
        Wo(t) && Go(e);
      });
    }
    function Wo(e) {
      var t = e.getSnapshot;
      e = e.value;
      try {
        var n = t();
        return !Tr(e, n);
      } catch {
        return !0;
      }
    }
    function Go(e) {
      var t = oi(e, 2);
      t !== null && hu(t, e, 2);
    }
    function Ko(e) {
      var t = jo();
      if (typeof e == `function`) {
        var n = e;
        if (((e = n()), vo)) {
          We(!0);
          try {
            n();
          } finally {
            We(!1);
          }
        }
      }
      return (
        (t.memoizedState = t.baseState = e),
        (t.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Io,
          lastRenderedState: e,
        }),
        t
      );
    }
    function qo(e, t, n, r) {
      return ((e.baseState = n), Ro(e, B, typeof r == `function` ? r : Io));
    }
    function Jo(e, t, n, r, i) {
      if (Is(e)) throw Error(o(485));
      if (((e = t.action), e !== null)) {
        var a = {
          payload: i,
          action: e,
          next: null,
          isTransition: !0,
          status: `pending`,
          value: null,
          reason: null,
          listeners: [],
          then: function (e) {
            a.listeners.push(e);
          },
        };
        (E.T === null ? (a.isTransition = !1) : n(!0),
          r(a),
          (n = t.pending),
          n === null
            ? ((a.next = t.pending = a), Yo(t, a))
            : ((a.next = n.next), (t.pending = n.next = a)));
      }
    }
    function Yo(e, t) {
      var n = t.action,
        r = t.payload,
        i = e.state;
      if (t.isTransition) {
        var a = E.T,
          o = {};
        E.T = o;
        try {
          var s = n(i, r),
            c = E.S;
          (c !== null && c(o, s), Xo(e, t, s));
        } catch (n) {
          Qo(e, t, n);
        } finally {
          (a !== null && o.types !== null && (a.types = o.types), (E.T = a));
        }
      } else
        try {
          ((a = n(i, r)), Xo(e, t, a));
        } catch (n) {
          Qo(e, t, n);
        }
    }
    function Xo(e, t, n) {
      typeof n == `object` && n && typeof n.then == `function`
        ? n.then(
            function (n) {
              Zo(e, t, n);
            },
            function (n) {
              return Qo(e, t, n);
            },
          )
        : Zo(e, t, n);
    }
    function Zo(e, t, n) {
      ((t.status = `fulfilled`),
        (t.value = n),
        $o(t),
        (e.state = n),
        (t = e.pending),
        t !== null &&
          ((n = t.next), n === t ? (e.pending = null) : ((n = n.next), (t.next = n), Yo(e, n))));
    }
    function Qo(e, t, n) {
      var r = e.pending;
      if (((e.pending = null), r !== null)) {
        r = r.next;
        do ((t.status = `rejected`), (t.reason = n), $o(t), (t = t.next));
        while (t !== r);
      }
      e.action = null;
    }
    function $o(e) {
      e = e.listeners;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
    function es(e, t) {
      return t;
    }
    function ts(e, t) {
      if (L) {
        var n = K.formState;
        if (n !== null) {
          a: {
            var r = z;
            if (L) {
              if (I) {
                b: {
                  for (var i = I, a = Ri; i.nodeType !== 8; ) {
                    if (!a) {
                      i = null;
                      break b;
                    }
                    if (((i = cf(i.nextSibling)), i === null)) {
                      i = null;
                      break b;
                    }
                  }
                  ((a = i.data), (i = a === `F!` || a === `F` ? i : null));
                }
                if (i) {
                  ((I = cf(i.nextSibling)), (r = i.data === `F!`));
                  break a;
                }
              }
              Bi(r);
            }
            r = !1;
          }
          r && (t = n[0]);
        }
      }
      return (
        (n = jo()),
        (n.memoizedState = n.baseState = t),
        (r = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: es,
          lastRenderedState: t,
        }),
        (n.queue = r),
        (n = Ns.bind(null, z, r)),
        (r.dispatch = n),
        (r = Ko(!1)),
        (a = Fs.bind(null, z, !1, r.queue)),
        (r = jo()),
        (i = { state: t, dispatch: null, action: e, pending: null }),
        (r.queue = i),
        (n = Jo.bind(null, z, i, a, n)),
        (i.dispatch = n),
        (r.memoizedState = e),
        [t, n, !1]
      );
    }
    function ns(e) {
      return rs(H(), B, e);
    }
    function rs(e, t, n) {
      if (
        ((t = Ro(e, t, es)[0]),
        (e = Lo(Io)[0]),
        typeof t == `object` && t && typeof t.then == `function`)
      )
        try {
          var r = No(t);
        } catch (e) {
          throw e === wa ? Ea : e;
        }
      else r = t;
      t = H();
      var i = t.queue,
        a = i.dispatch;
      return (
        n !== t.memoizedState &&
          ((z.flags |= 2048), os(9, { destroy: void 0 }, is.bind(null, i, n), null)),
        [r, a, e]
      );
    }
    function is(e, t) {
      e.action = t;
    }
    function as(e) {
      var t = H(),
        n = B;
      if (n !== null) return rs(t, n, e);
      (H(), (t = t.memoizedState), (n = H()));
      var r = n.queue.dispatch;
      return ((n.memoizedState = e), [t, r, !1]);
    }
    function os(e, t, n, r) {
      return (
        (e = { tag: e, create: n, deps: r, inst: t, next: null }),
        (t = z.updateQueue),
        t === null && ((t = Mo()), (z.updateQueue = t)),
        (n = t.lastEffect),
        n === null
          ? (t.lastEffect = e.next = e)
          : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e)),
        e
      );
    }
    function ss() {
      return H().memoizedState;
    }
    function cs(e, t, n, r) {
      var i = jo();
      ((z.flags |= e),
        (i.memoizedState = os(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r)));
    }
    function ls(e, t, n, r) {
      var i = H();
      r = r === void 0 ? null : r;
      var a = i.memoizedState.inst;
      B !== null && r !== null && Co(r, B.memoizedState.deps)
        ? (i.memoizedState = os(t, a, n, r))
        : ((z.flags |= e), (i.memoizedState = os(1 | t, a, n, r)));
    }
    function us(e, t) {
      cs(8390656, 8, e, t);
    }
    function ds(e, t) {
      ls(2048, 8, e, t);
    }
    function fs(e) {
      z.flags |= 4;
      var t = z.updateQueue;
      if (t === null) ((t = Mo()), (z.updateQueue = t), (t.events = [e]));
      else {
        var n = t.events;
        n === null ? (t.events = [e]) : n.push(e);
      }
    }
    function ps(e) {
      var t = H().memoizedState;
      return (
        fs({ ref: t, nextImpl: e }),
        function () {
          if (G & 2) throw Error(o(440));
          return t.impl.apply(void 0, arguments);
        }
      );
    }
    function ms(e, t) {
      return ls(4, 2, e, t);
    }
    function hs(e, t) {
      return ls(4, 4, e, t);
    }
    function gs(e, t) {
      if (typeof t == `function`) {
        e = e();
        var n = t(e);
        return function () {
          typeof n == `function` ? n() : t(null);
        };
      }
      if (t != null)
        return (
          (e = e()),
          (t.current = e),
          function () {
            t.current = null;
          }
        );
    }
    function _s(e, t, n) {
      ((n = n == null ? null : n.concat([e])), ls(4, 4, gs.bind(null, t, e), n));
    }
    function vs() {}
    function ys(e, t) {
      var n = H();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      return t !== null && Co(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
    }
    function bs(e, t) {
      var n = H();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      if (t !== null && Co(t, r[1])) return r[0];
      if (((r = e()), vo)) {
        We(!0);
        try {
          e();
        } finally {
          We(!1);
        }
      }
      return ((n.memoizedState = [r, t]), r);
    }
    function xs(e, t, n) {
      return n === void 0 || (mo & 1073741824 && !(J & 261930))
        ? (e.memoizedState = t)
        : ((e.memoizedState = n), (e = mu()), (z.lanes |= e), (Gl |= e), n);
    }
    function Ss(e, t, n, r) {
      return Tr(n, t)
        ? n
        : eo.current === null
          ? !(mo & 42) || (mo & 1073741824 && !(J & 261930))
            ? ((ic = !0), (e.memoizedState = n))
            : ((e = mu()), (z.lanes |= e), (Gl |= e), t)
          : ((e = xs(e, n, r)), Tr(e, t) || (ic = !0), e);
    }
    function Cs(e, t, n, r, i) {
      var a = D.p;
      D.p = a !== 0 && 8 > a ? a : 8;
      var o = E.T,
        s = {};
      ((E.T = s), Fs(e, !1, t, n));
      try {
        var c = i(),
          l = E.S;
        (l !== null && l(s, c),
          typeof c == `object` && c && typeof c.then == `function`
            ? Ps(e, t, va(c, r), pu(e))
            : Ps(e, t, r, pu(e)));
      } catch (n) {
        Ps(e, t, { then: function () {}, status: `rejected`, reason: n }, pu());
      } finally {
        ((D.p = a), o !== null && s.types !== null && (o.types = s.types), (E.T = o));
      }
    }
    function ws() {}
    function Ts(e, t, n, r) {
      if (e.tag !== 5) throw Error(o(476));
      var i = Es(e).queue;
      Cs(
        e,
        i,
        t,
        ue,
        n === null
          ? ws
          : function () {
              return (Ds(e), n(r));
            },
      );
    }
    function Es(e) {
      var t = e.memoizedState;
      if (t !== null) return t;
      t = {
        memoizedState: ue,
        baseState: ue,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Io,
          lastRenderedState: ue,
        },
        next: null,
      };
      var n = {};
      return (
        (t.next = {
          memoizedState: n,
          baseState: n,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Io,
            lastRenderedState: n,
          },
          next: null,
        }),
        (e.memoizedState = t),
        (e = e.alternate),
        e !== null && (e.memoizedState = t),
        t
      );
    }
    function Ds(e) {
      var t = Es(e);
      (t.next === null && (t = e.alternate.memoizedState), Ps(e, t.next.queue, {}, pu()));
    }
    function Os() {
      return ra(Qf);
    }
    function ks() {
      return H().memoizedState;
    }
    function As() {
      return H().memoizedState;
    }
    function js(e) {
      for (var t = e.return; t !== null; ) {
        switch (t.tag) {
          case 24:
          case 3:
            var n = pu();
            e = Ga(n);
            var r = Ka(t, e, n);
            (r !== null && (hu(r, t, n), qa(r, t, n)), (t = { cache: ua() }), (e.payload = t));
            return;
        }
        t = t.return;
      }
    }
    function Ms(e, t, n) {
      var r = pu();
      ((n = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      }),
        Is(e) ? Ls(t, n) : ((n = ai(e, t, n, r)), n !== null && (hu(n, e, r), Rs(n, t, r))));
    }
    function Ns(e, t, n) {
      Ps(e, t, n, pu());
    }
    function Ps(e, t, n, r) {
      var i = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      };
      if (Is(e)) Ls(t, i);
      else {
        var a = e.alternate;
        if (
          e.lanes === 0 &&
          (a === null || a.lanes === 0) &&
          ((a = t.lastRenderedReducer), a !== null)
        )
          try {
            var o = t.lastRenderedState,
              s = a(o, n);
            if (((i.hasEagerState = !0), (i.eagerState = s), Tr(s, o)))
              return (ii(e, t, i, 0), K === null && ri(), !1);
          } catch {}
        if (((n = ai(e, t, i, r)), n !== null)) return (hu(n, e, r), Rs(n, t, r), !0);
      }
      return !1;
    }
    function Fs(e, t, n, r) {
      if (
        ((r = {
          lane: 2,
          revertLane: dd(),
          gesture: null,
          action: r,
          hasEagerState: !1,
          eagerState: null,
          next: null,
        }),
        Is(e))
      ) {
        if (t) throw Error(o(479));
      } else ((t = ai(e, n, r, 2)), t !== null && hu(t, e, 2));
    }
    function Is(e) {
      var t = e.alternate;
      return e === z || (t !== null && t === z);
    }
    function Ls(e, t) {
      _o = go = !0;
      var n = e.pending;
      (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t));
    }
    function Rs(e, t, n) {
      if (n & 4194048) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), st(e, n));
      }
    }
    var zs = {
      readContext: ra,
      use: Po,
      useCallback: V,
      useContext: V,
      useEffect: V,
      useImperativeHandle: V,
      useLayoutEffect: V,
      useInsertionEffect: V,
      useMemo: V,
      useReducer: V,
      useRef: V,
      useState: V,
      useDebugValue: V,
      useDeferredValue: V,
      useTransition: V,
      useSyncExternalStore: V,
      useId: V,
      useHostTransitionStatus: V,
      useFormState: V,
      useActionState: V,
      useOptimistic: V,
      useMemoCache: V,
      useCacheRefresh: V,
    };
    zs.useEffectEvent = V;
    var Bs = {
        readContext: ra,
        use: Po,
        useCallback: function (e, t) {
          return ((jo().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: ra,
        useEffect: us,
        useImperativeHandle: function (e, t, n) {
          ((n = n == null ? null : n.concat([e])), cs(4194308, 4, gs.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
          return cs(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
          cs(4, 2, e, t);
        },
        useMemo: function (e, t) {
          var n = jo();
          t = t === void 0 ? null : t;
          var r = e();
          if (vo) {
            We(!0);
            try {
              e();
            } finally {
              We(!1);
            }
          }
          return ((n.memoizedState = [r, t]), r);
        },
        useReducer: function (e, t, n) {
          var r = jo();
          if (n !== void 0) {
            var i = n(t);
            if (vo) {
              We(!0);
              try {
                n(t);
              } finally {
                We(!1);
              }
            }
          } else i = t;
          return (
            (r.memoizedState = r.baseState = i),
            (e = {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: e,
              lastRenderedState: i,
            }),
            (r.queue = e),
            (e = e.dispatch = Ms.bind(null, z, e)),
            [r.memoizedState, e]
          );
        },
        useRef: function (e) {
          var t = jo();
          return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: function (e) {
          e = Ko(e);
          var t = e.queue,
            n = Ns.bind(null, z, t);
          return ((t.dispatch = n), [e.memoizedState, n]);
        },
        useDebugValue: vs,
        useDeferredValue: function (e, t) {
          return xs(jo(), e, t);
        },
        useTransition: function () {
          var e = Ko(!1);
          return ((e = Cs.bind(null, z, e.queue, !0, !1)), (jo().memoizedState = e), [!1, e]);
        },
        useSyncExternalStore: function (e, t, n) {
          var r = z,
            i = jo();
          if (L) {
            if (n === void 0) throw Error(o(407));
            n = n();
          } else {
            if (((n = t()), K === null)) throw Error(o(349));
            J & 127 || Vo(r, t, n);
          }
          i.memoizedState = n;
          var a = { value: n, getSnapshot: t };
          return (
            (i.queue = a),
            us(Uo.bind(null, r, a, e), [e]),
            (r.flags |= 2048),
            os(9, { destroy: void 0 }, Ho.bind(null, r, a, n, t), null),
            n
          );
        },
        useId: function () {
          var e = jo(),
            t = K.identifierPrefix;
          if (L) {
            var n = Ai,
              r = ki;
            ((n = (r & ~(1 << (32 - Ge(r) - 1))).toString(32) + n),
              (t = `_` + t + `R_` + n),
              (n = yo++),
              0 < n && (t += `H` + n.toString(32)),
              (t += `_`));
          } else ((n = So++), (t = `_` + t + `r_` + n.toString(32) + `_`));
          return (e.memoizedState = t);
        },
        useHostTransitionStatus: Os,
        useFormState: ts,
        useActionState: ts,
        useOptimistic: function (e) {
          var t = jo();
          t.memoizedState = t.baseState = e;
          var n = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null,
          };
          return ((t.queue = n), (t = Fs.bind(null, z, !0, n)), (n.dispatch = t), [e, t]);
        },
        useMemoCache: Fo,
        useCacheRefresh: function () {
          return (jo().memoizedState = js.bind(null, z));
        },
        useEffectEvent: function (e) {
          var t = jo(),
            n = { impl: e };
          return (
            (t.memoizedState = n),
            function () {
              if (G & 2) throw Error(o(440));
              return n.impl.apply(void 0, arguments);
            }
          );
        },
      },
      Vs = {
        readContext: ra,
        use: Po,
        useCallback: ys,
        useContext: ra,
        useEffect: ds,
        useImperativeHandle: _s,
        useInsertionEffect: ms,
        useLayoutEffect: hs,
        useMemo: bs,
        useReducer: Lo,
        useRef: ss,
        useState: function () {
          return Lo(Io);
        },
        useDebugValue: vs,
        useDeferredValue: function (e, t) {
          return Ss(H(), B.memoizedState, e, t);
        },
        useTransition: function () {
          var e = Lo(Io)[0],
            t = H().memoizedState;
          return [typeof e == `boolean` ? e : No(e), t];
        },
        useSyncExternalStore: Bo,
        useId: ks,
        useHostTransitionStatus: Os,
        useFormState: ns,
        useActionState: ns,
        useOptimistic: function (e, t) {
          return qo(H(), B, e, t);
        },
        useMemoCache: Fo,
        useCacheRefresh: As,
      };
    Vs.useEffectEvent = ps;
    var Hs = {
      readContext: ra,
      use: Po,
      useCallback: ys,
      useContext: ra,
      useEffect: ds,
      useImperativeHandle: _s,
      useInsertionEffect: ms,
      useLayoutEffect: hs,
      useMemo: bs,
      useReducer: zo,
      useRef: ss,
      useState: function () {
        return zo(Io);
      },
      useDebugValue: vs,
      useDeferredValue: function (e, t) {
        var n = H();
        return B === null ? xs(n, e, t) : Ss(n, B.memoizedState, e, t);
      },
      useTransition: function () {
        var e = zo(Io)[0],
          t = H().memoizedState;
        return [typeof e == `boolean` ? e : No(e), t];
      },
      useSyncExternalStore: Bo,
      useId: ks,
      useHostTransitionStatus: Os,
      useFormState: as,
      useActionState: as,
      useOptimistic: function (e, t) {
        var n = H();
        return B === null ? ((n.baseState = e), [e, n.queue.dispatch]) : qo(n, B, e, t);
      },
      useMemoCache: Fo,
      useCacheRefresh: As,
    };
    Hs.useEffectEvent = ps;
    function Us(e, t, n, r) {
      ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : h({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
    }
    var Ws = {
      enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = pu(),
          i = Ga(r);
        ((i.payload = t),
          n != null && (i.callback = n),
          (t = Ka(e, i, r)),
          t !== null && (hu(t, e, r), qa(t, e, r)));
      },
      enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = pu(),
          i = Ga(r);
        ((i.tag = 1),
          (i.payload = t),
          n != null && (i.callback = n),
          (t = Ka(e, i, r)),
          t !== null && (hu(t, e, r), qa(t, e, r)));
      },
      enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = pu(),
          r = Ga(n);
        ((r.tag = 2),
          t != null && (r.callback = t),
          (t = Ka(e, r, n)),
          t !== null && (hu(t, e, n), qa(t, e, n)));
      },
    };
    function Gs(e, t, n, r, i, a, o) {
      return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == `function`
          ? e.shouldComponentUpdate(r, a, o)
          : t.prototype && t.prototype.isPureReactComponent
            ? !Er(n, r) || !Er(i, a)
            : !0
      );
    }
    function Ks(e, t, n, r) {
      ((e = t.state),
        typeof t.componentWillReceiveProps == `function` && t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == `function` &&
          t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && Ws.enqueueReplaceState(t, t.state, null));
    }
    function qs(e, t) {
      var n = t;
      if (`ref` in t) for (var r in ((n = {}), t)) r !== `ref` && (n[r] = t[r]);
      if ((e = e.defaultProps))
        for (var i in (n === t && (n = h({}, n)), e)) n[i] === void 0 && (n[i] = e[i]);
      return n;
    }
    function Js(e) {
      $r(e);
    }
    function Ys(e) {
      console.error(e);
    }
    function Xs(e) {
      $r(e);
    }
    function Zs(e, t) {
      try {
        var n = e.onUncaughtError;
        n(t.value, { componentStack: t.stack });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function Qs(e, t, n) {
      try {
        var r = e.onCaughtError;
        r(n.value, { componentStack: n.stack, errorBoundary: t.tag === 1 ? t.stateNode : null });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function $s(e, t, n) {
      return (
        (n = Ga(n)),
        (n.tag = 3),
        (n.payload = { element: null }),
        (n.callback = function () {
          Zs(e, t);
        }),
        n
      );
    }
    function ec(e) {
      return ((e = Ga(e)), (e.tag = 3), e);
    }
    function tc(e, t, n, r) {
      var i = n.type.getDerivedStateFromError;
      if (typeof i == `function`) {
        var a = r.value;
        ((e.payload = function () {
          return i(a);
        }),
          (e.callback = function () {
            Qs(t, n, r);
          }));
      }
      var o = n.stateNode;
      o !== null &&
        typeof o.componentDidCatch == `function` &&
        (e.callback = function () {
          (Qs(t, n, r),
            typeof i != `function` && (ru === null ? (ru = new Set([this])) : ru.add(this)));
          var e = r.stack;
          this.componentDidCatch(r.value, { componentStack: e === null ? `` : e });
        });
    }
    function nc(e, t, n, r, i) {
      if (((n.flags |= 32768), typeof r == `object` && r && typeof r.then == `function`)) {
        if (((t = n.alternate), t !== null && ea(t, n, i, !0), (n = ao.current), n !== null)) {
          switch (n.tag) {
            case 31:
            case 13:
              return (
                oo === null ? Du() : n.alternate === null && X === 0 && (X = 3),
                (n.flags &= -257),
                (n.flags |= 65536),
                (n.lanes = i),
                r === Da
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null ? (n.updateQueue = new Set([r])) : t.add(r),
                    Gu(e, r, i)),
                !1
              );
            case 22:
              return (
                (n.flags |= 65536),
                r === Da
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null
                      ? ((t = {
                          transitions: null,
                          markerInstances: null,
                          retryQueue: new Set([r]),
                        }),
                        (n.updateQueue = t))
                      : ((n = t.retryQueue), n === null ? (t.retryQueue = new Set([r])) : n.add(r)),
                    Gu(e, r, i)),
                !1
              );
          }
          throw Error(o(435, n.tag));
        }
        return (Gu(e, r, i), Du(), !1);
      }
      if (L)
        return (
          (t = ao.current),
          t === null
            ? (r !== zi && ((t = Error(o(423), { cause: r })), Ki(xi(t, n))),
              (e = e.current.alternate),
              (e.flags |= 65536),
              (i &= -i),
              (e.lanes |= i),
              (r = xi(r, n)),
              (i = $s(e.stateNode, r, i)),
              Ja(e, i),
              X !== 4 && (X = 2))
            : (!(t.flags & 65536) && (t.flags |= 256),
              (t.flags |= 65536),
              (t.lanes = i),
              r !== zi && ((e = Error(o(422), { cause: r })), Ki(xi(e, n)))),
          !1
        );
      var a = Error(o(520), { cause: r });
      if (((a = xi(a, n)), Xl === null ? (Xl = [a]) : Xl.push(a), X !== 4 && (X = 2), t === null))
        return !0;
      ((r = xi(r, n)), (n = t));
      do {
        switch (n.tag) {
          case 3:
            return (
              (n.flags |= 65536),
              (e = i & -i),
              (n.lanes |= e),
              (e = $s(n.stateNode, r, e)),
              Ja(n, e),
              !1
            );
          case 1:
            if (
              ((t = n.type),
              (a = n.stateNode),
              !(n.flags & 128) &&
                (typeof t.getDerivedStateFromError == `function` ||
                  (a !== null &&
                    typeof a.componentDidCatch == `function` &&
                    (ru === null || !ru.has(a)))))
            )
              return (
                (n.flags |= 65536),
                (i &= -i),
                (n.lanes |= i),
                (i = ec(i)),
                tc(i, e, n, r),
                Ja(n, i),
                !1
              );
        }
        n = n.return;
      } while (n !== null);
      return !1;
    }
    var rc = Error(o(461)),
      ic = !1;
    function ac(e, t, n, r) {
      t.child = e === null ? Va(t, null, n, r) : Ba(t, e.child, n, r);
    }
    function oc(e, t, n, r, i) {
      n = n.render;
      var a = t.ref;
      if (`ref` in r) {
        var o = {};
        for (var s in r) s !== `ref` && (o[s] = r[s]);
      } else o = r;
      return (
        na(t),
        (r = wo(e, t, n, o, a, i)),
        (s = Oo()),
        e !== null && !ic
          ? (ko(e, t, i), Ac(e, t, i))
          : (L && s && Ni(t), (t.flags |= 1), ac(e, t, r, i), t.child)
      );
    }
    function sc(e, t, n, r, i) {
      if (e === null) {
        var a = n.type;
        return typeof a == `function` && !fi(a) && a.defaultProps === void 0 && n.compare === null
          ? ((t.tag = 15), (t.type = a), cc(e, t, a, r, i))
          : ((e = hi(n.type, null, r, t, t.mode, i)),
            (e.ref = t.ref),
            (e.return = t),
            (t.child = e));
      }
      if (((a = e.child), !jc(e, i))) {
        var o = a.memoizedProps;
        if (((n = n.compare), (n = n === null ? Er : n), n(o, r) && e.ref === t.ref))
          return Ac(e, t, i);
      }
      return ((t.flags |= 1), (e = pi(a, r)), (e.ref = t.ref), (e.return = t), (t.child = e));
    }
    function cc(e, t, n, r, i) {
      if (e !== null) {
        var a = e.memoizedProps;
        if (Er(a, r) && e.ref === t.ref)
          if (((ic = !1), (t.pendingProps = r = a), jc(e, i))) e.flags & 131072 && (ic = !0);
          else return ((t.lanes = e.lanes), Ac(e, t, i));
      }
      return gc(e, t, n, r, i);
    }
    function lc(e, t, n, r) {
      var i = r.children,
        a = e === null ? null : e.memoizedState;
      if (
        (e === null &&
          t.stateNode === null &&
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        r.mode === `hidden`)
      ) {
        if (t.flags & 128) {
          if (((a = a === null ? n : a.baseLanes | n), e !== null)) {
            for (r = t.child = e.child, i = 0; r !== null; )
              ((i = i | r.lanes | r.childLanes), (r = r.sibling));
            r = i & ~a;
          } else ((r = 0), (t.child = null));
          return dc(e, t, a, n, r);
        }
        if (n & 536870912)
          ((t.memoizedState = { baseLanes: 0, cachePool: null }),
            e !== null && Sa(t, a === null ? null : a.cachePool),
            a === null ? ro() : no(t, a),
            lo(t));
        else return ((r = t.lanes = 536870912), dc(e, t, a === null ? n : a.baseLanes | n, n, r));
      } else
        a === null
          ? (e !== null && Sa(t, null), ro(), uo(t))
          : (Sa(t, a.cachePool), no(t, a), uo(t), (t.memoizedState = null));
      return (ac(e, t, i, n), t.child);
    }
    function uc(e, t) {
      return (
        (e !== null && e.tag === 22) ||
          t.stateNode !== null ||
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        t.sibling
      );
    }
    function dc(e, t, n, r, i) {
      var a = xa();
      return (
        (a = a === null ? null : { parent: la._currentValue, pool: a }),
        (t.memoizedState = { baseLanes: n, cachePool: a }),
        e !== null && Sa(t, null),
        ro(),
        lo(t),
        e !== null && ea(e, t, r, !0),
        (t.childLanes = i),
        null
      );
    }
    function fc(e, t) {
      return (
        (t = Tc({ mode: t.mode, children: t.children }, e.mode)),
        (t.ref = e.ref),
        (e.child = t),
        (t.return = e),
        t
      );
    }
    function pc(e, t, n) {
      return (
        Ba(t, e.child, null, n),
        (e = fc(t, t.pendingProps)),
        (e.flags |= 2),
        fo(t),
        (t.memoizedState = null),
        e
      );
    }
    function mc(e, t, n) {
      var r = t.pendingProps,
        i = (t.flags & 128) != 0;
      if (((t.flags &= -129), e === null)) {
        if (L) {
          if (r.mode === `hidden`) return ((e = fc(t, r)), (t.lanes = 536870912), uc(null, e));
          if (
            (co(t),
            (e = I)
              ? ((e = rf(e, Ri)),
                (e = e !== null && e.data === `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: Oi === null ? null : { id: ki, overflow: Ai },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = vi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Ii = t),
                  (I = null)))
              : (e = null),
            e === null)
          )
            throw Bi(t);
          return ((t.lanes = 536870912), null);
        }
        return fc(t, r);
      }
      var a = e.memoizedState;
      if (a !== null) {
        var s = a.dehydrated;
        if ((co(t), i))
          if (t.flags & 256) ((t.flags &= -257), (t = pc(e, t, n)));
          else if (t.memoizedState !== null) ((t.child = e.child), (t.flags |= 128), (t = null));
          else throw Error(o(558));
        else if ((ic || ea(e, t, n, !1), (i = (n & e.childLanes) !== 0), ic || i)) {
          if (((r = K), r !== null && ((s = ct(r, n)), s !== 0 && s !== a.retryLane)))
            throw ((a.retryLane = s), oi(e, s), hu(r, e, s), rc);
          (Du(), (t = pc(e, t, n)));
        } else
          ((e = a.treeContext),
            (I = cf(s.nextSibling)),
            (Ii = t),
            (L = !0),
            (Li = null),
            (Ri = !1),
            e !== null && Fi(t, e),
            (t = fc(t, r)),
            (t.flags |= 4096));
        return t;
      }
      return (
        (e = pi(e.child, { mode: r.mode, children: r.children })),
        (e.ref = t.ref),
        (t.child = e),
        (e.return = t),
        e
      );
    }
    function hc(e, t) {
      var n = t.ref;
      if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
      else {
        if (typeof n != `function` && typeof n != `object`) throw Error(o(284));
        (e === null || e.ref !== n) && (t.flags |= 4194816);
      }
    }
    function gc(e, t, n, r, i) {
      return (
        na(t),
        (n = wo(e, t, n, r, void 0, i)),
        (r = Oo()),
        e !== null && !ic
          ? (ko(e, t, i), Ac(e, t, i))
          : (L && r && Ni(t), (t.flags |= 1), ac(e, t, n, i), t.child)
      );
    }
    function _c(e, t, n, r, i, a) {
      return (
        na(t),
        (t.updateQueue = null),
        (n = Eo(t, r, n, i)),
        To(e),
        (r = Oo()),
        e !== null && !ic
          ? (ko(e, t, a), Ac(e, t, a))
          : (L && r && Ni(t), (t.flags |= 1), ac(e, t, n, a), t.child)
      );
    }
    function vc(e, t, n, r, i) {
      if ((na(t), t.stateNode === null)) {
        var a = li,
          o = n.contextType;
        (typeof o == `object` && o && (a = ra(o)),
          (a = new n(r, a)),
          (t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null),
          (a.updater = Ws),
          (t.stateNode = a),
          (a._reactInternals = t),
          (a = t.stateNode),
          (a.props = r),
          (a.state = t.memoizedState),
          (a.refs = {}),
          Ua(t),
          (o = n.contextType),
          (a.context = typeof o == `object` && o ? ra(o) : li),
          (a.state = t.memoizedState),
          (o = n.getDerivedStateFromProps),
          typeof o == `function` && (Us(t, n, o, r), (a.state = t.memoizedState)),
          typeof n.getDerivedStateFromProps == `function` ||
            typeof a.getSnapshotBeforeUpdate == `function` ||
            (typeof a.UNSAFE_componentWillMount != `function` &&
              typeof a.componentWillMount != `function`) ||
            ((o = a.state),
            typeof a.componentWillMount == `function` && a.componentWillMount(),
            typeof a.UNSAFE_componentWillMount == `function` && a.UNSAFE_componentWillMount(),
            o !== a.state && Ws.enqueueReplaceState(a, a.state, null),
            Za(t, r, a, i),
            Xa(),
            (a.state = t.memoizedState)),
          typeof a.componentDidMount == `function` && (t.flags |= 4194308),
          (r = !0));
      } else if (e === null) {
        a = t.stateNode;
        var s = t.memoizedProps,
          c = qs(n, s);
        a.props = c;
        var l = a.context,
          u = n.contextType;
        ((o = li), typeof u == `object` && u && (o = ra(u)));
        var d = n.getDerivedStateFromProps;
        ((u = typeof d == `function` || typeof a.getSnapshotBeforeUpdate == `function`),
          (s = t.pendingProps !== s),
          u ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((s || l !== o) && Ks(t, a, r, o)),
          (Ha = !1));
        var f = t.memoizedState;
        ((a.state = f),
          Za(t, r, a, i),
          Xa(),
          (l = t.memoizedState),
          s || f !== l || Ha
            ? (typeof d == `function` && (Us(t, n, d, r), (l = t.memoizedState)),
              (c = Ha || Gs(t, n, c, r, f, l, o))
                ? (u ||
                    (typeof a.UNSAFE_componentWillMount != `function` &&
                      typeof a.componentWillMount != `function`) ||
                    (typeof a.componentWillMount == `function` && a.componentWillMount(),
                    typeof a.UNSAFE_componentWillMount == `function` &&
                      a.UNSAFE_componentWillMount()),
                  typeof a.componentDidMount == `function` && (t.flags |= 4194308))
                : (typeof a.componentDidMount == `function` && (t.flags |= 4194308),
                  (t.memoizedProps = r),
                  (t.memoizedState = l)),
              (a.props = r),
              (a.state = l),
              (a.context = o),
              (r = c))
            : (typeof a.componentDidMount == `function` && (t.flags |= 4194308), (r = !1)));
      } else {
        ((a = t.stateNode),
          Wa(e, t),
          (o = t.memoizedProps),
          (u = qs(n, o)),
          (a.props = u),
          (d = t.pendingProps),
          (f = a.context),
          (l = n.contextType),
          (c = li),
          typeof l == `object` && l && (c = ra(l)),
          (s = n.getDerivedStateFromProps),
          (l = typeof s == `function` || typeof a.getSnapshotBeforeUpdate == `function`) ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((o !== d || f !== c) && Ks(t, a, r, c)),
          (Ha = !1),
          (f = t.memoizedState),
          (a.state = f),
          Za(t, r, a, i),
          Xa());
        var p = t.memoizedState;
        o !== d || f !== p || Ha || (e !== null && e.dependencies !== null && ta(e.dependencies))
          ? (typeof s == `function` && (Us(t, n, s, r), (p = t.memoizedState)),
            (u =
              Ha ||
              Gs(t, n, u, r, f, p, c) ||
              (e !== null && e.dependencies !== null && ta(e.dependencies)))
              ? (l ||
                  (typeof a.UNSAFE_componentWillUpdate != `function` &&
                    typeof a.componentWillUpdate != `function`) ||
                  (typeof a.componentWillUpdate == `function` && a.componentWillUpdate(r, p, c),
                  typeof a.UNSAFE_componentWillUpdate == `function` &&
                    a.UNSAFE_componentWillUpdate(r, p, c)),
                typeof a.componentDidUpdate == `function` && (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate == `function` && (t.flags |= 1024))
              : (typeof a.componentDidUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 1024),
                (t.memoizedProps = r),
                (t.memoizedState = p)),
            (a.props = r),
            (a.state = p),
            (a.context = c),
            (r = u))
          : (typeof a.componentDidUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 4),
            typeof a.getSnapshotBeforeUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 1024),
            (r = !1));
      }
      return (
        (a = r),
        hc(e, t),
        (r = (t.flags & 128) != 0),
        a || r
          ? ((a = t.stateNode),
            (n = r && typeof n.getDerivedStateFromError != `function` ? null : a.render()),
            (t.flags |= 1),
            e !== null && r
              ? ((t.child = Ba(t, e.child, null, i)), (t.child = Ba(t, null, n, i)))
              : ac(e, t, n, i),
            (t.memoizedState = a.state),
            (e = t.child))
          : (e = Ac(e, t, i)),
        e
      );
    }
    function yc(e, t, n, r) {
      return (Wi(), (t.flags |= 256), ac(e, t, n, r), t.child);
    }
    var bc = { dehydrated: null, treeContext: null, retryLane: 0, hydrationErrors: null };
    function xc(e) {
      return { baseLanes: e, cachePool: Ca() };
    }
    function Sc(e, t, n) {
      return ((e = e === null ? 0 : e.childLanes & ~n), t && (e |= Jl), e);
    }
    function Cc(e, t, n) {
      var r = t.pendingProps,
        i = !1,
        a = (t.flags & 128) != 0,
        s;
      if (
        ((s = a) || (s = e !== null && e.memoizedState === null ? !1 : (R.current & 2) != 0),
        s && ((i = !0), (t.flags &= -129)),
        (s = (t.flags & 32) != 0),
        (t.flags &= -33),
        e === null)
      ) {
        if (L) {
          if (
            (i ? so(t) : uo(t),
            (e = I)
              ? ((e = rf(e, Ri)),
                (e = e !== null && e.data !== `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: Oi === null ? null : { id: ki, overflow: Ai },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = vi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Ii = t),
                  (I = null)))
              : (e = null),
            e === null)
          )
            throw Bi(t);
          return (of(e) ? (t.lanes = 32) : (t.lanes = 536870912), null);
        }
        var c = r.children;
        return (
          (r = r.fallback),
          i
            ? (uo(t),
              (i = t.mode),
              (c = Tc({ mode: `hidden`, children: c }, i)),
              (r = gi(r, i, n, null)),
              (c.return = t),
              (r.return = t),
              (c.sibling = r),
              (t.child = c),
              (r = t.child),
              (r.memoizedState = xc(n)),
              (r.childLanes = Sc(e, s, n)),
              (t.memoizedState = bc),
              uc(null, r))
            : (so(t), wc(t, c))
        );
      }
      var l = e.memoizedState;
      if (l !== null && ((c = l.dehydrated), c !== null)) {
        if (a)
          t.flags & 256
            ? (so(t), (t.flags &= -257), (t = Ec(e, t, n)))
            : t.memoizedState === null
              ? (uo(t),
                (c = r.fallback),
                (i = t.mode),
                (r = Tc({ mode: `visible`, children: r.children }, i)),
                (c = gi(c, i, n, null)),
                (c.flags |= 2),
                (r.return = t),
                (c.return = t),
                (r.sibling = c),
                (t.child = r),
                Ba(t, e.child, null, n),
                (r = t.child),
                (r.memoizedState = xc(n)),
                (r.childLanes = Sc(e, s, n)),
                (t.memoizedState = bc),
                (t = uc(null, r)))
              : (uo(t), (t.child = e.child), (t.flags |= 128), (t = null));
        else if ((so(t), of(c))) {
          if (((s = c.nextSibling && c.nextSibling.dataset), s)) var u = s.dgst;
          ((s = u),
            (r = Error(o(419))),
            (r.stack = ``),
            (r.digest = s),
            Ki({ value: r, source: null, stack: null }),
            (t = Ec(e, t, n)));
        } else if ((ic || ea(e, t, n, !1), (s = (n & e.childLanes) !== 0), ic || s)) {
          if (((s = K), s !== null && ((r = ct(s, n)), r !== 0 && r !== l.retryLane)))
            throw ((l.retryLane = r), oi(e, r), hu(s, e, r), rc);
          (af(c) || Du(), (t = Ec(e, t, n)));
        } else
          af(c)
            ? ((t.flags |= 192), (t.child = e.child), (t = null))
            : ((e = l.treeContext),
              (I = cf(c.nextSibling)),
              (Ii = t),
              (L = !0),
              (Li = null),
              (Ri = !1),
              e !== null && Fi(t, e),
              (t = wc(t, r.children)),
              (t.flags |= 4096));
        return t;
      }
      return i
        ? (uo(t),
          (c = r.fallback),
          (i = t.mode),
          (l = e.child),
          (u = l.sibling),
          (r = pi(l, { mode: `hidden`, children: r.children })),
          (r.subtreeFlags = l.subtreeFlags & 65011712),
          u === null ? ((c = gi(c, i, n, null)), (c.flags |= 2)) : (c = pi(u, c)),
          (c.return = t),
          (r.return = t),
          (r.sibling = c),
          (t.child = r),
          uc(null, r),
          (r = t.child),
          (c = e.child.memoizedState),
          c === null
            ? (c = xc(n))
            : ((i = c.cachePool),
              i === null
                ? (i = Ca())
                : ((l = la._currentValue), (i = i.parent === l ? i : { parent: l, pool: l })),
              (c = { baseLanes: c.baseLanes | n, cachePool: i })),
          (r.memoizedState = c),
          (r.childLanes = Sc(e, s, n)),
          (t.memoizedState = bc),
          uc(e.child, r))
        : (so(t),
          (n = e.child),
          (e = n.sibling),
          (n = pi(n, { mode: `visible`, children: r.children })),
          (n.return = t),
          (n.sibling = null),
          e !== null &&
            ((s = t.deletions), s === null ? ((t.deletions = [e]), (t.flags |= 16)) : s.push(e)),
          (t.child = n),
          (t.memoizedState = null),
          n);
    }
    function wc(e, t) {
      return ((t = Tc({ mode: `visible`, children: t }, e.mode)), (t.return = e), (e.child = t));
    }
    function Tc(e, t) {
      return ((e = di(22, e, null, t)), (e.lanes = 0), e);
    }
    function Ec(e, t, n) {
      return (
        Ba(t, e.child, null, n),
        (e = wc(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
      );
    }
    function Dc(e, t, n) {
      e.lanes |= t;
      var r = e.alternate;
      (r !== null && (r.lanes |= t), Qi(e.return, t, n));
    }
    function Oc(e, t, n, r, i, a) {
      var o = e.memoizedState;
      o === null
        ? (e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: r,
            tail: n,
            tailMode: i,
            treeForkCount: a,
          })
        : ((o.isBackwards = t),
          (o.rendering = null),
          (o.renderingStartTime = 0),
          (o.last = r),
          (o.tail = n),
          (o.tailMode = i),
          (o.treeForkCount = a));
    }
    function kc(e, t, n) {
      var r = t.pendingProps,
        i = r.revealOrder,
        a = r.tail;
      r = r.children;
      var o = R.current,
        s = (o & 2) != 0;
      if (
        (s ? ((o = (o & 1) | 2), (t.flags |= 128)) : (o &= 1),
        A(R, o),
        ac(e, t, r, n),
        (r = L ? Ti : 0),
        !s && e !== null && e.flags & 128)
      )
        a: for (e = t.child; e !== null; ) {
          if (e.tag === 13) e.memoizedState !== null && Dc(e, n, t);
          else if (e.tag === 19) Dc(e, n, t);
          else if (e.child !== null) {
            ((e.child.return = e), (e = e.child));
            continue;
          }
          if (e === t) break a;
          for (; e.sibling === null; ) {
            if (e.return === null || e.return === t) break a;
            e = e.return;
          }
          ((e.sibling.return = e.return), (e = e.sibling));
        }
      switch (i) {
        case `forwards`:
          for (n = t.child, i = null; n !== null; )
            ((e = n.alternate), e !== null && po(e) === null && (i = n), (n = n.sibling));
          ((n = i),
            n === null ? ((i = t.child), (t.child = null)) : ((i = n.sibling), (n.sibling = null)),
            Oc(t, !1, i, n, a, r));
          break;
        case `backwards`:
        case `unstable_legacy-backwards`:
          for (n = null, i = t.child, t.child = null; i !== null; ) {
            if (((e = i.alternate), e !== null && po(e) === null)) {
              t.child = i;
              break;
            }
            ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
          }
          Oc(t, !0, n, null, a, r);
          break;
        case `together`:
          Oc(t, !1, null, null, void 0, r);
          break;
        default:
          t.memoizedState = null;
      }
      return t.child;
    }
    function Ac(e, t, n) {
      if (
        (e !== null && (t.dependencies = e.dependencies), (Gl |= t.lanes), (n & t.childLanes) === 0)
      )
        if (e !== null) {
          if ((ea(e, t, n, !1), (n & t.childLanes) === 0)) return null;
        } else return null;
      if (e !== null && t.child !== e.child) throw Error(o(153));
      if (t.child !== null) {
        for (
          e = t.child, n = pi(e, e.pendingProps), t.child = n, n.return = t;
          e.sibling !== null;
        )
          ((e = e.sibling), (n = n.sibling = pi(e, e.pendingProps)), (n.return = t));
        n.sibling = null;
      }
      return t.child;
    }
    function jc(e, t) {
      return (e.lanes & t) === 0 ? ((e = e.dependencies), !!(e !== null && ta(e))) : !0;
    }
    function Mc(e, t, n) {
      switch (t.tag) {
        case 3:
          (_e(t, t.stateNode.containerInfo), Xi(t, la, e.memoizedState.cache), Wi());
          break;
        case 27:
        case 5:
          ye(t);
          break;
        case 4:
          _e(t, t.stateNode.containerInfo);
          break;
        case 10:
          Xi(t, t.type, t.memoizedProps.value);
          break;
        case 31:
          if (t.memoizedState !== null) return ((t.flags |= 128), co(t), null);
          break;
        case 13:
          var r = t.memoizedState;
          if (r !== null)
            return r.dehydrated === null
              ? (n & t.child.childLanes) === 0
                ? (so(t), (e = Ac(e, t, n)), e === null ? null : e.sibling)
                : Cc(e, t, n)
              : (so(t), (t.flags |= 128), null);
          so(t);
          break;
        case 19:
          var i = (e.flags & 128) != 0;
          if (
            ((r = (n & t.childLanes) !== 0), (r ||= (ea(e, t, n, !1), (n & t.childLanes) !== 0)), i)
          ) {
            if (r) return kc(e, t, n);
            t.flags |= 128;
          }
          if (
            ((i = t.memoizedState),
            i !== null && ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
            A(R, R.current),
            r)
          )
            break;
          return null;
        case 22:
          return ((t.lanes = 0), lc(e, t, n, t.pendingProps));
        case 24:
          Xi(t, la, e.memoizedState.cache);
      }
      return Ac(e, t, n);
    }
    function Nc(e, t, n) {
      if (e !== null)
        if (e.memoizedProps !== t.pendingProps) ic = !0;
        else {
          if (!jc(e, n) && !(t.flags & 128)) return ((ic = !1), Mc(e, t, n));
          ic = !!(e.flags & 131072);
        }
      else ((ic = !1), L && t.flags & 1048576 && Mi(t, Ti, t.index));
      switch (((t.lanes = 0), t.tag)) {
        case 16:
          a: {
            var r = t.pendingProps;
            if (((e = Aa(t.elementType)), (t.type = e), typeof e == `function`))
              fi(e)
                ? ((r = qs(e, r)), (t.tag = 1), (t = vc(null, t, e, r, n)))
                : ((t.tag = 0), (t = gc(null, t, e, r, n)));
            else {
              if (e != null) {
                var i = e.$$typeof;
                if (i === ee) {
                  ((t.tag = 11), (t = oc(null, t, e, r, n)));
                  break a;
                } else if (i === ne) {
                  ((t.tag = 14), (t = sc(null, t, e, r, n)));
                  break a;
                }
              }
              throw ((t = ce(e) || e), Error(o(306, t, ``)));
            }
          }
          return t;
        case 0:
          return gc(e, t, t.type, t.pendingProps, n);
        case 1:
          return ((r = t.type), (i = qs(r, t.pendingProps)), vc(e, t, r, i, n));
        case 3:
          a: {
            if ((_e(t, t.stateNode.containerInfo), e === null)) throw Error(o(387));
            r = t.pendingProps;
            var a = t.memoizedState;
            ((i = a.element), Wa(e, t), Za(t, r, null, n));
            var s = t.memoizedState;
            if (
              ((r = s.cache),
              Xi(t, la, r),
              r !== a.cache && $i(t, [la], n, !0),
              Xa(),
              (r = s.element),
              a.isDehydrated)
            )
              if (
                ((a = { element: r, isDehydrated: !1, cache: s.cache }),
                (t.updateQueue.baseState = a),
                (t.memoizedState = a),
                t.flags & 256)
              ) {
                t = yc(e, t, r, n);
                break a;
              } else if (r !== i) {
                ((i = xi(Error(o(424)), t)), Ki(i), (t = yc(e, t, r, n)));
                break a;
              } else {
                switch (((e = t.stateNode.containerInfo), e.nodeType)) {
                  case 9:
                    e = e.body;
                    break;
                  default:
                    e = e.nodeName === `HTML` ? e.ownerDocument.body : e;
                }
                for (
                  I = cf(e.firstChild),
                    Ii = t,
                    L = !0,
                    Li = null,
                    Ri = !0,
                    n = Va(t, null, r, n),
                    t.child = n;
                  n;
                )
                  ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
              }
            else {
              if ((Wi(), r === i)) {
                t = Ac(e, t, n);
                break a;
              }
              ac(e, t, r, n);
            }
            t = t.child;
          }
          return t;
        case 26:
          return (
            hc(e, t),
            e === null
              ? (n = kf(t.type, null, t.pendingProps, null))
                ? (t.memoizedState = n)
                : L ||
                  ((n = t.type),
                  (e = t.pendingProps),
                  (r = Bd(he.current).createElement(n)),
                  (r[j] = t),
                  (r[mt] = e),
                  Pd(r, n, e),
                  N(r),
                  (t.stateNode = r))
              : (t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState)),
            null
          );
        case 27:
          return (
            ye(t),
            e === null &&
              L &&
              ((r = t.stateNode = ff(t.type, t.pendingProps, he.current)),
              (Ii = t),
              (Ri = !0),
              (i = I),
              Zd(t.type) ? ((lf = i), (I = cf(r.firstChild))) : (I = i)),
            ac(e, t, t.pendingProps.children, n),
            hc(e, t),
            e === null && (t.flags |= 4194304),
            t.child
          );
        case 5:
          return (
            e === null &&
              L &&
              ((i = r = I) &&
                ((r = tf(r, t.type, t.pendingProps, Ri)),
                r === null
                  ? (i = !1)
                  : ((t.stateNode = r), (Ii = t), (I = cf(r.firstChild)), (Ri = !1), (i = !0))),
              i || Bi(t)),
            ye(t),
            (i = t.type),
            (a = t.pendingProps),
            (s = e === null ? null : e.memoizedProps),
            (r = a.children),
            Ud(i, a) ? (r = null) : s !== null && Ud(i, s) && (t.flags |= 32),
            t.memoizedState !== null && ((i = wo(e, t, Do, null, null, n)), (Qf._currentValue = i)),
            hc(e, t),
            ac(e, t, r, n),
            t.child
          );
        case 6:
          return (
            e === null &&
              L &&
              ((e = n = I) &&
                ((n = nf(n, t.pendingProps, Ri)),
                n === null ? (e = !1) : ((t.stateNode = n), (Ii = t), (I = null), (e = !0))),
              e || Bi(t)),
            null
          );
        case 13:
          return Cc(e, t, n);
        case 4:
          return (
            _e(t, t.stateNode.containerInfo),
            (r = t.pendingProps),
            e === null ? (t.child = Ba(t, null, r, n)) : ac(e, t, r, n),
            t.child
          );
        case 11:
          return oc(e, t, t.type, t.pendingProps, n);
        case 7:
          return (ac(e, t, t.pendingProps, n), t.child);
        case 8:
          return (ac(e, t, t.pendingProps.children, n), t.child);
        case 12:
          return (ac(e, t, t.pendingProps.children, n), t.child);
        case 10:
          return ((r = t.pendingProps), Xi(t, t.type, r.value), ac(e, t, r.children, n), t.child);
        case 9:
          return (
            (i = t.type._context),
            (r = t.pendingProps.children),
            na(t),
            (i = ra(i)),
            (r = r(i)),
            (t.flags |= 1),
            ac(e, t, r, n),
            t.child
          );
        case 14:
          return sc(e, t, t.type, t.pendingProps, n);
        case 15:
          return cc(e, t, t.type, t.pendingProps, n);
        case 19:
          return kc(e, t, n);
        case 31:
          return mc(e, t, n);
        case 22:
          return lc(e, t, n, t.pendingProps);
        case 24:
          return (
            na(t),
            (r = ra(la)),
            e === null
              ? ((i = xa()),
                i === null &&
                  ((i = K),
                  (a = ua()),
                  (i.pooledCache = a),
                  a.refCount++,
                  a !== null && (i.pooledCacheLanes |= n),
                  (i = a)),
                (t.memoizedState = { parent: r, cache: i }),
                Ua(t),
                Xi(t, la, i))
              : ((e.lanes & n) !== 0 && (Wa(e, t), Za(t, null, null, n), Xa()),
                (i = e.memoizedState),
                (a = t.memoizedState),
                i.parent === r
                  ? ((r = a.cache), Xi(t, la, r), r !== i.cache && $i(t, [la], n, !0))
                  : ((i = { parent: r, cache: r }),
                    (t.memoizedState = i),
                    t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i),
                    Xi(t, la, r))),
            ac(e, t, t.pendingProps.children, n),
            t.child
          );
        case 29:
          throw t.pendingProps;
      }
      throw Error(o(156, t.tag));
    }
    function Pc(e) {
      e.flags |= 4;
    }
    function Fc(e, t, n, r, i) {
      if (((t = (e.mode & 32) != 0) && (t = !1), t)) {
        if (((e.flags |= 16777216), (i & 335544128) === i))
          if (e.stateNode.complete) e.flags |= 8192;
          else if (wu()) e.flags |= 8192;
          else throw ((ja = Da), Ta);
      } else e.flags &= -16777217;
    }
    function Ic(e, t) {
      if (t.type !== `stylesheet` || t.state.loading & 4) e.flags &= -16777217;
      else if (((e.flags |= 16777216), !Wf(t)))
        if (wu()) e.flags |= 8192;
        else throw ((ja = Da), Ta);
    }
    function Lc(e, t) {
      (t !== null && (e.flags |= 4),
        e.flags & 16384 && ((t = e.tag === 22 ? 536870912 : nt()), (e.lanes |= t), (Yl |= t)));
    }
    function Rc(e, t) {
      if (!L)
        switch (e.tailMode) {
          case `hidden`:
            t = e.tail;
            for (var n = null; t !== null; ) (t.alternate !== null && (n = t), (t = t.sibling));
            n === null ? (e.tail = null) : (n.sibling = null);
            break;
          case `collapsed`:
            n = e.tail;
            for (var r = null; n !== null; ) (n.alternate !== null && (r = n), (n = n.sibling));
            r === null
              ? t || e.tail === null
                ? (e.tail = null)
                : (e.tail.sibling = null)
              : (r.sibling = null);
        }
    }
    function U(e) {
      var t = e.alternate !== null && e.alternate.child === e.child,
        n = 0,
        r = 0;
      if (t)
        for (var i = e.child; i !== null; )
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags & 65011712),
            (r |= i.flags & 65011712),
            (i.return = e),
            (i = i.sibling));
      else
        for (i = e.child; i !== null; )
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags),
            (r |= i.flags),
            (i.return = e),
            (i = i.sibling));
      return ((e.subtreeFlags |= r), (e.childLanes = n), t);
    }
    function zc(e, t, n) {
      var r = t.pendingProps;
      switch ((Pi(t), t.tag)) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          return (U(t), null);
        case 1:
          return (U(t), null);
        case 3:
          return (
            (n = t.stateNode),
            (r = null),
            e !== null && (r = e.memoizedState.cache),
            t.memoizedState.cache !== r && (t.flags |= 2048),
            Zi(la),
            ve(),
            n.pendingContext && ((n.context = n.pendingContext), (n.pendingContext = null)),
            (e === null || e.child === null) &&
              (Ui(t)
                ? Pc(t)
                : e === null ||
                  (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                  ((t.flags |= 1024), Gi())),
            U(t),
            null
          );
        case 26:
          var i = t.type,
            a = t.memoizedState;
          return (
            e === null
              ? (Pc(t), a === null ? (U(t), Fc(t, i, null, r, n)) : (U(t), Ic(t, a)))
              : a
                ? a === e.memoizedState
                  ? (U(t), (t.flags &= -16777217))
                  : (Pc(t), U(t), Ic(t, a))
                : ((e = e.memoizedProps), e !== r && Pc(t), U(t), Fc(t, i, e, r, n)),
            null
          );
        case 27:
          if ((be(t), (n = he.current), (i = t.type), e !== null && t.stateNode != null))
            e.memoizedProps !== r && Pc(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(o(166));
              return (U(t), null);
            }
            ((e = pe.current), Ui(t) ? Vi(t, e) : ((e = ff(i, r, n)), (t.stateNode = e), Pc(t)));
          }
          return (U(t), null);
        case 5:
          if ((be(t), (i = t.type), e !== null && t.stateNode != null))
            e.memoizedProps !== r && Pc(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(o(166));
              return (U(t), null);
            }
            if (((a = pe.current), Ui(t))) Vi(t, a);
            else {
              var s = Bd(he.current);
              switch (a) {
                case 1:
                  a = s.createElementNS(`http://www.w3.org/2000/svg`, i);
                  break;
                case 2:
                  a = s.createElementNS(`http://www.w3.org/1998/Math/MathML`, i);
                  break;
                default:
                  switch (i) {
                    case `svg`:
                      a = s.createElementNS(`http://www.w3.org/2000/svg`, i);
                      break;
                    case `math`:
                      a = s.createElementNS(`http://www.w3.org/1998/Math/MathML`, i);
                      break;
                    case `script`:
                      ((a = s.createElement(`div`)),
                        (a.innerHTML = `<script><\/script>`),
                        (a = a.removeChild(a.firstChild)));
                      break;
                    case `select`:
                      ((a =
                        typeof r.is == `string`
                          ? s.createElement(`select`, { is: r.is })
                          : s.createElement(`select`)),
                        r.multiple ? (a.multiple = !0) : r.size && (a.size = r.size));
                      break;
                    default:
                      a =
                        typeof r.is == `string`
                          ? s.createElement(i, { is: r.is })
                          : s.createElement(i);
                  }
              }
              ((a[j] = t), (a[mt] = r));
              a: for (s = t.child; s !== null; ) {
                if (s.tag === 5 || s.tag === 6) a.appendChild(s.stateNode);
                else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
                  ((s.child.return = s), (s = s.child));
                  continue;
                }
                if (s === t) break a;
                for (; s.sibling === null; ) {
                  if (s.return === null || s.return === t) break a;
                  s = s.return;
                }
                ((s.sibling.return = s.return), (s = s.sibling));
              }
              t.stateNode = a;
              a: switch ((Pd(a, i, r), i)) {
                case `button`:
                case `input`:
                case `select`:
                case `textarea`:
                  r = !!r.autoFocus;
                  break a;
                case `img`:
                  r = !0;
                  break a;
                default:
                  r = !1;
              }
              r && Pc(t);
            }
          }
          return (
            U(t), Fc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null
          );
        case 6:
          if (e && t.stateNode != null) e.memoizedProps !== r && Pc(t);
          else {
            if (typeof r != `string` && t.stateNode === null) throw Error(o(166));
            if (((e = he.current), Ui(t))) {
              if (((e = t.stateNode), (n = t.memoizedProps), (r = null), (i = Ii), i !== null))
                switch (i.tag) {
                  case 27:
                  case 5:
                    r = i.memoizedProps;
                }
              ((e[j] = t),
                (e = !!(
                  e.nodeValue === n ||
                  (r !== null && !0 === r.suppressHydrationWarning) ||
                  Md(e.nodeValue, n)
                )),
                e || Bi(t, !0));
            } else ((e = Bd(e).createTextNode(r)), (e[j] = t), (t.stateNode = e));
          }
          return (U(t), null);
        case 31:
          if (((n = t.memoizedState), e === null || e.memoizedState !== null)) {
            if (((r = Ui(t)), n !== null)) {
              if (e === null) {
                if (!r) throw Error(o(318));
                if (((e = t.memoizedState), (e = e === null ? null : e.dehydrated), !e))
                  throw Error(o(557));
                e[j] = t;
              } else (Wi(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
              (U(t), (e = !1));
            } else
              ((n = Gi()),
                e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n),
                (e = !0));
            if (!e) return t.flags & 256 ? (fo(t), t) : (fo(t), null);
            if (t.flags & 128) throw Error(o(558));
          }
          return (U(t), null);
        case 13:
          if (
            ((r = t.memoizedState),
            e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
          ) {
            if (((i = Ui(t)), r !== null && r.dehydrated !== null)) {
              if (e === null) {
                if (!i) throw Error(o(318));
                if (((i = t.memoizedState), (i = i === null ? null : i.dehydrated), !i))
                  throw Error(o(317));
                i[j] = t;
              } else (Wi(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4));
              (U(t), (i = !1));
            } else
              ((i = Gi()),
                e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i),
                (i = !0));
            if (!i) return t.flags & 256 ? (fo(t), t) : (fo(t), null);
          }
          return (
            fo(t),
            t.flags & 128
              ? ((t.lanes = n), t)
              : ((n = r !== null),
                (e = e !== null && e.memoizedState !== null),
                n &&
                  ((r = t.child),
                  (i = null),
                  r.alternate !== null &&
                    r.alternate.memoizedState !== null &&
                    r.alternate.memoizedState.cachePool !== null &&
                    (i = r.alternate.memoizedState.cachePool.pool),
                  (a = null),
                  r.memoizedState !== null &&
                    r.memoizedState.cachePool !== null &&
                    (a = r.memoizedState.cachePool.pool),
                  a !== i && (r.flags |= 2048)),
                n !== e && n && (t.child.flags |= 8192),
                Lc(t, t.updateQueue),
                U(t),
                null)
          );
        case 4:
          return (ve(), e === null && Sd(t.stateNode.containerInfo), U(t), null);
        case 10:
          return (Zi(t.type), U(t), null);
        case 19:
          if ((k(R), (r = t.memoizedState), r === null)) return (U(t), null);
          if (((i = (t.flags & 128) != 0), (a = r.rendering), a === null))
            if (i) Rc(r, !1);
            else {
              if (X !== 0 || (e !== null && e.flags & 128))
                for (e = t.child; e !== null; ) {
                  if (((a = po(e)), a !== null)) {
                    for (
                      t.flags |= 128,
                        Rc(r, !1),
                        e = a.updateQueue,
                        t.updateQueue = e,
                        Lc(t, e),
                        t.subtreeFlags = 0,
                        e = n,
                        n = t.child;
                      n !== null;
                    )
                      (mi(n, e), (n = n.sibling));
                    return (A(R, (R.current & 1) | 2), L && ji(t, r.treeForkCount), t.child);
                  }
                  e = e.sibling;
                }
              r.tail !== null &&
                Ne() > tu &&
                ((t.flags |= 128), (i = !0), Rc(r, !1), (t.lanes = 4194304));
            }
          else {
            if (!i)
              if (((e = po(a)), e !== null)) {
                if (
                  ((t.flags |= 128),
                  (i = !0),
                  (e = e.updateQueue),
                  (t.updateQueue = e),
                  Lc(t, e),
                  Rc(r, !0),
                  r.tail === null && r.tailMode === `hidden` && !a.alternate && !L)
                )
                  return (U(t), null);
              } else
                2 * Ne() - r.renderingStartTime > tu &&
                  n !== 536870912 &&
                  ((t.flags |= 128), (i = !0), Rc(r, !1), (t.lanes = 4194304));
            r.isBackwards
              ? ((a.sibling = t.child), (t.child = a))
              : ((e = r.last), e === null ? (t.child = a) : (e.sibling = a), (r.last = a));
          }
          return r.tail === null
            ? (U(t), null)
            : ((e = r.tail),
              (r.rendering = e),
              (r.tail = e.sibling),
              (r.renderingStartTime = Ne()),
              (e.sibling = null),
              (n = R.current),
              A(R, i ? (n & 1) | 2 : n & 1),
              L && ji(t, r.treeForkCount),
              e);
        case 22:
        case 23:
          return (
            fo(t),
            io(),
            (r = t.memoizedState !== null),
            e === null
              ? r && (t.flags |= 8192)
              : (e.memoizedState !== null) !== r && (t.flags |= 8192),
            r
              ? n & 536870912 && !(t.flags & 128) && (U(t), t.subtreeFlags & 6 && (t.flags |= 8192))
              : U(t),
            (n = t.updateQueue),
            n !== null && Lc(t, n.retryQueue),
            (n = null),
            e !== null &&
              e.memoizedState !== null &&
              e.memoizedState.cachePool !== null &&
              (n = e.memoizedState.cachePool.pool),
            (r = null),
            t.memoizedState !== null &&
              t.memoizedState.cachePool !== null &&
              (r = t.memoizedState.cachePool.pool),
            r !== n && (t.flags |= 2048),
            e !== null && k(ba),
            null
          );
        case 24:
          return (
            (n = null),
            e !== null && (n = e.memoizedState.cache),
            t.memoizedState.cache !== n && (t.flags |= 2048),
            Zi(la),
            U(t),
            null
          );
        case 25:
          return null;
        case 30:
          return null;
      }
      throw Error(o(156, t.tag));
    }
    function Bc(e, t) {
      switch ((Pi(t), t.tag)) {
        case 1:
          return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 3:
          return (
            Zi(la),
            ve(),
            (e = t.flags),
            e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 26:
        case 27:
        case 5:
          return (be(t), null);
        case 31:
          if (t.memoizedState !== null) {
            if ((fo(t), t.alternate === null)) throw Error(o(340));
            Wi();
          }
          return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 13:
          if ((fo(t), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
            if (t.alternate === null) throw Error(o(340));
            Wi();
          }
          return ((e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null);
        case 19:
          return (k(R), null);
        case 4:
          return (ve(), null);
        case 10:
          return (Zi(t.type), null);
        case 22:
        case 23:
          return (
            fo(t),
            io(),
            e !== null && k(ba),
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 24:
          return (Zi(la), null);
        case 25:
          return null;
        default:
          return null;
      }
    }
    function Vc(e, t) {
      switch ((Pi(t), t.tag)) {
        case 3:
          (Zi(la), ve());
          break;
        case 26:
        case 27:
        case 5:
          be(t);
          break;
        case 4:
          ve();
          break;
        case 31:
          t.memoizedState !== null && fo(t);
          break;
        case 13:
          fo(t);
          break;
        case 19:
          k(R);
          break;
        case 10:
          Zi(t.type);
          break;
        case 22:
        case 23:
          (fo(t), io(), e !== null && k(ba));
          break;
        case 24:
          Zi(la);
      }
    }
    function Hc(e, t) {
      try {
        var n = t.updateQueue,
          r = n === null ? null : n.lastEffect;
        if (r !== null) {
          var i = r.next;
          n = i;
          do {
            if ((n.tag & e) === e) {
              r = void 0;
              var a = n.create,
                o = n.inst;
              ((r = a()), (o.destroy = r));
            }
            n = n.next;
          } while (n !== i);
        }
      } catch (e) {
        Z(t, t.return, e);
      }
    }
    function Uc(e, t, n) {
      try {
        var r = t.updateQueue,
          i = r === null ? null : r.lastEffect;
        if (i !== null) {
          var a = i.next;
          r = a;
          do {
            if ((r.tag & e) === e) {
              var o = r.inst,
                s = o.destroy;
              if (s !== void 0) {
                ((o.destroy = void 0), (i = t));
                var c = n,
                  l = s;
                try {
                  l();
                } catch (e) {
                  Z(i, c, e);
                }
              }
            }
            r = r.next;
          } while (r !== a);
        }
      } catch (e) {
        Z(t, t.return, e);
      }
    }
    function Wc(e) {
      var t = e.updateQueue;
      if (t !== null) {
        var n = e.stateNode;
        try {
          $a(t, n);
        } catch (t) {
          Z(e, e.return, t);
        }
      }
    }
    function Gc(e, t, n) {
      ((n.props = qs(e.type, e.memoizedProps)), (n.state = e.memoizedState));
      try {
        n.componentWillUnmount();
      } catch (n) {
        Z(e, t, n);
      }
    }
    function Kc(e, t) {
      try {
        var n = e.ref;
        if (n !== null) {
          switch (e.tag) {
            case 26:
            case 27:
            case 5:
              var r = e.stateNode;
              break;
            case 30:
              r = e.stateNode;
              break;
            default:
              r = e.stateNode;
          }
          typeof n == `function` ? (e.refCleanup = n(r)) : (n.current = r);
        }
      } catch (n) {
        Z(e, t, n);
      }
    }
    function qc(e, t) {
      var n = e.ref,
        r = e.refCleanup;
      if (n !== null)
        if (typeof r == `function`)
          try {
            r();
          } catch (n) {
            Z(e, t, n);
          } finally {
            ((e.refCleanup = null), (e = e.alternate), e != null && (e.refCleanup = null));
          }
        else if (typeof n == `function`)
          try {
            n(null);
          } catch (n) {
            Z(e, t, n);
          }
        else n.current = null;
    }
    function Jc(e) {
      var t = e.type,
        n = e.memoizedProps,
        r = e.stateNode;
      try {
        a: switch (t) {
          case `button`:
          case `input`:
          case `select`:
          case `textarea`:
            n.autoFocus && r.focus();
            break a;
          case `img`:
            n.src ? (r.src = n.src) : n.srcSet && (r.srcset = n.srcSet);
        }
      } catch (t) {
        Z(e, e.return, t);
      }
    }
    function Yc(e, t, n) {
      try {
        var r = e.stateNode;
        (Fd(r, e.type, n, t), (r[mt] = t));
      } catch (t) {
        Z(e, e.return, t);
      }
    }
    function Xc(e) {
      return (
        e.tag === 5 || e.tag === 3 || e.tag === 26 || (e.tag === 27 && Zd(e.type)) || e.tag === 4
      );
    }
    function Zc(e) {
      a: for (;;) {
        for (; e.sibling === null; ) {
          if (e.return === null || Xc(e.return)) return null;
          e = e.return;
        }
        for (
          e.sibling.return = e.return, e = e.sibling;
          e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
        ) {
          if ((e.tag === 27 && Zd(e.type)) || e.flags & 2 || e.child === null || e.tag === 4)
            continue a;
          ((e.child.return = e), (e = e.child));
        }
        if (!(e.flags & 2)) return e.stateNode;
      }
    }
    function Qc(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6)
        ((e = e.stateNode),
          t
            ? (n.nodeType === 9
                ? n.body
                : n.nodeName === `HTML`
                  ? n.ownerDocument.body
                  : n
              ).insertBefore(e, t)
            : ((t = n.nodeType === 9 ? n.body : n.nodeName === `HTML` ? n.ownerDocument.body : n),
              t.appendChild(e),
              (n = n._reactRootContainer),
              n != null || t.onclick !== null || (t.onclick = nn)));
      else if (
        r !== 4 &&
        (r === 27 && Zd(e.type) && ((n = e.stateNode), (t = null)), (e = e.child), e !== null)
      )
        for (Qc(e, t, n), e = e.sibling; e !== null; ) (Qc(e, t, n), (e = e.sibling));
    }
    function $c(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6) ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
      else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode), (e = e.child), e !== null))
        for ($c(e, t, n), e = e.sibling; e !== null; ) ($c(e, t, n), (e = e.sibling));
    }
    function el(e) {
      var t = e.stateNode,
        n = e.memoizedProps;
      try {
        for (var r = e.type, i = t.attributes; i.length; ) t.removeAttributeNode(i[0]);
        (Pd(t, r, n), (t[j] = e), (t[mt] = n));
      } catch (t) {
        Z(e, e.return, t);
      }
    }
    var tl = !1,
      nl = !1,
      rl = !1,
      il = typeof WeakSet == `function` ? WeakSet : Set,
      al = null;
    function ol(e, t) {
      if (((e = e.containerInfo), (Rd = sp), (e = Ar(e)), jr(e))) {
        if (`selectionStart` in e) var n = { start: e.selectionStart, end: e.selectionEnd };
        else
          a: {
            n = ((n = e.ownerDocument) && n.defaultView) || window;
            var r = n.getSelection && n.getSelection();
            if (r && r.rangeCount !== 0) {
              n = r.anchorNode;
              var i = r.anchorOffset,
                a = r.focusNode;
              r = r.focusOffset;
              try {
                (n.nodeType, a.nodeType);
              } catch {
                n = null;
                break a;
              }
              var s = 0,
                c = -1,
                l = -1,
                u = 0,
                d = 0,
                f = e,
                p = null;
              b: for (;;) {
                for (
                  var m;
                  f !== n || (i !== 0 && f.nodeType !== 3) || (c = s + i),
                    f !== a || (r !== 0 && f.nodeType !== 3) || (l = s + r),
                    f.nodeType === 3 && (s += f.nodeValue.length),
                    (m = f.firstChild) !== null;
                )
                  ((p = f), (f = m));
                for (;;) {
                  if (f === e) break b;
                  if (
                    (p === n && ++u === i && (c = s),
                    p === a && ++d === r && (l = s),
                    (m = f.nextSibling) !== null)
                  )
                    break;
                  ((f = p), (p = f.parentNode));
                }
                f = m;
              }
              n = c === -1 || l === -1 ? null : { start: c, end: l };
            } else n = null;
          }
        n ||= { start: 0, end: 0 };
      } else n = null;
      for (zd = { focusedElem: e, selectionRange: n }, sp = !1, al = t; al !== null; )
        if (((t = al), (e = t.child), t.subtreeFlags & 1028 && e !== null))
          ((e.return = t), (al = e));
        else
          for (; al !== null; ) {
            switch (((t = al), (a = t.alternate), (e = t.flags), t.tag)) {
              case 0:
                if (e & 4 && ((e = t.updateQueue), (e = e === null ? null : e.events), e !== null))
                  for (n = 0; n < e.length; n++) ((i = e[n]), (i.ref.impl = i.nextImpl));
                break;
              case 11:
              case 15:
                break;
              case 1:
                if (e & 1024 && a !== null) {
                  ((e = void 0),
                    (n = t),
                    (i = a.memoizedProps),
                    (a = a.memoizedState),
                    (r = n.stateNode));
                  try {
                    var h = qs(n.type, i);
                    ((e = r.getSnapshotBeforeUpdate(h, a)),
                      (r.__reactInternalSnapshotBeforeUpdate = e));
                  } catch (e) {
                    Z(n, n.return, e);
                  }
                }
                break;
              case 3:
                if (e & 1024) {
                  if (((e = t.stateNode.containerInfo), (n = e.nodeType), n === 9)) ef(e);
                  else if (n === 1)
                    switch (e.nodeName) {
                      case `HEAD`:
                      case `HTML`:
                      case `BODY`:
                        ef(e);
                        break;
                      default:
                        e.textContent = ``;
                    }
                }
                break;
              case 5:
              case 26:
              case 27:
              case 6:
              case 4:
              case 17:
                break;
              default:
                if (e & 1024) throw Error(o(163));
            }
            if (((e = t.sibling), e !== null)) {
              ((e.return = t.return), (al = e));
              break;
            }
            al = t.return;
          }
    }
    function sl(e, t, n) {
      var r = n.flags;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          (xl(e, n), r & 4 && Hc(5, n));
          break;
        case 1:
          if ((xl(e, n), r & 4))
            if (((e = n.stateNode), t === null))
              try {
                e.componentDidMount();
              } catch (e) {
                Z(n, n.return, e);
              }
            else {
              var i = qs(n.type, t.memoizedProps);
              t = t.memoizedState;
              try {
                e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
              } catch (e) {
                Z(n, n.return, e);
              }
            }
          (r & 64 && Wc(n), r & 512 && Kc(n, n.return));
          break;
        case 3:
          if ((xl(e, n), r & 64 && ((e = n.updateQueue), e !== null))) {
            if (((t = null), n.child !== null))
              switch (n.child.tag) {
                case 27:
                case 5:
                  t = n.child.stateNode;
                  break;
                case 1:
                  t = n.child.stateNode;
              }
            try {
              $a(e, t);
            } catch (e) {
              Z(n, n.return, e);
            }
          }
          break;
        case 27:
          t === null && r & 4 && el(n);
        case 26:
        case 5:
          (xl(e, n), t === null && r & 4 && Jc(n), r & 512 && Kc(n, n.return));
          break;
        case 12:
          xl(e, n);
          break;
        case 31:
          (xl(e, n), r & 4 && fl(e, n));
          break;
        case 13:
          (xl(e, n),
            r & 4 && pl(e, n),
            r & 64 &&
              ((e = n.memoizedState),
              e !== null &&
                ((e = e.dehydrated), e !== null && ((n = Ju.bind(null, n)), sf(e, n)))));
          break;
        case 22:
          if (((r = n.memoizedState !== null || tl), !r)) {
            ((t = (t !== null && t.memoizedState !== null) || nl), (i = tl));
            var a = nl;
            ((tl = r),
              (nl = t) && !a ? Cl(e, n, (n.subtreeFlags & 8772) != 0) : xl(e, n),
              (tl = i),
              (nl = a));
          }
          break;
        case 30:
          break;
        default:
          xl(e, n);
      }
    }
    function cl(e) {
      var t = e.alternate;
      (t !== null && ((e.alternate = null), cl(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 && ((t = e.stateNode), t !== null && bt(t)),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
    }
    var W = null,
      ll = !1;
    function ul(e, t, n) {
      for (n = n.child; n !== null; ) (dl(e, t, n), (n = n.sibling));
    }
    function dl(e, t, n) {
      if (Ue && typeof Ue.onCommitFiberUnmount == `function`)
        try {
          Ue.onCommitFiberUnmount(He, n);
        } catch {}
      switch (n.tag) {
        case 26:
          (nl || qc(n, t),
            ul(e, t, n),
            n.memoizedState
              ? n.memoizedState.count--
              : n.stateNode && ((n = n.stateNode), n.parentNode.removeChild(n)));
          break;
        case 27:
          nl || qc(n, t);
          var r = W,
            i = ll;
          (Zd(n.type) && ((W = n.stateNode), (ll = !1)),
            ul(e, t, n),
            pf(n.stateNode),
            (W = r),
            (ll = i));
          break;
        case 5:
          nl || qc(n, t);
        case 6:
          if (((r = W), (i = ll), (W = null), ul(e, t, n), (W = r), (ll = i), W !== null))
            if (ll)
              try {
                (W.nodeType === 9
                  ? W.body
                  : W.nodeName === `HTML`
                    ? W.ownerDocument.body
                    : W
                ).removeChild(n.stateNode);
              } catch (e) {
                Z(n, t, e);
              }
            else
              try {
                W.removeChild(n.stateNode);
              } catch (e) {
                Z(n, t, e);
              }
          break;
        case 18:
          W !== null &&
            (ll
              ? ((e = W),
                Qd(
                  e.nodeType === 9 ? e.body : e.nodeName === `HTML` ? e.ownerDocument.body : e,
                  n.stateNode,
                ),
                Np(e))
              : Qd(W, n.stateNode));
          break;
        case 4:
          ((r = W),
            (i = ll),
            (W = n.stateNode.containerInfo),
            (ll = !0),
            ul(e, t, n),
            (W = r),
            (ll = i));
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          (Uc(2, n, t), nl || Uc(4, n, t), ul(e, t, n));
          break;
        case 1:
          (nl ||
            (qc(n, t),
            (r = n.stateNode),
            typeof r.componentWillUnmount == `function` && Gc(n, t, r)),
            ul(e, t, n));
          break;
        case 21:
          ul(e, t, n);
          break;
        case 22:
          ((nl = (r = nl) || n.memoizedState !== null), ul(e, t, n), (nl = r));
          break;
        default:
          ul(e, t, n);
      }
    }
    function fl(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate), e !== null && ((e = e.memoizedState), e !== null))
      ) {
        e = e.dehydrated;
        try {
          Np(e);
        } catch (e) {
          Z(t, t.return, e);
        }
      }
    }
    function pl(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate),
        e !== null && ((e = e.memoizedState), e !== null && ((e = e.dehydrated), e !== null)))
      )
        try {
          Np(e);
        } catch (e) {
          Z(t, t.return, e);
        }
    }
    function ml(e) {
      switch (e.tag) {
        case 31:
        case 13:
        case 19:
          var t = e.stateNode;
          return (t === null && (t = e.stateNode = new il()), t);
        case 22:
          return (
            (e = e.stateNode), (t = e._retryCache), t === null && (t = e._retryCache = new il()), t
          );
        default:
          throw Error(o(435, e.tag));
      }
    }
    function hl(e, t) {
      var n = ml(e);
      t.forEach(function (t) {
        if (!n.has(t)) {
          n.add(t);
          var r = Yu.bind(null, e, t);
          t.then(r, r);
        }
      });
    }
    function gl(e, t) {
      var n = t.deletions;
      if (n !== null)
        for (var r = 0; r < n.length; r++) {
          var i = n[r],
            a = e,
            s = t,
            c = s;
          a: for (; c !== null; ) {
            switch (c.tag) {
              case 27:
                if (Zd(c.type)) {
                  ((W = c.stateNode), (ll = !1));
                  break a;
                }
                break;
              case 5:
                ((W = c.stateNode), (ll = !1));
                break a;
              case 3:
              case 4:
                ((W = c.stateNode.containerInfo), (ll = !0));
                break a;
            }
            c = c.return;
          }
          if (W === null) throw Error(o(160));
          (dl(a, s, i),
            (W = null),
            (ll = !1),
            (a = i.alternate),
            a !== null && (a.return = null),
            (i.return = null));
        }
      if (t.subtreeFlags & 13886) for (t = t.child; t !== null; ) (vl(t, e), (t = t.sibling));
    }
    var _l = null;
    function vl(e, t) {
      var n = e.alternate,
        r = e.flags;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (gl(t, e), yl(e), r & 4 && (Uc(3, e, e.return), Hc(3, e), Uc(5, e, e.return)));
          break;
        case 1:
          (gl(t, e),
            yl(e),
            r & 512 && (nl || n === null || qc(n, n.return)),
            r & 64 &&
              tl &&
              ((e = e.updateQueue),
              e !== null &&
                ((r = e.callbacks),
                r !== null &&
                  ((n = e.shared.hiddenCallbacks),
                  (e.shared.hiddenCallbacks = n === null ? r : n.concat(r))))));
          break;
        case 26:
          var i = _l;
          if ((gl(t, e), yl(e), r & 512 && (nl || n === null || qc(n, n.return)), r & 4)) {
            var a = n === null ? null : n.memoizedState;
            if (((r = e.memoizedState), n === null))
              if (r === null)
                if (e.stateNode === null) {
                  a: {
                    ((r = e.type), (n = e.memoizedProps), (i = i.ownerDocument || i));
                    b: switch (r) {
                      case `title`:
                        ((a = i.getElementsByTagName(`title`)[0]),
                          (!a ||
                            a[M] ||
                            a[j] ||
                            a.namespaceURI === `http://www.w3.org/2000/svg` ||
                            a.hasAttribute(`itemprop`)) &&
                            ((a = i.createElement(r)),
                            i.head.insertBefore(a, i.querySelector(`head > title`))),
                          Pd(a, r, n),
                          (a[j] = e),
                          N(a),
                          (r = a));
                        break a;
                      case `link`:
                        var s = Vf(`link`, `href`, i).get(r + (n.href || ``));
                        if (s) {
                          for (var c = 0; c < s.length; c++)
                            if (
                              ((a = s[c]),
                              a.getAttribute(`href`) ===
                                (n.href == null || n.href === `` ? null : n.href) &&
                                a.getAttribute(`rel`) === (n.rel == null ? null : n.rel) &&
                                a.getAttribute(`title`) === (n.title == null ? null : n.title) &&
                                a.getAttribute(`crossorigin`) ===
                                  (n.crossOrigin == null ? null : n.crossOrigin))
                            ) {
                              s.splice(c, 1);
                              break b;
                            }
                        }
                        ((a = i.createElement(r)), Pd(a, r, n), i.head.appendChild(a));
                        break;
                      case `meta`:
                        if ((s = Vf(`meta`, `content`, i).get(r + (n.content || ``)))) {
                          for (c = 0; c < s.length; c++)
                            if (
                              ((a = s[c]),
                              a.getAttribute(`content`) ===
                                (n.content == null ? null : `` + n.content) &&
                                a.getAttribute(`name`) === (n.name == null ? null : n.name) &&
                                a.getAttribute(`property`) ===
                                  (n.property == null ? null : n.property) &&
                                a.getAttribute(`http-equiv`) ===
                                  (n.httpEquiv == null ? null : n.httpEquiv) &&
                                a.getAttribute(`charset`) ===
                                  (n.charSet == null ? null : n.charSet))
                            ) {
                              s.splice(c, 1);
                              break b;
                            }
                        }
                        ((a = i.createElement(r)), Pd(a, r, n), i.head.appendChild(a));
                        break;
                      default:
                        throw Error(o(468, r));
                    }
                    ((a[j] = e), N(a), (r = a));
                  }
                  e.stateNode = r;
                } else Hf(i, e.type, e.stateNode);
              else e.stateNode = If(i, r, e.memoizedProps);
            else
              a === r
                ? r === null && e.stateNode !== null && Yc(e, e.memoizedProps, n.memoizedProps)
                : (a === null
                    ? n.stateNode !== null && ((n = n.stateNode), n.parentNode.removeChild(n))
                    : a.count--,
                  r === null ? Hf(i, e.type, e.stateNode) : If(i, r, e.memoizedProps));
          }
          break;
        case 27:
          (gl(t, e),
            yl(e),
            r & 512 && (nl || n === null || qc(n, n.return)),
            n !== null && r & 4 && Yc(e, e.memoizedProps, n.memoizedProps));
          break;
        case 5:
          if ((gl(t, e), yl(e), r & 512 && (nl || n === null || qc(n, n.return)), e.flags & 32)) {
            i = e.stateNode;
            try {
              Jt(i, ``);
            } catch (t) {
              Z(e, e.return, t);
            }
          }
          (r & 4 &&
            e.stateNode != null &&
            ((i = e.memoizedProps), Yc(e, i, n === null ? i : n.memoizedProps)),
            r & 1024 && (rl = !0));
          break;
        case 6:
          if ((gl(t, e), yl(e), r & 4)) {
            if (e.stateNode === null) throw Error(o(162));
            ((r = e.memoizedProps), (n = e.stateNode));
            try {
              n.nodeValue = r;
            } catch (t) {
              Z(e, e.return, t);
            }
          }
          break;
        case 3:
          if (
            ((Bf = null),
            (i = _l),
            (_l = gf(t.containerInfo)),
            gl(t, e),
            (_l = i),
            yl(e),
            r & 4 && n !== null && n.memoizedState.isDehydrated)
          )
            try {
              Np(t.containerInfo);
            } catch (t) {
              Z(e, e.return, t);
            }
          rl && ((rl = !1), bl(e));
          break;
        case 4:
          ((r = _l), (_l = gf(e.stateNode.containerInfo)), gl(t, e), yl(e), (_l = r));
          break;
        case 12:
          (gl(t, e), yl(e));
          break;
        case 31:
          (gl(t, e),
            yl(e),
            r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), hl(e, r))));
          break;
        case 13:
          (gl(t, e),
            yl(e),
            e.child.flags & 8192 &&
              (e.memoizedState !== null) != (n !== null && n.memoizedState !== null) &&
              ($l = Ne()),
            r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), hl(e, r))));
          break;
        case 22:
          i = e.memoizedState !== null;
          var l = n !== null && n.memoizedState !== null,
            u = tl,
            d = nl;
          if (((tl = u || i), (nl = d || l), gl(t, e), (nl = d), (tl = u), yl(e), r & 8192))
            a: for (
              t = e.stateNode,
                t._visibility = i ? t._visibility & -2 : t._visibility | 1,
                i && (n === null || l || tl || nl || Sl(e)),
                n = null,
                t = e;
              ;
            ) {
              if (t.tag === 5 || t.tag === 26) {
                if (n === null) {
                  l = n = t;
                  try {
                    if (((a = l.stateNode), i))
                      ((s = a.style),
                        typeof s.setProperty == `function`
                          ? s.setProperty(`display`, `none`, `important`)
                          : (s.display = `none`));
                    else {
                      c = l.stateNode;
                      var f = l.memoizedProps.style,
                        p = f != null && f.hasOwnProperty(`display`) ? f.display : null;
                      c.style.display = p == null || typeof p == `boolean` ? `` : (`` + p).trim();
                    }
                  } catch (e) {
                    Z(l, l.return, e);
                  }
                }
              } else if (t.tag === 6) {
                if (n === null) {
                  l = t;
                  try {
                    l.stateNode.nodeValue = i ? `` : l.memoizedProps;
                  } catch (e) {
                    Z(l, l.return, e);
                  }
                }
              } else if (t.tag === 18) {
                if (n === null) {
                  l = t;
                  try {
                    var m = l.stateNode;
                    i ? $d(m, !0) : $d(l.stateNode, !1);
                  } catch (e) {
                    Z(l, l.return, e);
                  }
                }
              } else if (
                ((t.tag !== 22 && t.tag !== 23) || t.memoizedState === null || t === e) &&
                t.child !== null
              ) {
                ((t.child.return = t), (t = t.child));
                continue;
              }
              if (t === e) break a;
              for (; t.sibling === null; ) {
                if (t.return === null || t.return === e) break a;
                (n === t && (n = null), (t = t.return));
              }
              (n === t && (n = null), (t.sibling.return = t.return), (t = t.sibling));
            }
          r & 4 &&
            ((r = e.updateQueue),
            r !== null && ((n = r.retryQueue), n !== null && ((r.retryQueue = null), hl(e, n))));
          break;
        case 19:
          (gl(t, e),
            yl(e),
            r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), hl(e, r))));
          break;
        case 30:
          break;
        case 21:
          break;
        default:
          (gl(t, e), yl(e));
      }
    }
    function yl(e) {
      var t = e.flags;
      if (t & 2) {
        try {
          for (var n, r = e.return; r !== null; ) {
            if (Xc(r)) {
              n = r;
              break;
            }
            r = r.return;
          }
          if (n == null) throw Error(o(160));
          switch (n.tag) {
            case 27:
              var i = n.stateNode;
              $c(e, Zc(e), i);
              break;
            case 5:
              var a = n.stateNode;
              (n.flags & 32 && (Jt(a, ``), (n.flags &= -33)), $c(e, Zc(e), a));
              break;
            case 3:
            case 4:
              var s = n.stateNode.containerInfo;
              Qc(e, Zc(e), s);
              break;
            default:
              throw Error(o(161));
          }
        } catch (t) {
          Z(e, e.return, t);
        }
        e.flags &= -3;
      }
      t & 4096 && (e.flags &= -4097);
    }
    function bl(e) {
      if (e.subtreeFlags & 1024)
        for (e = e.child; e !== null; ) {
          var t = e;
          (bl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), (e = e.sibling));
        }
    }
    function xl(e, t) {
      if (t.subtreeFlags & 8772)
        for (t = t.child; t !== null; ) (sl(e, t.alternate, t), (t = t.sibling));
    }
    function Sl(e) {
      for (e = e.child; e !== null; ) {
        var t = e;
        switch (t.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            (Uc(4, t, t.return), Sl(t));
            break;
          case 1:
            qc(t, t.return);
            var n = t.stateNode;
            (typeof n.componentWillUnmount == `function` && Gc(t, t.return, n), Sl(t));
            break;
          case 27:
            pf(t.stateNode);
          case 26:
          case 5:
            (qc(t, t.return), Sl(t));
            break;
          case 22:
            t.memoizedState === null && Sl(t);
            break;
          case 30:
            Sl(t);
            break;
          default:
            Sl(t);
        }
        e = e.sibling;
      }
    }
    function Cl(e, t, n) {
      for (n &&= (t.subtreeFlags & 8772) != 0, t = t.child; t !== null; ) {
        var r = t.alternate,
          i = e,
          a = t,
          o = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 15:
            (Cl(i, a, n), Hc(4, a));
            break;
          case 1:
            if ((Cl(i, a, n), (r = a), (i = r.stateNode), typeof i.componentDidMount == `function`))
              try {
                i.componentDidMount();
              } catch (e) {
                Z(r, r.return, e);
              }
            if (((r = a), (i = r.updateQueue), i !== null)) {
              var s = r.stateNode;
              try {
                var c = i.shared.hiddenCallbacks;
                if (c !== null)
                  for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Qa(c[i], s);
              } catch (e) {
                Z(r, r.return, e);
              }
            }
            (n && o & 64 && Wc(a), Kc(a, a.return));
            break;
          case 27:
            el(a);
          case 26:
          case 5:
            (Cl(i, a, n), n && r === null && o & 4 && Jc(a), Kc(a, a.return));
            break;
          case 12:
            Cl(i, a, n);
            break;
          case 31:
            (Cl(i, a, n), n && o & 4 && fl(i, a));
            break;
          case 13:
            (Cl(i, a, n), n && o & 4 && pl(i, a));
            break;
          case 22:
            (a.memoizedState === null && Cl(i, a, n), Kc(a, a.return));
            break;
          case 30:
            break;
          default:
            Cl(i, a, n);
        }
        t = t.sibling;
      }
    }
    function wl(e, t) {
      var n = null;
      (e !== null &&
        e.memoizedState !== null &&
        e.memoizedState.cachePool !== null &&
        (n = e.memoizedState.cachePool.pool),
        (e = null),
        t.memoizedState !== null &&
          t.memoizedState.cachePool !== null &&
          (e = t.memoizedState.cachePool.pool),
        e !== n && (e != null && e.refCount++, n != null && da(n)));
    }
    function Tl(e, t) {
      ((e = null),
        t.alternate !== null && (e = t.alternate.memoizedState.cache),
        (t = t.memoizedState.cache),
        t !== e && (t.refCount++, e != null && da(e)));
    }
    function El(e, t, n, r) {
      if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) (Dl(e, t, n, r), (t = t.sibling));
    }
    function Dl(e, t, n, r) {
      var i = t.flags;
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          (El(e, t, n, r), i & 2048 && Hc(9, t));
          break;
        case 1:
          El(e, t, n, r);
          break;
        case 3:
          (El(e, t, n, r),
            i & 2048 &&
              ((e = null),
              t.alternate !== null && (e = t.alternate.memoizedState.cache),
              (t = t.memoizedState.cache),
              t !== e && (t.refCount++, e != null && da(e))));
          break;
        case 12:
          if (i & 2048) {
            (El(e, t, n, r), (e = t.stateNode));
            try {
              var a = t.memoizedProps,
                o = a.id,
                s = a.onPostCommit;
              typeof s == `function` &&
                s(o, t.alternate === null ? `mount` : `update`, e.passiveEffectDuration, -0);
            } catch (e) {
              Z(t, t.return, e);
            }
          } else El(e, t, n, r);
          break;
        case 31:
          El(e, t, n, r);
          break;
        case 13:
          El(e, t, n, r);
          break;
        case 23:
          break;
        case 22:
          ((a = t.stateNode),
            (o = t.alternate),
            t.memoizedState === null
              ? a._visibility & 2
                ? El(e, t, n, r)
                : ((a._visibility |= 2), Ol(e, t, n, r, (t.subtreeFlags & 10256) != 0 || !1))
              : a._visibility & 2
                ? El(e, t, n, r)
                : kl(e, t),
            i & 2048 && wl(o, t));
          break;
        case 24:
          (El(e, t, n, r), i & 2048 && Tl(t.alternate, t));
          break;
        default:
          El(e, t, n, r);
      }
    }
    function Ol(e, t, n, r, i) {
      for (i &&= (t.subtreeFlags & 10256) != 0 || !1, t = t.child; t !== null; ) {
        var a = e,
          o = t,
          s = n,
          c = r,
          l = o.flags;
        switch (o.tag) {
          case 0:
          case 11:
          case 15:
            (Ol(a, o, s, c, i), Hc(8, o));
            break;
          case 23:
            break;
          case 22:
            var u = o.stateNode;
            (o.memoizedState === null
              ? ((u._visibility |= 2), Ol(a, o, s, c, i))
              : u._visibility & 2
                ? Ol(a, o, s, c, i)
                : kl(a, o),
              i && l & 2048 && wl(o.alternate, o));
            break;
          case 24:
            (Ol(a, o, s, c, i), i && l & 2048 && Tl(o.alternate, o));
            break;
          default:
            Ol(a, o, s, c, i);
        }
        t = t.sibling;
      }
    }
    function kl(e, t) {
      if (t.subtreeFlags & 10256)
        for (t = t.child; t !== null; ) {
          var n = e,
            r = t,
            i = r.flags;
          switch (r.tag) {
            case 22:
              (kl(n, r), i & 2048 && wl(r.alternate, r));
              break;
            case 24:
              (kl(n, r), i & 2048 && Tl(r.alternate, r));
              break;
            default:
              kl(n, r);
          }
          t = t.sibling;
        }
    }
    var Al = 8192;
    function jl(e, t, n) {
      if (e.subtreeFlags & Al) for (e = e.child; e !== null; ) (Ml(e, t, n), (e = e.sibling));
    }
    function Ml(e, t, n) {
      switch (e.tag) {
        case 26:
          (jl(e, t, n),
            e.flags & Al &&
              e.memoizedState !== null &&
              Gf(n, _l, e.memoizedState, e.memoizedProps));
          break;
        case 5:
          jl(e, t, n);
          break;
        case 3:
        case 4:
          var r = _l;
          ((_l = gf(e.stateNode.containerInfo)), jl(e, t, n), (_l = r));
          break;
        case 22:
          e.memoizedState === null &&
            ((r = e.alternate),
            r !== null && r.memoizedState !== null
              ? ((r = Al), (Al = 16777216), jl(e, t, n), (Al = r))
              : jl(e, t, n));
          break;
        default:
          jl(e, t, n);
      }
    }
    function Nl(e) {
      var t = e.alternate;
      if (t !== null && ((e = t.child), e !== null)) {
        t.child = null;
        do ((t = e.sibling), (e.sibling = null), (e = t));
        while (e !== null);
      }
    }
    function Pl(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((al = r), Ll(r, e));
          }
        Nl(e);
      }
      if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) (Fl(e), (e = e.sibling));
    }
    function Fl(e) {
      switch (e.tag) {
        case 0:
        case 11:
        case 15:
          (Pl(e), e.flags & 2048 && Uc(9, e, e.return));
          break;
        case 3:
          Pl(e);
          break;
        case 12:
          Pl(e);
          break;
        case 22:
          var t = e.stateNode;
          e.memoizedState !== null &&
          t._visibility & 2 &&
          (e.return === null || e.return.tag !== 13)
            ? ((t._visibility &= -3), Il(e))
            : Pl(e);
          break;
        default:
          Pl(e);
      }
    }
    function Il(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((al = r), Ll(r, e));
          }
        Nl(e);
      }
      for (e = e.child; e !== null; ) {
        switch (((t = e), t.tag)) {
          case 0:
          case 11:
          case 15:
            (Uc(8, t, t.return), Il(t));
            break;
          case 22:
            ((n = t.stateNode), n._visibility & 2 && ((n._visibility &= -3), Il(t)));
            break;
          default:
            Il(t);
        }
        e = e.sibling;
      }
    }
    function Ll(e, t) {
      for (; al !== null; ) {
        var n = al;
        switch (n.tag) {
          case 0:
          case 11:
          case 15:
            Uc(8, n, t);
            break;
          case 23:
          case 22:
            if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
              var r = n.memoizedState.cachePool.pool;
              r != null && r.refCount++;
            }
            break;
          case 24:
            da(n.memoizedState.cache);
        }
        if (((r = n.child), r !== null)) ((r.return = n), (al = r));
        else
          a: for (n = e; al !== null; ) {
            r = al;
            var i = r.sibling,
              a = r.return;
            if ((cl(r), r === n)) {
              al = null;
              break a;
            }
            if (i !== null) {
              ((i.return = a), (al = i));
              break a;
            }
            al = a;
          }
      }
    }
    var Rl = {
        getCacheForType: function (e) {
          var t = ra(la),
            n = t.data.get(e);
          return (n === void 0 && ((n = e()), t.data.set(e, n)), n);
        },
        cacheSignal: function () {
          return ra(la).controller.signal;
        },
      },
      zl = typeof WeakMap == `function` ? WeakMap : Map,
      G = 0,
      K = null,
      q = null,
      J = 0,
      Y = 0,
      Bl = null,
      Vl = !1,
      Hl = !1,
      Ul = !1,
      Wl = 0,
      X = 0,
      Gl = 0,
      Kl = 0,
      ql = 0,
      Jl = 0,
      Yl = 0,
      Xl = null,
      Zl = null,
      Ql = !1,
      $l = 0,
      eu = 0,
      tu = 1 / 0,
      nu = null,
      ru = null,
      iu = 0,
      au = null,
      ou = null,
      su = 0,
      cu = 0,
      lu = null,
      uu = null,
      du = 0,
      fu = null;
    function pu() {
      return G & 2 && J !== 0 ? J & -J : E.T === null ? dt() : dd();
    }
    function mu() {
      if (Jl === 0)
        if (!(J & 536870912) || L) {
          var e = Xe;
          ((Xe <<= 1), !(Xe & 3932160) && (Xe = 262144), (Jl = e));
        } else Jl = 536870912;
      return ((e = ao.current), e !== null && (e.flags |= 32), Jl);
    }
    function hu(e, t, n) {
      (((e === K && (Y === 2 || Y === 9)) || e.cancelPendingCommit !== null) &&
        (Su(e, 0), yu(e, J, Jl, !1)),
        it(e, n),
        (!(G & 2) || e !== K) &&
          (e === K && (!(G & 2) && (Kl |= n), X === 4 && yu(e, J, Jl, !1)), rd(e)));
    }
    function gu(e, t, n) {
      if (G & 6) throw Error(o(327));
      var r = (!n && (t & 127) == 0 && (t & e.expiredLanes) === 0) || et(e, t),
        i = r ? Au(e, t) : Ou(e, t, !0),
        a = r;
      do {
        if (i === 0) {
          Hl && !r && yu(e, t, 0, !1);
          break;
        } else {
          if (((n = e.current.alternate), a && !vu(n))) {
            ((i = Ou(e, t, !1)), (a = !1));
            continue;
          }
          if (i === 2) {
            if (((a = t), e.errorRecoveryDisabledLanes & a)) var s = 0;
            else
              ((s = e.pendingLanes & -536870913),
                (s = s === 0 ? (s & 536870912 ? 536870912 : 0) : s));
            if (s !== 0) {
              t = s;
              a: {
                var c = e;
                i = Xl;
                var l = c.current.memoizedState.isDehydrated;
                if ((l && (Su(c, s).flags |= 256), (s = Ou(c, s, !1)), s !== 2)) {
                  if (Ul && !l) {
                    ((c.errorRecoveryDisabledLanes |= a), (Kl |= a), (i = 4));
                    break a;
                  }
                  ((a = Zl),
                    (Zl = i),
                    a !== null && (Zl === null ? (Zl = a) : Zl.push.apply(Zl, a)));
                }
                i = s;
              }
              if (((a = !1), i !== 2)) continue;
            }
          }
          if (i === 1) {
            (Su(e, 0), yu(e, t, 0, !0));
            break;
          }
          a: {
            switch (((r = e), (a = i), a)) {
              case 0:
              case 1:
                throw Error(o(345));
              case 4:
                if ((t & 4194048) !== t) break;
              case 6:
                yu(r, t, Jl, !Vl);
                break a;
              case 2:
                Zl = null;
                break;
              case 3:
              case 5:
                break;
              default:
                throw Error(o(329));
            }
            if ((t & 62914560) === t && ((i = $l + 300 - Ne()), 10 < i)) {
              if ((yu(r, t, Jl, !Vl), $e(r, 0, !0) !== 0)) break a;
              ((su = t),
                (r.timeoutHandle = Kd(
                  _u.bind(null, r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Vl, a, `Throttled`, -0, 0),
                  i,
                )));
              break a;
            }
            _u(r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Vl, a, null, -0, 0);
          }
        }
        break;
      } while (1);
      rd(e);
    }
    function _u(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
      if (((e.timeoutHandle = -1), (d = t.subtreeFlags), d & 8192 || (d & 16785408) == 16785408)) {
        ((d = {
          stylesheets: null,
          count: 0,
          imgCount: 0,
          imgBytes: 0,
          suspenseyImages: [],
          waitingForImages: !0,
          waitingForViewTransition: !1,
          unsuspend: nn,
        }),
          Ml(t, a, d));
        var m = (a & 62914560) === a ? $l - Ne() : (a & 4194048) === a ? eu - Ne() : 0;
        if (((m = qf(d, m)), m !== null)) {
          ((su = a),
            (e.cancelPendingCommit = m(Lu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p))),
            yu(e, a, o, !l));
          return;
        }
      }
      Lu(e, t, a, n, r, i, o, s, c);
    }
    function vu(e) {
      for (var t = e; ; ) {
        var n = t.tag;
        if (
          (n === 0 || n === 11 || n === 15) &&
          t.flags & 16384 &&
          ((n = t.updateQueue), n !== null && ((n = n.stores), n !== null))
        )
          for (var r = 0; r < n.length; r++) {
            var i = n[r],
              a = i.getSnapshot;
            i = i.value;
            try {
              if (!Tr(a(), i)) return !1;
            } catch {
              return !1;
            }
          }
        if (((n = t.child), t.subtreeFlags & 16384 && n !== null)) ((n.return = t), (t = n));
        else {
          if (t === e) break;
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) return !0;
            t = t.return;
          }
          ((t.sibling.return = t.return), (t = t.sibling));
        }
      }
      return !0;
    }
    function yu(e, t, n, r) {
      ((t &= ~ql),
        (t &= ~Kl),
        (e.suspendedLanes |= t),
        (e.pingedLanes &= ~t),
        r && (e.warmLanes |= t),
        (r = e.expirationTimes));
      for (var i = t; 0 < i; ) {
        var a = 31 - Ge(i),
          o = 1 << a;
        ((r[a] = -1), (i &= ~o));
      }
      n !== 0 && ot(e, n, t);
    }
    function bu() {
      return G & 6 ? !0 : (id(0, !1), !1);
    }
    function xu() {
      if (q !== null) {
        if (Y === 0) var e = q.return;
        else ((e = q), (Yi = Ji = null), Ao(e), (Pa = null), (Fa = 0), (e = q));
        for (; e !== null; ) (Vc(e.alternate, e), (e = e.return));
        q = null;
      }
    }
    function Su(e, t) {
      var n = e.timeoutHandle;
      (n !== -1 && ((e.timeoutHandle = -1), qd(n)),
        (n = e.cancelPendingCommit),
        n !== null && ((e.cancelPendingCommit = null), n()),
        (su = 0),
        xu(),
        (K = e),
        (q = n = pi(e.current, null)),
        (J = t),
        (Y = 0),
        (Bl = null),
        (Vl = !1),
        (Hl = et(e, t)),
        (Ul = !1),
        (Yl = Jl = ql = Kl = Gl = X = 0),
        (Zl = Xl = null),
        (Ql = !1),
        t & 8 && (t |= t & 32));
      var r = e.entangledLanes;
      if (r !== 0)
        for (e = e.entanglements, r &= t; 0 < r; ) {
          var i = 31 - Ge(r),
            a = 1 << i;
          ((t |= e[i]), (r &= ~a));
        }
      return ((Wl = t), ri(), n);
    }
    function Cu(e, t) {
      ((z = null),
        (E.H = zs),
        t === wa || t === Ea
          ? ((t = Ma()), (Y = 3))
          : t === Ta
            ? ((t = Ma()), (Y = 4))
            : (Y = t === rc ? 8 : typeof t == `object` && t && typeof t.then == `function` ? 6 : 1),
        (Bl = t),
        q === null && ((X = 1), Zs(e, xi(t, e.current))));
    }
    function wu() {
      var e = ao.current;
      return e === null
        ? !0
        : (J & 4194048) === J
          ? oo === null
          : (J & 62914560) === J || J & 536870912
            ? e === oo
            : !1;
    }
    function Tu() {
      var e = E.H;
      return ((E.H = zs), e === null ? zs : e);
    }
    function Eu() {
      var e = E.A;
      return ((E.A = Rl), e);
    }
    function Du() {
      ((X = 4),
        Vl || ((J & 4194048) !== J && ao.current !== null) || (Hl = !0),
        (!(Gl & 134217727) && !(Kl & 134217727)) || K === null || yu(K, J, Jl, !1));
    }
    function Ou(e, t, n) {
      var r = G;
      G |= 2;
      var i = Tu(),
        a = Eu();
      ((K !== e || J !== t) && ((nu = null), Su(e, t)), (t = !1));
      var o = X;
      a: do
        try {
          if (Y !== 0 && q !== null) {
            var s = q,
              c = Bl;
            switch (Y) {
              case 8:
                (xu(), (o = 6));
                break a;
              case 3:
              case 2:
              case 9:
              case 6:
                ao.current === null && (t = !0);
                var l = Y;
                if (((Y = 0), (Bl = null), Pu(e, s, c, l), n && Hl)) {
                  o = 0;
                  break a;
                }
                break;
              default:
                ((l = Y), (Y = 0), (Bl = null), Pu(e, s, c, l));
            }
          }
          (ku(), (o = X));
          break;
        } catch (t) {
          Cu(e, t);
        }
      while (1);
      return (
        t && e.shellSuspendCounter++,
        (Yi = Ji = null),
        (G = r),
        (E.H = i),
        (E.A = a),
        q === null && ((K = null), (J = 0), ri()),
        o
      );
    }
    function ku() {
      for (; q !== null; ) Mu(q);
    }
    function Au(e, t) {
      var n = G;
      G |= 2;
      var r = Tu(),
        i = Eu();
      K !== e || J !== t ? ((nu = null), (tu = Ne() + 500), Su(e, t)) : (Hl = et(e, t));
      a: do
        try {
          if (Y !== 0 && q !== null) {
            t = q;
            var a = Bl;
            b: switch (Y) {
              case 1:
                ((Y = 0), (Bl = null), Pu(e, t, a, 1));
                break;
              case 2:
              case 9:
                if (Oa(a)) {
                  ((Y = 0), (Bl = null), Nu(t));
                  break;
                }
                ((t = function () {
                  ((Y !== 2 && Y !== 9) || K !== e || (Y = 7), rd(e));
                }),
                  a.then(t, t));
                break a;
              case 3:
                Y = 7;
                break a;
              case 4:
                Y = 5;
                break a;
              case 7:
                Oa(a) ? ((Y = 0), (Bl = null), Nu(t)) : ((Y = 0), (Bl = null), Pu(e, t, a, 7));
                break;
              case 5:
                var s = null;
                switch (q.tag) {
                  case 26:
                    s = q.memoizedState;
                  case 5:
                  case 27:
                    var c = q;
                    if (s ? Wf(s) : c.stateNode.complete) {
                      ((Y = 0), (Bl = null));
                      var l = c.sibling;
                      if (l !== null) q = l;
                      else {
                        var u = c.return;
                        u === null ? (q = null) : ((q = u), Fu(u));
                      }
                      break b;
                    }
                }
                ((Y = 0), (Bl = null), Pu(e, t, a, 5));
                break;
              case 6:
                ((Y = 0), (Bl = null), Pu(e, t, a, 6));
                break;
              case 8:
                (xu(), (X = 6));
                break a;
              default:
                throw Error(o(462));
            }
          }
          ju();
          break;
        } catch (t) {
          Cu(e, t);
        }
      while (1);
      return (
        (Yi = Ji = null),
        (E.H = r),
        (E.A = i),
        (G = n),
        q === null ? ((K = null), (J = 0), ri(), X) : 0
      );
    }
    function ju() {
      for (; q !== null && !je(); ) Mu(q);
    }
    function Mu(e) {
      var t = Nc(e.alternate, e, Wl);
      ((e.memoizedProps = e.pendingProps), t === null ? Fu(e) : (q = t));
    }
    function Nu(e) {
      var t = e,
        n = t.alternate;
      switch (t.tag) {
        case 15:
        case 0:
          t = _c(n, t, t.pendingProps, t.type, void 0, J);
          break;
        case 11:
          t = _c(n, t, t.pendingProps, t.type.render, t.ref, J);
          break;
        case 5:
          Ao(t);
        default:
          (Vc(n, t), (t = q = mi(t, Wl)), (t = Nc(n, t, Wl)));
      }
      ((e.memoizedProps = e.pendingProps), t === null ? Fu(e) : (q = t));
    }
    function Pu(e, t, n, r) {
      ((Yi = Ji = null), Ao(t), (Pa = null), (Fa = 0));
      var i = t.return;
      try {
        if (nc(e, i, t, n, J)) {
          ((X = 1), Zs(e, xi(n, e.current)), (q = null));
          return;
        }
      } catch (t) {
        if (i !== null) throw ((q = i), t);
        ((X = 1), Zs(e, xi(n, e.current)), (q = null));
        return;
      }
      t.flags & 32768
        ? (L || r === 1
            ? (e = !0)
            : Hl || J & 536870912
              ? (e = !1)
              : ((Vl = e = !0),
                (r === 2 || r === 9 || r === 3 || r === 6) &&
                  ((r = ao.current), r !== null && r.tag === 13 && (r.flags |= 16384))),
          Iu(t, e))
        : Fu(t);
    }
    function Fu(e) {
      var t = e;
      do {
        if (t.flags & 32768) {
          Iu(t, Vl);
          return;
        }
        e = t.return;
        var n = zc(t.alternate, t, Wl);
        if (n !== null) {
          q = n;
          return;
        }
        if (((t = t.sibling), t !== null)) {
          q = t;
          return;
        }
        q = t = e;
      } while (t !== null);
      X === 0 && (X = 5);
    }
    function Iu(e, t) {
      do {
        var n = Bc(e.alternate, e);
        if (n !== null) {
          ((n.flags &= 32767), (q = n));
          return;
        }
        if (
          ((n = e.return),
          n !== null && ((n.flags |= 32768), (n.subtreeFlags = 0), (n.deletions = null)),
          !t && ((e = e.sibling), e !== null))
        ) {
          q = e;
          return;
        }
        q = e = n;
      } while (e !== null);
      ((X = 6), (q = null));
    }
    function Lu(e, t, n, r, i, a, s, c, l) {
      e.cancelPendingCommit = null;
      do Hu();
      while (iu !== 0);
      if (G & 6) throw Error(o(327));
      if (t !== null) {
        if (t === e.current) throw Error(o(177));
        if (
          ((a = t.lanes | t.childLanes),
          (a |= ni),
          at(e, n, a, s, c, l),
          e === K && ((q = K = null), (J = 0)),
          (ou = t),
          (au = e),
          (su = n),
          (cu = a),
          (lu = i),
          (uu = r),
          t.subtreeFlags & 10256 || t.flags & 10256
            ? ((e.callbackNode = null),
              (e.callbackPriority = 0),
              Xu(Le, function () {
                return (Uu(), null);
              }))
            : ((e.callbackNode = null), (e.callbackPriority = 0)),
          (r = (t.flags & 13878) != 0),
          t.subtreeFlags & 13878 || r)
        ) {
          ((r = E.T), (E.T = null), (i = D.p), (D.p = 2), (s = G), (G |= 4));
          try {
            ol(e, t, n);
          } finally {
            ((G = s), (D.p = i), (E.T = r));
          }
        }
        ((iu = 1), Ru(), zu(), Bu());
      }
    }
    function Ru() {
      if (iu === 1) {
        iu = 0;
        var e = au,
          t = ou,
          n = (t.flags & 13878) != 0;
        if (t.subtreeFlags & 13878 || n) {
          ((n = E.T), (E.T = null));
          var r = D.p;
          D.p = 2;
          var i = G;
          G |= 4;
          try {
            vl(t, e);
            var a = zd,
              o = Ar(e.containerInfo),
              s = a.focusedElem,
              c = a.selectionRange;
            if (o !== s && s && s.ownerDocument && kr(s.ownerDocument.documentElement, s)) {
              if (c !== null && jr(s)) {
                var l = c.start,
                  u = c.end;
                if ((u === void 0 && (u = l), `selectionStart` in s))
                  ((s.selectionStart = l), (s.selectionEnd = Math.min(u, s.value.length)));
                else {
                  var d = s.ownerDocument || document,
                    f = (d && d.defaultView) || window;
                  if (f.getSelection) {
                    var p = f.getSelection(),
                      m = s.textContent.length,
                      h = Math.min(c.start, m),
                      g = c.end === void 0 ? h : Math.min(c.end, m);
                    !p.extend && h > g && ((o = g), (g = h), (h = o));
                    var _ = Or(s, h),
                      v = Or(s, g);
                    if (
                      _ &&
                      v &&
                      (p.rangeCount !== 1 ||
                        p.anchorNode !== _.node ||
                        p.anchorOffset !== _.offset ||
                        p.focusNode !== v.node ||
                        p.focusOffset !== v.offset)
                    ) {
                      var y = d.createRange();
                      (y.setStart(_.node, _.offset),
                        p.removeAllRanges(),
                        h > g
                          ? (p.addRange(y), p.extend(v.node, v.offset))
                          : (y.setEnd(v.node, v.offset), p.addRange(y)));
                    }
                  }
                }
              }
              for (d = [], p = s; (p = p.parentNode); )
                p.nodeType === 1 && d.push({ element: p, left: p.scrollLeft, top: p.scrollTop });
              for (typeof s.focus == `function` && s.focus(), s = 0; s < d.length; s++) {
                var b = d[s];
                ((b.element.scrollLeft = b.left), (b.element.scrollTop = b.top));
              }
            }
            ((sp = !!Rd), (zd = Rd = null));
          } finally {
            ((G = i), (D.p = r), (E.T = n));
          }
        }
        ((e.current = t), (iu = 2));
      }
    }
    function zu() {
      if (iu === 2) {
        iu = 0;
        var e = au,
          t = ou,
          n = (t.flags & 8772) != 0;
        if (t.subtreeFlags & 8772 || n) {
          ((n = E.T), (E.T = null));
          var r = D.p;
          D.p = 2;
          var i = G;
          G |= 4;
          try {
            sl(e, t.alternate, t);
          } finally {
            ((G = i), (D.p = r), (E.T = n));
          }
        }
        iu = 3;
      }
    }
    function Bu() {
      if (iu === 4 || iu === 3) {
        ((iu = 0), Me());
        var e = au,
          t = ou,
          n = su,
          r = uu;
        t.subtreeFlags & 10256 || t.flags & 10256
          ? (iu = 5)
          : ((iu = 0), (ou = au = null), Vu(e, e.pendingLanes));
        var i = e.pendingLanes;
        if (
          (i === 0 && (ru = null),
          ut(n),
          (t = t.stateNode),
          Ue && typeof Ue.onCommitFiberRoot == `function`)
        )
          try {
            Ue.onCommitFiberRoot(He, t, void 0, (t.current.flags & 128) == 128);
          } catch {}
        if (r !== null) {
          ((t = E.T), (i = D.p), (D.p = 2), (E.T = null));
          try {
            for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
              var s = r[o];
              a(s.value, { componentStack: s.stack });
            }
          } finally {
            ((E.T = t), (D.p = i));
          }
        }
        (su & 3 && Hu(),
          rd(e),
          (i = e.pendingLanes),
          n & 261930 && i & 42 ? (e === fu ? du++ : ((du = 0), (fu = e))) : (du = 0),
          id(0, !1));
      }
    }
    function Vu(e, t) {
      (e.pooledCacheLanes &= t) === 0 &&
        ((t = e.pooledCache), t != null && ((e.pooledCache = null), da(t)));
    }
    function Hu() {
      return (Ru(), zu(), Bu(), Uu());
    }
    function Uu() {
      if (iu !== 5) return !1;
      var e = au,
        t = cu;
      cu = 0;
      var n = ut(su),
        r = E.T,
        i = D.p;
      try {
        ((D.p = 32 > n ? 32 : n), (E.T = null), (n = lu), (lu = null));
        var a = au,
          s = su;
        if (((iu = 0), (ou = au = null), (su = 0), G & 6)) throw Error(o(331));
        var c = G;
        if (
          ((G |= 4),
          Fl(a.current),
          Dl(a, a.current, s, n),
          (G = c),
          id(0, !1),
          Ue && typeof Ue.onPostCommitFiberRoot == `function`)
        )
          try {
            Ue.onPostCommitFiberRoot(He, a);
          } catch {}
        return !0;
      } finally {
        ((D.p = i), (E.T = r), Vu(e, t));
      }
    }
    function Wu(e, t, n) {
      ((t = xi(n, t)),
        (t = $s(e.stateNode, t, 2)),
        (e = Ka(e, t, 2)),
        e !== null && (it(e, 2), rd(e)));
    }
    function Z(e, t, n) {
      if (e.tag === 3) Wu(e, e, n);
      else
        for (; t !== null; ) {
          if (t.tag === 3) {
            Wu(t, e, n);
            break;
          } else if (t.tag === 1) {
            var r = t.stateNode;
            if (
              typeof t.type.getDerivedStateFromError == `function` ||
              (typeof r.componentDidCatch == `function` && (ru === null || !ru.has(r)))
            ) {
              ((e = xi(n, e)),
                (n = ec(2)),
                (r = Ka(t, n, 2)),
                r !== null && (tc(n, r, t, e), it(r, 2), rd(r)));
              break;
            }
          }
          t = t.return;
        }
    }
    function Gu(e, t, n) {
      var r = e.pingCache;
      if (r === null) {
        r = e.pingCache = new zl();
        var i = new Set();
        r.set(t, i);
      } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
      i.has(n) || ((Ul = !0), i.add(n), (e = Ku.bind(null, e, t, n)), t.then(e, e));
    }
    function Ku(e, t, n) {
      var r = e.pingCache;
      (r !== null && r.delete(t),
        (e.pingedLanes |= e.suspendedLanes & n),
        (e.warmLanes &= ~n),
        K === e &&
          (J & n) === n &&
          (X === 4 || (X === 3 && (J & 62914560) === J && 300 > Ne() - $l)
            ? !(G & 2) && Su(e, 0)
            : (ql |= n),
          Yl === J && (Yl = 0)),
        rd(e));
    }
    function qu(e, t) {
      (t === 0 && (t = nt()), (e = oi(e, t)), e !== null && (it(e, t), rd(e)));
    }
    function Ju(e) {
      var t = e.memoizedState,
        n = 0;
      (t !== null && (n = t.retryLane), qu(e, n));
    }
    function Yu(e, t) {
      var n = 0;
      switch (e.tag) {
        case 31:
        case 13:
          var r = e.stateNode,
            i = e.memoizedState;
          i !== null && (n = i.retryLane);
          break;
        case 19:
          r = e.stateNode;
          break;
        case 22:
          r = e.stateNode._retryCache;
          break;
        default:
          throw Error(o(314));
      }
      (r !== null && r.delete(t), qu(e, n));
    }
    function Xu(e, t) {
      return ke(e, t);
    }
    var Zu = null,
      Qu = null,
      $u = !1,
      ed = !1,
      td = !1,
      nd = 0;
    function rd(e) {
      (e !== Qu && e.next === null && (Qu === null ? (Zu = Qu = e) : (Qu = Qu.next = e)),
        (ed = !0),
        $u || (($u = !0), ud()));
    }
    function id(e, t) {
      if (!td && ed) {
        td = !0;
        do
          for (var n = !1, r = Zu; r !== null; ) {
            if (!t)
              if (e !== 0) {
                var i = r.pendingLanes;
                if (i === 0) var a = 0;
                else {
                  var o = r.suspendedLanes,
                    s = r.pingedLanes;
                  ((a = (1 << (31 - Ge(42 | e) + 1)) - 1),
                    (a &= i & ~(o & ~s)),
                    (a = a & 201326741 ? (a & 201326741) | 1 : a ? a | 2 : 0));
                }
                a !== 0 && ((n = !0), ld(r, a));
              } else
                ((a = J),
                  (a = $e(
                    r,
                    r === K ? a : 0,
                    r.cancelPendingCommit !== null || r.timeoutHandle !== -1,
                  )),
                  !(a & 3) || et(r, a) || ((n = !0), ld(r, a)));
            r = r.next;
          }
        while (n);
        td = !1;
      }
    }
    function ad() {
      od();
    }
    function od() {
      ed = $u = !1;
      var e = 0;
      nd !== 0 && Gd() && (e = nd);
      for (var t = Ne(), n = null, r = Zu; r !== null; ) {
        var i = r.next,
          a = sd(r, t);
        (a === 0
          ? ((r.next = null), n === null ? (Zu = i) : (n.next = i), i === null && (Qu = n))
          : ((n = r), (e !== 0 || a & 3) && (ed = !0)),
          (r = i));
      }
      ((iu !== 0 && iu !== 5) || id(e, !1), nd !== 0 && (nd = 0));
    }
    function sd(e, t) {
      for (
        var n = e.suspendedLanes,
          r = e.pingedLanes,
          i = e.expirationTimes,
          a = e.pendingLanes & -62914561;
        0 < a;
      ) {
        var o = 31 - Ge(a),
          s = 1 << o,
          c = i[o];
        (c === -1
          ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = tt(s, t))
          : c <= t && (e.expiredLanes |= s),
          (a &= ~s));
      }
      if (
        ((t = K),
        (n = J),
        (n = $e(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
        (r = e.callbackNode),
        n === 0 || (e === t && (Y === 2 || Y === 9)) || e.cancelPendingCommit !== null)
      )
        return (
          r !== null && r !== null && Ae(r), (e.callbackNode = null), (e.callbackPriority = 0)
        );
      if (!(n & 3) || et(e, n)) {
        if (((t = n & -n), t === e.callbackPriority)) return t;
        switch ((r !== null && Ae(r), ut(n))) {
          case 2:
          case 8:
            n = Ie;
            break;
          case 32:
            n = Le;
            break;
          case 268435456:
            n = ze;
            break;
          default:
            n = Le;
        }
        return (
          (r = cd.bind(null, e)), (n = ke(n, r)), (e.callbackPriority = t), (e.callbackNode = n), t
        );
      }
      return (
        r !== null && r !== null && Ae(r), (e.callbackPriority = 2), (e.callbackNode = null), 2
      );
    }
    function cd(e, t) {
      if (iu !== 0 && iu !== 5) return ((e.callbackNode = null), (e.callbackPriority = 0), null);
      var n = e.callbackNode;
      if (Hu() && e.callbackNode !== n) return null;
      var r = J;
      return (
        (r = $e(e, e === K ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
        r === 0
          ? null
          : (gu(e, r, t),
            sd(e, Ne()),
            e.callbackNode != null && e.callbackNode === n ? cd.bind(null, e) : null)
      );
    }
    function ld(e, t) {
      if (Hu()) return null;
      gu(e, t, !0);
    }
    function ud() {
      Yd(function () {
        G & 6 ? ke(Fe, ad) : od();
      });
    }
    function dd() {
      if (nd === 0) {
        var e = ma;
        (e === 0 && ((e = Ye), (Ye <<= 1), !(Ye & 261888) && (Ye = 256)), (nd = e));
      }
      return nd;
    }
    function fd(e) {
      return e == null || typeof e == `symbol` || typeof e == `boolean`
        ? null
        : typeof e == `function`
          ? e
          : tn(`` + e);
    }
    function pd(e, t) {
      var n = t.ownerDocument.createElement(`input`);
      return (
        (n.name = t.name),
        (n.value = t.value),
        e.id && n.setAttribute(`form`, e.id),
        t.parentNode.insertBefore(n, t),
        (e = new FormData(e)),
        n.parentNode.removeChild(n),
        e
      );
    }
    function md(e, t, n, r, i) {
      if (t === `submit` && n && n.stateNode === i) {
        var a = fd((i[mt] || null).action),
          o = r.submitter;
        o &&
          ((t = (t = o[mt] || null) ? fd(t.formAction) : o.getAttribute(`formAction`)),
          t !== null && ((a = t), (o = null)));
        var s = new wn(`action`, `action`, null, r, i);
        e.push({
          event: s,
          listeners: [
            {
              instance: null,
              listener: function () {
                if (r.defaultPrevented) {
                  if (nd !== 0) {
                    var e = o ? pd(i, o) : new FormData(i);
                    Ts(n, { pending: !0, data: e, method: i.method, action: a }, null, e);
                  }
                } else
                  typeof a == `function` &&
                    (s.preventDefault(),
                    (e = o ? pd(i, o) : new FormData(i)),
                    Ts(n, { pending: !0, data: e, method: i.method, action: a }, a, e));
              },
              currentTarget: i,
            },
          ],
        });
      }
    }
    for (var hd = 0; hd < Zr.length; hd++) {
      var gd = Zr[hd];
      Qr(gd.toLowerCase(), `on` + (gd[0].toUpperCase() + gd.slice(1)));
    }
    (Qr(Ur, `onAnimationEnd`),
      Qr(Wr, `onAnimationIteration`),
      Qr(Gr, `onAnimationStart`),
      Qr(`dblclick`, `onDoubleClick`),
      Qr(`focusin`, `onFocus`),
      Qr(`focusout`, `onBlur`),
      Qr(Kr, `onTransitionRun`),
      Qr(qr, `onTransitionStart`),
      Qr(Jr, `onTransitionCancel`),
      Qr(Yr, `onTransitionEnd`),
      Ot(`onMouseEnter`, [`mouseout`, `mouseover`]),
      Ot(`onMouseLeave`, [`mouseout`, `mouseover`]),
      Ot(`onPointerEnter`, [`pointerout`, `pointerover`]),
      Ot(`onPointerLeave`, [`pointerout`, `pointerover`]),
      Dt(
        `onChange`,
        `change click focusin focusout input keydown keyup selectionchange`.split(` `),
      ),
      Dt(
        `onSelect`,
        `focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(
          ` `,
        ),
      ),
      Dt(`onBeforeInput`, [`compositionend`, `keypress`, `textInput`, `paste`]),
      Dt(`onCompositionEnd`, `compositionend focusout keydown keypress keyup mousedown`.split(` `)),
      Dt(
        `onCompositionStart`,
        `compositionstart focusout keydown keypress keyup mousedown`.split(` `),
      ),
      Dt(
        `onCompositionUpdate`,
        `compositionupdate focusout keydown keypress keyup mousedown`.split(` `),
      ));
    var _d =
        `abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(
          ` `,
        ),
      vd = new Set(
        `beforetoggle cancel close invalid load scroll scrollend toggle`.split(` `).concat(_d),
      );
    function yd(e, t) {
      t = (t & 4) != 0;
      for (var n = 0; n < e.length; n++) {
        var r = e[n],
          i = r.event;
        r = r.listeners;
        a: {
          var a = void 0;
          if (t)
            for (var o = r.length - 1; 0 <= o; o--) {
              var s = r[o],
                c = s.instance,
                l = s.currentTarget;
              if (((s = s.listener), c !== a && i.isPropagationStopped())) break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                $r(e);
              }
              ((i.currentTarget = null), (a = c));
            }
          else
            for (o = 0; o < r.length; o++) {
              if (
                ((s = r[o]),
                (c = s.instance),
                (l = s.currentTarget),
                (s = s.listener),
                c !== a && i.isPropagationStopped())
              )
                break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                $r(e);
              }
              ((i.currentTarget = null), (a = c));
            }
        }
      }
    }
    function Q(e, t) {
      var n = t[gt];
      n === void 0 && (n = t[gt] = new Set());
      var r = e + `__bubble`;
      n.has(r) || (Cd(t, e, 2, !1), n.add(r));
    }
    function bd(e, t, n) {
      var r = 0;
      (t && (r |= 4), Cd(n, e, r, t));
    }
    var xd = `_reactListening` + Math.random().toString(36).slice(2);
    function Sd(e) {
      if (!e[xd]) {
        ((e[xd] = !0),
          Tt.forEach(function (t) {
            t !== `selectionchange` && (vd.has(t) || bd(t, !1, e), bd(t, !0, e));
          }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[xd] || ((t[xd] = !0), bd(`selectionchange`, !1, t));
      }
    }
    function Cd(e, t, n, r) {
      switch (mp(t)) {
        case 2:
          var i = cp;
          break;
        case 8:
          i = lp;
          break;
        default:
          i = up;
      }
      ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !pn || (t !== `touchstart` && t !== `touchmove` && t !== `wheel`) || (i = !0),
        r
          ? i === void 0
            ? e.addEventListener(t, n, !0)
            : e.addEventListener(t, n, { capture: !0, passive: i })
          : i === void 0
            ? e.addEventListener(t, n, !1)
            : e.addEventListener(t, n, { passive: i }));
    }
    function wd(e, t, n, r, i) {
      var a = r;
      if (!(t & 1) && !(t & 2) && r !== null)
        a: for (;;) {
          if (r === null) return;
          var o = r.tag;
          if (o === 3 || o === 4) {
            var s = r.stateNode.containerInfo;
            if (s === i) break;
            if (o === 4)
              for (o = r.return; o !== null; ) {
                var c = o.tag;
                if ((c === 3 || c === 4) && o.stateNode.containerInfo === i) return;
                o = o.return;
              }
            for (; s !== null; ) {
              if (((o = xt(s)), o === null)) return;
              if (((c = o.tag), c === 5 || c === 6 || c === 26 || c === 27)) {
                r = a = o;
                continue a;
              }
              s = s.parentNode;
            }
          }
          r = r.return;
        }
      un(function () {
        var r = a,
          i = an(n),
          o = [];
        a: {
          var s = Xr.get(e);
          if (s !== void 0) {
            var c = wn,
              u = e;
            switch (e) {
              case `keypress`:
                if (yn(n) === 0) break a;
              case `keydown`:
              case `keyup`:
                c = Hn;
                break;
              case `focusin`:
                ((u = `focus`), (c = Nn));
                break;
              case `focusout`:
                ((u = `blur`), (c = Nn));
                break;
              case `beforeblur`:
              case `afterblur`:
                c = Nn;
                break;
              case `click`:
                if (n.button === 2) break a;
              case `auxclick`:
              case `dblclick`:
              case `mousedown`:
              case `mousemove`:
              case `mouseup`:
              case `mouseout`:
              case `mouseover`:
              case `contextmenu`:
                c = jn;
                break;
              case `drag`:
              case `dragend`:
              case `dragenter`:
              case `dragexit`:
              case `dragleave`:
              case `dragover`:
              case `dragstart`:
              case `drop`:
                c = Mn;
                break;
              case `touchcancel`:
              case `touchend`:
              case `touchmove`:
              case `touchstart`:
                c = Wn;
                break;
              case Ur:
              case Wr:
              case Gr:
                c = Pn;
                break;
              case Yr:
                c = Gn;
                break;
              case `scroll`:
              case `scrollend`:
                c = En;
                break;
              case `wheel`:
                c = Kn;
                break;
              case `copy`:
              case `cut`:
              case `paste`:
                c = Fn;
                break;
              case `gotpointercapture`:
              case `lostpointercapture`:
              case `pointercancel`:
              case `pointerdown`:
              case `pointermove`:
              case `pointerout`:
              case `pointerover`:
              case `pointerup`:
                c = Un;
                break;
              case `toggle`:
              case `beforetoggle`:
                c = qn;
            }
            var d = (t & 4) != 0,
              f = !d && (e === `scroll` || e === `scrollend`),
              p = d ? (s === null ? null : s + `Capture`) : s;
            d = [];
            for (var m = r, h; m !== null; ) {
              var g = m;
              if (
                ((h = g.stateNode),
                (g = g.tag),
                (g !== 5 && g !== 26 && g !== 27) ||
                  h === null ||
                  p === null ||
                  ((g = dn(m, p)), g != null && d.push(Td(m, g, h))),
                f)
              )
                break;
              m = m.return;
            }
            0 < d.length && ((s = new c(s, u, null, n, i)), o.push({ event: s, listeners: d }));
          }
        }
        if (!(t & 7)) {
          a: {
            if (
              ((s = e === `mouseover` || e === `pointerover`),
              (c = e === `mouseout` || e === `pointerout`),
              s && n !== rn && (u = n.relatedTarget || n.fromElement) && (xt(u) || u[ht]))
            )
              break a;
            if (
              (c || s) &&
              ((s =
                i.window === i
                  ? i
                  : (s = i.ownerDocument)
                    ? s.defaultView || s.parentWindow
                    : window),
              c
                ? ((u = n.relatedTarget || n.toElement),
                  (c = r),
                  (u = u ? xt(u) : null),
                  u !== null &&
                    ((f = l(u)), (d = u.tag), u !== f || (d !== 5 && d !== 27 && d !== 6)) &&
                    (u = null))
                : ((c = null), (u = r)),
              c !== u)
            ) {
              if (
                ((d = jn),
                (g = `onMouseLeave`),
                (p = `onMouseEnter`),
                (m = `mouse`),
                (e === `pointerout` || e === `pointerover`) &&
                  ((d = Un), (g = `onPointerLeave`), (p = `onPointerEnter`), (m = `pointer`)),
                (f = c == null ? s : Ct(c)),
                (h = u == null ? s : Ct(u)),
                (s = new d(g, m + `leave`, c, n, i)),
                (s.target = f),
                (s.relatedTarget = h),
                (g = null),
                xt(i) === r &&
                  ((d = new d(p, m + `enter`, u, n, i)),
                  (d.target = h),
                  (d.relatedTarget = f),
                  (g = d)),
                (f = g),
                c && u)
              )
                b: {
                  for (d = Dd, p = c, m = u, h = 0, g = p; g; g = d(g)) h++;
                  g = 0;
                  for (var _ = m; _; _ = d(_)) g++;
                  for (; 0 < h - g; ) ((p = d(p)), h--);
                  for (; 0 < g - h; ) ((m = d(m)), g--);
                  for (; h--; ) {
                    if (p === m || (m !== null && p === m.alternate)) {
                      d = p;
                      break b;
                    }
                    ((p = d(p)), (m = d(m)));
                  }
                  d = null;
                }
              else d = null;
              (c !== null && Od(o, s, c, d, !1), u !== null && f !== null && Od(o, f, u, d, !0));
            }
          }
          a: {
            if (
              ((s = r ? Ct(r) : window),
              (c = s.nodeName && s.nodeName.toLowerCase()),
              c === `select` || (c === `input` && s.type === `file`))
            )
              var v = pr;
            else if (sr(s))
              if (mr) v = Cr;
              else {
                v = xr;
                var y = br;
              }
            else
              ((c = s.nodeName),
                !c || c.toLowerCase() !== `input` || (s.type !== `checkbox` && s.type !== `radio`)
                  ? r && Qt(r.elementType) && (v = pr)
                  : (v = Sr));
            if ((v &&= v(e, r))) {
              cr(o, v, n, i);
              break a;
            }
            (y && y(e, s, r),
              e === `focusout` &&
                r &&
                s.type === `number` &&
                r.memoizedProps.value != null &&
                Wt(s, `number`, s.value));
          }
          switch (((y = r ? Ct(r) : window), e)) {
            case `focusin`:
              (sr(y) || y.contentEditable === `true`) && ((Nr = y), (Pr = r), (Fr = null));
              break;
            case `focusout`:
              Fr = Pr = Nr = null;
              break;
            case `mousedown`:
              Ir = !0;
              break;
            case `contextmenu`:
            case `mouseup`:
            case `dragend`:
              ((Ir = !1), Lr(o, n, i));
              break;
            case `selectionchange`:
              if (Mr) break;
            case `keydown`:
            case `keyup`:
              Lr(o, n, i);
          }
          var b;
          if (Yn)
            b: {
              switch (e) {
                case `compositionstart`:
                  var x = `onCompositionStart`;
                  break b;
                case `compositionend`:
                  x = `onCompositionEnd`;
                  break b;
                case `compositionupdate`:
                  x = `onCompositionUpdate`;
                  break b;
              }
              x = void 0;
            }
          else
            rr
              ? tr(e, n) && (x = `onCompositionEnd`)
              : e === `keydown` && n.keyCode === 229 && (x = `onCompositionStart`);
          (x &&
            (Qn &&
              n.locale !== `ko` &&
              (rr || x !== `onCompositionStart`
                ? x === `onCompositionEnd` && rr && (b = vn())
                : ((hn = i), (gn = `value` in hn ? hn.value : hn.textContent), (rr = !0))),
            (y = Ed(r, x)),
            0 < y.length &&
              ((x = new In(x, e, null, n, i)),
              o.push({ event: x, listeners: y }),
              b ? (x.data = b) : ((b = nr(n)), b !== null && (x.data = b)))),
            (b = Zn ? ir(e, n) : ar(e, n)) &&
              ((x = Ed(r, `onBeforeInput`)),
              0 < x.length &&
                ((y = new In(`onBeforeInput`, `beforeinput`, null, n, i)),
                o.push({ event: y, listeners: x }),
                (y.data = b))),
            md(o, e, r, n, i));
        }
        yd(o, t);
      });
    }
    function Td(e, t, n) {
      return { instance: e, listener: t, currentTarget: n };
    }
    function Ed(e, t) {
      for (var n = t + `Capture`, r = []; e !== null; ) {
        var i = e,
          a = i.stateNode;
        if (
          ((i = i.tag),
          (i !== 5 && i !== 26 && i !== 27) ||
            a === null ||
            ((i = dn(e, n)),
            i != null && r.unshift(Td(e, i, a)),
            (i = dn(e, t)),
            i != null && r.push(Td(e, i, a))),
          e.tag === 3)
        )
          return r;
        e = e.return;
      }
      return [];
    }
    function Dd(e) {
      if (e === null) return null;
      do e = e.return;
      while (e && e.tag !== 5 && e.tag !== 27);
      return e || null;
    }
    function Od(e, t, n, r, i) {
      for (var a = t._reactName, o = []; n !== null && n !== r; ) {
        var s = n,
          c = s.alternate,
          l = s.stateNode;
        if (((s = s.tag), c !== null && c === r)) break;
        ((s !== 5 && s !== 26 && s !== 27) ||
          l === null ||
          ((c = l),
          i
            ? ((l = dn(n, a)), l != null && o.unshift(Td(n, l, c)))
            : i || ((l = dn(n, a)), l != null && o.push(Td(n, l, c)))),
          (n = n.return));
      }
      o.length !== 0 && e.push({ event: t, listeners: o });
    }
    var kd = /\r\n?/g,
      Ad = /\u0000|\uFFFD/g;
    function jd(e) {
      return (typeof e == `string` ? e : `` + e)
        .replace(
          kd,
          `
`,
        )
        .replace(Ad, ``);
    }
    function Md(e, t) {
      return ((t = jd(t)), jd(e) === t);
    }
    function $(e, t, n, r, i, a) {
      switch (n) {
        case `children`:
          typeof r == `string`
            ? t === `body` || (t === `textarea` && r === ``) || Jt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) && t !== `body` && Jt(e, `` + r);
          break;
        case `className`:
          Pt(e, `class`, r);
          break;
        case `tabIndex`:
          Pt(e, `tabindex`, r);
          break;
        case `dir`:
        case `role`:
        case `viewBox`:
        case `width`:
        case `height`:
          Pt(e, n, r);
          break;
        case `style`:
          Zt(e, r, a);
          break;
        case `data`:
          if (t !== `object`) {
            Pt(e, `data`, r);
            break;
          }
        case `src`:
        case `href`:
          if (r === `` && (t !== `a` || n !== `href`)) {
            e.removeAttribute(n);
            break;
          }
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `symbol` ||
            typeof r == `boolean`
          ) {
            e.removeAttribute(n);
            break;
          }
          ((r = tn(`` + r)), e.setAttribute(n, r));
          break;
        case `action`:
        case `formAction`:
          if (typeof r == `function`) {
            e.setAttribute(
              n,
              `javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`,
            );
            break;
          } else
            typeof a == `function` &&
              (n === `formAction`
                ? (t !== `input` && $(e, t, `name`, i.name, i, null),
                  $(e, t, `formEncType`, i.formEncType, i, null),
                  $(e, t, `formMethod`, i.formMethod, i, null),
                  $(e, t, `formTarget`, i.formTarget, i, null))
                : ($(e, t, `encType`, i.encType, i, null),
                  $(e, t, `method`, i.method, i, null),
                  $(e, t, `target`, i.target, i, null)));
          if (r == null || typeof r == `symbol` || typeof r == `boolean`) {
            e.removeAttribute(n);
            break;
          }
          ((r = tn(`` + r)), e.setAttribute(n, r));
          break;
        case `onClick`:
          r != null && (e.onclick = nn);
          break;
        case `onScroll`:
          r != null && Q(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && Q(`scrollend`, e);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(o(61));
            if (((n = r.__html), n != null)) {
              if (i.children != null) throw Error(o(60));
              e.innerHTML = n;
            }
          }
          break;
        case `multiple`:
          e.multiple = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `muted`:
          e.muted = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `defaultValue`:
        case `defaultChecked`:
        case `innerHTML`:
        case `ref`:
          break;
        case `autoFocus`:
          break;
        case `xlinkHref`:
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `boolean` ||
            typeof r == `symbol`
          ) {
            e.removeAttribute(`xlink:href`);
            break;
          }
          ((n = tn(`` + r)), e.setAttributeNS(`http://www.w3.org/1999/xlink`, `xlink:href`, n));
          break;
        case `contentEditable`:
        case `spellCheck`:
        case `draggable`:
        case `value`:
        case `autoReverse`:
        case `externalResourcesRequired`:
        case `focusable`:
        case `preserveAlpha`:
          r != null && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, `` + r)
            : e.removeAttribute(n);
          break;
        case `inert`:
        case `allowFullScreen`:
        case `async`:
        case `autoPlay`:
        case `controls`:
        case `default`:
        case `defer`:
        case `disabled`:
        case `disablePictureInPicture`:
        case `disableRemotePlayback`:
        case `formNoValidate`:
        case `hidden`:
        case `loop`:
        case `noModule`:
        case `noValidate`:
        case `open`:
        case `playsInline`:
        case `readOnly`:
        case `required`:
        case `reversed`:
        case `scoped`:
        case `seamless`:
        case `itemScope`:
          r && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, ``)
            : e.removeAttribute(n);
          break;
        case `capture`:
        case `download`:
          !0 === r
            ? e.setAttribute(n, ``)
            : !1 !== r && r != null && typeof r != `function` && typeof r != `symbol`
              ? e.setAttribute(n, r)
              : e.removeAttribute(n);
          break;
        case `cols`:
        case `rows`:
        case `size`:
        case `span`:
          r != null && typeof r != `function` && typeof r != `symbol` && !isNaN(r) && 1 <= r
            ? e.setAttribute(n, r)
            : e.removeAttribute(n);
          break;
        case `rowSpan`:
        case `start`:
          r == null || typeof r == `function` || typeof r == `symbol` || isNaN(r)
            ? e.removeAttribute(n)
            : e.setAttribute(n, r);
          break;
        case `popover`:
          (Q(`beforetoggle`, e), Q(`toggle`, e), Nt(e, `popover`, r));
          break;
        case `xlinkActuate`:
          Ft(e, `http://www.w3.org/1999/xlink`, `xlink:actuate`, r);
          break;
        case `xlinkArcrole`:
          Ft(e, `http://www.w3.org/1999/xlink`, `xlink:arcrole`, r);
          break;
        case `xlinkRole`:
          Ft(e, `http://www.w3.org/1999/xlink`, `xlink:role`, r);
          break;
        case `xlinkShow`:
          Ft(e, `http://www.w3.org/1999/xlink`, `xlink:show`, r);
          break;
        case `xlinkTitle`:
          Ft(e, `http://www.w3.org/1999/xlink`, `xlink:title`, r);
          break;
        case `xlinkType`:
          Ft(e, `http://www.w3.org/1999/xlink`, `xlink:type`, r);
          break;
        case `xmlBase`:
          Ft(e, `http://www.w3.org/XML/1998/namespace`, `xml:base`, r);
          break;
        case `xmlLang`:
          Ft(e, `http://www.w3.org/XML/1998/namespace`, `xml:lang`, r);
          break;
        case `xmlSpace`:
          Ft(e, `http://www.w3.org/XML/1998/namespace`, `xml:space`, r);
          break;
        case `is`:
          Nt(e, `is`, r);
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          (!(2 < n.length) || (n[0] !== `o` && n[0] !== `O`) || (n[1] !== `n` && n[1] !== `N`)) &&
            ((n = $t.get(n) || n), Nt(e, n, r));
      }
    }
    function Nd(e, t, n, r, i, a) {
      switch (n) {
        case `style`:
          Zt(e, r, a);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(o(61));
            if (((n = r.__html), n != null)) {
              if (i.children != null) throw Error(o(60));
              e.innerHTML = n;
            }
          }
          break;
        case `children`:
          typeof r == `string`
            ? Jt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) && Jt(e, `` + r);
          break;
        case `onScroll`:
          r != null && Q(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && Q(`scrollend`, e);
          break;
        case `onClick`:
          r != null && (e.onclick = nn);
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `innerHTML`:
        case `ref`:
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          if (!Et.hasOwnProperty(n))
            a: {
              if (
                n[0] === `o` &&
                n[1] === `n` &&
                ((i = n.endsWith(`Capture`)),
                (t = n.slice(2, i ? n.length - 7 : void 0)),
                (a = e[mt] || null),
                (a = a == null ? null : a[n]),
                typeof a == `function` && e.removeEventListener(t, a, i),
                typeof r == `function`)
              ) {
                (typeof a != `function` &&
                  a !== null &&
                  (n in e ? (e[n] = null) : e.hasAttribute(n) && e.removeAttribute(n)),
                  e.addEventListener(t, r, i));
                break a;
              }
              n in e ? (e[n] = r) : !0 === r ? e.setAttribute(n, ``) : Nt(e, n, r);
            }
      }
    }
    function Pd(e, t, n) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `img`:
          (Q(`error`, e), Q(`load`, e));
          var r = !1,
            i = !1,
            a;
          for (a in n)
            if (n.hasOwnProperty(a)) {
              var s = n[a];
              if (s != null)
                switch (a) {
                  case `src`:
                    r = !0;
                    break;
                  case `srcSet`:
                    i = !0;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    throw Error(o(137, t));
                  default:
                    $(e, t, a, s, n, null);
                }
            }
          (i && $(e, t, `srcSet`, n.srcSet, n, null), r && $(e, t, `src`, n.src, n, null));
          return;
        case `input`:
          Q(`invalid`, e);
          var c = (a = s = i = null),
            l = null,
            u = null;
          for (r in n)
            if (n.hasOwnProperty(r)) {
              var d = n[r];
              if (d != null)
                switch (r) {
                  case `name`:
                    i = d;
                    break;
                  case `type`:
                    s = d;
                    break;
                  case `checked`:
                    l = d;
                    break;
                  case `defaultChecked`:
                    u = d;
                    break;
                  case `value`:
                    a = d;
                    break;
                  case `defaultValue`:
                    c = d;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    if (d != null) throw Error(o(137, t));
                    break;
                  default:
                    $(e, t, r, d, n, null);
                }
            }
          Ut(e, a, c, l, u, s, i, !1);
          return;
        case `select`:
          for (i in (Q(`invalid`, e), (r = s = a = null), n))
            if (n.hasOwnProperty(i) && ((c = n[i]), c != null))
              switch (i) {
                case `value`:
                  a = c;
                  break;
                case `defaultValue`:
                  s = c;
                  break;
                case `multiple`:
                  r = c;
                default:
                  $(e, t, i, c, n, null);
              }
          ((t = a),
            (n = s),
            (e.multiple = !!r),
            t == null ? n != null && Gt(e, !!r, n, !0) : Gt(e, !!r, t, !1));
          return;
        case `textarea`:
          for (s in (Q(`invalid`, e), (a = i = r = null), n))
            if (n.hasOwnProperty(s) && ((c = n[s]), c != null))
              switch (s) {
                case `value`:
                  r = c;
                  break;
                case `defaultValue`:
                  i = c;
                  break;
                case `children`:
                  a = c;
                  break;
                case `dangerouslySetInnerHTML`:
                  if (c != null) throw Error(o(91));
                  break;
                default:
                  $(e, t, s, c, n, null);
              }
          qt(e, r, i, a);
          return;
        case `option`:
          for (l in n)
            if (n.hasOwnProperty(l) && ((r = n[l]), r != null))
              switch (l) {
                case `selected`:
                  e.selected = r && typeof r != `function` && typeof r != `symbol`;
                  break;
                default:
                  $(e, t, l, r, n, null);
              }
          return;
        case `dialog`:
          (Q(`beforetoggle`, e), Q(`toggle`, e), Q(`cancel`, e), Q(`close`, e));
          break;
        case `iframe`:
        case `object`:
          Q(`load`, e);
          break;
        case `video`:
        case `audio`:
          for (r = 0; r < _d.length; r++) Q(_d[r], e);
          break;
        case `image`:
          (Q(`error`, e), Q(`load`, e));
          break;
        case `details`:
          Q(`toggle`, e);
          break;
        case `embed`:
        case `source`:
        case `link`:
          (Q(`error`, e), Q(`load`, e));
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (u in n)
            if (n.hasOwnProperty(u) && ((r = n[u]), r != null))
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  throw Error(o(137, t));
                default:
                  $(e, t, u, r, n, null);
              }
          return;
        default:
          if (Qt(t)) {
            for (d in n)
              n.hasOwnProperty(d) && ((r = n[d]), r !== void 0 && Nd(e, t, d, r, n, void 0));
            return;
          }
      }
      for (c in n) n.hasOwnProperty(c) && ((r = n[c]), r != null && $(e, t, c, r, n, null));
    }
    function Fd(e, t, n, r) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `input`:
          var i = null,
            a = null,
            s = null,
            c = null,
            l = null,
            u = null,
            d = null;
          for (m in n) {
            var f = n[m];
            if (n.hasOwnProperty(m) && f != null)
              switch (m) {
                case `checked`:
                  break;
                case `value`:
                  break;
                case `defaultValue`:
                  l = f;
                default:
                  r.hasOwnProperty(m) || $(e, t, m, null, r, f);
              }
          }
          for (var p in r) {
            var m = r[p];
            if (((f = n[p]), r.hasOwnProperty(p) && (m != null || f != null)))
              switch (p) {
                case `type`:
                  a = m;
                  break;
                case `name`:
                  i = m;
                  break;
                case `checked`:
                  u = m;
                  break;
                case `defaultChecked`:
                  d = m;
                  break;
                case `value`:
                  s = m;
                  break;
                case `defaultValue`:
                  c = m;
                  break;
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (m != null) throw Error(o(137, t));
                  break;
                default:
                  m !== f && $(e, t, p, m, r, f);
              }
          }
          F(e, s, c, l, u, d, a, i);
          return;
        case `select`:
          for (a in ((m = s = c = p = null), n))
            if (((l = n[a]), n.hasOwnProperty(a) && l != null))
              switch (a) {
                case `value`:
                  break;
                case `multiple`:
                  m = l;
                default:
                  r.hasOwnProperty(a) || $(e, t, a, null, r, l);
              }
          for (i in r)
            if (((a = r[i]), (l = n[i]), r.hasOwnProperty(i) && (a != null || l != null)))
              switch (i) {
                case `value`:
                  p = a;
                  break;
                case `defaultValue`:
                  c = a;
                  break;
                case `multiple`:
                  s = a;
                default:
                  a !== l && $(e, t, i, a, r, l);
              }
          ((t = c),
            (n = s),
            (r = m),
            p == null
              ? !!r != !!n && (t == null ? Gt(e, !!n, n ? [] : ``, !1) : Gt(e, !!n, t, !0))
              : Gt(e, !!n, p, !1));
          return;
        case `textarea`:
          for (c in ((m = p = null), n))
            if (((i = n[c]), n.hasOwnProperty(c) && i != null && !r.hasOwnProperty(c)))
              switch (c) {
                case `value`:
                  break;
                case `children`:
                  break;
                default:
                  $(e, t, c, null, r, i);
              }
          for (s in r)
            if (((i = r[s]), (a = n[s]), r.hasOwnProperty(s) && (i != null || a != null)))
              switch (s) {
                case `value`:
                  p = i;
                  break;
                case `defaultValue`:
                  m = i;
                  break;
                case `children`:
                  break;
                case `dangerouslySetInnerHTML`:
                  if (i != null) throw Error(o(91));
                  break;
                default:
                  i !== a && $(e, t, s, i, r, a);
              }
          Kt(e, p, m);
          return;
        case `option`:
          for (var h in n)
            if (((p = n[h]), n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)))
              switch (h) {
                case `selected`:
                  e.selected = !1;
                  break;
                default:
                  $(e, t, h, null, r, p);
              }
          for (l in r)
            if (
              ((p = r[l]), (m = n[l]), r.hasOwnProperty(l) && p !== m && (p != null || m != null))
            )
              switch (l) {
                case `selected`:
                  e.selected = p && typeof p != `function` && typeof p != `symbol`;
                  break;
                default:
                  $(e, t, l, p, r, m);
              }
          return;
        case `img`:
        case `link`:
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `embed`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `source`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (var g in n)
            ((p = n[g]),
              n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && $(e, t, g, null, r, p));
          for (u in r)
            if (
              ((p = r[u]), (m = n[u]), r.hasOwnProperty(u) && p !== m && (p != null || m != null))
            )
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (p != null) throw Error(o(137, t));
                  break;
                default:
                  $(e, t, u, p, r, m);
              }
          return;
        default:
          if (Qt(t)) {
            for (var _ in n)
              ((p = n[_]),
                n.hasOwnProperty(_) &&
                  p !== void 0 &&
                  !r.hasOwnProperty(_) &&
                  Nd(e, t, _, void 0, r, p));
            for (d in r)
              ((p = r[d]),
                (m = n[d]),
                !r.hasOwnProperty(d) ||
                  p === m ||
                  (p === void 0 && m === void 0) ||
                  Nd(e, t, d, p, r, m));
            return;
          }
      }
      for (var v in n)
        ((p = n[v]),
          n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && $(e, t, v, null, r, p));
      for (f in r)
        ((p = r[f]),
          (m = n[f]),
          !r.hasOwnProperty(f) || p === m || (p == null && m == null) || $(e, t, f, p, r, m));
    }
    function Id(e) {
      switch (e) {
        case `css`:
        case `script`:
        case `font`:
        case `img`:
        case `image`:
        case `input`:
        case `link`:
          return !0;
        default:
          return !1;
      }
    }
    function Ld() {
      if (typeof performance.getEntriesByType == `function`) {
        for (
          var e = 0, t = 0, n = performance.getEntriesByType(`resource`), r = 0;
          r < n.length;
          r++
        ) {
          var i = n[r],
            a = i.transferSize,
            o = i.initiatorType,
            s = i.duration;
          if (a && s && Id(o)) {
            for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
              var c = n[r],
                l = c.startTime;
              if (l > s) break;
              var u = c.transferSize,
                d = c.initiatorType;
              u && Id(d) && ((c = c.responseEnd), (o += u * (c < s ? 1 : (s - l) / (c - l))));
            }
            if ((--r, (t += (8 * (a + o)) / (i.duration / 1e3)), e++, 10 < e)) break;
          }
        }
        if (0 < e) return t / e / 1e6;
      }
      return navigator.connection && ((e = navigator.connection.downlink), typeof e == `number`)
        ? e
        : 5;
    }
    var Rd = null,
      zd = null;
    function Bd(e) {
      return e.nodeType === 9 ? e : e.ownerDocument;
    }
    function Vd(e) {
      switch (e) {
        case `http://www.w3.org/2000/svg`:
          return 1;
        case `http://www.w3.org/1998/Math/MathML`:
          return 2;
        default:
          return 0;
      }
    }
    function Hd(e, t) {
      if (e === 0)
        switch (t) {
          case `svg`:
            return 1;
          case `math`:
            return 2;
          default:
            return 0;
        }
      return e === 1 && t === `foreignObject` ? 0 : e;
    }
    function Ud(e, t) {
      return (
        e === `textarea` ||
        e === `noscript` ||
        typeof t.children == `string` ||
        typeof t.children == `number` ||
        typeof t.children == `bigint` ||
        (typeof t.dangerouslySetInnerHTML == `object` &&
          t.dangerouslySetInnerHTML !== null &&
          t.dangerouslySetInnerHTML.__html != null)
      );
    }
    var Wd = null;
    function Gd() {
      var e = window.event;
      return e && e.type === `popstate` ? (e === Wd ? !1 : ((Wd = e), !0)) : ((Wd = null), !1);
    }
    var Kd = typeof setTimeout == `function` ? setTimeout : void 0,
      qd = typeof clearTimeout == `function` ? clearTimeout : void 0,
      Jd = typeof Promise == `function` ? Promise : void 0,
      Yd =
        typeof queueMicrotask == `function`
          ? queueMicrotask
          : Jd === void 0
            ? Kd
            : function (e) {
                return Jd.resolve(null).then(e).catch(Xd);
              };
    function Xd(e) {
      setTimeout(function () {
        throw e;
      });
    }
    function Zd(e) {
      return e === `head`;
    }
    function Qd(e, t) {
      var n = t,
        r = 0;
      do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8))
          if (((n = i.data), n === `/$` || n === `/&`)) {
            if (r === 0) {
              (e.removeChild(i), Np(t));
              return;
            }
            r--;
          } else if (n === `$` || n === `$?` || n === `$~` || n === `$!` || n === `&`) r++;
          else if (n === `html`) pf(e.ownerDocument.documentElement);
          else if (n === `head`) {
            ((n = e.ownerDocument.head), pf(n));
            for (var a = n.firstChild; a; ) {
              var o = a.nextSibling,
                s = a.nodeName;
              (a[M] ||
                s === `SCRIPT` ||
                s === `STYLE` ||
                (s === `LINK` && a.rel.toLowerCase() === `stylesheet`) ||
                n.removeChild(a),
                (a = o));
            }
          } else n === `body` && pf(e.ownerDocument.body);
        n = i;
      } while (n);
      Np(t);
    }
    function $d(e, t) {
      var n = e;
      e = 0;
      do {
        var r = n.nextSibling;
        if (
          (n.nodeType === 1
            ? t
              ? ((n._stashedDisplay = n.style.display), (n.style.display = `none`))
              : ((n.style.display = n._stashedDisplay || ``),
                n.getAttribute(`style`) === `` && n.removeAttribute(`style`))
            : n.nodeType === 3 &&
              (t
                ? ((n._stashedText = n.nodeValue), (n.nodeValue = ``))
                : (n.nodeValue = n._stashedText || ``)),
          r && r.nodeType === 8)
        )
          if (((n = r.data), n === `/$`)) {
            if (e === 0) break;
            e--;
          } else (n !== `$` && n !== `$?` && n !== `$~` && n !== `$!`) || e++;
        n = r;
      } while (n);
    }
    function ef(e) {
      var t = e.firstChild;
      for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
        var n = t;
        switch (((t = t.nextSibling), n.nodeName)) {
          case `HTML`:
          case `HEAD`:
          case `BODY`:
            (ef(n), bt(n));
            continue;
          case `SCRIPT`:
          case `STYLE`:
            continue;
          case `LINK`:
            if (n.rel.toLowerCase() === `stylesheet`) continue;
        }
        e.removeChild(n);
      }
    }
    function tf(e, t, n, r) {
      for (; e.nodeType === 1; ) {
        var i = n;
        if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
          if (!r && (e.nodeName !== `INPUT` || e.type !== `hidden`)) break;
        } else if (!r)
          if (t === `input` && e.type === `hidden`) {
            var a = i.name == null ? null : `` + i.name;
            if (i.type === `hidden` && e.getAttribute(`name`) === a) return e;
          } else return e;
        else if (!e[M])
          switch (t) {
            case `meta`:
              if (!e.hasAttribute(`itemprop`)) break;
              return e;
            case `link`:
              if (
                ((a = e.getAttribute(`rel`)),
                (a === `stylesheet` && e.hasAttribute(`data-precedence`)) ||
                  a !== i.rel ||
                  e.getAttribute(`href`) !== (i.href == null || i.href === `` ? null : i.href) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin) ||
                  e.getAttribute(`title`) !== (i.title == null ? null : i.title))
              )
                break;
              return e;
            case `style`:
              if (e.hasAttribute(`data-precedence`)) break;
              return e;
            case `script`:
              if (
                ((a = e.getAttribute(`src`)),
                (a !== (i.src == null ? null : i.src) ||
                  e.getAttribute(`type`) !== (i.type == null ? null : i.type) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin)) &&
                  a &&
                  e.hasAttribute(`async`) &&
                  !e.hasAttribute(`itemprop`))
              )
                break;
              return e;
            default:
              return e;
          }
        if (((e = cf(e.nextSibling)), e === null)) break;
      }
      return null;
    }
    function nf(e, t, n) {
      if (t === ``) return null;
      for (; e.nodeType !== 3; )
        if (
          ((e.nodeType !== 1 || e.nodeName !== `INPUT` || e.type !== `hidden`) && !n) ||
          ((e = cf(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function rf(e, t) {
      for (; e.nodeType !== 8; )
        if (
          ((e.nodeType !== 1 || e.nodeName !== `INPUT` || e.type !== `hidden`) && !t) ||
          ((e = cf(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function af(e) {
      return e.data === `$?` || e.data === `$~`;
    }
    function of(e) {
      return e.data === `$!` || (e.data === `$?` && e.ownerDocument.readyState !== `loading`);
    }
    function sf(e, t) {
      var n = e.ownerDocument;
      if (e.data === `$~`) e._reactRetry = t;
      else if (e.data !== `$?` || n.readyState !== `loading`) t();
      else {
        var r = function () {
          (t(), n.removeEventListener(`DOMContentLoaded`, r));
        };
        (n.addEventListener(`DOMContentLoaded`, r), (e._reactRetry = r));
      }
    }
    function cf(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === 1 || t === 3) break;
        if (t === 8) {
          if (
            ((t = e.data),
            t === `$` ||
              t === `$!` ||
              t === `$?` ||
              t === `$~` ||
              t === `&` ||
              t === `F!` ||
              t === `F`)
          )
            break;
          if (t === `/$` || t === `/&`) return null;
        }
      }
      return e;
    }
    var lf = null;
    function uf(e) {
      e = e.nextSibling;
      for (var t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === `/$` || n === `/&`) {
            if (t === 0) return cf(e.nextSibling);
            t--;
          } else (n !== `$` && n !== `$!` && n !== `$?` && n !== `$~` && n !== `&`) || t++;
        }
        e = e.nextSibling;
      }
      return null;
    }
    function df(e) {
      e = e.previousSibling;
      for (var t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === `$` || n === `$!` || n === `$?` || n === `$~` || n === `&`) {
            if (t === 0) return e;
            t--;
          } else (n !== `/$` && n !== `/&`) || t++;
        }
        e = e.previousSibling;
      }
      return null;
    }
    function ff(e, t, n) {
      switch (((t = Bd(n)), e)) {
        case `html`:
          if (((e = t.documentElement), !e)) throw Error(o(452));
          return e;
        case `head`:
          if (((e = t.head), !e)) throw Error(o(453));
          return e;
        case `body`:
          if (((e = t.body), !e)) throw Error(o(454));
          return e;
        default:
          throw Error(o(451));
      }
    }
    function pf(e) {
      for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
      bt(e);
    }
    var mf = new Map(),
      hf = new Set();
    function gf(e) {
      return typeof e.getRootNode == `function`
        ? e.getRootNode()
        : e.nodeType === 9
          ? e
          : e.ownerDocument;
    }
    var _f = D.d;
    D.d = { f: vf, r: yf, D: Sf, C: Cf, L: wf, m: Tf, X: Df, S: Ef, M: Of };
    function vf() {
      var e = _f.f(),
        t = bu();
      return e || t;
    }
    function yf(e) {
      var t = St(e);
      t !== null && t.tag === 5 && t.type === `form` ? Ds(t) : _f.r(e);
    }
    var bf = typeof document > `u` ? null : document;
    function xf(e, t, n) {
      var r = bf;
      if (r && typeof t == `string` && t) {
        var i = P(t);
        ((i = `link[rel="` + e + `"][href="` + i + `"]`),
          typeof n == `string` && (i += `[crossorigin="` + n + `"]`),
          hf.has(i) ||
            (hf.add(i),
            (e = { rel: e, crossOrigin: n, href: t }),
            r.querySelector(i) === null &&
              ((t = r.createElement(`link`)), Pd(t, `link`, e), N(t), r.head.appendChild(t))));
      }
    }
    function Sf(e) {
      (_f.D(e), xf(`dns-prefetch`, e, null));
    }
    function Cf(e, t) {
      (_f.C(e, t), xf(`preconnect`, e, t));
    }
    function wf(e, t, n) {
      _f.L(e, t, n);
      var r = bf;
      if (r && e && t) {
        var i = `link[rel="preload"][as="` + P(t) + `"]`;
        t === `image` && n && n.imageSrcSet
          ? ((i += `[imagesrcset="` + P(n.imageSrcSet) + `"]`),
            typeof n.imageSizes == `string` && (i += `[imagesizes="` + P(n.imageSizes) + `"]`))
          : (i += `[href="` + P(e) + `"]`);
        var a = i;
        switch (t) {
          case `style`:
            a = Af(e);
            break;
          case `script`:
            a = Pf(e);
        }
        mf.has(a) ||
          ((e = h(
            { rel: `preload`, href: t === `image` && n && n.imageSrcSet ? void 0 : e, as: t },
            n,
          )),
          mf.set(a, e),
          r.querySelector(i) !== null ||
            (t === `style` && r.querySelector(jf(a))) ||
            (t === `script` && r.querySelector(Ff(a))) ||
            ((t = r.createElement(`link`)), Pd(t, `link`, e), N(t), r.head.appendChild(t)));
      }
    }
    function Tf(e, t) {
      _f.m(e, t);
      var n = bf;
      if (n && e) {
        var r = t && typeof t.as == `string` ? t.as : `script`,
          i = `link[rel="modulepreload"][as="` + P(r) + `"][href="` + P(e) + `"]`,
          a = i;
        switch (r) {
          case `audioworklet`:
          case `paintworklet`:
          case `serviceworker`:
          case `sharedworker`:
          case `worker`:
          case `script`:
            a = Pf(e);
        }
        if (
          !mf.has(a) &&
          ((e = h({ rel: `modulepreload`, href: e }, t)), mf.set(a, e), n.querySelector(i) === null)
        ) {
          switch (r) {
            case `audioworklet`:
            case `paintworklet`:
            case `serviceworker`:
            case `sharedworker`:
            case `worker`:
            case `script`:
              if (n.querySelector(Ff(a))) return;
          }
          ((r = n.createElement(`link`)), Pd(r, `link`, e), N(r), n.head.appendChild(r));
        }
      }
    }
    function Ef(e, t, n) {
      _f.S(e, t, n);
      var r = bf;
      if (r && e) {
        var i = wt(r).hoistableStyles,
          a = Af(e);
        t ||= `default`;
        var o = i.get(a);
        if (!o) {
          var s = { loading: 0, preload: null };
          if ((o = r.querySelector(jf(a)))) s.loading = 5;
          else {
            ((e = h({ rel: `stylesheet`, href: e, "data-precedence": t }, n)),
              (n = mf.get(a)) && Rf(e, n));
            var c = (o = r.createElement(`link`));
            (N(c),
              Pd(c, `link`, e),
              (c._p = new Promise(function (e, t) {
                ((c.onload = e), (c.onerror = t));
              })),
              c.addEventListener(`load`, function () {
                s.loading |= 1;
              }),
              c.addEventListener(`error`, function () {
                s.loading |= 2;
              }),
              (s.loading |= 4),
              Lf(o, t, r));
          }
          ((o = { type: `stylesheet`, instance: o, count: 1, state: s }), i.set(a, o));
        }
      }
    }
    function Df(e, t) {
      _f.X(e, t);
      var n = bf;
      if (n && e) {
        var r = wt(n).hoistableScripts,
          i = Pf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Ff(i))),
          a ||
            ((e = h({ src: e, async: !0 }, t)),
            (t = mf.get(i)) && zf(e, t),
            (a = n.createElement(`script`)),
            N(a),
            Pd(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function Of(e, t) {
      _f.M(e, t);
      var n = bf;
      if (n && e) {
        var r = wt(n).hoistableScripts,
          i = Pf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Ff(i))),
          a ||
            ((e = h({ src: e, async: !0, type: `module` }, t)),
            (t = mf.get(i)) && zf(e, t),
            (a = n.createElement(`script`)),
            N(a),
            Pd(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function kf(e, t, n, r) {
      var i = (i = he.current) ? gf(i) : null;
      if (!i) throw Error(o(446));
      switch (e) {
        case `meta`:
        case `title`:
          return null;
        case `style`:
          return typeof n.precedence == `string` && typeof n.href == `string`
            ? ((t = Af(n.href)),
              (n = wt(i).hoistableStyles),
              (r = n.get(t)),
              r || ((r = { type: `style`, instance: null, count: 0, state: null }), n.set(t, r)),
              r)
            : { type: `void`, instance: null, count: 0, state: null };
        case `link`:
          if (
            n.rel === `stylesheet` &&
            typeof n.href == `string` &&
            typeof n.precedence == `string`
          ) {
            e = Af(n.href);
            var a = wt(i).hoistableStyles,
              s = a.get(e);
            if (
              (s ||
                ((i = i.ownerDocument || i),
                (s = {
                  type: `stylesheet`,
                  instance: null,
                  count: 0,
                  state: { loading: 0, preload: null },
                }),
                a.set(e, s),
                (a = i.querySelector(jf(e))) && !a._p && ((s.instance = a), (s.state.loading = 5)),
                mf.has(e) ||
                  ((n = {
                    rel: `preload`,
                    as: `style`,
                    href: n.href,
                    crossOrigin: n.crossOrigin,
                    integrity: n.integrity,
                    media: n.media,
                    hrefLang: n.hrefLang,
                    referrerPolicy: n.referrerPolicy,
                  }),
                  mf.set(e, n),
                  a || Nf(i, e, n, s.state))),
              t && r === null)
            )
              throw Error(o(528, ``));
            return s;
          }
          if (t && r !== null) throw Error(o(529, ``));
          return null;
        case `script`:
          return (
            (t = n.async),
            (n = n.src),
            typeof n == `string` && t && typeof t != `function` && typeof t != `symbol`
              ? ((t = Pf(n)),
                (n = wt(i).hoistableScripts),
                (r = n.get(t)),
                r || ((r = { type: `script`, instance: null, count: 0, state: null }), n.set(t, r)),
                r)
              : { type: `void`, instance: null, count: 0, state: null }
          );
        default:
          throw Error(o(444, e));
      }
    }
    function Af(e) {
      return `href="` + P(e) + `"`;
    }
    function jf(e) {
      return `link[rel="stylesheet"][` + e + `]`;
    }
    function Mf(e) {
      return h({}, e, { "data-precedence": e.precedence, precedence: null });
    }
    function Nf(e, t, n, r) {
      e.querySelector(`link[rel="preload"][as="style"][` + t + `]`)
        ? (r.loading = 1)
        : ((t = e.createElement(`link`)),
          (r.preload = t),
          t.addEventListener(`load`, function () {
            return (r.loading |= 1);
          }),
          t.addEventListener(`error`, function () {
            return (r.loading |= 2);
          }),
          Pd(t, `link`, n),
          N(t),
          e.head.appendChild(t));
    }
    function Pf(e) {
      return `[src="` + P(e) + `"]`;
    }
    function Ff(e) {
      return `script[async]` + e;
    }
    function If(e, t, n) {
      if ((t.count++, t.instance === null))
        switch (t.type) {
          case `style`:
            var r = e.querySelector(`style[data-href~="` + P(n.href) + `"]`);
            if (r) return ((t.instance = r), N(r), r);
            var i = h({}, n, {
              "data-href": n.href,
              "data-precedence": n.precedence,
              href: null,
              precedence: null,
            });
            return (
              (r = (e.ownerDocument || e).createElement(`style`)),
              N(r),
              Pd(r, `style`, i),
              Lf(r, n.precedence, e),
              (t.instance = r)
            );
          case `stylesheet`:
            i = Af(n.href);
            var a = e.querySelector(jf(i));
            if (a) return ((t.state.loading |= 4), (t.instance = a), N(a), a);
            ((r = Mf(n)),
              (i = mf.get(i)) && Rf(r, i),
              (a = (e.ownerDocument || e).createElement(`link`)),
              N(a));
            var s = a;
            return (
              (s._p = new Promise(function (e, t) {
                ((s.onload = e), (s.onerror = t));
              })),
              Pd(a, `link`, r),
              (t.state.loading |= 4),
              Lf(a, n.precedence, e),
              (t.instance = a)
            );
          case `script`:
            return (
              (a = Pf(n.src)),
              (i = e.querySelector(Ff(a)))
                ? ((t.instance = i), N(i), i)
                : ((r = n),
                  (i = mf.get(a)) && ((r = h({}, n)), zf(r, i)),
                  (e = e.ownerDocument || e),
                  (i = e.createElement(`script`)),
                  N(i),
                  Pd(i, `link`, r),
                  e.head.appendChild(i),
                  (t.instance = i))
            );
          case `void`:
            return null;
          default:
            throw Error(o(443, t.type));
        }
      else
        t.type === `stylesheet` &&
          !(t.state.loading & 4) &&
          ((r = t.instance), (t.state.loading |= 4), Lf(r, n.precedence, e));
      return t.instance;
    }
    function Lf(e, t, n) {
      for (
        var r = n.querySelectorAll(
            `link[rel="stylesheet"][data-precedence],style[data-precedence]`,
          ),
          i = r.length ? r[r.length - 1] : null,
          a = i,
          o = 0;
        o < r.length;
        o++
      ) {
        var s = r[o];
        if (s.dataset.precedence === t) a = s;
        else if (a !== i) break;
      }
      a
        ? a.parentNode.insertBefore(e, a.nextSibling)
        : ((t = n.nodeType === 9 ? n.head : n), t.insertBefore(e, t.firstChild));
    }
    function Rf(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.title ??= t.title));
    }
    function zf(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.integrity ??= t.integrity));
    }
    var Bf = null;
    function Vf(e, t, n) {
      if (Bf === null) {
        var r = new Map(),
          i = (Bf = new Map());
        i.set(n, r);
      } else ((i = Bf), (r = i.get(n)), r || ((r = new Map()), i.set(n, r)));
      if (r.has(e)) return r;
      for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
        var a = n[i];
        if (
          !(a[M] || a[j] || (e === `link` && a.getAttribute(`rel`) === `stylesheet`)) &&
          a.namespaceURI !== `http://www.w3.org/2000/svg`
        ) {
          var o = a.getAttribute(t) || ``;
          o = e + o;
          var s = r.get(o);
          s ? s.push(a) : r.set(o, [a]);
        }
      }
      return r;
    }
    function Hf(e, t, n) {
      ((e = e.ownerDocument || e),
        e.head.insertBefore(n, t === `title` ? e.querySelector(`head > title`) : null));
    }
    function Uf(e, t, n) {
      if (n === 1 || t.itemProp != null) return !1;
      switch (e) {
        case `meta`:
        case `title`:
          return !0;
        case `style`:
          if (typeof t.precedence != `string` || typeof t.href != `string` || t.href === ``) break;
          return !0;
        case `link`:
          if (
            typeof t.rel != `string` ||
            typeof t.href != `string` ||
            t.href === `` ||
            t.onLoad ||
            t.onError
          )
            break;
          switch (t.rel) {
            case `stylesheet`:
              return ((e = t.disabled), typeof t.precedence == `string` && e == null);
            default:
              return !0;
          }
        case `script`:
          if (
            t.async &&
            typeof t.async != `function` &&
            typeof t.async != `symbol` &&
            !t.onLoad &&
            !t.onError &&
            t.src &&
            typeof t.src == `string`
          )
            return !0;
      }
      return !1;
    }
    function Wf(e) {
      return !(e.type === `stylesheet` && !(e.state.loading & 3));
    }
    function Gf(e, t, n, r) {
      if (
        n.type === `stylesheet` &&
        (typeof r.media != `string` || !1 !== matchMedia(r.media).matches) &&
        !(n.state.loading & 4)
      ) {
        if (n.instance === null) {
          var i = Af(r.href),
            a = t.querySelector(jf(i));
          if (a) {
            ((t = a._p),
              typeof t == `object` &&
                t &&
                typeof t.then == `function` &&
                (e.count++, (e = Jf.bind(e)), t.then(e, e)),
              (n.state.loading |= 4),
              (n.instance = a),
              N(a));
            return;
          }
          ((a = t.ownerDocument || t),
            (r = Mf(r)),
            (i = mf.get(i)) && Rf(r, i),
            (a = a.createElement(`link`)),
            N(a));
          var o = a;
          ((o._p = new Promise(function (e, t) {
            ((o.onload = e), (o.onerror = t));
          })),
            Pd(a, `link`, r),
            (n.instance = a));
        }
        (e.stylesheets === null && (e.stylesheets = new Map()),
          e.stylesheets.set(n, t),
          (t = n.state.preload) &&
            !(n.state.loading & 3) &&
            (e.count++,
            (n = Jf.bind(e)),
            t.addEventListener(`load`, n),
            t.addEventListener(`error`, n)));
      }
    }
    var Kf = 0;
    function qf(e, t) {
      return (
        e.stylesheets && e.count === 0 && Xf(e, e.stylesheets),
        0 < e.count || 0 < e.imgCount
          ? function (n) {
              var r = setTimeout(function () {
                if ((e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
                  var t = e.unsuspend;
                  ((e.unsuspend = null), t());
                }
              }, 6e4 + t);
              0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
              var i = setTimeout(
                function () {
                  if (
                    ((e.waitingForImages = !1),
                    e.count === 0 && (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend))
                  ) {
                    var t = e.unsuspend;
                    ((e.unsuspend = null), t());
                  }
                },
                (e.imgBytes > Kf ? 50 : 800) + t,
              );
              return (
                (e.unsuspend = n),
                function () {
                  ((e.unsuspend = null), clearTimeout(r), clearTimeout(i));
                }
              );
            }
          : null
      );
    }
    function Jf() {
      if ((this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))) {
        if (this.stylesheets) Xf(this, this.stylesheets);
        else if (this.unsuspend) {
          var e = this.unsuspend;
          ((this.unsuspend = null), e());
        }
      }
    }
    var Yf = null;
    function Xf(e, t) {
      ((e.stylesheets = null),
        e.unsuspend !== null &&
          (e.count++, (Yf = new Map()), t.forEach(Zf, e), (Yf = null), Jf.call(e)));
    }
    function Zf(e, t) {
      if (!(t.state.loading & 4)) {
        var n = Yf.get(e);
        if (n) var r = n.get(null);
        else {
          ((n = new Map()), Yf.set(e, n));
          for (
            var i = e.querySelectorAll(`link[data-precedence],style[data-precedence]`), a = 0;
            a < i.length;
            a++
          ) {
            var o = i[a];
            (o.nodeName === `LINK` || o.getAttribute(`media`) !== `not all`) &&
              (n.set(o.dataset.precedence, o), (r = o));
          }
          r && n.set(null, r);
        }
        ((i = t.instance),
          (o = i.getAttribute(`data-precedence`)),
          (a = n.get(o) || r),
          a === r && n.set(null, i),
          n.set(o, i),
          this.count++,
          (r = Jf.bind(this)),
          i.addEventListener(`load`, r),
          i.addEventListener(`error`, r),
          a
            ? a.parentNode.insertBefore(i, a.nextSibling)
            : ((e = e.nodeType === 9 ? e.head : e), e.insertBefore(i, e.firstChild)),
          (t.state.loading |= 4));
      }
    }
    var Qf = {
      $$typeof: C,
      Provider: null,
      Consumer: null,
      _currentValue: ue,
      _currentValue2: ue,
      _threadCount: 0,
    };
    function $f(e, t, n, r, i, a, o, s, c) {
      ((this.tag = 1),
        (this.containerInfo = e),
        (this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode =
          this.next =
          this.pendingContext =
          this.context =
          this.cancelPendingCommit =
            null),
        (this.callbackPriority = 0),
        (this.expirationTimes = rt(-1)),
        (this.entangledLanes =
          this.shellSuspendCounter =
          this.errorRecoveryDisabledLanes =
          this.expiredLanes =
          this.warmLanes =
          this.pingedLanes =
          this.suspendedLanes =
          this.pendingLanes =
            0),
        (this.entanglements = rt(0)),
        (this.hiddenUpdates = rt(null)),
        (this.identifierPrefix = r),
        (this.onUncaughtError = i),
        (this.onCaughtError = a),
        (this.onRecoverableError = o),
        (this.pooledCache = null),
        (this.pooledCacheLanes = 0),
        (this.formState = c),
        (this.incompleteTransitions = new Map()));
    }
    function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
      return (
        (e = new $f(e, t, n, o, c, l, u, d, s)),
        (t = 1),
        !0 === a && (t |= 24),
        (a = di(3, null, null, t)),
        (e.current = a),
        (a.stateNode = e),
        (t = ua()),
        t.refCount++,
        (e.pooledCache = t),
        t.refCount++,
        (a.memoizedState = { element: r, isDehydrated: n, cache: t }),
        Ua(a),
        e
      );
    }
    function tp(e) {
      return e ? ((e = li), e) : li;
    }
    function np(e, t, n, r, i, a) {
      ((i = tp(i)),
        r.context === null ? (r.context = i) : (r.pendingContext = i),
        (r = Ga(t)),
        (r.payload = { element: n }),
        (a = a === void 0 ? null : a),
        a !== null && (r.callback = a),
        (n = Ka(e, r, t)),
        n !== null && (hu(n, e, t), qa(n, e, t)));
    }
    function rp(e, t) {
      if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
      }
    }
    function ip(e, t) {
      (rp(e, t), (e = e.alternate) && rp(e, t));
    }
    function ap(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = oi(e, 67108864);
        (t !== null && hu(t, e, 67108864), ip(e, 67108864));
      }
    }
    function op(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = pu();
        t = lt(t);
        var n = oi(e, t);
        (n !== null && hu(n, e, t), ip(e, t));
      }
    }
    var sp = !0;
    function cp(e, t, n, r) {
      var i = E.T;
      E.T = null;
      var a = D.p;
      try {
        ((D.p = 2), up(e, t, n, r));
      } finally {
        ((D.p = a), (E.T = i));
      }
    }
    function lp(e, t, n, r) {
      var i = E.T;
      E.T = null;
      var a = D.p;
      try {
        ((D.p = 8), up(e, t, n, r));
      } finally {
        ((D.p = a), (E.T = i));
      }
    }
    function up(e, t, n, r) {
      if (sp) {
        var i = dp(r);
        if (i === null) (wd(e, t, r, fp, n), Cp(e, r));
        else if (Tp(i, e, t, n, r)) r.stopPropagation();
        else if ((Cp(e, r), t & 4 && -1 < Sp.indexOf(e))) {
          for (; i !== null; ) {
            var a = St(i);
            if (a !== null)
              switch (a.tag) {
                case 3:
                  if (((a = a.stateNode), a.current.memoizedState.isDehydrated)) {
                    var o = Qe(a.pendingLanes);
                    if (o !== 0) {
                      var s = a;
                      for (s.pendingLanes |= 2, s.entangledLanes |= 2; o; ) {
                        var c = 1 << (31 - Ge(o));
                        ((s.entanglements[1] |= c), (o &= ~c));
                      }
                      (rd(a), !(G & 6) && ((tu = Ne() + 500), id(0, !1)));
                    }
                  }
                  break;
                case 31:
                case 13:
                  ((s = oi(a, 2)), s !== null && hu(s, a, 2), bu(), ip(a, 2));
              }
            if (((a = dp(r)), a === null && wd(e, t, r, fp, n), a === i)) break;
            i = a;
          }
          i !== null && r.stopPropagation();
        } else wd(e, t, r, null, n);
      }
    }
    function dp(e) {
      return ((e = an(e)), pp(e));
    }
    var fp = null;
    function pp(e) {
      if (((fp = null), (e = xt(e)), e !== null)) {
        var t = l(e);
        if (t === null) e = null;
        else {
          var n = t.tag;
          if (n === 13) {
            if (((e = u(t)), e !== null)) return e;
            e = null;
          } else if (n === 31) {
            if (((e = d(t)), e !== null)) return e;
            e = null;
          } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
              return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
          } else t !== e && (e = null);
        }
      }
      return ((fp = e), null);
    }
    function mp(e) {
      switch (e) {
        case `beforetoggle`:
        case `cancel`:
        case `click`:
        case `close`:
        case `contextmenu`:
        case `copy`:
        case `cut`:
        case `auxclick`:
        case `dblclick`:
        case `dragend`:
        case `dragstart`:
        case `drop`:
        case `focusin`:
        case `focusout`:
        case `input`:
        case `invalid`:
        case `keydown`:
        case `keypress`:
        case `keyup`:
        case `mousedown`:
        case `mouseup`:
        case `paste`:
        case `pause`:
        case `play`:
        case `pointercancel`:
        case `pointerdown`:
        case `pointerup`:
        case `ratechange`:
        case `reset`:
        case `resize`:
        case `seeked`:
        case `submit`:
        case `toggle`:
        case `touchcancel`:
        case `touchend`:
        case `touchstart`:
        case `volumechange`:
        case `change`:
        case `selectionchange`:
        case `textInput`:
        case `compositionstart`:
        case `compositionend`:
        case `compositionupdate`:
        case `beforeblur`:
        case `afterblur`:
        case `beforeinput`:
        case `blur`:
        case `fullscreenchange`:
        case `focus`:
        case `hashchange`:
        case `popstate`:
        case `select`:
        case `selectstart`:
          return 2;
        case `drag`:
        case `dragenter`:
        case `dragexit`:
        case `dragleave`:
        case `dragover`:
        case `mousemove`:
        case `mouseout`:
        case `mouseover`:
        case `pointermove`:
        case `pointerout`:
        case `pointerover`:
        case `scroll`:
        case `touchmove`:
        case `wheel`:
        case `mouseenter`:
        case `mouseleave`:
        case `pointerenter`:
        case `pointerleave`:
          return 8;
        case `message`:
          switch (Pe()) {
            case Fe:
              return 2;
            case Ie:
              return 8;
            case Le:
            case Re:
              return 32;
            case ze:
              return 268435456;
            default:
              return 32;
          }
        default:
          return 32;
      }
    }
    var hp = !1,
      gp = null,
      _p = null,
      vp = null,
      yp = new Map(),
      bp = new Map(),
      xp = [],
      Sp =
        `mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(
          ` `,
        );
    function Cp(e, t) {
      switch (e) {
        case `focusin`:
        case `focusout`:
          gp = null;
          break;
        case `dragenter`:
        case `dragleave`:
          _p = null;
          break;
        case `mouseover`:
        case `mouseout`:
          vp = null;
          break;
        case `pointerover`:
        case `pointerout`:
          yp.delete(t.pointerId);
          break;
        case `gotpointercapture`:
        case `lostpointercapture`:
          bp.delete(t.pointerId);
      }
    }
    function wp(e, t, n, r, i, a) {
      return e === null || e.nativeEvent !== a
        ? ((e = {
            blockedOn: t,
            domEventName: n,
            eventSystemFlags: r,
            nativeEvent: a,
            targetContainers: [i],
          }),
          t !== null && ((t = St(t)), t !== null && ap(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
    }
    function Tp(e, t, n, r, i) {
      switch (t) {
        case `focusin`:
          return ((gp = wp(gp, e, t, n, r, i)), !0);
        case `dragenter`:
          return ((_p = wp(_p, e, t, n, r, i)), !0);
        case `mouseover`:
          return ((vp = wp(vp, e, t, n, r, i)), !0);
        case `pointerover`:
          var a = i.pointerId;
          return (yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0);
        case `gotpointercapture`:
          return ((a = i.pointerId), bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)), !0);
      }
      return !1;
    }
    function Ep(e) {
      var t = xt(e.target);
      if (t !== null) {
        var n = l(t);
        if (n !== null) {
          if (((t = n.tag), t === 13)) {
            if (((t = u(n)), t !== null)) {
              ((e.blockedOn = t),
                ft(e.priority, function () {
                  op(n);
                }));
              return;
            }
          } else if (t === 31) {
            if (((t = d(n)), t !== null)) {
              ((e.blockedOn = t),
                ft(e.priority, function () {
                  op(n);
                }));
              return;
            }
          } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
            e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
            return;
          }
        }
      }
      e.blockedOn = null;
    }
    function Dp(e) {
      if (e.blockedOn !== null) return !1;
      for (var t = e.targetContainers; 0 < t.length; ) {
        var n = dp(e.nativeEvent);
        if (n === null) {
          n = e.nativeEvent;
          var r = new n.constructor(n.type, n);
          ((rn = r), n.target.dispatchEvent(r), (rn = null));
        } else return ((t = St(n)), t !== null && ap(t), (e.blockedOn = n), !1);
        t.shift();
      }
      return !0;
    }
    function Op(e, t, n) {
      Dp(e) && n.delete(t);
    }
    function kp() {
      ((hp = !1),
        gp !== null && Dp(gp) && (gp = null),
        _p !== null && Dp(_p) && (_p = null),
        vp !== null && Dp(vp) && (vp = null),
        yp.forEach(Op),
        bp.forEach(Op));
    }
    function Ap(e, t) {
      e.blockedOn === t &&
        ((e.blockedOn = null),
        hp || ((hp = !0), n.unstable_scheduleCallback(n.unstable_NormalPriority, kp)));
    }
    var jp = null;
    function Mp(e) {
      jp !== e &&
        ((jp = e),
        n.unstable_scheduleCallback(n.unstable_NormalPriority, function () {
          jp === e && (jp = null);
          for (var t = 0; t < e.length; t += 3) {
            var n = e[t],
              r = e[t + 1],
              i = e[t + 2];
            if (typeof r != `function`) {
              if (pp(r || n) === null) continue;
              break;
            }
            var a = St(n);
            a !== null &&
              (e.splice(t, 3),
              (t -= 3),
              Ts(a, { pending: !0, data: i, method: n.method, action: r }, r, i));
          }
        }));
    }
    function Np(e) {
      function t(t) {
        return Ap(t, e);
      }
      (gp !== null && Ap(gp, e),
        _p !== null && Ap(_p, e),
        vp !== null && Ap(vp, e),
        yp.forEach(t),
        bp.forEach(t));
      for (var n = 0; n < xp.length; n++) {
        var r = xp[n];
        r.blockedOn === e && (r.blockedOn = null);
      }
      for (; 0 < xp.length && ((n = xp[0]), n.blockedOn === null); )
        (Ep(n), n.blockedOn === null && xp.shift());
      if (((n = (e.ownerDocument || e).$$reactFormReplay), n != null))
        for (r = 0; r < n.length; r += 3) {
          var i = n[r],
            a = n[r + 1],
            o = i[mt] || null;
          if (typeof a == `function`) o || Mp(n);
          else if (o) {
            var s = null;
            if (a && a.hasAttribute(`formAction`)) {
              if (((i = a), (o = a[mt] || null))) s = o.formAction;
              else if (pp(i) !== null) continue;
            } else s = o.action;
            (typeof s == `function` ? (n[r + 1] = s) : (n.splice(r, 3), (r -= 3)), Mp(n));
          }
        }
    }
    function Pp() {
      function e(e) {
        e.canIntercept &&
          e.info === `react-transition` &&
          e.intercept({
            handler: function () {
              return new Promise(function (e) {
                return (i = e);
              });
            },
            focusReset: `manual`,
            scroll: `manual`,
          });
      }
      function t() {
        (i !== null && (i(), (i = null)), r || setTimeout(n, 20));
      }
      function n() {
        if (!r && !navigation.transition) {
          var e = navigation.currentEntry;
          e &&
            e.url != null &&
            navigation.navigate(e.url, {
              state: e.getState(),
              info: `react-transition`,
              history: `replace`,
            });
        }
      }
      if (typeof navigation == `object`) {
        var r = !1,
          i = null;
        return (
          navigation.addEventListener(`navigate`, e),
          navigation.addEventListener(`navigatesuccess`, t),
          navigation.addEventListener(`navigateerror`, t),
          setTimeout(n, 100),
          function () {
            ((r = !0),
              navigation.removeEventListener(`navigate`, e),
              navigation.removeEventListener(`navigatesuccess`, t),
              navigation.removeEventListener(`navigateerror`, t),
              i !== null && (i(), (i = null)));
          }
        );
      }
    }
    function Fp(e) {
      this._internalRoot = e;
    }
    ((Ip.prototype.render = Fp.prototype.render =
      function (e) {
        var t = this._internalRoot;
        if (t === null) throw Error(o(409));
        var n = t.current;
        np(n, pu(), e, t, null, null);
      }),
      (Ip.prototype.unmount = Fp.prototype.unmount =
        function () {
          var e = this._internalRoot;
          if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            (np(e.current, 2, null, e, null, null), bu(), (t[ht] = null));
          }
        }));
    function Ip(e) {
      this._internalRoot = e;
    }
    Ip.prototype.unstable_scheduleHydration = function (e) {
      if (e) {
        var t = dt();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
        (xp.splice(n, 0, e), n === 0 && Ep(e));
      }
    };
    var Lp = r.version;
    if (Lp !== `19.2.5`) throw Error(o(527, Lp, `19.2.5`));
    D.findDOMNode = function (e) {
      var t = e._reactInternals;
      if (t === void 0)
        throw typeof e.render == `function`
          ? Error(o(188))
          : ((e = Object.keys(e).join(`,`)), Error(o(268, e)));
      return ((e = p(t)), (e = e === null ? null : m(e)), (e = e === null ? null : e.stateNode), e);
    };
    var Rp = {
      bundleType: 0,
      version: `19.2.5`,
      rendererPackageName: `react-dom`,
      currentDispatcherRef: E,
      reconcilerVersion: `19.2.5`,
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < `u`) {
      var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!zp.isDisabled && zp.supportsFiber)
        try {
          ((He = zp.inject(Rp)), (Ue = zp));
        } catch {}
    }
    e.hydrateRoot = function (e, t, n) {
      if (!c(e)) throw Error(o(299));
      var r = !1,
        i = ``,
        a = Js,
        s = Ys,
        l = Xs,
        u = null;
      return (
        n != null &&
          (!0 === n.unstable_strictMode && (r = !0),
          n.identifierPrefix !== void 0 && (i = n.identifierPrefix),
          n.onUncaughtError !== void 0 && (a = n.onUncaughtError),
          n.onCaughtError !== void 0 && (s = n.onCaughtError),
          n.onRecoverableError !== void 0 && (l = n.onRecoverableError),
          n.formState !== void 0 && (u = n.formState)),
        (t = ep(e, 1, !0, t, n ?? null, r, i, u, a, s, l, Pp)),
        (t.context = tp(null)),
        (n = t.current),
        (r = pu()),
        (r = lt(r)),
        (i = Ga(r)),
        (i.callback = null),
        Ka(n, i, r),
        (n = r),
        (t.current.lanes = n),
        it(t, n),
        rd(t),
        (e[ht] = t.current),
        Sd(e),
        new Ip(t)
      );
    };
  }),
  l = n((e, t) => {
    function n() {
      if (
        !(
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
        )
      )
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
        } catch (e) {
          console.error(e);
        }
    }
    (n(), (t.exports = c()));
  }),
  u = new WeakMap(),
  d = new WeakMap(),
  f = { current: [] },
  p = !1,
  m = 0,
  h = new Set(),
  g = new Map();
function _(e) {
  let t = Array.from(e).sort((e, t) =>
    e instanceof ee && e.options.deps.includes(t)
      ? 1
      : t instanceof ee && t.options.deps.includes(e)
        ? -1
        : 0,
  );
  for (let e of t) {
    if (f.current.includes(e)) continue;
    (f.current.push(e), e.recompute());
    let t = d.get(e);
    if (t)
      for (let e of t) {
        let t = u.get(e);
        t && _(t);
      }
  }
}
function v(e) {
  let t = { prevVal: e.prevState, currentVal: e.state };
  for (let n of e.listeners) n(t);
}
function y(e) {
  let t = { prevVal: e.prevState, currentVal: e.state };
  for (let n of e.listeners) n(t);
}
function b(e) {
  if ((m > 0 && !g.has(e) && g.set(e, e.prevState), h.add(e), !(m > 0) && !p))
    try {
      for (p = !0; h.size > 0; ) {
        let e = Array.from(h);
        h.clear();
        for (let t of e) ((t.prevState = g.get(t) ?? t.prevState), v(t));
        for (let t of e) {
          let e = u.get(t);
          e && (f.current.push(t), _(e));
        }
        for (let t of e) {
          let e = u.get(t);
          if (e) for (let t of e) y(t);
        }
      }
    } finally {
      ((p = !1), (f.current = []), g.clear());
    }
}
function x(e) {
  m++;
  try {
    e();
  } finally {
    if ((m--, m === 0)) {
      let e = h.values().next().value;
      e && b(e);
    }
  }
}
function S(e) {
  return typeof e == `function`;
}
var C = class {
    constructor(e, t) {
      ((this.listeners = new Set()),
        (this.subscribe = (e) => {
          var t;
          this.listeners.add(e);
          let n = (t = this.options)?.onSubscribe?.call(t, e, this);
          return () => {
            (this.listeners.delete(e), n?.());
          };
        }),
        (this.prevState = e),
        (this.state = e),
        (this.options = t));
    }
    setState(e) {
      var t, n;
      ((this.prevState = this.state),
        this.options?.updateFn
          ? (this.state = this.options.updateFn(this.prevState)(e))
          : S(e)
            ? (this.state = e(this.prevState))
            : (this.state = e),
        (n = (t = this.options)?.onUpdate) == null || n.call(t),
        b(this));
    }
  },
  ee = class e {
    constructor(t) {
      ((this.listeners = new Set()),
        (this._subscriptions = []),
        (this.lastSeenDepValues = []),
        (this.getDepVals = () => {
          let e = this.options.deps.length,
            t = Array(e),
            n = Array(e);
          for (let r = 0; r < e; r++) {
            let e = this.options.deps[r];
            ((t[r] = e.prevState), (n[r] = e.state));
          }
          return (
            (this.lastSeenDepValues = n),
            { prevDepVals: t, currDepVals: n, prevVal: this.prevState ?? void 0 }
          );
        }),
        (this.recompute = () => {
          var e, t;
          this.prevState = this.state;
          let n = this.getDepVals();
          ((this.state = this.options.fn(n)),
            (t = (e = this.options).onUpdate) == null || t.call(e));
        }),
        (this.checkIfRecalculationNeededDeeply = () => {
          for (let t of this.options.deps) t instanceof e && t.checkIfRecalculationNeededDeeply();
          let t = !1,
            n = this.lastSeenDepValues,
            { currDepVals: r } = this.getDepVals();
          for (let e = 0; e < r.length; e++)
            if (r[e] !== n[e]) {
              t = !0;
              break;
            }
          t && this.recompute();
        }),
        (this.mount = () => (
          this.registerOnGraph(),
          this.checkIfRecalculationNeededDeeply(),
          () => {
            this.unregisterFromGraph();
            for (let e of this._subscriptions) e();
          }
        )),
        (this.subscribe = (e) => {
          var t;
          this.listeners.add(e);
          let n = (t = this.options).onSubscribe?.call(t, e, this);
          return () => {
            (this.listeners.delete(e), n?.());
          };
        }),
        (this.options = t),
        (this.state = t.fn({
          prevDepVals: void 0,
          prevVal: void 0,
          currDepVals: this.getDepVals().currDepVals,
        })));
    }
    registerOnGraph(t = this.options.deps) {
      for (let n of t)
        if (n instanceof e) (n.registerOnGraph(), this.registerOnGraph(n.options.deps));
        else if (n instanceof C) {
          let e = u.get(n);
          (e || ((e = new Set()), u.set(n, e)), e.add(this));
          let t = d.get(this);
          (t || ((t = new Set()), d.set(this, t)), t.add(n));
        }
    }
    unregisterFromGraph(t = this.options.deps) {
      for (let n of t)
        if (n instanceof e) this.unregisterFromGraph(n.options.deps);
        else if (n instanceof C) {
          let e = u.get(n);
          e && e.delete(this);
          let t = d.get(this);
          t && t.delete(n);
        }
    }
  },
  w = `__TSR_index`,
  te = `popstate`,
  ne = `beforeunload`;
function T(e) {
  let t = e.getLocation(),
    n = new Set(),
    r = (r) => {
      ((t = e.getLocation()), n.forEach((e) => e({ location: t, action: r })));
    },
    i = (n) => {
      (e.notifyOnIndexChange ?? !0) ? r(n) : (t = e.getLocation());
    },
    a = async ({ task: n, navigateOpts: r, ...i }) => {
      var a;
      if (r?.ignoreBlocker ?? !1) {
        n();
        return;
      }
      let o = e.getBlockers?.call(e) ?? [],
        s = i.type === `PUSH` || i.type === `REPLACE`;
      if (typeof document < `u` && o.length && s)
        for (let n of o) {
          let r = oe(i.path, i.state);
          if (await n.blockerFn({ currentLocation: t, nextLocation: r, action: i.type })) {
            (a = e.onBlocked) == null || a.call(e);
            return;
          }
        }
      n();
    };
  return {
    get location() {
      return t;
    },
    get length() {
      return e.getLength();
    },
    subscribers: n,
    subscribe: (e) => (
      n.add(e),
      () => {
        n.delete(e);
      }
    ),
    push: (n, i, o) => {
      let s = t.state[w];
      ((i = re(s + 1, i)),
        a({
          task: () => {
            (e.pushState(n, i), r({ type: `PUSH` }));
          },
          navigateOpts: o,
          type: `PUSH`,
          path: n,
          state: i,
        }));
    },
    replace: (n, i, o) => {
      let s = t.state[w];
      ((i = re(s, i)),
        a({
          task: () => {
            (e.replaceState(n, i), r({ type: `REPLACE` }));
          },
          navigateOpts: o,
          type: `REPLACE`,
          path: n,
          state: i,
        }));
    },
    go: (t, n) => {
      a({
        task: () => {
          (e.go(t), i({ type: `GO`, index: t }));
        },
        navigateOpts: n,
        type: `GO`,
      });
    },
    back: (t) => {
      a({
        task: () => {
          (e.back(t?.ignoreBlocker ?? !1), i({ type: `BACK` }));
        },
        navigateOpts: t,
        type: `BACK`,
      });
    },
    forward: (t) => {
      a({
        task: () => {
          (e.forward(t?.ignoreBlocker ?? !1), i({ type: `FORWARD` }));
        },
        navigateOpts: t,
        type: `FORWARD`,
      });
    },
    canGoBack: () => t.state[w] !== 0,
    createHref: (t) => e.createHref(t),
    block: (t) => {
      if (!e.setBlockers) return () => {};
      let n = e.getBlockers?.call(e) ?? [];
      return (
        e.setBlockers([...n, t]),
        () => {
          var n;
          let r = e.getBlockers?.call(e) ?? [];
          (n = e.setBlockers) == null ||
            n.call(
              e,
              r.filter((e) => e !== t),
            );
        }
      );
    },
    flush: () => e.flush?.call(e),
    destroy: () => e.destroy?.call(e),
    notify: r,
  };
}
function re(e, t) {
  return ((t ||= {}), { ...t, key: se(), [w]: e });
}
function ie(e) {
  let t = e?.window ?? (typeof document < `u` ? window : void 0),
    n = t.history.pushState,
    r = t.history.replaceState,
    i = [],
    a = () => i,
    o = (e) => (i = e),
    s = e?.createHref ?? ((e) => e),
    c =
      e?.parseLocation ??
      (() => oe(`${t.location.pathname}${t.location.search}${t.location.hash}`, t.history.state));
  t.history.state?.key || t.history.replaceState({ [w]: 0, key: se() }, ``);
  let l = c(),
    u,
    d = !1,
    f = !1,
    p = !1,
    m = !1,
    h = () => l,
    g,
    _,
    v = () => {
      g &&
        ((C._ignoreSubscribers = !0),
        (g.isPush ? t.history.pushState : t.history.replaceState)(g.state, ``, g.href),
        (C._ignoreSubscribers = !1),
        (g = void 0),
        (_ = void 0),
        (u = void 0));
    },
    y = (e, t, n) => {
      let r = s(t);
      (_ || (u = l),
        (l = oe(t, n)),
        (g = { href: r, state: n, isPush: g?.isPush || e === `push` }),
        (_ ||= Promise.resolve().then(() => v())));
    },
    b = (e) => {
      ((l = c()), C.notify({ type: e }));
    },
    x = async () => {
      if (f) {
        f = !1;
        return;
      }
      let e = c(),
        n = e.state[w] - l.state[w],
        r = n === 1,
        i = n === -1,
        o = (!r && !i) || d;
      d = !1;
      let s = o ? `GO` : i ? `BACK` : `FORWARD`,
        u = o ? { type: `GO`, index: n } : { type: i ? `BACK` : `FORWARD` };
      if (p) p = !1;
      else {
        let n = a();
        if (typeof document < `u` && n.length) {
          for (let r of n)
            if (await r.blockerFn({ currentLocation: l, nextLocation: e, action: s })) {
              ((f = !0), t.history.go(1), C.notify(u));
              return;
            }
        }
      }
      ((l = c()), C.notify(u));
    },
    S = (e) => {
      if (m) {
        m = !1;
        return;
      }
      let t = !1,
        n = a();
      if (typeof document < `u` && n.length)
        for (let e of n) {
          let n = e.enableBeforeUnload ?? !0;
          if (n === !0) {
            t = !0;
            break;
          }
          if (typeof n == `function` && n() === !0) {
            t = !0;
            break;
          }
        }
      if (t) return (e.preventDefault(), (e.returnValue = ``));
    },
    C = T({
      getLocation: h,
      getLength: () => t.history.length,
      pushState: (e, t) => y(`push`, e, t),
      replaceState: (e, t) => y(`replace`, e, t),
      back: (e) => (e && (p = !0), (m = !0), t.history.back()),
      forward: (e) => {
        (e && (p = !0), (m = !0), t.history.forward());
      },
      go: (e) => {
        ((d = !0), t.history.go(e));
      },
      createHref: (e) => s(e),
      flush: v,
      destroy: () => {
        ((t.history.pushState = n),
          (t.history.replaceState = r),
          t.removeEventListener(ne, S, { capture: !0 }),
          t.removeEventListener(te, x));
      },
      onBlocked: () => {
        u && l !== u && (l = u);
      },
      getBlockers: a,
      setBlockers: o,
      notifyOnIndexChange: !1,
    });
  return (
    t.addEventListener(ne, S, { capture: !0 }),
    t.addEventListener(te, x),
    (t.history.pushState = function (...e) {
      let r = n.apply(t.history, e);
      return (C._ignoreSubscribers || b(`PUSH`), r);
    }),
    (t.history.replaceState = function (...e) {
      let n = r.apply(t.history, e);
      return (C._ignoreSubscribers || b(`REPLACE`), n);
    }),
    C
  );
}
function ae(e = { initialEntries: [`/`] }) {
  let t = e.initialEntries,
    n = e.initialIndex ? Math.min(Math.max(e.initialIndex, 0), t.length - 1) : t.length - 1,
    r = t.map((e, t) => re(t, void 0));
  return T({
    getLocation: () => oe(t[n], r[n]),
    getLength: () => t.length,
    pushState: (e, i) => {
      (n < t.length - 1 && (t.splice(n + 1), r.splice(n + 1)),
        r.push(i),
        t.push(e),
        (n = Math.max(t.length - 1, 0)));
    },
    replaceState: (e, i) => {
      ((r[n] = i), (t[n] = e));
    },
    back: () => {
      n = Math.max(n - 1, 0);
    },
    forward: () => {
      n = Math.min(n + 1, t.length - 1);
    },
    go: (e) => {
      n = Math.min(Math.max(n + e, 0), t.length - 1);
    },
    createHref: (e) => e,
  });
}
function oe(e, t) {
  let n = e.indexOf(`#`),
    r = e.indexOf(`?`);
  return {
    href: e,
    pathname: e.substring(0, n > 0 ? (r > 0 ? Math.min(n, r) : n) : r > 0 ? r : e.length),
    hash: n > -1 ? e.substring(n) : ``,
    search: r > -1 ? e.slice(r, n === -1 ? void 0 : n) : ``,
    state: t || { [w]: 0, key: se() },
  };
}
function se() {
  return (Math.random() + 1).toString(36).substring(7);
}
var ce = !0,
  le = `Invariant failed`;
function E(e, t) {
  if (!e) {
    if (ce) throw Error(le);
    var n = typeof t == `function` ? t() : t,
      r = n ? `${le}: ${n}` : le;
    throw Error(r);
  }
}
function D(e) {
  return e[e.length - 1];
}
function ue(e) {
  return typeof e == `function`;
}
function de(e, t) {
  return ue(e) ? e(t) : e;
}
function fe(e, t) {
  return t.reduce((t, n) => ((t[n] = e[n]), t), {});
}
function O(e, t) {
  if (e === t) return e;
  let n = t,
    r = me(e) && me(n);
  if (r || (k(e) && k(n))) {
    let t = r ? e : Object.keys(e).concat(Object.getOwnPropertySymbols(e)),
      i = t.length,
      a = r ? n : Object.keys(n).concat(Object.getOwnPropertySymbols(n)),
      o = a.length,
      s = r ? [] : {},
      c = 0;
    for (let i = 0; i < o; i++) {
      let o = r ? i : a[i];
      ((!r && t.includes(o)) || r) && e[o] === void 0 && n[o] === void 0
        ? ((s[o] = void 0), c++)
        : ((s[o] = O(e[o], n[o])), s[o] === e[o] && e[o] !== void 0 && c++);
    }
    return i === o && c === i ? e : s;
  }
  return n;
}
function k(e) {
  return A(e) && Object.getOwnPropertyNames(e).length === Object.keys(e).length;
}
function A(e) {
  if (!pe(e)) return !1;
  let t = e.constructor;
  if (t === void 0) return !0;
  let n = t.prototype;
  return !(!pe(n) || !n.hasOwnProperty(`isPrototypeOf`));
}
function pe(e) {
  return Object.prototype.toString.call(e) === `[object Object]`;
}
function me(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length;
}
function he(e, t) {
  let n = Object.keys(e);
  return (t && (n = n.filter((t) => e[t] !== void 0)), n);
}
function ge(e, t, n) {
  if (e === t) return !0;
  if (typeof e != typeof t) return !1;
  if (A(e) && A(t)) {
    let r = n?.ignoreUndefined ?? !0,
      i = he(e, r),
      a = he(t, r);
    return !n?.partial && i.length !== a.length ? !1 : a.every((r) => ge(e[r], t[r], n));
  }
  return Array.isArray(e) && Array.isArray(t) && e.length === t.length
    ? !e.some((e, r) => !ge(e, t[r], n))
    : !1;
}
function _e(e) {
  let t,
    n,
    r = new Promise((e, r) => {
      ((t = e), (n = r));
    });
  return (
    (r.status = `pending`),
    (r.resolve = (n) => {
      ((r.status = `resolved`), (r.value = n), t(n), e?.(n));
    }),
    (r.reject = (e) => {
      ((r.status = `rejected`), n(e));
    }),
    r
  );
}
function ve(e) {
  return ye(e.filter((e) => e !== void 0).join(`/`));
}
function ye(e) {
  return e.replace(/\/{2,}/g, `/`);
}
function be(e) {
  return e === `/` ? e : e.replace(/^\/{1,}/, ``);
}
function xe(e) {
  return e === `/` ? e : e.replace(/\/{1,}$/, ``);
}
function Se(e) {
  return xe(be(e));
}
function Ce(e, t) {
  return e?.endsWith(`/`) && e !== `/` && e !== `${t}/` ? e.slice(0, -1) : e;
}
function we(e, t, n) {
  return Ce(e, n) === Ce(t, n);
}
function Te({ basepath: e, base: t, to: n, trailingSlash: r = `never`, caseSensitive: i }) {
  ((t = Ae(e, t, i)), (n = Ae(e, n, i)));
  let a = Ee(t),
    o = Ee(n);
  return (
    a.length > 1 && D(a)?.value === `/` && a.pop(),
    o.forEach((e, t) => {
      e.value === `/`
        ? t
          ? t === o.length - 1 && a.push(e)
          : (a = [e])
        : e.value === `..`
          ? a.pop()
          : e.value === `.` || a.push(e);
    }),
    a.length > 1 &&
      (D(a)?.value === `/`
        ? r === `never` && a.pop()
        : r === `always` && a.push({ type: `pathname`, value: `/` })),
    ye(ve([e, ...a.map((e) => e.value)]))
  );
}
function Ee(e) {
  if (!e) return [];
  e = ye(e);
  let t = [];
  if (
    (e.slice(0, 1) === `/` && ((e = e.substring(1)), t.push({ type: `pathname`, value: `/` })), !e)
  )
    return t;
  let n = e.split(`/`).filter(Boolean);
  return (
    t.push(
      ...n.map((e) =>
        e === `$` || e === `*`
          ? { type: `wildcard`, value: e }
          : e.charAt(0) === `$`
            ? { type: `param`, value: e }
            : {
                type: `pathname`,
                value: e.includes(`%25`)
                  ? e
                      .split(`%25`)
                      .map((e) => decodeURI(e))
                      .join(`%25`)
                  : decodeURI(e),
              },
      ),
    ),
    e.slice(-1) === `/` && ((e = e.substring(1)), t.push({ type: `pathname`, value: `/` })),
    t
  );
}
function De({ path: e, params: t, leaveWildcards: n, leaveParams: r, decodeCharMap: i }) {
  let a = Ee(e);
  function o(e) {
    let n = t[e],
      r = typeof n == `string`;
    return [`*`, `_splat`].includes(e) ? (r ? encodeURI(n) : n) : r ? Oe(n, i) : n;
  }
  let s = !1,
    c = {};
  return {
    usedParams: c,
    interpolatedPath: ve(
      a.map((e) => {
        if (e.type === `wildcard`) {
          c._splat = t._splat;
          let r = o(`_splat`);
          return n ? `${e.value}${r ?? ``}` : r;
        }
        if (e.type === `param`) {
          let n = e.value.substring(1);
          if ((!s && !(n in t) && (s = !0), (c[n] = t[n]), r)) {
            let t = o(e.value);
            return `${e.value}${t ?? ``}`;
          }
          return o(n) ?? `undefined`;
        }
        return e.value;
      }),
    ),
    isMissingParams: s,
  };
}
function Oe(e, t) {
  let n = encodeURIComponent(e);
  if (t) for (let [e, r] of t) n = n.replaceAll(e, r);
  return n;
}
function ke(e, t, n) {
  let r = je(e, t, n);
  if (!(n.to && !r)) return r ?? {};
}
function Ae(e, t, n = !1) {
  let r = n ? e : e.toLowerCase(),
    i = n ? t : t.toLowerCase();
  switch (!0) {
    case r === `/`:
      return t;
    case i === r:
      return ``;
    case t.length < e.length:
      return t;
    case i[r.length] !== `/`:
      return t;
    case i.startsWith(r):
      return t.slice(e.length);
    default:
      return t;
  }
}
function je(e, t, n) {
  if (e !== `/` && !t.startsWith(e)) return;
  t = Ae(e, t, n.caseSensitive);
  let r = Ae(e, `${n.to ?? `$`}`, n.caseSensitive),
    i = Ee(t),
    a = Ee(r);
  (t.startsWith(`/`) || i.unshift({ type: `pathname`, value: `/` }),
    r.startsWith(`/`) || a.unshift({ type: `pathname`, value: `/` }));
  let o = {};
  return (() => {
    for (let e = 0; e < Math.max(i.length, a.length); e++) {
      let t = i[e],
        r = a[e],
        s = e >= i.length - 1,
        c = e >= a.length - 1;
      if (r) {
        if (r.type === `wildcard`) {
          let t = decodeURI(ve(i.slice(e).map((e) => e.value)));
          return ((o[`*`] = t), (o._splat = t), !0);
        }
        if (r.type === `pathname`) {
          if (r.value === `/` && !t?.value) return !0;
          if (t) {
            if (n.caseSensitive) {
              if (r.value !== t.value) return !1;
            } else if (r.value.toLowerCase() !== t.value.toLowerCase()) return !1;
          }
        }
        if (!t) return !1;
        if (r.type === `param`) {
          if (t.value === `/`) return !1;
          t.value.charAt(0) !== `$` && (o[r.value.substring(1)] = decodeURIComponent(t.value));
        }
      }
      if (!s && c)
        return ((o[`**`] = ve(i.slice(e + 1).map((e) => e.value))), !!n.fuzzy && r?.value !== `/`);
    }
    return !0;
  })()
    ? o
    : void 0;
}
function Me(e) {
  return !!e?.isNotFound;
}
function Ne() {
  try {
    if (typeof window < `u` && typeof window.sessionStorage == `object`)
      return window.sessionStorage;
  } catch {
    return;
  }
}
var Pe = `tsr-scroll-restoration-v1_3`,
  Fe = (e, t) => {
    let n;
    return (...r) => {
      n ||= setTimeout(() => {
        (e(...r), (n = null));
      }, t);
    };
  };
function Ie() {
  let e = Ne();
  if (!e) return;
  let t = e.getItem(Pe),
    n = t ? JSON.parse(t) : {};
  return { state: n, set: (t) => ((n = de(t, n) || n), e.setItem(Pe, JSON.stringify(n))) };
}
var Le = Ie(),
  Re = (e) => e.state.key || e.href;
function ze(e) {
  let t = [],
    n;
  for (; (n = e.parentNode); )
    (t.unshift(`${e.tagName}:nth-child(${[].indexOf.call(n.children, e) + 1})`), (e = n));
  return `${t.join(` > `)}`.toLowerCase();
}
var Be = !1;
function Ve(e, t, n, r, i) {
  let a;
  try {
    a = JSON.parse(sessionStorage.getItem(e) || `{}`);
  } catch (e) {
    console.error(e);
    return;
  }
  let o = t || window.history.state?.key,
    s = a[o];
  ((Be = !0),
    (() => {
      if (r && s) {
        for (let e in s) {
          let t = s[e];
          if (e === `window`) window.scrollTo({ top: t.scrollY, left: t.scrollX, behavior: n });
          else if (e) {
            let n = document.querySelector(e);
            n && ((n.scrollLeft = t.scrollX), (n.scrollTop = t.scrollY));
          }
        }
        return;
      }
      let e = window.location.hash.split(`#`)[1];
      if (e) {
        let t = (window.history.state || {}).__hashScrollIntoViewOptions ?? !0;
        if (t) {
          let n = document.getElementById(e);
          n && n.scrollIntoView(t);
        }
        return;
      }
      [`window`, ...(i?.filter((e) => e !== `window`) ?? [])].forEach((e) => {
        let t = e === `window` ? window : typeof e == `function` ? e() : document.querySelector(e);
        t && t.scrollTo({ top: 0, left: 0, behavior: n });
      });
    })(),
    (Be = !1));
}
function He(e, t) {
  if (
    Le === void 0 ||
    ((t ?? e.options.scrollRestoration ?? !1) && (e.isScrollRestoring = !0),
    typeof document > `u` || e.isScrollRestorationSetup)
  )
    return;
  ((e.isScrollRestorationSetup = !0), (Be = !1));
  let n = e.options.getScrollRestorationKey || Re;
  ((window.history.scrollRestoration = `manual`),
    typeof document < `u` &&
      document.addEventListener(
        `scroll`,
        Fe((t) => {
          if (Be || !e.isScrollRestoring) return;
          let r = ``;
          if (t.target === document || t.target === window) r = `window`;
          else {
            let e = t.target.getAttribute(`data-scroll-restoration-id`);
            r = e ? `[data-scroll-restoration-id="${e}"]` : ze(t.target);
          }
          let i = n(e.state.location);
          Le.set((e) => {
            let t = (e[i] = e[i] || {}),
              n = (t[r] = t[r] || {});
            if (r === `window`)
              ((n.scrollX = window.scrollX || 0), (n.scrollY = window.scrollY || 0));
            else if (r) {
              let e = document.querySelector(r);
              e && ((n.scrollX = e.scrollLeft || 0), (n.scrollY = e.scrollTop || 0));
            }
            return e;
          });
        }, 100),
        !0,
      ),
    e.subscribe(`onRendered`, (t) => {
      let r = n(t.toLocation);
      if (!e.resetNextScroll) {
        e.resetNextScroll = !0;
        return;
      }
      (Ve(
        Pe,
        r,
        e.options.scrollRestorationBehavior || void 0,
        e.isScrollRestoring || void 0,
        e.options.scrollToTopSelectors || void 0,
      ),
        e.isScrollRestoring && Le.set((e) => ((e[r] = e[r] || {}), e)));
    }));
}
function Ue(e) {
  if (typeof document < `u` && document.querySelector) {
    let t = e.state.location.state.__hashScrollIntoViewOptions ?? !0;
    if (t && e.state.location.hash !== ``) {
      let n = document.getElementById(e.state.location.hash);
      n && n.scrollIntoView(t);
    }
  }
}
function We(e, t) {
  let n = Object.entries(e).flatMap(([e, t]) =>
      Array.isArray(t) ? t.map((t) => [e, String(t)]) : [[e, String(t)]],
    ),
    r = new URLSearchParams(n);
  return (t || ``) + r.toString();
}
function Ge(e) {
  return e ? (e === `false` ? !1 : e === `true` ? !0 : e * 0 == 0 && +e + `` === e ? +e : e) : ``;
}
function Ke(e, t) {
  let n = t ? e.slice(t.length) : e;
  return [...new URLSearchParams(n).entries()].reduce((e, [t, n]) => {
    let r = e[t];
    return (r == null ? (e[t] = Ge(n)) : (e[t] = Array.isArray(r) ? [...r, Ge(n)] : [r, Ge(n)]), e);
  }, {});
}
var qe = Ye(JSON.parse),
  Je = Xe(JSON.stringify, JSON.parse);
function Ye(e) {
  return (t) => {
    t.substring(0, 1) === `?` && (t = t.substring(1));
    let n = Ke(t);
    for (let t in n) {
      let r = n[t];
      if (typeof r == `string`)
        try {
          n[t] = e(r);
        } catch {}
    }
    return n;
  };
}
function Xe(e, t) {
  function n(n) {
    if (typeof n == `object` && n)
      try {
        return e(n);
      } catch {}
    else if (typeof n == `string` && typeof t == `function`)
      try {
        return (t(n), e(n));
      } catch {}
    return n;
  }
  return (e) => {
    ((e = { ...e }),
      Object.keys(e).forEach((t) => {
        let r = e[t];
        r === void 0 || r === void 0 ? delete e[t] : (e[t] = n(r));
      }));
    let t = We(e).toString();
    return t ? `?${t}` : ``;
  };
}
var Ze = `__root__`;
function Qe(e) {
  return !!e?.isRedirect;
}
function $e(e) {
  return !!e?.isRedirect && e.href;
}
function et(e) {
  return e instanceof Error ? { name: e.name, message: e.message } : { data: e };
}
function tt(e) {
  let t = e.resolvedLocation,
    n = e.location;
  return {
    fromLocation: t,
    toLocation: n,
    pathChanged: t?.pathname !== n.pathname,
    hrefChanged: t?.href !== n.href,
    hashChanged: t?.hash !== n.hash,
  };
}
var nt = class {
    constructor(e) {
      ((this.tempLocationKey = `${Math.round(Math.random() * 1e7)}`),
        (this.resetNextScroll = !0),
        (this.shouldViewTransition = void 0),
        (this.isViewTransitionTypesSupported = void 0),
        (this.subscribers = new Set()),
        (this.isScrollRestoring = !1),
        (this.isScrollRestorationSetup = !1),
        (this.startTransition = (e) => e()),
        (this.update = (e) => {
          e.notFoundRoute &&
            console.warn(
              `The notFoundRoute API is deprecated and will be removed in the next major version. See https://tanstack.com/router/v1/docs/framework/react/guide/not-found-errors#migrating-from-notfoundroute for more info.`,
            );
          let t = this.options;
          ((this.options = { ...this.options, ...e }),
            (this.isServer = this.options.isServer ?? typeof document > `u`),
            (this.pathParamsDecodeCharMap = this.options.pathParamsAllowedCharacters
              ? new Map(
                  this.options.pathParamsAllowedCharacters.map((e) => [encodeURIComponent(e), e]),
                )
              : void 0),
            (!this.basepath || (e.basepath && e.basepath !== t.basepath)) &&
              (e.basepath === void 0 || e.basepath === `` || e.basepath === `/`
                ? (this.basepath = `/`)
                : (this.basepath = `/${Se(e.basepath)}`)),
            (!this.history || (this.options.history && this.options.history !== this.history)) &&
              ((this.history =
                this.options.history ??
                (this.isServer ? ae({ initialEntries: [this.basepath || `/`] }) : ie())),
              (this.latestLocation = this.parseLocation())),
            this.options.routeTree !== this.routeTree &&
              ((this.routeTree = this.options.routeTree), this.buildRouteTree()),
            this.__store ||
              ((this.__store = new C(at(this.latestLocation), {
                onUpdate: () => {
                  this.__store.state = {
                    ...this.state,
                    cachedMatches: this.state.cachedMatches.filter(
                      (e) => ![`redirected`].includes(e.status),
                    ),
                  };
                },
              })),
              He(this)),
            typeof window < `u` &&
              `CSS` in window &&
              typeof window.CSS?.supports == `function` &&
              (this.isViewTransitionTypesSupported = window.CSS.supports(
                `selector(:active-view-transition-type(a)`,
              )));
        }),
        (this.buildRouteTree = () => {
          ((this.routesById = {}), (this.routesByPath = {}));
          let e = this.options.notFoundRoute;
          e &&
            (e.init({ originalIndex: 99999999999, defaultSsr: this.options.defaultSsr }),
            (this.routesById[e.id] = e));
          let t = (e) => {
            e.forEach((e, n) => {
              e.init({ originalIndex: n, defaultSsr: this.options.defaultSsr });
              let r = this.routesById[e.id];
              if (
                (E(!r, `Duplicate routes found with id: ${String(e.id)}`),
                (this.routesById[e.id] = e),
                !e.isRoot && e.path)
              ) {
                let t = xe(e.fullPath);
                (!this.routesByPath[t] || e.fullPath.endsWith(`/`)) && (this.routesByPath[t] = e);
              }
              let i = e.children;
              i?.length && t(i);
            });
          };
          t([this.routeTree]);
          let n = [];
          (Object.values(this.routesById).forEach((e, t) => {
            if (e.isRoot || !e.path) return;
            let r = be(e.fullPath),
              i = Ee(r);
            for (; i.length > 1 && i[0]?.value === `/`; ) i.shift();
            let a = i.map((e) =>
              e.value === `/` ? 0.75 : e.type === `param` ? 0.5 : e.type === `wildcard` ? 0.25 : 1,
            );
            n.push({ child: e, trimmed: r, parsed: i, index: t, scores: a });
          }),
            (this.flatRoutes = n
              .sort((e, t) => {
                let n = Math.min(e.scores.length, t.scores.length);
                for (let r = 0; r < n; r++)
                  if (e.scores[r] !== t.scores[r]) return t.scores[r] - e.scores[r];
                if (e.scores.length !== t.scores.length) return t.scores.length - e.scores.length;
                for (let r = 0; r < n; r++)
                  if (e.parsed[r].value !== t.parsed[r].value)
                    return e.parsed[r].value > t.parsed[r].value ? 1 : -1;
                return e.index - t.index;
              })
              .map((e, t) => ((e.child.rank = t), e.child))));
        }),
        (this.subscribe = (e, t) => {
          let n = { eventType: e, fn: t };
          return (
            this.subscribers.add(n),
            () => {
              this.subscribers.delete(n);
            }
          );
        }),
        (this.emit = (e) => {
          this.subscribers.forEach((t) => {
            t.eventType === e.type && t.fn(e);
          });
        }),
        (this.parseLocation = (e, t) => {
          let n = ({ pathname: t, search: n, hash: r, state: i }) => {
              let a = this.options.parseSearch(n),
                o = this.options.stringifySearch(a);
              return {
                pathname: t,
                searchStr: o,
                search: O(e?.search, a),
                hash: r.split(`#`).reverse()[0] ?? ``,
                href: `${t}${o}${r}`,
                state: O(e?.state, i),
              };
            },
            r = n(t ?? this.history.location),
            { __tempLocation: i, __tempKey: a } = r.state;
          if (i && (!a || a === this.tempLocationKey)) {
            let e = n(i);
            return (
              (e.state.key = r.state.key),
              delete e.state.__tempLocation,
              { ...e, maskedLocation: r }
            );
          }
          return r;
        }),
        (this.resolvePathWithBase = (e, t) =>
          Te({
            basepath: this.basepath,
            base: e,
            to: ye(t),
            trailingSlash: this.options.trailingSlash,
            caseSensitive: this.options.caseSensitive,
          })),
        (this.matchRoutes = (e, t, n) =>
          typeof e == `string`
            ? this.matchRoutesInternal({ pathname: e, search: t }, n)
            : this.matchRoutesInternal(e, t)),
        (this.getMatchedRoutes = (e, t) => {
          let n = {},
            r = xe(e.pathname),
            i = (e) =>
              ke(this.basepath, r, {
                to: e.fullPath,
                caseSensitive: e.options.caseSensitive ?? this.options.caseSensitive,
                fuzzy: !0,
              }),
            a = t?.to === void 0 ? void 0 : this.routesByPath[t.to];
          a
            ? (n = i(a))
            : (a = this.flatRoutes.find((e) => {
                let t = i(e);
                return t ? ((n = t), !0) : !1;
              }));
          let o = a || this.routesById.__root__,
            s = [o];
          for (; o.parentRoute; ) ((o = o.parentRoute), s.unshift(o));
          return { matchedRoutes: s, routeParams: n, foundRoute: a };
        }),
        (this.cancelMatch = (e) => {
          let t = this.getMatch(e);
          t && (t.abortController.abort(), clearTimeout(t.pendingTimeout));
        }),
        (this.cancelMatches = () => {
          var e;
          (e = this.state.pendingMatches) == null ||
            e.forEach((e) => {
              this.cancelMatch(e.id);
            });
        }),
        (this.buildLocation = (e) => {
          let t = (t = {}, n) => {
              let r = t._fromLocation
                  ? this.matchRoutes(t._fromLocation, { _buildLocation: !0 })
                  : this.state.matches,
                i =
                  t.from == null
                    ? void 0
                    : r.find((e) =>
                        ke(this.basepath, xe(e.pathname), {
                          to: t.from,
                          caseSensitive: !1,
                          fuzzy: !1,
                        }),
                      ),
                a = i?.pathname || this.latestLocation.pathname;
              E(t.from == null || i != null, `Could not find match for from: ` + t.from);
              let o = this.state.pendingMatches?.length
                  ? D(this.state.pendingMatches)?.search
                  : D(r)?.search || this.latestLocation.search,
                s = n?.matchedRoutes.filter((e) => r.find((t) => t.routeId === e.id)),
                c;
              if (t.to) {
                let e = i?.fullPath || D(r)?.fullPath || this.latestLocation.pathname;
                c = this.resolvePathWithBase(e, `${t.to}`);
              } else {
                let e =
                  this.routesById[
                    s?.find((e) => {
                      let t = De({
                        path: e.fullPath,
                        params: n?.routeParams ?? {},
                        decodeCharMap: this.pathParamsDecodeCharMap,
                      }).interpolatedPath;
                      return ve([this.basepath, t]) === a;
                    })?.id
                  ];
                c = this.resolvePathWithBase(a, e?.to ?? a);
              }
              let l = { ...D(r)?.params },
                u = (t.params ?? !0) === !0 ? l : { ...l, ...de(t.params, l) };
              (Object.keys(u).length > 0 &&
                n?.matchedRoutes
                  .map((e) => e.options.params?.stringify ?? e.options.stringifyParams)
                  .filter(Boolean)
                  .forEach((e) => {
                    u = { ...u, ...e(u) };
                  }),
                (c = De({
                  path: c,
                  params: u ?? {},
                  leaveWildcards: !1,
                  leaveParams: e.leaveParams,
                  decodeCharMap: this.pathParamsDecodeCharMap,
                }).interpolatedPath));
              let d = o;
              if (e._includeValidateSearch && this.options.search?.strict) {
                let e = {};
                (n?.matchedRoutes.forEach((t) => {
                  try {
                    t.options.validateSearch &&
                      (e = { ...e, ...(ot(t.options.validateSearch, { ...e, ...d }) ?? {}) });
                  } catch {}
                }),
                  (d = e));
              }
              ((d = ((r) => {
                let i =
                  n?.matchedRoutes.reduce((t, n) => {
                    let r = [];
                    return (
                      `search` in n.options
                        ? n.options.search?.middlewares && r.push(...n.options.search.middlewares)
                        : (n.options.preSearchFilters || n.options.postSearchFilters) &&
                          r.push(({ search: e, next: t }) => {
                            let r = e;
                            `preSearchFilters` in n.options &&
                              n.options.preSearchFilters &&
                              (r = n.options.preSearchFilters.reduce((e, t) => t(e), e));
                            let i = t(r);
                            return `postSearchFilters` in n.options && n.options.postSearchFilters
                              ? n.options.postSearchFilters.reduce((e, t) => t(e), i)
                              : i;
                          }),
                      e._includeValidateSearch &&
                        n.options.validateSearch &&
                        r.push(({ search: e, next: t }) => {
                          let r = t(e);
                          try {
                            return { ...r, ...(ot(n.options.validateSearch, r) ?? {}) };
                          } catch {
                            return r;
                          }
                        }),
                      t.concat(r)
                    );
                  }, []) ?? [];
                i.push(({ search: e }) =>
                  t.search ? (t.search === !0 ? e : de(t.search, e)) : {},
                );
                let a = (e, t) => {
                  if (e >= i.length) return t;
                  let n = i[e];
                  return n({ search: t, next: (t) => a(e + 1, t) });
                };
                return a(0, r);
              })(d)),
                (d = O(o, d)));
              let f = this.options.stringifySearch(d),
                p =
                  t.hash === !0
                    ? this.latestLocation.hash
                    : t.hash
                      ? de(t.hash, this.latestLocation.hash)
                      : void 0,
                m = p ? `#${p}` : ``,
                h =
                  t.state === !0
                    ? this.latestLocation.state
                    : t.state
                      ? de(t.state, this.latestLocation.state)
                      : {};
              return (
                (h = O(this.latestLocation.state, h)),
                {
                  pathname: c,
                  search: d,
                  searchStr: f,
                  state: h,
                  hash: p ?? ``,
                  href: `${c}${f}${m}`,
                  unmaskOnReload: t.unmaskOnReload,
                }
              );
            },
            n = (n = {}, r) => {
              let i = t(n),
                a = r ? t(r) : void 0;
              if (!a) {
                let n = {},
                  o = this.options.routeMasks?.find((e) => {
                    let t = ke(this.basepath, i.pathname, {
                      to: e.from,
                      caseSensitive: !1,
                      fuzzy: !1,
                    });
                    return t ? ((n = t), !0) : !1;
                  });
                if (o) {
                  let { from: i, ...s } = o;
                  ((r = { ...fe(e, [`from`]), ...s, params: n }), (a = t(r)));
                }
              }
              let o = t(n, this.getMatchedRoutes(i, n));
              if (a) {
                let e = this.getMatchedRoutes(a, r);
                o.maskedLocation = t(r, e);
              }
              return o;
            };
          return e.mask ? n(e, { ...fe(e, [`from`]), ...e.mask }) : n(e);
        }),
        (this.commitLocation = ({ viewTransition: e, ignoreBlocker: t, ...n }) => {
          let r = () => {
              let e = [`key`, `__TSR_index`, `__hashScrollIntoViewOptions`];
              e.forEach((e) => {
                n.state[e] = this.latestLocation.state[e];
              });
              let t = ge(n.state, this.latestLocation.state);
              return (
                e.forEach((e) => {
                  delete n.state[e];
                }),
                t
              );
            },
            i = this.latestLocation.href === n.href,
            a = this.commitLocationPromise;
          if (
            ((this.commitLocationPromise = _e(() => {
              a?.resolve();
            })),
            i && r())
          )
            this.load();
          else {
            let { maskedLocation: r, hashScrollIntoView: i, ...a } = n;
            (r &&
              ((a = {
                ...r,
                state: {
                  ...r.state,
                  __tempKey: void 0,
                  __tempLocation: {
                    ...a,
                    search: a.searchStr,
                    state: { ...a.state, __tempKey: void 0, __tempLocation: void 0, key: void 0 },
                  },
                },
              }),
              (a.unmaskOnReload ?? this.options.unmaskOnReload ?? !1) &&
                (a.state.__tempKey = this.tempLocationKey)),
              (a.state.__hashScrollIntoViewOptions =
                i ?? this.options.defaultHashScrollIntoView ?? !0),
              (this.shouldViewTransition = e),
              this.history[n.replace ? `replace` : `push`](a.href, a.state, { ignoreBlocker: t }));
          }
          return (
            (this.resetNextScroll = n.resetScroll ?? !0),
            this.history.subscribers.size || this.load(),
            this.commitLocationPromise
          );
        }),
        (this.buildAndCommitLocation = ({
          replace: e,
          resetScroll: t,
          hashScrollIntoView: n,
          viewTransition: r,
          ignoreBlocker: i,
          href: a,
          ...o
        } = {}) => {
          if (a) {
            let t = this.history.location.state.__TSR_index,
              n = oe(a, { __TSR_index: e ? t : t + 1 });
            ((o.to = n.pathname),
              (o.search = this.options.parseSearch(n.search)),
              (o.hash = n.hash.slice(1)));
          }
          let s = this.buildLocation({ ...o, _includeValidateSearch: !0 });
          return this.commitLocation({
            ...s,
            viewTransition: r,
            replace: e,
            resetScroll: t,
            hashScrollIntoView: n,
            ignoreBlocker: i,
          });
        }),
        (this.navigate = ({ to: e, reloadDocument: t, href: n, ...r }) => {
          if (t) {
            if (!n) {
              let t = this.buildLocation({ to: e, ...r });
              n = this.history.createHref(t.href);
            }
            r.replace ? window.location.replace(n) : (window.location.href = n);
            return;
          }
          return this.buildAndCommitLocation({ ...r, href: n, to: e });
        }),
        (this.load = async (e) => {
          this.latestLocation = this.parseLocation(this.latestLocation);
          let t, n, r;
          for (
            r = new Promise((i) => {
              this.startTransition(async () => {
                var a;
                try {
                  let t = this.latestLocation,
                    n = this.state.resolvedLocation;
                  this.cancelMatches();
                  let r;
                  (x(() => {
                    ((r = this.matchRoutes(t)),
                      this.__store.setState((e) => ({
                        ...e,
                        status: `pending`,
                        isLoading: !0,
                        location: t,
                        pendingMatches: r,
                        cachedMatches: e.cachedMatches.filter((e) => !r.find((t) => t.id === e.id)),
                      })));
                  }),
                    this.state.redirect ||
                      this.emit({
                        type: `onBeforeNavigate`,
                        ...tt({ resolvedLocation: n, location: t }),
                      }),
                    this.emit({
                      type: `onBeforeLoad`,
                      ...tt({ resolvedLocation: n, location: t }),
                    }),
                    await this.loadMatches({
                      sync: e?.sync,
                      matches: r,
                      location: t,
                      onReady: async () => {
                        this.startViewTransition(async () => {
                          let e, t, n;
                          (x(() => {
                            (this.__store.setState((r) => {
                              let i = r.matches,
                                a = r.pendingMatches || r.matches;
                              return (
                                (e = i.filter((e) => !a.find((t) => t.id === e.id))),
                                (t = a.filter((e) => !i.find((t) => t.id === e.id))),
                                (n = i.filter((e) => a.find((t) => t.id === e.id))),
                                {
                                  ...r,
                                  isLoading: !1,
                                  loadedAt: Date.now(),
                                  matches: a,
                                  pendingMatches: void 0,
                                  cachedMatches: [
                                    ...r.cachedMatches,
                                    ...e.filter((e) => e.status !== `error`),
                                  ],
                                }
                              );
                            }),
                              this.clearExpiredCache());
                          }),
                            [
                              [e, `onLeave`],
                              [t, `onEnter`],
                              [n, `onStay`],
                            ].forEach(([e, t]) => {
                              e.forEach((e) => {
                                var n, r;
                                (r = (n = this.looseRoutesById[e.routeId].options)[t]) == null ||
                                  r.call(n, e);
                              });
                            }));
                        });
                      },
                    }));
                } catch (e) {
                  ($e(e)
                    ? ((t = e),
                      this.isServer || this.navigate({ ...t, replace: !0, ignoreBlocker: !0 }))
                    : Me(e) && (n = e),
                    this.__store.setState((e) => ({
                      ...e,
                      statusCode: t
                        ? t.statusCode
                        : n
                          ? 404
                          : e.matches.some((e) => e.status === `error`)
                            ? 500
                            : 200,
                      redirect: t,
                    })));
                }
                (this.latestLoadPromise === r &&
                  ((a = this.commitLocationPromise) == null || a.resolve(),
                  (this.latestLoadPromise = void 0),
                  (this.commitLocationPromise = void 0)),
                  i());
              });
            }),
              this.latestLoadPromise = r,
              await r;
            this.latestLoadPromise && r !== this.latestLoadPromise;
          )
            await this.latestLoadPromise;
          this.hasNotFoundMatch() && this.__store.setState((e) => ({ ...e, statusCode: 404 }));
        }),
        (this.startViewTransition = (e) => {
          let t = this.shouldViewTransition ?? this.options.defaultViewTransition;
          if (
            (delete this.shouldViewTransition,
            t &&
              typeof document < `u` &&
              `startViewTransition` in document &&
              typeof document.startViewTransition == `function`)
          ) {
            let n;
            if (typeof t == `object` && this.isViewTransitionTypesSupported) {
              let r = this.latestLocation,
                i = this.state.resolvedLocation;
              n = {
                update: e,
                types:
                  typeof t.types == `function`
                    ? t.types(tt({ resolvedLocation: i, location: r }))
                    : t.types,
              };
            } else n = e;
            document.startViewTransition(n);
          } else e();
        }),
        (this.updateMatch = (e, t) => {
          let n,
            r = this.state.pendingMatches?.find((t) => t.id === e),
            i = this.state.matches.find((t) => t.id === e),
            a = this.state.cachedMatches.find((t) => t.id === e),
            o = r ? `pendingMatches` : i ? `matches` : a ? `cachedMatches` : ``;
          return (
            o &&
              this.__store.setState((r) => ({
                ...r,
                [o]: r[o]?.map((r) => (r.id === e ? (n = t(r)) : r)),
              })),
            n
          );
        }),
        (this.getMatch = (e) =>
          [
            ...this.state.cachedMatches,
            ...(this.state.pendingMatches ?? []),
            ...this.state.matches,
          ].find((t) => t.id === e)),
        (this.loadMatches = async ({
          location: e,
          matches: t,
          preload: n,
          onReady: r,
          updateMatch: i = this.updateMatch,
          sync: a,
        }) => {
          let o,
            s = !1,
            c = async () => {
              s || ((s = !0), await r?.());
            },
            l = (e) => !!(n && !this.state.matches.find((t) => t.id === e)),
            u = (n, r) => {
              var a, o, c, l;
              if ($e(r) && !r.reloadDocument) throw r;
              if (Qe(r) || Me(r)) {
                if (
                  (i(n.id, (e) => ({
                    ...e,
                    status: Qe(r) ? `redirected` : Me(r) ? `notFound` : `error`,
                    isFetching: !1,
                    error: r,
                    beforeLoadPromise: void 0,
                    loaderPromise: void 0,
                  })),
                  (r.routeId ||= n.routeId),
                  (a = n.beforeLoadPromise) == null || a.resolve(),
                  (o = n.loaderPromise) == null || o.resolve(),
                  (c = n.loadPromise) == null || c.resolve(),
                  Qe(r))
                )
                  throw ((s = !0), (r = this.resolveRedirect({ ...r, _fromLocation: e })), r);
                if (Me(r))
                  throw (
                    this._handleNotFound(t, r, { updateMatch: i }),
                    (l = this.serverSsr) == null ||
                      l.onMatchSettled({ router: this, match: this.getMatch(n.id) }),
                    r
                  );
              }
            };
          try {
            (await new Promise((n, s) => {
              (async () => {
                var d;
                try {
                  let s = (e, n, r) => {
                    var a, s;
                    let { id: c, routeId: l } = t[e],
                      d = this.looseRoutesById[l];
                    if (n instanceof Promise) throw n;
                    ((n.routerCode = r), (o ??= e), u(this.getMatch(c), n));
                    try {
                      (s = (a = d.options).onError) == null || s.call(a, n);
                    } catch (e) {
                      ((n = e), u(this.getMatch(c), n));
                    }
                    i(c, (e) => {
                      var t, r;
                      return (
                        (t = e.beforeLoadPromise) == null || t.resolve(),
                        (r = e.loadPromise) == null || r.resolve(),
                        {
                          ...e,
                          error: n,
                          status: `error`,
                          isFetching: !1,
                          updatedAt: Date.now(),
                          abortController: new AbortController(),
                          beforeLoadPromise: void 0,
                        }
                      );
                    });
                  };
                  for (let [n, { id: a, routeId: o }] of t.entries()) {
                    let u = this.getMatch(a),
                      f = t[n - 1]?.id,
                      p = this.looseRoutesById[o],
                      m = p.options.pendingMs ?? this.options.defaultPendingMs,
                      h = !!(
                        r &&
                        !this.isServer &&
                        !l(a) &&
                        (p.options.loader || p.options.beforeLoad || ct(p)) &&
                        typeof m == `number` &&
                        m !== 1 / 0 &&
                        (p.options.pendingComponent ?? this.options?.defaultPendingComponent)
                      ),
                      g = !0;
                    if (
                      ((u.beforeLoadPromise || u.loaderPromise) &&
                        (h &&
                          setTimeout(() => {
                            try {
                              c();
                            } catch {}
                          }, m),
                        await u.beforeLoadPromise,
                        (g = this.getMatch(a).status !== `success`)),
                      g)
                    ) {
                      try {
                        i(a, (e) => {
                          let t = e.loadPromise;
                          return {
                            ...e,
                            loadPromise: _e(() => {
                              t?.resolve();
                            }),
                            beforeLoadPromise: _e(),
                          };
                        });
                        let r = new AbortController(),
                          o;
                        h &&
                          (o = setTimeout(() => {
                            try {
                              c();
                            } catch {}
                          }, m));
                        let { paramsError: u, searchError: g } = this.getMatch(a);
                        (u && s(n, u, `PARSE_PARAMS`), g && s(n, g, `VALIDATE_SEARCH`));
                        let _ = () => (f ? this.getMatch(f).context : (this.options.context ?? {}));
                        i(a, (e) => ({
                          ...e,
                          isFetching: `beforeLoad`,
                          fetchCount: e.fetchCount + 1,
                          abortController: r,
                          pendingTimeout: o,
                          context: { ..._(), ...e.__routeContext },
                        }));
                        let { search: v, params: y, context: b, cause: x } = this.getMatch(a),
                          S = l(a),
                          C = {
                            search: v,
                            abortController: r,
                            params: y,
                            preload: S,
                            context: b,
                            location: e,
                            navigate: (t) => this.navigate({ ...t, _fromLocation: e }),
                            buildLocation: this.buildLocation,
                            cause: S ? `preload` : x,
                            matches: t,
                          },
                          ee = (await (d = p.options).beforeLoad?.call(d, C)) ?? {};
                        ((Qe(ee) || Me(ee)) && s(n, ee, `BEFORE_LOAD`),
                          i(a, (e) => ({
                            ...e,
                            __beforeLoadContext: ee,
                            context: { ..._(), ...e.__routeContext, ...ee },
                            abortController: r,
                          })));
                      } catch (e) {
                        s(n, e, `BEFORE_LOAD`);
                      }
                      i(a, (e) => {
                        var t;
                        return (
                          (t = e.beforeLoadPromise) == null || t.resolve(),
                          { ...e, beforeLoadPromise: void 0, isFetching: !1 }
                        );
                      });
                    }
                  }
                  let f = t.slice(0, o),
                    p = [];
                  (f.forEach(({ id: n, routeId: r }, o) => {
                    p.push(
                      (async () => {
                        let { loaderPromise: s } = this.getMatch(n),
                          c = !1,
                          d = !1;
                        if (s) {
                          await s;
                          let e = this.getMatch(n);
                          e.error && u(e, e.error);
                        } else {
                          let s = p[o - 1],
                            f = this.looseRoutesById[r],
                            m = () => {
                              let {
                                  params: t,
                                  loaderDeps: r,
                                  abortController: i,
                                  context: a,
                                  cause: o,
                                } = this.getMatch(n),
                                c = l(n);
                              return {
                                params: t,
                                deps: r,
                                preload: !!c,
                                parentMatchPromise: s,
                                abortController: i,
                                context: a,
                                location: e,
                                navigate: (t) => this.navigate({ ...t, _fromLocation: e }),
                                cause: c ? `preload` : o,
                                route: f,
                              };
                            },
                            h = Date.now() - this.getMatch(n).updatedAt,
                            g = l(n),
                            _ = g
                              ? (f.options.preloadStaleTime ??
                                this.options.defaultPreloadStaleTime ??
                                3e4)
                              : (f.options.staleTime ?? this.options.defaultStaleTime ?? 0),
                            v = f.options.shouldReload,
                            y = typeof v == `function` ? v(m()) : v;
                          i(n, (e) => ({
                            ...e,
                            loaderPromise: _e(),
                            preload: !!g && !this.state.matches.find((e) => e.id === n),
                          }));
                          let b = () => {
                              var e, r, a;
                              let o = this.getMatch(n);
                              if (!o) return;
                              let s = {
                                  matches: t,
                                  match: o,
                                  params: o.params,
                                  loaderData: o.loaderData,
                                },
                                c = (e = f.options).head?.call(e, s),
                                l = c?.meta,
                                u = c?.links,
                                d = c?.scripts,
                                p = (r = f.options).scripts?.call(r, s),
                                m = (a = f.options).headers?.call(a, s);
                              i(n, (e) => ({
                                ...e,
                                meta: l,
                                links: u,
                                headScripts: d,
                                headers: m,
                                scripts: p,
                              }));
                            },
                            S = async () => {
                              var e, t, r, a;
                              try {
                                let o = async () => {
                                  let e = this.getMatch(n);
                                  e.minPendingPromise && (await e.minPendingPromise);
                                };
                                try {
                                  (this.loadRouteChunk(f),
                                    i(n, (e) => ({ ...e, isFetching: `loader` })));
                                  let t = await (e = f.options).loader?.call(e, m());
                                  (u(this.getMatch(n), t),
                                    await f._lazyPromise,
                                    await o(),
                                    await f._componentsPromise,
                                    x(() => {
                                      (i(n, (e) => ({
                                        ...e,
                                        error: void 0,
                                        status: `success`,
                                        isFetching: !1,
                                        updatedAt: Date.now(),
                                        loaderData: t,
                                      })),
                                        b());
                                    }));
                                } catch (e) {
                                  let a = e;
                                  (await o(), u(this.getMatch(n), e));
                                  try {
                                    (r = (t = f.options).onError) == null || r.call(t, e);
                                  } catch (e) {
                                    ((a = e), u(this.getMatch(n), e));
                                  }
                                  x(() => {
                                    (i(n, (e) => ({
                                      ...e,
                                      error: a,
                                      status: `error`,
                                      isFetching: !1,
                                    })),
                                      b());
                                  });
                                }
                                (a = this.serverSsr) == null ||
                                  a.onMatchSettled({ router: this, match: this.getMatch(n) });
                              } catch (e) {
                                (x(() => {
                                  (i(n, (e) => ({ ...e, loaderPromise: void 0 })), b());
                                }),
                                  u(this.getMatch(n), e));
                              }
                            },
                            { status: C, invalid: ee } = this.getMatch(n);
                          ((c = C === `success` && (ee || (y ?? h > _))),
                            (g && f.options.preload === !1) ||
                              (c && !a
                                ? ((d = !0),
                                  (async () => {
                                    try {
                                      await S();
                                      let { loaderPromise: e, loadPromise: t } = this.getMatch(n);
                                      (e?.resolve(),
                                        t?.resolve(),
                                        i(n, (e) => ({ ...e, loaderPromise: void 0 })));
                                    } catch (e) {
                                      $e(e) && (await this.navigate(e));
                                    }
                                  })())
                                : C !== `success` || (c && a)
                                  ? await S()
                                  : b()));
                        }
                        if (!d) {
                          let { loaderPromise: e, loadPromise: t } = this.getMatch(n);
                          (e?.resolve(), t?.resolve());
                        }
                        return (
                          i(n, (e) => ({
                            ...e,
                            isFetching: d ? e.isFetching : !1,
                            loaderPromise: d ? e.loaderPromise : void 0,
                            invalid: !1,
                          })),
                          this.getMatch(n)
                        );
                      })(),
                    );
                  }),
                    await Promise.all(p),
                    n());
                } catch (e) {
                  s(e);
                }
              })();
            }),
              await c());
          } catch (e) {
            if (Qe(e) || Me(e)) throw (Me(e) && !n && (await c()), e);
          }
          return t;
        }),
        (this.invalidate = (e) => {
          let t = (t) =>
            (e?.filter?.call(e, t) ?? !0)
              ? {
                  ...t,
                  invalid: !0,
                  ...(t.status === `error` ? { status: `pending`, error: void 0 } : {}),
                }
              : t;
          return (
            this.__store.setState((e) => ({
              ...e,
              matches: e.matches.map(t),
              cachedMatches: e.cachedMatches.map(t),
              pendingMatches: e.pendingMatches?.map(t),
            })),
            (this.shouldViewTransition = !1),
            this.load({ sync: e?.sync })
          );
        }),
        (this.resolveRedirect = (e) => {
          let t = e;
          return ((t.href ||= this.buildLocation(t).href), t);
        }),
        (this.clearCache = (e) => {
          let t = e?.filter;
          t === void 0
            ? this.__store.setState((e) => ({ ...e, cachedMatches: [] }))
            : this.__store.setState((e) => ({
                ...e,
                cachedMatches: e.cachedMatches.filter((e) => !t(e)),
              }));
        }),
        (this.clearExpiredCache = () => {
          this.clearCache({
            filter: (e) => {
              let t = this.looseRoutesById[e.routeId];
              if (!t.options.loader) return !0;
              let n =
                (e.preload
                  ? (t.options.preloadGcTime ?? this.options.defaultPreloadGcTime)
                  : (t.options.gcTime ?? this.options.defaultGcTime)) ?? 300 * 1e3;
              return !(e.status !== `error` && Date.now() - e.updatedAt < n);
            },
          });
        }),
        (this.loadRouteChunk = (e) => (
          e._lazyPromise === void 0 &&
            (e.lazyFn
              ? (e._lazyPromise = e.lazyFn().then((t) => {
                  let { id: n, ...r } = t.options;
                  Object.assign(e.options, r);
                }))
              : (e._lazyPromise = Promise.resolve())),
          e._componentsPromise === void 0 &&
            (e._componentsPromise = e._lazyPromise.then(() =>
              Promise.all(
                st.map(async (t) => {
                  let n = e.options[t];
                  n?.preload && (await n.preload());
                }),
              ),
            )),
          e._componentsPromise
        )),
        (this.preloadRoute = async (e) => {
          let t = this.buildLocation(e),
            n = this.matchRoutes(t, { throwOnError: !0, preload: !0, dest: e }),
            r = new Set(
              [...this.state.matches, ...(this.state.pendingMatches ?? [])].map((e) => e.id),
            ),
            i = new Set([...r, ...this.state.cachedMatches.map((e) => e.id)]);
          x(() => {
            n.forEach((e) => {
              i.has(e.id) ||
                this.__store.setState((t) => ({ ...t, cachedMatches: [...t.cachedMatches, e] }));
            });
          });
          try {
            return (
              (n = await this.loadMatches({
                matches: n,
                location: t,
                preload: !0,
                updateMatch: (e, t) => {
                  r.has(e) ? (n = n.map((n) => (n.id === e ? t(n) : n))) : this.updateMatch(e, t);
                },
              })),
              n
            );
          } catch (e) {
            if (Qe(e))
              return e.reloadDocument
                ? void 0
                : await this.preloadRoute({ ...e, _fromLocation: t });
            Me(e) || console.error(e);
            return;
          }
        }),
        (this.matchRoute = (e, t) => {
          let n = {
              ...e,
              to: e.to ? this.resolvePathWithBase(e.from || ``, e.to) : void 0,
              params: e.params || {},
              leaveParams: !0,
            },
            r = this.buildLocation(n);
          if (t?.pending && this.state.status !== `pending`) return !1;
          let i = (t?.pending === void 0 ? !this.state.isLoading : t.pending)
              ? this.latestLocation
              : this.state.resolvedLocation || this.state.location,
            a = ke(this.basepath, i.pathname, { ...t, to: r.pathname });
          return !a || (e.params && !ge(a, e.params, { partial: !0 }))
            ? !1
            : a && (t?.includeSearch ?? !0)
              ? ge(i.search, r.search, { partial: !0 })
                ? a
                : !1
              : a;
        }),
        (this._handleNotFound = (e, t, { updateMatch: n = this.updateMatch } = {}) => {
          let r = this.routesById[t.routeId ?? ``] ?? this.routeTree,
            i = {};
          for (let t of e) i[t.routeId] = t;
          (!r.options.notFoundComponent &&
            this.options?.defaultNotFoundComponent &&
            (r.options.notFoundComponent = this.options.defaultNotFoundComponent),
            E(
              r.options.notFoundComponent,
              `No notFoundComponent found. Please set a notFoundComponent on your route or provide a defaultNotFoundComponent to the router.`,
            ));
          let a = i[r.id];
          (E(a, `Could not find match for route: ` + r.id),
            n(a.id, (e) => ({ ...e, status: `notFound`, error: t, isFetching: !1 })),
            t.routerCode === `BEFORE_LOAD` &&
              r.parentRoute &&
              ((t.routeId = r.parentRoute.id), this._handleNotFound(e, t, { updateMatch: n })));
        }),
        (this.hasNotFoundMatch = () =>
          this.__store.state.matches.some((e) => e.status === `notFound` || e.globalNotFound)),
        this.update({
          defaultPreloadDelay: 50,
          defaultPendingMs: 1e3,
          defaultPendingMinMs: 500,
          context: void 0,
          ...e,
          caseSensitive: e.caseSensitive ?? !1,
          notFoundMode: e.notFoundMode ?? `fuzzy`,
          stringifySearch: e.stringifySearch ?? Je,
          parseSearch: e.parseSearch ?? qe,
        }),
        typeof document < `u` && (window.__TSR_ROUTER__ = this));
    }
    get state() {
      return this.__store.state;
    }
    get looseRoutesById() {
      return this.routesById;
    }
    matchRoutesInternal(e, t) {
      let { foundRoute: n, matchedRoutes: r, routeParams: i } = this.getMatchedRoutes(e, t?.dest),
        a = !1;
      (n ? n.path !== `/` && i[`**`] : xe(e.pathname)) &&
        (this.options.notFoundRoute ? r.push(this.options.notFoundRoute) : (a = !0));
      let o = (() => {
          if (a) {
            if (this.options.notFoundMode !== `root`)
              for (let e = r.length - 1; e >= 0; e--) {
                let t = r[e];
                if (t.children) return t.id;
              }
            return Ze;
          }
        })(),
        s = r.map((e) => {
          let n,
            r = e.options.params?.parse ?? e.options.parseParams;
          if (r)
            try {
              let e = r(i);
              Object.assign(i, e);
            } catch (e) {
              if (((n = new it(e.message, { cause: e })), t?.throwOnError)) throw n;
              return n;
            }
        }),
        c = [],
        l = (e) =>
          e?.id ? (e.context ?? this.options.context ?? {}) : (this.options.context ?? {});
      return (
        r.forEach((n, r) => {
          var a;
          let u = c[r - 1],
            [d, f, p] = (() => {
              let r = u?.search ?? e.search,
                i = u?._strictSearch ?? {};
              try {
                let e = ot(n.options.validateSearch, { ...r }) ?? {};
                return [{ ...r, ...e }, { ...i, ...e }, void 0];
              } catch (e) {
                let n = e;
                if ((e instanceof rt || (n = new rt(e.message, { cause: e })), t?.throwOnError))
                  throw n;
                return [r, {}, n];
              }
            })(),
            m = (a = n.options).loaderDeps?.call(a, { search: d }) ?? ``,
            h = m ? JSON.stringify(m) : ``,
            { usedParams: g, interpolatedPath: _ } = De({
              path: n.fullPath,
              params: i,
              decodeCharMap: this.pathParamsDecodeCharMap,
            }),
            v =
              De({
                path: n.id,
                params: i,
                leaveWildcards: !0,
                decodeCharMap: this.pathParamsDecodeCharMap,
              }).interpolatedPath + h,
            y = this.getMatch(v),
            b = this.state.matches.find((e) => e.routeId === n.id),
            x = b ? `stay` : `enter`,
            S;
          if (y)
            S = {
              ...y,
              cause: x,
              params: b ? O(b.params, i) : i,
              _strictParams: g,
              search: O(b ? b.search : y.search, d),
              _strictSearch: f,
            };
          else {
            let e =
              n.options.loader || n.options.beforeLoad || n.lazyFn || ct(n) ? `pending` : `success`;
            S = {
              id: v,
              index: r,
              routeId: n.id,
              params: b ? O(b.params, i) : i,
              _strictParams: g,
              pathname: ve([this.basepath, _]),
              updatedAt: Date.now(),
              search: b ? O(b.search, d) : d,
              _strictSearch: f,
              searchError: void 0,
              status: e,
              isFetching: !1,
              error: void 0,
              paramsError: s[r],
              __routeContext: {},
              __beforeLoadContext: {},
              context: {},
              abortController: new AbortController(),
              fetchCount: 0,
              cause: x,
              loaderDeps: b ? O(b.loaderDeps, m) : m,
              invalid: !1,
              preload: !1,
              links: void 0,
              scripts: void 0,
              headScripts: void 0,
              meta: void 0,
              staticData: n.options.staticData || {},
              loadPromise: _e(),
              fullPath: n.fullPath,
            };
          }
          (t?.preload || (S.globalNotFound = o === n.id), (S.searchError = p));
          let C = l(u);
          ((S.context = { ...C, ...S.__routeContext, ...S.__beforeLoadContext }), c.push(S));
        }),
        c.forEach((n, r) => {
          var i;
          let a = this.looseRoutesById[n.routeId];
          if (!this.getMatch(n.id) && t?._buildLocation !== !0) {
            let t = c[r - 1],
              o = l(t),
              s = {
                deps: n.loaderDeps,
                params: n.params,
                context: o,
                location: e,
                navigate: (t) => this.navigate({ ...t, _fromLocation: e }),
                buildLocation: this.buildLocation,
                cause: n.cause,
                abortController: n.abortController,
                preload: !!n.preload,
                matches: c,
              };
            ((n.__routeContext = (i = a.options).context?.call(i, s) ?? {}),
              (n.context = { ...o, ...n.__routeContext, ...n.__beforeLoadContext }));
          }
        }),
        c
      );
    }
  },
  rt = class extends Error {},
  it = class extends Error {};
function at(e) {
  return {
    loadedAt: 0,
    isLoading: !1,
    isTransitioning: !1,
    status: `idle`,
    resolvedLocation: void 0,
    location: e,
    matches: [],
    pendingMatches: [],
    cachedMatches: [],
    statusCode: 200,
  };
}
function ot(e, t) {
  if (e == null) return {};
  if (`~standard` in e) {
    let n = e[`~standard`].validate(t);
    if (n instanceof Promise) throw new rt(`Async validation not supported`);
    if (n.issues) throw new rt(JSON.stringify(n.issues, void 0, 2), { cause: n });
    return n.value;
  }
  return `parse` in e ? e.parse(t) : typeof e == `function` ? e(t) : {};
}
var st = [`component`, `errorComponent`, `pendingComponent`, `notFoundComponent`];
function ct(e) {
  for (let t of st) if (e.options[t]?.preload) return !0;
  return !1;
}
var lt = Symbol.for(`TSR_DEFERRED_PROMISE`);
function ut(e, t) {
  let n = e;
  return n[lt]
    ? n
    : ((n[lt] = { status: `pending` }),
      n
        .then((e) => {
          ((n[lt].status = `success`), (n[lt].data = e));
        })
        .catch((e) => {
          ((n[lt].status = `error`),
            (n[lt].error = { data: (t?.serializeError ?? et)(e), __isServerError: !0 }));
        }),
      n);
}
var dt = `Error preloading route! ☝️`,
  ft = class {
    constructor(e) {
      if (
        ((this.init = (e) => {
          var t;
          this.originalIndex = e.originalIndex;
          let n = this.options,
            r = !n?.path && !n?.id;
          if (((this.parentRoute = (t = this.options).getParentRoute?.call(t)), r)) this._path = Ze;
          else if (!this.parentRoute)
            throw Error(
              `Child Route instances must pass a 'getParentRoute: () => ParentRoute' option that returns a Route instance.`,
            );
          let i = r ? Ze : n?.path;
          i && i !== `/` && (i = be(i));
          let a = n?.id || i,
            o = r ? Ze : ve([this.parentRoute.id === `__root__` ? `` : this.parentRoute.id, a]);
          (i === `__root__` && (i = `/`), o !== `__root__` && (o = ve([`/`, o])));
          let s = o === `__root__` ? `/` : ve([this.parentRoute.fullPath, i]);
          ((this._path = i),
            (this._id = o),
            (this._fullPath = s),
            (this._to = s),
            (this._ssr = n?.ssr ?? e.defaultSsr ?? !0));
        }),
        (this.clone = (e) => {
          ((this._path = e._path),
            (this._id = e._id),
            (this._fullPath = e._fullPath),
            (this._to = e._to),
            (this._ssr = e._ssr),
            (this.options.getParentRoute = e.options.getParentRoute),
            (this.children = e.children));
        }),
        (this.addChildren = (e) => this._addFileChildren(e)),
        (this._addFileChildren = (e) => (
          Array.isArray(e) && (this.children = e),
          typeof e == `object` && e && (this.children = Object.values(e)),
          this
        )),
        (this._addFileTypes = () => this),
        (this.updateLoader = (e) => (Object.assign(this.options, e), this)),
        (this.update = (e) => (Object.assign(this.options, e), this)),
        (this.lazy = (e) => ((this.lazyFn = e), this)),
        (this.options = e || {}),
        (this.isRoot = !e?.getParentRoute),
        e?.id && e?.path)
      )
        throw Error(`Route cannot have both an 'id' and a 'path' option.`);
    }
    get to() {
      return this._to;
    }
    get id() {
      return this._id;
    }
    get path() {
      return this._path;
    }
    get fullPath() {
      return this._fullPath;
    }
    get ssr() {
      return this._ssr;
    }
  },
  pt = class extends ft {
    constructor(e) {
      super(e);
    }
  },
  j = {
    stringify: (e) =>
      JSON.stringify(e, function (e, t) {
        let n = this[e],
          r = ht.find((e) => e.stringifyCondition(n));
        return r ? r.stringify(n) : t;
      }),
    parse: (e) =>
      JSON.parse(e, function (e, t) {
        let n = this[e];
        if (A(n)) {
          let e = ht.find((e) => e.parseCondition(n));
          if (e) return e.parse(n);
        }
        return t;
      }),
    encode: (e) => {
      if (Array.isArray(e)) return e.map((e) => j.encode(e));
      if (A(e)) return Object.fromEntries(Object.entries(e).map(([e, t]) => [e, j.encode(t)]));
      let t = ht.find((t) => t.stringifyCondition(e));
      return t ? t.stringify(e) : e;
    },
    decode: (e) => {
      if (A(e)) {
        let t = ht.find((t) => t.parseCondition(e));
        if (t) return t.parse(e);
      }
      return Array.isArray(e)
        ? e.map((e) => j.decode(e))
        : A(e)
          ? Object.fromEntries(Object.entries(e).map(([e, t]) => [e, j.decode(t)]))
          : e;
    },
  },
  mt = (e, t, n, r) => ({
    key: e,
    stringifyCondition: t,
    stringify: (t) => ({ [`$${e}`]: n(t) }),
    parseCondition: (t) => Object.hasOwn(t, `$${e}`),
    parse: (t) => r(t[`$${e}`]),
  }),
  ht = [
    mt(
      `undefined`,
      (e) => e === void 0,
      () => 0,
      () => void 0,
    ),
    mt(
      `date`,
      (e) => e instanceof Date,
      (e) => e.toISOString(),
      (e) => new Date(e),
    ),
    mt(
      `error`,
      (e) => e instanceof Error,
      (e) => ({ ...e, message: e.message, stack: void 0, cause: e.cause }),
      (e) => Object.assign(Error(e.message), e),
    ),
    mt(
      `formData`,
      (e) => e instanceof FormData,
      (e) => {
        let t = {};
        return (
          e.forEach((e, n) => {
            let r = t[n];
            r === void 0 ? (t[n] = e) : Array.isArray(r) ? r.push(e) : (t[n] = [r, e]);
          }),
          t
        );
      },
      (e) => {
        let t = new FormData();
        return (
          Object.entries(e).forEach(([e, n]) => {
            Array.isArray(n) ? n.forEach((n) => t.append(e, n)) : t.append(e, n);
          }),
          t
        );
      },
    ),
    mt(
      `bigint`,
      (e) => typeof e == `bigint`,
      (e) => e.toString(),
      (e) => BigInt(e),
    ),
  ];
function gt(e) {
  var t, n;
  E(
    window.__TSR_SSR__?.dehydrated,
    `Expected to find a dehydrated data on window.__TSR_SSR__.dehydrated... but we did not. Please file an issue!`,
  );
  let { manifest: r, dehydratedData: i } = j.parse(window.__TSR_SSR__.dehydrated);
  ((e.ssr = { manifest: r, serializer: j }),
    (e.clientSsr = {
      getStreamedValue: (t) => {
        if (e.isServer) return;
        let n = window.__TSR_SSR__?.streamedValues[t];
        if (n) return ((n.parsed ||= e.ssr.serializer.parse(n.value)), n.parsed);
      },
    }));
  let a = e.matchRoutes(e.state.location),
    o = Promise.all(
      a.map((t) => {
        let n = e.looseRoutesById[t.routeId];
        return e.loadRouteChunk(n);
      }),
    );
  return (
    a.forEach((t) => {
      var n;
      let r = window.__TSR_SSR__.matches.find((e) => e.id === t.id);
      return (
        r
          ? (Object.assign(t, r),
            r.__beforeLoadContext &&
              (t.__beforeLoadContext = e.ssr.serializer.parse(r.__beforeLoadContext)),
            r.loaderData && (t.loaderData = e.ssr.serializer.parse(r.loaderData)),
            r.error && (t.error = e.ssr.serializer.parse(r.error)),
            (n = t.extracted) == null ||
              n.forEach((e) => {
                _t(t, [`loaderData`, ...e.path], e.value);
              }))
          : Object.assign(t, { status: `success`, updatedAt: Date.now() }),
        t
      );
    }),
    e.__store.setState((e) => ({ ...e, matches: a })),
    (n = (t = e.options).hydrate) == null || n.call(t, i),
    e.state.matches.forEach((t) => {
      var n, r, i;
      let o = e.looseRoutesById[t.routeId],
        s = e.state.matches[t.index - 1]?.context ?? e.options.context ?? {},
        c = {
          deps: t.loaderDeps,
          params: t.params,
          context: s,
          location: e.state.location,
          navigate: (t) => e.navigate({ ...t, _fromLocation: e.state.location }),
          buildLocation: e.buildLocation,
          cause: t.cause,
          abortController: t.abortController,
          preload: !1,
          matches: a,
        };
      ((t.__routeContext = (n = o.options).context?.call(n, c) ?? {}),
        (t.context = { ...s, ...t.__routeContext, ...t.__beforeLoadContext }));
      let l = { matches: e.state.matches, match: t, params: t.params, loaderData: t.loaderData },
        u = (r = o.options).head?.call(r, l),
        d = (i = o.options).scripts?.call(i, l);
      ((t.meta = u?.meta), (t.links = u?.links), (t.headScripts = u?.scripts), (t.scripts = d));
    }),
    o
  );
}
function _t(e, t, n) {
  t.length === 1 && (e[t[0]] = n);
  let [r, ...i] = t;
  Array.isArray(e) ? _t(e[Number(r)], i, n) : A(e) && _t(e[r], i, n);
}
var vt = !0;
function yt(e, t) {
  if (!vt) {
    if (e) return;
    var n = `Warning: ` + t;
    typeof console < `u` && console.warn(n);
    try {
      throw Error(n);
    } catch {}
  }
}
var M = e(t(), 1),
  bt = l(),
  xt = `modulepreload`,
  St = function (e) {
    return `/_build/` + e;
  },
  Ct = {},
  wt = function (e, t, n) {
    let r = Promise.resolve();
    if (t && t.length > 0) {
      let e = document.getElementsByTagName(`link`),
        i = document.querySelector(`meta[property=csp-nonce]`),
        a = i?.nonce || i?.getAttribute(`nonce`);
      function o(e) {
        return Promise.all(
          e.map((e) =>
            Promise.resolve(e).then(
              (e) => ({ status: `fulfilled`, value: e }),
              (e) => ({ status: `rejected`, reason: e }),
            ),
          ),
        );
      }
      r = o(
        t.map((t) => {
          if (((t = St(t, n)), t in Ct)) return;
          Ct[t] = !0;
          let r = t.endsWith(`.css`),
            i = r ? `[rel="stylesheet"]` : ``;
          if (n)
            for (let n = e.length - 1; n >= 0; n--) {
              let i = e[n];
              if (i.href === t && (!r || i.rel === `stylesheet`)) return;
            }
          else if (document.querySelector(`link[href="${t}"]${i}`)) return;
          let o = document.createElement(`link`);
          if (
            ((o.rel = r ? `stylesheet` : xt),
            r || (o.as = `script`),
            (o.crossOrigin = ``),
            (o.href = t),
            a && o.setAttribute(`nonce`, a),
            document.head.appendChild(o),
            r)
          )
            return new Promise((e, n) => {
              (o.addEventListener(`load`, e),
                o.addEventListener(`error`, () => n(Error(`Unable to preload CSS for ${t}`))));
            });
        }),
      );
    }
    function i(e) {
      let t = new Event(`vite:preloadError`, { cancelable: !0 });
      if (((t.payload = e), window.dispatchEvent(t), !t.defaultPrevented)) throw e;
    }
    return r.then((t) => {
      for (let e of t || []) e.status === `rejected` && i(e.reason);
      return e().catch(i);
    });
  },
  N = r();
function Tt({ promise: e }) {
  let t = ut(e);
  if (t[lt].status === `pending`) throw t;
  if (t[lt].status === `error`) throw t[lt].error;
  return [t[lt].data, t];
}
function Et(e) {
  let t = (0, N.jsx)(Dt, { ...e });
  return e.fallback ? (0, N.jsx)(M.Suspense, { fallback: e.fallback, children: t }) : t;
}
function Dt(e) {
  let [t] = Tt(e);
  return e.children(t);
}
function Ot(e) {
  let t = e.errorComponent ?? At;
  return (0, N.jsx)(kt, {
    getResetKey: e.getResetKey,
    onCatch: e.onCatch,
    children: ({ error: n, reset: r }) =>
      n ? M.createElement(t, { error: n, reset: r }) : e.children,
  });
}
var kt = class extends M.Component {
  constructor() {
    (super(...arguments), (this.state = { error: null }));
  }
  static getDerivedStateFromProps(e) {
    return { resetKey: e.getResetKey() };
  }
  static getDerivedStateFromError(e) {
    return { error: e };
  }
  reset() {
    this.setState({ error: null });
  }
  componentDidUpdate(e, t) {
    t.error && t.resetKey !== this.state.resetKey && this.reset();
  }
  componentDidCatch(e, t) {
    this.props.onCatch && this.props.onCatch(e, t);
  }
  render() {
    return this.props.children({
      error: this.state.resetKey === this.props.getResetKey() ? this.state.error : null,
      reset: () => {
        this.reset();
      },
    });
  }
};
function At({ error: e }) {
  let [t, n] = M.useState(!1);
  return (0, N.jsxs)(`div`, {
    style: { padding: `.5rem`, maxWidth: `100%` },
    children: [
      (0, N.jsxs)(`div`, {
        style: { display: `flex`, alignItems: `center`, gap: `.5rem` },
        children: [
          (0, N.jsx)(`strong`, { style: { fontSize: `1rem` }, children: `Something went wrong!` }),
          (0, N.jsx)(`button`, {
            style: {
              appearance: `none`,
              fontSize: `.6em`,
              border: `1px solid currentColor`,
              padding: `.1rem .2rem`,
              fontWeight: `bold`,
              borderRadius: `.25rem`,
            },
            onClick: () => n((e) => !e),
            children: t ? `Hide Error` : `Show Error`,
          }),
        ],
      }),
      (0, N.jsx)(`div`, { style: { height: `.25rem` } }),
      t
        ? (0, N.jsx)(`div`, {
            children: (0, N.jsx)(`pre`, {
              style: {
                fontSize: `.7em`,
                border: `1px solid red`,
                borderRadius: `.25rem`,
                padding: `.3rem`,
                color: `red`,
                overflow: `auto`,
              },
              children: e.message ? (0, N.jsx)(`code`, { children: e.message }) : null,
            }),
          })
        : null,
    ],
  });
}
function jt({ children: e, fallback: t = null }) {
  return Mt() ? (0, N.jsx)(M.Fragment, { children: e }) : (0, N.jsx)(M.Fragment, { children: t });
}
function Mt() {
  return M.useSyncExternalStore(
    Nt,
    () => !0,
    () => !1,
  );
}
function Nt() {
  return () => {};
}
var Pt = n((e) => {
    var n = t();
    function r(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var i = typeof Object.is == `function` ? Object.is : r,
      a = n.useState,
      o = n.useEffect,
      s = n.useLayoutEffect,
      c = n.useDebugValue;
    function l(e, t) {
      var n = t(),
        r = a({ inst: { value: n, getSnapshot: t } }),
        i = r[0].inst,
        l = r[1];
      return (
        s(
          function () {
            ((i.value = n), (i.getSnapshot = t), u(i) && l({ inst: i }));
          },
          [e, n, t],
        ),
        o(
          function () {
            return (
              u(i) && l({ inst: i }),
              e(function () {
                u(i) && l({ inst: i });
              })
            );
          },
          [e],
        ),
        c(n),
        n
      );
    }
    function u(e) {
      var t = e.getSnapshot;
      e = e.value;
      try {
        var n = t();
        return !i(e, n);
      } catch {
        return !0;
      }
    }
    function d(e, t) {
      return t();
    }
    var f =
      typeof window > `u` || window.document === void 0 || window.document.createElement === void 0
        ? d
        : l;
    e.useSyncExternalStore = n.useSyncExternalStore === void 0 ? f : n.useSyncExternalStore;
  }),
  Ft = n((e, t) => {
    t.exports = Pt();
  }),
  It = n((e) => {
    var n = t(),
      r = Ft();
    function i(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var a = typeof Object.is == `function` ? Object.is : i,
      o = r.useSyncExternalStore,
      s = n.useRef,
      c = n.useEffect,
      l = n.useMemo,
      u = n.useDebugValue;
    e.useSyncExternalStoreWithSelector = function (e, t, n, r, i) {
      var d = s(null);
      if (d.current === null) {
        var f = { hasValue: !1, value: null };
        d.current = f;
      } else f = d.current;
      d = l(
        function () {
          function e(e) {
            if (!o) {
              if (((o = !0), (s = e), (e = r(e)), i !== void 0 && f.hasValue)) {
                var t = f.value;
                if (i(t, e)) return (c = t);
              }
              return (c = e);
            }
            if (((t = c), a(s, e))) return t;
            var n = r(e);
            return i !== void 0 && i(t, n) ? ((s = e), t) : ((s = e), (c = n));
          }
          var o = !1,
            s,
            c,
            l = n === void 0 ? null : n;
          return [
            function () {
              return e(t());
            },
            l === null
              ? void 0
              : function () {
                  return e(l());
                },
          ];
        },
        [t, n, r, i],
      );
      var p = o(e, d[0], d[1]);
      return (
        c(
          function () {
            ((f.hasValue = !0), (f.value = p));
          },
          [p],
        ),
        u(p),
        p
      );
    };
  }),
  Lt = n((e, t) => {
    t.exports = It();
  })();
function Rt(e, t = (e) => e) {
  return (0, Lt.useSyncExternalStoreWithSelector)(
    e.subscribe,
    () => e.state,
    () => e.state,
    t,
    zt,
  );
}
function zt(e, t) {
  if (Object.is(e, t)) return !0;
  if (typeof e != `object` || !e || typeof t != `object` || !t) return !1;
  if (e instanceof Map && t instanceof Map) {
    if (e.size !== t.size) return !1;
    for (let [n, r] of e) if (!t.has(n) || !Object.is(r, t.get(n))) return !1;
    return !0;
  }
  if (e instanceof Set && t instanceof Set) {
    if (e.size !== t.size) return !1;
    for (let n of e) if (!t.has(n)) return !1;
    return !0;
  }
  if (e instanceof Date && t instanceof Date) return e.getTime() === t.getTime();
  let n = Bt(e);
  if (n.length !== Bt(t).length) return !1;
  for (let r = 0; r < n.length; r++)
    if (!Object.prototype.hasOwnProperty.call(t, n[r]) || !Object.is(e[n[r]], t[n[r]])) return !1;
  return !0;
}
function Bt(e) {
  return Object.keys(e).concat(Object.getOwnPropertySymbols(e));
}
var Vt = M.createContext(null);
function Ht() {
  return typeof document > `u`
    ? Vt
    : window.__TSR_ROUTER_CONTEXT__
      ? window.__TSR_ROUTER_CONTEXT__
      : ((window.__TSR_ROUTER_CONTEXT__ = Vt), Vt);
}
function P(e) {
  let t = M.useContext(Ht());
  return (
    yt(!((e?.warn ?? !0) && !t), `useRouter must be used inside a <RouterProvider> component!`), t
  );
}
function F(e) {
  let t = P({ warn: e?.router === void 0 }),
    n = e?.router || t,
    r = (0, M.useRef)(void 0);
  return Rt(n.__store, (t) => {
    if (e?.select) {
      if (e.structuralSharing ?? n.options.defaultStructuralSharing) {
        let n = O(r.current, e.select(t));
        return ((r.current = n), n);
      }
      return e.select(t);
    }
    return t;
  });
}
var Ut = M.createContext(void 0),
  Wt = M.createContext(void 0);
function Gt(e) {
  let t = M.useContext(e.from ? Wt : Ut);
  return F({
    select: (n) => {
      let r = n.matches.find((n) => (e.from ? e.from === n.routeId : n.id === t));
      if (
        (E(
          !((e.shouldThrow ?? !0) && !r),
          `Could not find ${e.from ? `an active match from "${e.from}"` : `a nearest match!`}`,
        ),
        r !== void 0)
      )
        return e.select ? e.select(r) : r;
    },
    structuralSharing: e.structuralSharing,
  });
}
function Kt(e) {
  return Gt({
    from: e.from,
    strict: e.strict,
    structuralSharing: e.structuralSharing,
    select: (t) => (e.select ? e.select(t.loaderData) : t.loaderData),
  });
}
function qt(e) {
  let { select: t, ...n } = e;
  return Gt({ ...n, select: (e) => (t ? t(e.loaderDeps) : e.loaderDeps) });
}
function Jt(e) {
  return Gt({
    from: e.from,
    strict: e.strict,
    shouldThrow: e.shouldThrow,
    structuralSharing: e.structuralSharing,
    select: (t) => (e.select ? e.select(t.params) : t.params),
  });
}
function Yt(e) {
  return Gt({
    from: e.from,
    strict: e.strict,
    shouldThrow: e.shouldThrow,
    structuralSharing: e.structuralSharing,
    select: (t) => (e.select ? e.select(t.search) : t.search),
  });
}
function Xt(e) {
  let { navigate: t } = P();
  return M.useCallback((n) => t({ from: e?.from, ...n }), [e?.from, t]);
}
var Zt = typeof window < `u` ? M.useLayoutEffect : M.useEffect;
function Qt(e) {
  let t = M.useRef({ value: e, prev: null }),
    n = t.current.value;
  return (e !== n && (t.current = { value: e, prev: n }), t.current.prev);
}
function $t(e, t, n = {}, r = {}) {
  let i = M.useRef(typeof IntersectionObserver == `function`),
    a = M.useRef(null);
  return (
    M.useEffect(() => {
      if (!(!e.current || !i.current || r.disabled))
        return (
          (a.current = new IntersectionObserver(([e]) => {
            t(e);
          }, n)),
          a.current.observe(e.current),
          () => {
            var e;
            (e = a.current) == null || e.disconnect();
          }
        );
    }, [t, n, r.disabled, e]),
    a.current
  );
}
function en(e) {
  let t = M.useRef(null);
  return (M.useImperativeHandle(e, () => t.current, []), t);
}
function tn() {
  let e = P(),
    t = M.useRef({ router: e, mounted: !1 }),
    n = F({ select: ({ isLoading: e }) => e }),
    [r, i] = M.useState(!1),
    a = F({ select: (e) => e.matches.some((e) => e.status === `pending`), structuralSharing: !0 }),
    o = Qt(n),
    s = n || r || a,
    c = Qt(s),
    l = n || a,
    u = Qt(l);
  return (
    e.isServer ||
      (e.startTransition = (e) => {
        (i(!0),
          M.startTransition(() => {
            (e(), i(!1));
          }));
      }),
    M.useEffect(() => {
      let t = e.history.subscribe(e.load),
        n = e.buildLocation({
          to: e.latestLocation.pathname,
          search: !0,
          params: !0,
          hash: !0,
          state: !0,
          _includeValidateSearch: !0,
        });
      return (
        xe(e.latestLocation.href) !== xe(n.href) && e.commitLocation({ ...n, replace: !0 }),
        () => {
          t();
        }
      );
    }, [e, e.history]),
    Zt(() => {
      (typeof window < `u` && e.clientSsr) ||
        (t.current.router === e && t.current.mounted) ||
        ((t.current = { router: e, mounted: !0 }),
        (async () => {
          try {
            await e.load();
          } catch (e) {
            console.error(e);
          }
        })());
    }, [e]),
    Zt(() => {
      o && !n && e.emit({ type: `onLoad`, ...tt(e.state) });
    }, [o, e, n]),
    Zt(() => {
      u && !l && e.emit({ type: `onBeforeRouteMount`, ...tt(e.state) });
    }, [l, u, e]),
    Zt(() => {
      c &&
        !s &&
        (e.emit({ type: `onResolved`, ...tt(e.state) }),
        e.__store.setState((e) => ({ ...e, status: `idle`, resolvedLocation: e.location })),
        Ue(e));
    }, [s, c, e]),
    null
  );
}
function nn(e) {
  let t = F({ select: (e) => `not-found-${e.location.pathname}-${e.status}` });
  return (0, N.jsx)(Ot, {
    getResetKey: () => t,
    onCatch: (t, n) => {
      var r;
      if (Me(t)) (r = e.onCatch) == null || r.call(e, t, n);
      else throw t;
    },
    errorComponent: ({ error: t }) => {
      if (Me(t)) return e.fallback?.call(e, t);
      throw t;
    },
    children: e.children,
  });
}
function rn() {
  return (0, N.jsx)(`p`, { children: `Not Found` });
}
function an(e) {
  return (0, N.jsx)(N.Fragment, { children: e.children });
}
function on(e, t, n) {
  return t.options.notFoundComponent
    ? (0, N.jsx)(t.options.notFoundComponent, { data: n })
    : e.options.defaultNotFoundComponent
      ? (0, N.jsx)(e.options.defaultNotFoundComponent, { data: n })
      : (0, N.jsx)(rn, {});
}
n((e, t) => {
  var n = {},
    r = n.hasOwnProperty,
    i = (e, t) => {
      for (let n in e) r.call(e, n) && t(n, e[n]);
    },
    a = (e, t) => (
      t &&
        i(t, (t, n) => {
          e[t] = n;
        }),
      e
    ),
    o = (e, t) => {
      let n = e.length,
        r = -1;
      for (; ++r < n; ) t(e[r]);
    },
    s = (e) => `\\u` + (`0000` + e).slice(-4),
    c = (e, t) => {
      let n = e.toString(16);
      return t ? n : n.toUpperCase();
    },
    l = n.toString,
    u = Array.isArray,
    d = (e) => typeof Buffer == `function` && Buffer.isBuffer(e),
    f = (e) => l.call(e) == `[object Object]`,
    p = (e) => typeof e == `string` || l.call(e) == `[object String]`,
    m = (e) => typeof e == `number` || l.call(e) == `[object Number]`,
    h = (e) => typeof e == `bigint`,
    g = (e) => typeof e == `function`,
    _ = (e) => l.call(e) == `[object Map]`,
    v = (e) => l.call(e) == `[object Set]`,
    y = { "\\": `\\\\`, "\b": `\\b`, "\f": `\\f`, "\n": `\\n`, "\r": `\\r`, "	": `\\t` },
    b = /[\\\b\f\n\r\t]/,
    x = /[0-9]/,
    S = /[\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/,
    C = /([\uD800-\uDBFF][\uDC00-\uDFFF])|([\uD800-\uDFFF])|(['"`])|[^]/g,
    ee = /([\uD800-\uDBFF][\uDC00-\uDFFF])|([\uD800-\uDFFF])|(['"`])|[^ !#-&\(-\[\]-_a-~]/g,
    w = (e, t) => {
      let n = () => {
          ((ie = re), ++t.indentLevel, (re = t.indent.repeat(t.indentLevel)));
        },
        r = {
          escapeEverything: !1,
          minimal: !1,
          isScriptContext: !1,
          quotes: `single`,
          wrap: !1,
          es6: !1,
          json: !1,
          compact: !0,
          lowercaseHex: !1,
          numbers: `decimal`,
          indent: `	`,
          indentLevel: 0,
          __inline1__: !1,
          __inline2__: !1,
        },
        l = t && t.json;
      (l && ((r.quotes = `double`), (r.wrap = !0)),
        (t = a(r, t)),
        t.quotes != `single` &&
          t.quotes != `double` &&
          t.quotes != `backtick` &&
          (t.quotes = `single`));
      let te = t.quotes == `double` ? `"` : t.quotes == `backtick` ? "`" : `'`,
        ne = t.compact,
        T = t.lowercaseHex,
        re = t.indent.repeat(t.indentLevel),
        ie = ``,
        ae = t.__inline1__,
        oe = t.__inline2__,
        se = ne
          ? ``
          : `
`,
        ce,
        le = !0,
        E = t.numbers == `binary`,
        D = t.numbers == `octal`,
        ue = t.numbers == `decimal`,
        de = t.numbers == `hexadecimal`;
      if ((l && e && g(e.toJSON) && (e = e.toJSON()), !p(e))) {
        if (_(e))
          return e.size == 0
            ? `new Map()`
            : (ne || ((t.__inline1__ = !0), (t.__inline2__ = !1)),
              `new Map(` + w(Array.from(e), t) + `)`);
        if (v(e)) return e.size == 0 ? `new Set()` : `new Set(` + w(Array.from(e), t) + `)`;
        if (d(e))
          return e.length == 0 ? `Buffer.from([])` : `Buffer.from(` + w(Array.from(e), t) + `)`;
        if (u(e))
          return (
            (ce = []),
            (t.wrap = !0),
            ae && ((t.__inline1__ = !1), (t.__inline2__ = !0)),
            oe || n(),
            o(e, (e) => {
              ((le = !1), oe && (t.__inline2__ = !1), ce.push((ne || oe ? `` : re) + w(e, t)));
            }),
            le
              ? `[]`
              : oe
                ? `[` + ce.join(`, `) + `]`
                : `[` + se + ce.join(`,` + se) + se + (ne ? `` : ie) + `]`
          );
        if (m(e) || h(e)) {
          if (l) return JSON.stringify(Number(e));
          let t;
          if (ue) t = String(e);
          else if (de) {
            let n = e.toString(16);
            (T || (n = n.toUpperCase()), (t = `0x` + n));
          } else E ? (t = `0b` + e.toString(2)) : D && (t = `0o` + e.toString(8));
          return h(e) ? t + `n` : t;
        } else if (h(e)) return l ? JSON.stringify(Number(e)) : e + `n`;
        else if (f(e))
          return (
            (ce = []),
            (t.wrap = !0),
            n(),
            i(e, (e, n) => {
              ((le = !1), ce.push((ne ? `` : re) + w(e, t) + `:` + (ne ? `` : ` `) + w(n, t)));
            }),
            le ? `{}` : `{` + se + ce.join(`,` + se) + se + (ne ? `` : ie) + `}`
          );
        else return l ? JSON.stringify(e) || `null` : String(e);
      }
      let fe = t.escapeEverything ? C : ee;
      return (
        (ce = e.replace(fe, (e, n, r, i, a, o) => {
          if (n) {
            if (t.minimal) return n;
            let e = n.charCodeAt(0),
              r = n.charCodeAt(1);
            return t.es6
              ? `\\u{` + c((e - 55296) * 1024 + r - 56320 + 65536, T) + `}`
              : s(c(e, T)) + s(c(r, T));
          }
          if (r) return s(c(r.charCodeAt(0), T));
          if (e == `\0` && !l && !x.test(o.charAt(a + 1))) return `\\0`;
          if (i) return i == te || t.escapeEverything ? `\\` + i : i;
          if (b.test(e)) return y[e];
          if (t.minimal && !S.test(e)) return e;
          let u = c(e.charCodeAt(0), T);
          return l || u.length > 2 ? s(u) : `\\x` + (`00` + u).slice(-2);
        })),
        te == "`" && (ce = ce.replace(/\$\{/g, "\\${")),
        t.isScriptContext &&
          (ce = ce
            .replace(/<\/(script|style)/gi, `<\\/$1`)
            .replace(/<!--/g, l ? `\\u003C!--` : `\\x3C!--`)),
        t.wrap && (ce = te + ce + te),
        ce
      );
    };
  ((w.version = `3.0.2`), (t.exports = w));
})();
function sn({ children: e, log: t }) {
  return typeof document < `u`
    ? null
    : (0, N.jsx)(`script`, {
        className: `tsr-once`,
        dangerouslySetInnerHTML: {
          __html: [
            e,
            ``,
            `if (typeof __TSR_SSR__ !== "undefined") __TSR_SSR__.cleanScripts()`,
          ].filter(Boolean).join(`
`),
        },
      });
}
function cn() {
  let e = P(),
    t = (e.options.getScrollRestorationKey || Re)(e.latestLocation),
    n = t === Re(e.latestLocation) ? null : t;
  return !e.isScrollRestoring || !e.isServer
    ? null
    : (0, N.jsx)(sn, {
        children: `(${Ve.toString()})(${JSON.stringify(Pe)},${JSON.stringify(n)}, undefined, true)`,
        log: !1,
      });
}
var ln = M.memo(function ({ matchId: e }) {
  let t = P(),
    n = F({ select: (t) => t.matches.find((t) => t.id === e)?.routeId });
  E(n, `Could not find routeId for matchId "${e}". Please file an issue!`);
  let r = t.routesById[n],
    i = r.options.pendingComponent ?? t.options.defaultPendingComponent,
    a = i ? (0, N.jsx)(i, {}) : null,
    o = r.options.errorComponent ?? t.options.defaultErrorComponent,
    s = r.options.onCatch ?? t.options.defaultOnCatch,
    c = r.isRoot
      ? (r.options.notFoundComponent ?? t.options.notFoundRoute?.options.component)
      : r.options.notFoundComponent,
    l =
      (!r.isRoot || r.options.wrapInSuspense) &&
      (r.options.wrapInSuspense ?? i ?? r.options.errorComponent?.preload)
        ? M.Suspense
        : an,
    u = o ? Ot : an,
    d = c ? nn : an,
    f = F({ select: (e) => e.loadedAt }),
    p = F({
      select: (t) => {
        let n = t.matches.findIndex((t) => t.id === e);
        return t.matches[n - 1]?.routeId;
      },
    });
  return (0, N.jsxs)(N.Fragment, {
    children: [
      (0, N.jsx)(Ut.Provider, {
        value: e,
        children: (0, N.jsx)(l, {
          fallback: a,
          children: (0, N.jsx)(u, {
            getResetKey: () => f,
            errorComponent: o || At,
            onCatch: (t, n) => {
              if (Me(t)) throw t;
              (yt(!1, `Error in route match: ${e}`), s?.(t, n));
            },
            children: (0, N.jsx)(d, {
              fallback: (e) => {
                if (!c || (e.routeId && e.routeId !== n) || (!e.routeId && !r.isRoot)) throw e;
                return M.createElement(c, e);
              },
              children: (0, N.jsx)(dn, { matchId: e }),
            }),
          }),
        }),
      }),
      p === `__root__` && t.options.scrollRestoration
        ? (0, N.jsxs)(N.Fragment, { children: [(0, N.jsx)(un, {}), (0, N.jsx)(cn, {})] })
        : null,
    ],
  });
});
function un() {
  let e = P(),
    t = M.useRef(void 0);
  return (0, N.jsx)(
    `script`,
    {
      suppressHydrationWarning: !0,
      ref: (n) => {
        n &&
          (t.current === void 0 || t.current.href !== e.latestLocation.href) &&
          (e.emit({ type: `onRendered`, ...tt(e.state) }), (t.current = e.latestLocation));
      },
    },
    e.latestLocation.state.key,
  );
}
var dn = M.memo(function ({ matchId: e }) {
    let t = P(),
      {
        match: n,
        key: r,
        routeId: i,
      } = F({
        select: (n) => {
          let r = n.matches.findIndex((t) => t.id === e),
            i = n.matches[r],
            a = i.routeId,
            o = (t.routesById[a].options.remountDeps ?? t.options.defaultRemountDeps)?.({
              routeId: a,
              loaderDeps: i.loaderDeps,
              params: i._strictParams,
              search: i._strictSearch,
            });
          return {
            key: o ? JSON.stringify(o) : void 0,
            routeId: a,
            match: fe(i, [`id`, `status`, `error`]),
          };
        },
        structuralSharing: !0,
      }),
      a = t.routesById[i],
      o = M.useMemo(() => {
        let e = a.options.component ?? t.options.defaultComponent;
        return e ? (0, N.jsx)(e, {}, r) : (0, N.jsx)(fn, {});
      }, [r, a.options.component, t.options.defaultComponent]),
      s = (a.options.errorComponent ?? t.options.defaultErrorComponent) || At;
    if (n.status === `notFound`)
      return (E(Me(n.error), `Expected a notFound error`), on(t, a, n.error));
    if (n.status === `redirected`)
      throw (E(Qe(n.error), `Expected a redirect error`), t.getMatch(n.id)?.loadPromise);
    if (n.status === `error`) {
      if (t.isServer)
        return (0, N.jsx)(s, { error: n.error, reset: void 0, info: { componentStack: `` } });
      throw n.error;
    }
    if (n.status === `pending`) {
      let e = a.options.pendingMinMs ?? t.options.defaultPendingMinMs;
      if (e && !t.getMatch(n.id)?.minPendingPromise && !t.isServer) {
        let r = _e();
        (Promise.resolve().then(() => {
          t.updateMatch(n.id, (e) => ({ ...e, minPendingPromise: r }));
        }),
          setTimeout(() => {
            (r.resolve(), t.updateMatch(n.id, (e) => ({ ...e, minPendingPromise: void 0 })));
          }, e));
      }
      throw t.getMatch(n.id)?.loadPromise;
    }
    return o;
  }),
  fn = M.memo(function () {
    let e = P(),
      t = M.useContext(Ut),
      n = F({ select: (e) => e.matches.find((e) => e.id === t)?.routeId }),
      r = e.routesById[n],
      i = F({
        select: (e) => {
          let n = e.matches.find((e) => e.id === t);
          return (E(n, `Could not find parent match for matchId "${t}"`), n.globalNotFound);
        },
      }),
      a = F({
        select: (e) => {
          let n = e.matches;
          return n[n.findIndex((e) => e.id === t) + 1]?.id;
        },
      });
    if (i) return on(e, r, void 0);
    if (!a) return null;
    let o = (0, N.jsx)(ln, { matchId: a }),
      s = e.options.defaultPendingComponent
        ? (0, N.jsx)(e.options.defaultPendingComponent, {})
        : null;
    return t === `__root__` ? (0, N.jsx)(M.Suspense, { fallback: s, children: o }) : o;
  });
function pn() {
  let e = P(),
    t = e.options.defaultPendingComponent
      ? (0, N.jsx)(e.options.defaultPendingComponent, {})
      : null,
    n = (0, N.jsxs)(e.isServer || (typeof document < `u` && e.clientSsr) ? an : M.Suspense, {
      fallback: t,
      children: [(0, N.jsx)(tn, {}), (0, N.jsx)(mn, {})],
    });
  return e.options.InnerWrap ? (0, N.jsx)(e.options.InnerWrap, { children: n }) : n;
}
function mn() {
  let e = F({ select: (e) => e.matches[0]?.id }),
    t = F({ select: (e) => e.loadedAt });
  return (0, N.jsx)(Ut.Provider, {
    value: e,
    children: (0, N.jsx)(Ot, {
      getResetKey: () => t,
      errorComponent: At,
      onCatch: (e) => {
        (yt(
          !1,
          `The following error wasn't caught by any route! At the very least, consider setting an 'errorComponent' in your RootRoute!`,
        ),
          yt(!1, e.message || e.toString()));
      },
      children: e ? (0, N.jsx)(ln, { matchId: e }) : null,
    }),
  });
}
function hn(e) {
  return F({
    select: (t) => {
      let n = t.matches;
      return e?.select ? e.select(n) : n;
    },
    structuralSharing: e?.structuralSharing,
  });
}
var gn = s();
function _n(e, t) {
  let n = P(),
    [r, i] = M.useState(!1),
    a = M.useRef(!1),
    o = en(t),
    {
      activeProps: s = () => ({ className: `active` }),
      inactiveProps: c = () => ({}),
      activeOptions: l,
      to: u,
      preload: d,
      preloadDelay: f,
      hashScrollIntoView: p,
      replace: m,
      startTransition: h,
      resetScroll: g,
      viewTransition: _,
      children: v,
      target: y,
      disabled: b,
      style: x,
      className: S,
      onClick: C,
      onFocus: ee,
      onMouseEnter: w,
      onMouseLeave: te,
      onTouchStart: ne,
      ignoreBlocker: T,
      ...re
    } = e,
    { params: ie, search: ae, hash: oe, state: se, mask: ce, reloadDocument: le, ...E } = re,
    D = M.useMemo(() => {
      try {
        return (new URL(`${u}`), `external`);
      } catch {}
      return `internal`;
    }, [u]),
    ue = F({ select: (e) => e.location.search, structuralSharing: !0 }),
    fe = hn({ select: (t) => e.from ?? t[t.length - 1]?.fullPath }),
    O = M.useMemo(() => ({ ...e, from: fe }), [e, fe]),
    k = M.useMemo(() => n.buildLocation(O), [n, O, ue]),
    A = M.useMemo(
      () => (O.reloadDocument ? !1 : (d ?? n.options.defaultPreload)),
      [n.options.defaultPreload, d, O.reloadDocument],
    ),
    pe = f ?? n.options.defaultPreloadDelay ?? 0,
    me = F({
      select: (e) => {
        if (l?.exact) {
          if (!we(e.location.pathname, k.pathname, n.basepath)) return !1;
        } else {
          let t = Ce(e.location.pathname, n.basepath).split(`/`);
          if (
            !Ce(k.pathname, n.basepath)
              .split(`/`)
              .every((e, n) => e === t[n])
          )
            return !1;
        }
        return (l?.includeSearch ?? !0) &&
          !ge(e.location.search, k.search, {
            partial: !l?.exact,
            ignoreUndefined: !l?.explicitUndefined,
          })
          ? !1
          : l?.includeHash
            ? e.location.hash === k.hash
            : !0;
      },
    }),
    he = M.useCallback(() => {
      n.preloadRoute(O).catch((e) => {
        (console.warn(e), console.warn(dt));
      });
    }, [O, n]);
  if (
    ($t(
      o,
      M.useCallback(
        (e) => {
          e?.isIntersecting && he();
        },
        [he],
      ),
      { rootMargin: `100px` },
      { disabled: !!b || A !== `viewport` },
    ),
    Zt(() => {
      a.current || (!b && A === `render` && (he(), (a.current = !0)));
    }, [b, he, A]),
    D === `external`)
  )
    return {
      ...E,
      ref: o,
      type: D,
      href: u,
      ...(v && { children: v }),
      ...(y && { target: y }),
      ...(b && { disabled: b }),
      ...(x && { style: x }),
      ...(S && { className: S }),
      ...(C && { onClick: C }),
      ...(ee && { onFocus: ee }),
      ...(w && { onMouseEnter: w }),
      ...(te && { onMouseLeave: te }),
      ...(ne && { onTouchStart: ne }),
    };
  let _e = (e) => {
      if (!b && !yn(e) && !e.defaultPrevented && (!y || y === `_self`) && e.button === 0) {
        (e.preventDefault(),
          (0, gn.flushSync)(() => {
            i(!0);
          }));
        let t = n.subscribe(`onResolved`, () => {
          (t(), i(!1));
        });
        return n.navigate({
          ...O,
          replace: m,
          resetScroll: g,
          hashScrollIntoView: p,
          startTransition: h,
          viewTransition: _,
          ignoreBlocker: T,
        });
      }
    },
    ve = (e) => {
      b || (A && he());
    },
    ye = ve,
    be = (e) => {
      if (b) return;
      let t = e.target || {};
      if (A) {
        if (t.preloadTimeout) return;
        t.preloadTimeout = setTimeout(() => {
          ((t.preloadTimeout = null), he());
        }, pe);
      }
    },
    xe = (e) => {
      if (b) return;
      let t = e.target || {};
      t.preloadTimeout &&= (clearTimeout(t.preloadTimeout), null);
    },
    Se = (e) => (t) => {
      var n;
      ((n = t.persist) == null || n.call(t),
        e.filter(Boolean).forEach((e) => {
          t.defaultPrevented || e(t);
        }));
    },
    Te = me ? (de(s, {}) ?? {}) : {},
    Ee = me ? {} : de(c, {}),
    De = [S, Te.className, Ee.className].filter(Boolean).join(` `),
    Oe = { ...x, ...Te.style, ...Ee.style };
  return {
    ...E,
    ...Te,
    ...Ee,
    href: b
      ? void 0
      : k.maskedLocation
        ? n.history.createHref(k.maskedLocation.href)
        : n.history.createHref(k.href),
    ref: o,
    onClick: Se([C, _e]),
    onFocus: Se([ee, ve]),
    onMouseEnter: Se([w, be]),
    onMouseLeave: Se([te, xe]),
    onTouchStart: Se([ne, ye]),
    disabled: !!b,
    target: y,
    ...(Object.keys(Oe).length && { style: Oe }),
    ...(De && { className: De }),
    ...(b && { role: `link`, "aria-disabled": !0 }),
    ...(me && { "data-status": `active`, "aria-current": `page` }),
    ...(r && { "data-transitioning": `transitioning` }),
  };
}
var vn = M.forwardRef((e, t) => {
  let { _asChild: n, ...r } = e,
    { type: i, ref: a, ...o } = _n(r, t),
    s =
      typeof r.children == `function`
        ? r.children({ isActive: o[`data-status`] === `active` })
        : r.children;
  return (n === void 0 && delete o.disabled, M.createElement(n || `a`, { ...o, ref: a }, s));
});
function yn(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
var bn = class extends ft {
  constructor(e) {
    (super(e),
      (this.useMatch = (e) =>
        Gt({ select: e?.select, from: this.id, structuralSharing: e?.structuralSharing })),
      (this.useRouteContext = (e) =>
        Gt({ ...e, from: this.id, select: (t) => (e?.select ? e.select(t.context) : t.context) })),
      (this.useSearch = (e) =>
        Yt({ select: e?.select, structuralSharing: e?.structuralSharing, from: this.id })),
      (this.useParams = (e) =>
        Jt({ select: e?.select, structuralSharing: e?.structuralSharing, from: this.id })),
      (this.useLoaderDeps = (e) => qt({ ...e, from: this.id })),
      (this.useLoaderData = (e) => Kt({ ...e, from: this.id })),
      (this.useNavigate = () => Xt({ from: this.fullPath })),
      (this.Link = M.forwardRef((e, t) => (0, N.jsx)(vn, { ref: t, from: this.fullPath, ...e }))),
      (this.$$typeof = Symbol.for(`react.memo`)));
  }
};
function xn(e) {
  return new bn(e);
}
var Sn = class extends pt {
  constructor(e) {
    (super(e),
      (this.useMatch = (e) =>
        Gt({ select: e?.select, from: this.id, structuralSharing: e?.structuralSharing })),
      (this.useRouteContext = (e) =>
        Gt({ ...e, from: this.id, select: (t) => (e?.select ? e.select(t.context) : t.context) })),
      (this.useSearch = (e) =>
        Yt({ select: e?.select, structuralSharing: e?.structuralSharing, from: this.id })),
      (this.useParams = (e) =>
        Jt({ select: e?.select, structuralSharing: e?.structuralSharing, from: this.id })),
      (this.useLoaderDeps = (e) => qt({ ...e, from: this.id })),
      (this.useLoaderData = (e) => Kt({ ...e, from: this.id })),
      (this.useNavigate = () => Xt({ from: this.fullPath })),
      (this.Link = M.forwardRef((e, t) => (0, N.jsx)(vn, { ref: t, from: this.fullPath, ...e }))),
      (this.$$typeof = Symbol.for(`react.memo`)));
  }
};
function Cn(e) {
  return new Sn(e);
}
function wn(e) {
  return new Tn(e, { silent: !0 }).createRoute;
}
var Tn = class {
  constructor(e, t) {
    ((this.path = e),
      (this.createRoute = (e) => {
        yt(
          this.silent,
          `FileRoute is deprecated and will be removed in the next major version. Use the createFileRoute(path)(options) function instead.`,
        );
        let t = xn(e);
        return ((t.isRoot = !1), t);
      }),
      (this.silent = t?.silent));
  }
};
function En(e) {
  return typeof e?.message == `string`
    ? e.message.startsWith(`Failed to fetch dynamically imported module`) ||
        e.message.startsWith(`error loading dynamically imported module`) ||
        e.message.startsWith(`Importing a module script failed`)
    : !1;
}
function Dn(e, t, n) {
  let r,
    i,
    a,
    o,
    s = () =>
      typeof document > `u` && n?.() === !1
        ? ((i = () => null), Promise.resolve())
        : ((r ||= e()
            .then((e) => {
              ((r = void 0), (i = e[t ?? `default`]));
            })
            .catch((e) => {
              if (
                ((a = e),
                En(a) && a instanceof Error && typeof window < `u` && typeof sessionStorage < `u`)
              ) {
                let e = `tanstack_router_reload:${a.message}`;
                sessionStorage.getItem(e) || (sessionStorage.setItem(e, `1`), (o = !0));
              }
            })),
          r),
    c = function (e) {
      if (o) throw (window.location.reload(), new Promise(() => {}));
      if (a) throw a;
      if (!i) throw s();
      return n?.() === !1
        ? (0, N.jsx)(jt, { fallback: (0, N.jsx)(fn, {}), children: M.createElement(i, e) })
        : M.createElement(i, e);
    };
  return ((c.preload = s), c);
}
var On = (e) => new kn(e),
  kn = class extends nt {
    constructor(e) {
      super(e);
    }
  };
function An({ router: e, children: t, ...n }) {
  e.update({ ...e.options, ...n, context: { ...e.options.context, ...n.context } });
  let r = (0, N.jsx)(Ht().Provider, { value: e, children: t });
  return e.options.Wrap ? (0, N.jsx)(e.options.Wrap, { children: r }) : r;
}
function jn({ router: e, ...t }) {
  return (0, N.jsx)(An, { router: e, ...t, children: (0, N.jsx)(pn, {}) });
}
function Mn() {
  He(P(), !0);
}
function Nn(e) {
  return (Mn(), null);
}
function Pn({ tag: e, attrs: t, children: n }) {
  switch (e) {
    case `title`:
      return (0, N.jsx)(`title`, { ...t, suppressHydrationWarning: !0, children: n });
    case `meta`:
      return (0, N.jsx)(`meta`, { ...t, suppressHydrationWarning: !0 });
    case `link`:
      return (0, N.jsx)(`link`, { ...t, suppressHydrationWarning: !0 });
    case `style`:
      return (0, N.jsx)(`style`, { ...t, dangerouslySetInnerHTML: { __html: n } });
    case `script`:
      return t && t.src
        ? (0, N.jsx)(`script`, { ...t, suppressHydrationWarning: !0 })
        : typeof n == `string`
          ? (0, N.jsx)(`script`, {
              ...t,
              dangerouslySetInnerHTML: { __html: n },
              suppressHydrationWarning: !0,
            })
          : null;
    default:
      return null;
  }
}
var Fn = () => {
  let e = P(),
    t = F({ select: (e) => e.matches.map((e) => e.meta).filter(Boolean) }),
    n = M.useMemo(() => {
      let e = [],
        n = {},
        r;
      return (
        [...t].reverse().forEach((t) => {
          [...t].reverse().forEach((t) => {
            if (t)
              if (t.title) r ||= { tag: `title`, children: t.title };
              else {
                let r = t.name ?? t.property;
                if (r) {
                  if (n[r]) return;
                  n[r] = !0;
                }
                e.push({ tag: `meta`, attrs: { ...t } });
              }
          });
        }),
        r && e.push(r),
        e.reverse(),
        e
      );
    }, [t]),
    r = F({
      select: (e) =>
        e.matches
          .map((e) => e.links)
          .filter(Boolean)
          .flat(1)
          .map((e) => ({ tag: `link`, attrs: { ...e } })),
      structuralSharing: !0,
    }),
    i = F({
      select: (t) => {
        let n = [];
        return (
          t.matches
            .map((t) => e.looseRoutesById[t.routeId])
            .forEach((t) =>
              e.ssr?.manifest?.routes[t.id]?.preloads?.filter(Boolean).forEach((e) => {
                n.push({ tag: `link`, attrs: { rel: `modulepreload`, href: e } });
              }),
            ),
          n
        );
      },
      structuralSharing: !0,
    }),
    a = F({
      select: (e) =>
        e.matches
          .map((e) => e.headScripts)
          .flat(1)
          .filter(Boolean)
          .map(({ children: e, ...t }) => ({ tag: `script`, attrs: { ...t }, children: e })),
      structuralSharing: !0,
    });
  return Ln([...n, ...i, ...r, ...a], (e) => JSON.stringify(e));
};
function In() {
  return Fn().map((e) => (0, M.createElement)(Pn, { ...e, key: `tsr-meta-${JSON.stringify(e)}` }));
}
function Ln(e, t) {
  let n = new Set();
  return e.filter((e) => {
    let r = t(e);
    return n.has(r) ? !1 : (n.add(r), !0);
  });
}
var Rn = () => {
    let e = P(),
      t = F({
        select: (t) => {
          let n = [],
            r = e.ssr?.manifest;
          return r
            ? (t.matches
                .map((t) => e.looseRoutesById[t.routeId])
                .forEach((e) =>
                  r.routes[e.id]?.assets
                    ?.filter((e) => e.tag === `script`)
                    .forEach((e) => {
                      n.push({ tag: `script`, attrs: e.attrs, children: e.children });
                    }),
                ),
              n)
            : [];
        },
        structuralSharing: !0,
      }),
      { scripts: n } = F({
        select: (e) => ({
          scripts: e.matches
            .map((e) => e.scripts)
            .flat(1)
            .filter(Boolean)
            .map(({ children: e, ...t }) => ({
              tag: `script`,
              attrs: { ...t, suppressHydrationWarning: !0 },
              children: e,
            })),
        }),
      });
    return (0, N.jsx)(N.Fragment, {
      children: [...n, ...t].map((e, t) =>
        (0, M.createElement)(Pn, { ...e, key: `tsr-scripts-${e.tag}-${t}` }),
      ),
    });
  },
  zn;
function Bn(e) {
  return (
    (zn ||= e.router.state.matches.length ? Promise.resolve() : gt(e.router)),
    (0, N.jsx)(Et, { promise: zn, children: () => (0, N.jsx)(jn, { router: e.router }) })
  );
}
var Vn = Cn({
  head: () => ({
    meta: [
      { charSet: `utf-8` },
      { name: `viewport`, content: `width=device-width, initial-scale=1` },
      { title: `AgentX Music Scanner` },
    ],
  }),
  component: Hn,
});
function Hn() {
  return (0, N.jsx)(Un, { children: (0, N.jsx)(fn, {}) });
}
function Un({ children: e }) {
  return (0, N.jsxs)(`html`, {
    lang: `en`,
    children: [
      (0, N.jsx)(`head`, { children: (0, N.jsx)(In, {}) }),
      (0, N.jsxs)(`body`, {
        style: { margin: 0, fontFamily: `sans-serif`, backgroundColor: `#0a0a0a`, color: `#fff` },
        children: [e, (0, N.jsx)(Nn, {}), (0, N.jsx)(Rn, {})],
      }),
    ],
  });
}
var Wn = wn(`/`)({
    component: Dn(
      () => wt(() => import(`./routes-Cv0_7nc9.js`), __vite__mapDeps([0, 1])),
      `component`,
      () => Wn.ssr,
    ),
  }),
  Gn = { IndexRoute: Wn.update({ id: `/`, path: `/`, getParentRoute: () => Vn }) },
  Kn = Vn._addFileChildren(Gn)._addFileTypes();
function qn() {
  return On({ routeTree: Kn });
}
var Jn = qn();
function Yn() {
  return (0, N.jsx)(Bn, { router: Jn });
}
(0, bt.hydrateRoot)(document.getElementById(`root`), (0, N.jsx)(Bn, { router: Jn }));
var Xn = Yn;
export { Xn as default };
