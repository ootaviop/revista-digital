# 📐 Sistema de Build de Layout

## 📚 Visão Geral

Este projeto agora usa um **sistema de build automatizado** que simplifica drasticamente o processo de definição de posições dos nós.

**Antes**: Você precisava definir manualmente posições e dimensões para 3 breakpoints (tablet, desktop, largeDesktop) = **trabalho triplicado**.

**Agora**: Você define posições **uma única vez** e o script gera automaticamente todas as variações responsivas com escalonamento proporcional.

---

## 📁 Estrutura de Arquivos

```
revista-digital/
├── data-source.json         ← 📝 VOCÊ EDITA ESTE ARQUIVO
├── data.json                ← ⚙️  GERADO AUTOMATICAMENTE (não editar)
├── build-layout.js          ← 🔧 Script de build
├── data.json.backup         ← 💾 Backup automático
└── package.json             ← 📦 Scripts npm
```

---

## 🚀 Como Usar

### 1️⃣ Editar Posições

Edite apenas o arquivo `data-source.json`:

```json
{
  "centralNode": { /* ... */ },
  "nodes": [
    {
      "id": "node1",
      "type": "table",
      "title": "Título do Nó",
      "position": {
        "x": -1600,    ← Define X uma vez
        "y": -200      ← Define Y uma vez
      },
      "dimensions": {
        "width": 900,  ← Define largura uma vez
        "height": 500  ← Define altura uma vez
      },
      "zoom": 1.6,     ← Define zoom uma vez
      "modalContent": "...",
      "tableData": { /* ... */ }
    }
  ]
}
```

### 2️⃣ Gerar Layout Responsivo

Execute o build:

```bash
npm run build
```

O script irá:
- ✅ Fazer backup do `data.json` atual
- ✅ Ler `data-source.json`
- ✅ Validar colisões entre nós
- ✅ Validar se nós estão dentro do espaço virtual
- ✅ Gerar configurações responsivas automaticamente
- ✅ Escrever `data.json` completo

### 3️⃣ Testar

Abra `index.html` no navegador. O engine usa `data.json` normalmente.

---

## ⚙️ Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Gera `data.json` a partir de `data-source.json` |
| `npm run build:watch` | Rebuilda automaticamente ao editar `data-source.json` |
| `npm run serve` | Inicia servidor local na porta 8000 |
| `npm run dev` | Build + servidor em uma única etapa |
| `npm run help` | Mostra lista de comandos |

---

## 📊 Escalonamento Responsivo

### Escalas Padrão

As posições e dimensões são escalonadas proporcionalmente:

| Breakpoint | Escala | Exemplo: 900px | Exemplo: -1600 offset |
|------------|--------|----------------|----------------------|
| **tablet** | 70% | 630px | -1120 offset |
| **desktop** | 85% | 765px | -1360 offset |
| **largeDesktop** | 100% | 900px | -1600 offset |

### Ajustar Escalas

Edite `build-layout.js` linha 14-18:

```javascript
breakpointScales: {
  tablet: 0.70,        // Altere para 0.65, 0.75, etc
  desktop: 0.85,       // Altere para 0.80, 0.90, etc
  largeDesktop: 1.0    // Sempre 1.0 (valores originais)
}
```

### Como Funciona o Escalonamento

**Dimensões**: Escalam linearmente
```
tablet: 900 × 0.70 = 630
desktop: 900 × 0.85 = 765
```

**Posições**: Escalam proporcionalmente (mantém layout visual)
```
tablet: -1600 × 0.70 = -1120
desktop: -1600 × 0.85 = -1360
```

**Zoom**: Escala suavemente (fórmula: 0.4 + 0.6 × escala)
```
tablet: 1.6 × (0.4 + 0.6×0.7) = 1.31
desktop: 1.6 × (0.4 + 0.6×0.85) = 1.46
```

---

## 🔍 Sistema de Validação

### Validações Automáticas

O build detecta automaticamente:

#### ⚠️ Avisos (Warnings)
- Nós com distância menor que o ideal (mas não crítico)
- `navigationPath` vazio ou sem "central"

#### ❌ Erros (Errors)
- Nós com colisão grave (distância < mínimo - 500)
- Nós fora do espaço virtual (12000×12000)
- IDs duplicados
- `navigationPath` referenciando IDs inexistentes

### Exemplo de Saída

```
🔍 Fase 3: Validação de entrada
   ⚠️  7 avisos:
      [tablet] Nós "node4" e "node5" muito próximos:
               distância 714, mínimo 1230 (faltam 516 unidades)
      ...

   ❌ 1 erros:
      [largeDesktop] Nó "node3" sai do espaço virtual
```

### Configurar Validação

Edite `build-layout.js` linha 29-33:

```javascript
validateCollisions: true,   // Validar colisões
validateBounds: true,        // Validar limites
strictMode: false            // Se true, para o build em caso de erro
```

---

## 🎯 Sistema de Coordenadas

### Espaço Virtual SVG

- **Tamanho**: 12000 × 12000 unidades
- **Centro**: (6000, 6000)
- **Origem**: Canto superior esquerdo

### Posicionamento

As posições em `data-source.json` são **relativas ao centro**:

```
Posição absoluta = Centro + Offset
x_absoluto = 6000 + offsetX
y_absoluto = 6000 + offsetY
```

**Exemplos**:
```
{ x: 0, y: 0 }       → Centro (6000, 6000)
{ x: -1600, y: -200 } → Esquerda-superior (4400, 5800)
{ x: 1500, y: 1500 }  → Direita-inferior (7500, 7500)
```

### Margem Entre Nós

A margem mínima padrão é **600 unidades** (configurável em `build-layout.js` linha 28).

**Distância mínima** = (tamanho_nó1 + tamanho_nó2) / 2 + margem

---

## 🛠️ Workflow Recomendado

### Desenvolvimento Normal

```bash
# 1. Editar data-source.json
vim data-source.json

# 2. Gerar data.json
npm run build

# 3. Testar no navegador
open index.html
```

### Desenvolvimento com Auto-Reload

```bash
# Terminal 1: Watch para rebuild automático
npm run build:watch

# Terminal 2: Servidor local
npm run serve

# Acesse: http://localhost:8000
# Edite data-source.json → rebuild automático
```

### Desenvolvimento Rápido

```bash
# Build + servidor em um comando
npm run dev
```

---

## 📝 Formato do data-source.json

### Estrutura Completa

```json
{
  "centralNode": {
    "code": "D06",
    "title": "Título da habilidade",
    "modalContent": "Descrição completa..."
  },
  "nodes": [
    {
      "id": "node1",              // ID único (obrigatório)
      "type": "table",            // table | list | question
      "title": "Título do Nó",    // Título exibido

      // ⭐ POSIÇÃO (obrigatório)
      "position": {
        "x": -1600,               // Offset X relativo ao centro
        "y": -200                 // Offset Y relativo ao centro
      },

      // ⭐ DIMENSÕES (obrigatório)
      "dimensions": {
        "width": 900,             // Largura em pixels CSS
        "height": 500             // Altura em pixels CSS
      },

      // ⭐ ZOOM (opcional, padrão varia por tipo)
      "zoom": 1.6,

      // 📄 CONTEÚDO (varia por tipo)
      "modalContent": "Texto do modal...",

      // Para type: "table"
      "tableData": {
        "headers": ["Col1", "Col2"],
        "rows": [
          ["Valor1", "Valor2"]
        ]
      },
      "showLegend": true,         // Opcional

      // Para type: "list"
      "listItems": [
        {
          "level": "Fácil",
          "description": "Descrição..."
        }
      ],

      // Para type: "question"
      "imageUrl": "path/to/image.png",
      "description": "Descrição alternativa"
    }
  ],
  "navigationPath": [
    "central",
    "node1",
    "node2"
  ]
}
```

### Tipos de Nós

| Tipo | Descrição | Campos Obrigatórios |
|------|-----------|---------------------|
| `table` | Tabela de dados | `tableData` |
| `list` | Lista de itens | `listItems` |
| `question` | Questão com imagem | `imageUrl` ou `description` |

---

## 🐛 Resolução de Problemas

### Erro: "Arquivo data-source.json não encontrado"

**Causa**: O arquivo `data-source.json` não existe.

**Solução**: Certifique-se de que o arquivo está na raiz do projeto.

### Avisos de Colisão

**Causa**: Nós estão muito próximos uns dos outros.

**Soluções**:
1. **Afastar nós**: Aumentar distância em `position.x` e `position.y`
2. **Reduzir dimensões**: Diminuir `dimensions.width` ou `dimensions.height`
3. **Ajustar margem**: Reduzir `nodeMargin` em `build-layout.js` (não recomendado)

### Erro: "Nó sai do espaço virtual"

**Causa**: A posição + dimensões ultrapassam os limites (12000×12000).

**Solução**: Reduzir offsets ou dimensões do nó.

### Build Não Atualiza o Navegador

**Causa**: Cache do navegador.

**Solução**: Recarregar com Ctrl+Shift+R (ou Cmd+Shift+R no Mac)

---

## 💡 Dicas e Boas Práticas

### 1. Defina Posições em Largedesktop

Trabalhe sempre pensando em `largeDesktop` (100%) como referência. O script cuida do resto.

### 2. Use IDs Descritivos

```json
// ❌ Ruim
"id": "node1"

// ✅ Bom
"id": "habilidades-tabela"
```

### 3. Mantenha data-source.json Limpo

Não inclua campos `responsive` manualmente. Eles serão ignorados/sobrescritos.

### 4. Teste em Múltiplos Breakpoints

Após o build, teste em:
- 768px (tablet)
- 1024px (desktop)
- 1920px (largeDesktop)

### 5. Commit Apenas data-source.json

Configure `.gitignore`:

```gitignore
# data.json é gerado automaticamente
data.json

# Opcional: ignorar backups
*.backup
```

Mas **mantenha data.json no repositório** se quiser deploy direto sem build.

### 6. Ajuste Zoom Individualmente

Se um nó específico precisa de zoom diferente, defina em `data-source.json`:

```json
{
  "id": "node-especial",
  "zoom": 2.0,  // Mais zoom que o padrão
  ...
}
```

---

## 🔄 Migração de Projetos Antigos

Se você tem um projeto com `data.json` antigo (com configurações responsivas manuais):

### Opção 1: Usar Valores de largeDesktop

Extraia apenas as configurações de `largeDesktop`:

```json
// Antigo (data.json)
{
  "position": { "offsetX": -1600, "offsetY": -200 },
  "responsive": {
    "largeDesktop": {
      "customDimensions": { "width": 900, "height": 500 },
      "zoom": 1.6
    }
  }
}

// Novo (data-source.json)
{
  "position": { "x": -1600, "y": -200 },
  "dimensions": { "width": 900, "height": 500 },
  "zoom": 1.6
}
```

### Opção 2: Script de Conversão

Crie um script para extrair automaticamente (exemplo não incluído).

---

## 🎓 Exemplos Práticos

### Exemplo 1: Adicionar Novo Nó

```json
{
  "id": "novo-node",
  "type": "table",
  "title": "Nova Tabela",
  "position": { "x": 2000, "y": -1000 },
  "dimensions": { "width": 800, "height": 400 },
  "zoom": 1.4,
  "modalContent": "Conteúdo do modal...",
  "tableData": {
    "headers": ["A", "B"],
    "rows": [["1", "2"]]
  }
}
```

Depois:
```bash
npm run build
```

### Exemplo 2: Ajustar Posição de Nó Existente

```json
// data-source.json - ANTES
"position": { "x": 1500, "y": 1500 }

// data-source.json - DEPOIS
"position": { "x": 1700, "y": 1300 }  // Movido para direita-cima
```

Depois:
```bash
npm run build
```

### Exemplo 3: Redimensionar Nó

```json
// data-source.json - ANTES
"dimensions": { "width": 900, "height": 400 }

// data-source.json - DEPOIS
"dimensions": { "width": 1000, "height": 500 }  // Maior
```

Depois:
```bash
npm run build
```

---

## 📞 Suporte

### Documentação Relacionada
- `README.md` - Guia do usuário
- `CHANGELOG.md` - Histórico de versões
- `navigation-engine.js` - Engine de navegação

### Issues Conhecidos
- Nenhum até o momento

### Contribuindo
Pull requests são bem-vindos! Por favor:
1. Teste localmente com `npm run build`
2. Valide com diferentes escalas
3. Documente mudanças

---

**Versão**: 2.0
**Última Atualização**: 2025-10-30
**Autor**: Sistema de Build Automatizado
