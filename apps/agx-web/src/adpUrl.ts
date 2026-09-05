/** Keep the control-plane connection on the browser's origin via the dev proxy. */
export function getAdpUrl(location: { protocol: string; host: string }): string {
  return `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/adp`;
}
