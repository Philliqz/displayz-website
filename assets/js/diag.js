// ponytail: diagnóstico temporal del iPhone (2026-10-27): solo con ?diag en la URL. Manda al Worker
// (lo lee `wrangler tail`) en qué paso se cae el 3D y el estado de cada video. Se borra al resolverlo.
// Script clásico, no módulo: así reporta aunque los módulos no lleguen a ejecutarse.
(function () {
  if (!/[?&]diag/.test(location.search)) return;
  var id = Math.random().toString(36).slice(2, 6);
  function enviar(m) { new Image().src = 'https://displayz-videos.displayz.workers.dev/diag?d=' + encodeURIComponent(id + ' ' + m); }
  window.diagPaso = enviar;
  enviar('inicio ' + innerWidth + 'x' + innerHeight + ' dpr ' + devicePixelRatio);
  addEventListener('error', function (e) { enviar('error: ' + e.message + ' ' + e.filename + ':' + e.lineno); });
  addEventListener('unhandledrejection', function (e) { enviar('rechazo: ' + (e.reason && (e.reason.stack || e.reason))); });
  var n = 0;
  var t = setInterval(function () {
    if (++n > 15) return clearInterval(t);
    var tel = document.querySelector('.phone');
    var vs = [].slice.call(document.querySelectorAll('video')).map(function (v) {
      return (v.currentSrc || v.src || '-').split('/').slice(-1)[0].slice(0, 22) + ' p' + (v.paused ? 1 : 0) + ' r' + v.readyState
        + ' n' + v.networkState + ' t' + v.currentTime.toFixed(1) + (v.error ? ' E' + v.error.code : '');
    });
    enviar('[' + n + '] 3D ' + (tel && tel.classList.contains('is-3d')) + ' canvas ' + !!document.querySelector('.phone-3d')
      + ' oculto ' + document.hidden + ' | ' + vs.join(' ; '));
  }, 3000);
})();
