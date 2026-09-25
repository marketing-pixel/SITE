let intervaloNotificacoes=null,totalNotificacoesAnterior=0;
let categorias=[],produtoEditando=null;async function api(e,t={}){const o={...t,credentials:"same-origin",headers:{...t.body instanceof FormData?{}:{"Content-Type":"application/json"},...t.headers||{}}},a=await fetch(e,o),n=await a.json().catch(()=>({}));if(!a.ok)throw new Error(n.erro||"Erro na requisição.");return n}function mostrarMensagem(e,t="sucesso"){const o=document.getElementById("mensagem");o&&(o.textContent=e,o.className="mensagem "+t,setTimeout(()=>{o.className="mensagem"},4e3))}async function verificarSessao(){try{const e=await api("/api/auth/me"),t=e.admin.nome||e.admin.email||"Administrador",o=document.getElementById("admin-nome");o&&(o.textContent=t),mostrarDashboard(),await carregarCategorias(),await carregarProdutos(),iniciarNotificacoes()}catch(e){mostrarLogin()}}async function login(e,t){const o=document.getElementById("login-erro");o&&(o.textContent="");try{const o=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email:e,senha:t})}),a=document.getElementById("admin-nome");a&&(a.textContent=o.nome||o.email),mostrarDashboard(),await carregarCategorias(),await carregarProdutos(),iniciarNotificacoes()}catch(e){o&&(o.textContent=e.message||"Erro ao realizar login.")}}async function logout(){try{await api("/api/auth/logout",{method:"POST"})}catch(e){console.error("Erro no logout:",e)}produtoEditando=null,pararNotificacoes(),mostrarLogin()}function mostrarLogin(){const e=document.getElementById("login-view"),t=document.getElementById("dashboard-view");e&&(e.style.display="block"),t&&(t.style.display="none")}function mostrarDashboard(){const e=document.getElementById("login-view"),t=document.getElementById("dashboard-view");e&&(e.style.display="none"),t&&(t.style.display="block")}async function carregarCategorias(){try{const eRecebidas=await api("/api/categorias"),tVistos=new Set;categorias=(Array.isArray(eRecebidas)?eRecebidas:[]).filter(e=>{const t=e?.id!=null?"id:"+String(e.id):"nome:"+String(e?.nome||"");return tVistos.has(t)?!1:(tVistos.add(t),!0)});const e=document.getElementById("f-categoria");if(!e)return;e.innerHTML='<option value="">Selecione...</option>',categorias.forEach(t=>{const o=document.createElement("option");o.value=t.id,o.textContent=t.nome,e.appendChild(o)})}catch(e){console.error("Erro ao carregar categorias:",e),mostrarMensagem("Não foi possível carregar as categorias.","erro")}}async function carregarProdutos(){
    try{
        renderTabela(await api("/api/produtos/admin/todos"));
    }catch(e){
        console.error("Erro ao carregar produtos:",e);
        mostrarMensagem(e.message||"Não foi possível carregar os produtos.","erro");
    }
}

function gerarSlugCategoria(nome){
    return String(nome||"")
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g,"")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g,"-")
        .replace(/^-+|-+$/g,"")
        .slice(0,120);
}

function abrirModalCategoria(modo="adicionar",categoria=null){
    const existente=document.getElementById("modal-categoria");
    if(existente)existente.remove();

    const editar=modo==="renomear";
    const nomeAtual=categoria?.nome||"";
    const overlay=document.createElement("div");
    overlay.id="modal-categoria";
    overlay.className="modal-overlay aberto categoria-modal-overlay";
    overlay.innerHTML=`
        <div class="modal-box categoria-modal-box" role="dialog" aria-modal="true" aria-labelledby="categoria-modal-titulo">
            <button type="button" class="modal-fechar" id="categoria-modal-fechar" aria-label="Fechar">&times;</button>
            <span class="categoria-modal-kicker">CATEGORIAS</span>
            <h2 id="categoria-modal-titulo">${editar?"Renomear categoria":"Adicionar categoria"}</h2>
            <p class="categoria-modal-texto">${editar?"Altere o nome desta categoria. Os produtos vinculados continuarão nela.":"Crie uma nova categoria para organizar seus produtos na lista do painel."}</p>
            <div class="form-grupo">
                <label for="categoria-nome-input">Nome da categoria</label>
                <input type="text" id="categoria-nome-input" maxlength="120" value="${escaparHtml(nomeAtual)}" autocomplete="off" placeholder="Ex.: Conjuntos escolares">
            </div>
            <div class="categoria-modal-acoes">
                <button type="button" class="btn-tabela categoria-cancelar" id="categoria-modal-cancelar">Cancelar</button>
                <button type="button" class="btn-tabela categoria-confirmar" id="categoria-modal-confirmar">${editar?"Salvar nome":"Adicionar categoria"}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const fechar=()=>overlay.remove();
    overlay.addEventListener("click",event=>{if(event.target===overlay)fechar()});
    document.getElementById("categoria-modal-fechar")?.addEventListener("click",fechar);
    document.getElementById("categoria-modal-cancelar")?.addEventListener("click",fechar);

    const input=document.getElementById("categoria-nome-input");
    const confirmar=document.getElementById("categoria-modal-confirmar");
    input?.focus();
    input?.select();

    const salvar=async()=>{
        const nome=input?.value.trim()||"";
        if(!nome){
            input?.focus();
            mostrarMensagem("Informe o nome da categoria.","erro");
            return;
        }
        try{
            if(editar){
                await api("/api/categorias/"+encodeURIComponent(categoria.id),{
                    method:"PUT",
                    body:JSON.stringify({nome})
                });
                mostrarMensagem("Categoria renomeada com sucesso.");
            }else{
                const slug=gerarSlugCategoria(nome);
                if(!slug){
                    mostrarMensagem("Use um nome válido para a categoria.","erro");
                    return;
                }
                await api("/api/categorias",{
                    method:"POST",
                    body:JSON.stringify({nome,slug})
                });
                mostrarMensagem("Categoria adicionada com sucesso.");
            }
            fechar();
            await carregarCategorias();
            await carregarProdutos();
        }catch(e){
            console.error("Erro ao salvar categoria:",e);
            mostrarMensagem(e.message||"Não foi possível salvar a categoria.","erro");
        }
    };

    confirmar?.addEventListener("click",salvar);
    input?.addEventListener("keydown",event=>{
        if(event.key==="Enter"){
            event.preventDefault();
            salvar();
        }
        if(event.key==="Escape")fechar();
    });
}

async function renomearCategoria(id){
    const categoria=categorias.find(item=>Number(item.id)===Number(id));
    if(!categoria)return;
    abrirModalCategoria("renomear",categoria);
}

async function excluirCategoria(id){
    const categoria=categorias.find(item=>Number(item.id)===Number(id));
    if(!categoria)return;

    if(!await confirmarAcao(
        "Excluir categoria",
        "Excluir a categoria \""+categoria.nome+"\"? A categoria só poderá ser excluída se não houver produtos vinculados a ela."
    ))return;

    try{
        await api("/api/categorias/"+encodeURIComponent(id),{method:"DELETE"});
        mostrarMensagem("Categoria excluída com sucesso.");
        await carregarCategorias();
        await carregarProdutos();
    }catch(e){
        mostrarMensagem(e.message||"Não foi possível excluir a categoria.","erro");
    }
}

function criarCabecalhoCategoria(categoria,total){
    const tr=document.createElement("tr");
    tr.className="categoria-separador";
    const td=document.createElement("td");
    td.colSpan=6;

    const header=document.createElement("div");
    header.className="categoria-linha";

    const nomeArea=document.createElement("div");
    nomeArea.className="categoria-nome-area";

    const titulo=document.createElement("strong");
    titulo.className="categoria-nome";
    titulo.textContent=categoria.nome||"Sem categoria";

    const lapis=document.createElement("button");
    lapis.type="button";
    lapis.className="categoria-lapis";
    lapis.title="Renomear categoria";
    lapis.setAttribute("aria-label","Renomear categoria");
    lapis.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.5V20h2.5L18.9 7.6l-2.5-2.5L4 17.5z"></path><path d="m14.9 6.1 2.9-2.9a1.7 1.7 0 0 1 2.4 0l.5.5a1.7 1.7 0 0 1 0 2.4l-2.9 2.9"></path></svg>';
    lapis.addEventListener("click",()=>renomearCategoria(categoria.id));

    const contador=document.createElement("span");
    contador.className="categoria-contador";
    contador.textContent=total+(total===1?" produto":" produtos");

    nomeArea.appendChild(titulo);
    nomeArea.appendChild(lapis);
    nomeArea.appendChild(contador);

    const acoes=document.createElement("div");
    acoes.className="categoria-acoes";

    const excluir=document.createElement("button");
    excluir.type="button";
    excluir.className="btn-categoria btn-categoria-excluir";
    excluir.textContent="Excluir";
    excluir.addEventListener("click",()=>excluirCategoria(categoria.id));

    acoes.appendChild(excluir);

    header.appendChild(nomeArea);
    header.appendChild(acoes);
    td.appendChild(header);
    tr.appendChild(td);
    return tr;
}

function criarLinhaProdutoAdmin(produto){
    const tr=document.createElement("tr");

    const id=document.createElement("td");
    id.textContent=produto.id;

    const titulo=document.createElement("td");
    titulo.textContent=produto.titulo||"—";

    const categoria=document.createElement("td");
    categoria.textContent=produto.categoria_nome||"—";

    const preco=document.createElement("td");
    if(produto.preco!==null&&produto.preco!==undefined&&produto.preco!==""){
        const valor=Number(produto.preco);
        preco.textContent=Number.isFinite(valor)?valor.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"—";
    }else preco.textContent="—";

    const status=document.createElement("td");
    status.className=produto.ativo?"status-ativo":"status-inativo";
    status.textContent=produto.ativo?"Ativo":"Inativo";

    const acoes=document.createElement("td");
    const editar=document.createElement("button");
    editar.type="button";
    editar.className="btn-tabela btn-editar";
    editar.textContent="Editar";
    editar.addEventListener("click",()=>abrirEdicao(produto.id));
    acoes.appendChild(editar);

    if(produto.ativo){
        const desativar=document.createElement("button");
        desativar.type="button";
        desativar.className="btn-tabela btn-desativar";
        desativar.textContent="Desativar";
        desativar.addEventListener("click",()=>desativarProduto(produto.id));
        acoes.appendChild(desativar);

        const excluir=document.createElement("button");
        excluir.type="button";
        excluir.className="btn-tabela btn-excluir";
        excluir.textContent="Excluir";
        excluir.addEventListener("click",()=>excluirProdutoDefinitivo(produto.id));
        acoes.appendChild(excluir);
    }else{
        const reativar=document.createElement("button");
        reativar.type="button";
        reativar.className="btn-tabela btn-reativar";
        reativar.textContent="Reativar";
        reativar.addEventListener("click",()=>reativarProduto(produto.id));
        acoes.appendChild(reativar);
    }

    tr.appendChild(id);
    tr.appendChild(titulo);
    tr.appendChild(categoria);
    tr.appendChild(preco);
    tr.appendChild(status);
    tr.appendChild(acoes);
    return tr;
}

function renderTabela(produtos){
    const tabela=document.getElementById("tabela-produtos");
    if(!tabela)return;

    tabela.innerHTML="";

    const vistosProdutos=new Set();
    const listaBruta=Array.isArray(produtos)?produtos:[];
    const lista=listaBruta.filter(produto=>{
        const chave=produto?.id!=null?"id:"+String(produto.id):"sem-id:"+String(produto?.titulo||"");
        if(vistosProdutos.has(chave))return false;
        vistosProdutos.add(chave);
        return true;
    });

    const vistosCategorias=new Set();
    const categoriasRecebidas=Array.isArray(categorias)?categorias:[];
    const categoriasAtuais=categoriasRecebidas.filter(categoria=>{
        const chave=categoria?.id!=null?"id:"+String(categoria.id):"nome:"+String(categoria?.nome||"");
        if(vistosCategorias.has(chave))return false;
        vistosCategorias.add(chave);
        return true;
    });

    if(!lista.length&&!categoriasAtuais.length){
        const tr=document.createElement("tr");
        const td=document.createElement("td");
        td.colSpan=6;
        td.textContent="Nenhum produto ou categoria cadastrado.";
        td.className="tabela-vazia";
        tr.appendChild(td);
        tabela.appendChild(tr);
        return;
    }

    const usados=new Set();

    categoriasAtuais.forEach(categoria=>{
        const itens=lista.filter(produto=>Number(produto.categoria_id)===Number(categoria.id));
        usados.add(String(categoria.id));
        tabela.appendChild(criarCabecalhoCategoria(categoria,itens.length));

        if(itens.length){
            itens.forEach(produto=>tabela.appendChild(criarLinhaProdutoAdmin(produto)));
        }else{
            const tr=document.createElement("tr");
            tr.className="categoria-sem-produtos";
            const td=document.createElement("td");
            td.colSpan=6;
            td.textContent="Nenhum produto nesta categoria.";
            tr.appendChild(td);
            tabela.appendChild(tr);
        }
    });

    const semCategoria=lista.filter(produto=>!usados.has(String(produto.categoria_id)));
    if(semCategoria.length){
        const categoriaVirtual={id:"__sem_categoria__",nome:"Sem categoria"};
        tabela.appendChild(criarCabecalhoCategoria(categoriaVirtual,semCategoria.length));
        semCategoria.forEach(produto=>tabela.appendChild(criarLinhaProdutoAdmin(produto)));
    }
}

function confirmarAcao(e,t){return new Promise(o=>{let a=document.getElementById("modal-confirmar");a&&a.remove(),a=document.createElement("div"),a.id="modal-confirmar",a.className="modal-overlay aberto";const n=t.indexOf("DEFINITIVAMENTE")>=0;a.innerHTML=`<div class="modal-box modal-confirmar-box"><h2>${escaparHtml(e)}</h2><p class="modal-confirmar-texto">${escaparHtml(t)}</p><div class="modal-confirmar-acoes"><button type="button" class="btn-tabela btn-desativar" id="mc-cancelar">Cancelar</button><button type="button" class="btn-tabela ${n?"btn-excluir":"btn-reativar"}" id="mc-ok">Confirmar</button></div></div>`,document.body.appendChild(a),document.getElementById("mc-cancelar").onclick=()=>{a.remove(),o(!1)},document.getElementById("mc-ok").onclick=()=>{a.remove(),o(!0)},a.addEventListener("click",e=>{e.target===a&&(a.remove(),o(!1))})})}async function desativarProduto(e){if(await confirmarAcao("Desativar produto","Desativar este produto? Ele sai do catálogo, mas continua no painel e pode ser reativado."))try{await api("/api/produtos/"+e,{method:"DELETE"}),mostrarMensagem("Produto desativado."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao desativar o produto.","erro")}}async function excluirProdutoDefinitivo(e){if(await confirmarAcao("Excluir definitivamente","EXCLUIR este produto DEFINITIVAMENTE? Esta ação não pode ser desfeita: o produto, suas imagens, perguntas e avaliações serão apagados."))try{await api("/api/produtos/"+e+"/excluir",{method:"DELETE"}),mostrarMensagem("Produto excluído definitivamente."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao excluir o produto.","erro")}}async function reativarProduto(e){try{await api("/api/produtos/"+e+"/reativar",{method:"PUT"}),mostrarMensagem("Produto reativado."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao reativar o produto.","erro")}}function abrirNovoProduto(){produtoEditando=null;const e=document.getElementById("modal-titulo"),t=document.getElementById("produto-id"),o=document.getElementById("produto-form"),a=document.getElementById("cores-container"),n=document.getElementById("modal-produto");e&&(e.textContent="Novo Produto"),t&&(t.value=""),o&&o.reset(),a&&(a.innerHTML=""),adicionarCor(),n&&n.classList.add("aberto")}async function abrirEdicao(e){try{const t=await api("/api/produtos/"+e);produtoEditando=t,document.getElementById("modal-titulo").textContent="Editar Produto",document.getElementById("produto-id").value=t.id,document.getElementById("f-titulo").value=t.titulo||"",document.getElementById("f-linha").value=t.linha||"",document.getElementById("f-categoria").value=t.categoria_id||"",document.getElementById("f-preco").value=t.preco??"",document.getElementById("f-parcelamento").value=t.parcelamento||"",document.getElementById("f-descricao").value=t.descricao||"";const o=t.caracteristicas||{};document.getElementById("f-modelo").value=o.modelo||"",document.getElementById("f-largura").value=o.largura||"",document.getElementById("f-comprimento").value=o.comprimento||"",document.getElementById("f-altura").value=o.altura||"",document.getElementById("f-assentos").value=o.quantidade_assentos||"",document.getElementById("f-compartimento").value=o.compartimento_livros||"",document.getElementById("f-outros").value=o.outros||"",document.getElementById("cores-container").innerHTML="",Array.isArray(t.cores)&&t.cores.length>0?t.cores.forEach(e=>{const o=(t.imagens||[]).filter(t=>Number(t.cor_id)===Number(e.id));adicionarCor({...e,imagens:o})}):adicionarCor(),document.getElementById("modal-produto").classList.add("aberto")}catch(e){console.error("Erro ao abrir produto:",e),mostrarMensagem(e.message||"Erro ao carregar o produto.","erro")}}function fecharModal(){const e=document.getElementById("modal-produto");e&&e.classList.remove("aberto")}let contadorGrupoImagemPrincipal=0;function adicionarCor(e={}){const t=document.getElementById("cores-container");if(!t)return;const o=document.createElement("div"),s="imagem-principal-"+(++contadorGrupoImagemPrincipal);o.className="cores-editor",o.dataset.imagemPrincipalGrupo=s,o.innerHTML=`\n        <h4>Cor</h4>\n\n        <div class="form-grid">\n\n            <div class="form-grupo">\n\n                <label>\n                    Nome da cor\n                </label>\n\n                <input\n                    type="text"\n                    class="cor-nome"\n                    maxlength="100"\n                    value="${escaparHtml(e.nome||"")}"\n                >\n\n            </div>\n\n\n            <div class="form-grupo">\n\n                <label>\n                    Altura\n                </label>\n\n                <input\n                    type="text"\n                    class="cor-altura"\n                    maxlength="50"\n                    value="${escaparHtml(e.altura||"")}"\n                >\n\n            </div>\n\n        </div>\n\n\n        <div class="form-grupo">\n\n            <label>\n                Descrição da cor\n            </label>\n\n            <textarea\n                class="cor-descricao descricao-cor"\n                maxlength="5000"\n                placeholder="Descreva as características específicas desta cor, acabamento ou configuração."\n            >${escaparHtml(e.descricao||"")}</textarea>\n\n        </div>\n\n\n        <div class="form-grupo imagem-upload">\n\n            <label>\n                Imagens da cor\n            </label>\n\n            <div class="imagem-dropzone" tabindex="0" role="button" aria-label="Adicionar imagens desta cor">\n                <div class="imagem-upload-icon" aria-hidden="true">↥</div>\n\n                <div class="imagem-upload-copy">\n                    <div class="imagem-upload-title">Adicionar imagens</div>\n                    <div class="imagem-upload-subtitle">PNG, JPG ou WebP • até 5 MB por arquivo</div>\n                </div>\n\n                <div class="imagem-upload-actions">\n                    <span class="imagem-selecionar-btn">Selecionar arquivos</span>\n                </div>\n\n                <input\n                    type="file"\n                    class="cor-imagens-input imagem-upload-file"\n                    accept="image/png,image/jpeg,image/webp"\n                    multiple\n                    tabindex="-1"\n                >\n            </div>\n\n            <div class="imagem-contador" aria-live="polite"></div>\n\n        </div>\n\n\n        <div\n            class="imagem-lista cor-imagens-lista"\n        ></div>\n\n\n        <button\n            type="button"\n            class="btn-remove-cor"\n        >\n            Remover cor\n        </button>\n    `,t.appendChild(o);const a=o.querySelector(".btn-remove-cor");if(a&&a.addEventListener("click",()=>removerCor(a)),Array.isArray(e.imagens)&&e.imagens.length>0){const t=o.querySelector(".cor-imagens-lista");e.imagens.forEach(e=>{adicionarItemImagem(t,e.caminho,Boolean(e.principal),e.id||"",e.public_id||"")})}const n=o.querySelector(".cor-imagens-input"),r=o.querySelector(".imagem-dropzone");if(n&&r){const a=async e=>{const t=Array.from(e.target.files||[]);if(window.abrirEditorImagemArquivos)await window.abrirEditorImagemArquivos(t,o);else for(const e of t)await fazerUpload(e,o);e.target.value="",atualizarContadorImagens(o)};n.addEventListener("change",a),r.addEventListener("click",()=>n.click()),r.addEventListener("keydown",e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),n.click())}),["dragenter","dragover"].forEach(e=>r.addEventListener(e,e=>{e.preventDefault(),r.classList.add("dragging")})),["dragleave","drop"].forEach(e=>r.addEventListener(e,e=>{e.preventDefault(),r.classList.remove("dragging")})),r.addEventListener("drop",async e=>{const t=Array.from(e.dataTransfer?.files||[]);if(window.abrirEditorImagemArquivos)await window.abrirEditorImagemArquivos(t,o);else for(const e of t)await fazerUpload(e,o);atualizarContadorImagens(o)})}atualizarContadorImagens(o)}function atualizarContadorImagens(e){const t=e?.querySelector(".imagem-contador"),o=e?e.querySelectorAll(".imagem-item").length:0;t&&(t.innerHTML=o?'<strong>'+o+(1===o?" imagem":" imagens")+'</strong> cadastrada'+(1===o?"":"s")+"." :"Nenhuma imagem cadastrada ainda.")} function adicionarItemImagem(e,t,o=!1,a="",n=""){if(!e||!t)return;const r=document.createElement("div");if(r.className="imagem-item",r.innerHTML=`\n        <img\n            src="${escaparHtml(urlImagemAdmin(t))}"\n            alt="Imagem do produto"\n        >\n\n        <input\n            type="hidden"\n            class="cor-imagem-caminho"\n            value="${escaparHtml(t)}"\n        >\n\n        ${a?`\n                    <input\n                        type="hidden"\n                        class="cor-imagem-id"\n                        value="${escaparHtml(a)}"\n                    >\n                `:""}\n\n        <label\n            class="imagem-principal-label"\n        >\n\n            <input\n                type="radio"\n                name="${e.closest(".cores-editor")?.dataset.imagemPrincipalGrupo||"imagem-principal-global"}"\n                class="cor-imagem-principal"\n                ${o?"checked":""}\n            >\n\n            Principal\n\n        </label>\n\n\n        <div class="imagem-item-acoes">\n            <button\n                type="button"\n                class="btn-recortar-imagem"\n                title="Recortar e reposicionar imagem"\n            >\n                ✂ Recortar\n            </button>\n\n            <button\n            type="button"\n            class="btn-remove-imagem"\n            title="Remover imagem"\n        >\n            ×\n        </button>\n        </div>\n    `,e.appendChild(r),atualizarContadorImagens(e.closest(".cores-editor")),n){const e=document.createElement("input");e.type="hidden",e.className="cor-imagem-public-id",e.value=n,r.appendChild(e)}const c=r.querySelector(".cor-imagem-principal");c&&c.addEventListener("change",()=>{if(!c.checked)return;c.closest(".cores-editor")?.querySelectorAll(".cor-imagem-principal").forEach(e=>{e!==c&&(e.checked=!1)});atualizarPreviaProduto()});const i=r.querySelector(".btn-remove-imagem");i&&i.addEventListener("click",()=>removerImagem(i));const s=r.querySelector(".btn-recortar-imagem");s&&s.addEventListener("click",()=>{if(typeof window.recortarImagemExistente==="function")window.recortarImagemExistente(r,e.closest(".cores-editor"))})}function removerImagem(e){const t=e.closest(".imagem-item");if(!t)return;const o=t.querySelector(".cor-imagem-principal")?.checked;const r=t.closest(".cores-editor");if(t.remove(),atualizarContadorImagens(r),o){const e=r?.querySelector(".cor-imagem-principal");e&&(e.checked=!0)}}function removerCor(e){const t=e.closest(".cores-editor");if(!t)return;const o=Array.from(t.querySelectorAll(".cor-imagem-principal")).some(e=>e.checked);if(t.remove(),o){const e=document.querySelector(".cor-imagem-principal");e&&(e.checked=!0)}}async function enviarImagemParaArmazenamento(e){if(!e||!["image/png","image/jpeg","image/webp"].includes(e.type))throw new Error("Formato não permitido. Use PNG, JPG ou WebP.");if(e.size>5242880)throw new Error("A imagem deve ter no máximo 5 MB.");const t=new FormData;t.append("imagem",e),t.append("tipo","cor");const o=await fetch("/api/uploads",{method:"POST",body:t,credentials:"same-origin"}),a=await o.json().catch(()=>({}));if(!o.ok)throw new Error(a.erro||"Erro no upload.");if(!a.caminho)throw new Error("O servidor não retornou o endereço da imagem.");return a}

async function fazerUpload(e,t){try{const o=await enviarImagemParaArmazenamento(e),a=t.querySelector(".cor-imagens-lista");if(!a)return;const n=!t.querySelector(".cor-imagem-principal:checked");return adicionarItemImagem(a,o.caminho,n,"",o.public_id||"")}catch(e){console.error("Erro no upload:",e),alert(e.message||"Erro ao enviar a imagem.")}}
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

function criarIconeSeta3D(direcao) {
    const rotacao = { esquerda: "180", direita: "0", cima: "-90", baixo: "90" }[direcao] ?? "0";
    const span = document.createElement("span");
    span.className = "seta-3d";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = '<svg class="seta-3d-svg" viewBox="0 0 28 28" focusable="false" style="--seta-rotacao:' + rotacao + 'deg"><path class="seta-3d-sombra" d="M4 12h11.4L11 7.6 14.8 4 25 14 14.8 24 11 20.4l4.4-4.4H4z"></path><path class="seta-3d-face" d="M3 10h11.4L10 5.6 13.8 2 24 12 13.8 22 10 18.4l4.4-4.4H3z"></path><path class="seta-3d-brilho" d="M5 10h9.8l-2.2-2.2" /></svg>';
    return span;
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
    voltar.innerHTML = "";
    voltar.appendChild(criarIconeSeta3D("esquerda"));
    voltar.appendChild(document.createTextNode("Voltar para produtos"));
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
    compartilhar.innerHTML = '<svg class="pp-compartilhar-icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="2.35"></circle><circle cx="6" cy="12" r="2.35"></circle><circle cx="18" cy="19" r="2.35"></circle><path d="M8.05 10.95 15.95 6.05"></path><path d="M8.05 13.05 15.95 17.95"></path></svg>';
    compartilhar.setAttribute("aria-hidden", "true");
    imagemArea.appendChild(compartilhar);

    if (imagens.length > 1) {
        const anterior = document.createElement("button");
        anterior.type = "button";
        anterior.className = "pp-seta esq";
        anterior.innerHTML = "";
        anterior.appendChild(criarIconeSeta3D("esquerda"));
        anterior.addEventListener("click", () => {
            indiceImagemPrevia = (indiceImagemPrevia - 1 + imagens.length) % imagens.length;
            montarPaginaPrevia();
        });

        const proxima = document.createElement("button");
        proxima.type = "button";
        proxima.className = "pp-seta dir";
        proxima.innerHTML = "";
        proxima.appendChild(criarIconeSeta3D("direita"));
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

const produtoForm=document.getElementById("produto-form");produtoForm&&produtoForm.addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("f-categoria").value;if(!t)return void mostrarMensagem("Selecione uma categoria.","erro");const o=[];if(document.querySelectorAll(".cores-editor").forEach(e=>{const t=e.querySelector(".cor-nome").value.trim(),a=e.querySelector(".cor-altura").value.trim(),n=e.querySelector(".cor-descricao"),r=n?n.value.trim():"",c=[];e.querySelectorAll(".imagem-item").forEach(e=>{const t=e.querySelector(".cor-imagem-caminho");if(!t||!t.value)return;const o=e.querySelector(".cor-imagem-principal"),a=e.querySelector(".cor-imagem-id"),n=e.querySelector(".cor-imagem-public-id");c.push({id:a?a.value:"",caminho:t.value,public_id:n?n.value:null,principal:!!o&&o.checked})}),(t||a||r||c.length>0)&&o.push({nome:t,altura:a,descricao:r,imagens:c})}),!o.some(e=>e.imagens.some(e=>!0===e.principal))&&o.length>0)e:for(const e of o)if(e.imagens.length>0){e.imagens[0].principal=!0;break e}const a={titulo:document.getElementById("f-titulo").value.trim(),linha:document.getElementById("f-linha").value.trim(),categoria_id:Number(t),preco:document.getElementById("f-preco").value?Number(document.getElementById("f-preco").value):null,parcelamento:document.getElementById("f-parcelamento").value.trim(),descricao:document.getElementById("f-descricao").value.trim(),caracteristicas:{modelo:document.getElementById("f-modelo").value.trim(),largura:document.getElementById("f-largura").value.trim(),comprimento:document.getElementById("f-comprimento").value.trim(),altura:document.getElementById("f-altura").value.trim(),outros:document.getElementById("f-outros").value.trim(),quantidadeAssentos:document.getElementById("f-assentos").value.trim(),compartimentoLivros:document.getElementById("f-compartimento").value.trim()},cores:o};if(!a.titulo)return void mostrarMensagem("Informe o título do produto.","erro");const n=document.getElementById("produto-id").value;try{n?(await api("/api/produtos/"+n,{method:"PUT",body:JSON.stringify(a)}),mostrarMensagem("Produto atualizado com sucesso.")):(await api("/api/produtos",{method:"POST",body:JSON.stringify(a)}),mostrarMensagem("Produto criado com sucesso.")),fecharModal(),await carregarProdutos()}catch(e){console.error("Erro ao salvar produto:",e),mostrarMensagem(e.message||"Erro ao salvar o produto.","erro")}});const loginForm=document.getElementById("login-form");function escaparHtml(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}loginForm&&loginForm.addEventListener("submit",e=>{e.preventDefault(),login(document.getElementById("login-email").value.trim(),document.getElementById("login-senha").value)}),document.getElementById("btn-logout")?.addEventListener("click",logout),document.getElementById("btn-novo-produto")?.addEventListener("click",abrirNovoProduto),document.getElementById("btn-adicionar-categoria")?.addEventListener("click",()=>abrirModalCategoria("adicionar")),document.getElementById("btn-fechar-modal")?.addEventListener("click",fecharModal),document.getElementById("btn-adicionar-cor")?.addEventListener("click",()=>adicionarCor()),document.getElementById("btn-entrar-site")?.addEventListener("click",()=>window.open("/?modo=admin","_blank","noopener")),document.getElementById("btn-notificacoes")?.addEventListener("click",alternarPainelNotificacoes),document.getElementById("btn-fechar-notificacoes")?.addEventListener("click",alternarPainelNotificacoes),document.addEventListener("click",e=>{const t=document.querySelector(".notificacoes-wrapper");t&&t.contains(e.target)||document.getElementById("notificacoes-painel")?.setAttribute("hidden","")}),document.getElementById("modal-produto")?.addEventListener("click",e=>{"modal-produto"===e.target.id&&fecharModal()}),document.addEventListener("keydown",e=>{"Escape"===e.key&&fecharModal(),("Escape"===e.key)&&document.getElementById("notificacoes-painel")?.setAttribute("hidden","")}),verificarSessao(); 
function formatarDataNotificacao(data){
    if(!data)return"";
    const d=new Date(data);
    if(Number.isNaN(d.getTime()))return"";
    return d.toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
}

function alternarPainelNotificacoes(){
    const painel=document.getElementById("notificacoes-painel");
    const botao=document.getElementById("btn-notificacoes");
    if(!painel||!botao)return;
    const aberto=painel.hasAttribute("hidden");
    if(aberto)painel.removeAttribute("hidden");
    else painel.setAttribute("hidden","");
    botao.setAttribute("aria-expanded",aberto?"true":"false");
}

async function marcarNotificacaoLida(id){
    try{
        await api("/api/produtos/admin/notificacoes/"+encodeURIComponent(id)+"/lida",{method:"PUT"});
    }catch(e){
        console.error("Erro ao marcar notificação:",e);
    }
}

async function abrirNotificacao(item){
    if(!item||!item.produto_id)return;
    await marcarNotificacaoLida(item.id);
    const pagina=item.tipo==="pergunta"?"perguntas":"avaliacoes";
    window.open("/?modo=admin&produto="+encodeURIComponent(item.produto_id)+"&pagina="+pagina,"_blank","noopener");
    await carregarNotificacoes();
}

function renderNotificacoes(data){
    const lista=document.getElementById("notificacoes-lista");
    const resumo=document.getElementById("notificacoes-resumo");
    const badge=document.getElementById("notificacoes-badge");
    if(!lista||!resumo||!badge)return;

    const total=Number(data?.total||0);
    const perguntas=Number(data?.perguntas||0);
    const avaliacoes=Number(data?.avaliacoes||0);

    badge.textContent=total>99?"99+":String(total);
    badge.hidden=total===0;

    if(total===0){
        resumo.textContent="Nenhuma novidade pendente.";
    }else{
        const partes=[];
        if(perguntas)partes.push(perguntas+(perguntas===1?" pergunta":" perguntas"));
        if(avaliacoes)partes.push(avaliacoes+(avaliacoes===1?" avaliação":" avaliações"));
        resumo.textContent=partes.join(" e ")+" aguardando sua atenção.";
    }

    lista.innerHTML="";
    const itens=Array.isArray(data?.notificacoes)?data.notificacoes:[];
    if(!itens.length){
        const vazio=document.createElement("div");
        vazio.className="notificacoes-vazio";
        vazio.textContent="Tudo em dia. Nenhuma notificação para mostrar.";
        lista.appendChild(vazio);
        return;
    }

    itens.forEach(item=>{
        const btn=document.createElement("button");
        btn.type="button";
        btn.className="notificacao-item"+(!item.lida?" nao-lida":"");

        const icone=document.createElement("span");
        icone.className="notificacao-icone "+(item.tipo==="pergunta"?"pergunta":"avaliacao");
        icone.textContent=item.tipo==="pergunta"?"?":"★";

        const conteudo=document.createElement("span");
        conteudo.className="notificacao-conteudo";

        const topo=document.createElement("span");
        topo.className="notificacao-topo";

        const tipo=document.createElement("strong");
        tipo.className="notificacao-tipo";
        tipo.textContent=item.tipo==="pergunta"?"Nova pergunta":"Nova avaliação";

        const data=document.createElement("span");
        data.className="notificacao-data";
        data.textContent=formatarDataNotificacao(item.criado_em);

        topo.appendChild(tipo);
        topo.appendChild(data);

        const produto=document.createElement("span");
        produto.className="notificacao-produto";
        produto.textContent=item.produto_titulo||"Produto";

        const texto=document.createElement("span");
        texto.className="notificacao-texto";
        texto.textContent=item.tipo==="pergunta"
            ?(item.autor||"Cliente")+": "+(item.texto||"Pergunta recebida.")
            :(item.autor||"Cliente")+(item.texto?": "+item.texto:"")+" • "+String(item.tipo==="avaliacao"?"Avaliação recebida.":"");

        conteudo.appendChild(topo);
        conteudo.appendChild(produto);
        conteudo.appendChild(texto);

        btn.appendChild(icone);
        btn.appendChild(conteudo);
        btn.addEventListener("click",()=>abrirNotificacao(item));
        lista.appendChild(btn);
    });
}

async function carregarNotificacoes(silencioso=false){
    try{
        const data=await api("/api/produtos/admin/notificacoes");
        const total=Number(data?.total||0);
        renderNotificacoes(data);

        const badge=document.getElementById("notificacoes-badge");
        if(total>totalNotificacoesAnterior&&totalNotificacoesAnterior>0&&badge){
            badge.classList.remove("pulsar");
            void badge.offsetWidth;
            badge.classList.add("pulsar");
        }
        totalNotificacoesAnterior=total;
    }catch(e){
        if(!silencioso)console.error("Erro ao carregar notificações:",e);
    }
}

function iniciarNotificacoes(){
    if(intervaloNotificacoes)clearInterval(intervaloNotificacoes);
    totalNotificacoesAnterior=0;
    carregarNotificacoes(true);
    intervaloNotificacoes=setInterval(()=>carregarNotificacoes(true),30000);
}

function pararNotificacoes(){
    if(intervaloNotificacoes){
        clearInterval(intervaloNotificacoes);
        intervaloNotificacoes=null;
    }
}
