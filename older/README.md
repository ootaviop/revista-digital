# Sistema de Navegação Visual - Revista CAEd

Sistema de navegação visual estilo Prezi para visualização de dados educacionais, com navegação guiada entre nós de conteúdo.

## Características

- **Navegação Guiada**: Sistema de navegação com zoom e transições suaves entre nós
- **Tipos de Nós**:
  - **Nó Central**: Ponto de partida com código e descrição da habilidade
  - **Nós de Tabela**: Exibem dados tabulares com cabeçalhos e linhas
  - **Nós de Questão**: Mostram imagens de questões
- **Controles**: Botões para avançar/retroceder e suporte a navegação por teclado
- **JavaScript Vanilla**: Sem frameworks, apenas JavaScript puro
- **SVG**: Renderização vetorial escalável

## Estrutura de Arquivos

```
Revista/
├── index.html              # Estrutura HTML principal
├── styles.css              # Estilos visuais
├── navigation-engine.js    # Engine de navegação e renderização
├── app.js                  # Aplicação principal e controles
├── data.json              # Dados de exemplo (estrutura configurável)
└── README.md              # Esta documentação
```

## Como Usar

1. **Abrir o arquivo**: Simplesmente abra `index.html` em um navegador moderno

2. **Navegação**:
   - **Botões**: Use os botões "← Anterior" e "Próximo →"
   - **Teclado**:
     - `→` ou `Espaço`: Próximo nó
     - `←`: Nó anterior
     - `Home`: Voltar ao início

## Estrutura do JSON

O arquivo `data.json` define toda a visualização:

```json
{
  "centralNode": {
    "code": "D13",
    "title": "Título do nó central"
  },
  "nodes": [
    {
      "id": "node1",
      "type": "table",
      "title": "Título da Tabela",
      "tableData": {
        "headers": ["Coluna 1", "Coluna 2"],
        "rows": [
          ["Dado 1", "Dado 2"],
          ["Dado 3", "Dado 4"]
        ]
      }
    },
    {
      "id": "node2",
      "type": "question",
      "title": "Título da Questão",
      "description": "Descrição opcional",
      "imageUrl": "caminho/para/imagem.png"
    }
  ]
}
```

### Tipos de Nós

#### 1. Nó Central (obrigatório)
```json
"centralNode": {
  "code": "Código",
  "title": "Descrição da habilidade"
}
```

#### 2. Nó de Tabela
```json
{
  "type": "table",
  "title": "Título",
  "tableData": {
    "headers": ["Col1", "Col2", "Col3"],
    "rows": [
      ["A1", "B1", "C1"],
      ["A2", "B2", "C2"]
    ]
  }
}
```

#### 3. Nó de Questão
```json
{
  "type": "question",
  "title": "Título",
  "description": "Descrição",
  "imageUrl": "imagem.png"
}
```

## Personalização

### Configurações da Engine

No arquivo `app.js`, você pode personalizar a engine:

```javascript
const engine = new NavigationEngine(svg, {
    transitionDuration: 800,      // Duração das transições (ms)
    nodeSpacing: 400,             // Espaçamento entre nós
    centralNodeSize: { width: 350, height: 250 },
    tableNodeSize: { width: 600, height: 400 },
    questionNodeSize: { width: 500, height: 600 }
});
```

### Cores e Estilos

Edite `styles.css` para personalizar:

- **Gradiente de fundo**: linha 8
- **Cores dos botões**: linha 75
- **Cores dos nós**: `navigation-engine.js`, linha 93 (fill)

## Funcionalidades Adicionais Possíveis

Para expandir o sistema, você pode adicionar:

1. **Mini-mapa interativo**: Já há estrutura HTML, basta implementar
2. **Busca de nós**: Adicionar campo de busca
3. **Exportação**: Salvar visualização como imagem
4. **Temas**: Sistema de temas claro/escuro
5. **Anotações**: Permitir anotações nos nós
6. **Zoom manual**: Controles de zoom in/out

## Compatibilidade

- Chrome/Edge: ✓
- Firefox: ✓
- Safari: ✓
- IE: ✗ (não suportado)

## Servidor Local (Opcional)

Para evitar problemas com CORS ao carregar imagens, use um servidor local:

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve

# Ou qualquer outro servidor HTTP
```

Acesse: `http://localhost:8000`

## Estrutura Técnica

### NavigationEngine (navigation-engine.js)

Classe principal que gerencia:
- Renderização de nós SVG
- Animações de transição
- Cálculo de posicionamento
- ViewBox e zoom

### Principais Métodos

- `loadData(data)`: Carrega dados do JSON
- `navigateToIndex(index)`: Navega para um nó específico
- `next()`: Próximo nó
- `previous()`: Nó anterior
- `reset()`: Volta ao início

## Dicas de Uso

1. **Imagens de Questões**: Coloque as imagens na mesma pasta ou use URLs absolutas
2. **Tabelas Grandes**: Ajuste `tableNodeSize` para tabelas com muitos dados
3. **Performance**: Limite a ~20 nós para melhor performance
4. **Textos Longos**: O sistema quebra texto automaticamente, mas evite títulos muito longos

## Solução de Problemas

### Imagens não aparecem
- Verifique o caminho em `imageUrl`
- Use servidor local para evitar problemas de CORS
- Confirme que as imagens existem

### JSON não carrega
- Valide o JSON em jsonlint.com
- Verifique console do navegador (F12)
- Confirme que `data.json` está na mesma pasta

### Navegação não funciona
- Abra console (F12) e verifique erros
- Confirme que todos os arquivos JS foram carregados
- Teste com os dados de exemplo (fallback no `app.js`)

## Contribuindo

Para adicionar novos tipos de nós:

1. Adicione método `create[Tipo]Node()` em `navigation-engine.js`
2. Atualize a estrutura do JSON
3. Adicione estilos CSS correspondentes

## Licença

Código aberto para uso educacional.
