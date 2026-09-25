let produtos=[],produtoAtual=null,corAtual=0,imgAtual=0,categorias=[],categoriaFiltro=null,administradorLogado=!1,dadosAdministrador=null,modoAdminSite=new URLSearchParams(window.location.search).get("modo")==="admin";async function api(e,t={}){const a={...t,credentials:"same-origin",headers:{...t.body instanceof FormData?{}:{"Content-Type":"application/json"},...t.headers||{}}},o=new AbortController,r=setTimeout(()=>o.abort(),60000);a.signal=o.signal;try{const t=await fetch(e,a),i=await t.json().catch(()=>({}));if(!t.ok)throw new Error(i.erro||"Erro na requisição.");return i}catch(e){if("AbortError"===e.name)throw new Error("A solicitação demorou demais. Verifique sua conexão e tente novamente.");throw e}finally{clearTimeout(r)}}async function verificarAdministrador(){administradorLogado=!1,dadosAdministrador=null;try{const e=await api("/api/auth/me");e&&e.admin&&modoAdminSite&&(administradorLogado=!0,dadosAdministrador=e.admin)}catch(e){administradorLogado=!1,dadosAdministrador=null}}function atualizarModoAdministrador(){document.querySelectorAll("[data-apenas-admin]").forEach(e=>{e.style.display=administradorLogado?"":"none"})}function escaparHtml(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function urlImagem(e){if(!e)return e;if(e.startsWith("https://res.cloudinary.com/")){const t=e.indexOf("/image/upload/");if(t>=0){let a=e.substring(t+"/image/upload/".length);const o=a.split("/");o.length>0&&/^(q_|c_|w_|h_|f_|dpr_|v\d)/.test(o[0])&&o.shift();let r=o.join("/");const n=r.lastIndexOf(".");n>0&&(r=r.substring(0,n));return"/api/imagens/cloudinary/"+r}}return e}function formatarPreco(e){if(null==e||""===e)return"";const t=Number(e);return Number.isFinite(t)?t.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):""}function gerarEstrelas(e,t="normal"){const a=Number(e),o=Number.isFinite(a)?Math.max(0,Math.min(5,a)):0;let n='<span class="estrelas '+t+'" aria-label="'+escaparHtml(o.toFixed(1)+" de 5 estrelas")+'">';for(let e=1;e<=5;e++)n+=e<=Math.round(o)?'<span class="estrela ativa">★</span>':'<span class="estrela">☆</span>';return n+="</span>",n}function gerarEstrelasInteiras(e){const t=Number(e);let a="";for(let e=1;e<=5;e++)a+=e<=t?"★":"☆";return a}function formatarDataRelativa(e){if(!e)return"";const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const a=(new Date).getTime()-t.getTime(),o=Math.floor(a/864e5);if(o<=0)return"Hoje";if(1===o)return"Há 1 dia";if(o<30)return"Há "+o+" dias";const n=Math.floor(o/30);if(1===n)return"Há 1 mês";if(n<12)return"Há "+n+" meses";const r=Math.floor(n/12);return 1===r?"Há 1 ano":"Há "+r+" anos"}function criarBotaoEstrela(e,t){const a=document.createElement("button");return a.type="button",a.className="estrela-input"+(t?" selecionada":""),a.dataset.nota=e,a.setAttribute("aria-label",e+(1===e?" estrela":" estrelas")),a.textContent="★",a}function getFavoritos(){try{return JSON.parse(localStorage.getItem("cortez_favoritos")||"[]")}catch(e){return[]}}function toggleFavorito(e){let t=getFavoritos();e=Number(e),t.includes(e)?t=t.filter(t=>t!==e):t.push(e),localStorage.setItem("cortez_favoritos",JSON.stringify(t)),atualizarBotoesFavorito()}function isFavorito(e){return getFavoritos().includes(Number(e))}function atualizarBotoesFavorito(){document.querySelectorAll(".fav-btn, .rel-fav, .pp-fav").forEach(e=>{const t=Number(e.dataset.produtoId||e.closest("[data-id]")?.dataset.id||produtoAtual?.id);if(!t)return;const a=isFavorito(t);e.classList.toggle("favoritado",a),e.textContent=a?"♥":"♡",e.setAttribute("aria-pressed",a?"true":"false")})}function normalizarProduto(e){if(!e)return e;const t=Array.isArray(e.imagens)?e.imagens:[],r=t.filter(e=>!e.cor_id).sort((e,t)=>Number(e.ordem||0)-Number(t.ordem||0)),a=(Array.isArray(e.cores)?e.cores:[]).map((e,a)=>{const n=t.filter(t=>Number(t.cor_id)===Number(e.id)).sort((e,t)=>Number(e.ordem||0)-Number(t.ordem||0));const o=0===a&&0===n.length?r:n;return{...e,imagens:o}});return{...e,cores:a}}async function carregarProdutos(){const e=document.getElementById("grid-produtos");try{produtos=await api("/api/produtos"),produtos=Array.isArray(produtos)?produtos.map(normalizarProduto):[],renderGrade()}catch(t){if(console.error("Erro ao carregar produtos:",t),e){e.innerHTML="";const t=document.createElement("p");t.className="produtos-estado",t.textContent="Não foi possível carregar os produtos.",e.appendChild(t)}}}async function carregarCategorias(){const e=document.getElementById("filtro-categorias");if(e)try{categorias=await api("/api/categorias"),Array.isArray(categorias)||(categorias=[]),e.innerHTML="";const t=document.createElement("button");t.type="button",t.className="filtro-btn ativo",t.textContent="Todos",t.dataset.categoria="",t.addEventListener("click",()=>{filtrarCategoria(null,t)}),e.appendChild(t),categorias.forEach(t=>{const a=document.createElement("button");a.type="button",a.className="filtro-btn",a.textContent=t.nome||"",a.dataset.categoria=t.id,a.addEventListener("click",()=>{filtrarCategoria(t.id,a)}),e.appendChild(a)}),renderGrade()}catch(e){console.error("Erro ao carregar categorias:",e)}}function filtrarCategoria(e,t){categoriaFiltro=null===e?null:Number(e),document.querySelectorAll(".filtro-btn").forEach(e=>e.classList.remove("ativo")),t&&t.classList.add("ativo"),renderGrade()}function renderGrade(){const e=document.getElementById("grid-produtos");if(!e)return;e.innerHTML="";let t=Array.isArray(produtos)?produtos:[];if(null!=categoriaFiltro&&(t=t.filter(e=>Number(e.categoria_id)===Number(categoriaFiltro))),0===t.length){const t=document.createElement("p");return t.className="produtos-estado",t.textContent="Nenhum produto encontrado.",void e.appendChild(t)}t.forEach(t=>criarCardProduto(t,e)),atualizarBotoesFavorito()}function criarCardProduto(e,t){const a=document.createElement("article");a.className="produto-card",a.dataset.id=e.id;const o=document.createElement("div");o.className="produto-imagem-area";const n=document.createElement("button");if(n.type="button",n.className="fav-btn"+(isFavorito(e.id)?" favoritado":""),n.dataset.produtoId=e.id,n.setAttribute("aria-label","Adicionar aos favoritos"),n.setAttribute("aria-pressed",isFavorito(e.id)?"true":"false"),n.textContent=isFavorito(e.id)?"♥":"♡",n.addEventListener("click",t=>{t.stopPropagation(),toggleFavorito(e.id)}),o.appendChild(n),e.imagem_principal){const t=document.createElement("img");t.src=urlImagem(e.imagem_principal),t.alt=e.titulo||"Produto",t.loading="lazy",t.addEventListener("error",()=>{t.remove();const e=document.createElement("div");e.className="produto-imagem-placeholder",e.textContent="🪑",o.appendChild(e)}),o.appendChild(t)}else{const e=document.createElement("div");e.className="produto-imagem-placeholder",e.textContent="🪑",o.appendChild(e)}a.appendChild(o);const r=document.createElement("div");r.className="produto-info";const c=document.createElement("div");c.className="produto-categoria",c.textContent=e.linha||"",r.appendChild(c);const d=document.createElement("div");if(d.className="produto-nome",d.textContent=e.titulo||"",r.appendChild(d),null!==e.preco&&void 0!==e.preco&&""!==e.preco){const t=document.createElement("div");if(t.className="produto-preco",t.textContent=formatarPreco(e.preco),r.appendChild(t),e.parcelamento){const t=document.createElement("div");t.className="produto-parcelas",t.textContent=e.parcelamento,r.appendChild(t)}}const i=document.createElement("button");i.type="button",i.className="btn-produto",i.textContent="Ver detalhes",i.addEventListener("click",t=>{t.stopPropagation(),abrirProduto(e.id)}),r.appendChild(i),a.appendChild(r),a.addEventListener("click",()=>abrirProduto(e.id)),t.appendChild(a)}function voltarParaProduto(){if(!produtoAtual)return;const e=new URLSearchParams;e.set("produto",produtoAtual.id),modoAdminSite&&e.set("modo","admin"),history.pushState({},"","?"+e.toString()),renderProduto(),window.scrollTo({top:0,behavior:"smooth"})}
async function abrirProduto(e,t=!0){try{const a=await api("/api/produtos/"+e);produtoAtual=normalizarProduto(a),corAtual=0,imgAtual=0;const o=document.getElementById("view-home"),n=document.getElementById("view-produto");o&&(o.style.display="none"),n&&(n.style.display="block"),atualizarModoAdministrador();const params=new URLSearchParams(window.location.search),paginaAtual=params.get("pagina"),mesmoProduto=String(params.get("produto")||"")===String(e),pagina=mesmoProduto?paginaAtual:null;if("perguntas"===pagina?renderPaginaPerguntas():"avaliacoes"===pagina?renderPaginaAvaliacoes():renderProduto(),atualizarModoAdministrador(),t){let e="?produto="+encodeURIComponent(produtoAtual.id);modoAdminSite&&(e+="&modo=admin"),pagina?e+="&pagina="+encodeURIComponent(pagina):0,history.pushState({},"",e)}window.scrollTo({top:0,behavior:"auto"})}catch(e){console.error("Erro ao abrir produto:",e),alert(e.message||"Não foi possível carregar o produto.")}}function criarIconeSeta3D(direcao){
    const rotacao={esquerda:"180",direita:"0",cima:"-90",baixo:"90"}[direcao]??"0";
    const span=document.createElement("span");
    span.className="seta-3d";
    span.setAttribute("aria-hidden","true");
    span.innerHTML='<svg class="seta-3d-svg" viewBox="0 0 28 28" focusable="false" style="--seta-rotacao:'+rotacao+'deg"><path class="seta-3d-sombra" d="M4 12h11.4L11 7.6 14.8 4 25 14 14.8 24 11 20.4l4.4-4.4H4z"></path><path class="seta-3d-face" d="M3 10h11.4L10 5.6 13.8 2 24 12 13.8 22 10 18.4l4.4-4.4H3z"></path><path class="seta-3d-brilho" d="M5 10h9.8l-2.2-2.2" /></svg>';
    return span;
}
function abrirAbaPerguntas(){if(!produtoAtual)return;const e=new URLSearchParams;e.set("produto",produtoAtual.id),modoAdminSite&&e.set("modo","admin"),e.set("pagina","perguntas"),history.pushState({},"","?"+e.toString()),renderPaginaPerguntas(),window.scrollTo({top:0,behavior:"smooth"})}function abrirAbaAvaliacoes(){if(!produtoAtual)return;const e=new URLSearchParams;e.set("produto",produtoAtual.id),modoAdminSite&&e.set("modo","admin"),e.set("pagina","avaliacoes"),history.pushState({},"","?"+e.toString()),renderPaginaAvaliacoes(),window.scrollTo({top:0,behavior:"smooth"})}function abrirModalInteracoes(e){"perguntas"===e?abrirAbaPerguntas():abrirAbaAvaliacoes()}
function voltarCatalogo(){modoAdminSite=!1;produtoAtual=null;const home=document.getElementById("view-home"),produto=document.getElementById("view-produto");if(produto)produto.style.display="none";if(home)home.style.display="block";history.pushState({},"",window.location.pathname);window.scrollTo({top:0,behavior:"smooth"});setTimeout(()=>{const alvo=document.getElementById("produtos");alvo&&alvo.scrollIntoView({behavior:"smooth",block:"start"})},80)}
function renderProduto(){
    const produto=produtoAtual;
    const layout=document.getElementById("produto-layout");
    if(!layout||!produto)return;
    layout.innerHTML="";
    const voltarTopoProduto=document.getElementById("btn-voltar-catalogo");
    if(voltarTopoProduto){
    voltarTopoProduto.classList.remove("oculto-qa");
    voltarTopoProduto.style.display="inline-flex";
    voltarTopoProduto.innerHTML="";
    voltarTopoProduto.appendChild(criarIconeSeta3D("esquerda"));
    voltarTopoProduto.appendChild(document.createTextNode("Voltar para produtos"));
}

    const imagensCor=obterImagensDaCor(produto,corAtual);
    const imagens=imagensCor.length?imagensCor:(Array.isArray(produto.imagens)?produto.imagens:[]);
    if(imgAtual>=imagens.length)imgAtual=0;

    const grid=document.createElement("div");
    grid.className="pp-detalhe-grid";

    const galeria=document.createElement("div");
    galeria.className="pp-galeria";

    const thumbs=document.createElement("div");
    thumbs.className="pp-miniaturas";
    thumbs.id="pp-miniaturas";

    imagens.forEach((item,index)=>{
        const b=document.createElement("button");
        b.type="button";
        b.className="pp-miniatura"+(index===imgAtual?" selecionada":"");
        b.setAttribute("aria-label","Ver imagem "+(index+1));
        const img=document.createElement("img");
        img.src=urlImagem(item.caminho);
        img.alt=(produto.titulo||"Produto")+" - imagem "+(index+1);
        img.loading=index===0?"eager":"lazy";
        b.appendChild(img);
        b.addEventListener("click",()=>{
            imgAtual=index;
            atualizarImagemPrincipal();
        });
        thumbs.appendChild(b);
    });

    const palco=document.createElement("div");
    palco.className="pp-imagem-area";

    const contador=document.createElement("span");
    contador.className="pp-contador";
    contador.id="pp-contador";
    contador.textContent=imagens.length?((imgAtual+1)+" / "+imagens.length):"1 / 1";
    palco.appendChild(contador);

    const imgPrincipal=document.createElement("img");
    imgPrincipal.id="pp-img";
    imgPrincipal.className="pp-imagem-principal";
    imgPrincipal.alt=produto.titulo||"Produto";
    if(imagens.length)imgPrincipal.src=urlImagem(imagens[imgAtual].caminho);
    imgPrincipal.addEventListener("error",()=>{
        imgPrincipal.style.display="none";
        const ph=document.createElement("div");
        ph.className="produto-imagem-placeholder";
        ph.textContent="🪑";
        ph.style.fontSize="80px";
        palco.appendChild(ph);
    });
    palco.appendChild(imgPrincipal);

    const favorito=document.createElement("button");
    favorito.type="button";
    favorito.className="pp-fav"+(isFavorito(produto.id)?" favoritado":"");
    favorito.dataset.produtoId=produto.id;
    favorito.textContent=isFavorito(produto.id)?"♥":"♡";
    favorito.setAttribute("aria-label","Adicionar aos favoritos");
    favorito.addEventListener("click",event=>{event.stopPropagation();toggleFavorito(produto.id)});
    palco.appendChild(favorito);

    const compartilhar=document.createElement("button");
    compartilhar.type="button";
    compartilhar.className="pp-compartilhar";
    compartilhar.innerHTML='<svg class="pp-compartilhar-icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="2.35"></circle><circle cx="6" cy="12" r="2.35"></circle><circle cx="18" cy="19" r="2.35"></circle><path d="M8.05 10.95 15.95 6.05"></path><path d="M8.05 13.05 15.95 17.95"></path></svg>';
    compartilhar.setAttribute("aria-label","Compartilhar produto");
    compartilhar.addEventListener("click",event=>{event.stopPropagation();compartilharProduto()});
    palco.appendChild(compartilhar);

    if(imagens.length>1){
        const ant=document.createElement("button");
        ant.type="button";
        ant.className="pp-seta esq";
        ant.innerHTML=""; ant.appendChild(criarIconeSeta3D("esquerda"));
        ant.addEventListener("click",event=>{event.stopPropagation();mudarImagem(-1)});

        const prox=document.createElement("button");
        prox.type="button";
        prox.className="pp-seta dir";
        prox.innerHTML=""; prox.appendChild(criarIconeSeta3D("direita"));
        prox.addEventListener("click",event=>{event.stopPropagation();mudarImagem(1)});

        palco.appendChild(ant);
        palco.appendChild(prox);
    }

    galeria.appendChild(thumbs);
    galeria.appendChild(palco);
    grid.appendChild(galeria);

    const info=document.createElement("div");
    info.className="pp-info-coluna";

    const categoria=document.createElement("div");
    categoria.className="pp-categoria";
    categoria.textContent=produto.linha||produto.categoria_nome||"";
    info.appendChild(categoria);

    const titulo=document.createElement("h1");
    titulo.className="pp-titulo";
    titulo.textContent=produto.titulo||"";
    info.appendChild(titulo);

    const resumo=produto.avaliacao_resumo||{media:0,total:0};
    const media=Number(resumo.media||0);
    const total=Number(resumo.total||0);
    const avLink=document.createElement("button");
    avLink.type="button";
    avLink.className="pp-avaliacao-link";
    avLink.appendChild(Object.assign(document.createElement("span"),{innerHTML:gerarEstrelas(media,"normal")}));
    const nota=document.createElement("span");
    nota.textContent=total?media.toFixed(1):"Sem avaliações";
    const qtd=document.createElement("span");
    qtd.className="pp-avaliacao-qtd";
    qtd.textContent=total?"("+total+(total===1?" avaliação":" avaliações")+")":"";
    avLink.appendChild(nota);
    avLink.appendChild(qtd);
    avLink.addEventListener("click",abrirAbaAvaliacoes);
    info.appendChild(avLink);

    if(Array.isArray(produto.cores)&&produto.cores.length){
        const corLinha=document.createElement("div");
        corLinha.className="pp-cor-linha";
        corLinha.id="pp-cor";
        corLinha.textContent="Cor e acabamento: "+obterNomeCorAtual();
        info.appendChild(corLinha);

        const cores=document.createElement("div");
        cores.className="pp-cores";
        produto.cores.forEach((cor,index)=>{
            const item=document.createElement("button");
            item.type="button";
            item.className="pp-cor-item"+(index===corAtual?" selecionada":"");
            const thumb=document.createElement("span");
            thumb.className="pp-cor-thumb";
            const corImagens=obterImagensDaCor(produto,index);
            if(corImagens.length){
                const img=document.createElement("img");
                img.src=urlImagem((corImagens.find(i=>i.principal)||corImagens[0]).caminho);
                img.alt=cor.nome||"Cor";
                img.loading="lazy";
                thumb.appendChild(img);
            }
            const nome=document.createElement("span");
            nome.className="pp-cor-nome";
            nome.textContent=cor.nome||"";
            item.appendChild(thumb);
            item.appendChild(nome);
            item.addEventListener("click",()=>mudarCor(index));
            cores.appendChild(item);
        });
        info.appendChild(cores);
    }

    const saber=document.createElement("div");
    saber.className="pp-resumo-descricao";
    const saberH=document.createElement("h2");
    saberH.textContent="O que você precisa saber";
    saber.appendChild(saberH);
    const descricao=(produto.descricao||"").trim();
    if(descricao){
        descricao.split(/\n+|[•]+/).map(v=>v.trim()).filter(Boolean).slice(0,6).forEach(txt=>{
            const p=document.createElement("p");
            p.className="pp-resumo-item";
            p.innerHTML="<span>•</span>"+escaparHtml(txt);
            saber.appendChild(p);
        });
    }else{
        const p=document.createElement("p");
        p.className="pp-resumo-item";
        p.innerHTML="<span>•</span>"+escaparHtml(obterDescricaoCorAtual());
        saber.appendChild(p);
    }
    info.appendChild(saber);
    grid.appendChild(info);

    const compra=document.createElement("aside");
    compra.className="pp-compra-card";

    const compraTitulo=document.createElement("h2");
    compraTitulo.textContent="Solicite seu orçamento";
    compra.appendChild(compraTitulo);

    if(produto.preco!==null&&produto.preco!==undefined&&produto.preco!==""){
        const preco=document.createElement("div");
        preco.className="pp-preco";
        preco.textContent=formatarPreco(produto.preco);
        compra.appendChild(preco);
    }

    if(produto.parcelamento){
        const parc=document.createElement("div");
        parc.className="pp-parcelamento";
        parc.textContent=produto.parcelamento;
        compra.appendChild(parc);
    }

    const garantia=document.createElement("div");
    garantia.className="pp-compra-destaque";
    garantia.innerHTML='<span>✓</span><div><strong>Pedido personalizado</strong><small>Fale com nossa equipe para confirmar medidas, cores e quantidade.</small></div>';
    compra.appendChild(garantia);

    const cart=document.createElement("button");
    cart.type="button";
    cart.className="btn-carrinho-produto";
    cart.textContent="Adicionar ao carrinho";
    cart.addEventListener("click",adicionarAoCarrinho);
    compra.appendChild(cart);
    atualizarBotaoCarrinhoProduto();

    const quote=document.createElement("button");
    quote.type="button";
    quote.className="btn-solicitar pp-btn-orcamento";
    quote.textContent="SOLICITAR ORÇAMENTO";
    quote.addEventListener("click",abrirModalOrcamento);
    compra.appendChild(quote);

    const note=document.createElement("p");
    note.className="pp-compra-nota";
    note.textContent="Você pode adicionar o produto ao carrinho ou solicitar um orçamento personalizado.";
    compra.appendChild(note);

    grid.appendChild(compra);
    layout.appendChild(grid);

    const caracteristicas=document.createElement("section");
    caracteristicas.className="pp-bloco pp-caracteristicas";
    const ch=document.createElement("h2");
    ch.textContent="Características do produto";
    caracteristicas.appendChild(ch);

    const sub1=document.createElement("div");
    sub1.className="carac-sub";
    sub1.textContent="Características Principais";
    caracteristicas.appendChild(sub1);
    const dados=produto.caracteristicas||{};
    const tab=document.createElement("table");
    tab.className="carac-tabela";
    adicionarLinhaTabela(tab,"Modelo",dados.modelo||"—");
    adicionarLinhaTabela(tab,"Cor",obterNomeCorAtual());
    caracteristicas.appendChild(tab);

    const sub2=document.createElement("div");
    sub2.className="carac-sub";
    sub2.textContent="Dimensões";
    caracteristicas.appendChild(sub2);
    const tab2=document.createElement("table");
    tab2.className="carac-tabela";
    adicionarLinhaTabela(tab2,"Largura x Comprimento",dados.largura&&dados.comprimento?dados.largura+" x "+dados.comprimento:"—");
    adicionarLinhaTabela(tab2,"Altura",obterAlturaAtual());
    caracteristicas.appendChild(tab2);

    const sub3=document.createElement("div");
    sub3.className="carac-sub";
    sub3.textContent="Outras características";
    caracteristicas.appendChild(sub3);
    const tab3=document.createElement("table");
    tab3.className="carac-tabela";
    adicionarLinhaTabela(tab3,"Outros",dados.outros||"—");
    adicionarLinhaTabela(tab3,"Quantidade de assentos",dados.quantidade_assentos||"—");
    adicionarLinhaTabela(tab3,"Compartimento para livros",dados.compartimento_livros||"—");
    caracteristicas.appendChild(tab3);

    const sub4=document.createElement("div");
    sub4.className="carac-sub";
    sub4.textContent="Descrição";
    caracteristicas.appendChild(sub4);
    const desc=document.createElement("p");
    desc.id="descricao-cor-atual";
    desc.className="descricao-produto-texto";
    desc.textContent=obterDescricaoCorAtual();
    caracteristicas.appendChild(desc);

    layout.appendChild(caracteristicas);

    const perguntasBox=document.createElement("section");
    perguntasBox.className="pp-bloco pp-interacao-resumo";
    const qhead=document.createElement("div");
    qhead.className="pp-interacao-head";
    const qh=document.createElement("h2");
    qh.textContent="Perguntas e Respostas";
    const qbtn=document.createElement("button");
    qbtn.type="button";
    qbtn.className="btn-ver-perguntas";
    qbtn.textContent="Ver todas as perguntas";
    qbtn.addEventListener("click",abrirAbaPerguntas);
    qhead.appendChild(qh);
    qhead.appendChild(qbtn);
    perguntasBox.appendChild(qhead);

    const qform=document.createElement("div");
    qform.className="formulario-pergunta";
    const qinput=document.createElement("input");
    qinput.type="text";
    qinput.className="pergunta-input";
    qinput.placeholder="Digite sua pergunta sobre este produto...";
    const qsend=document.createElement("button");
    qsend.type="button";
    qsend.className="btn-perguntar";
    qsend.textContent="Enviar";
    qform.appendChild(qinput);
    qform.appendChild(qsend);
    perguntasBox.appendChild(qform);
    qsend.addEventListener("click",()=>enviarPergunta(qinput,qsend));
    qinput.addEventListener("keydown",event=>{
        if(event.key==="Enter"){event.preventDefault();enviarPergunta(qinput,qsend)}
    });

    const qlist=document.createElement("div");
    qlist.className="lista-perguntas";
    perguntasBox.appendChild(qlist);
    renderPerguntas((produto.perguntas||[]).slice(0,2),qlist);
    aplicarPreviewTerceiro(qlist,(produto.perguntas||[]).length,abrirAbaPerguntas);
    layout.appendChild(perguntasBox);

    const avalBox=document.createElement("section");
    avalBox.className="pp-bloco pp-interacao-resumo";
    const ahead=document.createElement("div");
    ahead.className="pp-interacao-head";
    const ah=document.createElement("h2");
    ah.textContent="Avaliações";
    const abtn=document.createElement("button");
    abtn.type="button";
    abtn.className="btn-avaliar";
    abtn.textContent="Ver avaliações";
    abtn.addEventListener("click",abrirAbaAvaliacoes);
    ahead.appendChild(ah);
    ahead.appendChild(abtn);
    avalBox.appendChild(ahead);

    const avalResumo=document.createElement("div");
    avalResumo.className="avaliacao-resumo-produto";
    if(total){
        avalResumo.innerHTML=gerarEstrelas(media,"normal");
        const mt=document.createElement("strong");
        mt.textContent=media.toFixed(1);
        const tt=document.createElement("span");
        tt.textContent=total===1?"1 avaliação":total+" avaliações";
        avalResumo.appendChild(mt);
        avalResumo.appendChild(tt);
    }else{
        avalResumo.textContent="Ainda não há avaliações.";
    }
    avalBox.appendChild(avalResumo);

    const avalListTitle=document.createElement("div");
    avalListTitle.className="pp-preview-list-title";
    avalListTitle.textContent="Últimas avaliações";
    avalBox.appendChild(avalListTitle);

    const avalList=document.createElement("div");
    avalList.className="lista-avaliacoes pp-preview-reviews";
    avalBox.appendChild(avalList);
    renderAvaliacoes((produto.avaliacoes||[]).slice(0,2),avalList);
    aplicarPreviewTerceiro(avalList,(produto.avaliacoes||[]).length,abrirAbaAvaliacoes);

    layout.appendChild(avalBox);

    atualizarBotoesFavorito();
    atualizarDescricaoCorNaTela();
    atualizarModoAdministrador();
}function renderPaginaPerguntas(){const voltarCatalogo=document.getElementById("btn-voltar-catalogo");if(voltarCatalogo)voltarCatalogo.classList.add("oculto-qa");
    const produto=produtoAtual;
    const layout=document.getElementById("produto-layout");
    if(!layout||!produto)return;
    layout.innerHTML="";
    const page=document.createElement("section");
    page.className="pagina-interacoes premium-qa-page";

    const top=document.createElement("div");
    top.className="interacoes-page-top";
    const back=document.createElement("button");
    back.type="button";
    back.className="interacoes-voltar";
    back.innerHTML="";
    back.appendChild(criarIconeSeta3D("esquerda"));
    back.insertAdjacentHTML("beforeend",'<span>Voltar ao produto</span>');
    back.addEventListener("click",voltarParaProduto);
    top.appendChild(back);
    const kicker=document.createElement("span");
    kicker.className="interacoes-kicker";
    kicker.textContent="PERGUNTAS E RESPOSTAS";
    top.appendChild(kicker);
    page.appendChild(top);

    const title=document.createElement("h1");
    title.className="interacoes-page-title";
    title.textContent="Perguntas e Respostas";
    page.appendChild(title);

    const sub=document.createElement("p");
    sub.className="interacoes-page-subtitle";
    sub.textContent=produto.titulo||"Produto";
    page.appendChild(sub);

    const composer=document.createElement("div");
    composer.className="qa-composer";
    const input=document.createElement("input");
    input.type="text";
    input.className="pergunta-input";
    input.placeholder="Digite sua pergunta sobre este produto...";
    const send=document.createElement("button");
    send.type="button";
    send.className="btn-perguntar";
    send.textContent="Perguntar";
    composer.appendChild(input);
    composer.appendChild(send);
    send.addEventListener("click",()=>enviarPergunta(input,send));
    input.addEventListener("keydown",event=>{
        if(event.key==="Enter"){event.preventDefault();enviarPergunta(input,send)}
    });
    page.appendChild(composer);

    const hint=document.createElement("p");
    hint.className="qa-hint";
    hint.textContent="A Cortez Móveis responde as perguntas diretamente nesta página.";
    page.appendChild(hint);

    const listTitle=document.createElement("h2");
    listTitle.className="qa-list-title";
    listTitle.textContent="Dúvidas dos clientes";
    page.appendChild(listTitle);

    const list=document.createElement("div");
    list.id="lista-perguntas";
    list.className="lista-perguntas qa-lista";
    renderPerguntas(produto.perguntas||[],list);
    page.appendChild(list);

    layout.appendChild(page);
    atualizarModoAdministrador();
}function renderPaginaAvaliacoes(){const voltarCatalogo=document.getElementById("btn-voltar-catalogo");if(voltarCatalogo)voltarCatalogo.classList.add("oculto-qa");
    const produto=produtoAtual;
    const layout=document.getElementById("produto-layout");
    if(!layout||!produto)return;
    layout.innerHTML="";

    const page=document.createElement("section");
    page.className="pagina-interacoes premium-reviews-page";

    const top=document.createElement("div");
    top.className="interacoes-page-top";
    const back=document.createElement("button");
    back.type="button";
    back.className="interacoes-voltar";
    back.innerHTML="";
    back.appendChild(criarIconeSeta3D("esquerda"));
    back.insertAdjacentHTML("beforeend",'<span>Voltar ao produto</span>');
    back.addEventListener("click",voltarParaProduto);
    top.appendChild(back);
    const kicker=document.createElement("span");
    kicker.className="interacoes-kicker";
    kicker.textContent="AVALIAÇÕES DOS CLIENTES";
    top.appendChild(kicker);
    page.appendChild(top);

    const title=document.createElement("h1");
    title.className="interacoes-page-title";
    title.textContent="Avaliações do produto";
    page.appendChild(title);

    const sub=document.createElement("p");
    sub.className="interacoes-page-subtitle";
    sub.textContent=produto.titulo||"Produto";
    page.appendChild(sub);

    const resumo=produto.avaliacao_resumo||{media:0,total:0,distribuicao:{1:0,2:0,3:0,4:0,5:0}};
    const total=Number(resumo.total||0);
    const media=Number(resumo.media||0);

    const summary=document.createElement("div");
    summary.className="reviews-summary-premium";

    const score=document.createElement("div");
    score.className="reviews-summary-score";
    const scoreNumber=document.createElement("strong");
    scoreNumber.textContent=total?media.toFixed(1):"0,0";
    const scoreStars=document.createElement("div");
    scoreStars.innerHTML=gerarEstrelas(media,"grande");
    const scoreTotal=document.createElement("span");
    scoreTotal.textContent=total?(total===1?"1 avaliação":" "+total+" avaliações"):"Sem avaliações ainda";
    score.appendChild(scoreNumber);
    score.appendChild(scoreStars);
    score.appendChild(scoreTotal);

    const distribution=document.createElement("div");
    distribution.className="reviews-summary-distribution";
    for(let n=5;n>=1;n--){
        const qty=Number(resumo.distribuicao?.[n]||0);
        const row=document.createElement("div");
        row.className="review-dist-row";
        const label=document.createElement("span");
        label.textContent=n+" ★";
        const bar=document.createElement("span");
        bar.className="review-dist-bar";
        const fill=document.createElement("span");
        fill.style.width=(total?(qty/total*100):0)+"%";
        bar.appendChild(fill);
        const count=document.createElement("b");
        count.textContent=qty;
        row.appendChild(label);
        row.appendChild(bar);
        row.appendChild(count);
        distribution.appendChild(row);
    }
    summary.appendChild(score);
    summary.appendChild(distribution);
    page.appendChild(summary);

    const composer=document.createElement("div");
    composer.className="review-composer";
    const ch=document.createElement("h2");
    ch.textContent="Avalie este produto";
    composer.appendChild(ch);

    const nome=document.createElement("input");
    nome.type="text";
    nome.className="avaliacao-nome";
    nome.placeholder="Seu nome";
    composer.appendChild(nome);

    let corSelect=null;
    if(Array.isArray(produto.cores)&&produto.cores.length){
        const corWrap=document.createElement("div");
        corWrap.className="avaliacao-cor-field";
        const corLabel=document.createElement("label");
        corLabel.className="avaliacao-field-label";
        corLabel.textContent="Qual cor você deseja avaliar?";
        corSelect=document.createElement("select");
        corSelect.className="avaliacao-cor-select";
        const primeiro=document.createElement("option");
        primeiro.value="";
        primeiro.textContent="Selecione uma cor";
        corSelect.appendChild(primeiro);
        produto.cores.forEach(cor=>{
            const option=document.createElement("option");
            option.value=cor.id;
            option.textContent=cor.nome||"Cor";
            corSelect.appendChild(option);
        });
        corWrap.appendChild(corLabel);
        corWrap.appendChild(corSelect);
        composer.appendChild(corWrap);
    }

    const starLabel=document.createElement("div");
    starLabel.className="avaliacao-estrelas-label";
    starLabel.textContent="Sua nota";
    composer.appendChild(starLabel);

    const starsInput=document.createElement("div");
    starsInput.className="avaliacao-estrelas-input";
    let notaEscolhida=0;
    const notaTexto=document.createElement("span");
    notaTexto.className="avaliacao-nota-texto";
    notaTexto.textContent="Selecione de 1 a 5 estrelas";

    for(let n=1;n<=5;n++){
        const b=criarBotaoEstrela(n,false);
        b.addEventListener("click",()=>{
            notaEscolhida=n;
            starsInput.querySelectorAll(".estrela-input").forEach(item=>{
                item.classList.toggle("selecionada",Number(item.dataset.nota)<=n);
            });
            notaTexto.textContent=n+(n===1?" estrela selecionada":" estrelas selecionadas");
        });
        starsInput.appendChild(b);
    }
    composer.appendChild(starsInput);
    composer.appendChild(notaTexto);

    const comentario=document.createElement("textarea");
    comentario.className="avaliacao-comentario";
    comentario.rows=5;
    comentario.placeholder="Conte o que achou do produto.";
    composer.appendChild(comentario);

    const fotoWrap=document.createElement("div");
    fotoWrap.className="avaliacao-foto-upload";

    const fotoLabel=document.createElement("label");
    fotoLabel.className="avaliacao-foto-dropzone";
    const fotoIcon=document.createElement("span");
    fotoIcon.className="avaliacao-foto-icone";
    fotoIcon.textContent="＋";

    const fotoCopy=document.createElement("span");
    fotoCopy.className="avaliacao-foto-copy";
    const fotoStrong=document.createElement("strong");
    fotoStrong.textContent="Adicionar fotos e vídeos";
    const fotoSmall=document.createElement("small");
    fotoSmall.textContent="Mostre o produto, a cor e sua experiência";
    fotoCopy.appendChild(fotoStrong);
    fotoCopy.appendChild(fotoSmall);

    const fotoAction=document.createElement("span");
    fotoAction.className="avaliacao-foto-action";
    fotoAction.textContent="Selecionar";

    const foto=document.createElement("input");
    foto.type="file";
    foto.className="avaliacao-foto";
    foto.accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime";
    foto.multiple=true;
    foto.hidden=true;

    fotoLabel.appendChild(fotoIcon);
    fotoLabel.appendChild(fotoCopy);
    fotoLabel.appendChild(fotoAction);
    fotoLabel.appendChild(foto);
    fotoWrap.appendChild(fotoLabel);

    const fotoHint=document.createElement("div");
    fotoHint.className="avaliacao-foto-hint";
    fotoHint.textContent="PNG, JPG, WebP, MP4, WebM ou MOV • até 6 mídias";
    fotoWrap.appendChild(fotoHint);

    const fotoPreview=document.createElement("div");
    fotoPreview.className="avaliacao-foto-preview premium-foto-preview";
    fotoWrap.appendChild(fotoPreview);
    composer.appendChild(fotoWrap);

    function mostrarFotos(files){
        fotoPreview.innerHTML="";
        Array.from(files||[]).slice(0,6).forEach(file=>{
            if(!file.type.startsWith("image/")&&!file.type.startsWith("video/")) return;
            const card=document.createElement("div");
            card.className="avaliacao-foto-thumb avaliacao-midia-thumb";
            if(file.type.startsWith("video/")){
                const video=document.createElement("video");
                video.muted=true;
                video.playsInline=true;
                video.preload="metadata";
                video.src=URL.createObjectURL(file);
                const mediaBtn=document.createElement("button");
                mediaBtn.type="button";
                mediaBtn.className="avaliacao-video-btn avaliacao-video-preview-btn";
                mediaBtn.setAttribute("aria-label","Abrir prévia do vídeo");
                mediaBtn.appendChild(video);
                const play=document.createElement("span");
                play.className="avaliacao-video-play";
                play.innerHTML="▶";
                mediaBtn.appendChild(play);
                mediaBtn.addEventListener("click",event=>{
                    event.preventDefault();
                    event.stopPropagation();
                    abrirVideoAvaliacao(video.currentSrc||video.src);
                });
                card.appendChild(mediaBtn);
            }else{
                const image=document.createElement("img");
                image.alt="Pré-visualização da foto";
                const reader=new FileReader();
                reader.onload=event=>{image.src=event.target.result};
                reader.readAsDataURL(file);
                card.appendChild(image);
            }
            fotoPreview.appendChild(card);
        });
        const count=fotoPreview.children.length;
        fotoStrong.textContent=count?count+" mídia(s) selecionada(s)":"Adicionar fotos e vídeos";
        fotoLabel.classList.toggle("com-arquivos",count>0);
    }

    foto.addEventListener("change",()=>mostrarFotos(foto.files));

    fotoLabel.addEventListener("dragover",event=>{
        event.preventDefault();
        fotoLabel.classList.add("arrastando");
    });
    fotoLabel.addEventListener("dragleave",()=>fotoLabel.classList.remove("arrastando"));
    fotoLabel.addEventListener("drop",event=>{
        event.preventDefault();
        fotoLabel.classList.remove("arrastando");
        const files=Array.from(event.dataTransfer.files||[])
            .filter(file=>file.type.startsWith("image/")||file.type.startsWith("video/"))
            .slice(0,6);
        if(!files.length) return;
        const transfer=new DataTransfer();
        files.forEach(file=>transfer.items.add(file));
        foto.files=transfer.files;
        mostrarFotos(foto.files);
    });

    const enviar=document.createElement("button");
    enviar.type="button";
    enviar.className="btn-avaliar";
    enviar.textContent="Enviar avaliação";
    composer.appendChild(enviar);
    enviar.addEventListener("click",()=>enviarAvaliacao(nome,notaEscolhida,comentario,foto,enviar));
    page.appendChild(composer);

    const listTitle=document.createElement("h2");
    listTitle.className="reviews-list-title";
    listTitle.textContent="Avaliações dos clientes";
    page.appendChild(listTitle);

    const list=document.createElement("div");
    list.id="lista-avaliacoes";
    list.className="lista-avaliacoes reviews-lista";
    renderAvaliacoes(produto.avaliacoes||[],list);
    page.appendChild(list);

    layout.appendChild(page);
    atualizarModoAdministrador();
}
function aplicarPreviewTerceiro(container,total,abrirTodos){
    if(!container || Number(total)<=2 || !container.children[1]) return;

    container.classList.add("premium-preview-has-more");
    let curtain=container.querySelector(":scope > .premium-preview-curtain");
    if(!curtain){
        curtain=document.createElement("button");
        curtain.type="button";
        curtain.className="premium-preview-curtain";
        curtain.setAttribute("aria-label","Ver todas as interações");

        const label=document.createElement("span");
        label.className="premium-preview-curtain-label";
        label.textContent="Ver mais";
        curtain.appendChild(label);

        container.appendChild(curtain);
    }

    const segundo=container.children[1];
    const alinharCurtain=()=>{
        if(!segundo || !curtain)return;
        const containerRect=container.getBoundingClientRect();
        const segundoRect=segundo.getBoundingClientRect();
        const inicio=segundoRect.top-containerRect.top+(segundoRect.height*0.5);
        const fim=container.scrollHeight;
        curtain.style.top=Math.max(0,inicio)+"px";
        curtain.style.height=Math.max(40,fim-inicio)+"px";
    };

    requestAnimationFrame(alinharCurtain);
    window.setTimeout(alinharCurtain,120);

    if(typeof abrirTodos==="function"){
        curtain.addEventListener("click",abrirTodos);
    }
}
function renderPerguntas(e,t){if(!t)return;t.innerHTML="";if(!Array.isArray(e)||!e.length){const a=document.createElement("div");a.className="sem-conteudo qa-empty";a.textContent="Ainda não há perguntas sobre este produto.";t.appendChild(a);return}e.forEach(e=>{const a=document.createElement("article");a.className="pergunta-card premium-qa-item";const o=document.createElement("div");o.className="pergunta-texto";const n=document.createElement("span");n.className="qa-label";n.textContent="PERGUNTA";const r=document.createElement("p");r.className="qa-question-text";r.textContent=e.pergunta||"";const c=document.createElement("span");c.className="pergunta-autor";c.textContent=(e.nome_cliente||"Cliente")+(e.criado_em?" • "+formatarDataRelativa(e.criado_em):"");o.appendChild(n);o.appendChild(r);o.appendChild(c);a.appendChild(o);if(e.resposta){const t=document.createElement("div");t.className="pergunta-resposta";const o=document.createElement("span");o.className="qa-answer-label";o.textContent="RESPOSTA DA CORTEZ MÓVEIS";const n=document.createElement("p");n.textContent=e.resposta;t.appendChild(o);t.appendChild(n);e.respondida_em&&(t.appendChild(Object.assign(document.createElement("span"),{className:"pergunta-resposta-data",textContent:formatarDataRelativa(e.respondida_em)})));a.appendChild(t)}else if(administradorLogado){const t=document.createElement("div");t.className="pergunta-admin-acoes";const o=document.createElement("button");o.type="button";o.className="btn-responder";o.textContent="Responder";o.addEventListener("click",()=>abrirCampoResposta(e,a));t.appendChild(o);a.appendChild(t)}t.appendChild(a)})}
function abrirCampoResposta(e,t){if(!administradorLogado)return;if(t.querySelector(".campo-resposta"))return;const a=document.createElement("div");a.className="campo-resposta";const o=document.createElement("textarea");o.className="resposta-input";o.placeholder="Digite sua resposta...";o.rows=4;const n=document.createElement("button");n.type="button";n.className="btn-enviar-resposta";n.textContent="Enviar resposta";a.appendChild(o);a.appendChild(n);t.appendChild(a);n.addEventListener("click",async()=>{const a=o.value.trim();if(!a){o.focus();return}const r=n.textContent;n.disabled=!0;n.textContent="Enviando...";try{const t=await api("/api/produtos/"+produtoAtual.id+"/perguntas/"+e.id+"/responder",{method:"PUT",body:JSON.stringify({resposta:a})});if(t&&t.pergunta){Array.isArray(produtoAtual.perguntas)||(produtoAtual.perguntas=[]);const o=produtoAtual.perguntas.findIndex(t=>Number(t.id)===Number(e.id));-1===o?produtoAtual.perguntas.unshift(t.pergunta):produtoAtual.perguntas[o]=t.pergunta}const a=document.getElementById("lista-perguntas");a&&renderPerguntas(produtoAtual.perguntas||[],a)}catch(e){console.error("Erro ao responder pergunta:",e);alert(e.message||"Não foi possível enviar a resposta.")}finally{n.disabled=!1;n.textContent=r}})}
function fecharVideoAvaliacao(){
    const overlay=document.getElementById("video-avaliacao-overlay");
    if(!overlay)return;
    const video=overlay.querySelector("video");
    if(video){video.pause();video.removeAttribute("src");video.load()}
    overlay.classList.remove("aberto");
    setTimeout(()=>overlay.remove(),220);
}

function abrirVideoAvaliacao(src){
    if(!src)return;
    fecharVideoAvaliacao();
    const overlay=document.createElement("div");
    overlay.id="video-avaliacao-overlay";
    overlay.className="video-avaliacao-overlay";
    overlay.setAttribute("role","dialog");
    overlay.setAttribute("aria-modal","true");
    overlay.innerHTML='<div class="video-avaliacao-modal"><button type="button" class="video-avaliacao-fechar" aria-label="Fechar vídeo">×</button><div class="video-avaliacao-kicker">VÍDEO DA AVALIAÇÃO</div><video class="video-avaliacao-player" controls autoplay playsinline></video></div>';
    const video=overlay.querySelector(".video-avaliacao-player");
    video.src=src;
    document.body.appendChild(overlay);
    requestAnimationFrame(()=>overlay.classList.add("aberto"));
    overlay.addEventListener("click",event=>{
        if(event.target===overlay)fecharVideoAvaliacao();
    });
    overlay.querySelector(".video-avaliacao-modal").addEventListener("click",event=>event.stopPropagation());
    overlay.querySelector(".video-avaliacao-fechar").addEventListener("click",fecharVideoAvaliacao);
    const fecharEsc=event=>{if(event.key==="Escape"){document.removeEventListener("keydown",fecharEsc);fecharVideoAvaliacao()}};
    document.addEventListener("keydown",fecharEsc);
    video.addEventListener("ended",()=>{});
    setTimeout(()=>video.play().catch(()=>{}),80);
}

function renderAvaliacoes(e,t){if(!t)return;t.innerHTML="";if(!Array.isArray(e)||!e.length){const a=document.createElement("div");a.className="sem-conteudo reviews-empty";a.textContent="Ainda não há avaliações.";t.appendChild(a);return}e.forEach(e=>{const a=document.createElement("article");a.className="avaliacao-card premium-review-item";const o=document.createElement("div");o.className="avaliacao-card-cabecalho";const n=document.createElement("strong");n.className="avaliacao-cliente";n.textContent=e.cliente||"Cliente";const r=document.createElement("span");r.className="avaliacao-data";r.textContent=e.criado_em?formatarDataRelativa(e.criado_em):"";o.appendChild(n);o.appendChild(r);a.appendChild(o);const c=document.createElement("div");c.className="avaliacao-card-estrelas";c.innerHTML=gerarEstrelas(Number(e.nota),"normal");a.appendChild(c);if(e.cor_nome){const t=document.createElement("div");t.className="avaliacao-cor";t.textContent="Cor: "+e.cor_nome;a.appendChild(t)}if(e.comentario){const t=document.createElement("p");t.className="avaliacao-comentario-exibido";t.textContent=e.comentario;a.appendChild(t)}if(Array.isArray(e.imagens)&&e.imagens.length){const t=document.createElement("div");t.className="avaliacao-galeria";e.imagens.forEach(e=>{if(!e||!e.caminho)return;const o=document.createElement("div");o.className="avaliacao-midia-item";if("video"===e.tipo_midia){const a=document.createElement("button");a.type="button";a.className="avaliacao-video-btn";a.setAttribute("aria-label","Abrir vídeo da avaliação");const n=document.createElement("video");n.src=e.caminho;n.muted=!0;n.playsInline=!0;n.preload="metadata";a.appendChild(n);const r=document.createElement("span");r.className="avaliacao-video-play";r.innerHTML="▶";a.appendChild(r);a.addEventListener("click",event=>{event.preventDefault();abrirVideoAvaliacao(e.caminho)});o.appendChild(a)}else{const t=document.createElement("img");t.src=urlImagem(e.caminho);t.alt="Foto enviada na avaliação";t.loading="lazy";o.appendChild(t)}t.appendChild(o)});a.appendChild(t)}if(e.resposta_vendedor){const t=document.createElement("div");t.className="avaliacao-resposta";const o=document.createElement("span");o.className="qa-answer-label";o.textContent="RESPOSTA DA CORTEZ MÓVEIS";const n=document.createElement("p");n.textContent=e.resposta_vendedor;t.appendChild(o);t.appendChild(n);a.appendChild(t)}else if(administradorLogado){const t=document.createElement("div");t.className="avaliacao-admin-acoes";const o=document.createElement("button");o.type="button";o.className="btn-responder";o.textContent="Responder avaliação";o.addEventListener("click",()=>abrirCampoRespostaAvaliacao(e,a));t.appendChild(o);a.appendChild(t)}t.appendChild(a)})}function abrirCampoRespostaAvaliacao(e,t){if(!administradorLogado)return;if(t.querySelector(".campo-resposta"))return;const a=document.createElement("div");a.className="campo-resposta";const o=document.createElement("textarea");o.className="resposta-input";o.placeholder="Digite a resposta para o cliente...";o.rows=4;const n=document.createElement("button");n.type="button";n.className="btn-enviar-resposta";n.textContent="Enviar resposta";a.appendChild(o);a.appendChild(n);t.appendChild(a);n.addEventListener("click",async()=>{const a=o.value.trim();if(!a){o.focus();return}const r=n.textContent;n.disabled=!0;n.textContent="Enviando...";try{const t=await api("/api/produtos/"+produtoAtual.id+"/avaliacoes/"+e.id+"/responder",{method:"PUT",body:JSON.stringify({resposta:a})});if(t&&t.avaliacao){Array.isArray(produtoAtual.avaliacoes)||(produtoAtual.avaliacoes=[]);const o=produtoAtual.avaliacoes.findIndex(t=>Number(t.id)===Number(e.id));-1===o?produtoAtual.avaliacoes.unshift(t.avaliacao):produtoAtual.avaliacoes[o]=t.avaliacao}const a=document.getElementById("lista-avaliacoes");a&&renderAvaliacoes(produtoAtual.avaliacoes||[],a)}catch(e){console.error("Erro ao responder avaliação:",e);alert(e.message||"Não foi possível enviar a resposta.")}finally{n.disabled=!1;n.textContent=r}})}
async function enviarPergunta(e,t,a){if(!produtoAtual)return;const o=e.value.trim();if(!o){e.focus();return}const n=t.textContent;t.disabled=!0;t.textContent="Enviando...";try{const r=await api("/api/produtos/"+produtoAtual.id+"/perguntas",{method:"POST",body:JSON.stringify({nome_cliente:"Cliente",pergunta:o})});Array.isArray(produtoAtual.perguntas)||(produtoAtual.perguntas=[]),r&&r.pergunta&&produtoAtual.perguntas.unshift(r.pergunta),e.value="";if(typeof a==="function")a();}catch(e){console.error("Erro ao enviar pergunta:",e);alert(e.message||"Não foi possível enviar sua pergunta.")}finally{t.disabled=!1;t.textContent=n}}
async function enviarAvaliacao(e,t,a,o,n){if(!produtoAtual)return;const r=e.value.trim(),c=a.value.trim(),d=Array.from(o.files||[]).slice(0,6),corSelect=document.querySelector(".avaliacao-cor-select"),corId=corSelect?corSelect.value:"";if(!t)return void alert("A quantidade de estrelas é obrigatória.");if(Array.isArray(produtoAtual.cores)&&produtoAtual.cores.length&&!corId)return void alert("Selecione a cor que você avaliou.");if(!c&&!d.length)return void alert("Escreva o que achou do produto ou envie uma foto ou vídeo.");for(const e of d){const t=e.type.startsWith("video/")?20:5;if(e.size>t*1024*1024)return void alert("Cada "+(e.type.startsWith("video/")?"vídeo":"imagem")+" deve ter no máximo "+t+"MB.")}const i=n.textContent;n.disabled=!0;n.textContent="Enviando...";try{const e=[];for(const t of d){const a=new FormData;a.append("imagem",t);a.append("tipo","avaliacao");const o=await api("/api/uploads",{method:"POST",body:a});e.push({caminho:o.caminho,public_id:o.public_id||"",tipo_midia:o.tipo_midia||("video"===t.type.split("/")[0]?"video":"imagem")})}const resposta=await api("/api/produtos/"+produtoAtual.id+"/avaliacoes",{method:"POST",body:JSON.stringify({cliente:r||"Cliente",nota:Number(t),comentario:c||null,imagens:e,cor_id:corId?Number(corId):null})});produtoAtual.avaliacao_resumo=resposta.resumo||produtoAtual.avaliacao_resumo;Array.isArray(produtoAtual.avaliacoes)||(produtoAtual.avaliacoes=[]),resposta.avaliacao&&produtoAtual.avaliacoes.unshift(resposta.avaliacao);const lista=document.getElementById("lista-avaliacoes");lista&&renderAvaliacoes(produtoAtual.avaliacoes,lista);e.value="";a.value="";o.value="";if(corSelect)corSelect.value="";const rPreview=document.querySelector(".avaliacao-foto-preview");rPreview&&(rPreview.innerHTML="");const label=document.querySelector(".avaliacao-foto-copy strong");label&&(label.textContent="Adicionar fotos e vídeos")}catch(e){console.error("Erro ao enviar avaliação:",e),alert(e.message||"Não foi possível enviar sua avaliação.")}finally{n.disabled=!1;n.textContent=i}}
function atualizarResumoAvaliacoesNaTela(){if(!produtoAtual)return;const e=produtoAtual.avaliacao_resumo||{media:0,total:0},t=document.querySelector(".pp-estrelas-topo");t&&(t.innerHTML=gerarEstrelas(Number(e.media||0),"normal"));const a=document.querySelector(".pp-media-topo");if(a){const t=Number(e.total||0);a.textContent=t>0?Number(e.media||0).toFixed(1):"Sem avaliações"}const o=document.querySelector(".pp-quantidade-topo");if(o){const t=Number(e.total||0);o.textContent=0===t?"":1===t?"(1 avaliação)":"("+t+" avaliações)"}}function adicionarLinhaTabela(e,t,a){const o=document.createElement("tr"),n=document.createElement("td");n.textContent=t;const r=document.createElement("td");r.textContent=a,o.appendChild(n),o.appendChild(r),e.appendChild(o)}function obterImagensDaCor(e,t){if(!e||!Array.isArray(e.cores)||!e.cores[t])return[];const a=e.cores[t];return Array.isArray(a.imagens)?a.imagens:[]}function obterDescricaoCorAtual(){if(produtoAtual&&Array.isArray(produtoAtual.cores)&&produtoAtual.cores[corAtual]){const e=produtoAtual.cores[corAtual];if(null!==e.descricao&&void 0!==e.descricao&&""!==String(e.descricao).trim())return String(e.descricao).trim()}return"Descrição desta cor ainda não cadastrada."}function atualizarDescricaoCorNaTela(){const e=document.getElementById("descricao-cor-atual");e&&(e.textContent=obterDescricaoCorAtual())}function obterNomeCorAtual(){return produtoAtual&&Array.isArray(produtoAtual.cores)&&produtoAtual.cores[corAtual]&&produtoAtual.cores[corAtual].nome||"—"}function obterAlturaAtual(){return produtoAtual&&Array.isArray(produtoAtual.cores)&&produtoAtual.cores[corAtual]?produtoAtual.cores[corAtual].altura||produtoAtual.caracteristicas?.altura||"—":produtoAtual?.caracteristicas?.altura||"—"}function atualizarImagemPrincipal(){if(!produtoAtual)return;const e=obterImagensDaCor(produtoAtual,corAtual),t=e.length?e:(Array.isArray(produtoAtual.imagens)?produtoAtual.imagens:[]),a=document.getElementById("pp-img"),o=document.getElementById("pp-contador"),n=document.getElementById("pp-miniaturas");if(t.length){const r=t[Math.max(0,Math.min(imgAtual,t.length-1))];a&&(a.src=urlImagem(r.caminho));o&&(o.textContent=(imgAtual+1)+" / "+t.length);n&&n.querySelectorAll(".pp-miniatura").forEach((e,t)=>e.classList.toggle("selecionada",t===imgAtual))}else{o&&(o.textContent="1 / 1");n&&(n.innerHTML="")}}function mudarCor(e){if(!produtoAtual||!Array.isArray(produtoAtual.cores)||!produtoAtual.cores[e])return;corAtual=Number(e),imgAtual=0,renderProduto()}function mudarImagem(e){if(!produtoAtual)return;const t=obterImagensDaCor(produtoAtual,corAtual),a=t.length?t:(Array.isArray(produtoAtual.imagens)?produtoAtual.imagens:[]),o=a.length;if(!o)return;imgAtual=(imgAtual+e+o)%o,atualizarImagemPrincipal();const n=document.querySelectorAll(".pp-cor-item");n.forEach((e,t)=>e.classList.toggle("selecionada",t===corAtual))} async function compartilharProduto(){if(!produtoAtual)return;const e=window.location.origin+window.location.pathname+"?produto="+encodeURIComponent(produtoAtual.id),t=produtoAtual.titulo||"Cortez Móveis";if(navigator.share)try{await navigator.share({title:t,text:t,url:e})}catch(e){}else try{await navigator.clipboard.writeText(e),alert("Link do produto copiado.")}catch(t){prompt("Copie o link do produto:",e)}}function abrirModalOrcamento(){const e=document.getElementById("modal-orcamento");if(!e)return;const t=document.getElementById("modal-produto-info"),a=document.getElementById("modal-link-whatsapp"),o=document.getElementById("modal-link-email"),n=produtoAtual?produtoAtual.titulo:"",r=produtoAtual&&Array.isArray(produtoAtual.cores)&&produtoAtual.cores[corAtual]?produtoAtual.cores[corAtual].nome:"";produtoAtual?t&&(t.textContent=n+(r?" - Cor: "+r:"")):t&&(t.textContent="Conte-nos o que você precisa.");const c=produtoAtual?"Olá! Gostaria de solicitar um orçamento para o produto "+n+(r?", na cor "+r:"")+".":"Olá! Gostaria de solicitar um orçamento com a Cortez Móveis.";a&&(a.href="https://wa.me/551532769999?text="+encodeURIComponent(c));const d=produtoAtual?"Solicitação de orçamento - "+n:"Solicitação de orçamento - Cortez Móveis";o&&(o.href="mailto:cortez@cortezmoveis.com.br?subject="+encodeURIComponent(d)+"&body="+encodeURIComponent(c)),e.classList.add("aberto")}function fecharModalOrcamento(){const e=document.getElementById("modal-orcamento");e&&e.classList.remove("aberto")}function fecharMenuMobile(){const e=document.getElementById("menu");if(!e)return;e.classList.remove("aberto");const t=document.getElementById("btn-menu-toggle");t&&t.setAttribute("aria-expanded","false");document.body.classList.remove("menu-mobile-open")}function irParaInicio(){fecharMenuMobile(),window.location.search?voltarCatalogo():window.scrollTo({top:0,behavior:"smooth"})}function navegar(e){fecharMenuMobile();const t=()=>{const t=document.getElementById(e);t&&t.scrollIntoView({behavior:"smooth",block:"start"})},a=document.getElementById("view-produto");a&&"none"!==a.style.display?(voltarCatalogo(),setTimeout(t,100)):t()}function toggleMenu(){const e=document.getElementById("menu");if(!e)return;const t=e.classList.toggle("aberto"),a=document.getElementById("btn-menu-toggle");a&&a.setAttribute("aria-expanded",t?"true":"false");document.body.classList.toggle("menu-mobile-open",t&&window.innerWidth<=600)}function abrirZoom(e){if(!e)return;const t=document.getElementById("zoom-overlay"),a=document.getElementById("zoom-imagem");t&&a&&(a.src=e.currentSrc||e.src,a.alt=e.alt||"Visualização ampliada",t.classList.add("aberto"))}function fecharZoom(){const e=document.getElementById("zoom-overlay");e&&e.classList.remove("aberto")}function obterCarrinho(){
    try{
        const e=JSON.parse(localStorage.getItem("cortez_carrinho")||"[]");
        return Array.isArray(e)?e:[];
    }catch(e){return[]}
}
function salvarCarrinho(e){
    localStorage.setItem("cortez_carrinho",JSON.stringify(e));
    atualizarCarrinhoHeader();
}
function totalItensCarrinho(){
    return obterCarrinho().reduce((e,t)=>e+Number(t.quantidade||0),0);
}
function quantidadeNoCarrinho(e,t){
    return obterCarrinho()
        .filter(a=>Number(a.produtoId)===Number(e)&&String(a.cor||"")===String(t||""))
        .reduce((e,t)=>e+Number(t.quantidade||0),0);
}
function atualizarCarrinhoHeader(){
    const botao=document.getElementById("btn-carrinho-header");
    const badge=document.getElementById("header-carrinho-badge");
    const total=totalItensCarrinho();
    if(botao){
        botao.setAttribute("aria-expanded",
            document.getElementById("modal-carrinho")?.classList.contains("aberto")?"true":"false"
        );
        botao.classList.toggle("com-itens",total>0);
    }
    if(badge){
        badge.textContent=String(total);
        badge.classList.toggle("visivel",total>0);
    }
    atualizarBotaoCarrinhoProduto();
}
function atualizarBotaoCarrinhoProduto(){
    const e=document.querySelector(".btn-carrinho-produto");
    if(!e||!produtoAtual)return;
    const t=quantidadeNoCarrinho(produtoAtual.id,obterNomeCorAtual());
    e.textContent=t>0?"No carrinho · "+t:"Adicionar ao carrinho";
}
function abrirCarrinho(){
    renderCarrinho();
    const modal=document.getElementById("modal-carrinho");
    if(!modal)return;
    modal.classList.add("aberto");
    modal.setAttribute("aria-hidden","false");
    const botao=document.getElementById("btn-carrinho-header");
    botao&&botao.setAttribute("aria-expanded","true");
    document.body.classList.add("cart-modal-open");
}
function fecharCarrinho(){
    const modal=document.getElementById("modal-carrinho");
    if(!modal)return;
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden","true");
    const botao=document.getElementById("btn-carrinho-header");
    botao&&botao.setAttribute("aria-expanded","false");
    document.body.classList.remove("cart-modal-open");
}
function alterarQuantidadeCarrinho(indice,diferenca){
    const carrinho=obterCarrinho();
    const item=carrinho[indice];
    if(!item)return;
    item.quantidade=Math.max(0,Number(item.quantidade||0)+diferenca);
    if(item.quantidade<=0)carrinho.splice(indice,1);
    salvarCarrinho(carrinho);
    renderCarrinho();
    atualizarBotaoCarrinhoProduto();
}
function definirQuantidadeCarrinho(indice,valor){
    const carrinho=obterCarrinho();
    const item=carrinho[indice];
    if(!item)return;
    const texto=String(valor??"").trim().replace(",",".");
    const quantidade=Math.floor(Number(texto));
    if(!Number.isFinite(quantidade)||quantidade<1){
        renderCarrinho();
        return;
    }
    item.quantidade=quantidade;
    salvarCarrinho(carrinho);
    renderCarrinho();
    atualizarBotaoCarrinhoProduto();
}
function removerItemCarrinho(indice){
    const carrinho=obterCarrinho();
    if(!carrinho[indice])return;
    carrinho.splice(indice,1);
    salvarCarrinho(carrinho);
    renderCarrinho();
    atualizarBotaoCarrinhoProduto();
}
function renderCarrinho(){
    const lista=document.getElementById("lista-carrinho");
    const vazio=document.getElementById("carrinho-vazio");
    const footer=document.getElementById("carrinho-footer");
    const totalEl=document.getElementById("carrinho-total-itens");
    if(!lista||!vazio||!footer)return;
    const carrinho=obterCarrinho();
    lista.innerHTML="";
    if(!carrinho.length){
        vazio.style.display="flex";
        footer.style.display="none";
        return;
    }
    vazio.style.display="none";
    footer.style.display="block";
    carrinho.forEach((item,index)=>{
        const row=document.createElement("article");
        row.className="cart-item";
        const media=document.createElement("div");
        media.className="cart-item-media";
        if(item.imagem){
            const img=document.createElement("img");
            img.src=urlImagem(item.imagem);
            img.alt=item.titulo||"Produto";
            img.loading="lazy";
            media.appendChild(img);
        }else{
            media.textContent="🪑";
        }
        const info=document.createElement("div");
        info.className="cart-item-info";
        const titulo=document.createElement("strong");
        titulo.className="cart-item-title";
        titulo.textContent=item.titulo||"Produto";
        info.appendChild(titulo);
        if(item.cor){
            const cor=document.createElement("span");
            cor.className="cart-item-cor";
            cor.textContent="Cor: "+item.cor;
            info.appendChild(cor);
        }
        if(item.preco!==null&&item.preco!==undefined&&item.preco!==""){
            const preco=document.createElement("span");
            preco.className="cart-item-preco";
            preco.textContent=formatarPreco(item.preco);
            info.appendChild(preco);
        }
        const acoes=document.createElement("div");
        acoes.className="cart-item-acoes";
        const menos=document.createElement("button");
        menos.type="button";
        menos.className="cart-qty-btn";
        menos.textContent="−";
        menos.setAttribute("aria-label","Diminuir quantidade");
        menos.addEventListener("click",()=>alterarQuantidadeCarrinho(index,-1));
        const qtd=document.createElement("input");
        qtd.type="number";
        qtd.className="cart-qty-input";
        qtd.inputMode="numeric";
        qtd.min="1";
        qtd.step="1";
        qtd.value=String(Math.max(1,Math.floor(Number(item.quantidade||1))));
        qtd.setAttribute("aria-label","Quantidade de "+(item.titulo||"produto"));
        qtd.title="Digite a quantidade";
        qtd.addEventListener("change",()=>definirQuantidadeCarrinho(index,qtd.value));
        qtd.addEventListener("keydown",event=>{
            if(event.key==="Enter"){
                event.preventDefault();
                definirQuantidadeCarrinho(index,qtd.value);
                qtd.blur();
            }
        });
        const mais=document.createElement("button");
        mais.type="button";
        mais.className="cart-qty-btn";
        mais.textContent="+";
        mais.setAttribute("aria-label","Aumentar quantidade");
        mais.addEventListener("click",()=>alterarQuantidadeCarrinho(index,1));
        const remover=document.createElement("button");
        remover.type="button";
        remover.className="cart-remove-btn";
        remover.textContent="Remover";
        remover.addEventListener("click",()=>removerItemCarrinho(index));
        acoes.appendChild(menos);
        acoes.appendChild(qtd);
        acoes.appendChild(mais);
        acoes.appendChild(remover);
        info.appendChild(acoes);
        row.appendChild(media);
        row.appendChild(info);
        lista.appendChild(row);
    });
    if(totalEl)totalEl.textContent=String(totalItensCarrinho());
    atualizarCarrinhoHeader();
}
function adicionarAoCarrinho(){
    if(!produtoAtual)return;
    const carrinho=obterCarrinho();
    const cor=obterNomeCorAtual();
    const imagens=obterImagensDaCor(produtoAtual,corAtual);
    const imagem=imagens.length?imagens[0]:produtoAtual.imagens?.[0];
    const existente=carrinho.find(item=>
        Number(item.produtoId)===Number(produtoAtual.id)&&String(item.cor||"")===String(cor||"")
    );
    if(existente){
        existente.quantidade=Number(existente.quantidade||1)+1;
    }else{
        carrinho.push({
            produtoId:produtoAtual.id,
            titulo:produtoAtual.titulo||"Produto",
            linha:produtoAtual.linha||"",
            preco:produtoAtual.preco??null,
            cor:cor||"",
            imagem:imagem?.caminho||"",
            quantidade:1
        });
    }
    salvarCarrinho(carrinho);
    atualizarBotaoCarrinhoProduto();
    mostrarToastPremium("Produto adicionado ao carrinho");
}
function montarTextoCarrinho(){
    const carrinho=obterCarrinho();
    if(!carrinho.length)return"";
    return carrinho.map((item,index)=>{
        const quantidade=Number(item.quantidade||1);
        const preco=item.preco!==null&&item.preco!==undefined&&item.preco!==""?formatarPreco(item.preco):"Sob consulta";
        return (index+1)+". "+(item.titulo||"Produto")+(item.cor?" | Cor: "+item.cor:"")+" | Quantidade: "+quantidade+" | Valor: "+preco;
    }).join("\n");
}
function abrirModalOrcamentoCarrinho(){
    const carrinho=obterCarrinho();
    if(!carrinho.length){
        abrirCarrinho();
        return;
    }
    const nomeLista=carrinho.map(item=>(Number(item.quantidade||1))+"x "+(item.titulo||"Produto")+(item.cor?" - "+item.cor:"")).join(", ");
    const texto="Olá! Gostaria de solicitar um orçamento para os seguintes produtos:\n\n"+montarTextoCarrinho()+"\n\nAguardo o retorno da Cortez Móveis.";
    const modal=document.getElementById("modal-orcamento");
    const info=document.getElementById("modal-produto-info");
    const whatsapp=document.getElementById("modal-link-whatsapp");
    const email=document.getElementById("modal-link-email");
    if(info)info.textContent="Carrinho com "+totalItensCarrinho()+" item(ns): "+nomeLista;
    if(whatsapp)whatsapp.href="https://wa.me/551532769999?text="+encodeURIComponent(texto);
    if(email)email.href="mailto:cortez@cortezmoveis.com.br?subject="+encodeURIComponent("Solicitação de orçamento - Carrinho Cortez Móveis")+"&body="+encodeURIComponent(texto);
    fecharCarrinho();
    if(modal)modal.classList.add("aberto");
}
function mostrarToastPremium(e){
    const t=document.getElementById("premium-toast");
    t&&t.remove();
    const a=document.createElement("div");
    a.id="premium-toast";
    a.className="premium-toast";
    a.textContent=e;
    document.body.appendChild(a);
    requestAnimationFrame(()=>a.classList.add("visivel"));
    setTimeout(()=>{
        a.classList.remove("visivel");
        setTimeout(()=>a.remove(),250);
    },2200);
}
async function inicializarSite(){atualizarCarrinhoHeader();const e=document.getElementById("view-produto"),t=document.getElementById("view-home");e&&(e.style.display="none"),t&&(t.style.display="block"),await verificarAdministrador(),carregarProdutos(),carregarCategorias();const a=new URLSearchParams(window.location.search).get("produto");a&&await abrirProduto(a),atualizarModoAdministrador()}document.getElementById("btn-menu-toggle")?.addEventListener("click",toggleMenu),document.getElementById("nav-inicio")?.addEventListener("click",e=>{e.preventDefault(),irParaInicio()}),document.getElementById("nav-produtos")?.addEventListener("click",e=>{e.preventDefault(),navegar("produtos")}),document.getElementById("nav-sobre")?.addEventListener("click",e=>{e.preventDefault(),navegar("sobre")}),document.getElementById("nav-contato")?.addEventListener("click",e=>{e.preventDefault(),navegar("contato")}),document.getElementById("nav-guia")?.addEventListener("click",e=>{e.preventDefault(),navegar("guia")}),document.getElementById("btn-header-orcamento")?.addEventListener("click",()=>{fecharMenuMobile();abrirModalOrcamento()}),document.getElementById("btn-carrinho-header")?.addEventListener("click",()=>{fecharMenuMobile();abrirCarrinho()}),document.getElementById("btn-fechar-carrinho")?.addEventListener("click",fecharCarrinho),document.getElementById("btn-orcamento-carrinho")?.addEventListener("click",abrirModalOrcamentoCarrinho),document.getElementById("modal-carrinho")?.addEventListener("click",e=>{"modal-carrinho"===e.target.id&&fecharCarrinho()}),document.getElementById("btn-conheca-produtos")?.addEventListener("click",()=>navegar("produtos")),document.getElementById("btn-orcamento-principal")?.addEventListener("click",abrirModalOrcamento),document.getElementById("btn-voltar-catalogo")?.addEventListener("click",voltarCatalogo),document.getElementById("btn-fechar-orcamento")?.addEventListener("click",fecharModalOrcamento),document.getElementById("btn-fechar-zoom")?.addEventListener("click",fecharZoom),document.getElementById("modal-orcamento")?.addEventListener("click",e=>{"modal-orcamento"===e.target.id&&fecharModalOrcamento()}),document.getElementById("zoom-overlay")?.addEventListener("click",e=>{"zoom-overlay"===e.target.id&&fecharZoom()}),document.querySelectorAll("[data-zoom]").forEach(e=>{e.addEventListener("click",()=>abrirZoom(e))}),document.addEventListener("keydown",e=>{"Escape"===e.key&&(fecharZoom(),fecharModalOrcamento(),fecharCarrinho(),fecharMenuMobile())}),window.addEventListener("popstate",()=>{modoAdminSite=new URLSearchParams(window.location.search).get("modo")==="admin";const e=new URLSearchParams(window.location.search).get("produto");if(e)abrirProduto(e,!1);else{const e=document.getElementById("view-produto"),t=document.getElementById("view-home");e&&(e.style.display="none"),t&&(t.style.display="block"),produtoAtual=null;}}),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",inicializarSite):inicializarSite();

/* =====================================================================
   CAMADA PREMIUM — COMPORTAMENTO E MICROINTERAÇÕES
   ===================================================================== */
(function inicializarEfeitosPremium() {
    "use strict";

    var reducaoMovimento = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var progresso = document.createElement("div");
    progresso.id = "premium-scroll-progress";
    document.body.appendChild(progresso);

    var voltarTopo = document.createElement("button");
    voltarTopo.type = "button";
    voltarTopo.id = "premium-back-top";
    voltarTopo.setAttribute("aria-label", "Voltar ao topo");
    document.body.appendChild(voltarTopo);

    function atualizarRolagem() {
        var doc = document.documentElement;
        var total = Math.max(1, doc.scrollHeight - window.innerHeight);
        var atual = Math.max(0, Math.min(total, window.scrollY || window.pageYOffset || 0));
        progresso.style.width = ((atual / total) * 100) + "%";

        var header = document.querySelector(".header");
        if (header) header.classList.toggle("scrolled", atual > 18);

        voltarTopo.classList.toggle("visivel", atual > Math.max(260, window.innerHeight * .42));
    }

    var rolando = false;
    function solicitarAtualizacaoRolagem() {
        if (rolando) return;
        rolando = true;
        requestAnimationFrame(function () {
            rolando = false;
            atualizarRolagem();
        });
    }

    window.addEventListener("scroll", solicitarAtualizacaoRolagem, { passive: true });
    window.addEventListener("resize", atualizarRolagem);
    atualizarRolagem();

    voltarTopo.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: reducaoMovimento ? "auto" : "smooth"
        });
    });

    function aplicarRevelacao(el, indice) {
        if (!el || el.classList.contains("premium-reveal")) return;
        el.classList.add("premium-reveal");
        el.style.setProperty("--reveal-delay", Math.min(indice || 0, 7) * 65 + "ms");
    }

    function coletarRevelacoes(root) {
        if (!root) return;

        var seletores = [
            ".section-head",
            ".guia-item",
            ".produto-card",
            ".filtro-categorias",
            ".sobre-texto",
            ".orcamento-card",
            ".contato-section .container",
            "footer",
            "#produto-layout > *",
            "#produto-layout .pp-bloco",
            "#produto-layout .pp-imagem-area",
            "#produto-layout .pp-cores"
        ];

        var indice = 0;
        seletores.forEach(function (seletor) {
            root.querySelectorAll(seletor).forEach(function (el) {
                aplicarRevelacao(el, indice++);
            });
        });
    }

    document.body.classList.add("premium-reveal-ready");
    coletarRevelacoes(document);

    var observadorRevelacao = null;
    if ("IntersectionObserver" in window && !reducaoMovimento) {
        observadorRevelacao = new IntersectionObserver(function (entradas, observer) {
            entradas.forEach(function (entrada) {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add("premium-visible");
                observer.unobserve(entrada.target);
            });
        }, {
            threshold: .10,
            rootMargin: "0px 0px -7% 0px"
        });

        document.querySelectorAll(".premium-reveal").forEach(function (el) {
            observadorRevelacao.observe(el);
        });
    } else {
        document.querySelectorAll(".premium-reveal").forEach(function (el) {
            el.classList.add("premium-visible");
        });
    }

    var ultimoProdutoLayout = null;
    function atualizarRevelacoesDinamicas() {
        var alvos = document.querySelectorAll(
            ".produto-card, .rel-card, #produto-layout > *, #produto-layout .pp-bloco, #produto-layout .pp-imagem-area, #produto-layout .pp-cores"
        );

        var indice = 0;
        alvos.forEach(function (el) {
            if (el.classList.contains("premium-reveal")) return;
            aplicarRevelacao(el, indice++);
            if (observadorRevelacao) observadorRevelacao.observe(el);
            else el.classList.add("premium-visible");
        });
    }

    if ("MutationObserver" in window) {
        var observadorDOM = new MutationObserver(function () {
            atualizarRevelacoesDinamicas();
            window.instalarTiltNosNovosCards();
        });
        observadorDOM.observe(document.body, { childList: true, subtree: true });
    }

    function criarRipple(evento, elemento) {
        if (reducaoMovimento || window.innerWidth <= 600) return;
        if (!elemento || elemento.dataset.rippleReady === "1") {
            // listeners são delegados, então isso não impede novos elementos.
        }

        var rect = elemento.getBoundingClientRect();
        var x = evento.clientX - rect.left;
        var y = evento.clientY - rect.top;

        var bolha = document.createElement("span");
        bolha.className = "premium-ripple";
        bolha.style.left = x + "px";
        bolha.style.top = y + "px";
        elemento.appendChild(bolha);

        window.setTimeout(function () {
            bolha.remove();
        }, 700);
    }

    document.addEventListener("click", function (evento) {
        var alvo = evento.target.closest(
            "button, .btn-produto, .filtro-btn, .header-nav a, .pp-seta, .pp-fav, .pp-compartilhar, .fav-btn, .rel-fav"
        );
        if (!alvo || alvo.id === "premium-back-top" || alvo.disabled) return;
        criarRipple(evento, alvo);
    });

    function aplicarTilt(elemento) {
        if (reducaoMovimento || !elemento || elemento.dataset.premiumTilt === "1") return;
        if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;

        elemento.dataset.premiumTilt = "1";

        var frame = null;

        elemento.addEventListener("pointermove", function (evento) {
            if (evento.pointerType && evento.pointerType !== "mouse") return;

            var rect = elemento.getBoundingClientRect();
            var px = (evento.clientX - rect.left) / rect.width;
            var py = (evento.clientY - rect.top) / rect.height;
            var ry = (px - .5) * 4.5;
            var rx = (.5 - py) * 4.5;

            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(function () {
                elemento.classList.add("premium-tilt-active");
                elemento.style.setProperty("--premium-rx", rx.toFixed(2) + "deg");
                elemento.style.setProperty("--premium-ry", ry.toFixed(2) + "deg");
            });
        });

        elemento.addEventListener("pointerleave", function () {
            if (frame) cancelAnimationFrame(frame);
            elemento.classList.remove("premium-tilt-active");
            elemento.style.removeProperty("--premium-rx");
            elemento.style.removeProperty("--premium-ry");
        });
    }

    window.instalarTiltNosNovosCards = function instalarTiltNosNovosCards() {
        if (window.innerWidth <= 900) return;
        document.querySelectorAll(".produto-card, .guia-item, .rel-card").forEach(aplicarTilt);
    };

    window.instalarTiltNosNovosCards();

    document.addEventListener("click", function (evento) {
        var link = evento.target.closest('a[href^="#"]');
        if (!link) return;

        var id = link.getAttribute("href");
        if (!id || id === "#") return;

        var destino = document.querySelector(id);
        if (!destino) return;

        evento.preventDefault();
        var topo = destino.getBoundingClientRect().top + window.scrollY - 78;
        window.scrollTo({
            top: Math.max(0, topo),
            behavior: reducaoMovimento ? "auto" : "smooth"
        });
    });
})();

window.addEventListener("storage",event=>{if(event.key==="cortez_carrinho"){atualizarCarrinhoHeader();const modal=document.getElementById("modal-carrinho");modal&&modal.classList.contains("aberto")&&renderCarrinho()}});

document.addEventListener("click",function(event){
    const menu=document.getElementById("menu");
    const toggle=document.getElementById("btn-menu-toggle");
    if(!menu||!toggle||!menu.classList.contains("aberto")) return;
    if(menu.contains(event.target)||toggle.contains(event.target)) return;
    fecharMenuMobile();
});
window.addEventListener("resize",function(){
    if(window.innerWidth>600) fecharMenuMobile();
});
