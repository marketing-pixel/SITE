/* ==================================================================
   EDITOR PREMIUM DE IMAGENS — prévia, recorte (4:5), zoom, posição
   + prévia do anúncio no painel ADM
   ================================================================== */
(function () {
    "use strict";

    // ---------- Estado do editor ----------
    var estado = {
        img: null,          // Image original
        zoom: 1,
        offsetX: 0, offsetY: 0,
        rotacao: 0,
        arrastando: false,
        inicioX: 0, inicioY: 0,
        callback: null      // função a chamar com o dataURL final
    };

    var overlay = document.getElementById("editor-img-overlay");
    var canvas = document.getElementById("editor-canvas");
    var area = document.getElementById("editor-crop-area");
    var zoomInput = document.getElementById("editor-zoom");
    var ctx = canvas.getContext("2d");

    var LARGURA = 800, ALTURA = 1000; // 4:5

    function desenhar() {
        if (!estado.img) return;
        ctx.save();
        ctx.fillStyle = "#1a2430";
        ctx.fillRect(0, 0, LARGURA, ALTURA);
        ctx.translate(LARGURA / 2 + estado.offsetX, ALTURA / 2 + estado.offsetY);
        ctx.rotate(estado.rotacao * Math.PI / 180);
        var img = estado.img;
        // escala base: cobrir o canvas (cover) * zoom do usuário
        var escalaBase = Math.max(LARGURA / img.width, ALTURA / img.height);
        var escala = escalaBase * estado.zoom;
        ctx.drawImage(img, -img.width * escala / 2, -img.height * escala / 2, img.width * escala, img.height * escala);
        ctx.restore();
    }

    function limitarOffset() {
        if (!estado.img) return;
        var img = estado.img;
        var escalaBase = Math.max(LARGURA / img.width, ALTURA / img.height);
        var escala = escalaBase * estado.zoom;
        var metadeW = img.width * escala / 2;
        var metadeH = img.height * escala / 2;
        // considera rotação
        if (estado.rotacao % 180 !== 0) {
            var tmp = metadeW; metadeW = metadeH; metadeH = tmp;
        }
        var maxX = Math.max(0, metadeW - LARGURA / 2);
        var maxY = Math.max(0, metadeH - ALTURA / 2);
        estado.offsetX = Math.max(-maxX, Math.min(maxX, estado.offsetX));
        estado.offsetY = Math.max(-maxY, Math.min(maxY, estado.offsetY));
    }

    function abrirEditor(dataURL, callback) {
        var img = new Image();
        img.onload = function () {
            estado.img = img;
            estado.zoom = 1;
            estado.offsetX = 0;
            estado.offsetY = 0;
            estado.rotacao = 0;
            estado.callback = callback;
            zoomInput.value = 100;
            desenhar();
            overlay.classList.add("aberto");
        };
        img.src = dataURL;
    }

    function fecharEditor() {
        overlay.classList.remove("aberto");
        estado.img = null;
        estado.callback = null;
    }

    function usarImagem() {
        if (!estado.callback) return fecharEditor();
        limitarOffset();
        desenhar();
        var dataURL = canvas.toDataURL("image/jpeg", 0.9);
        var cb = estado.callback;
        fecharEditor();
        cb(dataURL);
    }

    // ---------- Eventos ----------
    document.getElementById("editor-cancelar").addEventListener("click", fecharEditor);
    document.getElementById("editor-usar").addEventListener("click", usarImagem);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) fecharEditor(); });

    zoomInput.addEventListener("input", function () {
        estado.zoom = Number(zoomInput.value) / 100;
        limitarOffset();
        desenhar();
    });

    document.getElementById("editor-girar").addEventListener("click", function () {
        estado.rotacao = (estado.rotacao + 90) % 360;
        limitarOffset();
        desenhar();
    });

    // Arrastar (mouse e toque)
    function pontoDe(e) {
        var r = area.getBoundingClientRect();
        var p = e.touches ? e.touches[0] : e;
        return {
            x: (p.clientX - r.left) * (LARGURA / r.width),
            y: (p.clientY - r.top) * (ALTURA / r.height)
        };
    }
    function iniciarArrasto(e) {
        if (!estado.img) return;
        estado.arrastando = true;
        area.classList.add("arrastando");
        var p = pontoDe(e);
        estado.inicioX = p.x - estado.offsetX;
        estado.inicioY = p.y - estado.offsetY;
        e.preventDefault();
    }
    function moverArrasto(e) {
        if (!estado.arrastando) return;
        var p = pontoDe(e);
        estado.offsetX = p.x - estado.inicioX;
        estado.offsetY = p.y - estado.inicioY;
        limitarOffset();
        desenhar();
        e.preventDefault();
    }
    function terminarArrasto() {
        estado.arrastando = false;
        area.classList.remove("arrastando");
    }
    area.addEventListener("mousedown", iniciarArrasto);
    window.addEventListener("mousemove", moverArrasto);
    window.addEventListener("mouseup", terminarArrasto);
    area.addEventListener("touchstart", iniciarArrasto, { passive: false });
    area.addEventListener("touchmove", moverArrasto, { passive: false });
    area.addEventListener("touchend", terminarArrasto);

    // ---------- Integração: interceptar o input de imagens das cores ----------
    document.addEventListener("change", function (e) {
        var input = e.target;
        if (!input.classList || !input.classList.contains("cor-imagens-input")) return;
        var arquivos = Array.from(input.files || []);
        if (!arquivos.length) return;
        var coresEditor = input.closest(".cores-editor");
        var lista = coresEditor ? coresEditor.querySelector(".cor-imagens-lista") : null;
        if (!lista) return;

        // Processa cada arquivo: abre o editor e, ao confirmar, converte em File e faz upload
        (async function () {
            for (var i = 0; i < arquivos.length; i++) {
                var arquivo = arquivos[i];
                var dataURL = await new Promise(function (resolve, reject) {
                    var fr = new FileReader();
                    fr.onload = function () { resolve(fr.result); };
                    fr.onerror = reject;
                    fr.readAsDataURL(arquivo);
                });
                // abre o editor e espera o usuário confirmar
                var finalDataURL = await new Promise(function (resolve) {
                    abrirEditor(dataURL, resolve);
                });
                // converte o dataURL ajustado em File
                var blob = await (await fetch(finalDataURL)).blob();
                var ajustado = new File([blob], (arquivo.name || "imagem").replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
                // usa o fazerUpload global do admin.js
                if (typeof window.fazerUpload === "function") {
                    await window.fazerUpload(ajustado, coresEditor);
                }
            }
            input.value = "";
        })();
    });

    // ---------- Prévia do anúncio ----------
    var previaOverlay = document.getElementById("previa-overlay");
    var previaCard = document.getElementById("previa-card");

    function escapar(t) {
        return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function formatarPreco(v) {
        var n = Number(v);
        if (!isFinite(n)) return "";
        return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function abrirPrevia() {
        var titulo = document.getElementById("f-titulo").value.trim() || "Produto";
        var linha = document.getElementById("f-linha").value.trim();
        var preco = document.getElementById("f-preco").value;
        var parcelamento = document.getElementById("f-parcelamento").value.trim();
        var descricao = document.getElementById("f-descricao").value.trim();
        var categoriaSel = document.getElementById("f-categoria");
        var categoria = categoriaSel && categoriaSel.selectedOptions[0] ? categoriaSel.selectedOptions[0].textContent : "";

        // primeira imagem marcada como principal (ou a primeira que existir)
        var imgSrc = "";
        var principal = document.querySelector(".cor-imagem-principal:checked");
        if (principal) {
            var item = principal.closest(".imagem-item");
            var img = item ? item.querySelector("img") : null;
            if (img) imgSrc = img.src;
        }
        if (!imgSrc) {
            var qualquer = document.querySelector(".imagem-item img");
            if (qualquer) imgSrc = qualquer.src;
        }

        previaCard.innerHTML =
            '<div class="p-img">' + (imgSrc ? '<img src="' + escapar(imgSrc) + '" alt="Prévia">' : '<div style="color:#9aa5b1;font-size:2.4rem">🪑</div>') + '</div>' +
            '<div class="p-info">' +
            (categoria ? '<div class="p-cat">' + escapar(categoria) + '</div>' : '') +
            (linha ? '<div class="p-cat">' + escapar(linha) + '</div>' : '') +
            '<div class="p-nome">' + escapar(titulo) + '</div>' +
            (preco ? '<div class="p-preco">' + escapar(formatarPreco(preco)) + '</div>' : '') +
            (parcelamento ? '<div class="p-parc">' + escapar(parcelamento) + '</div>' : '') +
            (descricao ? '<div class="p-desc">' + escapar(descricao) + '</div>' : '') +
            '</div>';

        previaOverlay.classList.add("aberto");
    }

    // Botão de prévia: criar dinamicamente ao lado do botão de salvar do formulário
    document.addEventListener("DOMContentLoaded", function () {
        var form = document.getElementById("produto-form");
        if (!form) return;
        var btnSalvar = form.querySelector('button[type="submit"]');
        if (btnSalvar) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn-previa";
            btn.textContent = "👁 Prévia do anúncio";
            btn.addEventListener("click", abrirPrevia);
            btnSalvar.parentNode.insertBefore(btn, btnSalvar);
            btn.style.marginRight = "10px";
        }
    });
    document.getElementById("previa-fechar").addEventListener("click", function () {
        previaOverlay.classList.remove("aberto");
    });
    previaOverlay.addEventListener("click", function (e) {
        if (e.target === previaOverlay) previaOverlay.classList.remove("aberto");
    });
})();
