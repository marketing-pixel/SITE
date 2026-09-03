// ============================================================
// ESTADO
// ============================================================

let produtos = [];
let produtoAtual = null;
let corAtual = 0;
let imgAtual = 0;

let categorias = [];
let categoriaFiltro = null;

// ============================================================
// ESTADO ADMINISTRATIVO
// ============================================================

let administradorLogado = false;
let dadosAdministrador = null;


// ============================================================
// API
// ============================================================

async function api(url, options = {}) {

    const config = {
        ...options,
        credentials: 'same-origin',
        headers: {
            ...(options.body instanceof FormData
                ? {}
                : {
                    'Content-Type': 'application/json'
                }),
            ...(options.headers || {})
        }
    };

    const res = await fetch(
        url,
        config
    );

    const data =
        await res.json().catch(
            () => ({})
        );

    if (!res.ok) {

        throw new Error(
            data.erro ||
            'Erro na requisição.'
        );
    }

    return data;
}


// ============================================================
// VERIFICAR ADMINISTRADOR
// ============================================================

async function verificarAdministrador() {

    administradorLogado = false;
    dadosAdministrador = null;

    try {

        const resultado =
            await api(
                '/api/auth/me'
            );

        if (
            resultado &&
            resultado.admin
        ) {

            administradorLogado = true;
            dadosAdministrador =
                resultado.admin;
        }

    } catch (e) {

        administradorLogado = false;
        dadosAdministrador = null;
    }

    atualizarModoAdministrador();
}


// ============================================================
// MODO ADMINISTRADOR
// ============================================================

function atualizarModoAdministrador() {

    document
        .querySelectorAll(
            '[data-apenas-admin]'
        )
        .forEach(
            elemento => {

                elemento.style.display =
                    administradorLogado
                        ? ''
                        : 'none';
            }
        );

    const barraExistente =
        document.getElementById(
            'barra-modo-admin'
        );

    if (!administradorLogado) {

        if (barraExistente) {
            barraExistente.remove();
        }

        return;
    }

    criarBarraModoAdministrador();
}


// ============================================================
// BARRA DE ADMIN
// ============================================================

function criarBarraModoAdministrador() {

    let barra =
        document.getElementById(
            'barra-modo-admin'
        );

    if (!barra) {

        barra =
            document.createElement(
                'div'
            );

        barra.id =
            'barra-modo-admin';

        barra.className =
            'barra-modo-admin';

        document.body.appendChild(
            barra
        );
    }

    barra.innerHTML = '';

    const texto =
        document.createElement(
            'span'
        );

    texto.className =
        'admin-modo-texto';

    texto.textContent =
        dadosAdministrador &&
        dadosAdministrador.nome
            ? 'Modo administrador: ' +
              dadosAdministrador.nome
            : 'Modo administrador';

    barra.appendChild(
        texto
    );

    if (produtoAtual) {

        const botaoEditar =
            document.createElement(
                'button'
            );

        botaoEditar.type =
            'button';

        botaoEditar.className =
            'admin-botao-editar';

        botaoEditar.textContent =
            'Editar produto no painel';

        botaoEditar.addEventListener(
            'click',
            () => abrirEdicaoProdutoNoPainel()
        );

        barra.appendChild(
            botaoEditar
        );
    }
}


// ============================================================
// ABRIR PRODUTO NO PAINEL ADMINISTRATIVO
// ============================================================

function abrirEdicaoProdutoNoPainel() {

    if (
        !administradorLogado ||
        !produtoAtual
    ) {
        return;
    }

    /*
     * Mantemos a navegação concentrada
     * no painel administrativo.
     *
     * Ajuste somente a URL abaixo caso
     * seu painel tenha outro caminho.
     */

    const url =
        '/admin.html?produto=' +
        encodeURIComponent(
            produtoAtual.id
        );

    window.open(
        url,
        '_blank'
    );
}


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function escaparHtml(valor) {

    return String(
        valor ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
}


function formatarPreco(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return '';
    }

    const numero =
        Number(valor);

    if (!Number.isFinite(numero)) {
        return '';
    }

    return numero.toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );
}


// ============================================================
// ESTRELAS
// ============================================================

function gerarEstrelas(
    nota,
    tamanho = 'normal'
) {

    const numero =
        Number(nota);

    const valor =
        Number.isFinite(numero)
            ? Math.max(
                0,
                Math.min(
                    5,
                    numero
                )
            )
            : 0;

    let html =
        '<span class="estrelas ' +
        tamanho +
        '" aria-label="' +
        escaparHtml(
            valor.toFixed(1) +
            ' de 5 estrelas'
        ) +
        '">';

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        html +=
            i <= Math.round(valor)
                ? '<span class="estrela ativa">★</span>'
                : '<span class="estrela">☆</span>';
    }

    html +=
        '</span>';

    return html;
}


function gerarEstrelasInteiras(nota) {

    const numero =
        Number(nota);

    let html = '';

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        html +=
            i <= numero
                ? '★'
                : '☆';
    }

    return html;
}


function formatarDataRelativa(data) {

    if (!data) {
        return '';
    }

    const dataCriada =
        new Date(data);

    if (
        Number.isNaN(
            dataCriada.getTime()
        )
    ) {
        return '';
    }

    const agora =
        new Date();

    const diferenca =
        agora.getTime() -
        dataCriada.getTime();

    const dias =
        Math.floor(
            diferenca /
            (
                1000 *
                60 *
                60 *
                24
            )
        );

    if (dias <= 0) {
        return 'Hoje';
    }

    if (dias === 1) {
        return 'Há 1 dia';
    }

    if (dias < 30) {
        return 'Há ' +
            dias +
            ' dias';
    }

    const meses =
        Math.floor(
            dias / 30
        );

    if (meses === 1) {
        return 'Há 1 mês';
    }

    if (meses < 12) {
        return 'Há ' +
            meses +
            ' meses';
    }

    const anos =
        Math.floor(
            meses / 12
        );

    if (anos === 1) {
        return 'Há 1 ano';
    }

    return 'Há ' +
        anos +
        ' anos';
}


function criarBotaoEstrela(
    nota,
    selecionada
) {

    const botao =
        document.createElement(
            'button'
        );

    botao.type =
        'button';

    botao.className =
        'estrela-input' +
        (
            selecionada
                ? ' selecionada'
                : ''
        );

    botao.dataset.nota =
        nota;

    botao.setAttribute(
        'aria-label',
        nota +
        (
            nota === 1
                ? ' estrela'
                : ' estrelas'
        )
    );

    botao.textContent =
        '★';

    return botao;
}


// ============================================================
// FAVORITOS
// ============================================================

function getFavoritos() {

    try {

        return JSON.parse(
            localStorage.getItem(
                'cortez_favoritos'
            ) || '[]'
        );

    } catch (e) {

        return [];
    }
}


function toggleFavorito(id) {

    let favoritos =
        getFavoritos();

    id =
        Number(id);

    if (
        favoritos.includes(id)
    ) {

        favoritos =
            favoritos.filter(
                favorito =>
                    favorito !== id
            );

    } else {

        favoritos.push(
            id
        );
    }

    localStorage.setItem(
        'cortez_favoritos',
        JSON.stringify(
            favoritos
        )
    );

    atualizarBotoesFavorito();
}


function isFavorito(id) {

    return getFavoritos()
        .includes(
            Number(id)
        );
}


function atualizarBotoesFavorito() {

    document
        .querySelectorAll(
            '.fav-btn, .rel-fav, .pp-fav'
        )
        .forEach(
            botao => {

                const id =
                    Number(
                        botao.dataset.produtoId ||
                        botao.closest(
                            '[data-id]'
                        )?.dataset.id ||
                        produtoAtual?.id
                    );

                if (!id) {
                    return;
                }

                const favorito =
                    isFavorito(id);

                botao.classList.toggle(
                    'favoritado',
                    favorito
                );

                botao.textContent =
                    favorito
                        ? '♥'
                        : '♡';

                botao.setAttribute(
                    'aria-pressed',
                    favorito
                        ? 'true'
                        : 'false'
                );
            }
        );
}


// ============================================================
// NORMALIZAR PRODUTO
// ============================================================

function normalizarProduto(
    produto
) {

    if (!produto) {
        return produto;
    }

    const imagens =
        Array.isArray(
            produto.imagens
        )
            ? produto.imagens
            : [];

    const cores =
        Array.isArray(
            produto.cores
        )
            ? produto.cores
            : [];

    const coresNormalizadas =
        cores.map(
            cor => {

                const imagensDaCor =
                    imagens
                        .filter(
                            imagem =>
                                Number(
                                    imagem.cor_id
                                ) ===
                                Number(
                                    cor.id
                                )
                        )
                        .sort(
                            (a, b) =>
                                Number(
                                    a.ordem || 0
                                ) -
                                Number(
                                    b.ordem || 0
                                )
                        );

                return {
                    ...cor,
                    imagens:
                        imagensDaCor
                };
            }
        );

    return {
        ...produto,
        cores:
            coresNormalizadas
    };
}


// ============================================================
// CARREGAR PRODUTOS
// ============================================================

async function carregarProdutos() {

    const grid =
        document.getElementById(
            'grid-produtos'
        );

    try {

        produtos =
            await api(
                '/api/produtos'
            );

        produtos =
            Array.isArray(produtos)
                ? produtos.map(
                    normalizarProduto
                )
                : [];

        renderGrade();

    } catch (e) {

        console.error(
            'Erro ao carregar produtos:',
            e
        );

        if (grid) {

            grid.innerHTML =
                '';

            const mensagem =
                document.createElement(
                    'p'
                );

            mensagem.className =
                'produtos-estado';

            mensagem.textContent =
                'Não foi possível carregar os produtos.';

            grid.appendChild(
                mensagem
            );
        }
    }
}


// ============================================================
// CARREGAR CATEGORIAS
// ============================================================

async function carregarCategorias() {

    const filtro =
        document.getElementById(
            'filtro-categorias'
        );

    if (!filtro) {
        return;
    }

    try {

        categorias =
            await api(
                '/api/categorias'
            );

        if (
            !Array.isArray(
                categorias
            )
        ) {

            categorias = [];
        }

        filtro.innerHTML =
            '';

        const btnTodos =
            document.createElement(
                'button'
            );

        btnTodos.type =
            'button';

        btnTodos.className =
            'filtro-btn ativo';

        btnTodos.textContent =
            'Todos';

        btnTodos.dataset.categoria =
            '';

        btnTodos.addEventListener(
            'click',
            () => {

                filtrarCategoria(
                    null,
                    btnTodos
                );
            }
        );

        filtro.appendChild(
            btnTodos
        );

        categorias.forEach(
            categoria => {

                const botao =
                    document.createElement(
                        'button'
                    );

                botao.type =
                    'button';

                botao.className =
                    'filtro-btn';

                botao.textContent =
                    categoria.nome ||
                    '';

                botao.dataset.categoria =
                    categoria.id;

                botao.addEventListener(
                    'click',
                    () => {

                        filtrarCategoria(
                            categoria.id,
                            botao
                        );
                    }
                );

                filtro.appendChild(
                    botao
                );
            }
        );

        renderGrade();

    } catch (e) {

        console.error(
            'Erro ao carregar categorias:',
            e
        );
    }
}


// ============================================================
// FILTRO DE CATEGORIA
// ============================================================

function filtrarCategoria(
    id,
    botaoSelecionado
) {

    categoriaFiltro =
        id === null
            ? null
            : Number(id);

    document
        .querySelectorAll(
            '.filtro-btn'
        )
        .forEach(
            botao =>
                botao.classList.remove(
                    'ativo'
                )
        );

    if (botaoSelecionado) {

        botaoSelecionado.classList.add(
            'ativo'
        );
    }

    renderGrade();
}


// ============================================================
// GRADE DE PRODUTOS
// ============================================================

function renderGrade() {

    const grid =
        document.getElementById(
            'grid-produtos'
        );

    if (!grid) {
        return;
    }

    grid.innerHTML =
        '';

    let lista =
        Array.isArray(produtos)
            ? produtos
            : [];

    if (
        categoriaFiltro !== null &&
        categoriaFiltro !== undefined
    ) {

        lista =
            lista.filter(
                produto =>
                    Number(
                        produto.categoria_id
                    ) ===
                    Number(
                        categoriaFiltro
                    )
            );
    }

    if (
        lista.length === 0
    ) {

        const mensagem =
            document.createElement(
                'p'
            );

        mensagem.className =
            'produtos-estado';

        mensagem.textContent =
            'Nenhum produto encontrado.';

        grid.appendChild(
            mensagem
        );

        return;
    }

    lista.forEach(
        produto =>
            criarCardProduto(
                produto,
                grid
            )
    );

    atualizarBotoesFavorito();
}


// ============================================================
// CARD DE PRODUTO
// ============================================================

function criarCardProduto(
    produto,
    container
) {

    const card =
        document.createElement(
            'article'
        );

    card.className =
        'produto-card';

    card.dataset.id =
        produto.id;

    const areaImagem =
        document.createElement(
            'div'
        );

    areaImagem.className =
        'produto-imagem-area';

    const favorito =
        document.createElement(
            'button'
        );

    favorito.type =
        'button';

    favorito.className =
        'fav-btn' +
        (
            isFavorito(
                produto.id
            )
                ? ' favoritado'
                : ''
        );

    favorito.dataset.produtoId =
        produto.id;

    favorito.setAttribute(
        'aria-label',
        'Adicionar aos favoritos'
    );

    favorito.setAttribute(
        'aria-pressed',
        isFavorito(
            produto.id
        )
            ? 'true'
            : 'false'
    );

    favorito.textContent =
        isFavorito(
            produto.id
        )
            ? '♥'
            : '♡';

    favorito.addEventListener(
        'click',
        event => {

            event.stopPropagation();

            toggleFavorito(
                produto.id
            );
        }
    );

    areaImagem.appendChild(
        favorito
    );

    if (
        produto.imagem_principal
    ) {

        const imagem =
            document.createElement(
                'img'
            );

        imagem.src =
            produto.imagem_principal;

        imagem.alt =
            produto.titulo ||
            'Produto';

        imagem.loading =
            'lazy';

        imagem.addEventListener(
            'error',
            () => {

                imagem.remove();

                const placeholder =
                    document.createElement(
                        'div'
                    );

                placeholder.className =
                    'produto-imagem-placeholder';

                placeholder.textContent =
                    '🪑';

                areaImagem.appendChild(
                    placeholder
                );
            }
        );

        areaImagem.appendChild(
            imagem
        );

    } else {

        const placeholder =
            document.createElement(
                'div'
            );

        placeholder.className =
            'produto-imagem-placeholder';

        placeholder.textContent =
            '🪑';

        areaImagem.appendChild(
            placeholder
        );
    }

    card.appendChild(
        areaImagem
    );

    const info =
        document.createElement(
            'div'
        );

    info.className =
        'produto-info';

    const categoria =
        document.createElement(
            'div'
        );

    categoria.className =
        'produto-categoria';

    categoria.textContent =
        produto.linha ||
        '';

    info.appendChild(
        categoria
    );

    const nome =
        document.createElement(
            'div'
        );

    nome.className =
        'produto-nome';

    nome.textContent =
        produto.titulo ||
        '';

    info.appendChild(
        nome
    );

    if (
        produto.preco !== null &&
        produto.preco !== undefined &&
        produto.preco !== ''
    ) {

        const preco =
            document.createElement(
                'div'
            );

        preco.className =
            'produto-preco';

        preco.textContent =
            formatarPreco(
                produto.preco
            );

        info.appendChild(
            preco
        );

        if (
            produto.parcelamento
        ) {

            const parcelas =
                document.createElement(
                    'div'
                );

            parcelas.className =
                'produto-parcelas';

            parcelas.textContent =
                produto.parcelamento;

            info.appendChild(
                parcelas
            );
        }
    }

    const botao =
        document.createElement(
            'button'
        );

    botao.type =
        'button';

    botao.className =
        'btn-produto';

    botao.textContent =
        'Ver detalhes';

    botao.addEventListener(
        'click',
        event => {

            event.stopPropagation();

            abrirProduto(
                produto.id
            );
        }
    );

    info.appendChild(
        botao
    );

    card.appendChild(
        info
    );

    card.addEventListener(
        'click',
        () =>
            abrirProduto(
                produto.id
            )
    );

    container.appendChild(
        card
    );
}


// ============================================================
// ABRIR PRODUTO
// ============================================================

async function abrirProduto(
    id,
    adicionarHistorico = true
) {

    try {

        const produto =
            await api(
                '/api/produtos/' +
                id
            );

        produtoAtual =
            normalizarProduto(
                produto
            );

        corAtual =
            0;

        imgAtual =
            0;

        const home =
            document.getElementById(
                'view-home'
            );

        const produtoView =
            document.getElementById(
                'view-produto'
            );

        if (home) {
            home.style.display =
                'none';
        }

        if (produtoView) {
            produtoView.style.display =
                'block';
        }

        atualizarModoAdministrador();

        const parametros =
            new URLSearchParams(
                window.location.search
            );

        const pagina =
            parametros.get(
                'pagina'
            );

        if (
            pagina === 'perguntas'
        ) {

            renderPaginaPerguntas();

        } else if (
            pagina === 'avaliacoes'
        ) {

            renderPaginaAvaliacoes();

        } else {

            renderProduto();
        }

        atualizarModoAdministrador();

        if (
            adicionarHistorico
        ) {

            const url =
                '?produto=' +
                encodeURIComponent(
                    produtoAtual.id
                );

            if (pagina) {

                history.pushState(
                    {},
                    '',
                    url +
                    '&pagina=' +
                    encodeURIComponent(
                        pagina
                    )
                );

            } else {

                history.pushState(
                    {},
                    '',
                    url
                );
            }
        }

        window.scrollTo(
            {
                top: 0,
                behavior: 'auto'
            }
        );

    } catch (e) {

        console.error(
            'Erro ao abrir produto:',
            e
        );

        alert(
            e.message ||
            'Não foi possível carregar o produto.'
        );
    }
}


// ============================================================
// ABRIR ABA DE PERGUNTAS
// ============================================================

function abrirAbaPerguntas() {

    if (!produtoAtual) {
        return;
    }

    const url =
        window.location.origin +
        window.location.pathname +
        '?produto=' +
        encodeURIComponent(
            produtoAtual.id
        ) +
        '&pagina=perguntas';

    window.open(
        url,
        '_blank'
    );
}


// ============================================================
// ABRIR ABA DE AVALIAÇÕES
// ============================================================

function abrirAbaAvaliacoes() {

    if (!produtoAtual) {
        return;
    }

    const url =
        window.location.origin +
        window.location.pathname +
        '?produto=' +
        encodeURIComponent(
            produtoAtual.id
        ) +
        '&pagina=avaliacoes';

    window.open(
        url,
        '_blank'
    );
}


// ============================================================
// VOLTAR PARA CATÁLOGO
// ============================================================

function voltarCatalogo() {

    const home =
        document.getElementById(
            'view-home'
        );

    const produtoView =
        document.getElementById(
            'view-produto'
        );

    if (produtoView) {
        produtoView.style.display =
            'none';
    }

    if (home) {
        home.style.display =
            'block';
    }

    produtoAtual =
        null;

    const barraAdmin =
        document.getElementById(
            'barra-modo-admin'
        );

    if (barraAdmin) {
        barraAdmin.remove();
    }

    history.pushState(
        {},
        '',
        window.location.pathname
    );

    window.scrollTo(
        {
            top: 0,
            behavior: 'auto'
        }
    );
}


// ============================================================
// RENDER PRODUTO
// ============================================================

function renderProduto() {

    const p =
        produtoAtual;

    const layout =
        document.getElementById(
            'produto-layout'
        );

    if (
        !layout ||
        !p
    ) {
        return;
    }

    layout.innerHTML =
        '';

    const tituloArea =
        document.createElement(
            'div'
        );

    tituloArea.className =
        'pp-titulo-area';

    const titulo =
        document.createElement(
            'h1'
        );

    titulo.className =
        'pp-titulo';

    titulo.textContent =
        p.titulo ||
        '';

    tituloArea.appendChild(
        titulo
    );

    const categoria =
        document.createElement(
            'div'
        );

    categoria.className =
        'pp-categoria';

    categoria.textContent =
        p.linha ||
        '';

    tituloArea.appendChild(
        categoria
    );

    const resumoTopo =
        document.createElement(
            'div'
        );

    resumoTopo.className =
        'pp-avaliacao-resumo-topo';

    const resumoDados =
        p.avaliacao_resumo ||
        {
            media: 0,
            total: 0
        };

    const media =
        Number(
            resumoDados.media || 0
        );

    const totalAvaliacoes =
        Number(
            resumoDados.total || 0
        );

    const estrelasTopo =
        document.createElement(
            'span'
        );

    estrelasTopo.className =
        'pp-estrelas-topo';

    estrelasTopo.innerHTML =
        gerarEstrelas(
            media,
            'normal'
        );

    const numeroMedia =
        document.createElement(
            'span'
        );

    numeroMedia.className =
        'pp-media-topo';

    numeroMedia.textContent =
        totalAvaliacoes > 0
            ? media.toFixed(1)
            : 'Sem avaliações';

    const quantidadeMedia =
        document.createElement(
            'span'
        );

    quantidadeMedia.className =
        'pp-quantidade-topo';

    quantidadeMedia.textContent =
        totalAvaliacoes === 0
            ? ''
            : totalAvaliacoes === 1
                ? '(1 avaliação)'
                : '(' +
                  totalAvaliacoes +
                  ' avaliações)';

    resumoTopo.appendChild(
        estrelasTopo
    );

    resumoTopo.appendChild(
        numeroMedia
    );

    resumoTopo.appendChild(
        quantidadeMedia
    );

    tituloArea.appendChild(
        resumoTopo
    );

    layout.appendChild(
        tituloArea
    );

    // ========================================================
    // IMAGEM
    // ========================================================

    const imagemArea =
        document.createElement(
            'div'
        );

    imagemArea.className =
        'pp-imagem-area';

    const imagensDaCor =
        obterImagensDaCor(
            p,
            corAtual
        );

    const totalImagens =
        imagensDaCor.length;

    const contador =
        document.createElement(
            'span'
        );

    contador.className =
        'pp-contador';

    contador.id =
        'pp-contador';

    contador.textContent =
        totalImagens > 0
            ? `1 / ${totalImagens}`
            : '1 / 1';

    imagemArea.appendChild(
        contador
    );

    const imagem =
        document.createElement(
            'img'
        );

    imagem.id =
        'pp-img';

    imagem.className =
        'pp-imagem-principal';

    let caminhoImagemInicial =
        '';

    if (
        imagensDaCor.length > 0
    ) {

        const imagemPrincipal =
            imagensDaCor.find(
                item =>
                    item.principal === true
            );

        caminhoImagemInicial =
            (
                imagemPrincipal ||
                imagensDaCor[0]
            ).caminho;

    } else if (
        Array.isArray(
            p.imagens
        ) &&
        p.imagens.length > 0
    ) {

        const imagemPrincipal =
            p.imagens.find(
                item =>
                    item.principal === true
            );

        caminhoImagemInicial =
            (
                imagemPrincipal ||
                p.imagens[0]
            ).caminho;
    }

    if (
        caminhoImagemInicial
    ) {
        imagem.src =
            caminhoImagemInicial;
    }

    imagem.alt =
        p.titulo ||
        'Produto';

    imagemArea.appendChild(
        imagem
    );

    const favorito =
        document.createElement(
            'button'
        );

    favorito.type =
        'button';

    favorito.className =
        'pp-fav' +
        (
            isFavorito(
                p.id
            )
                ? ' favoritado'
                : ''
        );

    favorito.dataset.produtoId =
        p.id;

    favorito.textContent =
        isFavorito(
            p.id
        )
            ? '♥'
            : '♡';

    favorito.setAttribute(
        'aria-label',
        'Adicionar aos favoritos'
    );

    favorito.addEventListener(
        'click',
        event => {

            event.stopPropagation();

            toggleFavorito(
                p.id
            );
        }
    );

    imagemArea.appendChild(
        favorito
    );

    const compartilhar =
        document.createElement(
            'button'
        );

    compartilhar.type =
        'button';

    compartilhar.className =
        'pp-compartilhar';

    compartilhar.textContent =
        '↗';

    compartilhar.setAttribute(
        'aria-label',
        'Compartilhar produto'
    );

    compartilhar.addEventListener(
        'click',
        event => {

            event.stopPropagation();

            compartilharProduto();
        }
    );

    imagemArea.appendChild(
        compartilhar
    );

    if (
        totalImagens > 1
    ) {

        const setaEsquerda =
            document.createElement(
                'button'
            );

        setaEsquerda.type =
            'button';

        setaEsquerda.className =
            'pp-seta esq';

        setaEsquerda.textContent =
            '‹';

        setaEsquerda.addEventListener(
            'click',
            event => {

                event.stopPropagation();

                mudarImagem(
                    -1
                );
            }
        );

        const setaDireita =
            document.createElement(
                'button'
            );

        setaDireita.type =
            'button';

        setaDireita.className =
            'pp-seta dir';

        setaDireita.textContent =
            '›';

        setaDireita.addEventListener(
            'click',
            event => {

                event.stopPropagation();

                mudarImagem(
                    1
                );
            }
        );

        imagemArea.appendChild(
            setaEsquerda
        );

        imagemArea.appendChild(
            setaDireita
        );
    }

    layout.appendChild(
        imagemArea
    );

    // ========================================================
    // CORES
    // ========================================================

    const areaCores =
        document.createElement(
            'div'
        );

    if (
        Array.isArray(
            p.cores
        ) &&
        p.cores.length > 0
    ) {

        const tituloCor =
            document.createElement(
                'div'
            );

        tituloCor.className =
            'pp-cor';

        tituloCor.id =
            'pp-cor';

        tituloCor.textContent =
            'Cor: ' +
            (
                p.cores[
                    corAtual
                ].nome ||
                ''
            );

        areaCores.appendChild(
            tituloCor
        );

        const containerCores =
            document.createElement(
                'div'
            );

        containerCores.className =
            'pp-cores';

        p.cores.forEach(
            (
                cor,
                indice
            ) => {

                const item =
                    document.createElement(
                        'div'
                    );

                item.className =
                    'pp-cor-item' +
                    (
                        indice === corAtual
                            ? ' selecionada'
                            : ''
                    );

                const thumb =
                    document.createElement(
                        'div'
                    );

                thumb.className =
                    'pp-cor-thumb';

                const imagensCorAtual =
                    obterImagensDaCor(
                        p,
                        indice
                    );

                if (
                    imagensCorAtual.length > 0
                ) {

                    const imagemPrincipal =
                        imagensCorAtual.find(
                            img =>
                                img.principal ===
                                true
                        );

                    const imgCor =
                        document.createElement(
                            'img'
                        );

                    imgCor.src =
                        (
                            imagemPrincipal ||
                            imagensCorAtual[0]
                        ).caminho;

                    imgCor.alt =
                        cor.nome ||
                        'Cor';

                    imgCor.loading =
                        'lazy';

                    thumb.appendChild(
                        imgCor
                    );
                }

                const nomeCor =
                    document.createElement(
                        'div'
                    );

                nomeCor.className =
                    'pp-cor-nome';

                nomeCor.textContent =
                    cor.nome ||
                    '';

                item.appendChild(
                    thumb
                );

                item.appendChild(
                    nomeCor
                );

                item.addEventListener(
                    'click',
                    () =>
                        mudarCor(
                            indice
                        )
                );

                containerCores.appendChild(
                    item
                );
            }
        );

        areaCores.appendChild(
            containerCores
        );
    }

    layout.appendChild(
        areaCores
    );

    // ========================================================
    // ORÇAMENTO
    // ========================================================

    const orcamento =
        document.createElement(
            'div'
        );

    orcamento.className =
        'pp-bloco pp-orcamento';

    const tituloOrcamento =
        document.createElement(
            'h3'
        );

    tituloOrcamento.textContent =
        'Solicite seu orçamento';

    orcamento.appendChild(
        tituloOrcamento
    );

    if (
        p.preco !== null &&
        p.preco !== undefined &&
        p.preco !== ''
    ) {

        const preco =
            document.createElement(
                'div'
            );

        preco.className =
            'pp-preco';

        preco.textContent =
            formatarPreco(
                p.preco
            );

        orcamento.appendChild(
            preco
        );

        if (
            p.parcelamento
        ) {

            const parcelas =
                document.createElement(
                    'div'
                );

            parcelas.className =
                'pp-parcelamento';

            parcelas.textContent =
                p.parcelamento;

            orcamento.appendChild(
                parcelas
            );
        }
    }

    const botaoOrcamento =
        document.createElement(
            'button'
        );

    botaoOrcamento.type =
        'button';

    botaoOrcamento.className =
        'btn-solicitar';

    botaoOrcamento.textContent =
        'SOLICITAR ORÇAMENTO';

    botaoOrcamento.addEventListener(
        'click',
        abrirModalOrcamento
    );

    orcamento.appendChild(
        botaoOrcamento
    );

    layout.appendChild(
        orcamento
    );

    // ========================================================
    // PRODUTOS RELACIONADOS
    // ========================================================

    const relacionados =
        document.createElement(
            'div'
        );

    relacionados.className =
        'pp-bloco';

    const tituloRelacionados =
        document.createElement(
            'h3'
        );

    tituloRelacionados.textContent =
        'Produtos relacionados';

    relacionados.appendChild(
        tituloRelacionados
    );

    if (
        Array.isArray(
            p.relacionados
        ) &&
        p.relacionados.length > 0
    ) {

        const gridRelacionados =
            document.createElement(
                'div'
            );

        gridRelacionados.className =
            'relacionados-grid';

        p.relacionados.forEach(
            relacionado => {

                const card =
                    document.createElement(
                        'div'
                    );

                card.className =
                    'rel-card';

                card.dataset.id =
                    relacionado.id;

                const areaImagemRel =
                    document.createElement(
                        'div'
                    );

                areaImagemRel.className =
                    'rel-imagem-area';

                if (
                    relacionado.imagem_principal
                ) {

                    const imgRel =
                        document.createElement(
                            'img'
                        );

                    imgRel.src =
                        relacionado.imagem_principal;

                    imgRel.alt =
                        relacionado.titulo ||
                        'Produto relacionado';

                    imgRel.loading =
                        'lazy';

                    areaImagemRel.appendChild(
                        imgRel
                    );

                } else {

                    const placeholder =
                        document.createElement(
                            'div'
                        );

                    placeholder.className =
                        'rel-imagem-placeholder';

                    placeholder.textContent =
                        '🪑';

                    areaImagemRel.appendChild(
                        placeholder
                    );
                }

                const favoritoRel =
                    document.createElement(
                        'button'
                    );

                favoritoRel.type =
                    'button';

                favoritoRel.className =
                    'rel-fav' +
                    (
                        isFavorito(
                            relacionado.id
                        )
                            ? ' favoritado'
                            : ''
                    );

                favoritoRel.dataset.produtoId =
                    relacionado.id;

                favoritoRel.textContent =
                    isFavorito(
                        relacionado.id
                    )
                        ? '♥'
                        : '♡';

                favoritoRel.addEventListener(
                    'click',
                    event => {

                        event.stopPropagation();

                        toggleFavorito(
                            relacionado.id
                        );
                    }
                );

                areaImagemRel.appendChild(
                    favoritoRel
                );

                card.appendChild(
                    areaImagemRel
                );

                const infoRel =
                    document.createElement(
                        'div'
                    );

                infoRel.className =
                    'rel-info';

                const linhaRel =
                    document.createElement(
                        'div'
                    );

                linhaRel.className =
                    'rel-categoria';

                linhaRel.textContent =
                    relacionado.linha ||
                    '';

                const nomeRel =
                    document.createElement(
                        'div'
                    );

                nomeRel.className =
                    'rel-nome';

                nomeRel.textContent =
                    relacionado.titulo ||
                    '';

                infoRel.appendChild(
                    linhaRel
                );

                infoRel.appendChild(
                    nomeRel
                );

                if (
                    relacionado.preco !== null &&
                    relacionado.preco !== undefined &&
                    relacionado.preco !== ''
                ) {

                    const precoRel =
                        document.createElement(
                            'div'
                        );

                    precoRel.className =
                        'rel-preco';

                    precoRel.textContent =
                        formatarPreco(
                            relacionado.preco
                        );

                    infoRel.appendChild(
                        precoRel
                    );

                    if (
                        relacionado.parcelamento
                    ) {

                        const parcelasRel =
                            document.createElement(
                                'div'
                            );

                        parcelasRel.className =
                            'rel-parcelas';

                        parcelasRel.textContent =
                            relacionado.parcelamento;

                        infoRel.appendChild(
                            parcelasRel
                        );
                    }
                }

                card.appendChild(
                    infoRel
                );

                card.addEventListener(
                    'click',
                    () =>
                        abrirProduto(
                            relacionado.id
                        )
                );

                gridRelacionados.appendChild(
                    card
                );
            }
        );

        relacionados.appendChild(
            gridRelacionados
        );

    } else {

        const vazio =
            document.createElement(
                'p'
            );

        vazio.className =
            'sem-conteudo';

        vazio.textContent =
            'Nenhum produto relacionado disponível.';

        relacionados.appendChild(
            vazio
        );
    }

    layout.appendChild(
        relacionados
    );

    // ========================================================
    // CARACTERÍSTICAS
    // ========================================================

    const blocoCaracteristicas =
        document.createElement(
            'div'
        );

    blocoCaracteristicas.className =
        'pp-bloco';

    const tituloCaracteristicas =
        document.createElement(
            'h3'
        );

    tituloCaracteristicas.textContent =
        'Características do produto';

    blocoCaracteristicas.appendChild(
        tituloCaracteristicas
    );

    const c =
        p.caracteristicas ||
        {};

    const subtituloPrincipais =
        document.createElement(
            'div'
        );

    subtituloPrincipais.className =
        'carac-sub';

    subtituloPrincipais.textContent =
        'Características Principais';

    blocoCaracteristicas.appendChild(
        subtituloPrincipais
    );

    const tabelaPrincipais =
        document.createElement(
            'table'
        );

    tabelaPrincipais.className =
        'carac-tabela';

    adicionarLinhaTabela(
        tabelaPrincipais,
        'Modelo',
        c.modelo ||
        '—'
    );

    const linhaCor =
        document.createElement(
            'tr'
        );

    const chaveCor =
        document.createElement(
            'td'
        );

    chaveCor.textContent =
        'Cor';

    const valorCor =
        document.createElement(
            'td'
        );

    valorCor.id =
        'carac-cor';

    valorCor.textContent =
        obterNomeCorAtual();

    linhaCor.appendChild(
        chaveCor
    );

    linhaCor.appendChild(
        valorCor
    );

    tabelaPrincipais.appendChild(
        linhaCor
    );

    blocoCaracteristicas.appendChild(
        tabelaPrincipais
    );

    const subtituloDimensoes =
        document.createElement(
            'div'
        );

    subtituloDimensoes.className =
        'carac-sub';

    subtituloDimensoes.textContent =
        'Dimensões';

    blocoCaracteristicas.appendChild(
        subtituloDimensoes
    );

    const tabelaDimensoes =
        document.createElement(
            'table'
        );

    tabelaDimensoes.className =
        'carac-tabela';

    adicionarLinhaTabela(
        tabelaDimensoes,
        'Largura x Comprimento',
        (
            c.largura &&
            c.comprimento
        )
            ? c.largura +
              ' x ' +
              c.comprimento
            : '—'
    );

    const linhaAltura =
        document.createElement(
            'tr'
        );

    const chaveAltura =
        document.createElement(
            'td'
        );

    chaveAltura.textContent =
        'Altura';

    const valorAltura =
        document.createElement(
            'td'
        );

    valorAltura.id =
        'carac-altura';

    valorAltura.textContent =
        obterAlturaAtual();

    linhaAltura.appendChild(
        chaveAltura
    );

    linhaAltura.appendChild(
        valorAltura
    );

    tabelaDimensoes.appendChild(
        linhaAltura
    );

    blocoCaracteristicas.appendChild(
        tabelaDimensoes
    );

    const subtituloOutras =
        document.createElement(
            'div'
        );

    subtituloOutras.className =
        'carac-sub';

    subtituloOutras.textContent =
        'Outras características';

    blocoCaracteristicas.appendChild(
        subtituloOutras
    );

    const tabelaOutras =
        document.createElement(
            'table'
        );

    tabelaOutras.className =
        'carac-tabela';

    adicionarLinhaTabela(
        tabelaOutras,
        'Outros',
        c.outros ||
        '—'
    );

    adicionarLinhaTabela(
        tabelaOutras,
        'Quantidade de assentos',
        c.quantidade_assentos ||
        '—'
    );

    adicionarLinhaTabela(
        tabelaOutras,
        'Compartimento para livros',
        c.compartimento_livros ||
        '—'
    );

    blocoCaracteristicas.appendChild(
        tabelaOutras
    );

    const subtituloDescricao =
        document.createElement(
            'div'
        );

    subtituloDescricao.className =
        'carac-sub';

    subtituloDescricao.textContent =
        'Descrição';

    blocoCaracteristicas.appendChild(
        subtituloDescricao
    );

    const textoDescricao =
        document.createElement(
            'p'
        );

    textoDescricao.id =
        'descricao-cor-atual';

    textoDescricao.className =
        'descricao-produto-texto';

    textoDescricao.textContent =
        obterDescricaoCorAtual();

    blocoCaracteristicas.appendChild(
        textoDescricao
    );

    layout.appendChild(
        blocoCaracteristicas
    );

    // ========================================================
    // PERGUNTAS E RESPOSTAS
    // ========================================================

    const perguntas =
        document.createElement(
            'div'
        );

    perguntas.className =
        'pp-bloco';

    perguntas.id =
        'bloco-perguntas';

    const tituloPerguntas =
        document.createElement(
            'h3'
        );

    tituloPerguntas.textContent =
        'Perguntas e Respostas';

    perguntas.appendChild(
        tituloPerguntas
    );

    /*
     * O campo para enviar pergunta continua
     * disponível para clientes e administradores.
     */

    const formularioPergunta =
        document.createElement(
            'div'
        );

    formularioPergunta.className =
        'formulario-pergunta';

    const campoPergunta =
        document.createElement(
            'input'
        );

    campoPergunta.type =
        'text';

    campoPergunta.className =
        'pergunta-input';

    campoPergunta.placeholder =
        'Digite sua pergunta';

    const botaoEnviarPergunta =
        document.createElement(
            'button'
        );

    botaoEnviarPergunta.type =
        'button';

    botaoEnviarPergunta.className =
        'btn-perguntar';

    botaoEnviarPergunta.textContent =
        'Enviar';

    formularioPergunta.appendChild(
        campoPergunta
    );

    formularioPergunta.appendChild(
        botaoEnviarPergunta
    );

    perguntas.appendChild(
        formularioPergunta
    );

    botaoEnviarPergunta.addEventListener(
        'click',
        () =>
            enviarPergunta(
                campoPergunta,
                botaoEnviarPergunta
            )
    );

    campoPergunta.addEventListener(
        'keydown',
        event => {

            if (
                event.key ===
                'Enter'
            ) {

                event.preventDefault();

                enviarPergunta(
                    campoPergunta,
                    botaoEnviarPergunta
                );
            }
        }
    );

    const botaoVerPerguntas =
        document.createElement(
            'button'
        );

    botaoVerPerguntas.type =
        'button';

    botaoVerPerguntas.className =
        'btn-ver-perguntas';

    botaoVerPerguntas.textContent =
        'Ver Todas as Perguntas';

    botaoVerPerguntas.addEventListener(
        'click',
        abrirAbaPerguntas
    );

    perguntas.appendChild(
        botaoVerPerguntas
    );

    layout.appendChild(
        perguntas
    );

    // ========================================================
    // AVALIAÇÕES
    // ========================================================

    const avaliacoes =
        document.createElement(
            'div'
        );

    avaliacoes.className =
        'pp-bloco';

    avaliacoes.id =
        'bloco-avaliacoes';

    const tituloAvaliacoes =
        document.createElement(
            'h3'
        );

    tituloAvaliacoes.textContent =
        'Avaliações do produto';

    avaliacoes.appendChild(
        tituloAvaliacoes
    );

    const resumoAvaliacoes =
        p.avaliacao_resumo ||
        {
            media: 0,
            total: 0
        };

    const mediaAvaliacoes =
        Number(
            resumoAvaliacoes.media || 0
        );

    const totalAvaliacoesProduto =
        Number(
            resumoAvaliacoes.total || 0
        );

    const resumoAvaliacaoProduto =
        document.createElement(
            'div'
        );

    resumoAvaliacaoProduto.className =
        'avaliacao-resumo-produto';

    if (
        totalAvaliacoesProduto > 0
    ) {

        const estrelas =
            document.createElement(
                'span'
            );

        estrelas.className =
            'avaliacao-resumo-estrelas';

        estrelas.innerHTML =
            gerarEstrelas(
                mediaAvaliacoes,
                'normal'
            );

        const mediaTexto =
            document.createElement(
                'span'
            );

        mediaTexto.className =
            'avaliacao-resumo-media';

        mediaTexto.textContent =
            mediaAvaliacoes.toFixed(1);

        const quantidadeTexto =
            document.createElement(
                'span'
            );

        quantidadeTexto.className =
            'avaliacao-resumo-quantidade';

        quantidadeTexto.textContent =
            totalAvaliacoesProduto === 1
                ? '(1 avaliação)'
                : '(' +
                  totalAvaliacoesProduto +
                  ' avaliações)';

        resumoAvaliacaoProduto.appendChild(
            estrelas
        );

        resumoAvaliacaoProduto.appendChild(
            mediaTexto
        );

        resumoAvaliacaoProduto.appendChild(
            quantidadeTexto
        );

    } else {

        const sem =
            document.createElement(
                'span'
            );

        sem.className =
            'sem-avaliacoes-resumo';

        sem.textContent =
            'Sem avaliações ainda.';

        resumoAvaliacaoProduto.appendChild(
            sem
        );
    }

    avaliacoes.appendChild(
        resumoAvaliacaoProduto
    );

    const botaoAvaliar =
        document.createElement(
            'button'
        );

    botaoAvaliar.type =
        'button';

    botaoAvaliar.className =
        'btn-avaliar';

    botaoAvaliar.textContent =
        'Avaliar produto';

    botaoAvaliar.addEventListener(
        'click',
        abrirAbaAvaliacoes
    );

    avaliacoes.appendChild(
        botaoAvaliar
    );

    layout.appendChild(
        avaliacoes
    );

    atualizarBotoesFavorito();

    atualizarDescricaoCorNaTela();

    atualizarModoAdministrador();
}


// ============================================================
// RENDER PÁGINA DE PERGUNTAS
// ============================================================

function renderPaginaPerguntas() {

    const p =
        produtoAtual;

    const layout =
        document.getElementById(
            'produto-layout'
        );

    if (
        !layout ||
        !p
    ) {
        return;
    }

    layout.innerHTML =
        '';

    const pagina =
        document.createElement(
            'div'
        );

    pagina.className =
        'pagina-interacoes';

    const botaoVoltar =
        document.createElement(
            'button'
        );

    botaoVoltar.type =
        'button';

    botaoVoltar.className =
        'btn-voltar-catalogo';

    botaoVoltar.textContent =
        '← Voltar ao produto';

    botaoVoltar.addEventListener(
        'click',
        () => {

            const url =
                window.location.pathname +
                '?produto=' +
                encodeURIComponent(
                    p.id
                );

            window.location.href =
                url;
        }
    );

    pagina.appendChild(
        botaoVoltar
    );

    const titulo =
        document.createElement(
            'h1'
        );

    titulo.className =
        'pp-titulo';

    titulo.textContent =
        'Perguntas e Respostas';

    pagina.appendChild(
        titulo
    );

    const produtoNome =
        document.createElement(
            'p'
        );

    produtoNome.className =
        'pp-categoria';

    produtoNome.textContent =
        p.titulo ||
        'Produto';

    pagina.appendChild(
        produtoNome
    );

    const lista =
        document.createElement(
            'div'
        );

    lista.id =
        'lista-perguntas';

    lista.className =
        'lista-perguntas';

    pagina.appendChild(
        lista
    );

    renderPerguntas(
        p.perguntas || [],
        lista
    );

    layout.appendChild(
        pagina
    );

    atualizarModoAdministrador();
}


// ============================================================
// RENDER PÁGINA DE AVALIAÇÕES
// ============================================================

function renderPaginaAvaliacoes() {

    const p =
        produtoAtual;

    const layout =
        document.getElementById(
            'produto-layout'
        );

    if (
        !layout ||
        !p
    ) {
        return;
    }

    layout.innerHTML =
        '';

    const pagina =
        document.createElement(
            'div'
        );

    pagina.className =
        'pagina-interacoes';

    const botaoVoltar =
        document.createElement(
            'button'
        );

    botaoVoltar.type =
        'button';

    botaoVoltar.className =
        'btn-voltar-catalogo';

    botaoVoltar.textContent =
        '← Voltar ao produto';

    botaoVoltar.addEventListener(
        'click',
        () => {

            const url =
                window.location.pathname +
                '?produto=' +
                encodeURIComponent(
                    p.id
                );

            window.location.href =
                url;
        }
    );

    pagina.appendChild(
        botaoVoltar
    );

    const titulo =
        document.createElement(
            'h1'
        );

    titulo.className =
        'pp-titulo';

    titulo.textContent =
        'Avaliações do produto';

    pagina.appendChild(
        titulo
    );

    const produtoNome =
        document.createElement(
            'p'
        );

    produtoNome.className =
        'pp-categoria';

    produtoNome.textContent =
        p.titulo ||
        'Produto';

    pagina.appendChild(
        produtoNome
    );

    const resumo =
        p.avaliacao_resumo ||
        {
            media: 0,
            total: 0,
            distribuicao: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            }
        };

    const total =
        Number(
            resumo.total || 0
        );

    const media =
        Number(
            resumo.media || 0
        );

    const areaResumo =
        document.createElement(
            'div'
        );

    areaResumo.className =
        'avaliacoes-resumo';

    const esquerda =
        document.createElement(
            'div'
        );

    esquerda.className =
        'avaliacoes-resumo-esquerda';

    const mediaGrande =
        document.createElement(
            'div'
        );

    mediaGrande.className =
        'avaliacoes-media-grande';

    mediaGrande.textContent =
        total > 0
            ? media.toFixed(1)
            : '0,0';

    const estrelasMedia =
        document.createElement(
            'div'
        );

    estrelasMedia.className =
        'avaliacoes-estrelas-media';

    estrelasMedia.innerHTML =
        gerarEstrelas(
            media,
            'grande'
        );

    const totalMedia =
        document.createElement(
            'div'
        );

    totalMedia.className =
        'avaliacoes-total-media';

    totalMedia.textContent =
        total === 0
            ? 'Sem avaliações ainda.'
            : total === 1
                ? '1 avaliação'
                : total +
                  ' avaliações';

    esquerda.appendChild(
        mediaGrande
    );

    esquerda.appendChild(
        estrelasMedia
    );

    esquerda.appendChild(
        totalMedia
    );

    const distribuicao =
        document.createElement(
            'div'
        );

    distribuicao.className =
        'avaliacoes-distribuicao';

    for (
        let estrela = 5;
        estrela >= 1;
        estrela--
    ) {

        const quantidade =
            Number(
                resumo.distribuicao?.[
                    estrela
                ] || 0
            );

        const linha =
            document.createElement(
                'div'
            );

        linha.className =
            'avaliacao-distribuicao-linha';

        const label =
            document.createElement(
                'span'
            );

        label.className =
            'avaliacao-distribuicao-label';

        label.textContent =
            estrela +
            ' ★';

        const barra =
            document.createElement(
                'div'
            );

        barra.className =
            'avaliacao-distribuicao-barra';

        const preenchimento =
            document.createElement(
                'span'
            );

        preenchimento.className =
            'avaliacao-distribuicao-preenchimento';

        const percentual =
            total > 0
                ? (
                    quantidade /
                    total
                ) * 100
                : 0;

        preenchimento.style.width =
            percentual +
            '%';

        const quantidadeTexto =
            document.createElement(
                'span'
            );

        quantidadeTexto.className =
            'avaliacao-distribuicao-quantidade';

        quantidadeTexto.textContent =
            quantidade;

        barra.appendChild(
            preenchimento
        );

        linha.appendChild(
            label
        );

        linha.appendChild(
            barra
        );

        linha.appendChild(
            quantidadeTexto
        );

        distribuicao.appendChild(
            linha
        );
    }

    areaResumo.appendChild(
        esquerda
    );

    areaResumo.appendChild(
        distribuicao
    );

    pagina.appendChild(
        areaResumo
    );

    const botaoAvaliar =
        document.createElement(
            'button'
        );

    botaoAvaliar.type =
        'button';

    botaoAvaliar.className =
        'btn-avaliar';

    botaoAvaliar.textContent =
        'Avaliar produto';

    pagina.appendChild(
        botaoAvaliar
    );

    const formulario =
        document.createElement(
            'div'
        );

    formulario.className =
        'formulario-avaliacao';

    formulario.style.display =
        'none';

    const nome =
        document.createElement(
            'input'
        );

    nome.type =
        'text';

    nome.className =
        'avaliacao-nome';

    nome.placeholder =
        'Seu nome';

    formulario.appendChild(
        nome
    );

    const tituloEstrelas =
        document.createElement(
            'div'
        );

    tituloEstrelas.className =
        'avaliacao-estrelas-label';

    tituloEstrelas.textContent =
        'Sua nota *';

    formulario.appendChild(
        tituloEstrelas
    );

    const estrelasInput =
        document.createElement(
            'div'
        );

    estrelasInput.className =
        'avaliacao-estrelas-input';

    let notaSelecionada =
        0;

    const textoNota =
        document.createElement(
            'span'
        );

    textoNota.className =
        'avaliacao-nota-texto';

    textoNota.textContent =
        'Selecione de 1 a 5 estrelas';

    for (
        let nota = 1;
        nota <= 5;
        nota++
    ) {

        const estrela =
            criarBotaoEstrela(
                nota,
                false
            );

        estrela.addEventListener(
            'click',
            () => {

                notaSelecionada =
                    nota;

                estrelasInput
                    .querySelectorAll(
                        '.estrela-input'
                    )
                    .forEach(
                        item => {

                            const valor =
                                Number(
                                    item.dataset.nota
                                );

                            item.classList.toggle(
                                'selecionada',
                                valor <= nota
                            );
                        }
                    );

                textoNota.textContent =
                    nota +
                    (
                        nota === 1
                            ? ' estrela selecionada'
                            : ' estrelas selecionadas'
                    );
            }
        );

        estrelasInput.appendChild(
            estrela
        );
    }

    formulario.appendChild(
        estrelasInput
    );

    formulario.appendChild(
        textoNota
    );

    const comentario =
        document.createElement(
            'textarea'
        );

    comentario.className =
        'avaliacao-comentario';

    comentario.placeholder =
        'Conte o que achou do produto. Opcional se você enviar uma foto.';

    comentario.rows =
        5;

    formulario.appendChild(
        comentario
    );

    const fotoLabel =
        document.createElement(
            'label'
        );

    fotoLabel.className =
        'avaliacao-foto-label';

    fotoLabel.textContent =
        'Adicionar foto do produto (opcional)';

    const foto =
        document.createElement(
            'input'
        );

    foto.type =
        'file';

    foto.className =
        'avaliacao-foto';

    foto.accept =
        'image/*';

    fotoLabel.appendChild(
        foto
    );

    formulario.appendChild(
        fotoLabel
    );

    const preview =
        document.createElement(
            'div'
        );

    preview.className =
        'avaliacao-foto-preview';

    formulario.appendChild(
        preview
    );

    foto.addEventListener(
        'change',
        () => {

            preview.innerHTML =
                '';

            const arquivo =
                foto.files?.[0];

            if (!arquivo) {
                return;
            }

            if (
                !arquivo.type.startsWith(
                    'image/'
                )
            ) {

                foto.value =
                    '';

                return;
            }

            const imagem =
                document.createElement(
                    'img'
                );

            imagem.alt =
                'Pré-visualização da foto';

            const leitor =
                new FileReader();

            leitor.onload =
                evento => {

                    imagem.src =
                        evento.target.result;

                    preview.appendChild(
                        imagem
                    );
                };

            leitor.readAsDataURL(
                arquivo
            );
        }
    );

    const botaoEnviar =
        document.createElement(
            'button'
        );

    botaoEnviar.type =
        'button';

    botaoEnviar.className =
        'btn-avaliar';

    botaoEnviar.textContent =
        'Enviar avaliação';

    formulario.appendChild(
        botaoEnviar
    );

    pagina.appendChild(
        formulario
    );

    botaoAvaliar.addEventListener(
        'click',
        () => {

            formulario.style.display =
                formulario.style.display ===
                'none'
                    ? 'block'
                    : 'none';
        }
    );

    botaoEnviar.addEventListener(
        'click',
        () =>
            enviarAvaliacao(
                nome,
                notaSelecionada,
                comentario,
                foto,
                botaoEnviar
            )
    );

    const tituloLista =
        document.createElement(
            'h2'
        );

    tituloLista.textContent =
        'Avaliações';

    pagina.appendChild(
        tituloLista
    );

    const lista =
        document.createElement(
            'div'
        );

    lista.id =
        'lista-avaliacoes';

    lista.className =
        'lista-avaliacoes';

    renderAvaliacoes(
        p.avaliacoes || [],
        lista
    );

    pagina.appendChild(
        lista
    );

    layout.appendChild(
        pagina
    );

    atualizarModoAdministrador();
}


// ============================================================
// RENDER PERGUNTAS
// ============================================================

function renderPerguntas(
    lista,
    container
) {

    if (!container) {
        return;
    }

    container.innerHTML =
        '';

    if (
        !Array.isArray(
            lista
        ) ||
        lista.length === 0
    ) {

        const vazio =
            document.createElement(
                'div'
            );

        vazio.className =
            'sem-conteudo';

        vazio.textContent =
            'Ainda não há perguntas sobre este produto.';

        container.appendChild(
            vazio
        );

        return;
    }

    lista.forEach(
        pergunta => {

            const card =
                document.createElement(
                    'div'
                );

            card.className =
                'pergunta-card';

            const perguntaTexto =
                document.createElement(
                    'div'
                );

            perguntaTexto.className =
                'pergunta-texto';

            const prefixoPergunta =
                document.createElement(
                    'strong'
                );

            prefixoPergunta.textContent =
                'Pergunta';

            const texto =
                document.createElement(
                    'p'
                );

            texto.textContent =
                pergunta.pergunta ||
                '';

            const autor =
                document.createElement(
                    'span'
                );

            autor.className =
                'pergunta-autor';

            autor.textContent =
                (
                    pergunta.nome_cliente ||
                    'Cliente'
                ) +
                (
                    pergunta.criado_em
                        ? ' • ' +
                          formatarDataRelativa(
                              pergunta.criado_em
                          )
                        : ''
                );

            perguntaTexto.appendChild(
                prefixoPergunta
            );

            perguntaTexto.appendChild(
                texto
            );

            perguntaTexto.appendChild(
                autor
            );

            card.appendChild(
                perguntaTexto
            );

            if (
                pergunta.resposta
            ) {

                const resposta =
                    document.createElement(
                        'div'
                    );

                resposta.className =
                    'pergunta-resposta';

                const tituloResposta =
                    document.createElement(
                        'strong'
                    );

                tituloResposta.textContent =
                    'Resposta da Cortez Móveis';

                const textoResposta =
                    document.createElement(
                        'p'
                    );

                textoResposta.textContent =
                    pergunta.resposta;

                const dataResposta =
                    document.createElement(
                        'span'
                    );

                dataResposta.className =
                    'pergunta-resposta-data';

                dataResposta.textContent =
                    pergunta.respondida_em
                        ? formatarDataRelativa(
                            pergunta.respondida_em
                        )
                        : '';

                resposta.appendChild(
                    tituloResposta
                );

                resposta.appendChild(
                    textoResposta
                );

                resposta.appendChild(
                    dataResposta
                );

                card.appendChild(
                    resposta
                );

            } else if (
                administradorLogado
            ) {

                /*
                 * IMPORTANTE:
                 * somente administrador autenticado
                 * recebe a opção de responder.
                 */

                const areaAdminPergunta =
                    document.createElement(
                        'div'
                    );

                areaAdminPergunta.className =
                    'pergunta-admin-acoes';

                areaAdminPergunta.setAttribute(
                    'data-apenas-admin',
                    'true'
                );

                const botaoResponder =
                    document.createElement(
                        'button'
                    );

                botaoResponder.type =
                    'button';

                botaoResponder.className =
                    'btn-responder';

                botaoResponder.textContent =
                    'Responder';

                botaoResponder.addEventListener(
                    'click',
                    () =>
                        abrirCampoResposta(
                            pergunta,
                            card
                        )
                );

                areaAdminPergunta.appendChild(
                    botaoResponder
                );

                card.appendChild(
                    areaAdminPergunta
                );
            }

            container.appendChild(
                card
            );
        }
    );

    atualizarModoAdministrador();
}


// ============================================================
// ABRIR CAMPO DE RESPOSTA
// ============================================================

function abrirCampoResposta(
    pergunta,
    card
) {

    if (
        !administradorLogado
    ) {

        alert(
            'Somente administradores podem responder perguntas.'
        );

        return;
    }

    if (
        card.querySelector(
            '.campo-resposta'
        )
    ) {
        return;
    }

    const area =
        document.createElement(
            'div'
        );

    area.className =
        'campo-resposta';

    const campo =
        document.createElement(
            'textarea'
        );

    campo.className =
        'resposta-input';

    campo.placeholder =
        'Digite sua resposta...';

    campo.rows =
        4;

    const botaoEnviar =
        document.createElement(
            'button'
        );

    botaoEnviar.type =
        'button';

    botaoEnviar.className =
        'btn-enviar-resposta';

    botaoEnviar.textContent =
        'Enviar resposta';

    area.appendChild(
        campo
    );

    area.appendChild(
        botaoEnviar
    );

    card.appendChild(
        area
    );

    botaoEnviar.addEventListener(
        'click',
        async () => {

            const resposta =
                campo.value.trim();

            if (!resposta) {

                alert(
                    'Digite uma resposta.'
                );

                campo.focus();

                return;
            }

            const textoOriginal =
                botaoEnviar.textContent;

            botaoEnviar.disabled =
                true;

            botaoEnviar.textContent =
                'Enviando...';

            try {

                /*
                 * O backend continua sendo responsável
                 * por confirmar a autenticação.
                 */

                const resultado =
                    await api(
                        '/api/produtos/' +
                        produtoAtual.id +
                        '/perguntas/' +
                        pergunta.id +
                        '/responder',
                        {
                            method: 'PUT',
                            body:
                                JSON.stringify({
                                    resposta
                                })
                        }
                    );

                if (
                    resultado &&
                    resultado.pergunta
                ) {

                    if (
                        !Array.isArray(
                            produtoAtual.perguntas
                        )
                    ) {

                        produtoAtual.perguntas =
                            [];
                    }

                    const indice =
                        produtoAtual.perguntas.findIndex(
                            item =>
                                Number(
                                    item.id
                                ) ===
                                Number(
                                    pergunta.id
                                )
                        );

                    if (
                        indice !== -1
                    ) {

                        produtoAtual.perguntas[
                            indice
                        ] =
                            resultado.pergunta;

                    } else {

                        produtoAtual.perguntas.unshift(
                            resultado.pergunta
                        );
                    }
                }

                renderPerguntas(
                    produtoAtual.perguntas,
                    document.getElementById(
                        'lista-perguntas'
                    )
                );

                alert(
                    'Resposta enviada com sucesso.'
                );

            } catch (e) {

                console.error(
                    'Erro ao responder pergunta:',
                    e
                );

                /*
                 * Se a sessão tiver expirado,
                 * removemos o modo administrativo.
                 */

                if (
                    e.message &&
                    (
                        e.message.includes(
                            'não autenticado'
                        ) ||
                        e.message.includes(
                            'autentic'
                        ) ||
                        e.message.includes(
                            'sessão'
                        )
                    )
                ) {

                    administradorLogado =
                        false;

                    dadosAdministrador =
                        null;

                    atualizarModoAdministrador();

                    renderPerguntas(
                        produtoAtual.perguntas || [],
                        document.getElementById(
                            'lista-perguntas'
                        )
                    );
                }

                alert(
                    e.message ||
                    'Não foi possível enviar a resposta.'
                );

            } finally {

                botaoEnviar.disabled =
                    false;

                botaoEnviar.textContent =
                    textoOriginal;
            }
        }
    );
}


// ============================================================
// RENDER AVALIAÇÕES
// ============================================================

function renderAvaliacoes(
    lista,
    container
) {

    if (!container) {
        return;
    }

    container.innerHTML =
        '';

    if (
        !Array.isArray(
            lista
        ) ||
        lista.length === 0
    ) {

        const vazio =
            document.createElement(
                'div'
            );

        vazio.className =
            'sem-conteudo';

        vazio.textContent =
            'Sem avaliações ainda.';

        container.appendChild(
            vazio
        );

        return;
    }

    lista.forEach(
        avaliacao => {

            const card =
                document.createElement(
                    'article'
                );

            card.className =
                'avaliacao-card';

            const cabecalho =
                document.createElement(
                    'div'
                );

            cabecalho.className =
                'avaliacao-card-cabecalho';

            const cliente =
                document.createElement(
                    'strong'
                );

            cliente.className =
                'avaliacao-cliente';

            cliente.textContent =
                avaliacao.cliente ||
                'Cliente';

            const data =
                document.createElement(
                    'span'
                );

            data.className =
                'avaliacao-data';

            data.textContent =
                avaliacao.criado_em
                    ? formatarDataRelativa(
                        avaliacao.criado_em
                    )
                    : '';

            cabecalho.appendChild(
                cliente
            );

            cabecalho.appendChild(
                data
            );

            const estrelas =
                document.createElement(
                    'div'
                );

            estrelas.className =
                'avaliacao-card-estrelas';

            estrelas.innerHTML =
                gerarEstrelas(
                    Number(
                        avaliacao.nota
                    ),
                    'normal'
                );

            card.appendChild(
                cabecalho
            );

            card.appendChild(
                estrelas
            );

            if (
                avaliacao.comentario
            ) {

                const comentario =
                    document.createElement(
                        'p'
                    );

                comentario.className =
                    'avaliacao-comentario-exibido';

                comentario.textContent =
                    avaliacao.comentario;

                card.appendChild(
                    comentario
                );
            }

            if (
                Array.isArray(
                    avaliacao.imagens
                ) &&
                avaliacao.imagens.length > 0
            ) {

                const galeria =
                    document.createElement(
                        'div'
                    );

                galeria.className =
                    'avaliacao-galeria';

                avaliacao.imagens.forEach(
                    imagem => {

                        if (
                            !imagem ||
                            !imagem.caminho
                        ) {
                            return;
                        }

                        const img =
                            document.createElement(
                                'img'
                            );

                        img.src =
                            imagem.caminho;

                        img.alt =
                            'Foto enviada na avaliação';

                        img.loading =
                            'lazy';

                        galeria.appendChild(
                            img
                        );
                    }
                );

                card.appendChild(
                    galeria
                );
            }

            if (
                avaliacao.resposta_vendedor
            ) {

                const resposta =
                    document.createElement(
                        'div'
                    );

                resposta.className =
                    'avaliacao-resposta';

                const respostaTitulo =
                    document.createElement(
                        'strong'
                    );

                respostaTitulo.textContent =
                    'Resposta da Cortez Móveis';

                const respostaTexto =
                    document.createElement(
                        'p'
                    );

                respostaTexto.textContent =
                    avaliacao.resposta_vendedor;

                resposta.appendChild(
                    respostaTitulo
                );

                resposta.appendChild(
                    respostaTexto
                );

                card.appendChild(
                    resposta
                );
            }

            container.appendChild(
                card
            );
        }
    );
}


// ============================================================
// ENVIAR PERGUNTA
// ============================================================

async function enviarPergunta(
    campoPergunta,
    botao
) {

    if (!produtoAtual) {
        return;
    }

    const pergunta =
        campoPergunta.value.trim();

    if (!pergunta) {

        alert(
            'Digite sua pergunta.'
        );

        campoPergunta.focus();

        return;
    }

    const textoOriginal =
        botao.textContent;

    botao.disabled =
        true;

    botao.textContent =
        'Enviando...';

    try {

        const resultado =
            await api(
                '/api/produtos/' +
                produtoAtual.id +
                '/perguntas',
                {
                    method: 'POST',

                    body:
                        JSON.stringify({
                            nome_cliente:
                                'Cliente',

                            pergunta
                        })
                }
            );

        if (
            !Array.isArray(
                produtoAtual.perguntas
            )
        ) {

            produtoAtual.perguntas =
                [];
        }

        if (
            resultado &&
            resultado.pergunta
        ) {

            produtoAtual.perguntas.unshift(
                resultado.pergunta
            );
        }

        campoPergunta.value =
            '';

        alert(
            'Sua pergunta foi enviada com sucesso.'
        );

    } catch (e) {

        console.error(
            'Erro ao enviar pergunta:',
            e
        );

        alert(
            e.message ||
            'Não foi possível enviar sua pergunta.'
        );

    } finally {

        botao.disabled =
            false;

        botao.textContent =
            textoOriginal;
    }
}


// ============================================================
// ENVIAR AVALIAÇÃO
// ============================================================

async function enviarAvaliacao(
    campoNome,
    nota,
    campoComentario,
    campoFoto,
    botao
) {

    if (!produtoAtual) {
        return;
    }

    const nome =
        campoNome.value.trim();

    const comentario =
        campoComentario.value.trim();

    const arquivo =
        campoFoto.files?.[0] ||
        null;

    if (!nota) {

        alert(
            'A quantidade de estrelas é obrigatória.'
        );

        return;
    }

    if (
        !comentario &&
        !arquivo
    ) {

        alert(
            'Escreva o que achou do produto ou envie uma foto.'
        );

        return;
    }

    if (
        arquivo &&
        !comentario
    ) {

        alert(
            'O envio de avaliação somente com foto será ativado junto ao upload de imagens. Por enquanto, escreva também um comentário.'
        );

        return;
    }

    const textoOriginal =
        botao.textContent;

    botao.disabled =
        true;

    botao.textContent =
        'Enviando...';

    try {

        const resultado =
            await api(
                '/api/produtos/' +
                produtoAtual.id +
                '/avaliacoes',
                {
                    method: 'POST',

                    body:
                        JSON.stringify({
                            cliente:
                                nome ||
                                'Cliente',

                            nota:
                                Number(nota),

                            comentario:
                                comentario ||
                                null,

                            imagens:
                                []
                        })
                }
            );

        produtoAtual.avaliacao_resumo =
            resultado.resumo ||
            produtoAtual.avaliacao_resumo;

        if (
            !Array.isArray(
                produtoAtual.avaliacoes
            )
        ) {

            produtoAtual.avaliacoes =
                [];
        }

        if (
            resultado.avaliacao
        ) {

            produtoAtual.avaliacoes.unshift(
                resultado.avaliacao
            );
        }

        const lista =
            document.getElementById(
                'lista-avaliacoes'
            );

        renderAvaliacoes(
            produtoAtual.avaliacoes,
            lista
        );

        atualizarResumoAvaliacoesNaTela();

        campoNome.value =
            '';

        campoComentario.value =
            '';

        campoFoto.value =
            '';

        const preview =
            document.querySelector(
                '.avaliacao-foto-preview'
            );

        if (preview) {
            preview.innerHTML =
                '';
        }

        document
            .querySelectorAll(
                '.estrela-input'
            )
            .forEach(
                estrela =>
                    estrela.classList.remove(
                        'selecionada'
                    )
            );

        alert(
            'Sua avaliação foi enviada com sucesso.'
        );

    } catch (e) {

        console.error(
            'Erro ao enviar avaliação:',
            e
        );

        alert(
            e.message ||
            'Não foi possível enviar sua avaliação.'
        );

    } finally {

        botao.disabled =
            false;

        botao.textContent =
            textoOriginal;
    }
}


// ============================================================
// ATUALIZAR RESUMO DAS AVALIAÇÕES
// ============================================================

function atualizarResumoAvaliacoesNaTela() {

    if (!produtoAtual) {
        return;
    }

    const resumo =
        produtoAtual.avaliacao_resumo ||
        {
            media: 0,
            total: 0
        };

    const topoEstrelas =
        document.querySelector(
            '.pp-estrelas-topo'
        );

    if (topoEstrelas) {

        topoEstrelas.innerHTML =
            gerarEstrelas(
                Number(
                    resumo.media || 0
                ),
                'normal'
            );
    }

    const topoMedia =
        document.querySelector(
            '.pp-media-topo'
        );

    if (topoMedia) {

        const total =
            Number(
                resumo.total || 0
            );

        topoMedia.textContent =
            total > 0
                ? Number(
                    resumo.media || 0
                ).toFixed(1)
                : 'Sem avaliações';
    }

    const topoQuantidade =
        document.querySelector(
            '.pp-quantidade-topo'
        );

    if (topoQuantidade) {

        const total =
            Number(
                resumo.total || 0
            );

        topoQuantidade.textContent =
            total === 0
                ? ''
                : total === 1
                    ? '(1 avaliação)'
                    : '(' +
                      total +
                      ' avaliações)';
    }
}


// ============================================================
// LINHA DE TABELA
// ============================================================

function adicionarLinhaTabela(
    tabela,
    coluna,
    valor
) {

    const linha =
        document.createElement(
            'tr'
        );

    const chave =
        document.createElement(
            'td'
        );

    chave.textContent =
        coluna;

    const conteudo =
        document.createElement(
            'td'
        );

    conteudo.textContent =
        valor;

    linha.appendChild(
        chave
    );

    linha.appendChild(
        conteudo
    );

    tabela.appendChild(
        linha
    );
}


// ============================================================
// IMAGENS DA COR
// ============================================================

function obterImagensDaCor(
    produto,
    indiceCor
) {

    if (
        !produto ||
        !Array.isArray(
            produto.cores
        ) ||
        !produto.cores[
            indiceCor
        ]
    ) {

        return [];
    }

    const cor =
        produto.cores[
            indiceCor
        ];

    return Array.isArray(
        cor.imagens
    )
        ? cor.imagens
        : [];
}


// ============================================================
// DESCRIÇÃO DA COR ATUAL
// ============================================================

function obterDescricaoCorAtual() {

    if (
        produtoAtual &&
        Array.isArray(
            produtoAtual.cores
        ) &&
        produtoAtual.cores[
            corAtual
        ]
    ) {

        const cor =
            produtoAtual.cores[
                corAtual
            ];

        if (
            cor.descricao !== null &&
            cor.descricao !== undefined &&
            String(
                cor.descricao
            ).trim() !== ''
        ) {

            return String(
                cor.descricao
            ).trim();
        }
    }

    return 'Descrição desta cor não informada.';
}


// ============================================================
// ATUALIZAR DESCRIÇÃO
// ============================================================

function atualizarDescricaoCorNaTela() {

    const elemento =
        document.getElementById(
            'descricao-cor-atual'
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        obterDescricaoCorAtual();
}


// ============================================================
// NOME DA COR
// ============================================================

function obterNomeCorAtual() {

    if (
        produtoAtual &&
        Array.isArray(
            produtoAtual.cores
        ) &&
        produtoAtual.cores[
            corAtual
        ]
    ) {

        return (
            produtoAtual.cores[
                corAtual
            ].nome ||
            '—'
        );
    }

    return '—';
}


// ============================================================
// ALTURA ATUAL
// ============================================================

function obterAlturaAtual() {

    if (
        produtoAtual &&
        Array.isArray(
            produtoAtual.cores
        ) &&
        produtoAtual.cores[
            corAtual
        ]
    ) {

        return (
            produtoAtual.cores[
                corAtual
            ].altura ||
            produtoAtual.caracteristicas?.altura ||
            '—'
        );
    }

    return (
        produtoAtual?.caracteristicas?.altura ||
        '—'
    );
}


// ============================================================
// MUDAR COR
// ============================================================

function mudarCor(
    indice
) {

    if (
        !produtoAtual ||
        !Array.isArray(
            produtoAtual.cores
        ) ||
        !produtoAtual.cores[
            indice
        ]
    ) {

        return;
    }

    corAtual =
        Number(indice);

    imgAtual =
        0;

    const imagens =
        obterImagensDaCor(
            produtoAtual,
            corAtual
        );

    const imagem =
        document.getElementById(
            'pp-img'
        );

    if (
        imagem &&
        imagens.length > 0
    ) {

        const imagemPrincipal =
            imagens.find(
                item =>
                    item.principal === true
            );

        imagem.src =
            (
                imagemPrincipal ||
                imagens[0]
            ).caminho;
    }

    const contador =
        document.getElementById(
            'pp-contador'
        );

    if (contador) {

        contador.textContent =
            imagens.length > 0
                ? `1 / ${imagens.length}`
                : '1 / 1';
    }

    const tituloCorAtual =
        document.getElementById(
            'pp-cor'
        );

    if (tituloCorAtual) {

        tituloCorAtual.textContent =
            'Cor: ' +
            obterNomeCorAtual();
    }

    atualizarDescricaoCorNaTela();

    const caracCor =
        document.getElementById(
            'carac-cor'
        );

    if (caracCor) {

        caracCor.textContent =
            obterNomeCorAtual();
    }

    const caracAltura =
        document.getElementById(
            'carac-altura'
        );

    if (caracAltura) {

        caracAltura.textContent =
            obterAlturaAtual();
    }

    document
        .querySelectorAll(
            '.pp-cor-item'
        )
        .forEach(
            (
                item,
                indiceItem
            ) => {

                item.classList.toggle(
                    'selecionada',
                    indiceItem ===
                    corAtual
                );
            }
        );

    atualizarBotoesFavorito();
}


// ============================================================
// MUDAR IMAGEM
// ============================================================

function mudarImagem(
    direcao
) {

    if (!produtoAtual) {
        return;
    }

    const imagens =
        obterImagensDaCor(
            produtoAtual,
            corAtual
        );

    const total =
        imagens.length;

    if (total <= 1) {
        return;
    }

    imgAtual =
        (
            imgAtual +
            direcao +
            total
        ) %
        total;

    const imagem =
        document.getElementById(
            'pp-img'
        );

    if (imagem) {

        imagem.src =
            imagens[
                imgAtual
            ].caminho;
    }

    const contador =
        document.getElementById(
            'pp-contador'
        );

    if (contador) {

        contador.textContent =
            `${imgAtual + 1} / ${total}`;
    }
}


// ============================================================
// COMPARTILHAR
// ============================================================

async function compartilharProduto() {

    if (!produtoAtual) {
        return;
    }

    const url =
        window.location.origin +
        window.location.pathname +
        '?produto=' +
        encodeURIComponent(
            produtoAtual.id
        );

    const titulo =
        produtoAtual.titulo ||
        'Cortez Móveis';

    if (
        navigator.share
    ) {

        try {

            await navigator.share({
                title: titulo,
                text: titulo,
                url
            });

        } catch (e) {

            // Cancelamento normal.
        }

        return;
    }

    try {

        await navigator.clipboard.writeText(
            url
        );

        alert(
            'Link do produto copiado.'
        );

    } catch (e) {

        prompt(
            'Copie o link do produto:',
            url
        );
    }
}


// ============================================================
// MODAL DE ORÇAMENTO
// ============================================================

function abrirModalOrcamento() {

    const modal =
        document.getElementById(
            'modal-orcamento'
        );

    if (!modal) {
        return;
    }

    const info =
        document.getElementById(
            'modal-produto-info'
        );

    const linkWhatsApp =
        document.getElementById(
            'modal-link-whatsapp'
        );

    const linkEmail =
        document.getElementById(
            'modal-link-email'
        );

    const nomeProduto =
        produtoAtual
            ? produtoAtual.titulo
            : '';

    const cor =
        produtoAtual &&
        Array.isArray(
            produtoAtual.cores
        ) &&
        produtoAtual.cores[
            corAtual
        ]
            ? produtoAtual.cores[
                corAtual
            ].nome
            : '';

    if (produtoAtual) {

        if (info) {

            info.textContent =
                nomeProduto +
                (
                    cor
                        ? ' - Cor: ' +
                          cor
                        : ''
                );
        }

    } else {

        if (info) {

            info.textContent =
                'Conte-nos o que você precisa.';
        }
    }

    const mensagem =
        produtoAtual
            ? (
                'Olá! Gostaria de solicitar um orçamento para o produto ' +
                nomeProduto +
                (
                    cor
                        ? ', na cor ' +
                          cor
                        : ''
                ) +
                '.'
            )
            : 'Olá! Gostaria de solicitar um orçamento com a Cortez Móveis.';

    if (linkWhatsApp) {

        linkWhatsApp.href =
            'https://wa.me/551532769999?text=' +
            encodeURIComponent(
                mensagem
            );
    }

    const assunto =
        produtoAtual
            ? 'Solicitação de orçamento - ' +
              nomeProduto
            : 'Solicitação de orçamento - Cortez Móveis';

    if (linkEmail) {

        linkEmail.href =
            'mailto:cortez@cortezmoveis.com.br' +
            '?subject=' +
            encodeURIComponent(
                assunto
            ) +
            '&body=' +
            encodeURIComponent(
                mensagem
            );
    }

    modal.classList.add(
        'aberto'
    );
}


function fecharModalOrcamento() {

    const modal =
        document.getElementById(
            'modal-orcamento'
        );

    if (modal) {

        modal.classList.remove(
            'aberto'
        );
    }
}


// ============================================================
// NAVEGAÇÃO
// ============================================================

function fecharMenuMobile() {

    const menu =
        document.getElementById(
            'menu'
        );

    if (!menu) {
        return;
    }

    menu.classList.remove(
        'aberto'
    );

    const botao =
        document.getElementById(
            'btn-menu-toggle'
        );

    if (botao) {

        botao.setAttribute(
            'aria-expanded',
            'false'
        );
    }
}


function irParaInicio() {

    fecharMenuMobile();

    if (
        window.location.search
    ) {

        voltarCatalogo();

    } else {

        window.scrollTo(
            {
                top: 0,
                behavior: 'smooth'
            }
        );
    }
}


function navegar(
    secao
) {

    fecharMenuMobile();

    const executar =
        () => {

            const elemento =
                document.getElementById(
                    secao
                );

            if (elemento) {

                elemento.scrollIntoView(
                    {
                        behavior: 'smooth',
                        block: 'start'
                    }
                );
            }
        };

    const produtoView =
        document.getElementById(
            'view-produto'
        );

    if (
        produtoView &&
        produtoView.style.display !== 'none'
    ) {

        voltarCatalogo();

        setTimeout(
            executar,
            100
        );

    } else {

        executar();
    }
}


// ============================================================
// MENU MOBILE
// ============================================================

function toggleMenu() {

    const menu =
        document.getElementById(
            'menu'
        );

    if (!menu) {
        return;
    }

    const aberto =
        menu.classList.toggle(
            'aberto'
        );

    const botao =
        document.getElementById(
            'btn-menu-toggle'
        );

    if (botao) {

        botao.setAttribute(
            'aria-expanded',
            aberto
                ? 'true'
                : 'false'
        );
    }
}


// ============================================================
// ZOOM
// ============================================================

function abrirZoom(
    imagem
) {

    if (!imagem) {
        return;
    }

    const overlay =
        document.getElementById(
            'zoom-overlay'
        );

    const imagemZoom =
        document.getElementById(
            'zoom-imagem'
        );

    if (
        !overlay ||
        !imagemZoom
    ) {

        return;
    }

    imagemZoom.src =
        imagem.currentSrc ||
        imagem.src;

    imagemZoom.alt =
        imagem.alt ||
        'Visualização ampliada';

    overlay.classList.add(
        'aberto'
    );
}


function fecharZoom() {

    const overlay =
        document.getElementById(
            'zoom-overlay'
        );

    if (overlay) {

        overlay.classList.remove(
            'aberto'
        );
    }
}


// ============================================================
// EVENTOS DO HTML
// ============================================================

document
    .getElementById(
        'btn-menu-toggle'
    )
    ?.addEventListener(
        'click',
        toggleMenu
    );


document
    .getElementById(
        'nav-inicio'
    )
    ?.addEventListener(
        'click',
        event => {

            event.preventDefault();

            irParaInicio();
        }
    );


document
    .getElementById(
        'nav-produtos'
    )
    ?.addEventListener(
        'click',
        event => {

            event.preventDefault();

            navegar(
                'produtos'
            );
        }
    );


document
    .getElementById(
        'nav-sobre'
    )
    ?.addEventListener(
        'click',
        event => {

            event.preventDefault();

            navegar(
                'sobre'
            );
        }
    );


document
    .getElementById(
        'nav-guia'
    )
    ?.addEventListener(
        'click',
        event => {

            event.preventDefault();

            navegar(
                'guia'
            );
        }
    );


document
    .getElementById(
        'nav-contato'
    )
    ?.addEventListener(
        'click',
        event => {

            event.preventDefault();

            navegar(
                'contato'
            );
        }
    );


document
    .getElementById(
        'btn-header-orcamento'
    )
    ?.addEventListener(
        'click',
        abrirModalOrcamento
    );


document
    .getElementById(
        'btn-conheca-produtos'
    )
    ?.addEventListener(
        'click',
        () =>
            navegar(
                'produtos'
            )
    );


document
    .getElementById(
        'btn-orcamento-principal'
    )
    ?.addEventListener(
        'click',
        abrirModalOrcamento
    );


document
    .getElementById(
        'btn-voltar-catalogo'
    )
    ?.addEventListener(
        'click',
        voltarCatalogo
    );


document
    .getElementById(
        'btn-fechar-orcamento'
    )
    ?.addEventListener(
        'click',
        fecharModalOrcamento
    );


document
    .getElementById(
        'btn-fechar-zoom'
    )
    ?.addEventListener(
        'click',
        fecharZoom
    );


document
    .getElementById(
        'modal-orcamento'
    )
    ?.addEventListener(
        'click',
        event => {

            if (
                event.target.id ===
                'modal-orcamento'
            ) {

                fecharModalOrcamento();
            }
        }
    );


document
    .getElementById(
        'zoom-overlay'
    )
    ?.addEventListener(
        'click',
        event => {

            if (
                event.target.id ===
                'zoom-overlay'
            ) {

                fecharZoom();
            }
        }
    );


document
    .querySelectorAll(
        '[data-zoom]'
    )
    .forEach(
        imagem => {

            imagem.addEventListener(
                'click',
                () =>
                    abrirZoom(
                        imagem
                    )
            );
        }
    );


document.addEventListener(
    'keydown',
    event => {

        if (
            event.key ===
            'Escape'
        ) {

            fecharZoom();

            fecharModalOrcamento();

            fecharMenuMobile();
        }
    }
);


// ============================================================
// HISTÓRICO
// ============================================================

window.addEventListener(
    'popstate',
    () => {

        const parametros =
            new URLSearchParams(
                window.location.search
            );

        const id =
            parametros.get(
                'produto'
            );

        if (id) {

            abrirProduto(
                id,
                false
            );

        } else {

            const produtoView =
                document.getElementById(
                    'view-produto'
                );

            const home =
                document.getElementById(
                    'view-home'
                );

            if (produtoView) {

                produtoView.style.display =
                    'none';
            }

            if (home) {

                home.style.display =
                    'block';
            }

            produtoAtual =
                null;

            const barraAdmin =
                document.getElementById(
                    'barra-modo-admin'
                );

            if (barraAdmin) {
                barraAdmin.remove();
            }
        }
    }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function inicializarSite() {

    const produtoView =
        document.getElementById(
            'view-produto'
        );

    const home =
        document.getElementById(
            'view-home'
        );

    if (produtoView) {

        produtoView.style.display =
            'none';
    }

    if (home) {

        home.style.display =
            'block';
    }

    /*
     * Primeiro verifica a sessão.
     * Se for administrador, o site entra
     * automaticamente em modo administrativo.
     */

    await verificarAdministrador();

    carregarProdutos();

    carregarCategorias();

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const produtoId =
        parametros.get(
            'produto'
        );

    if (produtoId) {

        await abrirProduto(
            produtoId
        );
    }

    atualizarModoAdministrador();
}


// ============================================================
// INICIAR
// ============================================================

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        inicializarSite
    );

} else {

    inicializarSite();
}