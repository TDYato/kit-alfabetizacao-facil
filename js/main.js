/* =========================================================
   CONFIGURAÇÃO: altere links e preços somente aqui
   ========================================================= */
const CONFIG = {
  checkoutBasico: "https://SEU-LINK-BASICO",
  checkoutCompleto: "https://SEU-LINK-COMPLETO",
  whatsappSuporte: "https://wa.me/55XXXXXXXXXXX",
  precoBasico: "9,90", precoBasicoDe: "57,00",
  precoCompleto: "17,90", precoCompletoDe: "97,00",
  parcelas: 8,

  // Cronômetro opcional (desligado). Para ligar, descomente e defina as horas.
  // A contagem é salva por visitante e NÃO reinicia ao recarregar.
  // timerHoras: 24,

  // Prints reais de WhatsApp em /img. Adicione ou remova nomes conforme os arquivos.
  // O primeiro da lista também aparece em destaque logo após o hero.
  depoimentos: [
    "depoimento-1.webp",
    "depoimento-2.webp",
    "depoimento-3.webp",
    "depoimento-4.webp"
  ]
};

(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ---------- Preços ---------- */
  const PRECOS = {
    completo: CONFIG.precoCompleto,
    completoDe: CONFIG.precoCompletoDe,
    basico: CONFIG.precoBasico,
    basicoDe: CONFIG.precoBasicoDe
  };
  $$("[data-price]").forEach(el => {
    const v = PRECOS[el.dataset.price];
    if (v) el.textContent = v;
  });
  $$("[data-parcelas]").forEach(el => { el.textContent = CONFIG.parcelas; });

  /* ---------- Links de checkout + repasse de UTM ---------- */
  const PARAMS_REPASSE = /^(utm_[a-z]+|src|sck|xcod|fbclid|gclid|ttclid)$/i;
  const repasse = new URLSearchParams();
  new URLSearchParams(location.search).forEach((v, k) => {
    if (PARAMS_REPASSE.test(k)) repasse.set(k, v);
  });

  function comParametros(base) {
    try {
      const url = new URL(base);
      repasse.forEach((v, k) => url.searchParams.set(k, v));
      return url.toString();
    } catch (e) {
      return base;
    }
  }

  const LINKS = { completo: CONFIG.checkoutCompleto, basico: CONFIG.checkoutBasico };
  const VALORES = {
    completo: parseFloat(CONFIG.precoCompleto.replace(",", ".")),
    basico: parseFloat(CONFIG.precoBasico.replace(",", "."))
  };

  $$("[data-checkout]").forEach(a => {
    const plano = a.dataset.checkout;
    a.href = comParametros(LINKS[plano]);
    a.addEventListener("click", () => {
      if (typeof window.fbq === "function") {
        window.fbq("track", "InitiateCheckout", {
          value: VALORES[plano], currency: "BRL", content_name: "Kit " + plano
        });
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", "begin_checkout", { value: VALORES[plano], currency: "BRL" });
      }
    });
  });

  $$("[data-whatsapp]").forEach(a => { a.href = CONFIG.whatsappSuporte; });

  /* ---------- Depoimentos (a partir da lista do CONFIG) ---------- */
  function criaImagem(arquivo, alt, w, h) {
    const box = document.createElement("div");
    box.className = "img-box";
    box.dataset.file = arquivo;
    const img = document.createElement("img");
    img.src = "img/" + arquivo;
    img.width = w; img.height = h;
    img.loading = "lazy"; img.decoding = "async";
    img.alt = alt;
    box.appendChild(img);
    return box;
  }

  const lista = CONFIG.depoimentos || [];
  const grade = $("[data-depos]");
  lista.forEach((arq, i) => {
    grade.appendChild(criaImagem(arq, "Print de conversa no WhatsApp com depoimento real de cliente (" + (i + 1) + ")", 600, 1000));
  });
  const destaque = $("[data-depo-destaque]");
  if (lista.length) {
    destaque.appendChild(criaImagem(lista[0], "Print de conversa no WhatsApp com depoimento real de cliente", 600, 1000));
  } else {
    destaque.remove();
    grade.closest("section").remove();
  }

  /* ---------- Placeholders para imagens que ainda não existem ---------- */
  function marcaAusente(img) {
    const box = img.closest(".img-box");
    if (!box) return;
    box.classList.add("is-missing");
    const w = img.getAttribute("width"), h = img.getAttribute("height");
    if (w && h) box.style.aspectRatio = w + " / " + h;
  }
  $$(".img-box img").forEach(img => {
    img.addEventListener("error", () => marcaAusente(img));
    img.addEventListener("load", () => {
      const box = img.closest(".img-box");
      box.classList.remove("is-missing");
      box.style.aspectRatio = "";
    });
    if (img.complete && img.naturalWidth === 0) marcaAusente(img);
  });

  /* ---------- Carrossel (scroll-snap) ---------- */
  $$("[data-carousel]").forEach(car => {
    const track = $(".carousel__track", car);
    const slides = $$(".carousel__slide", track);
    const dotsWrap = $("[data-dots]", car);
    const prev = $(".carousel__btn--prev", car);
    const next = $(".carousel__btn--next", car);

    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Ir para a página " + (i + 1) + " de " + slides.length);
      b.addEventListener("click", () => irPara(i));
      dotsWrap.appendChild(b);
      return b;
    });

    const atual = () => Math.round(track.scrollLeft / track.clientWidth);
    function irPara(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    }
    function atualiza() {
      const i = atual();
      dots.forEach((d, j) => d.setAttribute("aria-current", j === i ? "true" : "false"));
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    }

    prev.addEventListener("click", () => irPara(atual() - 1));
    next.addEventListener("click", () => irPara(atual() + 1));
    track.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); irPara(atual() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); irPara(atual() - 1); }
    });
    let raf;
    track.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(atualiza);
    }, { passive: true });
    atualiza();
  });

  /* ---------- FAQ: só um aberto por vez ---------- */
  const faq = $$("[data-faq] details");
  faq.forEach(d => d.addEventListener("toggle", () => {
    if (d.open) faq.forEach(o => { if (o !== d) o.open = false; });
  }));

  /* ---------- Barra CTA fixa (some quando #ofertas está visível) ---------- */
  const bar = $("[data-stickybar]");
  const hero = $(".hero");
  const ofertas = $("#ofertas");
  if (bar && hero && ofertas && "IntersectionObserver" in window) {
    let passouHero = false, ofertasVisivel = false;
    const aplica = () => {
      const mostra = passouHero && !ofertasVisivel;
      bar.classList.toggle("is-visible", mostra);
      bar.setAttribute("aria-hidden", mostra ? "false" : "true");
      $$("a", bar).forEach(a => { a.tabIndex = mostra ? 0 : -1; });
    };
    new IntersectionObserver(([e]) => {
      passouHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      aplica();
    }).observe(hero);
    new IntersectionObserver(([e]) => {
      ofertasVisivel = e.isIntersecting;
      aplica();
    }).observe(ofertas);
  }

  /* ---------- Cronômetro opcional (real, por visitante) ---------- */
  const timer = $("[data-timer]");
  if (timer && CONFIG.timerHoras > 0) {
    const CHAVE = "kaf_oferta_fim";
    let fim = null;
    try {
      fim = parseInt(localStorage.getItem(CHAVE), 10);
      if (!fim) {
        fim = Date.now() + CONFIG.timerHoras * 3600 * 1000;
        localStorage.setItem(CHAVE, String(fim));
      }
      // Confirma que foi salvo; sem armazenamento o timer reiniciaria, então não é exibido.
      if (parseInt(localStorage.getItem(CHAVE), 10) !== fim) fim = null;
    } catch (e) {
      fim = null;
    }

    if (fim && fim > Date.now()) {
      const relogio = $("[data-timer-clock]", timer);
      const pad = n => String(n).padStart(2, "0");
      let id;
      const tick = () => {
        const resta = fim - Date.now();
        if (resta <= 0) { timer.hidden = true; clearInterval(id); return; }
        const s = Math.floor(resta / 1000);
        relogio.textContent = pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
      };
      tick();
      id = setInterval(tick, 1000);
      timer.hidden = false;
    }
  }
})();
