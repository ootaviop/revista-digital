#!/usr/bin/env node

/**
 * Build Layout Script
 * Converte data-source.json (formato simplificado) em data.json (formato completo com responsive)
 *
 * Uso: node build-layout.js
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURAÇÕES (editáveis)
// ==========================================

const CONFIG = {
  // Escalas para cada breakpoint (1.0 = 100% do original)
  breakpointScales: {
    tablet: 0.70,        // 70% do tamanho largeDesktop
    desktop: 0.85,       // 85% do tamanho largeDesktop
    largeDesktop: 1.0    // 100% (valores originais)
  },

  // Espaço virtual SVG
  virtualSpace: {
    width: 12000,
    height: 12000,
    centerX: 6000,
    centerY: 6000
  },

  // Margem mínima entre nós (unidades virtuais)
  nodeMargin: 600,

  // Arquivos
  sourceFile: 'data-source.json',
  outputFile: 'data.json',
  backupFile: 'data.json.backup',

  // Validações
  validateCollisions: true,
  validateBounds: true,
  strictMode: false  // Se true, para o build em caso de erro
};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Lê arquivo JSON
 */
function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Erro ao ler ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Escreve arquivo JSON com formatação
 */
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Arquivo gerado: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erro ao escrever ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Faz backup do arquivo se existir
 */
function backupFile(filePath, backupPath) {
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`💾 Backup criado: ${backupPath}`);
  }
}

/**
 * Escala dimensões proporcionalmente
 */
function scaleDimensions(dimensions, scale) {
  if (!dimensions) return null;

  return {
    width: Math.round(dimensions.width * scale),
    height: Math.round(dimensions.height * scale),
    ...(dimensions.maxWidth && { maxWidth: Math.round(dimensions.maxWidth * scale) })
  };
}

/**
 * Escala posição proporcionalmente
 */
function scalePosition(position, scale) {
  if (!position) return null;

  return {
    offsetX: Math.round(position.x * scale),
    offsetY: Math.round(position.y * scale)
  };
}

/**
 * Escala zoom proporcionalmente (ajuste mais suave)
 */
function scaleZoom(zoom, scale) {
  if (!zoom) return undefined;

  // Zoom escala menos agressivamente que dimensões (raiz quadrada)
  const zoomFactor = 0.4 + (0.6 * scale); // Entre 0.4 e 1.0
  return Math.round((zoom * zoomFactor) * 100) / 100; // 2 casas decimais
}

/**
 * Calcula distância entre dois pontos
 */
function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Obtém dimensões de um nó para um breakpoint específico
 */
function getNodeDimensions(node, breakpoint, scale) {
  const dimensions = node.dimensions || { width: 500, height: 400 };
  return scaleDimensions(dimensions, scale);
}

/**
 * Obtém posição absoluta de um nó (relativa ao centro)
 */
function getAbsolutePosition(position, scale) {
  const scaled = scalePosition(position, scale);
  return {
    x: CONFIG.virtualSpace.centerX + scaled.offsetX,
    y: CONFIG.virtualSpace.centerY + scaled.offsetY
  };
}

// ==========================================
// VALIDAÇÕES
// ==========================================

/**
 * Valida colisões entre nós para um breakpoint específico
 */
function validateCollisions(nodes, breakpoint, scale) {
  const errors = [];
  const warnings = [];

  for (let i = 0; i < nodes.length; i++) {
    const node1 = nodes[i];
    const pos1 = getAbsolutePosition(node1.position, scale);
    const dim1 = getNodeDimensions(node1, breakpoint, scale);

    for (let j = i + 1; j < nodes.length; j++) {
      const node2 = nodes[j];
      const pos2 = getAbsolutePosition(node2.position, scale);
      const dim2 = getNodeDimensions(node2, breakpoint, scale);

      const dist = distance(pos1, pos2);

      // Calcular distância mínima necessária (considerando dimensões maiores de cada nó)
      const size1 = Math.max(dim1.width, dim1.height);
      const size2 = Math.max(dim2.width, dim2.height);
      const minDistance = (size1 / 2 + size2 / 2) + CONFIG.nodeMargin;

      if (dist < minDistance) {
        const overlap = Math.round(minDistance - dist);
        const severity = overlap > 500 ? 'error' : 'warning';

        const message = `[${breakpoint}] Nós "${node1.id}" e "${node2.id}" muito próximos: ` +
                       `distância ${Math.round(dist)}, mínimo ${Math.round(minDistance)} ` +
                       `(faltam ${overlap} unidades)`;

        if (severity === 'error') {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }
  }

  return { errors, warnings };
}

/**
 * Valida se nós estão dentro do espaço virtual
 */
function validateBounds(nodes, breakpoint, scale) {
  const errors = [];
  const warnings = [];

  nodes.forEach(node => {
    const pos = getAbsolutePosition(node.position, scale);
    const dim = getNodeDimensions(node, breakpoint, scale);

    const left = pos.x - dim.width / 2;
    const right = pos.x + dim.width / 2;
    const top = pos.y - dim.height / 2;
    const bottom = pos.y + dim.height / 2;

    if (left < 0 || right > CONFIG.virtualSpace.width ||
        top < 0 || bottom > CONFIG.virtualSpace.height) {
      errors.push(
        `[${breakpoint}] Nó "${node.id}" sai do espaço virtual: ` +
        `bounds [${Math.round(left)}, ${Math.round(top)}, ${Math.round(right)}, ${Math.round(bottom)}]`
      );
    }
  });

  return { errors, warnings };
}

/**
 * Valida IDs únicos
 */
function validateUniqueIds(nodes) {
  const ids = nodes.map(n => n.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  if (duplicates.length > 0) {
    return {
      errors: [`IDs duplicados encontrados: ${duplicates.join(', ')}`],
      warnings: []
    };
  }

  return { errors: [], warnings: [] };
}

/**
 * Valida navigationPath
 */
function validateNavigationPath(navigationPath, nodes) {
  const errors = [];
  const warnings = [];

  if (!navigationPath || navigationPath.length === 0) {
    warnings.push('navigationPath está vazio ou ausente');
    return { errors, warnings };
  }

  const nodeIds = nodes.map(n => n.id);
  const centralExists = navigationPath.includes('central');

  if (!centralExists) {
    warnings.push('navigationPath não inclui "central"');
  }

  navigationPath.forEach(id => {
    if (id !== 'central' && !nodeIds.includes(id)) {
      errors.push(`navigationPath referencia ID inexistente: "${id}"`);
    }
  });

  return { errors, warnings };
}

// ==========================================
// CONVERSÃO
// ==========================================

/**
 * Converte um nó do formato source para o formato completo
 */
function convertNode(sourceNode) {
  const { position, dimensions, zoom, ...rest } = sourceNode;

  // Posição base (para largeDesktop)
  const basePosition = {
    offsetX: position.x,
    offsetY: position.y
  };

  // Gerar configurações responsivas
  const responsive = {};

  Object.entries(CONFIG.breakpointScales).forEach(([breakpoint, scale]) => {
    responsive[breakpoint] = {
      customDimensions: scaleDimensions(dimensions, scale),
      position: scalePosition(position, scale),
      zoom: scaleZoom(zoom, scale)
    };
  });

  return {
    ...rest,
    position: basePosition,
    responsive
  };
}

/**
 * Converte data-source.json completo
 */
function convertLayout(sourceData) {
  return {
    centralNode: sourceData.centralNode,
    nodes: sourceData.nodes.map(convertNode),
    navigationPath: sourceData.navigationPath || ['central', ...sourceData.nodes.map(n => n.id)]
  };
}

// ==========================================
// BUILD PRINCIPAL
// ==========================================

function build() {
  console.log('🚀 Iniciando build do layout...\n');

  // 1. Backup do data.json atual
  console.log('📦 Fase 1: Backup');
  backupFile(CONFIG.outputFile, CONFIG.backupFile);
  console.log();

  // 2. Ler data-source.json
  console.log('📖 Fase 2: Leitura');
  const sourceData = readJSON(CONFIG.sourceFile);
  console.log(`   Nó central: ${sourceData.centralNode.code}`);
  console.log(`   Nós periféricos: ${sourceData.nodes.length}`);
  console.log();

  // 3. Validar dados de entrada
  console.log('🔍 Fase 3: Validação de entrada');

  let allErrors = [];
  let allWarnings = [];

  // Validar IDs únicos
  const idValidation = validateUniqueIds(sourceData.nodes);
  allErrors.push(...idValidation.errors);
  allWarnings.push(...idValidation.warnings);

  // Validar navigationPath
  const navValidation = validateNavigationPath(sourceData.navigationPath, sourceData.nodes);
  allErrors.push(...navValidation.errors);
  allWarnings.push(...navValidation.warnings);

  // Validar colisões e bounds para cada breakpoint
  if (CONFIG.validateCollisions || CONFIG.validateBounds) {
    Object.entries(CONFIG.breakpointScales).forEach(([breakpoint, scale]) => {
      if (CONFIG.validateCollisions) {
        const collisionValidation = validateCollisions(sourceData.nodes, breakpoint, scale);
        allErrors.push(...collisionValidation.errors);
        allWarnings.push(...collisionValidation.warnings);
      }

      if (CONFIG.validateBounds) {
        const boundsValidation = validateBounds(sourceData.nodes, breakpoint, scale);
        allErrors.push(...boundsValidation.errors);
        allWarnings.push(...boundsValidation.warnings);
      }
    });
  }

  // Exibir resultados da validação
  if (allWarnings.length > 0) {
    console.log(`   ⚠️  ${allWarnings.length} avisos:`);
    allWarnings.forEach(w => console.log(`      ${w}`));
  }

  if (allErrors.length > 0) {
    console.log(`   ❌ ${allErrors.length} erros:`);
    allErrors.forEach(e => console.log(`      ${e}`));

    if (CONFIG.strictMode) {
      console.log('\n❌ Build cancelado devido a erros (strictMode ativo)');
      process.exit(1);
    } else {
      console.log('\n   ⚠️  Continuando apesar dos erros...');
    }
  } else {
    console.log('   ✅ Validação OK');
  }
  console.log();

  // 4. Converter layout
  console.log('🔄 Fase 4: Conversão');
  const outputData = convertLayout(sourceData);
  console.log('   ✅ Layout convertido');
  console.log();

  // 5. Escrever data.json
  console.log('💾 Fase 5: Escrita');
  writeJSON(CONFIG.outputFile, outputData);
  console.log();

  // 6. Resumo
  console.log('📊 Resumo do Build:');
  console.log(`   Breakpoints: ${Object.keys(CONFIG.breakpointScales).join(', ')}`);
  console.log(`   Escalas: ${Object.values(CONFIG.breakpointScales).join(', ')}`);
  console.log(`   Nós convertidos: ${outputData.nodes.length}`);
  console.log(`   Avisos: ${allWarnings.length}`);
  console.log(`   Erros: ${allErrors.length}`);
  console.log();

  console.log('✨ Build concluído com sucesso!\n');
}

// ==========================================
// EXECUÇÃO
// ==========================================

// Verificar se arquivo source existe
if (!fs.existsSync(CONFIG.sourceFile)) {
  console.error(`❌ Arquivo ${CONFIG.sourceFile} não encontrado!`);
  console.error(`   Crie o arquivo com formato simplificado antes de rodar o build.`);
  process.exit(1);
}

// Executar build
try {
  build();
} catch (error) {
  console.error('\n❌ Erro fatal durante o build:', error.message);
  console.error(error.stack);
  process.exit(1);
}
