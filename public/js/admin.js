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

function confirmarAcao(e,t){return new Promise(o=>{let a=document.getElementById("modal-confirmar");a&&a.remove(),a=document.createElement("div"),a.id="modal-confirmar",a.className="modal-overlay aberto";const n=t.indexOf("DEFINITIVAMENTE")>=0;a.innerHTML=`<div class="modal-box modal-confirmar-box"><h2>${escaparHtml(e)}</h2><p class="modal-confirmar-texto">${escaparHtml(t)}</p><div class="modal-confirmar-acoes"><button type="button" class="btn-tabela btn-desativar" id="mc-cancelar">Cancelar</button><button type="button" class="btn-tabela ${n?"btn-excluir":"btn-reativar"}" id="mc-ok">Confirmar</button></div></div>`,document.body.appendChild(a),document.getElementById("mc-cancelar").onclick=()=>{a.remove(),o(!1)},document.getElementById("mc-ok").onclick=()=>{a.remove(),o(!0)},a.addEventListener("click",e=>{e.target===a&&(a.remove(),o(!1))})})}async function desativarProduto(e){if(await confirmarAcao("Desativar produto","Desativar este produto? Ele sai do catálogo, mas continua no painel e pode ser reativado."))try{await api("/api/produtos/"+e,{method:"DELETE"}),mostrarMensagem("Produto desativado."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao desativar o produto.","erro")}}async function excluirProdutoDefinitivo(e){if(await confirmarAcao("Excluir definitivamente","EXCLUIR este produto DEFINITIVAMENTE? Esta ação não pode ser desfeita: o produto, suas imagens, perguntas e avaliações serão apagados."))try{await api("/api/produtos/"+e+"/excluir",{method:"DELETE"}),mostrarMensagem("Produto excluído definitivamente."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao excluir o produto.","erro")}}async function reativarProduto(e){try{await api("/api/produtos/"+e+"/reativar",{method:"PUT"}),mostrarMensagem("Produto reativado."),await carregarProdutos()}catch(e){mostrarMensagem(e.message||"Erro ao reativar o produto.","erro")}}function abrirNovoProduto(){produtoEditando=null;const e=document.getElementById("modal-titulo"),t=document.getElementById("produto-id"),o=document.getElementById("produto-form"),a=document.getElementById("cores-container"),n=document.getElementById("modal-produto");e&&(e.textContent="Novo Produto"),t&&(t.value=""),o&&o.reset(),a&&(a.innerHTML=""),adicionarCor(),n&&n.classList.add("aberto")}async function abrirEdicao(e){
    try{
        const t=await api("/api/produtos/"+e);
        produtoEditando=t;

        document.getElementById("modal-titulo").textContent="Editar Produto";
        document.getElementById("produto-id").value=t.id;
        document.getElementById("f-titulo").value=t.titulo||"";
        document.getElementById("f-linha").value=t.linha||"";
        document.getElementById("f-categoria").value=t.categoria_id||"";
        document.getElementById("f-preco").value=t.preco??"";
        document.getElementById("f-parcelamento").value=t.parcelamento||"";
        document.getElementById("f-descricao").value=t.descricao||"";

        document.getElementById("cores-container").innerHTML="";

        if(Array.isArray(t.cores)&&t.cores.length>0){
            t.cores.forEach(cor=>{
                const imagens=(t.imagens||[]).filter(img=>Number(img.cor_id)===Number(cor.id));
                adicionarCor({...cor,imagens});
            });
        }else{
            adicionarCor();
        }

        document.getElementById("modal-produto").classList.add("aberto");
    }catch(e){
        console.error("Erro ao abrir produto:",e);
        mostrarMensagem(e.message||"Erro ao carregar o produto.","erro");
    }
}
const produtoForm=document.getElementById("produto-form");
produtoForm&&produtoForm.addEventListener("submit",async e=>{
    e.preventDefault();

    const categoria=document.getElementById("f-categoria").value;
    if(!categoria)return mostrarMensagem("Selecione uma categoria.","erro");

    const cores=[];

    document.querySelectorAll(".cores-editor").forEach(el=>{
        const nome=el.querySelector(".cor-nome")?.value.trim()||"";
        const altura=el.querySelector(".cor-altura")?.value.trim()||"";
        const modelo=el.querySelector(".cor-modelo")?.value.trim()||"";
        const largura=el.querySelector(".cor-largura")?.value.trim()||"";
        const comprimento=el.querySelector(".cor-comprimento")?.value.trim()||"";
        const outros=el.querySelector(".cor-outros")?.value||"";
        const quantidade_assentos=el.querySelector(".cor-assentos")?.value.trim()||"";
        const compartimento_livros=el.querySelector(".cor-compartimento")?.value.trim()||"";
        const descricaoEl=el.querySelector(".cor-descricao");
        const descricao=descricaoEl?descricaoEl.value:"";

        const imagens=[];
        el.querySelectorAll(".imagem-item").forEach(item=>{
            const caminho=item.querySelector(".cor-imagem-caminho");
            if(!caminho||!caminho.value)return;

            const principal=item.querySelector(".cor-imagem-principal");
            const id=item.querySelector(".cor-imagem-id");
            const publicId=item.querySelector(".cor-imagem-public-id");

            imagens.push({
                id:id?id.value:"",
                caminho:caminho.value,
                public_id:publicId?publicId.value:null,
                principal:!!principal&&principal.checked
            });
        });

        if(
            nome||altura||modelo||largura||comprimento||outros||
            quantidade_assentos||compartimento_livros||descricao||imagens.length
        ){
            cores.push({
                nome,
                altura,
                modelo,
                largura,
                comprimento,
                outros,
                quantidade_assentos,
                compartimento_livros,
                descricao,
                imagens
            });
        }
    });

    if(!cores.some(cor=>cor.imagens.some(img=>img.principal))&&cores.length>0){
        for(const cor of cores){
            if(cor.imagens.length>0){
                cor.imagens[0].principal=true;
                break;
            }
        }
    }

    const dados={
        titulo:document.getElementById("f-titulo").value.trim(),
        linha:document.getElementById("f-linha").value.trim(),
        categoria_id:Number(categoria),
        preco:document.getElementById("f-preco").value?Number(document.getElementById("f-preco").value):null,
        parcelamento:document.getElementById("f-parcelamento").value.trim(),
        descricao:document.getElementById("f-descricao").value,
        cores
    };

    if(!dados.titulo)return mostrarMensagem("Informe o título do produto.","erro");

    const id=document.getElementById("produto-id").value;

    try{
        if(id){
            await api("/api/produtos/"+id,{method:"PUT",body:JSON.stringify(dados)});
            mostrarMensagem("Produto atualizado com sucesso.");
        }else{
            await api("/api/produtos",{method:"POST",body:JSON.stringify(dados)});
            mostrarMensagem("Produto criado com sucesso.");
        }

        fecharModal();
        await carregarProdutos();
    }catch(e){
        console.error("Erro ao salvar produto:",e);
        mostrarMensagem(e.message||"Erro ao salvar o produto.","erro");
    }
});const loginForm=document.getElementById("login-form");function escaparHtml(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}loginForm&&loginForm.addEventListener("submit",e=>{e.preventDefault(),login(document.getElementById("login-email").value.trim(),document.getElementById("login-senha").value)}),document.getElementById("btn-logout")?.addEventListener("click",logout),document.getElementById("btn-novo-produto")?.addEventListener("click",abrirNovoProduto),document.getElementById("btn-adicionar-categoria")?.addEventListener("click",()=>abrirModalCategoria("adicionar")),document.getElementById("btn-fechar-modal")?.addEventListener("click",fecharModal),document.getElementById("btn-adicionar-cor")?.addEventListener("click",()=>adicionarCor()),document.getElementById("btn-entrar-site")?.addEventListener("click",()=>window.open("/?modo=admin","_blank","noopener")),document.getElementById("btn-notificacoes")?.addEventListener("click",alternarPainelNotificacoes),document.getElementById("btn-fechar-notificacoes")?.addEventListener("click",alternarPainelNotificacoes),document.addEventListener("click",e=>{const t=document.querySelector(".notificacoes-wrapper");t&&t.contains(e.target)||document.getElementById("notificacoes-painel")?.setAttribute("hidden","")}),document.getElementById("modal-produto")?.addEventListener("click",e=>{"modal-produto"===e.target.id&&fecharModal()}),document.addEventListener("keydown",e=>{"Escape"===e.key&&fecharModal(),("Escape"===e.key)&&document.getElementById("notificacoes-painel")?.setAttribute("hidden","")}),verificarSessao(); 
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
