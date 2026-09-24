/* ==================================================================
   EDITOR DE RECORTE DE IMAGENS
   Formatos: 1:1, 4:5, 3:4, 16:9 e Original.
   A imagem pode ser posicionada arrastando dentro do quadro.
   ================================================================== */
(function () {
    "use strict";

    var overlay = document.getElementById("editor-img-overlay");
    if (!overlay) return;

    var canvas = document.getElementById("editor-canvas");
    var area = document.getElementById("editor-crop-area");
    var zoomInput = document.getElementById("editor-zoom");
    var zoomValue = document.getElementById("editor-zoom-value");
    var formatButtons = Array.from(document.querySelectorAll(".editor-format-btn"));

    if (!canvas || !area || !zoomInput) return;

    var ctx = canvas.getContext("2d");

    var estado = {
        img: null,
        arquivoAtual: null,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        rotacao: 0,
        aspect: 0.8,
        aspectLabel: "4:5",
        originalAspect: 0.8,
        arrastando: false,
        inicioX: 0,
        inicioY: 0,
        callback: null
    };

    var formatos = {
        "1:1": 1,
        "4:5": 0.8,
        "3:4": 0.75,
        "16:9": 16 / 9
    };

    function tamanhoCanvas(aspect) {
        var base = 1000;
        var largura;
        var altura;

        if (aspect >= 1) {
            largura = base;
            altura = Math.round(base / aspect);
        } else {
            altura = base;
            largura = Math.round(base * aspect);
        }

        return {
            largura: Math.max(300, largura),
            altura: Math.max(300, altura)
        };
    }

    function definirTamanhoDoFormato() {
        var tamanho = tamanhoCanvas(estado.aspect);
        canvas.width = tamanho.largura;
        canvas.height = tamanho.altura;

        area.style.aspectRatio = tamanho.largura + " / " + tamanho.altura;
    }

    function escalaBase() {
        if (!estado.img) return 1;

        var largura = canvas.width;
        var altura = canvas.height;

        return Math.max(
            largura / estado.img.width,
            altura / estado.img.height
        );
    }

    function limitesOffset() {
        if (!estado.img) {
            return { maxX: 0, maxY: 0 };
        }

        var escala = escalaBase() * estado.zoom;
        var metadeW = (estado.img.width * escala) / 2;
        var metadeH = (estado.img.height * escala) / 2;

        if (estado.rotacao % 180 !== 0) {
            var temp = metadeW;
            metadeW = metadeH;
            metadeH = temp;
        }

        return {
            maxX: Math.max(0, metadeW - canvas.width / 2),
            maxY: Math.max(0, metadeH - canvas.height / 2)
        };
    }

    function limitarOffset() {
        var limites = limitesOffset();

        estado.offsetX = Math.max(
            -limites.maxX,
            Math.min(limites.maxX, estado.offsetX)
        );
        estado.offsetY = Math.max(
            -limites.maxY,
            Math.min(limites.maxY, estado.offsetY)
        );
    }

    function desenhar() {
        if (!estado.img) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.translate(
            canvas.width / 2 + estado.offsetX,
            canvas.height / 2 + estado.offsetY
        );

        ctx.rotate(estado.rotacao * Math.PI / 180);

        var escala = escalaBase() * estado.zoom;
        var largura = estado.img.width * escala;
        var altura = estado.img.height * escala;

        ctx.drawImage(
            estado.img,
            -largura / 2,
            -altura / 2,
            largura,
            altura
        );

        ctx.restore();

        if (zoomValue) {
            zoomValue.textContent = Math.round(estado.zoom * 100) + "%";
        }
    }

    function selecionarFormato(botao) {
        formatButtons.forEach(function (btn) {
            btn.classList.toggle("ativo", btn === botao);
        });

        var valor = botao.dataset.aspect;

        if (valor === "original") {
            estado.aspect = estado.originalAspect;
            estado.aspectLabel = "Original";
        } else {
            estado.aspect = Number(valor);
            estado.aspectLabel = botao.dataset.label || "Personalizado";
        }

        estado.offsetX = 0;
        estado.offsetY = 0;
        estado.zoom = 1;
        estado.rotacao = 0;

        zoomInput.value = 100;
        definirTamanhoDoFormato();
        limitarOffset();
        desenhar();
    }

    function atualizarOriginalAspect() {
        if (!estado.img || !estado.img.width || !estado.img.height) return;

        estado.originalAspect = estado.img.width / estado.img.height;

        var originalBotao = formatButtons.find(function (btn) {
            return btn.dataset.aspect === "original";
        });

        if (originalBotao) {
            var texto = originalBotao.querySelector(".editor-format-text span");
            if (texto) {
                texto.textContent =
                    "Proporção " +
                    estado.img.width +
                    " × " +
                    estado.img.height;
            }
        }
    }

    function abrirEditor(dataURL, callback, arquivo) {
        var img = new Image();

        img.onload = function () {
            estado.img = img;
            estado.arquivoAtual = arquivo || null;
            estado.callback = callback;
            estado.originalAspect = img.width / img.height;
            estado.aspect = formatos["4:5"];
            estado.aspectLabel = "4:5";
            estado.zoom = 1;
            estado.offsetX = 0;
            estado.offsetY = 0;
            estado.rotacao = 0;

            if (zoomInput) zoomInput.value = 100;

            var botao45 = formatButtons.find(function (btn) {
                return btn.dataset.label === "4:5";
            });

            formatButtons.forEach(function (btn) {
                btn.classList.toggle("ativo", btn === botao45);
            });

            atualizarOriginalAspect();
            definirTamanhoDoFormato();
            limitarOffset();
            desenhar();

            overlay.classList.add("aberto");
            overlay.setAttribute("aria-hidden", "false");
        };

        img.onerror = function () {
            if (typeof callback === "function") callback(null);
        };

        img.src = dataURL;
    }

    function fecharEditor() {
        overlay.classList.remove("aberto");
        overlay.setAttribute("aria-hidden", "true");
        estado.img = null;
        estado.arquivoAtual = null;
        estado.callback = null;
        estado.arrastando = false;
    }

    function usarImagem() {
        if (!estado.callback || !estado.img) {
            fecharEditor();
            return;
        }

        limitarOffset();

        // JPEG não possui transparência: garante branco atrás do móvel
        // também no arquivo final que será enviado ao servidor.
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        desenhar();

        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        var dataURL = canvas.toDataURL("image/jpeg", 0.92);
        var callback = estado.callback;

        fecharEditor();
        callback(dataURL);
    }

    function pontoDe(evento) {
        var rect = area.getBoundingClientRect();
        var ponto = evento.touches ? evento.touches[0] : evento;

        return {
            x: (ponto.clientX - rect.left) * (canvas.width / rect.width),
            y: (ponto.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    function iniciarArrasto(evento) {
        if (!estado.img) return;

        estado.arrastando = true;
        area.classList.add("arrastando");

        var ponto = pontoDe(evento);
        estado.inicioX = ponto.x - estado.offsetX;
        estado.inicioY = ponto.y - estado.offsetY;

        evento.preventDefault();
    }

    function moverArrasto(evento) {
        if (!estado.arrastando || !estado.img) return;

        var ponto = pontoDe(evento);

        estado.offsetX = ponto.x - estado.inicioX;
        estado.offsetY = ponto.y - estado.inicioY;

        limitarOffset();
        desenhar();

        evento.preventDefault();
    }

    function terminarArrasto() {
        estado.arrastando = false;
        area.classList.remove("arrastando");
    }

    function dataURLParaBlob(dataURL) {
        var separador = dataURL.indexOf(",");
        if (separador < 0) {
            throw new Error("Formato de imagem recortada inválido.");
        }

        var cabecalho = dataURL.slice(0, separador);
        var dados = dataURL.slice(separador + 1);
        var mimeMatch = cabecalho.match(/^data:([^;]+);base64$/i);
        var mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        var binario = atob(dados);
        var bytes = new Uint8Array(binario.length);

        for (var i = 0; i < binario.length; i++) {
            bytes[i] = binario.charCodeAt(i);
        }

        return new Blob([bytes], { type: mime });
    }

    async function dataURLParaFile(dataURL, arquivoOriginal) {
        var blob = dataURLParaBlob(dataURL);

        var nomeBase = (arquivoOriginal && arquivoOriginal.name
            ? arquivoOriginal.name
            : "imagem"
        ).replace(/\.[^.]+$/, "");

        return new File(
            [blob],
            nomeBase + "-corte.jpg",
            { type: "image/jpeg" }
        );
    }

    async function carregarImagemComoDataURL(src) {
        return await new Promise(function (resolve, reject) {
            var imagem = new Image();

            imagem.onload = function () {
                try {
                    var largura = imagem.naturalWidth || imagem.width;
                    var altura = imagem.naturalHeight || imagem.height;

                    if (!largura || !altura) {
                        reject(new Error("Não foi possível ler as dimensões da imagem atual."));
                        return;
                    }

                    var canvasTemporario = document.createElement("canvas");
                    canvasTemporario.width = largura;
                    canvasTemporario.height = altura;

                    var contexto = canvasTemporario.getContext("2d");
                    if (!contexto) {
                        reject(new Error("Não foi possível preparar a imagem para o recorte."));
                        return;
                    }

                    // Remove transparência no carregamento e usa branco como fundo.
                    contexto.fillStyle = "#ffffff";
                    contexto.fillRect(0, 0, largura, altura);
                    contexto.drawImage(imagem, 0, 0, largura, altura);

                    var resultado = canvasTemporario.toDataURL("image/jpeg", 0.95);
                    resolve(resultado);
                } catch (erro) {
                    reject(new Error("Não foi possível ler a imagem atual para o recorte."));
                }
            };

            imagem.onerror = function () {
                reject(new Error("Não foi possível carregar a imagem atual para o recorte."));
            };

            imagem.src = src;
        });
    }

    async function recortarImagemExistente(item, coresEditor) {
        if (!item || !coresEditor) return;
        var img = item.querySelector("img");
        if (!img) return;

        var origem = img.currentSrc || img.src;
        if (!origem) return;

        var eraPrincipal = !!item.querySelector(".cor-imagem-principal")?.checked;
        var caminhoAnterior = item.querySelector(".cor-imagem-caminho")?.value || "";
        var nomeBase = caminhoAnterior
            ? caminhoAnterior.split("/").pop().replace(/\.[^.]+$/, "")
            : "imagem";

        try {
            var dataURL = await carregarImagemComoDataURL(origem);

            var resultado = await new Promise(function (resolve) {
                abrirEditor(dataURL, resolve, { name: nomeBase + ".jpg" });
            });

            if (!resultado) return;

            var ajustado = await dataURLParaFile(resultado, {
                name: nomeBase + "-recorte.jpg"
            });

            if (typeof window.fazerUpload !== "function") {
                throw new Error("O upload de imagens do painel não está disponível.");
            }

            if (typeof window.enviarImagemParaArmazenamento !== "function") {
                throw new Error("O envio da imagem recortada não está disponível.");
            }

            var respostaUpload = await window.enviarImagemParaArmazenamento(ajustado);

            var imagemElemento = item.querySelector("img");
            var caminhoElemento = item.querySelector(".cor-imagem-caminho");
            var publicIdElemento = item.querySelector(".cor-imagem-public-id");

            if (!imagemElemento || !caminhoElemento) {
                throw new Error("Não foi possível atualizar a imagem que está sendo editada.");
            }

            imagemElemento.src = urlImagemAdmin(respostaUpload.caminho);
            imagemElemento.dataset.cropVersion = String(Date.now());
            caminhoElemento.value = respostaUpload.caminho;

            if (publicIdElemento) {
                publicIdElemento.value = respostaUpload.public_id || "";
            } else if (respostaUpload.public_id) {
                var novoPublicId = document.createElement("input");
                novoPublicId.type = "hidden";
                novoPublicId.className = "cor-imagem-public-id";
                novoPublicId.value = respostaUpload.public_id;
                item.appendChild(novoPublicId);
            }

            if (eraPrincipal) {
                var principalAtual = item.querySelector(".cor-imagem-principal");
                if (principalAtual) principalAtual.checked = true;
            }

            if (typeof window.atualizarPreviaProduto === "function") {
                window.atualizarPreviaProduto();
            }
        } catch (erro) {
            console.error("Erro ao recortar imagem existente:", erro);
            alert(erro.message || "Não foi possível recortar a imagem.");
        }
    }

    window.recortarImagemExistente = recortarImagemExistente;

    async function processarArquivos(arquivos, coresEditor) {
        if (!Array.isArray(arquivos) || !arquivos.length) return;

        for (var i = 0; i < arquivos.length; i++) {
            var arquivo = arquivos[i];

            if (!arquivo || !arquivo.type || !arquivo.type.startsWith("image/")) {
                continue;
            }

            var dataURL = await new Promise(function (resolve, reject) {
                var leitor = new FileReader();

                leitor.onload = function () {
                    resolve(leitor.result);
                };

                leitor.onerror = reject;
                leitor.readAsDataURL(arquivo);
            });

            var resultado = await new Promise(function (resolve) {
                abrirEditor(dataURL, resolve, arquivo);
            });

            if (!resultado) {
                continue;
            }

            var ajustado = await dataURLParaFile(resultado, arquivo);

            if (typeof window.fazerUpload === "function") {
                await window.fazerUpload(ajustado, coresEditor);
            }
        }
    }

    window.abrirEditorImagemArquivos = processarArquivos;

    formatButtons.forEach(function (botao) {
        botao.addEventListener("click", function () {
            selecionarFormato(botao);
        });
    });

    zoomInput.addEventListener("input", function () {
        estado.zoom = Number(zoomInput.value) / 100;
        limitarOffset();
        desenhar();
    });

    var centralizar = document.getElementById("editor-centralizar");
    if (centralizar) {
        centralizar.addEventListener("click", function () {
            estado.offsetX = 0;
            estado.offsetY = 0;
            limitarOffset();
            desenhar();
        });
    }

    var girar = document.getElementById("editor-girar");
    if (girar) {
        girar.addEventListener("click", function () {
            estado.rotacao = (estado.rotacao + 90) % 360;
            limitarOffset();
            desenhar();
        });
    }

    var cancelar = document.getElementById("editor-cancelar");
    if (cancelar) cancelar.addEventListener("click", fecharEditor);

    var usar = document.getElementById("editor-usar");
    if (usar) usar.addEventListener("click", usarImagem);

    var fechar = document.getElementById("editor-fechar");
    if (fechar) fechar.addEventListener("click", fecharEditor);

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) fecharEditor();
    });

    area.addEventListener("mousedown", iniciarArrasto);
    window.addEventListener("mousemove", moverArrasto);
    window.addEventListener("mouseup", terminarArrasto);

    area.addEventListener("touchstart", iniciarArrasto, { passive: false });
    area.addEventListener("touchmove", moverArrasto, { passive: false });
    area.addEventListener("touchend", terminarArrasto);

    document.addEventListener("keydown", function (event) {
        if (!overlay.classList.contains("aberto")) return;

        if (event.key === "Escape") {
            fecharEditor();
        }
    });
})();