// ============================================================
// ESTADO
// ============================================================

let categorias = [];
let produtoEditando = null;


// ============================================================
// API HELPERS
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

    const res =
        await fetch(
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
// MENSAGENS
// ============================================================

function mostrarMensagem(
    texto,
    tipo = 'sucesso'
) {

    const el =
        document.getElementById(
            'mensagem'
        );

    if (!el) {
        return;
    }

    el.textContent =
        texto;

    el.className =
        'mensagem ' + tipo;

    setTimeout(
        () => {
            el.className =
                'mensagem';
        },
        4000
    );
}


// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function verificarSessao() {

    try {

        const data =
            await api(
                '/api/auth/me'
            );

        const nome =
            data.admin.nome ||
            data.admin.email ||
            'Administrador';

        const adminNome =
            document.getElementById(
                'admin-nome'
            );

        if (adminNome) {

            adminNome.textContent =
                nome;
        }

        mostrarDashboard();

        await carregarCategorias();

        await carregarProdutos();

    } catch (e) {

        mostrarLogin();
    }
}


async function login(
    email,
    senha
) {

    const erroEl =
        document.getElementById(
            'login-erro'
        );

    if (erroEl) {

        erroEl.textContent =
            '';
    }

    try {

        const data =
            await api(
                '/api/auth/login',
                {
                    method: 'POST',

                    body:
                        JSON.stringify({
                            email,
                            senha
                        })
                }
            );

        const adminNome =
            document.getElementById(
                'admin-nome'
            );

        if (adminNome) {

            adminNome.textContent =
                data.nome ||
                data.email;
        }

        mostrarDashboard();

        await carregarCategorias();

        await carregarProdutos();

    } catch (e) {

        if (erroEl) {

            erroEl.textContent =
                e.message ||
                'Erro ao realizar login.';
        }
    }
}


async function logout() {

    try {

        await api(
            '/api/auth/logout',
            {
                method: 'POST'
            }
        );

    } catch (e) {

        console.error(
            'Erro no logout:',
            e
        );
    }

    produtoEditando =
        null;

    mostrarLogin();
}


function mostrarLogin() {

    const loginView =
        document.getElementById(
            'login-view'
        );

    const dashboardView =
        document.getElementById(
            'dashboard-view'
        );

    if (loginView) {

        loginView.style.display =
            'block';
    }

    if (dashboardView) {

        dashboardView.style.display =
            'none';
    }
}


function mostrarDashboard() {

    const loginView =
        document.getElementById(
            'login-view'
        );

    const dashboardView =
        document.getElementById(
            'dashboard-view'
        );

    if (loginView) {

        loginView.style.display =
            'none';
    }

    if (dashboardView) {

        dashboardView.style.display =
            'block';
    }
}


// ============================================================
// CATEGORIAS
// ============================================================

async function carregarCategorias() {

    try {

        categorias =
            await api(
                '/api/categorias'
            );

        const select =
            document.getElementById(
                'f-categoria'
            );

        if (!select) {

            return;
        }

        select.innerHTML =
            '<option value="">Selecione...</option>';

        categorias.forEach(
            categoria => {

                const option =
                    document.createElement(
                        'option'
                    );

                option.value =
                    categoria.id;

                option.textContent =
                    categoria.nome;

                select.appendChild(
                    option
                );
            }
        );

    } catch (e) {

        console.error(
            'Erro ao carregar categorias:',
            e
        );

        mostrarMensagem(
            'Não foi possível carregar as categorias.',
            'erro'
        );
    }
}


// ============================================================
// PRODUTOS
// ============================================================

async function carregarProdutos() {

    try {

        const data =
            await api(
                '/api/produtos/admin/todos'
            );

        renderTabela(
            data
        );

    } catch (e) {

        console.error(
            'Erro ao carregar produtos:',
            e
        );

        mostrarMensagem(
            e.message ||
            'Não foi possível carregar os produtos.',
            'erro'
        );
    }
}


// ============================================================
// TABELA DE PRODUTOS
// ============================================================

function renderTabela(
    produtos
) {

    const tbody =
        document.getElementById(
            'tabela-produtos'
        );

    if (!tbody) {

        return;
    }

    tbody.innerHTML =
        '';


    if (
        !Array.isArray(
            produtos
        ) ||
        produtos.length === 0
    ) {

        const tr =
            document.createElement(
                'tr'
            );

        const td =
            document.createElement(
                'td'
            );

        td.colSpan =
            6;

        td.textContent =
            'Nenhum produto cadastrado.';

        td.style.textAlign =
            'center';

        td.style.padding =
            '30px';

        td.style.color =
            '#777';

        tr.appendChild(
            td
        );

        tbody.appendChild(
            tr
        );

        return;
    }


    produtos.forEach(
        produto => {

            const tr =
                document.createElement(
                    'tr'
                );


            // ID
            const tdId =
                document.createElement(
                    'td'
                );

            tdId.textContent =
                produto.id;


            // Título
            const tdTitulo =
                document.createElement(
                    'td'
                );

            tdTitulo.textContent =
                produto.titulo ||
                '—';


            // Categoria
            const tdCategoria =
                document.createElement(
                    'td'
                );

            tdCategoria.textContent =
                produto.categoria_nome ||
                '—';


            // Preço
            const tdPreco =
                document.createElement(
                    'td'
                );


            if (
                produto.preco !== null &&
                produto.preco !== undefined &&
                produto.preco !== ''
            ) {

                const numero =
                    Number(
                        produto.preco
                    );

                tdPreco.textContent =
                    Number.isFinite(
                        numero
                    )
                        ? numero.toLocaleString(
                            'pt-BR',
                            {
                                style: 'currency',
                                currency: 'BRL'
                            }
                        )
                        : '—';

            } else {

                tdPreco.textContent =
                    '—';
            }


            // Status
            const tdStatus =
                document.createElement(
                    'td'
                );

            tdStatus.className =
                produto.ativo
                    ? 'status-ativo'
                    : 'status-inativo';

            tdStatus.textContent =
                produto.ativo
                    ? 'Ativo'
                    : 'Inativo';


            // Ações
            const tdAcoes =
                document.createElement(
                    'td'
                );


            const btnEditar =
                document.createElement(
                    'button'
                );

            btnEditar.type =
                'button';

            btnEditar.className =
                'btn-tabela btn-editar';

            btnEditar.textContent =
                'Editar';

            btnEditar.addEventListener(
                'click',
                () =>
                    abrirEdicao(
                        produto.id
                    )
            );

            tdAcoes.appendChild(
                btnEditar
            );


            if (
                produto.ativo
            ) {

                const btnDesativar =
                    document.createElement(
                        'button'
                    );

                btnDesativar.type =
                    'button';

                btnDesativar.className =
                    'btn-tabela btn-desativar';

                btnDesativar.textContent =
                    'Desativar';

                btnDesativar.addEventListener(
                    'click',
                    () =>
                        desativarProduto(
                            produto.id
                        )
                );

                tdAcoes.appendChild(
                    btnDesativar
                );

            } else {

                const btnReativar =
                    document.createElement(
                        'button'
                    );

                btnReativar.type =
                    'button';

                btnReativar.className =
                    'btn-tabela btn-reativar';

                btnReativar.textContent =
                    'Reativar';

                btnReativar.addEventListener(
                    'click',
                    () =>
                        reativarProduto(
                            produto.id
                        )
                );

                tdAcoes.appendChild(
                    btnReativar
                );
            }


            tr.appendChild(
                tdId
            );

            tr.appendChild(
                tdTitulo
            );

            tr.appendChild(
                tdCategoria
            );

            tr.appendChild(
                tdPreco
            );

            tr.appendChild(
                tdStatus
            );

            tr.appendChild(
                tdAcoes
            );


            tbody.appendChild(
                tr
            );
        }
    );
}


// ============================================================
// DESATIVAR PRODUTO
// ============================================================

async function desativarProduto(
    id
) {

    if (
        !confirm(
            'Desativar este produto?'
        )
    ) {

        return;
    }

    try {

        await api(
            '/api/produtos/' + id,
            {
                method: 'DELETE'
            }
        );

        mostrarMensagem(
            'Produto desativado.'
        );

        await carregarProdutos();

    } catch (e) {

        mostrarMensagem(
            e.message ||
            'Erro ao desativar o produto.',
            'erro'
        );
    }
}


// ============================================================
// REATIVAR PRODUTO
// ============================================================

async function reativarProduto(
    id
) {

    try {

        await api(
            '/api/produtos/' +
            id +
            '/reativar',
            {
                method: 'PUT'
            }
        );

        mostrarMensagem(
            'Produto reativado.'
        );

        await carregarProdutos();

    } catch (e) {

        mostrarMensagem(
            e.message ||
            'Erro ao reativar o produto.',
            'erro'
        );
    }
}


// ============================================================
// MODAL — NOVO PRODUTO
// ============================================================

function abrirNovoProduto() {

    produtoEditando =
        null;


    const titulo =
        document.getElementById(
            'modal-titulo'
        );

    const id =
        document.getElementById(
            'produto-id'
        );

    const form =
        document.getElementById(
            'produto-form'
        );

    const cores =
        document.getElementById(
            'cores-container'
        );

    const modal =
        document.getElementById(
            'modal-produto'
        );


    if (titulo) {

        titulo.textContent =
            'Novo Produto';
    }


    if (id) {

        id.value =
            '';
    }


    if (form) {

        form.reset();
    }


    if (cores) {

        cores.innerHTML =
            '';
    }


    // Um bloco de cor inicial
    adicionarCor();


    if (modal) {

        modal.classList.add(
            'aberto'
        );
    }
}


// ============================================================
// EDITAR PRODUTO
// ============================================================

async function abrirEdicao(
    id
) {

    try {

        const produto =
            await api(
                '/api/produtos/' +
                id
            );


        produtoEditando =
            produto;


        document.getElementById(
            'modal-titulo'
        ).textContent =
            'Editar Produto';


        document.getElementById(
            'produto-id'
        ).value =
            produto.id;


        document.getElementById(
            'f-titulo'
        ).value =
            produto.titulo ||
            '';


        document.getElementById(
            'f-linha'
        ).value =
            produto.linha ||
            '';


        document.getElementById(
            'f-categoria'
        ).value =
            produto.categoria_id ||
            '';


        document.getElementById(
            'f-preco'
        ).value =
            produto.preco ??
            '';


        document.getElementById(
            'f-parcelamento'
        ).value =
            produto.parcelamento ||
            '';


        document.getElementById(
            'f-descricao'
        ).value =
            produto.descricao ||
            '';


        const caracteristicas =
            produto.caracteristicas ||
            {};


        document.getElementById(
            'f-modelo'
        ).value =
            caracteristicas.modelo ||
            '';


        document.getElementById(
            'f-largura'
        ).value =
            caracteristicas.largura ||
            '';


        document.getElementById(
            'f-comprimento'
        ).value =
            caracteristicas.comprimento ||
            '';


        document.getElementById(
            'f-altura'
        ).value =
            caracteristicas.altura ||
            '';


        document.getElementById(
            'f-assentos'
        ).value =
            caracteristicas.quantidade_assentos ||
            '';


        document.getElementById(
            'f-compartimento'
        ).value =
            caracteristicas.compartimento_livros ||
            '';


        document.getElementById(
            'f-outros'
        ).value =
            caracteristicas.outros ||
            '';


        const coresContainer =
            document.getElementById(
                'cores-container'
            );


        coresContainer.innerHTML =
            '';


        if (
            Array.isArray(
                produto.cores
            ) &&
            produto.cores.length > 0
        ) {

            produto.cores.forEach(
                cor => {

                    const imagens =
                        (
                            produto.imagens ||
                            []
                        )
                        .filter(
                            imagem =>
                                Number(
                                    imagem.cor_id
                                ) ===
                                Number(
                                    cor.id
                                )
                        );


                    adicionarCor({
                        ...cor,
                        imagens
                    });
                }
            );

        } else {

            adicionarCor();
        }


        document.getElementById(
            'modal-produto'
        ).classList.add(
            'aberto'
        );

    } catch (e) {

        console.error(
            'Erro ao abrir produto:',
            e
        );

        mostrarMensagem(
            e.message ||
            'Erro ao carregar o produto.',
            'erro'
        );
    }
}


// ============================================================
// FECHAR MODAL
// ============================================================

function fecharModal() {

    const modal =
        document.getElementById(
            'modal-produto'
        );

    if (modal) {

        modal.classList.remove(
            'aberto'
        );
    }
}


// ============================================================
// CORES
// ============================================================

function adicionarCor(
    cor = {}
) {

    const container =
        document.getElementById(
            'cores-container'
        );


    if (!container) {

        return;
    }


    const div =
        document.createElement(
            'div'
        );

    div.className =
        'cores-editor';


    div.innerHTML = `
        <h4>Cor</h4>

        <div class="form-grid">

            <div class="form-grupo">

                <label>
                    Nome da cor
                </label>

                <input
                    type="text"
                    class="cor-nome"
                    maxlength="100"
                    value="${escaparHtml(
                        cor.nome || ''
                    )}"
                >

            </div>


            <div class="form-grupo">

                <label>
                    Altura
                </label>

                <input
                    type="text"
                    class="cor-altura"
                    maxlength="50"
                    value="${escaparHtml(
                        cor.altura || ''
                    )}"
                >

            </div>

        </div>


        <div class="form-grupo">

            <label>
                Descrição da cor
            </label>

            <textarea
                class="cor-descricao descricao-cor"
                maxlength="5000"
                placeholder="Descreva as características específicas desta cor, acabamento ou configuração."
            >${escaparHtml(
                cor.descricao || ''
            )}</textarea>

        </div>


        <div class="form-grupo imagem-upload">

            <label>
                Imagens da cor
            </label>

            <input
                type="file"
                class="cor-imagens-input"
                accept="image/png,image/jpeg,image/webp"
                multiple
            >

        </div>


        <div
            class="imagem-lista cor-imagens-lista"
        ></div>


        <button
            type="button"
            class="btn-remove-cor"
        >
            Remover cor
        </button>
    `;


    container.appendChild(
        div
    );


    // Remover cor
    const btnRemover =
        div.querySelector(
            '.btn-remove-cor'
        );


    if (btnRemover) {

        btnRemover.addEventListener(
            'click',
            () =>
                removerCor(
                    btnRemover
                )
        );
    }


    // ========================================================
    // IMAGENS EXISTENTES
    // ========================================================

    if (
        Array.isArray(
            cor.imagens
        ) &&
        cor.imagens.length > 0
    ) {

        const lista =
            div.querySelector(
                '.cor-imagens-lista'
            );


        cor.imagens.forEach(
            imagem => {

                adicionarItemImagem(
                    lista,
                    imagem.caminho,
                    Boolean(
                        imagem.principal
                    ),
                    imagem.id || ''
                );
            }
        );
    }


    // ========================================================
    // UPLOAD
    // ========================================================

    const input =
        div.querySelector(
            '.cor-imagens-input'
        );


    if (input) {

        input.addEventListener(
            'change',
            async event => {

                const arquivos =
                    Array.from(
                        event.target.files
                    );


                for (
                    const arquivo of arquivos
                ) {

                    await fazerUpload(
                        arquivo,
                        div
                    );
                }


                event.target.value =
                    '';
            }
        );
    }
}


// ============================================================
// ADICIONAR ITEM DE IMAGEM
// ============================================================

function adicionarItemImagem(
    lista,
    caminho,
    principal = false,
    imagemId = ''
) {

    if (
        !lista ||
        !caminho
    ) {

        return;
    }


    const item =
        document.createElement(
            'div'
        );

    item.className =
        'imagem-item';


    item.innerHTML = `
        <img
            src="${escaparHtml(
                caminho
            )}"
            alt="Imagem do produto"
        >

        <input
            type="hidden"
            class="cor-imagem-caminho"
            value="${escaparHtml(
                caminho
            )}"
        >

        ${
            imagemId
                ? `
                    <input
                        type="hidden"
                        class="cor-imagem-id"
                        value="${escaparHtml(
                            imagemId
                        )}"
                    >
                `
                : ''
        }

        <label
            class="imagem-principal-label"
        >

            <input
                type="radio"
                name="imagem-principal"
                class="cor-imagem-principal"
                ${principal ? 'checked' : ''}
            >

            Principal

        </label>


        <button
            type="button"
            class="btn-remove-imagem"
            title="Remover imagem"
        >
            ×
        </button>
    `;


    lista.appendChild(
        item
    );


    // Radio principal
    const radio =
        item.querySelector(
            '.cor-imagem-principal'
        );


    if (radio) {

        radio.addEventListener(
            'change',
            () => {

                if (
                    !radio.checked
                ) {

                    return;
                }


                document
                    .querySelectorAll(
                        '.cor-imagem-principal'
                    )
                    .forEach(
                        outroRadio => {

                            if (
                                outroRadio !==
                                radio
                            ) {

                                outroRadio.checked =
                                    false;
                            }
                        }
                    );
            }
        );
    }


    // Remover imagem
    const btnRemover =
        item.querySelector(
            '.btn-remove-imagem'
        );


    if (btnRemover) {

        btnRemover.addEventListener(
            'click',
            () =>
                removerImagem(
                    btnRemover
                )
        );
    }
}


// ============================================================
// REMOVER IMAGEM
// ============================================================

function removerImagem(
    btn
) {

    const item =
        btn.closest(
            '.imagem-item'
        );


    if (!item) {

        return;
    }


    const estavaPrincipal =
        item.querySelector(
            '.cor-imagem-principal'
        )?.checked;


    item.remove();


    if (
        estavaPrincipal
    ) {

        const primeiraRestante =
            document.querySelector(
                '.cor-imagem-principal'
            );


        if (
            primeiraRestante
        ) {

            primeiraRestante.checked =
                true;
        }
    }
}


// ============================================================
// REMOVER COR
// ============================================================

function removerCor(
    btn
) {

    const editor =
        btn.closest(
            '.cores-editor'
        );


    if (!editor) {

        return;
    }


    const haviaPrincipal =
        Array.from(
            editor.querySelectorAll(
                '.cor-imagem-principal'
            )
        )
        .some(
            radio =>
                radio.checked
        );


    editor.remove();


    if (
        haviaPrincipal
    ) {

        const primeiraRestante =
            document.querySelector(
                '.cor-imagem-principal'
            );


        if (
            primeiraRestante
        ) {

            primeiraRestante.checked =
                true;
        }
    }
}


// ============================================================
// UPLOAD
// ============================================================

async function fazerUpload(
    file,
    div
) {

    const tiposPermitidos = [
        'image/png',
        'image/jpeg',
        'image/webp'
    ];


    if (
        !tiposPermitidos.includes(
            file.type
        )
    ) {

        alert(
            'Formato não permitido. Use PNG, JPG ou WebP.'
        );

        return;
    }


    const limite =
        5 * 1024 * 1024;


    if (
        file.size >
        limite
    ) {

        alert(
            'A imagem deve ter no máximo 5 MB.'
        );

        return;
    }


    const formData =
        new FormData();


    formData.append(
        'imagem',
        file
    );


    formData.append(
        'tipo',
        'cor'
    );


    try {

        const res =
            await fetch(
                '/api/uploads',
                {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                }
            );


        const data =
            await res
                .json()
                .catch(
                    () => ({})
                );


        if (
            !res.ok
        ) {

            throw new Error(
                data.erro ||
                'Erro no upload.'
            );
        }


        const lista =
            div.querySelector(
                '.cor-imagens-lista'
            );


        if (!lista) {

            return;
        }


        // Primeira imagem recebe principal
        const nenhumaPrincipal =
            !document.querySelector(
                '.cor-imagem-principal:checked'
            );


        adicionarItemImagem(
            lista,
            data.caminho,
            nenhumaPrincipal
        );


    } catch (e) {

        console.error(
            'Erro no upload:',
            e
        );


        alert(
            e.message ||
            'Erro ao enviar a imagem.'
        );
    }
}


// ============================================================
// SALVAR PRODUTO
// ============================================================

const produtoForm =
    document.getElementById(
        'produto-form'
    );


if (produtoForm) {

    produtoForm.addEventListener(
        'submit',
        async event => {

            event.preventDefault();


            const categoria =
                document.getElementById(
                    'f-categoria'
                ).value;


            if (!categoria) {

                mostrarMensagem(
                    'Selecione uma categoria.',
                    'erro'
                );

                return;
            }


            const cores = [];


            document
                .querySelectorAll(
                    '.cores-editor'
                )
                .forEach(
                    editor => {

                        // ------------------------------
                        // NOME DA COR
                        // ------------------------------

                        const nome =
                            editor
                                .querySelector(
                                    '.cor-nome'
                                )
                                .value
                                .trim();


                        // ------------------------------
                        // ALTURA
                        // ------------------------------

                        const altura =
                            editor
                                .querySelector(
                                    '.cor-altura'
                                )
                                .value
                                .trim();


                        // ------------------------------
                        // DESCRIÇÃO DA COR
                        // ------------------------------

                        const descricaoEl =
                            editor
                                .querySelector(
                                    '.cor-descricao'
                                );


                        const descricao =
                            descricaoEl
                                ? descricaoEl.value.trim()
                                : '';


                        // ------------------------------
                        // IMAGENS
                        // ------------------------------

                        const imagens = [];


                        editor
                            .querySelectorAll(
                                '.imagem-item'
                            )
                            .forEach(
                                item => {

                                    const caminhoInput =
                                        item.querySelector(
                                            '.cor-imagem-caminho'
                                        );


                                    if (
                                        !caminhoInput ||
                                        !caminhoInput.value
                                    ) {

                                        return;
                                    }


                                    const principalInput =
                                        item.querySelector(
                                            '.cor-imagem-principal'
                                        );


                                    const idInput =
                                        item.querySelector(
                                            '.cor-imagem-id'
                                        );


                                    imagens.push({

                                        id:
                                            idInput
                                                ? idInput.value
                                                : '',

                                        caminho:
                                            caminhoInput.value,

                                        principal:
                                            principalInput
                                                ? principalInput.checked
                                                : false
                                    });
                                }
                            );


                        /*
                         * A cor é enviada para o backend
                         * mesmo que tenha somente descrição,
                         * nome ou imagens.
                         */

                        if (
                            nome ||
                            altura ||
                            descricao ||
                            imagens.length > 0
                        ) {

                            cores.push({

                                nome,

                                altura,

                                descricao,

                                imagens
                            });
                        }
                    }
                );


            // =================================================
            // IMAGEM PRINCIPAL
            // =================================================

            const existeImagemPrincipal =
                cores.some(
                    cor =>
                        cor.imagens.some(
                            imagem =>
                                imagem.principal === true
                        )
                );


            /*
             * Se existem imagens, mas nenhuma foi marcada,
             * seleciona automaticamente a primeira.
             */

            if (
                !existeImagemPrincipal &&
                cores.length > 0
            ) {

                outerLoop:

                for (
                    const cor of cores
                ) {

                    if (
                        cor.imagens.length > 0
                    ) {

                        cor.imagens[0].principal =
                            true;

                        break outerLoop;
                    }
                }
            }


            // =================================================
            // PAYLOAD
            // =================================================

            const payload = {

                titulo:
                    document.getElementById(
                        'f-titulo'
                    ).value.trim(),


                linha:
                    document.getElementById(
                        'f-linha'
                    ).value.trim(),


                categoria_id:
                    Number(
                        categoria
                    ),


                preco:
                    document.getElementById(
                        'f-preco'
                    ).value
                        ? Number(
                            document.getElementById(
                                'f-preco'
                            ).value
                        )
                        : null,


                parcelamento:
                    document.getElementById(
                        'f-parcelamento'
                    ).value.trim(),


                descricao:
                    document.getElementById(
                        'f-descricao'
                    ).value.trim(),


                caracteristicas: {

                    modelo:
                        document.getElementById(
                            'f-modelo'
                        ).value.trim(),


                    largura:
                        document.getElementById(
                            'f-largura'
                        ).value.trim(),


                    comprimento:
                        document.getElementById(
                            'f-comprimento'
                        ).value.trim(),


                    altura:
                        document.getElementById(
                            'f-altura'
                        ).value.trim(),


                    outros:
                        document.getElementById(
                            'f-outros'
                        ).value.trim(),


                    quantidadeAssentos:
                        document.getElementById(
                            'f-assentos'
                        ).value.trim(),


                    compartimentoLivros:
                        document.getElementById(
                            'f-compartimento'
                        ).value.trim()
                },


                cores
            };


            // =================================================
            // VALIDAÇÃO
            // =================================================

            if (
                !payload.titulo
            ) {

                mostrarMensagem(
                    'Informe o título do produto.',
                    'erro'
                );

                return;
            }


            // =================================================
            // SALVAR
            // =================================================

            const id =
                document.getElementById(
                    'produto-id'
                ).value;


            try {

                if (id) {

                    await api(
                        '/api/produtos/' +
                        id,
                        {
                            method: 'PUT',

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                    mostrarMensagem(
                        'Produto atualizado com sucesso.'
                    );

                } else {

                    await api(
                        '/api/produtos',
                        {
                            method: 'POST',

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                    mostrarMensagem(
                        'Produto criado com sucesso.'
                    );
                }


                fecharModal();


                await carregarProdutos();


            } catch (err) {

                console.error(
                    'Erro ao salvar produto:',
                    err
                );


                mostrarMensagem(
                    err.message ||
                    'Erro ao salvar o produto.',
                    'erro'
                );
            }
        }
    );
}


// ============================================================
// EVENTOS DO HTML
// SEM JAVASCRIPT INLINE
// ============================================================


// LOGIN
const loginForm =
    document.getElementById(
        'login-form'
    );


if (loginForm) {

    loginForm.addEventListener(
        'submit',
        event => {

            event.preventDefault();


            const email =
                document.getElementById(
                    'login-email'
                ).value.trim();


            const senha =
                document.getElementById(
                    'login-senha'
                ).value;


            login(
                email,
                senha
            );
        }
    );
}


// Sair
document
    .getElementById(
        'btn-logout'
    )
    ?.addEventListener(
        'click',
        logout
    );


// Novo produto
document
    .getElementById(
        'btn-novo-produto'
    )
    ?.addEventListener(
        'click',
        abrirNovoProduto
    );


// Fechar modal
document
    .getElementById(
        'btn-fechar-modal'
    )
    ?.addEventListener(
        'click',
        fecharModal
    );


// Adicionar cor
document
    .getElementById(
        'btn-adicionar-cor'
    )
    ?.addEventListener(
        'click',
        () =>
            adicionarCor()
    );


// Fechar modal clicando fora
document
    .getElementById(
        'modal-produto'
    )
    ?.addEventListener(
        'click',
        event => {

            if (
                event.target.id ===
                'modal-produto'
            ) {

                fecharModal();
            }
        }
    );


// ESC
document.addEventListener(
    'keydown',
    event => {

        if (
            event.key === 'Escape'
        ) {

            fecharModal();
        }
    }
);


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHtml(
    valor
) {

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


// ============================================================
// INICIALIZAÇÃO
// ============================================================

verificarSessao();