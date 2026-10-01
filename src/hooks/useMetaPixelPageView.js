import { useEffect } from "react";
import { trackPageView } from "../lib/metaPixel";

/**
 * Dispara PageView uma única vez por carregamento de página.
 *
 * O site é uma landing page única (navegação por âncoras #inicio,
 * #servicos, #contacto, ...), sem router SPA. As âncoras não são novas
 * páginas, por isso não geram PageView — apenas a carga real da página conta.
 * A proteção contra duplicados está em trackPageView (guarda em memória).
 */
export default function useMetaPixelPageView() {
  useEffect(() => {
    trackPageView();
  }, []);
}
