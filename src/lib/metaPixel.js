/**
 * Meta Pixel — implementação centralizada e reutilizável (instância única).
 *
 * Objetivo: medir comportamento e conversões (PageView / Lead / Contact)
 * sem enviar dados pessoais (nome, email, telefone, mensagem) para o Meta.
 *
 * Configuração:
 *   VITE_META_PIXEL_ID = ID do pixel (Events Manager)
 *   - Local: ficheiro .env (não é versionado)
 *   - Vercel: Project Settings > Environment Variables (todas que aplicam)
 *
 * IMPORTANTE — o stub de fbq segue o padrão oficial do Meta, na íntegra:
 *   - `fbq.callMethod` NÃO é pré-definido. Fica `undefined` até o
 *     fbevents.js carregar e o definir. Definimo-lo aqui faria
 *     `fbq.callMethod` chamar `window.fbq.callMethod` — que é o próprio
 *     `fbq` — causando recursão infinita (Maximum call stack size exceeded).
 *   - `window._fbq` é definido, como exige o loader do Meta para detetar
 *     corretamente a versão (evita "Multiple pixels with conflicting versions").
 *   - `fbq.push = fbq` para compatibilidade com o formato array do Meta.
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

const SCRIPT_ID = "meta-pixel-script";
const SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

let initialized = false;
let pageViewSent = false;

const isBrowser = () => typeof window !== "undefined";

const hasPixelId = () =>
  typeof PIXEL_ID === "string" && /^\d{6,20}$/.test(PIXEL_ID.trim());

/**
 * Opt-out explícito. Só bloqueia se o valor for "denied".
 * Por omissão o tracking está ativo, para não alterar o site.
 */
const isAllowed = () => {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem("nd_pixel_consent") !== "denied";
  } catch {
    return true;
  }
};

/**
 * Injeta o stub oficial do Meta e carrega o fbevents.js UMA vez.
 * Retorna true se o pixel estiver pronto a ser usado.
 */
export function initMetaPixel() {
  if (!isBrowser() || !hasPixelId() || initialized) return !!window.fbq;
  initialized = true;

  // Reutiliza uma instância existente (ex.: instalada via GTM) sem
  // a duplicar e sem re-inicializar — uma única fonte de verdade.
  if (window.fbq) return true;

  if (document.getElementById(SCRIPT_ID)) return true;

  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  };

  if (!window._fbq) window._fbq = fbq;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  window.fbq = fbq;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = SCRIPT_SRC;
  const first = document.getElementsByTagName("script")[0];
  first.parentNode.insertBefore(script, first);

  window.fbq("init", PIXEL_ID.trim());
  return true;
}

const ready = () => {
  if (!isAllowed() || !hasPixelId()) return false;
  return initMetaPixel() && !!window.fbq;
};

/**
 * PageView — uma vez por carregamento de página.
 * Guarda em memória evita duplicados no mesmo carregamento
 * (ex.: duplo mount do React StrictMode em desenvolvimento).
 */
export function trackPageView() {
  if (pageViewSent || !ready()) return;
  pageViewSent = true;
  window.fbq("track", "PageView");
}

/**
 * Contact — clique real do utilizador num link/botão de WhatsApp.
 * `placement` é apenas um rótulo interno (secção do site), não dado pessoal.
 */
export function trackContact(placement = "whatsapp") {
  if (!ready()) return;
  window.fbq("track", "Contact", { placement });
}

/**
 * Lead — pedido de orçamento submetido com sucesso.
 * Só deve ser chamada depois de uma submissão válida confirmada pelo servidor.
 */
export function trackLead(content = "orcamento") {
  if (!ready()) return;
  window.fbq("track", "Lead", { content });
}
