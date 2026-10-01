/**
 * Meta Pixel — implementação centralizada e reutilizável.
 *
 * Objetivo: medir comportamento e conversões (PageView / Lead / Contact)
 * sem enviar dados pessoais (nome, email, telefone, mensagem) para o Meta.
 *
 * Configuração:
 *   VITE_META_PIXEL_ID = ID do pixel (Events Manager)
 *   - Local: ficheiro .env (não é versionado)
 *   - Vercel: Project Settings > Environment Variables (todas que aplicam)
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

const SCRIPT_ID = "meta-pixel-script";

let initialized = false;
let pageViewSent = false;

const isBrowser = () => typeof window !== "undefined";

/**
 * Opt-out explícito. Só bloqueia se o utilizador (ou um teste manual)
 * tiver definido "denied". Por omissão o tracking está ativo, para não
 * alterar o comportamento atual do site.
 */
const isAllowed = () => {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem("nd_pixel_consent") !== "denied";
  } catch {
    return true;
  }
};

const hasPixelId = () =>
  typeof PIXEL_ID === "string" && /^\d{6,20}$/.test(PIXEL_ID.trim());

/** Carrega o script do Meta uma única vez. */
export function initMetaPixel() {
  if (!isBrowser() || !hasPixelId() || initialized) return;
  if (document.getElementById(SCRIPT_ID)) return;

  if (!window.fbq) {
    /* eslint-disable no-multi-assign */
    const fbq = (...args) => {
      if (fbq.callMethod) return fbq.callMethod(...args);
      fbq.queue.push(args);
    };
    /* eslint-enable no-multi-assign */

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.callMethod = (...args) => {
      window.fbq.callMethod
        ? window.fbq.callMethod(...args)
        : window.fbq.queue.push(args);
    };

    window.fbq = fbq;
  }

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", PIXEL_ID.trim());
  initialized = true;
}

const ready = () => {
  if (!isAllowed() || !hasPixelId()) return false;
  initMetaPixel();
  return !!window.fbq;
};

/**
 * PageView — disparado uma vez por carregamento de página.
 * A guarda em memória evita duplicados no mesmo carregamento
 * (ex.: duplo mount do React StrictMode em desenvolvimento).
 */
export function trackPageView() {
  if (pageViewSent || !ready()) return;
  pageViewSent = true;
  window.fbq("track", "PageView");
}

/**
 * Contact — clique real do utilizador num link/botão de WhatsApp.
 * `placement` é apenas um rótulo interno do site (não é dado pessoal).
 */
export function trackContact(placement = "whatsapp") {
  if (!ready()) return;
  window.fbq("track", "Contact", { placement });
}

/**
 * Lead — pedido de orçamento submetido com sucesso.
 * Só deve ser chamada depois de uma submissão válida e confirmada pelo servidor.
 */
export function trackLead(content = "orcamento") {
  if (!ready()) return;
  window.fbq("track", "Lead", { content });
}
