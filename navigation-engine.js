/**
 * Navigation Engine - Sistema de navegação visual tipo Prezi
 * Versão 2.0 - Corrigido com sistema de coordenadas virtual
 */

class NavigationEngine {
    constructor(svgElement, config = {}) {
        this.svg = svgElement;
        this.mainGroup = svgElement.querySelector('#mainGroup');
        this.nodes = [];
        this.currentIndex = 0;
        this.navigationPath = [];

        // Sistema de coordenadas virtual (espaço SVG independente de pixels de tela)
        this.virtualSpace = {
            width: 12000,
            height: 12000,
            centerX: 6000,
            centerY: 6000
        };

        // Configurações
        this.config = {
            transitionDuration: 1200,
            minRadius: 2200,        // Raio mínimo para evitar sobreposição
            nodeMargin: 600,        // Margem entre nós
            zoomMargin: 1.8,       // Margem ao redor do nó ativo (25%)
            ...config
        };

        // Estado da viewport (viewBox do SVG)
        this.viewBox = {
            x: 0,
            y: 0,
            width: this.virtualSpace.width,
            height: this.virtualSpace.height
        };

        // Breakpoint atual (será atualizado dinamicamente)
        this.currentBreakpoint = this.detectBreakpoint();

        this.setupEventListeners();
        this.initializeViewBox();
    }

    /**
     * Detecta o breakpoint atual baseado na largura da janela
     */
    detectBreakpoint() {
        const width = window.innerWidth;

        if (width >= 768 && width <= 1024) {
            return 'tablet';
        } else if (width >= 1025 && width <= 1440) {
            return 'desktop';
        } else if (width >= 1441) {
            return 'largeDesktop';
        }

        // Fallback para telas menores que 768px (não suportado, mas retorna tablet)
        return 'tablet';
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Inicializa o viewBox do SVG
     */
    initializeViewBox() {
        const { width, height } = this.virtualSpace;
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }

    /**
     * Manipula redimensionamento em tempo real
     */
    handleResize() {
        const newBreakpoint = this.detectBreakpoint();

        // Se o breakpoint mudou, recarregar dados para aplicar novas configurações
        if (newBreakpoint !== this.currentBreakpoint) {
            this.currentBreakpoint = newBreakpoint;
            console.log(`📱 Breakpoint mudou para: ${newBreakpoint}`);

            // Recarregar dados se disponíveis
            if (this.data) {
                this.loadData(this.data);
            }
        }

        // Re-navegar para o nó atual com novo tamanho de viewport
        if (this.nodes.length > 0) {
            this.navigateToIndex(this.currentIndex, true);
        }
    }

    /**
     * Obtém configuração responsiva de um nó para o breakpoint atual
     * Prioridade: node.responsive[breakpoint] > node (valores padrão)
     */
    getResponsiveConfig(nodeData, property) {
        // Tentar obter config específica do breakpoint
        if (nodeData.responsive && nodeData.responsive[this.currentBreakpoint]) {
            const breakpointConfig = nodeData.responsive[this.currentBreakpoint];
            if (breakpointConfig[property] !== undefined) {
                return breakpointConfig[property];
            }
        }

        // Fallback para valor padrão do nó
        return nodeData[property];
    }

    updateViewBox() {
        this.svg.setAttribute('viewBox',
            `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`
        );
    }

    /**
     * Obtém dimensões do nó - prioriza customDimensions responsivas
     * Retorna em unidades do espaço virtual SVG
     *
     * @param {string} nodeType - Tipo do nó (central, table, list, question)
     * @param {object} nodeData - Dados completos do nó (para buscar configs responsivas)
     */
    getNodeDimensions(nodeType, nodeData = null) {
        let customDimensions = null;

        // PRIORIDADE 1: customDimensions responsivas (do breakpoint atual)
        if (nodeData) {
            customDimensions = this.getResponsiveConfig(nodeData, 'customDimensions');
            console.log(`📏 Dimensões personalizadas para ${nodeType}:`, customDimensions);
        }

        // PRIORIDADE 2: customDimensions fornecidas diretamente (fallback)
        if (customDimensions && customDimensions.width && customDimensions.height) {
            return {
                width: customDimensions.width * 2,   // Converter para espaço SVG virtual
                height: customDimensions.height * 2,
                maxWidth: (customDimensions.maxWidth || customDimensions.width * 1.5) * 2
            };
        }

        // PRIORIDADE 3: Fallbacks por tipo (valores padrão razoáveis)
        const defaults = {
            'central': { width: 350, height: 240 },
            'table': { width: 600, height: 350 },
            'list': { width: 380, height: 520 },
            'question': { width: 480, height: 550 }
        };

        const dim = defaults[nodeType] || { width: 500, height: 400 };

        return {
            width: dim.width * 2,
            height: dim.height * 2,
            maxWidth: dim.width * 3  // 1.5x convertido para SVG
        };
    }

    /**
     * Calcula raio ideal para posicionamento circular
     */
    calculateIdealRadius(centralNodeDim, nodeDimensions) {
        // Encontrar maior largura entre todos os nós
        const maxNodeWidth = Math.max(...nodeDimensions.map(d => d.width));
        const maxNodeHeight = Math.max(...nodeDimensions.map(d => d.height));
        const maxNodeSize = Math.max(maxNodeWidth, maxNodeHeight);

        // Raio = metade do nó maior + metade do nó central + margem
        const calculatedRadius = (maxNodeSize / 2) + (Math.max(centralNodeDim.width, centralNodeDim.height) / 2) + this.config.nodeMargin;

        // Garantir raio mínimo
        return Math.max(calculatedRadius, this.config.minRadius);
    }

    /**
     * Valida posicionamento para evitar sobreposição (Nível 2)
     */
    validateNodePosition(node, existingNodes) {
        for (const existing of existingNodes) {
            const dx = node.x - existing.x;
            const dy = node.y - existing.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Calcular distância mínima necessária
            const minDistance = (Math.max(node.dimensions.width, node.dimensions.height) +
                                Math.max(existing.dimensions.width, existing.dimensions.height)) / 2 +
                                this.config.nodeMargin;

            if (distance < minDistance) {
                console.warn(`⚠️ Nó "${node.data.title}" muito próximo de "${existing.data.title}".`, {
                    distanciaAtual: Math.round(distance),
                    distanciaMinima: Math.round(minDistance),
                    sugestao: `Aumentar distância em ${Math.round(minDistance - distance)} unidades`
                });
            }
        }
    }

    /**
     * Carrega dados do JSON e cria a estrutura de nós
     */
    loadData(data) {
        this.data = data;
        this.nodes = [];
        this.navigationPath = data.navigationPath || [];

        // Limpar grupo principal
        this.mainGroup.innerHTML = '';

        // Criar nó central
        const centralNode = this.createCentralNode(data.centralNode);
        this.nodes.push(centralNode);

        // Criar nós ao redor do central com posicionamento customizado
        data.nodes.forEach((nodeData, index) => {
            let x, y;

            // Obter position responsiva (pode vir de responsive[breakpoint] ou padrão)
            const position = this.getResponsiveConfig(nodeData, 'position');

            // Sistema de coordenadas relativas
            if (position && typeof position.offsetX !== 'undefined') {
                // Usar coordenadas relativas ao centro (responsivas ou padrão)
                x = this.virtualSpace.centerX + position.offsetX;
                y = this.virtualSpace.centerY + position.offsetY;
            } else {
                // Fallback: posicionamento circular (compatibilidade)
                const nodeDimensions = data.nodes.map(nd =>
                    this.getNodeDimensions(nd.type, nd)
                );
                const radius = this.calculateIdealRadius(centralNode.dimensions, nodeDimensions);
                const angleStep = (2 * Math.PI) / data.nodes.length;
                const angle = angleStep * index - Math.PI / 2;
                x = this.virtualSpace.centerX + Math.cos(angle) * radius;
                y = this.virtualSpace.centerY + Math.sin(angle) * radius;
            }

            let node;
            if (nodeData.type === 'table') {
                node = this.createTableNode(nodeData, x, y);
            } else if (nodeData.type === 'list') {
                node = this.createListNode(nodeData, x, y);
            } else if (nodeData.type === 'question') {
                node = this.createQuestionNode(nodeData, x, y);
            }

            if (node) {
                // Validar posicionamento (Nível 2)
                this.validateNodePosition(node, this.nodes);

                this.nodes.push(node);

                // Criar linha de conexão com o nó central
                this.createConnection(
                    this.virtualSpace.centerX,
                    this.virtualSpace.centerY,
                    x,
                    y
                );
            }
        });

        // Renderizar tudo
        this.render();

        // Navegar para o primeiro nó
        this.navigateToIndex(0);
    }

    /**
     * Cria o nó central usando foreignObject
     */
    createCentralNode(data) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'node central-node');

        const dimensions = this.getNodeDimensions('central', data);
        const { width, height } = dimensions;

        // Posicionar no centro do espaço virtual
        const x = this.virtualSpace.centerX;
        const y = this.virtualSpace.centerY;

        group.setAttribute('transform', `translate(${x}, ${y})`);

        // foreignObject para conteúdo HTML/CSS
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('x', -width / 2);
        foreignObject.setAttribute('y', -height / 2);
        foreignObject.setAttribute('width', width);
        foreignObject.setAttribute('height', height);

        // Criar conteúdo HTML
        const div = document.createElement('div');
        div.className = 'node-central-content';
        div.innerHTML = `
            <div class="node-code">${data.code || ''}</div>
            <div class="node-title">${data.title || ''}</div>
        `;

        foreignObject.appendChild(div);
        group.appendChild(foreignObject);

        return {
            element: group,
            x: x,
            y: y,
            data: data,
            type: 'central',
            dimensions: dimensions
        };
    }

    /**
     * Cria um nó de tabela usando foreignObject
     */
    createTableNode(data, x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'node table-node');
        group.setAttribute('transform', `translate(${x}, ${y})`);

        const dimensions = this.getNodeDimensions('table', data);
        const { width, height } = dimensions;

        // foreignObject
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('x', -width / 2);
        foreignObject.setAttribute('y', -height / 2);
        foreignObject.setAttribute('width', width);
        foreignObject.setAttribute('height', height);

        // Criar conteúdo HTML
        const div = document.createElement('div');
        div.className = 'node-table-content';

        // Título
        const titleDiv = document.createElement('div');
        titleDiv.className = 'table-title';
        titleDiv.textContent = data.title || '';
        div.appendChild(titleDiv);

        // Wrapper para scroll
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';

        // Tabela
        if (data.tableData) {
            const table = this.createHTMLTable(data.tableData);
            tableWrapper.appendChild(table);
        }

        div.appendChild(tableWrapper);

        // Adicionar legenda se especificado
        if (data.showLegend) {
            const legendContainer = document.createElement('div');
            legendContainer.className = 'legend-container';

            const legendTitle = document.createElement('span');
            legendTitle.className = 'legend-title';
            legendTitle.textContent = 'Legenda:';
            legendContainer.appendChild(legendTitle);

            const legendItems = document.createElement('div');
            legendItems.className = 'legend-items';

            const legends = [
                { badge: 'I', label: 'Introduzir', className: 'intro' },
                { badge: 'A', label: 'Aprofundar', className: 'develop' },
                { badge: 'C', label: 'Consolidar', className: 'consolidate' },
                { badge: 'R', label: 'Retomar', className: 'review' }
            ];

            legends.forEach(legend => {
                const item = document.createElement('div');
                item.className = 'legend-item';

                const badge = document.createElement('span');
                badge.className = `legend-badge ${legend.className}`;
                badge.textContent = legend.badge;
                item.appendChild(badge);

                const label = document.createElement('span');
                label.className = 'legend-label';
                label.textContent = legend.label;
                item.appendChild(label);

                legendItems.appendChild(item);
            });

            legendContainer.appendChild(legendItems);
            div.appendChild(legendContainer);
        }

        foreignObject.appendChild(div);
        group.appendChild(foreignObject);

        return {
            element: group,
            x: x,
            y: y,
            data: data,
            type: 'table',
            dimensions: dimensions
        };
    }

    /**
     * Cria um nó de lista especial usando foreignObject
     */
    createListNode(data, x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'node list-node');
        group.setAttribute('transform', `translate(${x}, ${y})`);

        const dimensions = this.getNodeDimensions('list', data);
        const { width, height } = dimensions;

        // foreignObject
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('x', -width / 2);
        foreignObject.setAttribute('y', -height / 2);
        foreignObject.setAttribute('width', width);
        foreignObject.setAttribute('height', height);

        // Criar conteúdo HTML
        const div = document.createElement('div');
        div.className = 'node-list-content';

        // Título
        const titleDiv = document.createElement('div');
        titleDiv.className = 'list-title';
        titleDiv.textContent = data.title || '';
        div.appendChild(titleDiv);

        // Lista de itens
        if (data.listItems && data.listItems.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'items-list';

            data.listItems.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'items-list-item';

                // Número
                const numberSpan = document.createElement('span');
                numberSpan.className = 'item-number';
                numberSpan.textContent = `${index + 1}.`;
                li.appendChild(numberSpan);

                // Conteúdo
                const contentDiv = document.createElement('div');
                contentDiv.className = 'item-content';

                const levelSpan = document.createElement('span');
                levelSpan.className = 'item-level';
                levelSpan.textContent = item.level || '';
                contentDiv.appendChild(levelSpan);

                const descSpan = document.createElement('span');
                descSpan.className = 'item-description';
                descSpan.textContent = item.description || '';
                contentDiv.appendChild(descSpan);

                li.appendChild(contentDiv);
                ul.appendChild(li);
            });

            div.appendChild(ul);
        }

        foreignObject.appendChild(div);
        group.appendChild(foreignObject);

        return {
            element: group,
            x: x,
            y: y,
            data: data,
            type: 'list',
            dimensions: dimensions
        };
    }

    /**
     * Cria uma tabela HTML
     */
    createHTMLTable(tableData) {
        const table = document.createElement('table');
        table.className = 'data-table';

        // Cabeçalho
        if (tableData.headers && tableData.headers.length > 0) {
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            tableData.headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);
        }

        // Corpo
        if (tableData.rows && tableData.rows.length > 0) {
            const tbody = document.createElement('tbody');

            tableData.rows.forEach(row => {
                const tr = document.createElement('tr');

                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
        }

        return table;
    }

    /**
     * Cria um nó de questão usando foreignObject
     */
    createQuestionNode(data, x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'node question-node');
        group.setAttribute('transform', `translate(${x}, ${y})`);

        const dimensions = this.getNodeDimensions('question', data);
        const { width, height } = dimensions;

        // foreignObject
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('x', -width / 2);
        foreignObject.setAttribute('y', -height / 2);
        foreignObject.setAttribute('width', width);
        foreignObject.setAttribute('height', height);

        // Criar conteúdo HTML
        const div = document.createElement('div');
        div.className = 'node-question-content';

        // Título
        if (data.title) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'question-title';
            titleDiv.textContent = data.title;
            div.appendChild(titleDiv);
        }

        // Container de imagem ou descrição
        const imageContainer = document.createElement('div');
        imageContainer.className = 'question-image-container';

        if (data.imageUrl) {
            const img = document.createElement('img');
            img.src = data.imageUrl;
            img.alt = data.title || 'Questão';
            imageContainer.appendChild(img);
        } else {
            // Mostrar descrição se não houver imagem
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'color: #666; font-size: 16px; text-align: center; padding: 20px; line-height: 1.6;';
            placeholder.textContent = data.description || 'Aguardando imagem da questão';
            imageContainer.appendChild(placeholder);
        }

        div.appendChild(imageContainer);
        foreignObject.appendChild(div);
        group.appendChild(foreignObject);

        return {
            element: group,
            x: x,
            y: y,
            data: data,
            type: 'question',
            dimensions: dimensions
        };
    }

    /**
     * Cria linha de conexão entre nós
     */
    createConnection(x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('class', 'connection-line');
        line.setAttribute('stroke', '#cccccc');
        line.setAttribute('stroke-width', 4); // Mais grosso para espaço virtual
        line.setAttribute('stroke-dasharray', '10,10');

        this.mainGroup.insertBefore(line, this.mainGroup.firstChild);
    }

    /**
     * Renderiza todos os nós
     */
    render() {
        this.nodes.forEach(node => {
            this.mainGroup.appendChild(node.element);

            // Adicionar event listener para abrir modal ao clicar no nó
            node.element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(node);
            });
        });
    }

    /**
     * Abre o modal com o conteúdo do nó
     */
    openModal(node) {
        const modal = document.getElementById('nodeModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalText = document.getElementById('modalText');

        // Definir título baseado no tipo de nó
        if (node.type === 'central') {
            modalTitle.textContent = `${node.data.code} - ${node.data.title}`;
        } else {
            modalTitle.textContent = node.data.title;
        }

        // Definir conteúdo do modal
        modalText.textContent = node.data.modalContent || 'Conteúdo não disponível.';

        // Mostrar modal
        modal.classList.add('active');
    }

    /**
     * Calcula zoom contextual - suporta zoom responsivo por nó
     * Zoom mais afastado para manter o senso de "mapa conectado"
     */
    calculateSafeZoom(node) {
        // PRIORIDADE 1: Zoom responsivo específico do nó
        if (node.data) {
            const responsiveZoom = this.getResponsiveConfig(node.data, 'zoom');
            if (responsiveZoom !== undefined) {
                return responsiveZoom;
            }
        }

        // PRIORIDADE 2: Mapa de zoom fixo por tipo (fallback)
        const nodeType = node.type;
        const zoomMap = {
            'central': 1.5,     // Nó central - zoom equilibrado
            'table': 1.5,       // Tabelas - vê parte das conexões
            'list': 1.5,        // Listas - vê parte das conexões
            'question': 1.5,    // Questões - ligeiramente mais próximo
            'default': 0.9      // Padrão - mostra contexto
        };

        return zoomMap[nodeType] || zoomMap['default'];
    }

    /**
     * Navega para um nó específico por índice
     * Implementa zoom isolado - mostra APENAS o nó ativo
     */
    navigateToIndex(index, skipAnimation = false) {
        if (index < 0 || index >= this.nodes.length) return;

        // Remover classe 'active' de todos os nós
        this.nodes.forEach(n => {
            n.element.classList.remove('active');
        });

        this.currentIndex = index;
        const node = this.nodes[index];

        // Adicionar classe 'active' ao nó atual
        node.element.classList.add('active');

        // Calcular viewBox que mostra APENAS este nó com margem
        const { width, height } = node.dimensions;

        // Calcular zoom seguro (Nível 1 - evita corte)
        const safeZoomMargin = this.calculateSafeZoom(node);

        // Adicionar margem ao redor do nó
        const viewBoxWidth = width * safeZoomMargin;
        const viewBoxHeight = height * safeZoomMargin;

        // Calcular aspect ratio da tela
        const screenAspect = window.innerWidth / window.innerHeight;
        const nodeAspect = viewBoxWidth / viewBoxHeight;

        let finalWidth, finalHeight;

        // Ajustar para manter aspect ratio da tela
        if (screenAspect > nodeAspect) {
            // Tela mais larga - ajustar pela altura
            finalHeight = viewBoxHeight;
            finalWidth = finalHeight * screenAspect;
        } else {
            // Tela mais alta - ajustar pela largura
            finalWidth = viewBoxWidth;
            finalHeight = finalWidth / screenAspect;
        }

        // Centralizar o nó no viewBox
        const targetX = node.x - finalWidth / 2;
        const targetY = node.y - finalHeight / 2;

        // Animar ou aplicar imediatamente
        if (skipAnimation) {
            this.setViewBoxImmediate(targetX, targetY, finalWidth, finalHeight);
        } else {
            this.animateToNode(targetX, targetY, finalWidth, finalHeight);
        }

        // Disparar evento de mudança
        this.onNavigationChange && this.onNavigationChange(index, this.nodes.length);
    }

    /**
     * Define viewBox imediatamente sem animação
     */
    setViewBoxImmediate(x, y, width, height) {
        this.viewBox.x = x;
        this.viewBox.y = y;
        this.viewBox.width = width;
        this.viewBox.height = height;

        this.updateViewBox();
    }

    /**
     * Anima a transição para um nó
     */
    animateToNode(targetX, targetY, targetWidth, targetHeight) {
        const startX = this.viewBox.x;
        const startY = this.viewBox.y;
        const startWidth = this.viewBox.width;
        const startHeight = this.viewBox.height;

        const duration = this.config.transitionDuration;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing suave (easeInOutCubic)
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            this.viewBox.x = startX + (targetX - startX) * eased;
            this.viewBox.y = startY + (targetY - startY) * eased;
            this.viewBox.width = startWidth + (targetWidth - startWidth) * eased;
            this.viewBox.height = startHeight + (targetHeight - startHeight) * eased;

            this.updateViewBox();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Navega para o próximo nó
     */
    next() {
        if (this.currentIndex < this.nodes.length - 1) {
            this.navigateToIndex(this.currentIndex + 1);
            return true;
        }
        return false;
    }

    /**
     * Navega para o nó anterior
     */
    previous() {
        if (this.currentIndex > 0) {
            this.navigateToIndex(this.currentIndex - 1);
            return true;
        }
        return false;
    }

    /**
     * Reseta para o início
     */
    reset() {
        this.navigateToIndex(0);
    }

    /**
     * Zoom out para ver todos os nós (visão geral)
     */
    showOverview() {
        this.setViewBoxImmediate(0, 0, this.virtualSpace.width, this.virtualSpace.height);
    }
}
