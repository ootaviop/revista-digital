/**
 * Aplicação principal
 */

// Inicializar engine
const svg = document.getElementById('canvas');
const engine = new NavigationEngine(svg);

// Elementos de controle
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressSpan = document.getElementById('progress');

// Elementos do modal
const modal = document.getElementById('nodeModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalOverlay = modal.querySelector('.modal-overlay');

// Event listeners para controles
prevBtn.addEventListener('click', () => {
    engine.previous();
});

nextBtn.addEventListener('click', () => {
    engine.next();
});

// Event listeners para fechar modal
function closeModal() {
    modal.classList.remove('active');
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Suporte para navegação por teclado
document.addEventListener('keydown', (e) => {
    // Fechar modal com ESC
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
        return;
    }

    // Navegação só funciona se o modal não estiver aberto
    if (!modal.classList.contains('active')) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            engine.next();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            engine.previous();
        } else if (e.key === 'Home') {
            e.preventDefault();
            engine.reset();
        }
    }
});

// Callback quando a navegação muda
engine.onNavigationChange = (currentIndex, total) => {
    progressSpan.textContent = `${currentIndex + 1} / ${total}`;

    // Atualizar estado dos botões
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === total - 1;
};

// Carregar dados do JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        engine.loadData(data);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);

        // Usar dados de exemplo se falhar
        engine.loadData(getExampleData());
    }
}

// Dados de exemplo (fallback)
function getExampleData() {
    return {
        centralNode: {
            code: "D13",
            title: "Resolver problema envolvendo o cálculo de área de figuras planas.",
            modalContent: "Esta habilidade está relacionada ao reconhecimento e aplicação de procedimentos para o cálculo da área de diferentes figuras planas."
        },
        nodes: [
            {
                type: "table",
                title: "TAREFAS POR NÍVEL DE COMPLEXIDADE (9EF)",
                modalContent: "A complexidade das tarefas relacionadas ao cálculo de área varia de acordo com a estrutura do problema e os recursos disponíveis para resolução.",
                tableData: {
                    headers: ["NÍVEL", "TAREFA"],
                    rows: [
                        ["MUITO FÁCIL", "Determinar a área de figuras desenhadas em malhas quadriculadas"],
                        ["FÁCIL", "Determinar a área de uma figura quadrilátera não representada em malha quadriculada"],
                        ["DIFÍCIL", "Determinar a área de uma figura poligonal não convexa desenhada sobre uma malha quadriculada"],
                        ["MUITO DIFÍCIL", "Determinar a área de figuras formadas pela composição de triângulos, paralelogramos, trapézios e círculos"]
                    ]
                }
            },
            {
                type: "table",
                title: "SÉRIE HISTÓRICA DA HABILIDADE D13 (9EF)",
                modalContent: "A série histórica demonstra variações no desempenho dos estudantes do 9º ano nesta habilidade ao longo dos anos.",
                tableData: {
                    headers: ["ANO", "PERCENTUAL"],
                    rows: [
                        ["2022", "30%"],
                        ["2023", "50%"],
                        ["2024", "41%"],
                        ["2025", "?"]
                    ]
                }
            },
            {
                type: "table",
                title: "PERCENTUAL DE ACERTO NA HABILIDADE - SOMATIVA 2024",
                modalContent: "A análise comparativa dos percentuais de acerto entre diferentes etapas de ensino revela padrões importantes sobre o desenvolvimento da habilidade.",
                tableData: {
                    headers: ["ETAPA", "DESCRITOR", "HABILIDADE", "ACERTO"],
                    rows: [
                        ["5EF", "D12", "Resolver problema envolvendo o cálculo de áreas de figuras planas", "30%"],
                        ["9EF", "D13", "Resolver problema envolvendo o cálculo de área de figuras planas", "41%"],
                        ["3EM", "D12", "Resolver problema envolvendo o cálculo de área de figuras planas", "31%"]
                    ]
                }
            },
            {
                type: "question",
                title: "Questão 1 - Área em malha quadriculada",
                imageUrl: "",
                modalContent: "Esta questão avalia a habilidade de determinar a área de figuras desenhadas em malhas quadriculadas através da contagem de quadradinhos."
            },
            {
                type: "question",
                title: "Questão 2 - Área de figura não convexa",
                imageUrl: "",
                modalContent: "Esta questão apresenta figuras poligonais não convexas, exigindo estratégias mais sofisticadas de resolução."
            },
            {
                type: "question",
                title: "Questão 3 - Área com composição",
                imageUrl: "",
                modalContent: "Esta questão representa o nível mais alto de complexidade, envolvendo figuras formadas pela composição de múltiplas formas geométricas."
            }
        ]
    };
}

// Iniciar aplicação quando DOM e CSS estiverem carregados
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
} else {
    // DOM já está pronto
    loadData();
}
