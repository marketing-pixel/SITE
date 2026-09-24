let categorias=[],produtoEditando=null;async function api(e,t={}){const o={...t,credentials:"same-origin",headers:{...t.body instanceof FormData?{}:{"Content-Type":"application/json"},...t.headers||{}}},a=await fetch(e,o),n=await a.json().catch(()=>({}));if(!a.ok)throw new Error(n.erro||"Erro na requisição.");return n}function mostrarMensagem(e,t="sucesso"){const o=document.getElementById("mensagem");o&&(o.textContent=e,o.className="mensagem "+t,setTimeout(()=>{o.className="mensagem"},4e3))}async function verificarSessao(){try{const e=await api("/api/auth/me"),t=e.admin.nome||e.admin.email||"Administrador",o=document.getElementById("admin-nome");o&&(o.textContent=t),mostrarDashboard(),await carregarCategorias(),await carregarProdutos()}catch(e){mostrarLogin()}}async function login(e,t){const o=document.getElementById("login-erro");o&&(o.textContent="");try{const o=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email:e,senha:t})}),a=document.getElementById("admin-nome");a&&(a.textContent=o.nome||o.email),mostrarDashboard(),await carregarCategorias(),await carregarProdutos()}catch(e){o&&(o.textContent=e.message||"Erro ao realizar login.")}}async function logout(){try{await api("/api/auth/logout",{method:"POST"})}catch(e){console.error("Erro no logout:",e)}produtoEditando=null,mostrarLogin()}function mostrarLogin(){const e=document.getElementById("login-view"),t=document.getElementById("dashboard-view");e&&(e.style.display="block"),t&&(t.style.display="none")}function mostrarDashboard(){const e=document.getElementById("login-view"),t=document.getElementById("dashboard-view");e&&(e.style.display="none"),t&&(t.style.display="block")}async function carregarCategorias(){try{categorias=await api("/api/categorias");const e=document.getElementById("f-categoria");if(!e)return;e.innerHTML='<option value="">Selecione...</option>',categorias.forEach(t=>{const o=document.createElement("option");o.value=t.id,o.textContent=t.nome,e.appendChild(o)})}catch(e){console.error("Erro ao carregar categorias:",e),mostrarMensagem("Não foi possível carregar as categorias.","erro")}}async function carregarProdutos(){try{renderTabela(await api("/api/produtos/admin/todos"))}catch(e){console.error("Erro ao carregar produtos:",e),mostrarMensagem(e.message||"Não foi possível carregar os produtos.","erro")}}function renderTabela(e){const t=document.getElementById("tabela-produtos");if(t){if(t.innerHTML="",!Array.isArray(e)||0===e.length){const e=document.createElement("tr"),o=document.createElement("td");return o.colSpan=6,o.textContent="Nenhum produto cadastrado.",o.style.textAlign="center",o.style.padding="30px",o.style.color="#777",e.appendChild(o),void t.appendChild(e)}e.forEach(e=>{const o=document.createElement("tr"),a=document.createElement("td");a.textContent=e.id;const n=document.createElement("td");n.textContent=e.titulo||"—";const r=document.createElement("td");r.textContent=e.categoria_nome||"—";const c=document.createElement("td");if(null!==e.preco&&void 0!==e.preco&&""!==e.preco){const t=Number(e.preco);c.textContent=Number.isFinite(t)?t.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"—"}else c.textContent="—";const i=document.createElement("td");i.className=e.ativo?"status-ativo":"status-inativo",i.textContent=e.ativo?"Ativo":"Inativo";const d=document.createElement("td"),m=document.createElement("button");if(m.type="button",m.className="btn-tabela btn-editar",m.textContent="Editar",m.addEventListener("click",()=>abrirEdicao(e.id)),d.appendChild(m),e.ativo){const t=document.createElement("button");t.type="button",t.className="btn-tabela btn-desativar",t.textContent="Desativar",t.addEventListener("click",()=>desativarProduto(e.id)),d.appendChild(t);const o=document.createElement("button");o.type="button",o.className="btn-tabela btn-excluir",o.textContent="Excluir",o.addEventListener("click",()=>excluirProdutoDefinitivo(e.id)),d.appendChild(o)}else{const t=document.createElement("button");t.type="button",t.className="btn-tabela btn-reativar",t.textContent="Reativar",t.addEventListener("click",()=>reativarProduto(e.id)),d.appendChild(t)}o.appendChild(a),o.appendChild(n),o.appendChild(r),o.appendChild(c),o.appendChild(i),o.appendChild(d),t.appendChild(o)})}}function confirmarAcao(e,t){return new Promise(o=>{let a=document.getElementById("modal-confirmar");a&&a.remove(),a=document.createElement("div"),a.id="modal-confirmar",a.className="modal-overlay aberto";const n=t.indexOf("DEFINITIVAMENTE")>=0;a.innerHTML=`<div class="modal-box modal-confirmar-box"><h2>${escaparHtml(e)}</h2><p class="modal-confirmar-texto">${escaparHtml(t)}</p><div class="modal-confirmar-acoes"><button type="button" class="btn-tabela btn-desativar" id="mc-cancelar">Cancelar</button><button type="button" class="btn-tabela ${n?"btn-excluir":"btn-reativar"}" id="mc-ok">Confirmar</button></div></div>`,document.body.appendChild(a),document.getElementById("mc-cancelar").onclick=()=>{a.remove(),o(!1)},document.getElementById("mc-ok").onclick=()=>{a.remove(),o(!0)},a.addEventListener("click",e=>{e.target===a&&(a.remove(),o(!1))})})}async function desativarProduto(e){if(await confirmarAcao("Desativar produto","Desativar este produto? Ele sai do catálogo, mas continua no painel e pode ser reativado."))try{await api("/api/produtos/"+e,{method:"DELETE"}),mostrarMensagem("Produto desativado."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao desativar o produto.","erro")}}async function excluirProdutoDefinitivo(e){if(await confirmarAcao("Excluir definitivamente","EXCLUIR este produto DEFINITIVAMENTE? Esta ação não pode ser desfeita: o produto, suas imagens, perguntas e avaliações serão apagados."))try{await api("/api/produtos/"+e+"/excluir",{method:"DELETE"}),mostrarMensagem("Produto excluído definitivamente."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao excluir o produto.","erro")}}async function reativarProduto(e){try{await api("/api/produtos/"+e+"/reativar",{method:"PUT"}),mostrarMensagem("Produto reativado."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao reativar o produto.","erro")}}function abrirNovoProduto(){produtoEditando=null;const e=document.getElementById("modal-titulo"),t=document.getElementById("produto-id"),o=document.getElementById("produto-form"),a=document.getElementById("cores-container"),n=document.getElementById("modal-produto");e&&(e.textContent="Novo Produto"),t&&(t.value=""),o&&o.reset(),a&&(a.innerHTML=""),adicionarCor(),n&&n.classList.add("aberto")}async function abrirEdicao(e){try{const t=await api("/api/produtos/"+e);produtoEditando=t,document.getElementById("modal-titulo").textContent="Editar Produto",document.getElementById("produto-id").value=t.id,document.getElementById("f-titulo").value=t.titulo||"",document.getElementById("f-linha").value=t.linha||"",document.getElementById("f-categoria").value=t.categoria_id||"",document.getElementById("f-preco").value=t.preco??"",document.getElementById("f-parcelamento").value=t.parcelamento||"",document.getElementById("f-descricao").value=t.descricao||"";const o=t.caracteristicas||{};document.getElementById("f-modelo").value=o.modelo||"",document.getElementById("f-largura").value=o.largura||"",document.getElementById("f-comprimento").value=o.comprimento||"",document.getElementById("f-altura").value=o.altura||"",document.getElementById("f-assentos").value=o.quantidade_assentos||"",document.getElementById("f-compartimento").value=o.compartimento_livros||"",document.getElementById("f-outros").value=o.outros||"",document.getElementById("cores-container").innerHTML="",Array.isArray(t.cores)&&t.cores.length>0?t.cores.forEach(e=>{const o=(t.imagens||[]).filter(t=>Number(t.cor_id)===Number(e.id));adicionarCor({...e,imagens:o})}):adicionarCor(),document.getElementById("modal-produto").classList.add("aberto")}catch(e){console.error("Erro ao abrir produto:",e),mostrarMensagem(e.message||"Erro ao carregar o produto.","erro")}}function fecharModal(){const e=document.getElementById("modal-produto");e&&e.classList.remove("aberto")}let contadorGrupoImagemPrincipal=0;function adicionarCor(e={}){const t=document.getElementById("cores-container");if(!t)return;const o=document.createElement("div"),s="imagem-principal-"+(++contadorGrupoImagemPrincipal);o.className="cores-editor",o.dataset.imagemPrincipalGrupo=s,o.innerHTML=`\n        <h4>Cor</h4>\n\n        <div class="form-grid">\n\n            <div class="form-grupo">\n\n                <label>\n                    Nome da cor\n                </label>\n\n                <input\n                    type="text"\n                    class="cor-nome"\n                    maxlength="100"\n                    value="${escaparHtml(e.nome||"")}"\n                >\n\n            </div>\n\n\n            <div class="form-grupo">\n\n                <label>\n                    Altura\n                </label>\n\n                <input\n                    type="text"\n                    class="cor-altura"\n                    maxlength="50"\n                    value="${escaparHtml(e.altura||"")}"\n                >\n\n            </div>\n\n        </div>\n\n\n        <div class="form-grupo">\n\n            <label>\n                Descrição da cor\n            </label>\n\n            <textarea\n                class="cor-descricao descricao-cor"\n                maxlength="5000"\n                placeholder="Descreva as características específicas desta cor, acabamento ou configuração."\n            >${escaparHtml(e.descricao||"")}</textarea>\n\n        </div>\n\n\n        <div class="form-grupo imagem-upload">\n\n            <label>\n                Imagens da cor\n            </label>\n\n            <div class="imagem-dropzone" tabindex="0" role="button" aria-label="Adicionar imagens desta cor">\n                <div class="imagem-upload-icon" aria-hidden="true">↥</div>\n\n                <div class="imagem-upload-copy">\n                    <div class="imagem-upload-title">Adicionar imagens</div>\n                    <div class="imagem-upload-subtitle">PNG, JPG ou WebP • até 5 MB por arquivo</div>\n                </div>\n\n                <div class="imagem-upload-actions">\n                    <span class="imagem-selecionar-btn">Selecionar arquivos</span>\n                </div>\n\n                <input\n                    type="file"\n                    class="cor-imagens-input imagem-upload-file"\n                    accept="image/png,image/jpeg,image/webp"\n                    multiple\n                    tabindex="-1"\n                >\n            </div>\n\n            <div class="imagem-contador" aria-live="polite"></div>\n\n        </div>\n\n\n        <div\n            class="imagem-lista cor-imagens-lista"\n        ></div>\n\n\n        <button\n            type="button"\n            class="btn-remove-cor"\n        >\n            Remover cor\n        </button>\n    `,t.appendChild(o);const a=o.querySelector(".btn-remove-cor");if(a&&a.addEventListener("click",()=>removerCor(a)),Array.isArray(e.imagens)&&e.imagens.length>0){const t=o.querySelector(".cor-imagens-lista");e.imagens.forEach(e=>{adicionarItemImagem(t,e.caminho,Boolean(e.principal),e.id||"",e.public_id||"")})}const n=o.querySelector(".cor-imagens-input"),r=o.querySelector(".imagem-dropzone");if(n&&r){const a=async e=>{const t=Array.from(e.target.files||[]);if(window.abrirEditorImagemArquivos)await window.abrirEditorImagemArquivos(t,o);else for(const e of t)await fazerUpload(e,o);e.target.value="",atualizarContadorImagens(o)};n.addEventListener("change",a),r.addEventListener("click",()=>n.click()),r.addEventListener("keydown",e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),n.click())}),["dragenter","dragover"].forEach(e=>r.addEventListener(e,e=>{e.preventDefault(),r.classList.add("dragging")})),["dragleave","drop"].forEach(e=>r.addEventListener(e,e=>{e.preventDefault(),r.classList.remove("dragging")})),r.addEventListener("drop",async e=>{const t=Array.from(e.dataTransfer?.files||[]);if(window.abrirEditorImagemArquivos)await window.abrirEditorImagemArquivos(t,o);else for(const e of t)await fazerUpload(e,o);atualizarContadorImagens(o)})}atualizarContadorImagens(o)}function atualizarContadorImagens(e){const t=e?.querySelector(".imagem-contador"),o=e?e.querySelectorAll(".imagem-item").length:0;t&&(t.innerHTML=o?'<strong>'+o+(1===o?" imagem":" imagens")+'</strong> cadastrada'+(1===o?"":"s")+"." :"Nenhuma imagem cadastrada ainda.")} function adicionarItemImagem(e,t,o=!1,a="",n=""){if(!e||!t)return;const r=document.createElement("div");if(r.className="imagem-item",r.innerHTML=`\n        <img\n            src="${escaparHtml(urlImagemAdmin(t))}"\n            alt="Imagem do produto"\n        >\n\n        <input\n            type="hidden"\n            class="cor-imagem-caminho"\n            value="${escaparHtml(t)}"\n        >\n\n        ${a?`\n                    <input\n                        type="hidden"\n                        class="cor-imagem-id"\n                        value="${escaparHtml(a)}"\n                    >\n                `:""}\n\n        <label\n            class="imagem-principal-label"\n        >\n\n            <input\n                type="radio"\n                name="${e.closest(".cores-editor")?.dataset.imagemPrincipalGrupo||"imagem-principal-global"}"\n                class="cor-imagem-principal"\n                ${o?"checked":""}\n            >\n\n            Principal\n\n        </label>\n\n\n        <div class="imagem-item-acoes">\n            <button\n                type="button"\n                class="btn-recortar-imagem"\n                title="Recortar e reposicionar imagem"\n            >\n                ✂ Recortar\n            </button>\n\n            <button\n            type="button"\n            class="btn-remove-imagem"\n            title="Remover imagem"\n        >\n            ×\n        </button>\n        </div>\n    `,e.appendChild(r),atualizarContadorImagens(e.closest(".cores-editor")),n){const e=document.createElement("input");e.type="hidden",e.className="cor-imagem-public-id",e.value=n,r.appendChild(e)}const c=r.querySelector(".cor-imagem-principal");c&&c.addEventListener("change",()=>{if(!c.checked)return;c.closest(".cores-editor")?.querySelectorAll(".cor-imagem-principal").forEach(e=>{e!==c&&(e.checked=!1)});atualizarPreviaProduto()});const i=r.querySelector(".btn-remove-imagem");i&&i.addEventListener("click",()=>removerImagem(i));const s=r.querySelector(".btn-recortar-imagem");s&&s.addEventListener("click",()=>{if(typeof window.recortarImagemExistente==="function")window.recortarImagemExistente(r,e.closest(".cores-editor"))})}function removerImagem(e){const t=e.closest(".imagem-item");if(!t)return;const o=t.querySelector(".cor-imagem-principal")?.checked;const r=t.closest(".cores-editor");if(t.remove(),atualizarContadorImagens(r),o){const e=r?.querySelector(".cor-imagem-principal");e&&(e.checked=!0)}}function removerCor(e){const t=e.closest(".cores-editor");if(!t)return;const o=Array.from(t.querySelectorAll(".cor-imagem-principal")).some(e=>e.checked);if(t.remove(),o){const e=document.querySelector(".cor-imagem-principal");e&&(e.checked=!0)}}async function fazerUpload(e,t,i=null){if(!["image/png","image/jpeg","image/webp"].includes(e.type))return void alert("Formato não permitido. Use PNG, JPG ou WebP.");if(e.size>5242880)return void alert("A imagem deve ter no máximo 5 MB.");const o=new FormData;o.append("imagem",e),o.append("tipo","cor");try{const e=await fetch("/api/uploads",{method:"POST",body:o,credentials:"same-origin"}),a=await e.json().catch(()=>({}));if(!e.ok)throw new Error(a.erro||"Erro no upload.");if(i){const e=i.querySelector("img"),t=i.querySelector(".cor-imagem-caminho"),o=i.querySelector(".cor-imagem-public-id");return e&&(e.src=urlImagemAdmin(a.caminho)),t&&(t.value=a.caminho),o?o.value=a.public_id||"":a.public_id&&(()=>{const e=document.createElement("input");e.type="hidden",e.className="cor-imagem-public-id",e.value=a.public_id,i.appendChild(e)})(),atualizarPreviaProduto(),i}const n=t.querySelector(".cor-imagens-lista");if(!n)return;const r=!t.querySelector(".cor-imagem-principal:checked");return adicionarItemImagem(n,a.caminho,r,"",a.public_id||"")}catch(e){console.error("Erro no upload:",e),alert(e.message||"Erro ao enviar a imagem.")}}
/* ===== PRÉVIA: MESMA ESTRUTURA DA PÁGINA DE DETALHES DO CATÁLOGO ===== */
let indiceImagemPrevia = 0;
let corPreviaSelecionada = 0;

function urlImagemAdmin(caminho) {
    if (!caminho) return caminho;

    if (caminho.startsWith("https://res.cloudinary.com/")) {
        const marcador = "/image/upload/";
        const posicao = caminho.indexOf(marcador);

        if (posicao >= 0) {
            let resto = caminho.substring(posicao + marcador.length);
            const partes = resto.split("/");

            while (partes.length && /^(q_|c_|w_|h_|f_|dpr_|v\d)/.test(partes[0])) {
                partes.shift();
            }

            resto = partes.join("/");
            const ponto = resto.lastIndexOf(".");
            if (ponto > 0) resto = resto.substring(0, ponto);

            return "/api/imagens/cloudinary/" + resto;
        }
    }

    return caminho;
}

function obterDadosPreviaProduto() {
    const cores = Array.from(document.querySelectorAll(".cores-editor")).map((el) => ({
        nome: el.querySelector(".cor-nome")?.value.trim() || "",
        altura: el.querySelector(".cor-altura")?.value.trim() || "",
        descricao: el.querySelector(".cor-descricao")?.value.trim() || "",
        imagens: Array.from(el.querySelectorAll(".imagem-item")).map((item) => ({
            caminho: item.querySelector(".cor-imagem-caminho")?.value || "",
            principal: !!item.querySelector(".cor-imagem-principal")?.checked
        })).filter((img) => img.caminho)
    })).filter((cor) => cor.nome || cor.altura || cor.descricao || cor.imagens.length);

    return {
        titulo: document.getElementById("f-titulo")?.value.trim() || "Seu produto",
        linha: document.getElementById("f-linha")?.value.trim() || "",
        preco: document.getElementById("f-preco")?.value || "",
        parcelamento: document.getElementById("f-parcelamento")?.value.trim() || "",
        descricao: document.getElementById("f-descricao")?.value.trim() || "",
        modelo: document.getElementById("f-modelo")?.value.trim() || "",
        largura: document.getElementById("f-largura")?.value.trim() || "",
        comprimento: document.getElementById("f-comprimento")?.value.trim() || "",
        altura: document.getElementById("f-altura")?.value.trim() || "",
        assentos: document.getElementById("f-assentos")?.value.trim() || "",
        compartimento: document.getElementById("f-compartimento")?.value.trim() || "",
        outros: document.getElementById("f-outros")?.value.trim() || "",
        cores
    };
}

function imagensDaCorPrevia(dados) {
    const cor = dados.cores[corPreviaSelecionada];
    if (cor?.imagens?.length) return cor.imagens.slice();

    const todas = [];
    dados.cores.forEach((item) => item.imagens.forEach((img) => todas.push(img)));
    return todas;
}

function montarPaginaPrevia() {
    const card = document.getElementById("previa-card");
    if (!card) return;

    card.innerHTML = "";

    const dados = obterDadosPreviaProduto();

    const container = document.createElement("div");
    container.className = "pp-container";

    const voltar = document.createElement("button");
    voltar.type = "button";
    voltar.className = "voltar";
    voltar.textContent = "← Voltar para produtos";
    container.appendChild(voltar);

    const tituloArea = document.createElement("div");
    tituloArea.className = "pp-titulo-area";

    const titulo = document.createElement("h1");
    titulo.className = "pp-titulo";
    titulo.textContent = dados.titulo;
    tituloArea.appendChild(titulo);

    const categoria = document.createElement("div");
    categoria.className = "pp-categoria";
    categoria.textContent = dados.linha;
    tituloArea.appendChild(categoria);

    const avaliacao = produtoEditando?.avaliacao_resumo || { media: 0, total: 0 };
    const media = Number(avaliacao.media || 0);
    const totalAvaliacoes = Number(avaliacao.total || 0);

    const resumo = document.createElement("div");
    resumo.className = "pp-avaliacao-resumo-topo";

    const estrelas = document.createElement("span");
    estrelas.className = "estrelas pp-estrelas-topo";
    for (let i = 1; i <= 5; i++) {
        const estrela = document.createElement("span");
        estrela.className = "estrela" + (i <= Math.round(media) ? " ativa" : "");
        estrela.textContent = i <= Math.round(media) ? "★" : "☆";
        estrelas.appendChild(estrela);
    }
    resumo.appendChild(estrelas);

    const mediaEl = document.createElement("span");
    mediaEl.className = "pp-media-topo";
    mediaEl.textContent = totalAvaliacoes ? media.toFixed(1) : "Sem avaliações";
    resumo.appendChild(mediaEl);

    const quantidade = document.createElement("span");
    quantidade.className = "pp-quantidade-topo";
    quantidade.textContent = totalAvaliacoes
        ? "(" + totalAvaliacoes + (totalAvaliacoes === 1 ? " avaliação)" : " avaliações)")
        : "";
    resumo.appendChild(quantidade);

    tituloArea.appendChild(resumo);
    container.appendChild(tituloArea);

    const imagemArea = document.createElement("div");
    imagemArea.className = "pp-imagem-area";

    const imagens = imagensDaCorPrevia(dados);
    if (indiceImagemPrevia >= imagens.length) indiceImagemPrevia = 0;

    const contador = document.createElement("span");
    contador.className = "pp-contador";
    contador.textContent = imagens.length ? (indiceImagemPrevia + 1) + " / " + imagens.length : "1 / 1";
    imagemArea.appendChild(contador);

    const imagemSelecionada = imagens[indiceImagemPrevia] || imagens.find((img) => img.principal) || imagens[0];
    const img = document.createElement("img");
    img.className = "pp-imagem-principal";
    img.alt = dados.titulo;
    if (imagemSelecionada?.caminho) {
        img.src = urlImagemAdmin(imagemSelecionada.caminho);
    } else {
        img.alt = "Imagem do produto";
        img.style.minHeight = "240px";
        img.style.background = "#f7f8fa";
    }
    imagemArea.appendChild(img);

    const favorito = document.createElement("button");
    favorito.type = "button";
    favorito.className = "pp-fav";
    favorito.textContent = "♡";
    favorito.setAttribute("aria-hidden", "true");
    imagemArea.appendChild(favorito);

    const compartilhar = document.createElement("button");
    compartilhar.type = "button";
    compartilhar.className = "pp-compartilhar";
    compartilhar.textContent = "↗";
    compartilhar.setAttribute("aria-hidden", "true");
    imagemArea.appendChild(compartilhar);

    if (imagens.length > 1) {
        const anterior = document.createElement("button");
        anterior.type = "button";
        anterior.className = "pp-seta esq";
        anterior.textContent = "‹";
        anterior.addEventListener("click", () => {
            indiceImagemPrevia = (indiceImagemPrevia - 1 + imagens.length) % imagens.length;
            montarPaginaPrevia();
        });

        const proxima = document.createElement("button");
        proxima.type = "button";
        proxima.className = "pp-seta dir";
        proxima.textContent = "›";
        proxima.addEventListener("click", () => {
            indiceImagemPrevia = (indiceImagemPrevia + 1) % imagens.length;
            montarPaginaPrevia();
        });

        imagemArea.appendChild(anterior);
        imagemArea.appendChild(proxima);
    }

    container.appendChild(imagemArea);

    if (dados.cores.length) {
        if (corPreviaSelecionada >= dados.cores.length) corPreviaSelecionada = 0;

        const corLabel = document.createElement("div");
        corLabel.className = "pp-cor";
        corLabel.textContent = "Cor: " + (dados.cores[corPreviaSelecionada].nome || "");
        container.appendChild(corLabel);

        const cores = document.createElement("div");
        cores.className = "pp-cores";

        dados.cores.forEach((cor, index) => {
            const item = document.createElement("div");
            item.className = "pp-cor-item" + (index === corPreviaSelecionada ? " selecionada" : "");

            const thumb = document.createElement("div");
            thumb.className = "pp-cor-thumb";

            const thumbImgData = cor.imagens.find((img) => img.principal) || cor.imagens[0];
            if (thumbImgData?.caminho) {
                const thumbImg = document.createElement("img");
                thumbImg.src = urlImagemAdmin(thumbImgData.caminho);
                thumbImg.alt = cor.nome || "Cor";
                thumb.appendChild(thumbImg);
            }

            const nome = document.createElement("div");
            nome.className = "pp-cor-nome";
            nome.textContent = cor.nome || "";

            item.appendChild(thumb);
            item.appendChild(nome);

            item.addEventListener("click", () => {
                corPreviaSelecionada = index;
                indiceImagemPrevia = 0;
                montarPaginaPrevia();
            });

            cores.appendChild(item);
        });

        container.appendChild(cores);
    }

    const orcamento = document.createElement("div");
    orcamento.className = "pp-bloco pp-orcamento";

    if (dados.preco) {
        const preco = document.createElement("div");
        preco.className = "pp-preco";
        preco.textContent = formatarPreco(dados.preco);
        orcamento.appendChild(preco);
    }

    if (dados.parcelamento) {
        const parcela = document.createElement("div");
        parcela.className = "pp-parcelamento";
        parcela.textContent = dados.parcelamento;
        orcamento.appendChild(parcela);
    }

    const solicitar = document.createElement("button");
    solicitar.type = "button";
    solicitar.className = "btn-solicitar";
    solicitar.textContent = "SOLICITAR ORÇAMENTO";
    solicitar.setAttribute("aria-hidden", "true");
    orcamento.appendChild(solicitar);

    container.appendChild(orcamento);

    const caracteristicas = document.createElement("div");
    caracteristicas.className = "pp-bloco";

    const tituloCaracteristicas = document.createElement("h3");
    tituloCaracteristicas.textContent = "Características do produto";
    caracteristicas.appendChild(tituloCaracteristicas);

    function adicionarTabela(secao, linhas) {
        const sub = document.createElement("div");
        sub.className = "carac-sub";
        sub.textContent = secao;
        caracteristicas.appendChild(sub);

        const tabela = document.createElement("table");
        tabela.className = "carac-tabela";

        linhas.forEach(([nome, valor]) => {
            if (!valor) return;
            const tr = document.createElement("tr");
            const tdNome = document.createElement("td");
            tdNome.textContent = nome;
            const tdValor = document.createElement("td");
            tdValor.textContent = valor;
            tr.appendChild(tdNome);
            tr.appendChild(tdValor);
            tabela.appendChild(tr);
        });

        if (!tabela.rows.length) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 2;
            td.textContent = "Nenhuma característica preenchida.";
            tr.appendChild(td);
            tabela.appendChild(tr);
        }

        caracteristicas.appendChild(tabela);
    }

    const B = {
        modelo: dados.modelo,
        largura: dados.largura,
        comprimento: dados.comprimento,
        altura: dados.altura,
        quantidade_assentos: dados.assentos,
        compartimento_livros: dados.compartimento,
        outros: dados.outros
    };

    adicionarTabela("Características Principais", [
        ["Modelo", B.modelo],
        ["Cor", dados.cores[corPreviaSelecionada]?.nome || "—"]
    ]);

    adicionarTabela("Dimensões", [
        ["Largura x Comprimento", B.largura && B.comprimento ? B.largura + " x " + B.comprimento : ""],
        ["Altura", B.altura || dados.cores[corPreviaSelecionada]?.altura || "—"]
    ]);

    adicionarTabela("Outras características", [
        ["Outros", B.outros],
        ["Quantidade de assentos", B.quantidade_assentos],
        ["Compartimento para livros", B.compartimento_livros]
    ]);

    const descricaoLabel = document.createElement("div");
    descricaoLabel.className = "carac-sub";
    descricaoLabel.textContent = "Descrição";
    caracteristicas.appendChild(descricaoLabel);

    const descricao = document.createElement("p");
    descricao.className = "descricao-produto-texto";
    descricao.textContent = dados.cores[corPreviaSelecionada]?.descricao || dados.descricao || "Descrição ainda não cadastrada.";
    caracteristicas.appendChild(descricao);

    container.appendChild(caracteristicas);

    const perguntas = document.createElement("div");
    perguntas.className = "pp-bloco";
    const perguntasH3 = document.createElement("h3");
    perguntasH3.textContent = "Perguntas e Respostas";
    perguntas.appendChild(perguntasH3);

    const perguntaEstado = document.createElement("div");
    perguntaEstado.className = "sem-conteudo";
    perguntaEstado.textContent = "Veja as perguntas dos clientes.";
    perguntas.appendChild(perguntaEstado);
    container.appendChild(perguntas);

    const avaliacoes = document.createElement("div");
    avaliacoes.className = "pp-bloco";
    const avaliacoesH3 = document.createElement("h3");
    avaliacoesH3.textContent = "Avaliações do produto";
    avaliacoes.appendChild(avaliacoesH3);

    const resumoAval = document.createElement("div");
    resumoAval.className = "avaliacao-resumo-produto";
    resumoAval.textContent = totalAvaliacoes
        ? media.toFixed(1) + " • " + totalAvaliacoes + (totalAvaliacoes === 1 ? " avaliação" : " avaliações")
        : "Sem avaliações ainda.";
    avaliacoes.appendChild(resumoAval);

    container.appendChild(avaliacoes);

    card.appendChild(container);
}

function atualizarPreviaProduto() {
    montarPaginaPrevia();
}

function iniciarPreviaProduto() {
    const form = document.getElementById("produto-form");
    const modal = document.getElementById("modal-produto");
    const cores = document.getElementById("cores-container");

    if (!form) return;

    form.addEventListener("input", atualizarPreviaProduto);
    form.addEventListener("change", atualizarPreviaProduto);

    if (cores) {
        const observer = new MutationObserver(atualizarPreviaProduto);
        observer.observe(cores, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
        cores.addEventListener("focusin", (event) => {
            const editor = event.target.closest(".cores-editor");
            if (!editor) return;
            const index = Array.from(cores.querySelectorAll(".cores-editor")).indexOf(editor);
            if (index >= 0 && index !== corPreviaSelecionada) {
                corPreviaSelecionada = index;
                indiceImagemPrevia = 0;
                atualizarPreviaProduto();
            }
        });
    }

    if (modal) {
        const observerModal = new MutationObserver(() => {
            if (modal.classList.contains("aberto")) {
                indiceImagemPrevia = 0;
                corPreviaSelecionada = 0;
                atualizarPreviaProduto();
            }
        });

        observerModal.observe(modal, {
            attributes: true,
            attributeFilter: ["class"]
        });
    }

    atualizarPreviaProduto();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarPreviaProduto);
} else {
    iniciarPreviaProduto();
}

const produtoForm=document.getElementById("produto-form");produtoForm&&produtoForm.addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("f-categoria").value;if(!t)return void mostrarMensagem("Selecione uma categoria.","erro");const o=[];if(document.querySelectorAll(".cores-editor").forEach(e=>{const t=e.querySelector(".cor-nome").value.trim(),a=e.querySelector(".cor-altura").value.trim(),n=e.querySelector(".cor-descricao"),r=n?n.value.trim():"",c=[];e.querySelectorAll(".imagem-item").forEach(e=>{const t=e.querySelector(".cor-imagem-caminho");if(!t||!t.value)return;const o=e.querySelector(".cor-imagem-principal"),a=e.querySelector(".cor-imagem-id"),n=e.querySelector(".cor-imagem-public-id");c.push({id:a?a.value:"",caminho:t.value,public_id:n?n.value:null,principal:!!o&&o.checked})}),(t||a||r||c.length>0)&&o.push({nome:t,altura:a,descricao:r,imagens:c})}),!o.some(e=>e.imagens.some(e=>!0===e.principal))&&o.length>0)e:for(const e of o)if(e.imagens.length>0){e.imagens[0].principal=!0;break e}const a={titulo:document.getElementById("f-titulo").value.trim(),linha:document.getElementById("f-linha").value.trim(),categoria_id:Number(t),preco:document.getElementById("f-preco").value?Number(document.getElementById("f-preco").value):null,parcelamento:document.getElementById("f-parcelamento").value.trim(),descricao:document.getElementById("f-descricao").value.trim(),caracteristicas:{modelo:document.getElementById("f-modelo").value.trim(),largura:document.getElementById("f-largura").value.trim(),comprimento:document.getElementById("f-comprimento").value.trim(),altura:document.getElementById("f-altura").value.trim(),outros:document.getElementById("f-outros").value.trim(),quantidadeAssentos:document.getElementById("f-assentos").value.trim(),compartimentoLivros:document.getElementById("f-compartimento").value.trim()},cores:o};if(!a.titulo)return void mostrarMensagem("Informe o título do produto.","erro");const n=document.getElementById("produto-id").value;try{n?(await api("/api/produtos/"+n,{method:"PUT",body:JSON.stringify(a)}),mostrarMensagem("Produto atualizado com sucesso.")):(await api("/api/produtos",{method:"POST",body:JSON.stringify(a)}),mostrarMensagem("Produto criado com sucesso.")),fecharModal(),await carregarProdutos()}catch(e){console.error("Erro ao salvar produto:",e),mostrarMensagem(e.message||"Erro ao salvar o produto.","erro")}});const loginForm=document.getElementById("login-form");function escaparHtml(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}loginForm&&loginForm.addEventListener("submit",e=>{e.preventDefault(),login(document.getElementById("login-email").value.trim(),document.getElementById("login-senha").value)}),document.getElementById("btn-logout")?.addEventListener("click",logout),document.getElementById("btn-novo-produto")?.addEventListener("click",abrirNovoProduto),document.getElementById("btn-fechar-modal")?.addEventListener("click",fecharModal),document.getElementById("btn-adicionar-cor")?.addEventListener("click",()=>adicionarCor()),document.getElementById("modal-produto")?.addEventListener("click",e=>{"modal-produto"===e.target.id&&fecharModal()}),document.addEventListener("keydown",e=>{"Escape"===e.key&&fecharModal()}),verificarSessao();