let categorias=[],produtoEditando=null;async function api(e,t={}){const o={...t,credentials:"same-origin",headers:{...t.body instanceof FormData?{}:{"Content-Type":"application/json"},...t.headers||{}}},a=await fetch(e,o),n=await a.json().catch(()=>({}));if(!a.ok)throw new Error(n.erro||"Erro na requisição.");return n}function mostrarMensagem(e,t="sucesso"){const o=document.getElementById("mensagem");o&&(o.textContent=e,o.className="mensagem "+t,setTimeout(()=>{o.className="mensagem"},4e3))}async function verificarSessao(){try{const e=await api("/api/auth/me"),t=e.admin.nome||e.admin.email||"Administrador",o=document.getElementById("admin-nome");o&&(o.textContent=t),mostrarDashboard(),await carregarCategorias(),await carregarProdutos()}catch(e){mostrarLogin()}}async function login(e,t){const o=document.getElementById("login-erro");o&&(o.textContent="");try{const o=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email:e,senha:t})}),a=document.getElementById("admin-nome");a&&(a.textContent=o.nome||o.email),mostrarDashboard(),await carregarCategorias(),await carregarProdutos()}catch(e){o&&(o.textContent=e.message||"Erro ao realizar login.")}}async function logout(){try{await api("/api/auth/logout",{method:"POST"})}catch(e){console.error("Erro no logout:",e)}produtoEditando=null,mostrarLogin()}function mostrarLogin(){const e=document.getElementById("login-view"),t=document.getElementById("dashboard-view");e&&(e.style.display="block"),t&&(t.style.display="none")}function mostrarDashboard(){const e=document.getElementById("login-view"),t=document.getElementById("dashboard-view");e&&(e.style.display="none"),t&&(t.style.display="block")}async function carregarCategorias(){try{categorias=await api("/api/categorias");const e=document.getElementById("f-categoria");if(!e)return;e.innerHTML='<option value="">Selecione...</option>',categorias.forEach(t=>{const o=document.createElement("option");o.value=t.id,o.textContent=t.nome,e.appendChild(o)})}catch(e){console.error("Erro ao carregar categorias:",e),mostrarMensagem("Não foi possível carregar as categorias.","erro")}}async function carregarProdutos(){try{renderTabela(await api("/api/produtos/admin/todos"))}catch(e){console.error("Erro ao carregar produtos:",e),mostrarMensagem(e.message||"Não foi possível carregar os produtos.","erro")}}function renderTabela(e){const t=document.getElementById("tabela-produtos");if(t){if(t.innerHTML="",!Array.isArray(e)||0===e.length){const e=document.createElement("tr"),o=document.createElement("td");return o.colSpan=6,o.textContent="Nenhum produto cadastrado.",o.style.textAlign="center",o.style.padding="30px",o.style.color="#777",e.appendChild(o),void t.appendChild(e)}e.forEach(e=>{const o=document.createElement("tr"),a=document.createElement("td");a.textContent=e.id;const n=document.createElement("td");n.textContent=e.titulo||"—";const r=document.createElement("td");r.textContent=e.categoria_nome||"—";const c=document.createElement("td");if(null!==e.preco&&void 0!==e.preco&&""!==e.preco){const t=Number(e.preco);c.textContent=Number.isFinite(t)?t.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"—"}else c.textContent="—";const i=document.createElement("td");i.className=e.ativo?"status-ativo":"status-inativo",i.textContent=e.ativo?"Ativo":"Inativo";const d=document.createElement("td"),m=document.createElement("button");if(m.type="button",m.className="btn-tabela btn-editar",m.textContent="Editar",m.addEventListener("click",()=>abrirEdicao(e.id)),d.appendChild(m),e.ativo){const t=document.createElement("button");t.type="button",t.className="btn-tabela btn-desativar",t.textContent="Desativar",t.addEventListener("click",()=>desativarProduto(e.id)),d.appendChild(t);const o=document.createElement("button");o.type="button",o.className="btn-tabela btn-excluir",o.textContent="Excluir",o.addEventListener("click",()=>excluirProdutoDefinitivo(e.id)),d.appendChild(o)}else{const t=document.createElement("button");t.type="button",t.className="btn-tabela btn-reativar",t.textContent="Reativar",t.addEventListener("click",()=>reativarProduto(e.id)),d.appendChild(t)}o.appendChild(a),o.appendChild(n),o.appendChild(r),o.appendChild(c),o.appendChild(i),o.appendChild(d),t.appendChild(o)})}}function confirmarAcao(e,t){return new Promise(o=>{let a=document.getElementById("modal-confirmar");a&&a.remove(),a=document.createElement("div"),a.id="modal-confirmar",a.className="modal-overlay aberto";const n=t.indexOf("DEFINITIVAMENTE")>=0;a.innerHTML=`<div class="modal-box modal-confirmar-box"><h2>${escaparHtml(e)}</h2><p class="modal-confirmar-texto">${escaparHtml(t)}</p><div class="modal-confirmar-acoes"><button type="button" class="btn-tabela btn-desativar" id="mc-cancelar">Cancelar</button><button type="button" class="btn-tabela ${n?"btn-excluir":"btn-reativar"}" id="mc-ok">Confirmar</button></div></div>`,document.body.appendChild(a),document.getElementById("mc-cancelar").onclick=()=>{a.remove(),o(!1)},document.getElementById("mc-ok").onclick=()=>{a.remove(),o(!0)},a.addEventListener("click",e=>{e.target===a&&(a.remove(),o(!1))})})}async function desativarProduto(e){if(await confirmarAcao("Desativar produto","Desativar este produto? Ele sai do catálogo, mas continua no painel e pode ser reativado."))try{await api("/api/produtos/"+e,{method:"DELETE"}),mostrarMensagem("Produto desativado."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao desativar o produto.","erro")}}async function excluirProdutoDefinitivo(e){if(await confirmarAcao("Excluir definitivamente","EXCLUIR este produto DEFINITIVAMENTE? Esta ação não pode ser desfeita: o produto, suas imagens, perguntas e avaliações serão apagados."))try{await api("/api/produtos/"+e+"/excluir",{method:"DELETE"}),mostrarMensagem("Produto excluído definitivamente."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao excluir o produto.","erro")}}async function reativarProduto(e){try{await api("/api/produtos/"+e+"/reativar",{method:"PUT"}),mostrarMensagem("Produto reativado."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao reativar o produto.","erro")}}function abrirNovoProduto(){produtoEditando=null;const e=document.getElementById("modal-titulo"),t=document.getElementById("produto-id"),o=document.getElementById("produto-form"),a=document.getElementById("cores-container"),n=document.getElementById("modal-produto");e&&(e.textContent="Novo Produto"),t&&(t.value=""),o&&o.reset(),a&&(a.innerHTML=""),adicionarCor(),n&&n.classList.add("aberto")}async function abrirEdicao(e){try{const t=await api("/api/produtos/"+e);produtoEditando=t,document.getElementById("modal-titulo").textContent="Editar Produto",document.getElementById("produto-id").value=t.id,document.getElementById("f-titulo").value=t.titulo||"",document.getElementById("f-linha").value=t.linha||"",document.getElementById("f-categoria").value=t.categoria_id||"",document.getElementById("f-preco").value=t.preco??"",document.getElementById("f-parcelamento").value=t.parcelamento||"",document.getElementById("f-descricao").value=t.descricao||"";const o=t.caracteristicas||{};document.getElementById("f-modelo").value=o.modelo||"",document.getElementById("f-largura").value=o.largura||"",document.getElementById("f-comprimento").value=o.comprimento||"",document.getElementById("f-altura").value=o.altura||"",document.getElementById("f-assentos").value=o.quantidade_assentos||"",document.getElementById("f-compartimento").value=o.compartimento_livros||"",document.getElementById("f-outros").value=o.outros||"",document.getElementById("cores-container").innerHTML="",Array.isArray(t.cores)&&t.cores.length>0?t.cores.forEach(e=>{const o=(t.imagens||[]).filter(t=>Number(t.cor_id)===Number(e.id));adicionarCor({...e,imagens:o})}):adicionarCor(),document.getElementById("modal-produto").classList.add("aberto")}catch(e){console.error("Erro ao abrir produto:",e),mostrarMensagem(e.message||"Erro ao carregar o produto.","erro")}}function fecharModal(){const e=document.getElementById("modal-produto");e&&e.classList.remove("aberto")}function adicionarCor(e={}){const t=document.getElementById("cores-container");if(!t)return;const o=document.createElement("div");o.className="cores-editor",o.innerHTML=`\n        <h4>Cor</h4>\n\n        <div class="form-grid">\n\n            <div class="form-grupo">\n\n                <label>\n                    Nome da cor\n                </label>\n\n                <input\n                    type="text"\n                    class="cor-nome"\n                    maxlength="100"\n                    value="${escaparHtml(e.nome||"")}"\n                >\n\n            </div>\n\n\n            <div class="form-grupo">\n\n                <label>\n                    Altura\n                </label>\n\n                <input\n                    type="text"\n                    class="cor-altura"\n                    maxlength="50"\n                    value="${escaparHtml(e.altura||"")}"\n                >\n\n            </div>\n\n        </div>\n\n\n        <div class="form-grupo">\n\n            <label>\n                Descrição da cor\n            </label>\n\n            <textarea\n                class="cor-descricao descricao-cor"\n                maxlength="5000"\n                placeholder="Descreva as características específicas desta cor, acabamento ou configuração."\n            >${escaparHtml(e.descricao||"")}</textarea>\n\n        </div>\n\n\n        <div class="form-grupo imagem-upload">\n\n            <label>\n                Imagens da cor\n            </label>\n\n            <input\n                type="file"\n                class="cor-imagens-input"\n                accept="image/png,image/jpeg,image/webp"\n                multiple\n            >\n\n        </div>\n\n\n        <div\n            class="imagem-lista cor-imagens-lista"\n        ></div>\n\n\n        <button\n            type="button"\n            class="btn-remove-cor"\n        >\n            Remover cor\n        </button>\n    `,t.appendChild(o);const a=o.querySelector(".btn-remove-cor");if(a&&a.addEventListener("click",()=>removerCor(a)),Array.isArray(e.imagens)&&e.imagens.length>0){const t=o.querySelector(".cor-imagens-lista");e.imagens.forEach(e=>{adicionarItemImagem(t,e.caminho,Boolean(e.principal),e.id||"",e.public_id||"")})}const n=o.querySelector(".cor-imagens-input");n&&n.addEventListener("change",async e=>{const t=Array.from(e.target.files);for(const e of t)await fazerUpload(e,o);e.target.value=""})}function adicionarItemImagem(e,t,o=!1,a="",n=""){if(!e||!t)return;const r=document.createElement("div");if(r.className="imagem-item",r.innerHTML=`\n        <img\n            src="${escaparHtml(urlImagemAdmin(t))}"\n            alt="Imagem do produto"\n        >\n\n        <input\n            type="hidden"\n            class="cor-imagem-caminho"\n            value="${escaparHtml(t)}"\n        >\n\n        ${a?`\n                    <input\n                        type="hidden"\n                        class="cor-imagem-id"\n                        value="${escaparHtml(a)}"\n                    >\n                `:""}\n\n        <label\n            class="imagem-principal-label"\n        >\n\n            <input\n                type="radio"\n                name="imagem-principal"\n                class="cor-imagem-principal"\n                ${o?"checked":""}\n            >\n\n            Principal\n\n        </label>\n\n\n        <button\n            type="button"\n            class="btn-remove-imagem"\n            title="Remover imagem"\n        >\n            ×\n        </button>\n    `,e.appendChild(r),n){const e=document.createElement("input");e.type="hidden",e.className="cor-imagem-public-id",e.value=n,r.appendChild(e)}const c=r.querySelector(".cor-imagem-principal");c&&c.addEventListener("change",()=>{c.checked&&document.querySelectorAll(".cor-imagem-principal").forEach(e=>{e!==c&&(e.checked=!1)})});const i=r.querySelector(".btn-remove-imagem");i&&i.addEventListener("click",()=>removerImagem(i))}function removerImagem(e){const t=e.closest(".imagem-item");if(!t)return;const o=t.querySelector(".cor-imagem-principal")?.checked;if(t.remove(),o){const e=document.querySelector(".cor-imagem-principal");e&&(e.checked=!0)}}function removerCor(e){const t=e.closest(".cores-editor");if(!t)return;const o=Array.from(t.querySelectorAll(".cor-imagem-principal")).some(e=>e.checked);if(t.remove(),o){const e=document.querySelector(".cor-imagem-principal");e&&(e.checked=!0)}}async function fazerUpload(e,t){if(!["image/png","image/jpeg","image/webp"].includes(e.type))return void alert("Formato não permitido. Use PNG, JPG ou WebP.");if(e.size>5242880)return void alert("A imagem deve ter no máximo 5 MB.");const o=new FormData;o.append("imagem",e),o.append("tipo","cor");try{const e=await fetch("/api/uploads",{method:"POST",body:o,credentials:"same-origin"}),a=await e.json().catch(()=>({}));if(!e.ok)throw new Error(a.erro||"Erro no upload.");const n=t.querySelector(".cor-imagens-lista");if(!n)return;const r=!document.querySelector(".cor-imagem-principal:checked");adicionarItemImagem(n,a.caminho,r,"",a.public_id||"")}catch(e){console.error("Erro no upload:",e),alert(e.message||"Erro ao enviar a imagem.")}}
/* ===== PRÉVIA DA PÁGINA DE DETALHES DO PRODUTO ===== */
let indiceImagemPrevia = 0;
let imagensPrevia = [];
let indiceCorPrevia = 0;

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

            if (ponto > 0) {
                resto = resto.substring(0, ponto);
            }

            return "/api/imagens/cloudinary/" + resto;
        }
    }

    return caminho;
}

function obterDadosPrevia() {
    const coresEls = Array.from(document.querySelectorAll(".cores-editor"));
    const cores = coresEls.map((el) => ({
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
        categoria: document.getElementById("f-categoria")?.selectedOptions?.[0]?.textContent || "",
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

function montarListaImagensPrevia(dados) {
    const cor = dados.cores[indiceCorPrevia];
    if (cor && cor.imagens.length) {
        return cor.imagens.slice();
    }

    const todas = [];
    dados.cores.forEach((item) => {
        item.imagens.forEach((img) => todas.push(img));
    });

    return todas;
}

function atualizarControlesGaleriaPrevia() {
    const card = document.getElementById("previa-card");
    if (!card) return;

    const counter = card.querySelector(".preview-detail-counter");
    const prev = card.querySelector(".preview-detail-arrow-left");
    const next = card.querySelector(".preview-detail-arrow-right");
    const image = card.querySelector(".preview-detail-image");
    const empty = card.querySelector(".preview-detail-empty");

    const total = imagensPrevia.length;

    if (counter) counter.textContent = total ? (indiceImagemPrevia + 1) + " / " + total : "1 / 1";
    if (prev) prev.disabled = total <= 1;
    if (next) next.disabled = total <= 1;

    if (image) {
        if (total) {
            const src = urlImagemAdmin(imagensPrevia[indiceImagemPrevia]?.caminho || "");
            if (src) {
                image.src = src;
                image.classList.add("visivel");
            } else {
                image.removeAttribute("src");
                image.classList.remove("visivel");
            }
        } else {
            image.removeAttribute("src");
            image.classList.remove("visivel");
        }
    }

    if (empty) empty.style.display = total ? "none" : "grid";
}

function renderCoresPrevia(dados) {
    const container = document.querySelector("#previa-card .preview-detail-colors");
    const label = document.querySelector("#previa-card .preview-detail-color");
    if (!container || !label) return;

    container.innerHTML = "";

    if (!dados.cores.length) {
        label.textContent = "";
        indiceCorPrevia = 0;
        imagensPrevia = montarListaImagensPrevia(dados);
        indiceImagemPrevia = Math.min(indiceImagemPrevia, Math.max(0, imagensPrevia.length - 1));
        return;
    }

    if (indiceCorPrevia >= dados.cores.length) indiceCorPrevia = 0;

    const corAtual = dados.cores[indiceCorPrevia];
    label.textContent = "Cor: " + (corAtual.nome || "—");

    dados.cores.forEach((cor, index) => {
        if (!cor.nome) return;

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "preview-color-chip" + (index === indiceCorPrevia ? " selecionada" : "");
        chip.textContent = cor.nome;
        chip.addEventListener("click", () => {
            indiceCorPrevia = index;
            indiceImagemPrevia = 0;
            atualizarPreviaProduto();
        });
        container.appendChild(chip);
    });

    imagensPrevia = montarListaImagensPrevia(dados);
    indiceImagemPrevia = Math.min(indiceImagemPrevia, Math.max(0, imagensPrevia.length - 1));
}

function atualizarPreviaProduto() {
    const card = document.getElementById("previa-card");
    if (!card) return;

    const dados = obterDadosPrevia();

    const titulo = card.querySelector(".preview-detail-title");
    const linha = card.querySelector(".preview-detail-line");
    const rating = card.querySelector(".preview-detail-rating");
    const price = card.querySelector(".preview-budget-price");
    const parcel = card.querySelector(".preview-budget-parcel");
    const desc = card.querySelector(".preview-detail-description");
    const specs = card.querySelector(".preview-specs");

    if (titulo) titulo.textContent = dados.titulo;
    if (linha) linha.textContent = dados.linha || dados.categoria || "";
    
    const resumo = produtoEditando?.avaliacao_resumo;
    const media = Number(resumo?.media || 0);
    const totalAvaliacoes = Number(resumo?.total || 0);
    if (rating) {
        rating.textContent = totalAvaliacoes
            ? "★★★★★ " + media.toFixed(1) + "  (" + totalAvaliacoes + (totalAvaliacoes === 1 ? " avaliação)" : " avaliações)") 
            : "☆☆☆☆☆  Sem avaliações";
    }

    renderCoresPrevia(dados);

    if (price) {
        price.textContent = dados.preco ? formatarPreco(dados.preco) : "Preço não informado";
    }

    if (parcel) {
        parcel.textContent = dados.parcelamento || "";
        parcel.style.display = dados.parcelamento ? "block" : "none";
    }

    if (desc) {
        desc.textContent = dados.descricao || "Descrição ainda não cadastrada.";
    }

    if (specs) {
        const lista = [
            ["Modelo", dados.modelo],
            ["Largura", dados.largura],
            ["Comprimento", dados.comprimento],
            ["Altura", dados.altura],
            ["Assentos", dados.assentos],
            ["Compartimento", dados.compartimento],
            ["Outros", dados.outros]
        ].filter((item) => item[1]);

        specs.innerHTML = lista.length
            ? lista.map((item) =>
                '<div class="preview-spec"><div class="preview-spec-label">' +
                escaparHtml(item[0]) +
                '</div><div class="preview-spec-value">' +
                escaparHtml(item[1]) +
                '</div></div>'
            ).join("")
            : '<div class="preview-section-text">Nenhuma característica preenchida.</div>';
    }

    atualizarControlesGaleriaPrevia();
}

function iniciarPreviaProduto() {
    const form = document.getElementById("produto-form");
    const modal = document.getElementById("modal-produto");
    const cores = document.getElementById("cores-container");
    const card = document.getElementById("previa-card");

    if (!form || !card) return;

    form.addEventListener("input", atualizarPreviaProduto);
    form.addEventListener("change", () => {
        atualizarPreviaProduto();
    });

    if (cores) {
        const observer = new MutationObserver(() => {
            imagensPrevia = montarListaImagensPrevia(obterDadosPrevia());
            atualizarPreviaProduto();
        });
        observer.observe(cores, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
    }

    card.querySelectorAll("[data-preview-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const direction = button.dataset.previewAction === "next" ? 1 : -1;
            if (imagensPrevia.length <= 1) return;
            indiceImagemPrevia = (indiceImagemPrevia + direction + imagensPrevia.length) % imagensPrevia.length;
            atualizarControlesGaleriaPrevia();
        });
    });

    if (modal) {
        const observerModal = new MutationObserver(() => {
            if (modal.classList.contains("aberto")) {
                indiceImagemPrevia = 0;
                indiceCorPrevia = 0;
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