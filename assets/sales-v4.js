(() => {
  const els = document.querySelectorAll(".v4-reveal");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }, {threshold: 0.075, rootMargin:"0px 0px -25px 0px"});
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add("is-visible"));

  const cfg = window.GRAPHMYTRADE_SITE || {};
  const measurementId = typeof cfg.ga4MeasurementId === "string" ? cfg.ga4MeasurementId.trim() : "";
  const banner = document.getElementById("analytics-consent");
  const storageKey = "graphmytrade_site_analytics_consent_v1";
  const isMeasurementIdValid = /^G-[A-Z0-9]{5,16}$/.test(measurementId);
  let analyticsLoaded = false;

  function startAnalytics() {
    if (!isMeasurementIdValid || analyticsLoaded) return;
    analyticsLoaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){window.dataLayer.push(arguments)};
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { anonymize_ip:true });
    document.querySelectorAll('a[href="/download/"]').forEach(link => link.addEventListener("click", ()=>window.gtag?.("event","select_content",{content_type:"cta",item_id:"windows_download"})));
  }
  if (isMeasurementIdValid) {
    let consent = null;
    try { consent = localStorage.getItem(storageKey); } catch(e) {}
    if (consent === "yes") startAnalytics();
    else if (consent !== "no" && banner) banner.hidden = false;
    document.getElementById("accept-analytics")?.addEventListener("click", () => {
      try { localStorage.setItem(storageKey,"yes") } catch(e) {}
      banner.hidden = true; startAnalytics();
    });
    document.getElementById("decline-analytics")?.addEventListener("click", () => {
      try { localStorage.setItem(storageKey,"no") } catch(e) {}
      banner.hidden = true;
    });
  }
})();
